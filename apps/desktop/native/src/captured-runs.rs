use crate::constants::{
    CAPTURED_RUNS_DIRECTORY, CAPTURE_END_FILE, CAPTURE_EVENTS_FILE, CAPTURE_START_FILE,
};
use crate::error::KivraError;
use crate::models::{CapturedRunEnd, CapturedRunEvent, CapturedRunResult, CapturedRunStart};
use crate::paths::{kivra_home_dir, trace_projects_file_path};
use crate::run_command::parse_errors;
use std::{
    fs,
    path::{Path, PathBuf},
};

#[tauri::command]
pub(crate) fn read_captured_runs(
    project_path: String,
) -> Result<Vec<CapturedRunResult>, KivraError> {
    let root_path = PathBuf::from(project_path)
        .canonicalize()
        .map_err(|error| KivraError::Filesystem(error.to_string()))?;
    let mut runs = Vec::new();

    runs.extend(read_central_captured_runs(&root_path)?);

    runs.sort_by(|first_run, second_run| second_run.created_at.cmp(&first_run.created_at));
    runs.dedup_by(|first_run, second_run| first_run.id == second_run.id);

    Ok(runs)
}

#[tauri::command]
pub(crate) fn sync_trace_projects(project_paths: Vec<String>) -> Result<String, KivraError> {
    let trace_projects_path = trace_projects_file_path()?;
    let mut local_project_paths = project_paths
        .into_iter()
        .filter_map(|project_path| PathBuf::from(project_path).canonicalize().ok())
        .filter(|project_path| project_path.is_dir())
        .map(|project_path| project_path.to_string_lossy().to_string())
        .collect::<Vec<_>>();

    local_project_paths.sort();
    local_project_paths.dedup();

    if let Some(parent_path) = trace_projects_path.parent() {
        fs::create_dir_all(parent_path)
            .map_err(|error| KivraError::Filesystem(error.to_string()))?;
    }

    fs::write(
        &trace_projects_path,
        serde_json::to_string_pretty(&local_project_paths)
            .map_err(|error| KivraError::Filesystem(error.to_string()))?,
    )
    .map_err(|error| KivraError::Filesystem(error.to_string()))?;

    Ok(trace_projects_path.to_string_lossy().to_string())
}

#[tauri::command]
pub(crate) fn start_trace_agent(project_paths: Vec<String>) -> Result<(), KivraError> {
    sync_trace_projects(project_paths)?;
    Ok(())
}

fn read_captured_runs_from_dir(
    captured_path: &Path,
    project_path: Option<&Path>,
) -> Result<Vec<CapturedRunResult>, KivraError> {
    if !captured_path.exists() {
        return Ok(Vec::new());
    }

    Ok(fs::read_dir(captured_path)
        .map_err(|error| KivraError::Filesystem(error.to_string()))?
        .filter_map(Result::ok)
        .filter(|entry| entry.path().is_dir())
        .filter_map(|entry| read_captured_run(&entry.path()).ok())
        .filter(|run| {
            project_path
                .map(|path| run.project_path.as_deref() == Some(&path.to_string_lossy()))
                .unwrap_or(true)
        })
        .filter(|run| !run.stdout.trim().is_empty() || !run.stderr.trim().is_empty())
        .collect::<Vec<_>>())
}

fn read_central_captured_runs(project_path: &Path) -> Result<Vec<CapturedRunResult>, KivraError> {
    let central_path = kivra_home_dir()?.join(CAPTURED_RUNS_DIRECTORY);

    if !central_path.exists() {
        return Ok(Vec::new());
    }

    let mut runs = Vec::new();

    for entry in
        fs::read_dir(&central_path).map_err(|error| KivraError::Filesystem(error.to_string()))?
    {
        let entry = entry.map_err(|error| KivraError::Filesystem(error.to_string()))?;

        if entry.path().is_dir() {
            runs.extend(read_captured_runs_from_dir(
                &entry.path(),
                Some(project_path),
            )?);
        }
    }

    Ok(runs)
}

fn read_captured_run(run_path: &Path) -> Result<CapturedRunResult, KivraError> {
    let start_content = fs::read_to_string(run_path.join(CAPTURE_START_FILE))
        .map_err(|error| KivraError::Filesystem(error.to_string()))?;
    let start = serde_json::from_str::<CapturedRunStart>(&start_content)
        .map_err(|error| KivraError::Filesystem(error.to_string()))?;
    let end = fs::read_to_string(run_path.join(CAPTURE_END_FILE))
        .ok()
        .and_then(|content| serde_json::from_str::<CapturedRunEnd>(&content).ok());
    let events_content = fs::read_to_string(run_path.join(CAPTURE_EVENTS_FILE)).unwrap_or_default();
    let mut stdout = String::new();
    let mut stderr = String::new();

    for line in events_content
        .lines()
        .filter(|line| !line.trim().is_empty())
    {
        let event = serde_json::from_str::<CapturedRunEvent>(line)
            .map_err(|error| KivraError::Filesystem(error.to_string()))?;

        if event.stream == "stderr" {
            stderr.push_str(&sanitize_captured_output(&event.data));
        } else {
            stdout.push_str(&sanitize_captured_output(&event.data));
        }
    }

    let combined_output = format!("{stdout}\n{stderr}");
    let lower_output = combined_output.to_lowercase();
    let errors = if lower_output.contains("error")
        || lower_output.contains("failed")
        || lower_output.contains("cannot ")
        || lower_output.contains("module not found")
    {
        parse_errors(&combined_output)
    } else {
        Vec::new()
    };
    let exit_code = end.as_ref().and_then(|end| end.exit_code);
    let duration = end
        .as_ref()
        .and_then(|end| end.duration_ms)
        .unwrap_or_default();
    let status = if exit_code.is_some_and(|code| code != 0) || !errors.is_empty() {
        "FAILED"
    } else {
        "SUCCESS"
    }
    .to_string();

    Ok(CapturedRunResult {
        id: start.id,
        project_path: start.project_path,
        command: start.command,
        status,
        duration,
        stdout,
        stderr,
        exit_code,
        errors,
        created_at: start.started_at,
    })
}

fn sanitize_captured_output(value: &str) -> String {
    let mut output = String::new();
    let mut chars = value.chars().peekable();

    while let Some(character) = chars.next() {
        if character == '\u{1b}' {
            match chars.peek().copied() {
                Some(']') => {
                    chars.next();
                    skip_until_osc_end(&mut chars);
                }
                Some('[') => {
                    chars.next();
                    skip_until_csi_end(&mut chars);
                }
                _ => {}
            }
            continue;
        }

        if character == ']' {
            let mut probe = chars.clone();
            let marker = ['1', '3', '4', '1', ';'];
            let is_command_marker = marker
                .iter()
                .all(|expected| probe.next() == Some(*expected));

            if is_command_marker {
                for _ in marker {
                    chars.next();
                }
                skip_until_bel(&mut chars);
                continue;
            }
        }

        if character == '\n'
            || character == '\t'
            || (!character.is_control() && character != '\u{7f}')
        {
            output.push(character);
        }
    }

    output
}

fn skip_until_osc_end<I>(chars: &mut std::iter::Peekable<I>)
where
    I: Iterator<Item = char>,
{
    while let Some(character) = chars.next() {
        if character == '\u{7}' {
            break;
        }

        if character == '\u{1b}' && chars.peek() == Some(&'\\') {
            chars.next();
            break;
        }
    }
}

fn skip_until_bel<I>(chars: &mut std::iter::Peekable<I>)
where
    I: Iterator<Item = char>,
{
    for character in chars.by_ref() {
        if character == '\u{7}' {
            break;
        }
    }
}

fn skip_until_csi_end<I>(chars: &mut std::iter::Peekable<I>)
where
    I: Iterator<Item = char>,
{
    for character in chars.by_ref() {
        if ('@'..='~').contains(&character) {
            break;
        }
    }
}
