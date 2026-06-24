import {
  Check,
  Clock3,
  Download,
  GitBranch,
  Github,
  Loader2,
  Lock,
  RefreshCw,
  Search
} from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

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
  const importGithubProject = useImportGithubProject();
  const hasRequestedRepositories =
    githubRepositories.isFetched || githubRepositories.isFetching;
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

      {hasRequestedRepositories && (
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
          <div className="flex min-h-[260px] items-center justify-center p-6 text-center">
            <div className="max-w-sm">
              <div className="mx-auto grid h-10 w-10 place-items-center rounded-md border bg-muted">
                <Github className="h-5 w-5" />
              </div>
              <div className="mt-3 text-sm font-medium">
                {t("project.githubImportEmptyTitle")}
              </div>
              <p className="mt-2 text-xs leading-5 text-muted-foreground">
                {t("project.githubImportEmptyDetail")}
              </p>
            </div>
          </div>
        )}

        {githubRepositories.isFetching && (
          <div className="flex items-center gap-2 p-4 text-xs text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            {t("project.loadingGithubProjects")}
          </div>
        )}

        {githubRepositories.error instanceof Error && (
          <p className="p-4 text-xs text-destructive">
            {githubRepositories.error.message === "GITHUB_TOKEN_REQUIRED"
              ? t("project.githubTokenRequired")
              : githubRepositories.error.message}
          </p>
        )}

        {!githubRepositories.isFetching &&
          hasRequestedRepositories &&
          filteredRepositories.length > 0 && (
            <div className="max-h-[360px] overflow-auto p-2">
              {filteredRepositories.map((repo) => (
                <RepositoryRow
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
          repositories.length > 0 &&
          filteredRepositories.length === 0 && (
            <p className="p-4 text-xs text-muted-foreground">
              {t("project.githubSearchEmpty")}
            </p>
          )}

        {!githubRepositories.isFetching &&
          hasRequestedRepositories &&
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

type repositoryRowProps = {
  isImported: boolean;
  isImporting: boolean;
  onImport: () => void;
  repo: githubRepository;
};

const RepositoryRow = ({
  isImported,
  isImporting,
  onImport,
  repo
}: repositoryRowProps) => {
  const { t } = useTranslation();

  return (
    <article className="grid grid-cols-[1fr_auto] gap-4 rounded-md border border-transparent p-3 transition hover:border-border hover:bg-muted/60">
      <div className="min-w-0">
        <div className="flex min-w-0 items-center gap-2">
          <Github className="h-4 w-4 shrink-0 text-muted-foreground" />
          <div className="truncate text-sm font-semibold">{repo.fullName}</div>
          {repo.private && (
            <span className="inline-flex shrink-0 items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] text-muted-foreground">
              <Lock className="h-3 w-3" />
              {t("project.githubPrivate")}
            </span>
          )}
        </div>
        <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
          {repo.description ?? repo.htmlUrl}
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1 rounded bg-background px-2 py-1 font-mono">
            <GitBranch className="h-3 w-3" />
            {repo.defaultBranch}
          </span>
          <span className="rounded bg-background px-2 py-1 font-mono">
            {repo.language ?? t("project.githubRepository")}
          </span>
          <span className="inline-flex items-center gap-1 rounded bg-background px-2 py-1">
            <Clock3 className="h-3 w-3" />
            {formatUpdatedAt(repo.updatedAt)}
          </span>
        </div>
      </div>
      <div className="flex items-center">
        <Button
          type="button"
          size="sm"
          variant={isImported ? "secondary" : "primary"}
          disabled={isImported || isImporting}
          onClick={onImport}
        >
          {isImported ? (
            <Check className="h-4 w-4" />
          ) : isImporting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          {isImported ? t("project.githubImported") : t("project.githubImport")}
        </Button>
      </div>
    </article>
  );
};

const formatUpdatedAt = (updatedAt: string) => {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric"
  }).format(new Date(updatedAt));
};
