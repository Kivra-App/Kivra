import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Loader2, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";

import type { project } from "@/features/project/types/project";
import { useDeleteProject } from "@/features/project/hooks/use-projects";
import { useProjectStore } from "@/features/project/stores/project-store";
import { Button } from "@/shared/ui/button";
import { Skeleton } from "@/shared/ui/skeleton";

type projectTableProps = {
  emptyMessage?: string;
  isLoading?: boolean;
  projects: project[];
};

export const ProjectTable = ({
  emptyMessage,
  isLoading = false,
  projects
}: projectTableProps) => {
  const { t } = useTranslation();
  const deleteProject = useDeleteProject();
  const setSelectedProjectId = useProjectStore((store) => store.setSelectedProjectId);

  const handleDeleteProject = (project: project) => {
    const shouldDelete = window.confirm(
      t("project.deleteConfirm", { name: project.name })
    );

    if (!shouldDelete) {
      return;
    }

    deleteProject.mutate(project.id);
  };

  if (isLoading) {
    return (
      <div className="overflow-hidden rounded-md border bg-card">
        <table className="w-full border-collapse text-left text-sm">
          <thead className="bg-muted text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-3 py-2 font-medium">{t("project.tableProject")}</th>
              <th className="px-3 py-2 font-medium">{t("project.runtime")}</th>
              <th className="px-3 py-2 font-medium">{t("project.framework")}</th>
              <th className="px-3 py-2 font-medium">{t("project.packageManager")}</th>
              <th className="px-3 py-2 font-medium">{t("project.branch")}</th>
              <th className="px-3 py-2 font-medium">{t("project.source")}</th>
              <th className="w-20 px-3 py-2 text-right font-medium">
                {t("project.actions")}
              </th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 4 }).map((_, index) => (
              <tr key={index} className="h-14 border-t">
                <td className="px-3 py-2">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="mt-2 h-3 w-64" />
                </td>
                <td className="px-3 py-2"><Skeleton className="h-4 w-16" /></td>
                <td className="px-3 py-2"><Skeleton className="h-4 w-16" /></td>
                <td className="px-3 py-2"><Skeleton className="h-4 w-20" /></td>
                <td className="px-3 py-2"><Skeleton className="h-4 w-16" /></td>
                <td className="px-3 py-2"><Skeleton className="h-4 w-12" /></td>
                <td className="px-3 py-2 text-right">
                  <Skeleton className="ml-auto h-8 w-8" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="rounded-md border bg-card p-4 text-sm text-muted-foreground">
        {emptyMessage ?? t("project.empty")}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      className="overflow-hidden rounded-md border bg-card"
    >
      <table className="w-full border-collapse text-left text-sm">
        <thead className="bg-muted text-xs uppercase text-muted-foreground">
          <tr>
            <th className="px-3 py-2 font-medium">{t("project.tableProject")}</th>
            <th className="px-3 py-2 font-medium">{t("project.runtime")}</th>
            <th className="px-3 py-2 font-medium">{t("project.framework")}</th>
            <th className="px-3 py-2 font-medium">{t("project.packageManager")}</th>
            <th className="px-3 py-2 font-medium">{t("project.branch")}</th>
            <th className="px-3 py-2 font-medium">{t("project.source")}</th>
            <th className="w-20 px-3 py-2 text-right font-medium">
              {t("project.actions")}
            </th>
          </tr>
        </thead>
        <tbody>
          {projects.map((project, index) => (
            <motion.tr
              key={project.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.18, delay: index * 0.025, ease: "easeOut" }}
              className="h-10 border-t"
            >
              <td className="px-3 py-2">
                <Link
                  to="/projects/$projectId"
                  params={{ projectId: project.id }}
                  search={{ tab: "explorer" }}
                  onClick={() => setSelectedProjectId(project.id)}
                  className="font-medium text-foreground hover:underline"
                >
                  {project.name}
                </Link>
                <div className="text-xs text-muted-foreground">{project.path}</div>
              </td>
              <td className="px-3 py-2">{project.runtime}</td>
              <td className="px-3 py-2">{project.framework}</td>
              <td className="px-3 py-2">{project.packageManager}</td>
              <td className="px-3 py-2 font-mono text-xs">{project.branch}</td>
              <td className="px-3 py-2">
                {project.source === "github"
                  ? t("project.githubSource")
                  : t("project.localSource")}
              </td>
              <td className="px-3 py-2 text-right">
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  title={t("project.deleteProject")}
                  aria-label={t("project.deleteProject")}
                  disabled={deleteProject.isPending}
                  onClick={() => handleDeleteProject(project)}
                >
                  {deleteProject.isPending &&
                  deleteProject.variables === project.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4 text-destructive" />
                  )}
                </Button>
              </td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </motion.div>
  );
};
