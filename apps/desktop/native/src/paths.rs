use crate::constants::KIVRA_HOME_DIRECTORY;
use crate::error::KivraError;
use std::{env, path::PathBuf};

pub(crate) fn trace_projects_file_path() -> Result<PathBuf, KivraError> {
    Ok(kivra_home_dir()?.join("trace-projects.json"))
}

pub(crate) fn kivra_home_dir() -> Result<PathBuf, KivraError> {
    Ok(home_dir()?.join(KIVRA_HOME_DIRECTORY))
}

pub(crate) fn home_dir() -> Result<PathBuf, KivraError> {
    let home = env::var("HOME")
        .map_err(|error| KivraError::Filesystem(format!("HOME is unavailable: {error}")))?;

    Ok(PathBuf::from(home))
}
