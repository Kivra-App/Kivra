import {
  Download,
  Github,
  Loader2,
  RefreshCw,
  Search
} from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { useGithubLogin } from "@/features/auth";
import {
  GithubImportEmptyState,
  GithubRepositoryErrorState,
  GithubRepositorySkeletonList
} from "@/features/project/components/github-import-states";
import { GithubRepositoryRow } from "@/features/project/components/github-repository-row";
import { useGithubRepositories } from "@/features/project/hooks/use-github-repositories";
import { useImportGithubProject } from "@/features/project/hooks/use-projects";
import type { githubRepository } from "@/features/project/services/github-project-service";
import { Button } from "@/shared/ui/button";

type githubProjectImportProps = {
  importedRepositoryUrls: Set<string>;
};

export const GitHubProjectImport = ({
  importedRepositoryUrls
}: githubProjectImportProps) => {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const [activeRepoId, setActiveRepoId] = useState<number | null>(null);
  const githubRepositories = useGithubRepositories();
  const githubLogin = useGithubLogin();
  const importGithubProject = useImportGithubProject();
  const hasRequestedRepositories =
    githubRepositories.isFetched || githubRepositories.isFetching;
  const repositoryError =
    githubRepositories.error instanceof Error ? githubRepositories.error : null;
  const hasRepositoryError = Boolean(repositoryError);
  const needsGithubReconnect = repositoryError?.message === "GITHUB_TOKEN_REQUIRED";
  const repositories = githubRepositories.data ?? [];
  const filteredRepositories = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return repositories;
    }

    return repositories.filter((repo) =>
      [
        repo.fullName,
        repo.description,
        repo.defaultBranch,
        repo.language
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery)
    );
  }, [query, repositories]);

  const handleLoadRepositories = () => {
    void githubRepositories.refetch();
  };

  const handleReconnectGithub = () => {
    githubLogin.mutate(undefined, {
      onSuccess: () => {
        void githubRepositories.refetch();
      }
    });
  };

  const handleImportRepository = (repo: githubRepository) => {
    setActiveRepoId(repo.id);
    importGithubProject.mutate(repo, {
      onSettled: () => setActiveRepoId(null)
    });
  };

  return (
    <section className="rounded-md border bg-card">
      <div className="flex items-start justify-between gap-4 border-b p-4">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Github className="h-4 w-4" />
            {t("project.githubImportTitle")}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {t("project.githubImportDetail")}
          </p>
        </div>
        <Button
          type="button"
          variant={hasRequestedRepositories ? "secondary" : "primary"}
          disabled={githubRepositories.isFetching}
          onClick={handleLoadRepositories}
        >
          {githubRepositories.isFetching ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : hasRequestedRepositories ? (
            <RefreshCw className="h-4 w-4" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          {hasRequestedRepositories
            ? t("project.refreshGithubProjects")
            : t("project.loadGithubProjects")}
        </Button>
      </div>

      {hasRequestedRepositories && !hasRepositoryError && (
        <div className="border-b p-3">
          <div className="flex h-9 items-center gap-2 rounded-md border bg-background px-3">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t("project.githubSearchPlaceholder")}
              className="h-full min-w-0 flex-1 bg-transparent text-sm outline-none"
            />
            <span className="font-mono text-xs text-muted-foreground">
              {filteredRepositories.length}/{repositories.length}
            </span>
          </div>
        </div>
      )}

      <div className="min-h-[260px]">
        {!hasRequestedRepositories && (
          <GithubImportEmptyState
            title={t("project.githubImportEmptyTitle")}
            detail={t("project.githubImportEmptyDetail")}
          />
        )}

        {githubRepositories.isFetching && <GithubRepositorySkeletonList />}

        {repositoryError && (
          <GithubRepositoryErrorState
            error={repositoryError}
            isReconnecting={githubLogin.isPending}
            labels={{ reconnect: t("project.githubReconnect") }}
            needsReconnect={needsGithubReconnect}
            onReconnect={handleReconnectGithub}
            t={t}
          />
        )}

        {!githubRepositories.isFetching &&
          hasRequestedRepositories &&
          !hasRepositoryError &&
          filteredRepositories.length > 0 && (
            <div className="max-h-[360px] overflow-auto p-2">
              {filteredRepositories.map((repo) => (
                <GithubRepositoryRow
                  key={repo.id}
                  repo={repo}
                  isImported={importedRepositoryUrls.has(repo.htmlUrl)}
                  isImporting={
                    importGithubProject.isPending && activeRepoId === repo.id
                  }
                  onImport={() => handleImportRepository(repo)}
                />
              ))}
            </div>
          )}

        {!githubRepositories.isFetching &&
          hasRequestedRepositories &&
          !hasRepositoryError &&
          repositories.length > 0 &&
          filteredRepositories.length === 0 && (
            <p className="p-4 text-xs text-muted-foreground">
              {t("project.githubSearchEmpty")}
            </p>
          )}

        {!githubRepositories.isFetching &&
          hasRequestedRepositories &&
          !hasRepositoryError &&
          repositories.length === 0 && (
            <p className="p-4 text-xs text-muted-foreground">
              {t("project.githubProjectsEmpty")}
            </p>
          )}
      </div>

      {importGithubProject.error instanceof Error && (
        <p className="border-t p-3 text-xs text-destructive">
          {importGithubProject.error.message}
        </p>
      )}
    </section>
  );
};
