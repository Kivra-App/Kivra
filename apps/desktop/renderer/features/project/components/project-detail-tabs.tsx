import { cn } from "@/shared/lib/utils";

export type projectTab = "explorer" | "runs" | "errors" | "knowledge" | "settings";

export const projectTabs: projectTab[] = [
  "explorer",
  "runs",
  "errors",
  "knowledge",
  "settings"
];

type projectTabNavProps = {
  activeTab: projectTab;
  getLabel: (tab: projectTab) => string;
  onChange: (tab: projectTab) => void;
};

export const ProjectTabNav = ({
  activeTab,
  getLabel,
  onChange
}: projectTabNavProps) => (
  <div className="flex rounded-md border bg-background p-1">
    {projectTabs.map((tab) => (
      <button
        key={tab}
        type="button"
        className={cn(
          "h-7 rounded px-2 text-xs capitalize text-muted-foreground",
          activeTab === tab && "bg-muted text-foreground"
        )}
        onClick={() => onChange(tab)}
      >
        {getLabel(tab)}
      </button>
    ))}
  </div>
);

type projectTabSummaryProps = {
  description: string;
  title: string;
};

export const ProjectTabSummary = ({
  description,
  title
}: projectTabSummaryProps) => (
  <div className="mb-3 shrink-0 rounded-md border bg-card px-3 py-2">
    <div className="text-xs font-medium">{title}</div>
    <div className="mt-1 text-xs text-muted-foreground">{description}</div>
  </div>
);
