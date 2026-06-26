import {
  Background,
  ReactFlow,
  type Edge,
  type Node,
  type ReactFlowInstance
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {
  ChevronRight,
  Crosshair,
  Expand,
  File,
  FileCode,
  Folder,
  LocateFixed,
  Minus,
  Plus,
  Search,
  X
} from "lucide-react";
import type { CSSProperties } from "react";
import { useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

type language = "en" | "ko";
type viewMode = "code" | "nodes";

type mockFile = {
  bytes: number;
  code: string[];
  id: string;
  language: string;
  path: string;
};

type mockNode = {
  category?: codeNodeCategory;
  id: string;
  label: string;
  type: codeNodeType;
};

type codeNodeCategory =
  | "imports"
  | "exports"
  | "declarations"
  | "hooks"
  | "functions"
  | "constants";

type codeNodeType = codeNodeCategory | "file" | "category";

type flowNodeData = Record<string, unknown> & {
  label: string;
  nodeType: codeNodeType;
};

type flowNode = Node<flowNodeData> & {
  className: string;
  style: CSSProperties;
};

type flowEdge = Edge & {
  className: string;
};

const files: mockFile[] = [
  {
    bytes: 348,
    id: "app",
    language: "JavaScript",
    path: "examples/react-official/App.jsx",
    code: [
      "import { useState } from 'react';",
      "",
      "function MyButton({ count, onClick }) {",
      "  return <button onClick={onClick}>",
      "    Clicked {count} times",
      "  </button>;",
      "}",
      "",
      "export default function MyApp() {",
      "  const [count, setCount] = useState(0);",
      "  function handleClick() {",
      "    setCount(count + 1);",
      "  }",
      "  return <MyButton count={count} onClick={handleClick} />;",
      "}"
    ]
  },
  {
    bytes: 332,
    id: "shopping-list",
    language: "JavaScript",
    path: "examples/react-official/ShoppingList.jsx",
    code: [
      "const products = [",
      "  { title: 'Cabbage', id: 1 },",
      "  { title: 'Garlic', id: 2 },",
      "  { title: 'Apple', id: 3 },",
      "];",
      "",
      "export default function ShoppingList() {",
      "  const listItems = products.map(product =>",
      "    <li key={product.id}>{product.title}</li>",
      "  );",
      "  return <ul>{listItems}</ul>;",
      "}"
    ]
  },
  {
    bytes: 275,
    id: "gallery",
    language: "JavaScript",
    path: "examples/react-official/Gallery.jsx",
    code: [
      "function Profile() {",
      "  return <img src=\"...\" alt=\"Katherine Johnson\" />;",
      "}",
      "",
      "export default function Gallery() {",
      "  return (",
      "    <section>",
      "      <h1>Amazing scientists</h1>",
      "      <Profile />",
      "      <Profile />",
      "    </section>",
      "  );",
      "}"
    ]
  }
];

const nodesByFile: Record<string, mockNode[]> = {
  app: [
    { id: "file", label: "App.jsx", type: "file" },
    { category: "imports", id: "imports:1:react", label: "react", type: "imports" },
    { category: "functions", id: "functions:3:my-button", label: "MyButton", type: "functions" },
    { category: "exports", id: "exports:9:default", label: "default", type: "exports" },
    { category: "functions", id: "functions:11:handle-click", label: "handleClick", type: "functions" },
    { category: "constants", id: "constants:10:count", label: "count", type: "constants" }
  ],
  "shopping-list": [
    { id: "file", label: "ShoppingList.jsx", type: "file" },
    { category: "constants", id: "constants:1:products", label: "products", type: "constants" },
    { category: "exports", id: "exports:7:default", label: "default", type: "exports" },
    { category: "functions", id: "functions:8:map", label: "products.map", type: "functions" },
    { category: "declarations", id: "declarations:9:key", label: "key", type: "declarations" }
  ],
  gallery: [
    { id: "file", label: "Gallery.jsx", type: "file" },
    { category: "functions", id: "functions:1:profile", label: "Profile", type: "functions" },
    { category: "exports", id: "exports:5:default", label: "default", type: "exports" },
    { category: "declarations", id: "declarations:7:section", label: "section", type: "declarations" }
  ]
};

const categoryNodes: Array<{ id: codeNodeCategory; label: string }> = [
  { id: "imports", label: "Imports" },
  { id: "exports", label: "Exports" },
  { id: "declarations", label: "Declarations" },
  { id: "hooks", label: "Hooks" },
  { id: "functions", label: "Functions" },
  { id: "constants", label: "Constants" }
];

const categoryPositions: Record<codeNodeCategory, { x: number; y: number }> = {
  imports: { x: 0, y: -210 },
  exports: { x: 250, y: -60 },
  declarations: { x: 0, y: 220 },
  hooks: { x: -250, y: -70 },
  functions: { x: -250, y: 110 },
  constants: { x: 245, y: 150 }
};

export const NodeViewMockup = ({
  labels,
  language
}: {
  labels: {
    graph: string;
    preview: string;
    search: string;
  };
  language: language;
}) => {
  const flowInstanceRef = useRef<ReactFlowInstance<flowNode, flowEdge> | null>(
    null
  );
  const fullscreenFlowInstanceRef =
    useRef<ReactFlowInstance<flowNode, flowEdge> | null>(null);
  const [isFullscreenOpen, setIsFullscreenOpen] = useState(false);
  const [activeFileId, setActiveFileId] = useState("app");
  const [viewMode, setViewMode] = useState<viewMode>("nodes");
  const activeFile = files.find((file) => file.id === activeFileId) ?? files[0];
  const graph = useMemo(
    () => buildMockFlow(nodesByFile[activeFile.id] ?? []),
    [activeFile.id]
  );
  const viewLabels = useMemo(
    () =>
      language === "ko"
        ? { code: "코드", nodes: "노드" }
        : { code: "Code", nodes: "Nodes" },
    [language]
  );

  return (
    <div className="grid h-[640px] min-h-0 grid-cols-[320px_minmax(0,1fr)] gap-4">
      <aside className="flex min-h-0 flex-col overflow-hidden rounded-md border border-border/80 bg-card">
        <div className="border-b border-border/80 p-3">
          <div className="flex h-9 items-center gap-2 rounded-md border border-border/80 bg-background px-3">
            <Search className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">{labels.search}</span>
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-auto">
          <TreeRow depth={0} icon="folder" label="examples" />
          <TreeRow depth={1} icon="folder" label="react-official" />
          {files.map((file) => (
            <button
              key={file.id}
              type="button"
              className={[
                "flex h-7 w-full items-center gap-1 border-b border-border/80 px-2 text-left text-xs transition hover:bg-muted",
                activeFile.id === file.id ? "bg-muted text-foreground" : "text-foreground"
              ].join(" ")}
              style={{ paddingLeft: 40 }}
              onClick={() => setActiveFileId(file.id)}
            >
              <span className="h-6 w-6" />
              <File className="h-4 w-4 text-muted-foreground" />
              <span className="truncate">{getFileName(file.path)}</span>
            </button>
          ))}
        </div>
      </aside>

      <section className="min-h-0 overflow-hidden rounded-md border border-border/80 bg-card">
        <header className="flex items-center justify-between gap-4 border-b border-border/80 px-3 py-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-sm font-medium">
              <FileCode className="h-4 w-4" />
              <span className="truncate">{activeFile.path}</span>
            </div>
            <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
              {activeFile.bytes.toLocaleString()} bytes
              <span className="rounded border border-border/80 px-1.5 py-0.5 font-mono text-[10px]">
                {activeFile.language}
              </span>
            </div>
          </div>
          <div className="flex shrink-0 rounded-md border border-border/80 bg-background p-1">
            {(["code", "nodes"] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                className={[
                  "h-7 rounded px-2 text-xs text-muted-foreground",
                  viewMode === mode ? "bg-muted text-foreground" : ""
                ].join(" ")}
                onClick={() => setViewMode(mode)}
              >
                {viewLabels[mode]}
              </button>
            ))}
          </div>
        </header>

        {viewMode === "code" ? (
          <CodePane lines={activeFile.code} />
        ) : (
          <NodePane
            edges={graph.edges}
            flowInstanceRef={flowInstanceRef}
            isFullscreen={false}
            nodes={graph.nodes}
            onOpenFullscreen={() => setIsFullscreenOpen(true)}
          />
        )}
      </section>
      {isFullscreenOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <div className="fixed inset-0 z-50 bg-black/60 p-4 backdrop-blur-sm">
            <div className="flex h-full min-h-0 w-full flex-col overflow-hidden rounded-lg border border-border/70 bg-background shadow-2xl">
              <header className="flex h-14 shrink-0 items-center justify-between border-b border-border/80 bg-card px-4">
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold">
                    {getFileName(activeFile.path)}
                  </div>
                  <div className="mt-0.5 font-mono text-[11px] text-muted-foreground">
                    {activeFile.path}
                  </div>
                </div>
                <button
                  type="button"
                  className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground"
                  onClick={() => setIsFullscreenOpen(false)}
                >
                  <X className="h-4 w-4" />
                </button>
              </header>
              <div className="min-h-0 flex-1">
                <NodePane
                  edges={graph.edges}
                  flowInstanceRef={fullscreenFlowInstanceRef}
                  isFullscreen
                  nodes={graph.nodes}
                  onCloseFullscreen={() => setIsFullscreenOpen(false)}
                />
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};

const TreeRow = ({
  depth,
  icon,
  label
}: {
  depth: number;
  icon: "folder" | "file";
  label: string;
}) => (
  <div
    className="flex h-7 items-center gap-1 border-b border-border/80 px-2 text-left text-xs"
    style={{ paddingLeft: depth * 16 + 8 }}
  >
    <span className="flex h-6 w-6 items-center justify-center">
      <ChevronRight className="h-4 w-4 rotate-90" />
    </span>
    {icon === "folder" ? (
      <Folder className="h-4 w-4 text-muted-foreground" />
    ) : (
      <File className="h-4 w-4 text-muted-foreground" />
    )}
    <span className="truncate">{label}</span>
  </div>
);

const getFileName = (path: string) => {
  const segments = path.split("/");

  return segments[segments.length - 1] ?? path;
};

const CodePane = ({ lines }: { lines: string[] }) => (
  <div className="h-[calc(100%-57px)] overflow-auto bg-background">
    <pre className="min-w-max p-0 font-mono text-xs leading-5">
      {lines.map((line, index) => (
        <div key={`${index}-${line}`} className="grid grid-cols-[48px_1fr]">
          <span className="select-none border-r border-border/80 px-3 text-right text-muted-foreground/60">
            {index + 1}
          </span>
          <code className="px-3">{line || " "}</code>
        </div>
      ))}
    </pre>
  </div>
);

const NodePane = ({
  edges,
  flowInstanceRef,
  isFullscreen,
  nodes,
  onCloseFullscreen,
  onOpenFullscreen
}: {
  edges: flowEdge[];
  flowInstanceRef: React.MutableRefObject<ReactFlowInstance<
    flowNode,
    flowEdge
  > | null>;
  isFullscreen: boolean;
  nodes: flowNode[];
  onCloseFullscreen?: () => void;
  onOpenFullscreen?: () => void;
}) => {
  const fitView = () => {
    flowInstanceRef.current?.fitView({ duration: 240, padding: 0.2 });
  };

  return (
    <div
      className={[
        "relative overflow-hidden bg-background",
        isFullscreen ? "h-full" : "h-[calc(100%-57px)]"
      ].join(" ")}
    >
      <div className="absolute right-3 top-3 z-20 flex items-center gap-1 rounded-md border border-border/80 bg-card/95 p-1 shadow-xl">
        <GraphButton
          label="Zoom in"
          onClick={() => flowInstanceRef.current?.zoomIn({ duration: 160 })}
        >
          <Plus className="h-4 w-4" />
        </GraphButton>
        <GraphButton
          label="Zoom out"
          onClick={() => flowInstanceRef.current?.zoomOut({ duration: 160 })}
        >
          <Minus className="h-4 w-4" />
        </GraphButton>
        <GraphButton label="Fit view" onClick={fitView}>
          <LocateFixed className="h-4 w-4" />
        </GraphButton>
        <GraphButton label="Reset view" onClick={fitView}>
          <Crosshair className="h-4 w-4" />
        </GraphButton>
        {isFullscreen ? (
          <GraphButton
            label="Close fullscreen"
            onClick={() => onCloseFullscreen?.()}
          >
            <X className="h-4 w-4" />
          </GraphButton>
        ) : (
          <GraphButton
            label="Open fullscreen"
            onClick={() => onOpenFullscreen?.()}
          >
            <Expand className="h-4 w-4" />
          </GraphButton>
        )}
      </div>

      <ReactFlow
        colorMode="dark"
        edges={edges}
        maxZoom={1.4}
        minZoom={0.35}
        nodes={nodes}
        nodesDraggable={false}
        onInit={(instance) => {
          flowInstanceRef.current = instance;
          requestAnimationFrame(() => {
            instance.fitView({ duration: 0, padding: 0.2 });
          });
        }}
        panOnDrag
        proOptions={{ hideAttribution: true }}
        zoomOnPinch
        zoomOnScroll
      >
        <Background color="hsl(var(--border))" gap={24} size={1} />
      </ReactFlow>
    </div>
  );
};

const GraphButton = ({
  children,
  label,
  onClick
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
}) => (
  <button
    type="button"
    aria-label={label}
    title={label}
    className="flex h-8 w-8 items-center justify-center rounded text-muted-foreground transition hover:bg-muted hover:text-foreground"
    onClick={onClick}
  >
    {children}
  </button>
);

const buildMockFlow = (codeNodes: mockNode[]) => {
  const nodes: flowNode[] = [
    {
      className: getNodeClassName("file"),
      data: {
        label: codeNodes.find((node) => node.type === "file")?.label ?? "file",
        nodeType: "file"
      },
      id: "file",
      position: { x: 0, y: 0 },
      style: getNodeStyle("file"),
      type: "default"
    }
  ];
  const edges: flowEdge[] = [];

  for (const category of categoryNodes) {
    const categoryId = `category:${category.id}`;
    const position = categoryPositions[category.id];
    const children = codeNodes.filter((node) => node.category === category.id);

    nodes.push({
      className: getNodeClassName("category"),
      data: {
        label: category.label,
        nodeType: "category"
      },
      id: categoryId,
      position,
      style: getNodeStyle("category"),
      type: "default"
    });
    edges.push(createEdge("file", categoryId));

    children.forEach((child, index) => {
      const offset = getChildOffset(category.id, index, children.length);

      nodes.push({
        className: getNodeClassName(child.type),
        data: {
          label: child.label,
          nodeType: child.type
        },
        id: child.id,
        position: {
          x: position.x + offset.x,
          y: position.y + offset.y
        },
        style: getNodeStyle(child.type),
        type: "default"
      });
      edges.push(createEdge(categoryId, child.id));
    });
  }

  return { edges, nodes };
};

const getChildOffset = (
  category: codeNodeCategory,
  index: number,
  total: number
) => {
  const vertical = category === "imports" || category === "declarations";
  const direction =
    category === "hooks" || category === "functions" ? -1 : 1;

  if (vertical) {
    return {
      x: (index - (total - 1) / 2) * 172,
      y: category === "imports" ? -110 : 100
    };
  }

  return {
    x: direction * 176,
    y: (index - (total - 1) / 2) * 66
  };
};

const createEdge = (source: string, target: string): flowEdge => ({
  animated: false,
  className: "stroke-border/70",
  id: `${source}->${target}`,
  source,
  target,
  type: "straight"
});

const getNodeClassName = (type: codeNodeType) => {
  const base =
    "flex items-center justify-center overflow-hidden border px-3 text-center font-mono text-[11px] shadow-lg shadow-black/20";

  if (type === "file") {
    return `${base} border-primary bg-primary text-primary-foreground`;
  }

  if (type === "category") {
    return `${base} border-teal-300/30 bg-teal-400/14 text-teal-100`;
  }

  return `${base} border-sky-300/24 bg-sky-400/12 text-sky-100`;
};

const getNodeStyle = (type: codeNodeType): CSSProperties => {
  if (type === "file") {
    return {
      borderRadius: 14,
      fontSize: 12,
      fontWeight: 600,
      height: 56,
      lineHeight: 1.3,
      paddingInline: 16,
      width: 176
    };
  }

  if (type === "category") {
    return {
      borderRadius: 12,
      fontWeight: 600,
      height: 40,
      lineHeight: 1.2,
      paddingInline: 12,
      width: 140
    };
  }

  return {
    borderRadius: 12,
    height: 48,
    lineHeight: 1.2,
    paddingInline: 12,
    width: 152
  };
};
