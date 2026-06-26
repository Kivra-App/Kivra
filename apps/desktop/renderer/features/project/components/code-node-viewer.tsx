import {
  Background,
  ReactFlow,
  type ReactFlowInstance
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {
  Crosshair,
  Expand,
  LocateFixed,
  Maximize2,
  Minus,
  Pin,
  Plus,
  RotateCcw,
  Search,
  Shrink,
  X
} from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";

import { useNodeGraph } from "@/features/project/hooks/use-node-graph";
import type { codeNode, codeNodeCategory, codeNodeGraph } from "@/features/project/services/node-graph-service";
import { NODE_GROUPS, getFileName } from "@/features/project/services/node-graph-service";
import type {
  nodeGraphFlowEdge,
  nodeGraphFlowNode
} from "@/features/project/services/node-layout-service";
import { getConnectedNodeIds } from "@/features/project/services/node-layout-service";
import { cn } from "@/shared/lib/utils";

type codeNodeViewerProps = {
  graph: codeNodeGraph;
};

type detailNode = {
  codePreview: string;
  connectedNodeIds: string[];
  filePath: string;
  id: string;
  lineNumber: number;
  name: string;
  type: string;
};

type graphFlowNode = nodeGraphFlowNode;
type graphFlowEdge = nodeGraphFlowEdge;

export const CodeNodeViewer = ({ graph }: codeNodeViewerProps) => {
  const { t } = useTranslation();
  const flowInstanceRef =
    useRef<ReactFlowInstance<graphFlowNode, graphFlowEdge> | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);
  const nodeGraph = useNodeGraph(graph);

  useEffect(() => {
    if (!isInspectorOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      setIsInspectorOpen(false);
    };

    window.addEventListener("keydown", handleKeyDown, true);

    return () => {
      window.removeEventListener("keydown", handleKeyDown, true);
    };
  }, [isInspectorOpen]);
  const localizedNodes = useMemo(
    () =>
      nodeGraph.nodes.map((node) => ({
        ...node,
        data: {
          ...node.data,
          label: getNodeLabel(node, t)
        }
      })),
    [nodeGraph.nodes, t]
  );
  const selectedDetailNode = getSelectedDetailNode({
    graph,
    hiddenPreview: t("explorer.nodeView.hiddenPreview"),
    nodeId: nodeGraph.selectedNodeId,
    nodes: localizedNodes,
    parsedNodes: (count) => t("explorer.nodeView.parsedNodes", { count })
  });
  const selectedConnections =
    selectedDetailNode.type === "file" ||
    selectedDetailNode.type === "category" ||
    selectedDetailNode.type === "more"
      ? new Set([selectedDetailNode.id, ...selectedDetailNode.connectedNodeIds])
      : getConnectedNodeIds(nodeGraph.selectedCodeNode);
  const renderedNodes = useMemo(
    () =>
      localizedNodes.map((node) => ({
        ...node,
        className: cn(
          node.className,
          hoveredNodeId && hoveredNodeId !== node.id && "opacity-25",
          hoveredNodeId === node.id && "ring-2 ring-primary shadow-2xl shadow-primary/20",
          nodeGraph.selectedNodeId === node.id && "ring-2 ring-primary"
        )
      })),
    [hoveredNodeId, localizedNodes, nodeGraph.selectedNodeId]
  );
  const renderedEdges = useMemo(
    () =>
      nodeGraph.edges.map((edge) => ({
        ...edge,
        className: cn(
          edge.className,
          hoveredNodeId &&
            edge.source !== hoveredNodeId &&
            edge.target !== hoveredNodeId &&
            "opacity-20",
          hoveredNodeId &&
            [edge.source, edge.target].includes(hoveredNodeId) &&
            "stroke-primary/60",
          nodeGraph.selectedNodeId &&
            [edge.source, edge.target].includes(nodeGraph.selectedNodeId) &&
            "stroke-primary/70"
        )
      })),
    [hoveredNodeId, nodeGraph.edges, nodeGraph.selectedNodeId]
  );

  const focusNode = (nodeId: string) => {
    nodeGraph.selectNode(nodeId);

    requestAnimationFrame(() => {
      const node = nodeGraph.nodes.find((item) => item.id === nodeId);

      if (!node) {
        return;
      }

      const nodeWidth =
        typeof node.style?.width === "number" ? node.style.width : 144;
      const nodeHeight =
        typeof node.style?.height === "number" ? node.style.height : 56;

      flowInstanceRef.current?.setCenter(
        node.position.x + nodeWidth / 2,
        node.position.y + nodeHeight / 2,
        { duration: 320, zoom: 1.08 }
      );
    });
  };

  const fitView = () => {
    flowInstanceRef.current?.fitView({ duration: 260, padding: 0.18 });
  };

  const resetLayout = () => {
    nodeGraph.resetOverview();
    requestAnimationFrame(fitView);
  };

  const graphCanvas = ({
    mode
  }: {
    mode: "embedded" | "inspector";
  }) => {
    const isInspector = mode === "inspector";
    const toolbarButtons = isInspector
      ? [
          {
            icon: <Plus className="h-4 w-4" />,
            label: t("explorer.nodeView.controls.zoomIn"),
            onClick: () => flowInstanceRef.current?.zoomIn({ duration: 0 })
          },
          {
            icon: <Minus className="h-4 w-4" />,
            label: t("explorer.nodeView.controls.zoomOut"),
            onClick: () => flowInstanceRef.current?.zoomOut({ duration: 0 })
          },
          {
            icon: <LocateFixed className="h-4 w-4" />,
            label: t("explorer.nodeView.controls.fitView"),
            onClick: fitView
          },
          {
            icon: <RotateCcw className="h-4 w-4" />,
            label: t("explorer.nodeView.controls.resetLayout"),
            onClick: resetLayout
          },
          {
            icon: <Crosshair className="h-4 w-4" />,
            label: t("explorer.nodeView.controls.expandAll"),
            onClick: nodeGraph.expandAll
          },
          {
            icon: <Shrink className="h-4 w-4" />,
            label: t("explorer.nodeView.controls.collapseAll"),
            onClick: nodeGraph.collapseAll
          }
        ]
      : [
          {
            icon: <Plus className="h-4 w-4" />,
            label: t("explorer.nodeView.controls.zoomIn"),
            onClick: () => flowInstanceRef.current?.zoomIn({ duration: 0 })
          },
          {
            icon: <Minus className="h-4 w-4" />,
            label: t("explorer.nodeView.controls.zoomOut"),
            onClick: () => flowInstanceRef.current?.zoomOut({ duration: 0 })
          },
          {
            icon: <LocateFixed className="h-4 w-4" />,
            label: t("explorer.nodeView.controls.fitView"),
            onClick: fitView
          }
        ];

    return (
      <section className="relative h-full min-h-0 bg-background">
        {graph.isLargeFile && nodeGraph.expandedGroups.size === 0 && (
          <div className="absolute left-4 top-4 z-20 max-w-sm rounded-md border bg-card/95 p-3 text-xs text-muted-foreground shadow-xl">
            {t("explorer.nodeView.largeFile")}
          </div>
        )}
        <div className="absolute right-3 top-3 z-20 flex items-center gap-1 rounded-md border bg-card/95 p-1 shadow-xl">
          {toolbarButtons.map((button) => (
            <GraphButton
              key={button.label}
              label={button.label}
              onClick={button.onClick}
            >
              {button.icon}
            </GraphButton>
          ))}
          {isInspector ? (
            <GraphButton label={t("explorer.nodeView.controls.closeInspector")} onClick={() => setIsInspectorOpen(false)}>
              <X className="h-4 w-4" />
            </GraphButton>
          ) : (
            <GraphButton label={t("explorer.nodeView.controls.openInspector")} onClick={() => setIsInspectorOpen(true)}>
              <Expand className="h-4 w-4" />
            </GraphButton>
          )}
        </div>

        <ReactFlow
          colorMode="dark"
          edges={renderedEdges}
          maxZoom={1.8}
          minZoom={0.35}
          nodes={renderedNodes}
          nodesDraggable
          onInit={(instance) => {
            flowInstanceRef.current = instance;
            requestAnimationFrame(() => {
              instance.fitView({ duration: 0, padding: 0.18 });
            });
          }}
          onlyRenderVisibleElements={false}
          onNodeClick={(_, node) => focusNode(node.id)}
          onNodeDoubleClick={(_, node) => {
            const category = node.data.category;

            if (node.id.startsWith("category:") && category) {
              nodeGraph.toggleGroup(category);
              requestAnimationFrame(fitView);
            }
          }}
          onNodeMouseEnter={(_, node) => setHoveredNodeId(node.id)}
          onNodeMouseLeave={() => setHoveredNodeId(null)}
          panOnDrag
          proOptions={{ hideAttribution: true }}
          zoomOnPinch
          zoomOnScroll
        >
          <Background color="hsl(var(--border))" gap={24} size={1} />
        </ReactFlow>
      </section>
    );
  };

  return (
    <>
      {!isInspectorOpen && (
        <div className="h-[calc(100%-57px)] bg-background">
          {graphCanvas({ mode: "embedded" })}
        </div>
      )}

      {isInspectorOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="fixed inset-0 z-[100] bg-black/60 p-4 backdrop-blur-sm xl:p-6"
            onClick={() => setIsInspectorOpen(false)}
          >
            <div className="flex h-full min-h-0 w-full flex-col overflow-hidden rounded-lg border border-border/70 bg-background shadow-2xl">
              <header className="flex h-14 shrink-0 items-center justify-between border-b bg-card px-4">
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold">
                    {getFileName(graph.fileNode.filePath)}
                  </div>
                  <div className="mt-0.5 font-mono text-[11px] text-muted-foreground">
                    {t("explorer.nodeView.inspectorTitle")} · {t("explorer.nodeView.parsedNodes", { count: graph.totalNodeCount })}
                  </div>
                </div>
                <button
                  type="button"
                  className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                  onClick={() => setIsInspectorOpen(false)}
                  title={t("explorer.nodeView.controls.closeInspector")}
                >
                  <X className="h-4 w-4" />
                </button>
              </header>
              <div
                className="grid min-h-0 flex-1 grid-cols-[300px_minmax(0,1fr)_340px]"
                onClick={(event) => event.stopPropagation()}
              >
                <NodeOutline
                  graph={graph}
                  expandedGroups={nodeGraph.expandedGroups}
                  focusNode={focusNode}
                  pinnedGroups={nodeGraph.pinnedGroups}
                  searchQuery={nodeGraph.searchQuery}
                  setSearchQuery={nodeGraph.setSearchQuery}
                  toggleGroup={nodeGraph.toggleGroup}
                  togglePinnedGroup={nodeGraph.togglePinnedGroup}
                />
                <div className="border-x">{graphCanvas({ mode: "inspector" })}</div>
                <NodeDetail
                  graph={graph}
                  node={selectedDetailNode}
                  visibleCodeNodes={nodeGraph.visibleCodeNodes}
                />
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
};

const NodeOutline = ({
  expandedGroups,
  focusNode,
  graph,
  pinnedGroups,
  searchQuery,
  setSearchQuery,
  toggleGroup,
  togglePinnedGroup
}: {
  expandedGroups: Set<codeNodeCategory>;
  focusNode: (nodeId: string) => void;
  graph: codeNodeGraph;
  pinnedGroups: Set<codeNodeCategory>;
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  toggleGroup: (category: codeNodeCategory) => void;
  togglePinnedGroup: (category: codeNodeCategory) => void;
}) => {
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
                  <span className="font-mono text-muted-foreground">{nodes.length}</span>
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

const NodeDetail = ({
  graph,
  node,
  visibleCodeNodes
}: {
  graph: codeNodeGraph;
  node: detailNode;
  visibleCodeNodes: codeNode[];
}) => {
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
        {getFileName(graph.fileNode.filePath)} · {t("explorer.nodeView.parsedNodes", { count: graph.totalNodeCount })}
      </div>
    </aside>
  );
};

const GraphButton = ({
  children,
  label,
  onClick
}: {
  children: ReactNode;
  label: string;
  onClick: () => void;
}) => (
  <button
    type="button"
    title={label}
    className="flex h-8 w-8 items-center justify-center rounded text-muted-foreground transition hover:bg-muted hover:text-foreground"
    onClick={onClick}
  >
    {children}
  </button>
);

const getNodeLabel = (
  node: nodeGraphFlowNode,
  t: (key: string, options?: Record<string, unknown>) => string
) => {
  if (node.data.nodeType === "category" && node.data.category) {
    return t(`explorer.nodeView.groups.${node.data.category}`);
  }

  if (node.data.nodeType === "more") {
    return t("explorer.nodeView.more", { count: node.data.count ?? 0 });
  }

  return node.data.label;
};

const getSelectedDetailNode = ({
  graph,
  hiddenPreview,
  nodeId,
  nodes,
  parsedNodes
}: {
  graph: codeNodeGraph;
  hiddenPreview: string;
  nodeId: string;
  nodes: nodeGraphFlowNode[];
  parsedNodes: (count: number) => string;
}): detailNode => {
  const flowNode = nodes.find((node) => node.id === nodeId);
  const codeNode = flowNode?.data.codeNode;

  if (codeNode) {
    return codeNode;
  }

  if (flowNode) {
    return {
      codePreview:
        flowNode.data.nodeType === "category"
          ? parsedNodes(Number(flowNode.data.count ?? 0))
          : hiddenPreview,
      connectedNodeIds: flowNode.id.startsWith("category:")
        ? [graph.fileNode.id]
        : [flowNode.data.category ? `category:${flowNode.data.category}` : graph.fileNode.id],
      filePath: graph.fileNode.filePath,
      id: flowNode.id,
      lineNumber: 1,
      name: flowNode.data.label,
      type: flowNode.data.nodeType
    };
  }

  return graph.fileNode;
};

const getConnectedDetailNodes = ({
  graph,
  node,
  visibleCodeNodes
}: {
  graph: codeNodeGraph;
  node: detailNode;
  visibleCodeNodes: codeNode[];
}) => {
  if (node.type === "file") {
    return graph.groups.flatMap((group) => group.nodes.slice(0, 2));
  }

  const connectedIds = new Set(node.connectedNodeIds);

  return visibleCodeNodes.filter((item) => connectedIds.has(item.id));
};
