import { Loader2, Trash2 } from "lucide-react";

import { Button } from "@/shared/ui/button";

type projectSettingsPanelProps = {
  deleteDetail: string;
  deleteLabel: string;
  isDeleting: boolean;
  message: string;
  onDelete: () => void;
};

export const ProjectSettingsPanel = ({
  deleteDetail,
  deleteLabel,
  isDeleting,
  message,
  onDelete
}: projectSettingsPanelProps) => (
  <div className="space-y-3">
    <div className="rounded-md border bg-card p-4 text-sm text-muted-foreground">
      {message}
    </div>
    <div className="rounded-md border border-destructive/30 bg-card p-4">
      <div className="text-sm font-medium text-destructive">{deleteLabel}</div>
      <p className="mt-1 text-xs leading-5 text-muted-foreground">
        {deleteDetail}
      </p>
      <Button
        type="button"
        className="mt-3"
        variant="danger"
        disabled={isDeleting}
        onClick={onDelete}
      >
        {isDeleting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Trash2 className="h-4 w-4" />
        )}
        {deleteLabel}
      </Button>
    </div>
  </div>
);
