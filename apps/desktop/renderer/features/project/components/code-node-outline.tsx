import { Pin, Search } from "lucide-react";
import { useTranslation } from "react-i18next";

import type {
  codeNodeCategory,
  codeNodeGraph
} from "@/features/project/services/node-graph-service";
import { NODE_GROUPS } from "@/features/project/services/node-graph-service";
import { cn } from "@/shared/lib/utils";

type codeNodeOutlineProps = {
  expandedGroups: Set<codeNodeCategory>;
  focusNode: (nodeId: string) => void;
  graph: codeNodeGraph;
  pinnedGroups: Set<codeNodeCategory>;
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  toggleGroup: (category: codeNodeCategory) => void;
  togglePinnedGroup: (category: codeNodeCategory) => void;
};

export const CodeNodeOutline = ({
  expandedGroups,
  focusNode,
  graph,
  pinnedGroups,
  searchQuery,
  setSearchQuery,
  toggleGroup,
  togglePinnedGroup
}: codeNodeOutlineProps) => {
  const { t } = useTranslation();

  return (
    <aside className="min-h-0 overflow-hidden bg-card">
      <div className="border-b p-3">
        <div className="text-xs font-medium uppercase text-muted-foreground">
          {t("explorer.nodeView.outline")}
        </div>
        <button
          type="button"
          className="mt-2 w-full truncate text-left font-mono text-sm text-foreground"
          onClick={() => focusNode(graph.fileNode.id)}
        >
          {graph.fileNode.name}
        </button>
        <div className="relative mt-3">
          <Search className="absolute left-2 top-2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            className="h-8 w-full rounded-md border bg-background pl-8 pr-2 text-xs outline-none focus:border-primary"
            placeholder={t("explorer.nodeView.searchPlaceholder")}
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
          />
        </div>
      </div>
      <div className="h-[calc(100%-105px)] overflow-auto p-2">
        {NODE_GROUPS.map((group) => {
          const graphGroup = graph.groups.find((item) => item.id === group.id);
          const nodes = graphGroup?.nodes ?? [];
          const isExpanded = expandedGroups.has(group.id);

          return (
            <div key={group.id} className="mb-1">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  className={cn(
                    "flex h-8 min-w-0 flex-1 items-center justify-between rounded px-2 text-left text-xs transition hover:bg-muted",
                    isExpanded && "bg-muted text-foreground"
                  )}
                  onClick={() => {
                    toggleGroup(group.id);
                    focusNode(`category:${group.id}`);
                  }}
                >
                  <span>{t(`explorer.nodeView.groups.${group.id}`)}</span>
                  <span className="font-mono text-muted-foreground">
                    {nodes.length}
                  </span>
                </button>
                <button
                  type="button"
                  title={
                    pinnedGroups.has(group.id)
                      ? t("explorer.nodeView.unpinGroup")
                      : t("explorer.nodeView.pinGroup")
                  }
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded text-muted-foreground hover:bg-muted",
                    pinnedGroups.has(group.id) && "text-foreground"
                  )}
                  onClick={() => togglePinnedGroup(group.id)}
                >
                  <Pin className="h-3.5 w-3.5" />
                </button>
              </div>
              {isExpanded && (
                <div className="ml-2 border-l pl-2">
                  {nodes.slice(0, 12).map((node) => (
                    <button
                      key={node.id}
                      type="button"
                      className="block h-7 w-full truncate rounded px-2 text-left font-mono text-[11px] text-muted-foreground hover:bg-muted hover:text-foreground"
                      onClick={() => focusNode(node.id)}
                    >
                      {node.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </aside>
  );
};
