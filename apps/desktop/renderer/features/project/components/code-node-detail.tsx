import { useTranslation } from "react-i18next";

import type { detailNode } from "@/features/project/components/code-node-viewer-utils";
import { getConnectedDetailNodes } from "@/features/project/components/code-node-viewer-utils";
import type { codeNode, codeNodeGraph } from "@/features/project/services/node-graph-service";
import { getFileName } from "@/features/project/services/node-graph-service";

type codeNodeDetailProps = {
  graph: codeNodeGraph;
  node: detailNode;
  visibleCodeNodes: codeNode[];
};

export const CodeNodeDetail = ({
  graph,
  node,
  visibleCodeNodes
}: codeNodeDetailProps) => {
  const { t } = useTranslation();
  const connectedNodes = getConnectedDetailNodes({
    graph,
    node,
    visibleCodeNodes
  });

  return (
    <aside className="min-h-0 overflow-auto bg-card p-3">
      <div className="text-xs font-medium uppercase text-muted-foreground">
        {t("explorer.nodeView.detail")}
      </div>
      <div className="mt-3 rounded-md border bg-background p-3">
        <div className="truncate text-sm font-semibold">{node.name}</div>
        <div className="mt-2 grid gap-1 font-mono text-[11px] text-muted-foreground">
          <div>{node.type}</div>
          <div className="truncate">{node.filePath}</div>
          <div>{t("explorer.nodeView.line", { line: node.lineNumber })}</div>
        </div>
      </div>
      <div className="mt-3">
        <div className="mb-2 text-xs font-medium text-muted-foreground">
          {t("explorer.nodeView.codePreview")}
        </div>
        <pre className="max-h-44 overflow-auto rounded-md border bg-background p-3 font-mono text-xs leading-5 text-muted-foreground">
          {node.codePreview || t("explorer.nodeView.fileOverview")}
        </pre>
      </div>
      <div className="mt-3">
        <div className="mb-2 text-xs font-medium text-muted-foreground">
          {t("explorer.nodeView.connections")}
        </div>
        <div className="space-y-1">
          {connectedNodes.length === 0 ? (
            <div className="rounded-md border bg-background p-3 text-xs text-muted-foreground">
              {t("explorer.nodeView.noConnections")}
            </div>
          ) : (
            connectedNodes.map((connection) => (
              <div
                key={connection.id}
                className="rounded-md border bg-background px-3 py-2"
              >
                <div className="truncate text-xs">{connection.name}</div>
                <div className="mt-1 font-mono text-[10px] text-muted-foreground">
                  {connection.type} · L{connection.lineNumber}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      <div className="mt-3 rounded-md border bg-background p-3 text-xs text-muted-foreground">
        {getFileName(graph.fileNode.filePath)} ·{" "}
        {t("explorer.nodeView.parsedNodes", { count: graph.totalNodeCount })}
      </div>
    </aside>
  );
};
