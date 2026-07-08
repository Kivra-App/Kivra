import type { CSSProperties } from "react";

import type { Edge, Node } from "@xyflow/react";

import type {
  codeNode,
  codeNodeCategory,
  codeNodeGraph,
  codeNodeType
} from "@/features/project/services/node-graph-service";
import {
  CATEGORY_POSITIONS,
  CHILD_LANES,
  VISIBLE_CHILD_LIMIT,
  getNodeClassName,
  getNodeStyle,
  isSearchMatch
} from "@/features/project/services/node-layout-constants";

export type nodeGraphViewState = {
  expandedGroups: Set<codeNodeCategory>;
  expandedMoreGroups: Set<codeNodeCategory>;
  pinnedGroups: Set<codeNodeCategory>;
  searchQuery: string;
  selectedNodeId: string;
};

export type nodeGraphNodeData = Record<string, unknown> & {
  category?: codeNodeCategory;
  codeNode?: codeNode;
  count?: number;
  label: string;
  lineNumber?: number;
  nodeType: codeNodeType | "category";
  searchMatch?: boolean;
};

export type nodeGraphFlowNode = Node<nodeGraphNodeData> & {
  className: string;
  style?: CSSProperties;
};

export type nodeGraphFlowEdge = Omit<Edge, "label"> & {
  className: string;
  label: string | undefined;
};

export const buildNodeFlow = ({
  graph,
  viewState
}: {
  graph: codeNodeGraph;
  viewState: nodeGraphViewState;
}): {
  edges: nodeGraphFlowEdge[];
  nodes: nodeGraphFlowNode[];
  selectedCodeNode: codeNode;
  visibleCodeNodes: codeNode[];
} => {
  const nodes: nodeGraphFlowNode[] = [];
  const edges: nodeGraphFlowEdge[] = [];
  const visibleCodeNodes: codeNode[] = [];
  const query = viewState.searchQuery.trim().toLowerCase();

  nodes.push({
    className: getNodeClassName("file", false),
    data: {
      codeNode: graph.fileNode,
      label: graph.fileNode.name,
      nodeType: "file"
    },
    id: graph.fileNode.id,
    position: { x: 0, y: 0 },
    style: getNodeStyle("file"),
    type: "default"
  });

  for (const group of graph.groups) {
    const groupPosition = CATEGORY_POSITIONS[group.id];
    const groupId = `category:${group.id}`;
    const groupIsExpanded = viewState.expandedGroups.has(group.id);
    const visibleChildren = groupIsExpanded
      ? group.nodes.slice(
          0,
          viewState.expandedMoreGroups.has(group.id)
            ? group.nodes.length
            : VISIBLE_CHILD_LIMIT
        )
      : [];
    const hiddenCount = Math.max(group.nodes.length - visibleChildren.length, 0);

    nodes.push({
      className: getNodeClassName("category", isSearchMatch(group.label, query)),
      data: {
        category: group.id,
        count: group.count,
        label: group.label,
        nodeType: "category",
        searchMatch: isSearchMatch(group.label, query)
      },
      id: groupId,
      position: groupPosition,
      style: getNodeStyle("category"),
      type: "default"
    });
    edges.push(createEdge("file", groupId));

    visibleChildren.forEach((child, index) => {
      const childPosition = getChildPosition({
        groupId: group.id,
        index,
        total: visibleChildren.length
      });
      const searchMatch = isSearchMatch(child.name, query) || isSearchMatch(child.codePreview, query);

      visibleCodeNodes.push(child);
      nodes.push({
        className: getNodeClassName(child.type, searchMatch),
        data: {
          category: group.id,
          codeNode: child,
          label: child.name,
          lineNumber: child.lineNumber,
          nodeType: child.type,
          searchMatch
        },
        id: child.id,
        position: {
          x: groupPosition.x + childPosition.x,
          y: groupPosition.y + childPosition.y
        },
        style: getNodeStyle(child.type),
        type: "default"
      });
      edges.push(createEdge(groupId, child.id));
    });

    if (hiddenCount > 0) {
      const morePosition = getChildPosition({
        groupId: group.id,
        index: visibleChildren.length,
        total: visibleChildren.length + 1
      });

      nodes.push({
        className: getNodeClassName("more", false),
        data: {
          category: group.id,
          count: hiddenCount,
          label: `+${hiddenCount} more`,
          nodeType: "more"
        },
        id: `more:${group.id}`,
        position: {
          x: groupPosition.x + morePosition.x,
          y: groupPosition.y + morePosition.y
        },
        style: getNodeStyle("more"),
        type: "default"
      });
      edges.push(createEdge(groupId, `more:${group.id}`));
    }
  }

  const selectedCodeNode =
    getCodeNodeById(graph, viewState.selectedNodeId) ?? graph.fileNode;

  return {
    edges,
    nodes,
    selectedCodeNode,
    visibleCodeNodes
  };
};

export const getCodeNodeById = (
  graph: codeNodeGraph,
  nodeId: string
): codeNode | null => {
  if (nodeId === graph.fileNode.id) {
    return graph.fileNode;
  }

  return graph.groups.flatMap((group) => group.nodes).find((node) => node.id === nodeId) ?? null;
};

export const getConnectedNodeIds = (node: codeNode): Set<string> => {
  return new Set([node.id, ...node.connectedNodeIds]);
};

const getChildPosition = ({
  groupId,
  index,
  total
}: {
  groupId: codeNodeCategory;
  index: number;
  total: number;
}) => {
  const lane = CHILD_LANES[groupId];
  const laneIndex = Math.floor(index / lane.wrapAfter);
  const itemIndex = index % lane.wrapAfter;
  const centeredOffset = itemIndex - (Math.min(total, lane.wrapAfter) - 1) / 2;
  const crossOffset = centeredOffset * lane.crossStep;
  const mainOffset = laneIndex * lane.mainStep;
  const x =
    lane.originX +
    (lane.mainAxis === "x" ? mainOffset : 0) +
    (lane.crossAxis === "x" ? crossOffset : 0);
  const y =
    lane.originY +
    (lane.mainAxis === "y" ? mainOffset : 0) +
    (lane.crossAxis === "y" ? crossOffset : 0);

  return {
    x,
    y
  };
};

const createEdge = (source: string, target: string): nodeGraphFlowEdge => ({
  animated: false,
  className: "stroke-border/70",
  id: `${source}->${target}`,
  label: undefined,
  source,
  target,
  type: "straight"
});
