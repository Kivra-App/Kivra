import {
  Check,
  Clock3,
  Download,
  GitBranch,
  Github,
  Loader2,
  Lock
} from "lucide-react";
import { useTranslation } from "react-i18next";

import type { githubRepository } from "@/features/project/services/github-project-service";
import { formatUpdatedAt } from "@/features/project/utils/github-project-format";
import { Button } from "@/shared/ui/button";

type githubRepositoryRowProps = {
  isImported: boolean;
  isImporting: boolean;
  onImport: () => void;
  repo: githubRepository;
};

export const GithubRepositoryRow = ({
  isImported,
  isImporting,
  onImport,
  repo
}: githubRepositoryRowProps) => {
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
