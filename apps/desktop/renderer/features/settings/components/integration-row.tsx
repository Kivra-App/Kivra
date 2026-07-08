import { Download, RefreshCw, Trash2 } from "lucide-react";
import type { ReactNode } from "react";

import { StatusBadge } from "@/features/settings/components/status-badge";
import type { integrationInstallResult } from "@/features/settings";
import { Button } from "@/shared/ui/button";

type integrationRowProps = {
  buttonLabel: string;
  children: ReactNode;
  description: string;
  detail?: string;
  error: Error | null;
  errorFallback: string;
  icon: ReactNode;
  installingLabel: string;
  isInstalled: boolean;
  isPending: boolean;
  onInstall: () => void;
  onSecondaryAction?: () => void;
  result?: integrationInstallResult;
  resultMessage?: string;
  secondaryButtonLabel?: string;
  statusLabel: string;
  title: string;
};

export const IntegrationRow = ({
  buttonLabel,
  children,
  description,
  detail,
  error,
  errorFallback,
  icon,
  installingLabel,
  isInstalled,
  isPending,
  onInstall,
  onSecondaryAction,
  result,
  resultMessage,
  secondaryButtonLabel,
  statusLabel,
  title
}: integrationRowProps) => (
  <article className="rounded-md border bg-card p-4">
    <div className="grid grid-cols-[40px_minmax(0,1fr)_auto] gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border bg-background text-foreground">
        {icon}
      </div>

      <div className="min-w-0 space-y-3">
        <div className="min-w-0">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <h2 className="text-sm font-semibold">{title}</h2>
            <StatusBadge isInstalled={isInstalled} label={statusLabel} />
          </div>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-muted-foreground">
            {description}
          </p>
        </div>

        {children}
        {detail && (
          <code className="block overflow-hidden text-ellipsis whitespace-nowrap rounded-md border bg-background px-2.5 py-2 text-xs text-muted-foreground">
            {detail}
          </code>
        )}
        {result && (
          <div className="rounded-md border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-700">
            {resultMessage}
          </div>
        )}
        {error && (
          <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
            {error.message || errorFallback}
          </div>
        )}
      </div>

      <div className="flex w-[220px] flex-col items-stretch gap-2">
        <Button
          type="button"
          onClick={onInstall}
          disabled={isPending}
          size="sm"
          className="w-full"
        >
          {isPending ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          <span>{isPending ? installingLabel : buttonLabel}</span>
        </Button>
        {secondaryButtonLabel && onSecondaryAction && (
          <Button
            type="button"
            variant="danger"
            onClick={onSecondaryAction}
            disabled={isPending}
            size="sm"
            className="w-full"
          >
            <Trash2 className="h-4 w-4" />
            <span>{secondaryButtonLabel}</span>
          </Button>
        )}
      </div>
    </div>
  </article>
);
