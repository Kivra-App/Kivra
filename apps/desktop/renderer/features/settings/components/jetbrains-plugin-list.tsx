import { CheckCircle2, CircleAlert } from "lucide-react";

import type { jetBrainsPluginStatus } from "@/features/settings";

type jetBrainsPluginListProps = {
  emptyLabel: string;
  installedLabel: string;
  missingLabel: string;
  plugins: jetBrainsPluginStatus[];
};

export const JetBrainsPluginList = ({
  emptyLabel,
  installedLabel,
  missingLabel,
  plugins
}: jetBrainsPluginListProps) => {
  if (!plugins.length) {
    return (
      <div className="rounded-md border border-dashed bg-background px-3 py-2 text-xs text-muted-foreground">
        {emptyLabel}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-md border bg-background text-xs">
      {plugins.map((plugin) => (
        <div
          key={plugin.path}
          className="flex items-center justify-between gap-3 border-b px-3 py-2 last:border-b-0"
        >
          <span className="min-w-0 truncate font-medium text-foreground">
            {plugin.displayName}
          </span>
          <span className="flex shrink-0 items-center gap-1 text-muted-foreground">
            {plugin.installed ? (
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
            ) : (
              <CircleAlert className="h-3.5 w-3.5 text-amber-500" />
            )}
            {plugin.installed ? installedLabel : missingLabel}
          </span>
        </div>
      ))}
    </div>
  );
};
