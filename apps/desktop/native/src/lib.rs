mod auth;
#[path = "captured-runs.rs"]
mod captured_runs;
mod constants;
mod error;
#[path = "external-url.rs"]
mod external_url;
mod integrations;
mod models;
mod paths;
mod project;
#[path = "run-command.rs"]
mod run_command;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_deep_link::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            project::scan_project,
            project::read_project_metadata,
            project::read_project_directory,
            external_url::open_external_url,
            auth::wait_for_auth_callback,
            auth::exchange_auth_code,
            run_command::start_run_project_command,
            project::read_project_file,
            captured_runs::read_captured_runs,
            captured_runs::sync_trace_projects,
            captured_runs::start_trace_agent,
            integrations::get_integration_status,
            integrations::install_shell_capture,
            integrations::uninstall_shell_capture,
            integrations::install_jetbrains_plugin,
            integrations::install_missing_jetbrains_plugins,
            integrations::install_vscode_extension
        ])
        .run(tauri::generate_context!())
        .expect("error while running Kivra");
}
