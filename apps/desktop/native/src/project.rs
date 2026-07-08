use crate::error::KivraError;
use crate::models::{ProjectFile, ProjectMetadataResult, ProjectNode, ScannedProject};
use std::{
    collections::HashSet,
    ffi::OsStr,
    fs,
    path::{Path, PathBuf},
    process::Command,
};

#[tauri::command]
pub(crate) fn scan_project(project_path: String) -> Result<ScannedProject, KivraError> {
    let root_path = PathBuf::from(project_path);

    if !root_path.exists() {
        return Err(KivraError::PathNotFound);
    }

    if !root_path.is_dir() {
        return Err(KivraError::NotDirectory);
    }

    let name = root_path
        .file_name()
        .and_then(OsStr::to_str)
        .unwrap_or("project")
        .to_string();
    let tree = build_project_tree(&root_path, &root_path, 0)?;

    Ok(ScannedProject {
        name: detect_project_name(&root_path).unwrap_or(name),
        path: root_path.to_string_lossy().to_string(),
        runtime: detect_runtime(&root_path),
        framework: detect_framework(&root_path),
        package_manager: detect_package_manager(&root_path),
        branch: read_git_output(&root_path, ["rev-parse", "--abbrev-ref", "HEAD"])
            .unwrap_or_else(|| "unknown".to_string()),
        repository_url: read_git_output(&root_path, ["config", "--get", "remote.origin.url"]),
        tree,
    })
}

#[tauri::command]
pub(crate) fn read_project_metadata(
    project_path: String,
) -> Result<ProjectMetadataResult, KivraError> {
    let root_path = PathBuf::from(project_path);

    if !root_path.exists() {
        return Err(KivraError::PathNotFound);
    }

    if !root_path.is_dir() {
        return Err(KivraError::NotDirectory);
    }

    let name = root_path
        .file_name()
        .and_then(OsStr::to_str)
        .unwrap_or("project")
        .to_string();

    Ok(ProjectMetadataResult {
        name: detect_project_name(&root_path).unwrap_or(name),
        runtime: detect_runtime(&root_path),
        framework: detect_framework(&root_path),
        package_manager: detect_package_manager(&root_path),
        branch: read_git_output(&root_path, ["rev-parse", "--abbrev-ref", "HEAD"])
            .unwrap_or_else(|| "unknown".to_string()),
        repository_url: read_git_output(&root_path, ["config", "--get", "remote.origin.url"]),
    })
}

#[tauri::command]
pub(crate) fn read_project_directory(
    project_path: String,
    directory_path: String,
) -> Result<Vec<ProjectNode>, KivraError> {
    let root_path = PathBuf::from(project_path)
        .canonicalize()
        .map_err(|error| KivraError::Filesystem(error.to_string()))?;
    let directory_path = PathBuf::from(directory_path)
        .canonicalize()
        .map_err(|error| KivraError::Filesystem(error.to_string()))?;

    if !directory_path.starts_with(&root_path) {
        return Err(KivraError::FileOutsideProject);
    }

    if !directory_path.is_dir() {
        return Err(KivraError::NotDirectory);
    }

    read_children(&root_path, &directory_path, 0)
}

#[tauri::command]
pub(crate) fn read_project_file(
    project_path: String,
    file_path: String,
) -> Result<ProjectFile, KivraError> {
    let root_path = PathBuf::from(project_path)
        .canonicalize()
        .map_err(|error| KivraError::Filesystem(error.to_string()))?;
    let target_path = PathBuf::from(file_path)
        .canonicalize()
        .map_err(|error| KivraError::Filesystem(error.to_string()))?;

    if !target_path.starts_with(&root_path) {
        return Err(KivraError::FileOutsideProject);
    }

    let metadata =
        fs::metadata(&target_path).map_err(|error| KivraError::Filesystem(error.to_string()))?;

    if !metadata.is_file() {
        return Err(KivraError::NotFile);
    }

    let max_size = 512 * 1024;
    let content = fs::read_to_string(&target_path)
        .map_err(|error| KivraError::Filesystem(error.to_string()))?;
    let truncated = content.len() > max_size;
    let visible_content = if truncated {
        content.chars().take(max_size).collect::<String>()
    } else {
        content
    };

    Ok(ProjectFile {
        path: target_path.to_string_lossy().to_string(),
        content: visible_content,
        size: metadata.len(),
        truncated,
    })
}

fn build_project_tree(
    root_path: &Path,
    current_path: &Path,
    depth: usize,
) -> Result<ProjectNode, KivraError> {
    let metadata =
        fs::metadata(current_path).map_err(|error| KivraError::Filesystem(error.to_string()))?;
    let name = current_path
        .file_name()
        .and_then(OsStr::to_str)
        .unwrap_or_else(|| root_path.to_str().unwrap_or("project"))
        .to_string();
    let path = current_path.to_string_lossy().to_string();

    if metadata.is_file() {
        return Ok(ProjectNode {
            id: path.clone(),
            name,
            path,
            node_type: "file".to_string(),
            children: None,
        });
    }

    let children = if depth < 1 {
        Some(read_children(root_path, current_path, depth)?)
    } else {
        None
    };

    Ok(ProjectNode {
        id: path.clone(),
        name,
        path,
        node_type: "folder".to_string(),
        children,
    })
}

fn read_children(
    root_path: &Path,
    current_path: &Path,
    depth: usize,
) -> Result<Vec<ProjectNode>, KivraError> {
    let ignored_names = HashSet::from([
        ".git",
        ".next",
        "dist",
        "node_modules",
        "target",
        ".turbo",
        ".venv",
    ]);
    let mut entries = fs::read_dir(current_path)
        .map_err(|error| KivraError::Filesystem(error.to_string()))?
        .filter_map(Result::ok)
        .filter(|entry| {
            entry
                .file_name()
                .to_str()
                .map(|name| !ignored_names.contains(name))
                .unwrap_or(false)
        })
        .collect::<Vec<_>>();

    entries.sort_by_key(|entry| {
        let is_file = entry.path().is_file();
        (is_file, entry.file_name())
    });

    entries
        .into_iter()
        .map(|entry| build_project_tree(root_path, &entry.path(), depth + 1))
        .collect()
}

fn detect_project_name(root_path: &Path) -> Option<String> {
    let package_json = fs::read_to_string(root_path.join("package.json")).ok()?;
    let value = serde_json::from_str::<serde_json::Value>(&package_json).ok()?;
    value
        .get("name")
        .and_then(serde_json::Value::as_str)
        .map(ToString::to_string)
}

fn detect_runtime(root_path: &Path) -> String {
    if root_path.join("Cargo.toml").exists() {
        return "Rust".to_string();
    }

    if root_path.join("package.json").exists() {
        return "Node.js".to_string();
    }

    if root_path.join("pyproject.toml").exists() {
        return "Python".to_string();
    }

    if root_path.join("go.mod").exists() {
        return "Go".to_string();
    }

    "unknown".to_string()
}

fn detect_framework(root_path: &Path) -> String {
    let package_json = fs::read_to_string(root_path.join("package.json")).unwrap_or_default();
    let workspace_manifest =
        fs::read_to_string(root_path.join("pnpm-workspace.yaml")).unwrap_or_default();

    if package_json.contains("\"next\"") {
        return "Next.js".to_string();
    }

    if package_json.contains("\"@vitejs/plugin-react\"") || package_json.contains("\"vite\"") {
        return "Vite".to_string();
    }

    if package_json.contains("\"react\"") {
        return "React".to_string();
    }

    if root_path.join("native/tauri.conf.json").exists()
        || root_path.join("tauri.conf.json").exists()
    {
        return "Tauri".to_string();
    }

    if is_monorepo_root(root_path, &package_json, &workspace_manifest) {
        let detected_frameworks = detect_workspace_frameworks(root_path);

        if detected_frameworks.is_empty() {
            return "Monorepo".to_string();
        }

        return format!(
            "Monorepo ({})",
            detected_frameworks
                .into_iter()
                .collect::<Vec<_>>()
                .join(" + ")
        );
    }

    if package_json.contains("\"workspaces\"") {
        return "Workspace".to_string();
    }

    if package_json.contains("\"typescript\"")
        || package_json.contains("\"tsx\"")
        || package_json.contains("\"ts-node\"")
    {
        return "TypeScript".to_string();
    }

    if package_json.contains("\"node\"") || root_path.join("package.json").exists() {
        return "Node.js".to_string();
    }

    "Custom".to_string()
}

fn is_monorepo_root(root_path: &Path, package_json: &str, workspace_manifest: &str) -> bool {
    workspace_manifest.contains("apps/*")
        || workspace_manifest.contains("packages/*")
        || package_json.contains("\"workspaces\"")
        || root_path.join("apps").is_dir()
        || root_path.join("packages").is_dir()
}

fn detect_workspace_frameworks(root_path: &Path) -> HashSet<String> {
    let mut frameworks = HashSet::new();

    for workspace_root in ["apps", "packages"] {
        let workspace_path = root_path.join(workspace_root);

        if !workspace_path.is_dir() {
            continue;
        }

        let Ok(entries) = fs::read_dir(workspace_path) else {
            continue;
        };

        for entry in entries.flatten() {
            let entry_path = entry.path();

            if !entry_path.is_dir() {
                continue;
            }

            let package_json =
                fs::read_to_string(entry_path.join("package.json")).unwrap_or_default();

            if package_json.is_empty() {
                continue;
            }

            if package_json.contains("\"next\"") {
                frameworks.insert("Next.js".to_string());
            } else if package_json.contains("\"@vitejs/plugin-react\"")
                || package_json.contains("\"vite\"")
            {
                frameworks.insert("Vite".to_string());
            } else if package_json.contains("\"react\"") {
                frameworks.insert("React".to_string());
            }

            if entry_path.join("tauri.conf.json").exists()
                || entry_path.join("native").join("tauri.conf.json").exists()
            {
                frameworks.insert("Tauri".to_string());
            }
        }
    }

    frameworks
}

fn detect_package_manager(root_path: &Path) -> String {
    if root_path.join("pnpm-lock.yaml").exists() || root_path.join("pnpm-workspace.yaml").exists() {
        return "pnpm".to_string();
    }

    if root_path.join("yarn.lock").exists() {
        return "yarn".to_string();
    }

    if root_path.join("package-lock.json").exists() {
        return "npm".to_string();
    }

    if root_path.join("bun.lockb").exists() {
        return "bun".to_string();
    }

    "unknown".to_string()
}

fn read_git_output<const N: usize>(root_path: &Path, args: [&str; N]) -> Option<String> {
    let output = Command::new("git")
        .args(args)
        .current_dir(root_path)
        .output()
        .ok()?;

    if !output.status.success() {
        return None;
    }

    let value = String::from_utf8_lossy(&output.stdout).trim().to_string();

    if value.is_empty() {
        None
    } else {
        Some(value)
    }
}
