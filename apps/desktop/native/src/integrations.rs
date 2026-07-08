use crate::constants::{
    JETBRAINS_PLUGIN_DIRECTORY, KIVRA_HOME_DIRECTORY, SHELL_INTEGRATION_FILE,
    SHELL_STREAM_HELPER_FILE, VSCODE_EXTENSION_ID,
};
use crate::error::KivraError;
use crate::models::{
    IntegrationInstallResult, IntegrationStatus, JetBrainsPluginRoot, JetBrainsPluginStatus,
};
use crate::paths::{home_dir, kivra_home_dir};
use std::{
    env,
    ffi::OsStr,
    fs,
    path::{Path, PathBuf},
    process::Command,
};

#[tauri::command]
pub(crate) fn get_integration_status() -> Result<IntegrationStatus, KivraError> {
    let kivra_home = kivra_home_dir()?;
    let shell_integration_path = kivra_home.join("shell").join(SHELL_INTEGRATION_FILE);
    let shell_helper_path = kivra_home
        .join("trace-runtime")
        .join(SHELL_STREAM_HELPER_FILE);
    let source_line = format!(
        "source {}",
        shell_quote(&shell_integration_path.to_string_lossy())
    );
    let zshrc_path = home_dir()?.join(".zshrc");
    let zshrc_content = fs::read_to_string(&zshrc_path).unwrap_or_default();
    let jetbrains_plugins = jetbrains_plugin_statuses()?;
    let jetbrains_install_paths = jetbrains_plugins
        .iter()
        .filter(|plugin| plugin.installed)
        .map(|plugin| plugin.path.clone())
        .collect::<Vec<_>>();
    let jetbrains_missing_install_paths = jetbrains_plugins
        .iter()
        .filter(|plugin| !plugin.installed)
        .map(|plugin| plugin.path.clone())
        .collect::<Vec<_>>();
    let vscode_cli_path = vscode_cli_path();
    let vscode_installed = vscode_cli_path
        .as_ref()
        .is_some_and(|path| vscode_extension_installed(path));

    Ok(IntegrationStatus {
        shell_installed: shell_integration_path.exists()
            && shell_helper_path.exists()
            && zshrc_content.contains(&source_line),
        shell_integration_path: shell_integration_path.to_string_lossy().to_string(),
        jetbrains_installed: !jetbrains_install_paths.is_empty()
            && jetbrains_missing_install_paths.is_empty(),
        jetbrains_partially_installed: !jetbrains_install_paths.is_empty()
            && !jetbrains_missing_install_paths.is_empty(),
        jetbrains_install_paths,
        jetbrains_missing_install_paths,
        jetbrains_plugins,
        vscode_installed,
        vscode_cli_path: vscode_cli_path.map(|path| path.to_string_lossy().to_string()),
    })
}

#[tauri::command]
pub(crate) fn install_shell_capture() -> Result<IntegrationInstallResult, KivraError> {
    let repo_root = find_repo_root()
        .ok_or_else(|| KivraError::Filesystem("Kivra repository root not found".to_string()))?;
    let helper_source_path = repo_root.join("tools").join("kivra-shell-stream.mjs");

    if !helper_source_path.exists() {
        return Err(KivraError::Filesystem(format!(
            "{} not found",
            helper_source_path.to_string_lossy()
        )));
    }

    let home = home_dir()?;
    let kivra_home = home.join(KIVRA_HOME_DIRECTORY);
    let runtime_dir = kivra_home.join("trace-runtime");
    let shell_dir = kivra_home.join("shell");
    let helper_path = runtime_dir.join(SHELL_STREAM_HELPER_FILE);
    let integration_path = shell_dir.join(SHELL_INTEGRATION_FILE);
    let zshrc_path = home.join(".zshrc");
    let source_line = format!(
        "source {}",
        shell_quote(&integration_path.to_string_lossy())
    );
    let integration_content = shell_integration_content(&kivra_home, &helper_path);

    if cfg!(target_os = "macos") {
        if install_shell_capture_with_admin(
            &helper_source_path,
            &runtime_dir,
            &shell_dir,
            &helper_path,
            &integration_path,
            &zshrc_path,
            &source_line,
            &integration_content,
            &home,
        )
        .is_err()
        {
            install_shell_capture_direct(
                &helper_source_path,
                &runtime_dir,
                &shell_dir,
                &helper_path,
                &integration_path,
                &zshrc_path,
                &source_line,
                &integration_content,
            )?;
        }
    } else {
        install_shell_capture_direct(
            &helper_source_path,
            &runtime_dir,
            &shell_dir,
            &helper_path,
            &integration_path,
            &zshrc_path,
            &source_line,
            &integration_content,
        )?;
    }

    Ok(IntegrationInstallResult {
        message_key: "settings.shell.installSuccess".to_string(),
        paths: vec![
            integration_path.to_string_lossy().to_string(),
            helper_path.to_string_lossy().to_string(),
            zshrc_path.to_string_lossy().to_string(),
        ],
        restart_required: true,
    })
}

#[tauri::command]
pub(crate) fn uninstall_shell_capture() -> Result<IntegrationInstallResult, KivraError> {
    let home = home_dir()?;
    let kivra_home = home.join(KIVRA_HOME_DIRECTORY);
    let helper_path = kivra_home
        .join("trace-runtime")
        .join(SHELL_STREAM_HELPER_FILE);
    let integration_path = kivra_home.join("shell").join(SHELL_INTEGRATION_FILE);
    let zshrc_path = home.join(".zshrc");
    let source_line = format!(
        "source {}",
        shell_quote(&integration_path.to_string_lossy())
    );

    if cfg!(target_os = "macos") {
        if uninstall_shell_capture_with_admin(
            &helper_path,
            &integration_path,
            &zshrc_path,
            &source_line,
            &home,
        )
        .is_err()
        {
            uninstall_shell_capture_direct(
                &helper_path,
                &integration_path,
                &zshrc_path,
                &source_line,
            )?;
        }
    } else {
        uninstall_shell_capture_direct(&helper_path, &integration_path, &zshrc_path, &source_line)?;
    }

    Ok(IntegrationInstallResult {
        message_key: "settings.shell.uninstallSuccess".to_string(),
        paths: vec![
            integration_path.to_string_lossy().to_string(),
            helper_path.to_string_lossy().to_string(),
            zshrc_path.to_string_lossy().to_string(),
        ],
        restart_required: true,
    })
}

#[tauri::command]
pub(crate) fn install_jetbrains_plugin() -> Result<IntegrationInstallResult, KivraError> {
    let repo_root = find_repo_root()
        .ok_or_else(|| KivraError::Filesystem("Kivra repository root not found".to_string()))?;
    let plugin_zip_path = ensure_jetbrains_plugin_zip(&repo_root)?;
    let plugin_roots = jetbrains_plugin_roots()?
        .into_iter()
        .map(|plugin| plugin.plugin_root)
        .collect::<Vec<_>>();

    if plugin_roots.is_empty() {
        return Err(KivraError::Filesystem(
            "No JetBrains IDE configuration folders were found.".to_string(),
        ));
    }

    let installed_paths = install_jetbrains_plugin_to_roots(&plugin_zip_path, plugin_roots, true)?;

    Ok(IntegrationInstallResult {
        message_key: "settings.jetbrains.installSuccess".to_string(),
        paths: installed_paths,
        restart_required: true,
    })
}

#[tauri::command]
pub(crate) fn install_missing_jetbrains_plugins() -> Result<IntegrationInstallResult, KivraError> {
    let repo_root = find_repo_root()
        .ok_or_else(|| KivraError::Filesystem("Kivra repository root not found".to_string()))?;
    let plugin_zip_path = ensure_jetbrains_plugin_zip(&repo_root)?;
    let plugin_roots = missing_jetbrains_plugin_roots()?;

    if plugin_roots.is_empty() {
        return Ok(IntegrationInstallResult {
            message_key: "settings.jetbrains.noMissingSuccess".to_string(),
            paths: Vec::new(),
            restart_required: false,
        });
    }

    let installed_paths = install_jetbrains_plugin_to_roots(&plugin_zip_path, plugin_roots, false)?;

    Ok(IntegrationInstallResult {
        message_key: "settings.jetbrains.installMissingSuccess".to_string(),
        paths: installed_paths,
        restart_required: true,
    })
}

#[tauri::command]
pub(crate) fn install_vscode_extension() -> Result<IntegrationInstallResult, KivraError> {
    let repo_root = find_repo_root()
        .ok_or_else(|| KivraError::Filesystem("Kivra repository root not found".to_string()))?;
    let cli_path = vscode_cli_path()
        .ok_or_else(|| KivraError::Command("Visual Studio Code CLI was not found.".to_string()))?;
    let vsix_path = ensure_vscode_extension_vsix(&repo_root)?;
    let output = Command::new(&cli_path)
        .args([
            "--install-extension",
            &vsix_path.to_string_lossy(),
            "--force",
        ])
        .output()
        .map_err(|error| KivraError::Command(error.to_string()))?;

    if !output.status.success() {
        return Err(command_failure(
            "Unable to install VS Code extension",
            &output,
        ));
    }

    Ok(IntegrationInstallResult {
        message_key: "settings.vscode.installSuccess".to_string(),
        paths: vec![
            cli_path.to_string_lossy().to_string(),
            vsix_path.to_string_lossy().to_string(),
        ],
        restart_required: true,
    })
}

fn install_shell_capture_with_admin(
    helper_source_path: &Path,
    runtime_dir: &Path,
    shell_dir: &Path,
    helper_path: &Path,
    integration_path: &Path,
    zshrc_path: &Path,
    source_line: &str,
    integration_content: &str,
    home: &Path,
) -> Result<(), KivraError> {
    let uid = command_output("id", &["-u"])?;
    let gid = command_output("id", &["-g"])?;
    let script_path =
        env::temp_dir().join(format!("kivra-install-shell-{}.sh", std::process::id()));
    let script = format!(
        r#"#!/bin/sh
set -eu
mkdir -p {runtime_dir} {shell_dir}
cp {helper_source_path} {helper_path}
cat > {integration_path} <<'KIVRA_ZSH_EOF'
{integration_content}
KIVRA_ZSH_EOF
touch {zshrc_path}
if ! /usr/bin/grep -Fqx {source_line} {zshrc_path}; then
  printf '\n# >>> kivra shell capture >>>\n%s\n# <<< kivra shell capture <<<\n' {source_line} >> {zshrc_path}
fi
/usr/sbin/chown -R {uid}:{gid} {home}/.kivra {zshrc_path}
"#,
        runtime_dir = shell_quote(&runtime_dir.to_string_lossy()),
        shell_dir = shell_quote(&shell_dir.to_string_lossy()),
        helper_source_path = shell_quote(&helper_source_path.to_string_lossy()),
        helper_path = shell_quote(&helper_path.to_string_lossy()),
        integration_path = shell_quote(&integration_path.to_string_lossy()),
        integration_content = integration_content,
        zshrc_path = shell_quote(&zshrc_path.to_string_lossy()),
        source_line = shell_quote(source_line),
        uid = uid.trim(),
        gid = gid.trim(),
        home = shell_quote(&home.to_string_lossy()),
    );

    fs::write(&script_path, script).map_err(|error| KivraError::Filesystem(error.to_string()))?;

    let shell_command = format!("/bin/sh {}", shell_quote(&script_path.to_string_lossy()));
    let apple_script = format!(
        "do shell script {} with administrator privileges",
        applescript_quote(&shell_command)
    );
    let output = Command::new("osascript")
        .args(["-e", &apple_script])
        .output()
        .map_err(|error| KivraError::Command(error.to_string()))?;
    let _ = fs::remove_file(&script_path);

    if output.status.success() {
        Ok(())
    } else {
        Err(command_failure("Unable to install shell capture", &output))
    }
}

fn uninstall_shell_capture_with_admin(
    helper_path: &Path,
    integration_path: &Path,
    zshrc_path: &Path,
    source_line: &str,
    home: &Path,
) -> Result<(), KivraError> {
    let uid = command_output("id", &["-u"])?;
    let gid = command_output("id", &["-g"])?;
    let script_path =
        env::temp_dir().join(format!("kivra-uninstall-shell-{}.sh", std::process::id()));
    let script = format!(
        r##"#!/bin/sh
set -eu
if [ -f {zshrc_path} ]; then
  tmp_file="$(/usr/bin/mktemp)"
  /usr/bin/awk -v source={source_line} '
    $0 == "# >>> kivra shell capture >>>" {{ skip = 1; next }}
    $0 == "# <<< kivra shell capture <<<" {{ skip = 0; next }}
    skip == 0 && $0 != source {{ print }}
  ' {zshrc_path} > "$tmp_file"
  cat "$tmp_file" > {zshrc_path}
  rm -f "$tmp_file"
fi
rm -f {integration_path} {helper_path}
/usr/sbin/chown -R {uid}:{gid} {home}/.kivra {zshrc_path} 2>/dev/null || true
"##,
        zshrc_path = shell_quote(&zshrc_path.to_string_lossy()),
        source_line = shell_quote(source_line),
        integration_path = shell_quote(&integration_path.to_string_lossy()),
        helper_path = shell_quote(&helper_path.to_string_lossy()),
        uid = uid.trim(),
        gid = gid.trim(),
        home = shell_quote(&home.to_string_lossy()),
    );

    fs::write(&script_path, script).map_err(|error| KivraError::Filesystem(error.to_string()))?;

    let shell_command = format!("/bin/sh {}", shell_quote(&script_path.to_string_lossy()));
    let apple_script = format!(
        "do shell script {} with administrator privileges",
        applescript_quote(&shell_command)
    );
    let output = Command::new("osascript")
        .args(["-e", &apple_script])
        .output()
        .map_err(|error| KivraError::Command(error.to_string()))?;
    let _ = fs::remove_file(&script_path);

    if output.status.success() {
        Ok(())
    } else {
        Err(command_failure("Unable to remove shell capture", &output))
    }
}

fn install_shell_capture_direct(
    helper_source_path: &Path,
    runtime_dir: &Path,
    shell_dir: &Path,
    helper_path: &Path,
    integration_path: &Path,
    zshrc_path: &Path,
    source_line: &str,
    integration_content: &str,
) -> Result<(), KivraError> {
    fs::create_dir_all(runtime_dir).map_err(|error| KivraError::Filesystem(error.to_string()))?;
    fs::create_dir_all(shell_dir).map_err(|error| KivraError::Filesystem(error.to_string()))?;
    fs::copy(helper_source_path, helper_path)
        .map_err(|error| KivraError::Filesystem(error.to_string()))?;
    fs::write(integration_path, integration_content)
        .map_err(|error| KivraError::Filesystem(error.to_string()))?;
    append_zshrc_source_line(zshrc_path, source_line)
}

fn uninstall_shell_capture_direct(
    helper_path: &Path,
    integration_path: &Path,
    zshrc_path: &Path,
    source_line: &str,
) -> Result<(), KivraError> {
    remove_zshrc_source_block(zshrc_path, source_line)?;
    let _ = fs::remove_file(integration_path);
    let _ = fs::remove_file(helper_path);
    Ok(())
}

fn append_zshrc_source_line(zshrc_path: &Path, source_line: &str) -> Result<(), KivraError> {
    let current_content = fs::read_to_string(zshrc_path).unwrap_or_default();

    if current_content.lines().any(|line| line == source_line) {
        return Ok(());
    }

    let block = format!(
        "{}\n# >>> kivra shell capture >>>\n{}\n# <<< kivra shell capture <<<\n",
        current_content.trim_end(),
        source_line
    );

    fs::write(zshrc_path, block).map_err(|error| KivraError::Filesystem(error.to_string()))
}

fn remove_zshrc_source_block(zshrc_path: &Path, source_line: &str) -> Result<(), KivraError> {
    let current_content = fs::read_to_string(zshrc_path).unwrap_or_default();
    let mut next_lines = Vec::new();
    let mut skip_block = false;

    for line in current_content.lines() {
        if line == "# >>> kivra shell capture >>>" {
            skip_block = true;
            continue;
        }

        if line == "# <<< kivra shell capture <<<" {
            skip_block = false;
            continue;
        }

        if !skip_block && line != source_line {
            next_lines.push(line);
        }
    }

    let next_content = if next_lines.is_empty() {
        String::new()
    } else {
        format!("{}\n", next_lines.join("\n"))
    };

    fs::write(zshrc_path, next_content).map_err(|error| KivraError::Filesystem(error.to_string()))
}

fn shell_integration_content(kivra_home: &Path, helper_path: &Path) -> String {
    format!(
        r#"# Kivra automatic shell capture for zsh.
# This file is generated by Kivra.

if [ -n "$KIVRA_SHELL_CAPTURE_LOADED" ]; then
  return
fi

export KIVRA_SHELL_CAPTURE_LOADED=1
export KIVRA_PROJECTS_FILE="{projects_file}"
export KIVRA_STREAM_HELPER="{helper_path}"

autoload -Uz add-zsh-hook

function _kivra_preexec() {{
  if [ -n "$KIVRA_CAPTURE_RUN_DIR" ]; then
    return
  fi

  if [ ! -f "$KIVRA_PROJECTS_FILE" ] || [ ! -f "$KIVRA_STREAM_HELPER" ]; then
    return
  fi

  local run_dir
  run_dir="$(node "$KIVRA_STREAM_HELPER" start "$PWD" "$1" "$KIVRA_PROJECTS_FILE" 2>/dev/null)"

  if [ -z "$run_dir" ]; then
    return
  fi

  export KIVRA_CAPTURE_RUN_DIR="$run_dir"
  exec {{KIVRA_ORIG_STDOUT}}>&1
  exec {{KIVRA_ORIG_STDERR}}>&2
  exec > >(node "$KIVRA_STREAM_HELPER" stream "$KIVRA_CAPTURE_RUN_DIR" stdout)
  exec 2> >(node "$KIVRA_STREAM_HELPER" stream "$KIVRA_CAPTURE_RUN_DIR" stderr >&2)
}}

function _kivra_precmd() {{
  if [ -z "$KIVRA_CAPTURE_RUN_DIR" ]; then
    return
  fi

  exec 1>&$KIVRA_ORIG_STDOUT
  exec 2>&$KIVRA_ORIG_STDERR
  exec {{KIVRA_ORIG_STDOUT}}>&-
  exec {{KIVRA_ORIG_STDERR}}>&-
  unset KIVRA_CAPTURE_RUN_DIR
  unset KIVRA_ORIG_STDOUT
  unset KIVRA_ORIG_STDERR
}}

add-zsh-hook preexec _kivra_preexec
add-zsh-hook precmd _kivra_precmd
"#,
        projects_file = kivra_home.join("trace-projects.json").to_string_lossy(),
        helper_path = helper_path.to_string_lossy(),
    )
}

fn ensure_jetbrains_plugin_zip(repo_root: &Path) -> Result<PathBuf, KivraError> {
    let plugin_dir = repo_root.join("plugins").join("jetbrains");
    let distributions_dir = plugin_dir.join("build").join("distributions");
    let plugin_zip_path = distributions_dir.join("kivra-jetbrains-0.1.0.zip");

    if plugin_zip_path.exists() {
        return Ok(plugin_zip_path);
    }

    let output = Command::new("./gradlew")
        .arg("buildPlugin")
        .current_dir(&plugin_dir)
        .output()
        .map_err(|error| KivraError::Command(error.to_string()))?;

    if !output.status.success() {
        return Err(KivraError::Command(format!(
            "{}{}",
            String::from_utf8_lossy(&output.stdout),
            String::from_utf8_lossy(&output.stderr)
        )));
    }

    if plugin_zip_path.exists() {
        Ok(plugin_zip_path)
    } else {
        Err(KivraError::Filesystem(
            "JetBrains plugin ZIP was not created.".to_string(),
        ))
    }
}

fn install_jetbrains_plugin_to_roots(
    plugin_zip_path: &Path,
    plugin_roots: Vec<PathBuf>,
    replace_existing: bool,
) -> Result<Vec<String>, KivraError> {
    let mut installed_paths = Vec::new();

    for plugin_root in plugin_roots {
        fs::create_dir_all(&plugin_root)
            .map_err(|error| KivraError::Filesystem(error.to_string()))?;
        let target_path = plugin_root.join(JETBRAINS_PLUGIN_DIRECTORY);

        if target_path.exists() {
            if !replace_existing {
                continue;
            }

            fs::remove_dir_all(&target_path)
                .map_err(|error| KivraError::Filesystem(error.to_string()))?;
        }

        let output = Command::new("unzip")
            .args([
                "-q",
                "-o",
                &plugin_zip_path.to_string_lossy(),
                "-d",
                &plugin_root.to_string_lossy(),
            ])
            .output()
            .map_err(|error| KivraError::Command(error.to_string()))?;

        if !output.status.success() {
            return Err(command_failure(
                "Unable to install JetBrains plugin",
                &output,
            ));
        }

        installed_paths.push(target_path.to_string_lossy().to_string());
    }

    Ok(installed_paths)
}

fn ensure_vscode_extension_vsix(repo_root: &Path) -> Result<PathBuf, KivraError> {
    let plugin_dir = repo_root.join("plugins").join("vscode");
    let vsix_path = plugin_dir.join("build").join("kivra-vscode-0.1.0.vsix");

    if vsix_path.exists() {
        return Ok(vsix_path);
    }

    let output = Command::new("pnpm")
        .args(["--filter", "kivra-vscode", "package"])
        .current_dir(repo_root)
        .output()
        .map_err(|error| KivraError::Command(error.to_string()))?;

    if !output.status.success() {
        return Err(command_failure(
            "Unable to package VS Code extension",
            &output,
        ));
    }

    if vsix_path.exists() {
        Ok(vsix_path)
    } else {
        Err(KivraError::Filesystem(
            "VS Code extension VSIX was not created.".to_string(),
        ))
    }
}

fn vscode_extension_installed(cli_path: &Path) -> bool {
    let output = Command::new(cli_path)
        .args(["--list-extensions", "--show-versions"])
        .output();

    let Ok(output) = output else {
        return false;
    };

    if !output.status.success() {
        return false;
    }

    String::from_utf8_lossy(&output.stdout).lines().any(|line| {
        line == VSCODE_EXTENSION_ID || line.starts_with(&format!("{VSCODE_EXTENSION_ID}@"))
    })
}

fn vscode_cli_path() -> Option<PathBuf> {
    command_path("code").or_else(|| {
        let macos_path =
            PathBuf::from("/Applications/Visual Studio Code.app/Contents/Resources/app/bin/code");

        macos_path.exists().then_some(macos_path)
    })
}

fn command_path(command: &str) -> Option<PathBuf> {
    let output = Command::new("which").arg(command).output().ok()?;

    if !output.status.success() {
        return None;
    }

    let path = String::from_utf8_lossy(&output.stdout).trim().to_string();

    if path.is_empty() {
        None
    } else {
        Some(PathBuf::from(path))
    }
}

fn jetbrains_plugin_roots() -> Result<Vec<JetBrainsPluginRoot>, KivraError> {
    let application_support = home_dir()?.join("Library").join("Application Support");
    let mut plugin_roots = Vec::new();

    collect_jetbrains_plugin_roots(
        &application_support.join("JetBrains"),
        is_jetbrains_config_dir,
        &mut plugin_roots,
    )?;
    collect_jetbrains_plugin_roots(
        &application_support.join("Google"),
        is_android_studio_config_dir,
        &mut plugin_roots,
    )?;

    plugin_roots.sort_by(|left, right| left.path.cmp(&right.path));
    plugin_roots.dedup_by(|left, right| left.path == right.path);

    Ok(plugin_roots
        .into_iter()
        .map(|plugin| JetBrainsPluginRoot {
            display_name: plugin_display_name(&plugin.name),
            plugin_root: plugin.path.join("plugins"),
        })
        .collect())
}

fn missing_jetbrains_plugin_roots() -> Result<Vec<PathBuf>, KivraError> {
    Ok(jetbrains_plugin_roots()?
        .into_iter()
        .map(|path| path.plugin_root)
        .filter(|path| !path.join(JETBRAINS_PLUGIN_DIRECTORY).exists())
        .collect())
}

#[derive(Debug)]
struct JetBrainsConfigPath {
    name: String,
    path: PathBuf,
}

fn collect_jetbrains_plugin_roots(
    root: &Path,
    matcher: fn(&str) -> bool,
    plugin_roots: &mut Vec<JetBrainsConfigPath>,
) -> Result<(), KivraError> {
    if !root.exists() {
        return Ok(());
    }

    plugin_roots.extend(
        fs::read_dir(root)
            .map_err(|error| KivraError::Filesystem(error.to_string()))?
            .filter_map(Result::ok)
            .map(|entry| entry.path())
            .filter(|path| path.is_dir())
            .filter_map(|path| {
                let name = path.file_name().and_then(OsStr::to_str)?.to_string();

                if matcher(&name) {
                    Some(JetBrainsConfigPath { name, path })
                } else {
                    None
                }
            }),
    );

    Ok(())
}

fn jetbrains_plugin_statuses() -> Result<Vec<JetBrainsPluginStatus>, KivraError> {
    Ok(jetbrains_plugin_roots()?
        .into_iter()
        .map(|plugin| {
            let path = plugin.plugin_root.join(JETBRAINS_PLUGIN_DIRECTORY);

            JetBrainsPluginStatus {
                display_name: plugin.display_name,
                installed: path.exists(),
                path: path.to_string_lossy().to_string(),
            }
        })
        .collect())
}

fn is_jetbrains_config_dir(value: &str) -> bool {
    [
        "IntelliJIdea",
        "WebStorm",
        "PyCharm",
        "GoLand",
        "PhpStorm",
        "CLion",
        "RubyMine",
        "DataGrip",
        "Rider",
        "RustRover",
    ]
    .iter()
    .any(|prefix| value.starts_with(prefix))
}

fn is_android_studio_config_dir(value: &str) -> bool {
    value.starts_with("AndroidStudio")
}

fn plugin_display_name(value: &str) -> String {
    let Some((prefix, product)) = [
        ("IntelliJIdea", "IntelliJ IDEA"),
        ("AndroidStudio", "Android Studio"),
        ("WebStorm", "WebStorm"),
        ("PyCharm", "PyCharm"),
        ("GoLand", "GoLand"),
        ("PhpStorm", "PhpStorm"),
        ("CLion", "CLion"),
        ("RubyMine", "RubyMine"),
        ("DataGrip", "DataGrip"),
        ("Rider", "Rider"),
        ("RustRover", "RustRover"),
    ]
    .iter()
    .find(|(prefix, _)| value.starts_with(prefix)) else {
        return value.to_string();
    };

    let version = value.strip_prefix(prefix).unwrap_or_default();

    if version.is_empty() {
        product.to_string()
    } else {
        format!("{product} {version}")
    }
}

fn find_repo_root() -> Option<PathBuf> {
    let mut candidates = Vec::new();

    if let Ok(current_dir) = env::current_dir() {
        candidates.push(current_dir);
    }

    if let Ok(current_exe) = env::current_exe() {
        if let Some(parent) = current_exe.parent() {
            candidates.push(parent.to_path_buf());
        }
    }

    for candidate in candidates {
        for ancestor in candidate.ancestors() {
            if ancestor.join("package.json").exists()
                && ancestor
                    .join("tools")
                    .join("kivra-shell-stream.mjs")
                    .exists()
            {
                return Some(ancestor.to_path_buf());
            }
        }
    }

    None
}

fn command_output(command: &str, args: &[&str]) -> Result<String, KivraError> {
    let output = Command::new(command)
        .args(args)
        .output()
        .map_err(|error| KivraError::Command(error.to_string()))?;

    if output.status.success() {
        Ok(String::from_utf8_lossy(&output.stdout).trim().to_string())
    } else {
        Err(command_failure(command, &output))
    }
}

fn command_failure(context: &str, output: &std::process::Output) -> KivraError {
    let stderr = String::from_utf8_lossy(&output.stderr).trim().to_string();
    let stdout = String::from_utf8_lossy(&output.stdout).trim().to_string();
    let detail = if !stderr.is_empty() {
        stderr
    } else if !stdout.is_empty() {
        stdout
    } else {
        format!(
            "Command exited with status {} without an error message.",
            output.status
        )
    };

    KivraError::Command(format!("{context}: {detail}"))
}

fn shell_quote(value: &str) -> String {
    format!("'{}'", value.replace('\'', "'\\''"))
}

fn applescript_quote(value: &str) -> String {
    format!("\"{}\"", value.replace('\\', "\\\\").replace('"', "\\\""))
}
