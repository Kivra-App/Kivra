import type { projectNode } from "@/features/project/types/project";

export const updateNodeChildren = (
  node: projectNode,
  targetPath: string,
  children: projectNode[]
): projectNode => {
  if (node.path === targetPath) {
    return { ...node, children };
  }

  if (!node.children) {
    return node;
  }

  return {
    ...node,
    children: node.children.map((childNode) =>
      updateNodeChildren(childNode, targetPath, children)
    )
  };
};

export const sortTree = (node: projectNode) => {
  node.children?.sort((first, second) => {
    if (first.type !== second.type) {
      return first.type === "folder" ? -1 : 1;
    }

    return first.name.localeCompare(second.name);
  });
  node.children?.forEach(sortTree);
};

export const addTreePath = (
  root: projectNode,
  path: string,
  type: "file" | "folder"
) => {
  const parts = path.split("/");
  let current = root;

  for (const [index, part] of parts.entries()) {
    const isLast = index === parts.length - 1;
    const childPath = parts.slice(0, index + 1).join("/");
    const childType = isLast ? type : "folder";
    const existing = current.children?.find((child) => child.name === part);

    if (existing) {
      current = existing;
      continue;
    }

    const nextNode: projectNode = {
      id: childPath,
      name: part,
      path: childPath,
      type: childType,
      children: childType === "folder" ? [] : undefined
    };

    current.children = current.children ?? [];
    current.children.push(nextNode);
    current = nextNode;
  }
};
