import { KnowledgeList, ProjectMemo, ResolutionNotes } from "@/features/docs";
import { ErrorTable, type detectedError } from "@/features/error";
import { ProjectExplorer } from "@/features/project/components/project-explorer";
import { ProjectFileViewer } from "@/features/project/components/project-file-viewer";
import type { project } from "@/features/project/types/project";
import type { projectTab } from "@/features/project/components/project-detail-tabs";
import { ProjectSettingsPanel } from "@/features/project/components/project-settings-panel";
import { readProjectDirectory } from "@/features/project/services/project-directory-service";
import { RunHistoryTable, RunLogPanel } from "@/features/run";
import type { runResult } from "@/features/run";

type projectDetailContentProps = {
  activeTab: projectTab;
  errors: detectedError[];
  labels: {
    deleteProject: string;
    deleteProjectDetail: string;
    settingsMessage: string;
  };
  isDeleting: boolean;
  notesVersion: number;
  onDeleteProject: () => void;
  onNoteSaved: () => void;
  onSelectError: (error: detectedError | null) => void;
  onSelectFile: (filePath: string | null) => void;
  onSelectRun: (run: runResult | null) => void;
  project: project;
  resolvedErrorIds: Set<string>;
  runs: runResult[];
  selectedError: detectedError | null;
  selectedFilePath: string | null;
  selectedRun: runResult | null;
};

export const ProjectDetailContent = ({
  activeTab,
  errors,
  isDeleting,
  labels,
  notesVersion,
  onDeleteProject,
  onNoteSaved,
  onSelectError,
  onSelectFile,
  onSelectRun,
  project,
  resolvedErrorIds,
  runs,
  selectedError,
  selectedFilePath,
  selectedRun
}: projectDetailContentProps) => {
  if (activeTab === "explorer") {
    return (
      <div className="grid h-full min-h-0 grid-cols-[minmax(280px,360px)_1fr] gap-4">
        <ProjectExplorer
          tree={project.tree}
          selectedFilePath={selectedFilePath}
          onLoadDirectory={
            project.source === "local"
              ? (directoryPath) =>
                  readProjectDirectory({
                    directoryPath,
                    projectPath: project.path
                  })
              : undefined
          }
          onSelectFile={onSelectFile}
        />
        <ProjectFileViewer filePath={selectedFilePath} project={project} />
      </div>
    );
  }

  if (activeTab === "runs") {
    return (
      <div className="grid h-full min-h-0 gap-4 xl:grid-cols-[320px_minmax(0,1fr)]">
        <RunHistoryTable
          runs={runs}
          selectedRun={selectedRun}
          onSelectRun={onSelectRun}
        />
        <RunLogPanel run={selectedRun} />
      </div>
    );
  }

  if (activeTab === "errors") {
    return (
      <div className="grid gap-4">
        <ErrorTable
          errors={errors}
          resolvedErrorIds={resolvedErrorIds}
          selectedError={selectedError}
          onSelectError={onSelectError}
        />
        <ResolutionNotes
          error={selectedError}
          onNoteSaved={onNoteSaved}
          projectId={project.id}
        />
      </div>
    );
  }

  if (activeTab === "knowledge") {
    return (
      <div className="grid gap-4">
        <ProjectMemo onMemoSaved={onNoteSaved} projectId={project.id} />
        <KnowledgeList
          errors={errors}
          refreshKey={notesVersion}
          projectId={project.id}
        />
      </div>
    );
  }

  return (
    <ProjectSettingsPanel
      deleteDetail={labels.deleteProjectDetail}
      deleteLabel={labels.deleteProject}
      isDeleting={isDeleting}
      message={labels.settingsMessage}
      onDelete={onDeleteProject}
    />
  );
};
