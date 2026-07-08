import { Copy } from "lucide-react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import type { runOutputStream } from "@/features/run/utils/run-output";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";

type summaryChipProps = {
  icon: ReactNode;
  label: string;
  value: string;
};

export const SummaryChip = ({ icon, label, value }: summaryChipProps) => (
  <div className="inline-flex items-center gap-2 rounded-md border bg-background px-3 py-2 text-xs">
    <span className="text-muted-foreground">{icon}</span>
    <span className="text-muted-foreground">{label}</span>
    <span className="font-medium text-foreground">{value}</span>
  </div>
);

type outputStatCardProps = {
  characters: number;
  label: string;
  lines: number;
  tone?: "default" | "danger";
};

export const OutputStatCard = ({
  label,
  lines,
  characters,
  tone = "default"
}: outputStatCardProps) => {
  const { t } = useTranslation();

  return (
    <div
      className={cn(
        "rounded-md border bg-background p-3",
        tone === "danger" && "border-destructive/30"
      )}
    >
      <div className="text-xs font-medium uppercase text-muted-foreground">
        {label}
      </div>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <div className="min-w-0">
          <div className="text-[11px] text-muted-foreground">
            {t("runs.lines")}
          </div>
          <div className="text-sm font-medium">{lines.toLocaleString()}</div>
        </div>
        <div className="min-w-0">
          <div className="text-[11px] text-muted-foreground">
            {t("runs.characters")}
          </div>
          <div className="text-sm font-medium">
            {characters.toLocaleString()}
          </div>
        </div>
      </div>
    </div>
  );
};

export const CopyOutputButton = ({ value }: { value: string }) => {
  const { t } = useTranslation();

  return (
    <Button
      type="button"
      size="sm"
      variant="secondary"
      onClick={() => {
        void navigator.clipboard?.writeText(value);
      }}
    >
      <Copy className="h-4 w-4" />
      {t("runs.copy")}
    </Button>
  );
};

type segmentedControlProps = {
  onChange: (value: runOutputStream) => void;
  options: { label: string; value: runOutputStream; disabled?: boolean }[];
  value: runOutputStream;
};

export const SegmentedControl = ({
  onChange,
  options,
  value
}: segmentedControlProps) => (
  <div className="flex h-8 items-center rounded-md border bg-background px-1">
    {options.map((option) => (
      <button
        key={option.value}
        type="button"
        className={cn(
          "flex h-6 items-center rounded px-2.5 text-xs transition",
          value === option.value
            ? "bg-muted text-foreground"
            : "text-muted-foreground",
          option.disabled && "cursor-not-allowed opacity-40"
        )}
        disabled={option.disabled}
        onClick={() => onChange(option.value)}
      >
        {option.label}
      </button>
    ))}
  </div>
);
