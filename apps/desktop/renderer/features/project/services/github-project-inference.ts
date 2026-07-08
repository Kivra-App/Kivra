import type { projectNode } from "@/features/project/types/project";

export const inferRuntime = (language: string | null) => {
  if (!language) {
    return "unknown";
  }

  if (["JavaScript", "TypeScript"].includes(language)) {
    return "Node.js";
  }

  return language;
};

export const inferFramework = (tree: projectNode) => {
  const paths = collectProjectPaths(tree);

  if (paths.has("apps/desktop/native/tauri.conf.json") || paths.has("tauri.conf.json")) {
    return "Tauri";
  }

  if (
    hasPackageHint(paths, "next.config.js") ||
    hasPackageHint(paths, "next.config.mjs") ||
    hasPackageHint(paths, "next.config.ts")
  ) {
    return "Next.js";
  }

  if (hasPackageHint(paths, "vite.config.ts") || hasPackageHint(paths, "vite.config.js")) {
    return "Vite";
  }

  if (paths.has("package.json")) {
    return "Node.js";
  }

  return "Repository";
};

export const inferPackageManager = (tree: projectNode) => {
  const paths = collectProjectPaths(tree);

  if (hasPackageHint(paths, "pnpm-lock.yaml") || paths.has("pnpm-workspace.yaml")) {
    return "pnpm";
  }

  if (hasPackageHint(paths, "yarn.lock")) {
    return "yarn";
  }

  if (hasPackageHint(paths, "package-lock.json")) {
    return "npm";
  }

  if (hasPackageHint(paths, "bun.lockb")) {
    return "bun";
  }

  if (hasPackageHint(paths, "Cargo.toml")) {
    return "cargo";
  }

  return "unknown";
};

const collectProjectPaths = (node: projectNode): Set<string> => {
  const paths = new Set<string>();

  const visit = (currentNode: projectNode, prefix = "") => {
    const currentPath = prefix ? `${prefix}/${currentNode.name}` : currentNode.name;
    paths.add(currentPath);

    for (const child of currentNode.children ?? []) {
      visit(child, currentPath);
    }
  };

  for (const child of node.children ?? []) {
    visit(child);
  }

  return paths;
};

const hasPackageHint = (paths: Set<string>, filename: string) =>
  Array.from(paths).some(
    (path) => path === filename || path.endsWith(`/${filename}`)
  );
