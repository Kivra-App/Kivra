import { useNavigate, useParams, useSearch } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { getResolvedErrorIds } from "@/features/docs/services/note-service";
import type { detectedError } from "@/features/error";
import {
  GithubProjectMemoryBanner,
  ProjectDetailContent,
  ProjectDetailHeader,
  ProjectDetailSkeleton,
  ProjectTabSummary,
  type projectTab,
  useConnectGithubProjectToLocalFolder,
  useDeleteProject,
  useGithubProjectBranches,
  useProject,
  useSwitchGithubProjectBranch
} from "@/features/project";
import { selectProjectFolder } from "@/features/project/services/project-dialog-service";
import { useProjectStore } from "@/features/project/stores/project-store";
import { useRunHistory } from "@/features/run";
import type { runResult } from "@/features/run";
import type { selectOption } from "@/shared/ui/select";

export const ProjectRoute = () => {
  const { t } = useTranslation();
  const { projectId } = useParams({ from: "/projects/$projectId" });
  const search = useSearch({ from: "/projects/$projectId" });
  const navigate = useNavigate({ from: "/projects/$projectId" });
  const project = useProject(projectId);
  const connectLocalFolder = useConnectGithubProjectToLocalFolder();
  const deleteProject = useDeleteProject();
  const switchGithubBranch = useSwitchGithubProjectBranch();
  const setSelectedProjectId = useProjectStore((store) => store.setSelectedProjectId);
  const activeTab = search.tab;
  const { runs, addRun } = useRunHistory(
    projectId,
    project.data?.source === "local" ? project.data.path : null
  );
  const [liveRun, setLiveRun] = useState<runResult | null>(null);
  const [selectedRun, setSelectedRun] = useState<runResult | null>(null);
  const [selectedFilePath, setSelectedFilePath] = useState<string | null>(null);
  const [selectedError, setSelectedError] = useState<detectedError | null>(null);
  const [notesVersion, setNotesVersion] = useState(0);
  const errors = useMemo<detectedError[]>(
    () => runs.flatMap((run) => run.errors),
    [runs]
  );
  const resolvedErrorIds = useMemo(
    () => getResolvedErrorIds(projectId),
    [projectId, notesVersion]
  );
  const isGithubProject = project.data?.source === "github";
  const githubBranches = useGithubProjectBranches({
    enabled: Boolean(isGithubProject),
    projectId
  });

  const visibleRuns = useMemo(
    () =>
      liveRun
        ? [liveRun, ...runs.filter((run) => run.id !== liveRun.id)]
        : runs,
    [liveRun, runs]
  );

  useEffect(() => {
    setSelectedProjectId(projectId);
  }, [projectId, setSelectedProjectId]);

  useEffect(() => {
    setSelectedRun((currentRun) => {
      if (!currentRun) {
        return visibleRuns[0] ?? null;
      }

      return (
        visibleRuns.find((run) => run.id === currentRun.id) ??
        visibleRuns[0] ??
        null
      );
    });
  }, [visibleRuns]);

  useEffect(() => {
    setSelectedError(errors[0] ?? null);
  }, [errors]);

  const handleTabChange = (tab: projectTab) => {
    void navigate({ search: { tab } });
  };

  const handleConnectLocalFolder = async () => {
    const selectedPath = await selectProjectFolder();

    if (!selectedPath) {
      return;
    }

    connectLocalFolder.mutate({
      projectId,
      projectPath: selectedPath
    });
  };

  const handleBranchChange = (branch: string) => {
    if (!branch || branch === project.data?.branch) {
      return;
    }

    setSelectedFilePath(null);
    switchGithubBranch.mutate({
      branch,
      projectId
    });
  };

  const handleDeleteProject = () => {
    if (!project.data) {
      return;
    }

    const shouldDelete = window.confirm(
      t("project.deleteConfirm", { name: project.data.name })
    );

    if (!shouldDelete) {
      return;
    }

    deleteProject.mutate(project.data.id, {
      onSuccess: () => {
        void navigate({ to: "/", search: {} });
      }
    });
  };

  if (project.isLoading) {
    return <ProjectDetailSkeleton />;
  }

  if (!project.data) {
    return <div className="p-6 text-sm text-muted-foreground">{t("project.notFound")}</div>;
  }

  const projectData = project.data;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      className="flex h-screen flex-col overflow-hidden"
    >
      <ProjectDetailHeader
        activeTab={activeTab}
        branchOptions={getBranchOptions({
          currentBranch: projectData.branch,
          branches: githubBranches.data ?? []
        })}
        connectLocalFolderError={
          connectLocalFolder.error instanceof Error ? connectLocalFolder.error : null
        }
        isBranchLoading={githubBranches.isLoading || switchGithubBranch.isPending}
        isConnectLocalFolderPending={connectLocalFolder.isPending}
        labels={{
          branch: t("project.branch"),
          connectLocalFolder: t("project.connectLocalFolder"),
          framework: t("project.framework"),
          githubSource: t("project.githubSource"),
          localSource: t("project.localSource"),
          openMemory: t("project.openMemory"),
          package: t("project.package"),
          runtime: t("project.runtime"),
          source: t("project.source")
        }}
        onBranchChange={handleBranchChange}
        onConnectLocalFolder={() => void handleConnectLocalFolder()}
        onRunUpdate={(result) => {
          setLiveRun(result);
          setSelectedRun((currentRun) =>
            !currentRun || currentRun.id === result.id ? result : currentRun
          );
          void navigate({ search: { tab: "runs" } });
        }}
        onRunError={() => {
          setLiveRun(null);
        }}
        onRunComplete={(result) => {
          setLiveRun(null);
          addRun(result);
          setSelectedRun(result);
          void navigate({ search: { tab: "runs" } });
        }}
        onTabChange={handleTabChange}
        project={projectData}
        tabLabel={(tab) => t(`project.tabs.${tab}`)}
      />

      <section className="flex min-h-0 flex-1 flex-col overflow-hidden p-4">
        {projectData.source === "github" && (
          <GithubProjectMemoryBanner
            title={t("project.githubMemoryTitle")}
            detail={t("project.githubMemoryDetail")}
            error={
              switchGithubBranch.error instanceof Error
                ? switchGithubBranch.error
                : null
            }
          />
        )}
        <ProjectTabSummary
          title={t(`project.tabs.${activeTab}`)}
          description={t(`project.tabDescriptions.${activeTab}`)}
        />
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="min-h-0 flex-1"
          >
            <ProjectDetailContent
              activeTab={activeTab}
              errors={errors}
              isDeleting={deleteProject.isPending}
              labels={{
                deleteProject: t("project.deleteProject"),
                deleteProjectDetail: t("project.deleteProjectDetail"),
                settingsMessage: t("project.settingsMessage")
              }}
              notesVersion={notesVersion}
              onDeleteProject={handleDeleteProject}
              onNoteSaved={() =>
                setNotesVersion((currentVersion) => currentVersion + 1)
              }
              onSelectError={setSelectedError}
              onSelectFile={setSelectedFilePath}
              onSelectRun={setSelectedRun}
              project={projectData}
              resolvedErrorIds={resolvedErrorIds}
              runs={visibleRuns}
              selectedError={selectedError}
              selectedFilePath={selectedFilePath}
              selectedRun={selectedRun}
            />
          </motion.div>
        </AnimatePresence>
      </section>
    </motion.div>
  );
};

const getBranchOptions = ({
  branches,
  currentBranch
}: {
  branches: Array<{ name: string }>;
  currentBranch: string;
}): selectOption[] => {
  const branchNames = new Set([currentBranch, ...branches.map((branch) => branch.name)]);

  return Array.from(branchNames).map((branchName) => ({
    label: branchName,
    value: branchName
  }));
};
