import type { resolutionNote } from "@/features/docs";
import type { project } from "@/features/project";
import type { runResult, runStatus } from "@/features/run";

type syncedProjectRow = {
  branch: string;
  created_at: string;
  framework: string;
  id: string;
  name: string;
  package_manager: string;
  repository_url: string | null;
  runtime: string;
};

type syncedLogRow = {
  content: string;
  level: string;
};

type syncedErrorRow = {
  column_number: number | null;
  created_at: string;
  error_code: string;
  file_path: string | null;
  id: string;
  line_number: number | null;
  message: string;
  project_id: string;
  run_id: string;
  stack_trace: string;
};

type syncedRunRow = {
  command: string;
  created_at: string;
  duration: number;
  errors: syncedErrorRow[] | null;
  id: string;
  logs: syncedLogRow[] | null;
  project_id: string;
  status: string;
};

type syncedErrorNoteRow = {
  content: string;
  created_at: string;
  error_id: string | null;
  errors: unknown;
  id: string;
  kind: string;
};

type syncedProjectNoteRow = {
  content: string;
  created_at: string;
  id: string;
  kind: string;
  project_id: string | null;
};

export const mapSyncedProject = (item: syncedProjectRow): project => ({
  id: item.id,
  name: item.name,
  path: item.repository_url ?? item.name,
  runtime: item.runtime,
  framework: item.framework,
  packageManager: item.package_manager,
  branch: item.branch,
  repositoryUrl: item.repository_url,
  createdAt: item.created_at,
  source: item.repository_url ? "github" : "local",
  tree: {
    id: item.id,
    name: item.name,
    path: item.repository_url ?? item.name,
    type: "folder"
  }
});

export const mapSyncedRun = (item: syncedRunRow): runResult => {
  const logs = item.logs ?? [];
  const stdout = logs
    .filter((log) => log.level === "INFO")
    .map((log) => log.content)
    .join("\n");
  const stderr = logs
    .filter((log) => log.level === "ERROR")
    .map((log) => log.content)
    .join("\n");

  return {
    id: item.id,
    projectId: item.project_id,
    command: item.command,
    status: normalizeRunStatus(item.status),
    duration: item.duration,
    stdout,
    stderr,
    exitCode: item.status === "SUCCESS" ? 0 : 1,
    createdAt: item.created_at,
    errors: (item.errors ?? []).map((error) => ({
      id: error.id,
      projectId: error.project_id,
      runId: error.run_id,
      errorCode: error.error_code,
      message: error.message,
      filePath: error.file_path,
      lineNumber: error.line_number,
      columnNumber: error.column_number,
      stackTrace: error.stack_trace,
      createdAt: error.created_at
    }))
  };
};

export const mapSyncedErrorNote = (
  item: syncedErrorNoteRow,
  projectId: string
): resolutionNote => ({
  id: item.id,
  errorId: item.error_id,
  projectId,
  content: item.content,
  kind: "error",
  createdAt: item.created_at,
  updatedAt: item.created_at
});

const normalizeRunStatus = (status: string): runStatus => {
  if (status === "SUCCESS" || status === "RUNNING") {
    return status;
  }

  return "FAILED";
};

export const mapSyncedProjectNote = (
  item: syncedProjectNoteRow,
  projectId: string
): resolutionNote => ({
  id: item.id,
  errorId: null,
  projectId,
  content: item.content,
  kind: "project",
  createdAt: item.created_at,
  updatedAt: item.created_at
});
