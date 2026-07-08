import { motion } from "framer-motion";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  ListFilter,
  Terminal,
  Timer,
  WrapText
} from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import {
  CopyOutputButton,
  OutputStatCard,
  SegmentedControl,
  SummaryChip
} from "@/features/run/components/run-log-panel-parts";
import type { runResult } from "@/features/run/types/run";
import {
  getOutputStats,
  getVisibleOutput,
  type runOutputStream
} from "@/features/run/utils/run-output";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";

type runLogPanelProps = {
  run: runResult | null;
};

export const RunLogPanel = ({ run }: runLogPanelProps) => {
  const { t } = useTranslation();
  const [activeStream, setActiveStream] = useState<runOutputStream>("all");
  const [wrapLines, setWrapLines] = useState(true);

  if (!run) {
    return (
      <div className="flex h-full min-h-[420px] items-center justify-center rounded-md border bg-card p-4 text-sm text-muted-foreground">
        {t("runs.selectRun")}
      </div>
    );
  }

  const summaryItems = [
    {
      icon: <CheckCircle2 className="h-4 w-4" />,
      label: t("runs.status"),
      value: run.status
    },
    {
      icon: <Timer className="h-4 w-4" />,
      label: t("runs.duration"),
      value: `${run.duration} ms`
    },
    {
      icon: <Clock3 className="h-4 w-4" />,
      label: t("runs.timestamp"),
      value: new Date(run.createdAt).toLocaleString()
    },
    {
      icon: <Terminal className="h-4 w-4" />,
      label: t("runs.exitCode"),
      value: String(run.exitCode ?? "-")
    }
  ];
  const streamCounts = {
    stdout: getOutputStats(run.stdout),
    stderr: getOutputStats(run.stderr)
  };
  const hasStdout = run.stdout.trim().length > 0;
  const hasStderr = run.stderr.trim().length > 0;
  const visibleOutput = getVisibleOutput({
    stderr: run.stderr,
    stdout: run.stdout,
    stream: activeStream,
    t
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      className="grid h-full min-h-0 min-w-0 grid-rows-[minmax(0,1fr)_auto] gap-4 2xl:grid-cols-[minmax(0,1fr)_260px] 2xl:grid-rows-1"
    >
      <div className="flex min-h-0 min-w-0 flex-col overflow-hidden rounded-md border bg-card">
        <div className="border-b px-4 py-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Terminal className="h-4 w-4" />
                {t("runs.output")}
              </div>
              <div className="mt-1 max-w-full break-all font-mono text-xs text-muted-foreground">
                {run.command}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <SegmentedControl
                value={activeStream}
                onChange={setActiveStream}
                options={[
                  { label: t("runs.all"), value: "all" },
                  { label: t("runs.stdout"), value: "stdout", disabled: !hasStdout },
                  { label: t("runs.stderr"), value: "stderr", disabled: !hasStderr }
                ]}
              />
              <Button
                type="button"
                size="sm"
                variant={wrapLines ? "primary" : "secondary"}
                onClick={() => setWrapLines((currentValue) => !currentValue)}
              >
                <WrapText className="h-4 w-4" />
                {t("runs.wrap")}
              </Button>
              <CopyOutputButton value={visibleOutput} />
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {summaryItems.map((item) => (
              <SummaryChip
                key={item.label}
                icon={item.icon}
                label={item.label}
                value={item.value}
              />
            ))}
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-auto p-4">
          <div className="h-full min-w-0">
            <pre
              className={cn(
                "min-h-full min-w-0 rounded-md border bg-background p-4 font-mono text-xs leading-6",
                wrapLines
                  ? "whitespace-pre-wrap break-words"
                  : "overflow-x-auto whitespace-pre"
              )}
            >
              {visibleOutput}
            </pre>
          </div>
        </div>
      </div>

      <div className="grid min-h-0 min-w-0 gap-4 overflow-auto 2xl:content-start">
        <aside className="rounded-md border bg-card p-3">
          <div className="mb-3 flex items-center gap-2 text-sm font-medium">
            <ListFilter className="h-4 w-4" />
            {t("runs.streamOverview")}
          </div>
          <div className="grid gap-2">
            <OutputStatCard
              label={t("runs.stdout")}
              lines={streamCounts.stdout.lines}
              characters={streamCounts.stdout.characters}
            />
            <OutputStatCard
              label={t("runs.stderr")}
              lines={streamCounts.stderr.lines}
              characters={streamCounts.stderr.characters}
              tone="danger"
            />
          </div>
        </aside>

        {run.errors.length > 0 && (
          <aside className="rounded-md border bg-card p-3">
            <div className="mb-3 flex items-center gap-2 text-sm font-medium">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              {t("runs.detectedErrors")}
            </div>
            <div className="space-y-2">
              {run.errors.map((error) => (
                <div
                  key={error.id}
                  className="rounded-md border bg-background p-3"
                >
                  <div className="text-sm">{error.message}</div>
                  <div className="mt-1 font-mono text-xs text-muted-foreground">
                    {error.filePath ?? "raw"}:{error.lineNumber ?? "-"}:
                    {error.columnNumber ?? "-"}
                  </div>
                </div>
              ))}
            </div>
          </aside>
        )}
      </div>
    </motion.div>
  );
};
