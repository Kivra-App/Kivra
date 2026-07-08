use serde::{Deserialize, Serialize};
use std::path::PathBuf;

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct ProjectNode {
    pub(crate) id: String,
    pub(crate) name: String,
    pub(crate) path: String,
    #[serde(rename = "type")]
    pub(crate) node_type: String,
    pub(crate) children: Option<Vec<ProjectNode>>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct ScannedProject {
    pub(crate) name: String,
    pub(crate) path: String,
    pub(crate) runtime: String,
    pub(crate) framework: String,
    pub(crate) package_manager: String,
    pub(crate) branch: String,
    pub(crate) repository_url: Option<String>,
    pub(crate) tree: ProjectNode,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct ProjectMetadataResult {
    pub(crate) name: String,
    pub(crate) runtime: String,
    pub(crate) framework: String,
    pub(crate) package_manager: String,
    pub(crate) branch: String,
    pub(crate) repository_url: Option<String>,
}

#[derive(Debug, Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub(crate) struct DetectedError {
    pub(crate) error_code: String,
    pub(crate) message: String,
    pub(crate) stack_trace: String,
    pub(crate) file_path: Option<String>,
    pub(crate) line_number: Option<u32>,
    pub(crate) column_number: Option<u32>,
}

#[derive(Debug, Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub(crate) struct RunResult {
    pub(crate) command: String,
    pub(crate) status: String,
    pub(crate) duration: u128,
    pub(crate) stdout: String,
    pub(crate) stderr: String,
    pub(crate) exit_code: Option<i32>,
    pub(crate) errors: Vec<DetectedError>,
    pub(crate) created_at: String,
}

#[derive(Debug, Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub(crate) struct RunOutputEvent {
    pub(crate) run_id: String,
    pub(crate) stream: String,
    pub(crate) chunk: String,
}

#[derive(Debug, Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub(crate) struct RunCompletedEvent {
    pub(crate) run_id: String,
    pub(crate) result: RunResult,
}

#[derive(Debug, Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub(crate) struct RunFailedEvent {
    pub(crate) run_id: String,
    pub(crate) message: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct CapturedRunResult {
    pub(crate) id: String,
    #[serde(skip_serializing)]
    pub(crate) project_path: Option<String>,
    pub(crate) command: String,
    pub(crate) status: String,
    pub(crate) duration: u128,
    pub(crate) stdout: String,
    pub(crate) stderr: String,
    pub(crate) exit_code: Option<i32>,
    pub(crate) errors: Vec<DetectedError>,
    pub(crate) created_at: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct CapturedRunStart {
    #[allow(dead_code)]
    pub(crate) protocol_version: Option<u8>,
    pub(crate) id: String,
    pub(crate) project_path: Option<String>,
    pub(crate) command: String,
    pub(crate) started_at: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct CapturedRunEnd {
    #[allow(dead_code)]
    pub(crate) protocol_version: Option<u8>,
    pub(crate) exit_code: Option<i32>,
    pub(crate) duration_ms: Option<u128>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct CapturedRunEvent {
    #[allow(dead_code)]
    pub(crate) protocol_version: Option<u8>,
    pub(crate) stream: String,
    pub(crate) data: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct ProjectFile {
    pub(crate) path: String,
    pub(crate) content: String,
    pub(crate) size: u64,
    pub(crate) truncated: bool,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct IntegrationInstallResult {
    pub(crate) message_key: String,
    pub(crate) paths: Vec<String>,
    pub(crate) restart_required: bool,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct IntegrationStatus {
    pub(crate) shell_installed: bool,
    pub(crate) shell_integration_path: String,
    pub(crate) jetbrains_installed: bool,
    pub(crate) jetbrains_partially_installed: bool,
    pub(crate) jetbrains_install_paths: Vec<String>,
    pub(crate) jetbrains_missing_install_paths: Vec<String>,
    pub(crate) jetbrains_plugins: Vec<JetBrainsPluginStatus>,
    pub(crate) vscode_installed: bool,
    pub(crate) vscode_cli_path: Option<String>,
}

#[derive(Debug, Clone)]
pub(crate) struct JetBrainsPluginRoot {
    pub(crate) display_name: String,
    pub(crate) plugin_root: PathBuf,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct JetBrainsPluginStatus {
    pub(crate) display_name: String,
    pub(crate) path: String,
    pub(crate) installed: bool,
}

#[derive(Debug, Serialize)]
pub(crate) struct AuthSessionTokens {
    pub(crate) access_token: String,
    pub(crate) refresh_token: String,
    pub(crate) expires_at: Option<u64>,
    pub(crate) expires_in: Option<u64>,
    pub(crate) provider_refresh_token: Option<String>,
    pub(crate) provider_token: Option<String>,
    pub(crate) token_type: Option<String>,
    pub(crate) user: serde_json::Value,
}

#[derive(Debug, Serialize)]
pub(crate) struct AuthTokenExchangeRequest<'a> {
    pub(crate) auth_code: &'a str,
    pub(crate) code_verifier: &'a str,
}

#[derive(Debug, Deserialize)]
pub(crate) struct AuthTokenExchangeResponse {
    pub(crate) access_token: String,
    pub(crate) refresh_token: String,
    pub(crate) expires_at: Option<u64>,
    pub(crate) expires_in: Option<u64>,
    pub(crate) provider_refresh_token: Option<String>,
    pub(crate) provider_token: Option<String>,
    pub(crate) token_type: Option<String>,
    pub(crate) user: serde_json::Value,
}
