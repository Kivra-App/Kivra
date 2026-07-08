use crate::constants::{RUN_COMPLETED_EVENT, RUN_FAILED_EVENT, RUN_OUTPUT_EVENT};
use crate::error::KivraError;
use crate::models::{DetectedError, RunCompletedEvent, RunFailedEvent, RunOutputEvent, RunResult};
use std::{
    io::Read,
    process::{Command, Stdio},
    time::Instant,
};
use tauri::{AppHandle, Emitter};

#[tauri::command]
pub(crate) fn start_run_project_command(
    app: AppHandle,
    created_at: String,
    project_path: String,
    command: String,
    run_id: String,
) -> Result<(), KivraError> {
    std::thread::spawn(move || {
        let run_result = execute_project_command(
            app.clone(),
            project_path,
            command,
            run_id.clone(),
            created_at,
        );

        match run_result {
            Ok(result) => {
                let _ = app.emit(RUN_COMPLETED_EVENT, RunCompletedEvent { run_id, result });
            }
            Err(error) => {
                let _ = app.emit(
                    RUN_FAILED_EVENT,
                    RunFailedEvent {
                        run_id,
                        message: error.to_string(),
                    },
                );
            }
        }
    });

    Ok(())
}

fn execute_project_command(
    app: AppHandle,
    project_path: String,
    command: String,
    run_id: String,
    created_at: String,
) -> Result<RunResult, KivraError> {
    let started_at = Instant::now();
    let mut child = if cfg!(target_os = "windows") {
        Command::new("cmd")
            .args(["/C", &command])
            .current_dir(&project_path)
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .spawn()
    } else {
        Command::new("sh")
            .args(["-lc", &command])
            .current_dir(&project_path)
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .spawn()
    }
    .map_err(|error| KivraError::Command(error.to_string()))?;
    let stdout = child
        .stdout
        .take()
        .ok_or_else(|| KivraError::Command("Missing stdout pipe".to_string()))?;
    let stderr = child
        .stderr
        .take()
        .ok_or_else(|| KivraError::Command("Missing stderr pipe".to_string()))?;
    let stdout_handle = spawn_output_reader(app.clone(), run_id.clone(), "stdout", stdout);
    let stderr_handle = spawn_output_reader(app, run_id, "stderr", stderr);
    let output = child
        .wait()
        .map_err(|error| KivraError::Command(error.to_string()))?;
    let duration = started_at.elapsed().as_millis();
    let stdout = stdout_handle
        .join()
        .map_err(|_| KivraError::Command("stdout reader thread panicked".to_string()))??;
    let stderr = stderr_handle
        .join()
        .map_err(|_| KivraError::Command("stderr reader thread panicked".to_string()))??;
    let is_success = output.success();
    let combined_output = format!("{stdout}\n{stderr}");
    let errors = if is_success {
        Vec::new()
    } else {
        parse_errors(&combined_output)
    };

    Ok(RunResult {
        command,
        status: if is_success {
            "SUCCESS".to_string()
        } else {
            "FAILED".to_string()
        },
        duration,
        stdout,
        stderr,
        exit_code: output.code(),
        errors,
        created_at,
    })
}

fn spawn_output_reader(
    app: AppHandle,
    run_id: String,
    stream: &str,
    reader: impl Read + Send + 'static,
) -> std::thread::JoinHandle<Result<String, KivraError>> {
    let stream_name = stream.to_string();

    std::thread::spawn(move || read_output_stream(app, run_id, stream_name, reader))
}

fn read_output_stream(
    app: AppHandle,
    run_id: String,
    stream: String,
    mut reader: impl Read,
) -> Result<String, KivraError> {
    let mut buffer = [0_u8; 4096];
    let mut output = Vec::new();

    loop {
        let byte_count = reader
            .read(&mut buffer)
            .map_err(|error| KivraError::Command(error.to_string()))?;

        if byte_count == 0 {
            break;
        }

        let chunk = String::from_utf8_lossy(&buffer[..byte_count]).to_string();
        output.extend_from_slice(&buffer[..byte_count]);
        app.emit(
            RUN_OUTPUT_EVENT,
            RunOutputEvent {
                run_id: run_id.clone(),
                stream: stream.clone(),
                chunk,
            },
        )
        .map_err(|error| KivraError::Command(error.to_string()))?;
    }

    Ok(String::from_utf8_lossy(&output).to_string())
}

pub(crate) fn parse_errors(output: &str) -> Vec<DetectedError> {
    let mut errors = output
        .lines()
        .filter(|line| {
            let lower = line.to_lowercase();
            lower.contains("error")
                || lower.contains("failed")
                || lower.contains("cannot ")
                || lower.contains("module not found")
        })
        .map(|line| build_detected_error(line, output))
        .collect::<Vec<_>>();

    if errors.is_empty() && !output.trim().is_empty() {
        errors = output
            .lines()
            .find(|line| !line.trim().is_empty())
            .map(|line| vec![build_detected_error(line, output)])
            .unwrap_or_default();
    }

    errors
}

fn build_detected_error(message: &str, output: &str) -> DetectedError {
    let (file_path, line_number, column_number) = extract_source_location(message);

    DetectedError {
        error_code: "RUN_FAILED".to_string(),
        message: message.trim().to_string(),
        stack_trace: output.to_string(),
        file_path,
        line_number,
        column_number,
    }
}

fn extract_source_location(message: &str) -> (Option<String>, Option<u32>, Option<u32>) {
    let tokens = message.split_whitespace().collect::<Vec<_>>();

    for token in tokens {
        let normalized = token.trim_matches(|character: char| {
            character == '(' || character == ')' || character == ',' || character == ';'
        });
        let parts = normalized.split(':').collect::<Vec<_>>();

        if parts.len() >= 2 && looks_like_file_path(parts[0]) {
            let line_number = parts.get(1).and_then(|value| value.parse::<u32>().ok());
            let column_number = parts.get(2).and_then(|value| value.parse::<u32>().ok());

            return (Some(parts[0].to_string()), line_number, column_number);
        }
    }

    (None, None, None)
}

fn looks_like_file_path(value: &str) -> bool {
    value.contains('/')
        || value.ends_with(".ts")
        || value.ends_with(".tsx")
        || value.ends_with(".js")
        || value.ends_with(".jsx")
        || value.ends_with(".rs")
        || value.ends_with(".py")
        || value.ends_with(".go")
}
