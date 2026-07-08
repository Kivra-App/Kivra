import { CheckCircle2, CircleAlert } from "lucide-react";

type statusBadgeProps = {
  isInstalled: boolean;
  label: string;
};

export const StatusBadge = ({ isInstalled, label }: statusBadgeProps) => (
  <span className="inline-flex shrink-0 items-center gap-1 rounded-md border bg-background px-2 py-1 text-xs text-muted-foreground">
    {isInstalled ? (
      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
    ) : (
      <CircleAlert className="h-3.5 w-3.5 text-amber-500" />
    )}
    {label}
  </span>
);
