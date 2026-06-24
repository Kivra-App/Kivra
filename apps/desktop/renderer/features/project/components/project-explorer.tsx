import { ChevronRight, File, Folder, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

import type { projectNode } from "@/features/project/types/project";
import { updateNodeChildren } from "@/features/project/utils/project-tree";
import { cn } from "@/shared/lib/utils";

type projectExplorerProps = {
  onLoadDirectory?: (directoryPath: string) => Promise<projectNode[]>;
  onSelectFile: (filePath: string) => void;
  selectedFilePath: string | null;
  tree: projectNode;
};

type projectNodeRowProps = {
  node: projectNode;
  depth: number;
  loadingPath: string | null;
  onLoadDirectory?: (directoryPath: string) => Promise<void>;
  onSelectFile: (filePath: string) => void;
  selectedFilePath: string | null;
};

const ProjectNodeRow = ({
  node,
  depth,
  loadingPath,
  onLoadDirectory,
  onSelectFile,
  selectedFilePath
}: projectNodeRowProps) => {
  const [isOpen, setIsOpen] = useState(depth < 1);
  const isLoading = loadingPath === node.path;

  const handleNodeClick = async () => {
    if (node.type === "file") {
      onSelectFile(node.path);
      return;
    }

    if (isOpen) {
      setIsOpen(false);
      return;
    }

    if (!node.children && onLoadDirectory) {
      await onLoadDirectory(node.path);
    }

    setIsOpen(true);
  };

  return (
    <div>
      <button
        type="button"
        className={cn(
          "flex h-7 w-full items-center gap-1 border-b px-2 text-left text-xs transition hover:bg-muted",
          selectedFilePath === node.path && "bg-muted"
        )}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        disabled={isLoading}
        onClick={() => {
          void handleNodeClick();
        }}
      >
        {node.type === "folder" ? (
          <span className="flex h-6 w-6 items-center justify-center">
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ChevronRight
                className={cn("h-4 w-4 transition", isOpen && "rotate-90")}
              />
            )}
          </span>
        ) : (
          <span className="h-6 w-6" />
        )}
        {node.type === "folder" ? (
          <Folder className="h-4 w-4 text-muted-foreground" />
        ) : (
          <File className="h-4 w-4 text-muted-foreground" />
        )}
        <span className="truncate">{node.name}</span>
      </button>
      {isOpen &&
        node.children?.map((childNode) => (
          <ProjectNodeRow
            key={childNode.id}
            node={childNode}
            depth={depth + 1}
            loadingPath={loadingPath}
            onLoadDirectory={onLoadDirectory}
            onSelectFile={onSelectFile}
            selectedFilePath={selectedFilePath}
          />
        ))}
    </div>
  );
};

export const ProjectExplorer = ({
  onLoadDirectory,
  onSelectFile,
  selectedFilePath,
  tree
}: projectExplorerProps) => {
  const [visibleTree, setVisibleTree] = useState(tree);
  const [loadingPath, setLoadingPath] = useState<string | null>(null);

  useEffect(() => {
    setVisibleTree(tree);
  }, [tree]);

  const handleLoadDirectory = async (directoryPath: string) => {
    if (!onLoadDirectory) {
      return;
    }

    setLoadingPath(directoryPath);

    try {
      const children = await onLoadDirectory(directoryPath);

      setVisibleTree((currentTree) =>
        updateNodeChildren(currentTree, directoryPath, children)
      );
    } finally {
      setLoadingPath(null);
    }
  };

  return (
    <div className="h-full overflow-auto rounded-md border bg-card">
      <ProjectNodeRow
        node={visibleTree}
        depth={0}
        loadingPath={loadingPath}
        onLoadDirectory={handleLoadDirectory}
        onSelectFile={onSelectFile}
        selectedFilePath={selectedFilePath}
      />
    </div>
  );
};
