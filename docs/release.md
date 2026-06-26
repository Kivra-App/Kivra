RELEASE.md

Kivra Release Strategy

Version: 1.0

⸻

Purpose

This document defines how Kivra is built, versioned, and distributed.

All release-related implementation should follow this document.

⸻

Product

Kivra is a desktop-first developer memory platform.

The goal is to preserve development knowledge by capturing:

* Project Structure
* Project Metadata
* Command History
* Terminal Logs
* Error History
* Resolution Notes
* Searchable Project Memory

Tagline:

Build. Fail. Remember.

⸻

Repository

Kivra uses a monorepo.

apps/
desktop/
renderer/
native/
plugins/
vscode/
jetbrains/
packages/
protocol/
shared/
database/
config/

Desktop applications belong in apps/.

IDE integrations belong in plugins/.

Shared contracts belong in packages/.

⸻

Current Release Target

Current MVP supports:

* macOS (Apple Silicon)

Only macOS should be considered for the current release pipeline.

Windows and Linux are future targets and should not affect current implementation decisions.

⸻

Release Components

Every Kivra release contains compatible versions of:

* Desktop Application
* VS Code Extension
* JetBrains Plugin
* Protocol

All components share the same version.

Example:

Kivra v0.1.0
Desktop          v0.1.0
VS Code Plugin   v0.1.0
JetBrains Plugin v0.1.0
Protocol         v0.1.0

⸻

Distribution

Desktop

Platform:

* macOS (Apple Silicon)

Artifact:

.dmg

Distribution:

GitHub Releases

⸻

VS Code Extension

Artifact:

.vsix

Initial Distribution:

GitHub Releases

Marketplace publishing is not part of the MVP.

⸻

JetBrains Plugin

Artifact:

.zip

Initial Distribution:

GitHub Releases

JetBrains Marketplace is not part of the MVP.

⸻

Shell Capture

Shell Capture is installed and managed by the desktop application.

Users should never install Shell Capture manually.

The desktop application is responsible for:

* installation
* update
* diagnostics
* removal

⸻

Versioning

Use Semantic Versioning.

Example:

v0.1.0
v0.2.0
v1.0.0

Every release uses one shared version across the entire ecosystem.

Desktop, plugins, and protocol should always remain compatible.

⸻

Release Flow

GitHub Releases is the source of truth.

Create Tag
↓
GitHub Actions
↓
Validate
↓
Build Desktop
↓
Package Extensions
↓
Upload Assets
↓
Publish Release

⸻

Validation

Before publishing a release, execute:

pnpm install
pnpm protocol:check
pnpm build
cargo check --manifest-path apps/desktop/native/Cargo.toml
pnpm jetbrains:test

A release must never skip validation.

⸻

Release Assets

Example:

Kivra_0.1.0_macOS_arm64.dmg
kivra-vscode-0.1.0.vsix
kivra-jetbrains-0.1.0.zip

⸻

Future Platforms

Future versions may support:

* Windows
* Linux

These platforms are outside the current MVP scope.

⸻

Release Principle

GitHub Releases is the single source of truth.

Every release represents one compatible Kivra ecosystem.

Desktop, IDE integrations, Shell Capture, and Protocol should evolve together and always remain version compatible.