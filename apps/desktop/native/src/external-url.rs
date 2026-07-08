use crate::error::KivraError;
use std::process::Command;

#[tauri::command]
pub(crate) fn open_external_url(url: String) -> Result<(), KivraError> {
    if !url.starts_with("https://") {
        return Err(KivraError::InvalidExternalUrl);
    }

    let output = if cfg!(target_os = "macos") {
        Command::new("open").arg(&url).output()
    } else if cfg!(target_os = "windows") {
        Command::new("cmd").args(["/C", "start", "", &url]).output()
    } else {
        Command::new("xdg-open").arg(&url).output()
    }
    .map_err(|error| KivraError::Command(error.to_string()))?;

    if output.status.success() {
        Ok(())
    } else {
        Err(KivraError::Command(
            String::from_utf8_lossy(&output.stderr).to_string(),
        ))
    }
}
