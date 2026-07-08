import { Github, Loader2, RefreshCw } from "lucide-react";
import type { TFunction } from "i18next";

import { formatGithubRepositoryError } from "@/features/project/utils/github-project-format";
import { Button } from "@/shared/ui/button";
import { Skeleton } from "@/shared/ui/skeleton";

type githubImportEmptyStateProps = {
  detail: string;
  title: string;
};

export const GithubImportEmptyState = ({
  detail,
  title
}: githubImportEmptyStateProps) => (
  <div className="flex min-h-[260px] items-center justify-center p-6 text-center">
    <div className="max-w-sm">
      <div className="mx-auto grid h-10 w-10 place-items-center rounded-md border bg-muted">
        <Github className="h-5 w-5" />
      </div>
      <div className="mt-3 text-sm font-medium">{title}</div>
      <p className="mt-2 text-xs leading-5 text-muted-foreground">{detail}</p>
    </div>
  </div>
);

export const GithubRepositorySkeletonList = () => (
  <div className="space-y-3 p-3">
    {Array.from({ length: 4 }).map((_, index) => (
      <div
        key={index}
        className="grid grid-cols-[1fr_auto] gap-4 rounded-md border p-3"
      >
        <div className="min-w-0">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="mt-2 h-3 w-full max-w-[320px]" />
          <div className="mt-3 flex gap-2">
            <Skeleton className="h-5 w-14" />
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-5 w-12" />
          </div>
        </div>
        <Skeleton className="h-9 w-20" />
      </div>
    ))}
  </div>
);

type githubRepositoryErrorStateProps = {
  error: Error;
  isReconnecting: boolean;
  labels: {
    reconnect: string;
  };
  needsReconnect: boolean;
  onReconnect: () => void;
  t: TFunction;
};

export const GithubRepositoryErrorState = ({
  error,
  isReconnecting,
  labels,
  needsReconnect,
  onReconnect,
  t
}: githubRepositoryErrorStateProps) => (
  <div className="p-4">
    <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3">
      <div className="text-xs font-medium text-destructive">
        {formatGithubRepositoryError(error, t)}
      </div>
      {needsReconnect && (
        <div className="mt-3">
          <Button
            type="button"
            size="sm"
            variant="secondary"
            disabled={isReconnecting}
            onClick={onReconnect}
          >
            {isReconnecting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            {labels.reconnect}
          </Button>
        </div>
      )}
    </div>
  </div>
);
