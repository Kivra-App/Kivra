import { BookOpenText, FolderGit2, GitBranch, Loader2 } from "lucide-react";

import { CommandRunner } from "@/features/run";
import type { runResult } from "@/features/run";
import type { project } from "@/features/project/types/project";
import type { projectTab } from "@/features/project/components/project-detail-tabs";
import { ProjectTabNav } from "@/features/project/components/project-detail-tabs";
import { Button } from "@/shared/ui/button";
import { Select, type selectOption } from "@/shared/ui/select";

type projectDetailHeaderProps = {
  activeTab: projectTab;
  branchOptions: selectOption[];
  connectLocalFolderError: Error | null;
  isBranchLoading: boolean;
  isConnectLocalFolderPending: boolean;
  labels: {
    branch: string;
    connectLocalFolder: string;
    framework: string;
    githubSource: string;
    localSource: string;
    openMemory: string;
    package: string;
    runtime: string;
    source: string;
  };
  onBranchChange: (branch: string) => void;
  onConnectLocalFolder: () => void;
  onRunComplete: (result: runResult) => void;
  onRunError: () => void;
  onRunUpdate: (result: runResult) => void;
  onTabChange: (tab: projectTab) => void;
  project: project;
  tabLabel: (tab: projectTab) => string;
};

export const ProjectDetailHeader = ({
  activeTab,
  branchOptions,
  connectLocalFolderError,
  isBranchLoading,
  isConnectLocalFolderPending,
  labels,
  onBranchChange,
  onConnectLocalFolder,
  onRunComplete,
  onRunError,
  onRunUpdate,
  onTabChange,
  project,
  tabLabel
}: projectDetailHeaderProps) => (
  <header className="border-b bg-card px-4 py-3">
    <div className="flex items-start justify-between gap-4">
      <div>
        <h1 className="text-lg font-semibold">{project.name}</h1>
        <p className="font-mono text-xs text-muted-foreground">{project.path}</p>
      </div>
      <div className="grid grid-cols-5 gap-2 text-xs">
        <Metadata label={labels.runtime} value={project.runtime} />
        <Metadata label={labels.framework} value={project.framework} />
        <Metadata label={labels.package} value={project.packageManager} />
        {project.source === "github" ? (
          <BranchMetadata
            label={labels.branch}
            value={project.branch}
            isLoading={isBranchLoading}
            options={branchOptions}
            onChange={onBranchChange}
          />
        ) : (
          <Metadata label={labels.branch} value={project.branch} />
        )}
        <Metadata
          label={labels.source}
          value={
            project.source === "github"
              ? labels.githubSource
              : labels.localSource
          }
        />
      </div>
    </div>
    <div className="mt-3 flex items-center justify-between gap-4">
      <ProjectTabNav
        activeTab={activeTab}
        getLabel={tabLabel}
        onChange={onTabChange}
      />
      {project.source === "local" ? (
        <CommandRunner
          projectId={project.id}
          projectPath={project.path}
          onRunUpdate={onRunUpdate}
          onRunError={onRunError}
          onRunComplete={onRunComplete}
        />
      ) : (
        <div className="flex items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant={activeTab === "knowledge" ? "primary" : "secondary"}
            onClick={() => onTabChange("knowledge")}
          >
            <BookOpenText className="h-4 w-4" />
            {labels.openMemory}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            disabled={isConnectLocalFolderPending}
            onClick={onConnectLocalFolder}
          >
            {isConnectLocalFolderPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FolderGit2 className="h-4 w-4" />
            )}
            {labels.connectLocalFolder}
          </Button>
        </div>
      )}
    </div>
    {connectLocalFolderError && (
      <p className="mt-2 text-xs text-destructive">
        {connectLocalFolderError.message}
      </p>
    )}
  </header>
);

type metadataProps = {
  label: string;
  value: string;
};

type branchMetadataProps = {
  isLoading: boolean;
  label: string;
  onChange: (branch: string) => void;
  options: selectOption[];
  value: string;
};

const BranchMetadata = ({
  isLoading,
  label,
  onChange,
  options,
  value
}: branchMetadataProps) => {
  return (
    <div className="min-w-[110px] rounded-md border bg-background px-3 py-2">
      <div className="text-muted-foreground">{label}</div>
      <Select
        aria-label={label}
        value={value}
        options={options}
        icon={<GitBranch className="h-4 w-4 shrink-0 text-muted-foreground" />}
        isLoading={isLoading}
        size="sm"
        className="mt-1 h-7 w-full border-transparent bg-muted px-2"
        selectClassName="font-mono"
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
};

const Metadata = ({ label, value }: metadataProps) => {
  return (
    <div className="min-w-[110px] rounded-md border bg-background px-3 py-2">
      <div className="text-muted-foreground">{label}</div>
      <div className="mt-1 truncate font-mono">{value}</div>
    </div>
  );
};
