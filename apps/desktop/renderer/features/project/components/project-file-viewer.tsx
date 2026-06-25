import { motion } from "framer-motion";
import {
  FileCode,
  FileText,
  ListTree
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { isTauriRuntime } from "@/core/tauri/tauri-client";
import { useProjectFile } from "@/features/project/hooks/use-project-file";
import type { project } from "@/features/project/types/project";
import { cn } from "@/shared/lib/utils";

type projectFileViewerProps = {
  filePath: string | null;
  project: project;
};

type viewMode = "code" | "preview" | "nodes";

type fileNode = {
  id: string;
  label: string;
  detail?: string;
  kind?: "group" | "symbol" | "json" | "markdown";
  children?: fileNode[];
};

type graphNode = {
  id: string;
  label: string;
  detail?: string;
  kind?: fileNode["kind"] | "root" | "more";
  radius: number;
  x: number;
  y: number;
};

type graphEdge = {
  id: string;
  from: graphNode;
  label?: string;
  to: graphNode;
};

export const ProjectFileViewer = ({ filePath, project }: projectFileViewerProps) => {
  const { t } = useTranslation();
  const [viewMode, setViewMode] = useState<viewMode>("code");
  const file = useProjectFile({ filePath, project });
  const language = useMemo(() => getFileLanguage(filePath), [filePath]);
  const isMarkdown = language === "Markdown";
  const nodes = useMemo(
    () =>
      file.data && canShowNodeView(language)
        ? buildFileNodes({
            content: file.data.content,
            filePath: file.data.path,
            language
          })
        : [],
    [file.data, language]
  );
  const hasNodeView = nodes.length > 0;

  useEffect(() => {
    if (!isMarkdown && viewMode === "preview") {
      setViewMode("code");
    }

    if (!hasNodeView && viewMode === "nodes") {
      setViewMode("code");
    }
  }, [hasNodeView, isMarkdown, viewMode]);

  if (!filePath) {
    return (
      <EmptyState message={t("explorer.selectFile")} />
    );
  }

  if (project.source === "local" && !isTauriRuntime()) {
    return (
      <EmptyState message={t("runtime.desktopRequiredDetail")} />
    );
  }

  if (file.isLoading) {
    return <EmptyState message={t("explorer.loadingFile")} />;
  }

  if (file.isError || !file.data) {
    return <EmptyState message={t("explorer.fileReadFailed")} />;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      className="h-full overflow-hidden rounded-md border bg-card"
    >
      <div className="flex items-center justify-between gap-4 border-b px-3 py-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-sm font-medium">
            {isMarkdown ? (
              <FileText className="h-4 w-4" />
            ) : (
              <FileCode className="h-4 w-4" />
            )}
            <span className="truncate">{file.data.path}</span>
          </div>
          <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
            {file.data.size.toLocaleString()} bytes
            <span className="rounded border px-1.5 py-0.5 font-mono text-[10px]">
              {language}
            </span>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <div className="flex rounded-md border bg-background p-1">
            {getViewModes({ hasNodeView, isMarkdown }).map((mode) => (
              <button
                key={mode}
                type="button"
                className={cn(
                  "h-7 rounded px-2 text-xs text-muted-foreground",
                  viewMode === mode && "bg-muted text-foreground"
                )}
                onClick={() => setViewMode(mode)}
              >
                {t(`explorer.viewModes.${mode}`)}
              </button>
            ))}
          </div>
          {file.data.truncated && (
            <div className="text-xs text-muted-foreground">
              {t("explorer.truncated")}
            </div>
          )}
        </div>
      </div>
      {viewMode === "nodes" ? (
        <NodeViewer
          filePath={file.data.path}
          language={language}
          nodes={nodes}
        />
      ) : isMarkdown && viewMode === "preview" ? (
        <MarkdownPreview content={file.data.content} />
      ) : (
        <CodeViewer content={file.data.content} language={language} />
      )}
    </motion.div>
  );
};

const getViewModes = ({
  hasNodeView,
  isMarkdown
}: {
  hasNodeView: boolean;
  isMarkdown: boolean;
}): viewMode[] => {
  const modes: viewMode[] = isMarkdown ? ["code", "preview"] : ["code"];

  if (hasNodeView) {
    modes.push("nodes");
  }

  return modes;
};

type codeViewerProps = {
  content: string;
  compact?: boolean;
  language: string;
};

const CodeViewer = ({ compact = false, content, language }: codeViewerProps) => {
  const lines = content.split("\n");
  const isNode = language === "Node";

  return (
    <div
      className={cn(
        "overflow-auto bg-background",
        compact ? "max-h-80" : "h-[calc(100%-57px)]"
      )}
    >
      {isNode && (
        <div className="sticky top-0 z-10 border-b bg-card px-3 py-2 font-mono text-[11px] text-muted-foreground">
          Node runtime view
        </div>
      )}
      <pre className="min-w-max p-0 font-mono text-xs leading-5">
        {lines.map((line, index) => (
          <div key={`${index}-${line}`} className="grid grid-cols-[48px_1fr]">
            <span className="select-none border-r px-3 text-right text-muted-foreground/60">
              {index + 1}
            </span>
            <code className="px-3">
              {isNode ? highlightNodeLine(line) : line || " "}
            </code>
          </div>
        ))}
      </pre>
    </div>
  );
};

const MarkdownPreview = ({ content }: { content: string }) => {
  const lines = content.split("\n");
  const blocks = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];

    if (line.startsWith("```")) {
      const codeLines = [];
      const language = line.replace("```", "").trim() || "Code";
      index += 1;

      while (index < lines.length && !lines[index].startsWith("```")) {
        codeLines.push(lines[index]);
        index += 1;
      }

      blocks.push(
        <div key={index} className="overflow-hidden rounded-md border bg-background">
          <div className="border-b px-3 py-2 font-mono text-[11px] text-muted-foreground">
            {language}
          </div>
          <CodeViewer
            compact
            content={codeLines.join("\n")}
            language={getLanguageLabel(language)}
          />
        </div>
      );
      index += 1;
      continue;
    }

    if (!line.trim()) {
      blocks.push(<div key={index} className="h-3" />);
      index += 1;
      continue;
    }

    const heading = line.match(/^(#{1,3})\s+(.*)$/);

    if (heading) {
      const level = heading[1].length;
      const className =
        level === 1
          ? "text-2xl font-semibold"
          : level === 2
            ? "text-lg font-semibold"
            : "text-sm font-semibold";
      blocks.push(
        <div key={index} className={cn("mt-3 first:mt-0", className)}>
          {renderInlineMarkdown(heading[2])}
        </div>
      );
      index += 1;
      continue;
    }

    const listItem = line.match(/^[-*]\s+(.*)$/);

    if (listItem) {
      blocks.push(
        <div key={index} className="flex gap-2 text-sm leading-6 text-muted-foreground">
          <span className="mt-2 h-1 w-1 rounded-full bg-muted-foreground" />
          <span>{renderInlineMarkdown(listItem[1])}</span>
        </div>
      );
      index += 1;
      continue;
    }

    blocks.push(
      <p key={index} className="text-sm leading-6 text-muted-foreground">
        {renderInlineMarkdown(line)}
      </p>
    );
    index += 1;
  }

  return (
    <div className="h-[calc(100%-57px)] overflow-auto bg-background p-5">
      <div className="mx-auto max-w-3xl space-y-1">{blocks}</div>
    </div>
  );
};

const NodeViewer = ({
  filePath,
  language,
  nodes
}: {
  filePath: string;
  language: string;
  nodes: fileNode[];
}) => {
  const graph = useMemo(
    () => buildNodeGraph({ filePath, language, nodes }),
    [filePath, language, nodes]
  );

  return (
    <div className="h-[calc(100%-57px)] overflow-auto bg-background">
      <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-card/95 px-4 py-3 backdrop-blur">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-sm font-medium">
            <ListTree className="h-4 w-4" />
            <span className="truncate">{getFileName(filePath)}</span>
          </div>
          <div className="mt-1 font-mono text-[11px] text-muted-foreground">
            {language} · {graph.totalNodeCount} nodes
          </div>
        </div>
      </div>
      <div className="p-4">
        <NodeGraph graph={graph} />
        <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
          <NodeMetric label="Groups" value={String(graph.groupCount)} />
          <NodeMetric label="Visible" value={String(graph.visibleNodeCount)} />
          <NodeMetric
            label="Hidden"
            value={String(Math.max(graph.totalNodeCount - graph.visibleNodeCount, 0))}
          />
        </div>
      </div>
    </div>
  );
};

const NodeGraph = ({ graph }: { graph: ReturnType<typeof buildNodeGraph> }) => {
  return (
    <div className="overflow-hidden rounded-md border bg-card">
      <svg
        className="h-[420px] w-full bg-background"
        role="img"
        viewBox="0 0 900 420"
      >
        <defs>
          <filter id="node-shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow
              dx="0"
              dy="8"
              floodColor="rgb(0 0 0)"
              floodOpacity="0.28"
              stdDeviation="8"
            />
          </filter>
        </defs>
        {graph.edges.map((edge) => (
          <g key={edge.id}>
            <line
              x1={edge.from.x}
              y1={edge.from.y}
              x2={edge.to.x}
              y2={edge.to.y}
              className="stroke-border"
              strokeWidth="1.5"
            />
            {edge.label && (
              <text
                x={(edge.from.x + edge.to.x) / 2}
                y={(edge.from.y + edge.to.y) / 2 - 6}
                className="fill-muted-foreground font-mono text-[10px]"
                textAnchor="middle"
              >
                {edge.label}
              </text>
            )}
          </g>
        ))}
        {graph.nodes.map((node) => (
          <GraphNode key={node.id} node={node} />
        ))}
      </svg>
    </div>
  );
};

const GraphNode = ({ node }: { node: graphNode }) => {
  const label = truncateNodeLabel(node.label, node.radius > 40 ? 16 : 12);
  const detail = node.detail ? truncateNodeLabel(node.detail, 18) : null;
  const className = getGraphNodeClassName(node.kind);
  const textClassName = getGraphNodeTextClassName(node.kind);

  return (
    <g className={textClassName} filter="url(#node-shadow)">
      <title>{[node.label, node.detail].filter(Boolean).join(" · ")}</title>
      <circle
        cx={node.x}
        cy={node.y}
        r={node.radius}
        className={className}
        strokeWidth="1.5"
      />
      <text
        x={node.x}
        y={node.y - (detail ? 2 : -4)}
        className="pointer-events-none fill-current text-[11px] font-semibold"
        textAnchor="middle"
      >
        {label}
      </text>
      {detail && (
        <text
          x={node.x}
          y={node.y + 14}
          className="pointer-events-none fill-current font-mono text-[9px] opacity-70"
          textAnchor="middle"
        >
          {detail}
        </text>
      )}
    </g>
  );
};

const NodeMetric = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-md border bg-card px-3 py-2">
    <div className="text-muted-foreground">{label}</div>
    <div className="mt-1 font-mono text-sm">{value}</div>
  </div>
);

const buildNodeGraph = ({
  filePath,
  language,
  nodes
}: {
  filePath: string;
  language: string;
  nodes: fileNode[];
}) => {
  const center = { x: 450, y: 210 };
  const graphNodes: graphNode[] = [
    {
      id: "root",
      label: getFileName(filePath),
      detail: language,
      kind: "root",
      radius: 48,
      x: center.x,
      y: center.y
    }
  ];
  const graphEdges: graphEdge[] = [];
  const topLevelNodes = nodes.slice(0, 6);
  let hiddenNodeCount = Math.max(nodes.length - topLevelNodes.length, 0);

  topLevelNodes.forEach((node, index) => {
    const angle = getOrbitAngle(index, topLevelNodes.length);
    const groupNode: graphNode = {
      id: `group-${node.id}`,
      label: node.label,
      detail: node.detail,
      kind: node.kind,
      radius: 38,
      x: center.x + Math.cos(angle) * 185,
      y: center.y + Math.sin(angle) * 135
    };
    const childNodes = (node.children ?? []).slice(0, 7);
    const hiddenChildren = Math.max((node.children?.length ?? 0) - childNodes.length, 0);

    hiddenNodeCount += hiddenChildren;
    graphNodes.push(groupNode);
    graphEdges.push({
      id: `root-${groupNode.id}`,
      from: graphNodes[0],
      label: getEdgeLabel(node.kind),
      to: groupNode
    });

    childNodes.forEach((childNode, childIndex) => {
      const childAngle = angle + (childIndex - (childNodes.length - 1) / 2) * 0.32;
      const leafNode: graphNode = {
        id: `leaf-${node.id}-${childNode.id}`,
        label: childNode.label,
        detail: childNode.detail,
        kind: childNode.kind,
        radius: 28,
        x: groupNode.x + Math.cos(childAngle) * 105,
        y: groupNode.y + Math.sin(childAngle) * 78
      };

      graphNodes.push(leafNode);
      graphEdges.push({
        id: `${groupNode.id}-${leafNode.id}`,
        from: groupNode,
        to: leafNode
      });
    });

    if (hiddenChildren > 0) {
      const moreNode: graphNode = {
        id: `more-${node.id}`,
        label: `+${hiddenChildren}`,
        detail: "more",
        kind: "more",
        radius: 24,
        x: groupNode.x + Math.cos(angle) * 92,
        y: groupNode.y + Math.sin(angle) * 92
      };

      graphNodes.push(moreNode);
      graphEdges.push({
        id: `${groupNode.id}-${moreNode.id}`,
        from: groupNode,
        to: moreNode
      });
    }
  });

  if (hiddenNodeCount > 0 && topLevelNodes.length < nodes.length) {
    const moreNode: graphNode = {
      id: "more-root",
      label: `+${hiddenNodeCount}`,
      detail: "hidden",
      kind: "more",
      radius: 28,
      x: center.x,
      y: 370
    };

    graphNodes.push(moreNode);
    graphEdges.push({
      id: "root-more",
      from: graphNodes[0],
      to: moreNode
    });
  }

  return {
    edges: graphEdges,
    groupCount: nodes.length,
    nodes: graphNodes,
    totalNodeCount: countFileNodes(nodes) + 1,
    visibleNodeCount: graphNodes.length
  };
};

const getOrbitAngle = (index: number, count: number) => {
  if (count === 1) {
    return -Math.PI / 2;
  }

  return -Math.PI / 2 + (index / count) * Math.PI * 2;
};

const getEdgeLabel = (kind: fileNode["kind"]) => {
  if (kind === "json") {
    return "KEY";
  }

  if (kind === "markdown") {
    return "SECTION";
  }

  if (kind === "symbol") {
    return "SYMBOL";
  }

  return "LINK";
};

const getGraphNodeClassName = (kind: graphNode["kind"]) => {
  if (kind === "root") {
    return "fill-primary stroke-primary";
  }

  if (kind === "more") {
    return "fill-muted stroke-border";
  }

  if (kind === "json") {
    return "fill-cyan-500/90 stroke-cyan-300/80";
  }

  if (kind === "markdown") {
    return "fill-emerald-500/90 stroke-emerald-300/80";
  }

  if (kind === "symbol") {
    return "fill-sky-500/90 stroke-sky-300/80";
  }

  return "fill-teal-500/90 stroke-teal-300/80";
};

const getGraphNodeTextClassName = (kind: graphNode["kind"]) => {
  if (kind === "root") {
    return "text-primary-foreground";
  }

  if (kind === "more") {
    return "text-muted-foreground";
  }

  return "text-white";
};

const countFileNodes = (nodes: fileNode[]): number =>
  nodes.reduce(
    (total, node) => total + 1 + countFileNodes(node.children ?? []),
    0
  );

const truncateNodeLabel = (value: string, maxLength: number) => {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength - 1)}…`;
};

const buildFileNodes = ({
  content,
  filePath,
  language
}: {
  content: string;
  filePath: string;
  language: string;
}): fileNode[] => {
  if (language === "JSON") {
    return buildJsonNodes(content);
  }

  if (language === "Markdown") {
    return buildMarkdownNodes(content);
  }

  return buildSymbolNodes(content);
};

const buildJsonNodes = (content: string): fileNode[] => {
  try {
    return valueToNodes(JSON.parse(content), "JSON document", "json");
  } catch {
    return [];
  }
};

const valueToNodes = (value: unknown, label: string, id: string): fileNode[] => {
  if (Array.isArray(value)) {
    return [
      {
        id,
        label,
        kind: "json",
        detail: `Array(${value.length})`,
        children: value.flatMap((item, index) =>
          valueToNodes(item, `[${index}]`, `${id}.${index}`)
        )
      }
    ];
  }

  if (value && typeof value === "object") {
    const entries = Object.entries(value);

    return [
      {
        id,
        label,
        kind: "json",
        detail: "Object",
        children: entries.flatMap(([key, childValue]) =>
          valueToNodes(childValue, key, `${id}.${key}`)
        )
      }
    ];
  }

  return [
    {
      id,
      label,
      kind: "json",
      detail: formatNodeValue(value)
    }
  ];
};

const buildMarkdownNodes = (content: string): fileNode[] => {
  const nodes = content
    .split("\n")
    .map((line, index): fileNode | null => {
      const heading = line.match(/^(#{1,6})\s+(.*)$/);

      if (heading) {
        return {
          id: `heading-${index}`,
          label: heading[2],
          detail: `H${heading[1].length}`
        };
      }

      const listItem = line.match(/^\s*[-*]\s+(.*)$/);

      if (listItem) {
        return {
          id: `list-${index}`,
          label: listItem[1],
          detail: "List"
        };
      }

      if (line.startsWith("```")) {
        return {
          id: `code-${index}`,
          label: line.replace("```", "").trim() || "Code block",
          detail: "Code"
        };
      }

      return null;
    })
    .filter((node): node is fileNode => Boolean(node));

  if (nodes.length === 0) {
    return [];
  }

  return [
    {
      id: "outline",
      label: "Document outline",
      kind: "group",
      detail: `${nodes.length}`,
      children: nodes
    }
  ];
};

const buildSymbolNodes = (content: string): fileNode[] => {
  const groups: Record<string, fileNode[]> = {
    imports: [],
    exports: [],
    declarations: [],
    calls: []
  };

  content.split("\n").forEach((line, index) => {
    const trimmedLine = line.trim();

    if (!trimmedLine) {
      return;
    }

    const importMatch = trimmedLine.match(/^import\s+(.+)$/);
    const exportMatch = trimmedLine.match(/^export\s+(.+)$/);
    const declarationMatch = trimmedLine.match(
      /^(?:export\s+)?(?:const|let|var|function|type|class|interface)\s+([A-Za-z0-9_$]+)/
    );
    const rustDeclarationMatch = trimmedLine.match(
      /^(?:pub\s+)?(?:fn|struct|enum|type|const|mod)\s+([A-Za-z0-9_]+)/
    );
    const callMatch = trimmedLine.match(/^([A-Za-z0-9_$]+)\(/);

    if (importMatch) {
      groups.imports.push(createLineNode("Import", importMatch[1], index));
    } else if (exportMatch) {
      groups.exports.push(createLineNode("Export", exportMatch[1], index));
    } else {
      const declarationName = declarationMatch?.[1] ?? rustDeclarationMatch?.[1];

      if (declarationName) {
        groups.declarations.push(createLineNode(declarationName, trimmedLine, index));
      } else if (callMatch) {
        groups.calls.push(createLineNode(callMatch[1], trimmedLine, index));
      }
    }
  });

  const nodes = [
    createGroupNode("Imports", groups.imports),
    createGroupNode("Exports", groups.exports),
    createGroupNode("Declarations", groups.declarations),
    createGroupNode("Top-level calls", groups.calls)
  ].filter((node): node is fileNode => Boolean(node));

  return nodes;
};

const createGroupNode = (label: string, children: fileNode[]): fileNode | null => {
  if (children.length === 0) {
    return null;
  }

  return {
    id: getNodeId(label),
    label,
    kind: "group",
    detail: `${children.length}`,
    children
  };
};

const createLineNode = (label: string, detail: string, lineIndex: number): fileNode => ({
  id: `${label}-${lineIndex}`,
  kind: "symbol",
  label,
  detail: `L${lineIndex + 1} ${detail}`
});

const canShowNodeView = (language: string) => {
  return ["JSON", "Markdown", "Node", "Rust"].includes(language);
};

const getFileName = (filePath: string) => {
  const parts = filePath.split(/[\\/]/);

  return parts[parts.length - 1] || filePath;
};

const getNodeId = (label: string) => {
  return label.toLowerCase().replace(/\s+/g, "-");
};

const formatNodeValue = (value: unknown) => {
  if (value === null) {
    return "null";
  }

  if (typeof value === "string") {
    return value;
  }

  return String(value);
};

const renderInlineMarkdown = (value: string) => {
  const parts = value.split(/(`[^`]+`)/g);

  return parts.map((part, index) => {
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code
          key={`${part}-${index}`}
          className="rounded border bg-card px-1 py-0.5 font-mono text-xs text-foreground"
        >
          {part.slice(1, -1)}
        </code>
      );
    }

    return <span key={`${part}-${index}`}>{part}</span>;
  });
};

const highlightNodeLine = (line: string) => {
  const tokens = line.split(
    /(\b(?:const|let|var|function|return|import|from|export|async|await|type|interface|class|new|if|else|throw|try|catch)\b|"[^"]*"|'[^']*'|`[^`]*`|\/\/.*)/g
  );

  return tokens.map((token, index) => {
    const key = `${token}-${index}`;

    if (/^\/\/.*/.test(token)) {
      return <span key={key} className="text-muted-foreground">{token}</span>;
    }

    if (/^["'`]/.test(token)) {
      return <span key={key} className="text-emerald-300">{token}</span>;
    }

    if (/^\b(?:const|let|var|function|return|import|from|export|async|await|type|interface|class|new|if|else|throw|try|catch)\b$/.test(token)) {
      return <span key={key} className="text-primary">{token}</span>;
    }

    return <span key={key}>{token}</span>;
  });
};

const getFileLanguage = (filePath: string | null) => {
  const extension = filePath?.split(".").pop()?.toLowerCase();

  if (!extension) {
    return "Text";
  }

  if (["js", "jsx", "ts", "tsx", "mjs", "cjs"].includes(extension)) {
    return "Node";
  }

  if (["md", "mdx"].includes(extension)) {
    return "Markdown";
  }

  const labels: Record<string, string> = {
    css: "CSS",
    html: "HTML",
    json: "JSON",
    rs: "Rust",
    toml: "TOML",
    yaml: "YAML",
    yml: "YAML"
  };

  return labels[extension] ?? extension.toUpperCase();
};

const getLanguageLabel = (language: string) => {
  return getFileLanguage(`file.${language.toLowerCase()}`);
};

type emptyStateProps = {
  message: string;
};

const EmptyState = ({ message }: emptyStateProps) => {
  return (
    <div className="flex h-full items-center justify-center rounded-md border bg-card p-4 text-sm text-muted-foreground">
      {message}
    </div>
  );
};
