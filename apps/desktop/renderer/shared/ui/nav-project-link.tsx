import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

type projectTab = "explorer" | "runs" | "errors" | "knowledge" | "settings";

type navProjectLinkProps = {
  children: ReactNode;
  projectId: string | null;
  search: { tab: projectTab };
  title?: string;
};

export const NavProjectLink = ({
  children,
  projectId,
  search,
  title
}: navProjectLinkProps) => {
  if (!projectId) {
    return (
      <div
        title={title}
        className="flex h-8 cursor-not-allowed items-center gap-2 rounded-md px-2 text-sm text-muted-foreground"
      >
        {children}
      </div>
    );
  }

  return (
    <Link
      to="/projects/$projectId"
      params={{ projectId }}
      search={search}
      title={title}
      className="flex h-8 items-center gap-2 rounded-md px-2 text-sm transition hover:bg-muted"
      activeProps={{ className: "bg-muted font-medium" }}
    >
      {children}
    </Link>
  );
};
