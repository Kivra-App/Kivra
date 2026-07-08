use serde::Serialize;
use thiserror::Error;

#[derive(Debug, Error)]
pub(crate) enum KivraError {
    #[error("Path does not exist")]
    PathNotFound,
    #[error("Path is not a directory")]
    NotDirectory,
    #[error("Path is not a file")]
    NotFile,
    #[error("Unable to read filesystem: {0}")]
    Filesystem(String),
    #[error("Unable to run command: {0}")]
    Command(String),
    #[error("File is outside the project")]
    FileOutsideProject,
    #[error("Only HTTPS URLs can be opened externally")]
    InvalidExternalUrl,
    #[error("Unable to receive auth callback: {0}")]
    AuthCallback(String),
    #[error("Unable to exchange auth code: {0}")]
    AuthExchange(String),
}

impl Serialize for KivraError {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        serializer.serialize_str(&self.to_string())
    }
}
