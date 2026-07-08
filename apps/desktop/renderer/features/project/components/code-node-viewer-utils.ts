import type { TFunction } from "i18next";

import type { codeNode, codeNodeGraph } from "@/features/project/services/node-graph-service";
import type { nodeGraphFlowNode } from "@/features/project/services/node-layout-service";

export type detailNode = {
  codePreview: string;
  connectedNodeIds: string[];
  filePath: string;
  id: string;
  lineNumber: number;
  name: string;
  type: string;
};

export const getNodeLabel = (
  node: nodeGraphFlowNode,
  t: TFunction
) => {
  if (node.data.nodeType === "category" && node.data.category) {
    return t(`explorer.nodeView.groups.${node.data.category}`);
  }

  if (node.data.nodeType === "more") {
    return t("explorer.nodeView.more", { count: node.data.count ?? 0 });
  }

  return node.data.label;
};

export const getSelectedDetailNode = ({
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
        : [
            flowNode.data.category
              ? `category:${flowNode.data.category}`
              : graph.fileNode.id
          ],
      filePath: graph.fileNode.filePath,
      id: flowNode.id,
      lineNumber: 1,
      name: flowNode.data.label,
      type: flowNode.data.nodeType
    };
  }

  return graph.fileNode;
};

export const getConnectedDetailNodes = ({
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
