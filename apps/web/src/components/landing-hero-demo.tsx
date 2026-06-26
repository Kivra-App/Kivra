import { motion } from "framer-motion";
import { CheckCircle2, FolderGit2, TerminalSquare } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { HeroDemoErrorCard } from "@/components/hero-demo-error-card";
import { HeroDemoLog } from "@/components/hero-demo-log";
import { HeroDemoResolutionNote } from "@/components/hero-demo-resolution-note";

export type HeroDemoStep = {
  content: string;
  delayMs: number;
  id: string;
  type: "command" | "stdout" | "stderr" | "error" | "note" | "success";
};

const demoSteps: HeroDemoStep[] = [
  {
    content: "$ pnpm build",
    delayMs: 0,
    id: "command",
    type: "command"
  },
  {
    content: "vite v5.4.21 building for production...",
    delayMs: 700,
    id: "stdout-build",
    type: "stdout"
  },
  {
    content: "transforming modules...",
    delayMs: 700,
    id: "stdout-transform",
    type: "stdout"
  },
  {
    content: "✓ 142 modules transformed.",
    delayMs: 700,
    id: "stdout-modules",
    type: "stdout"
  },
  {
    content: "src/features/project/components/code-node-viewer.tsx:122:18",
    delayMs: 850,
    id: "stderr-path",
    type: "stderr"
  },
  {
    content: "Type error: selected node is not reachable from current graph",
    delayMs: 650,
    id: "stderr-message",
    type: "stderr"
  },
  {
    content: "Detected code-node-viewer.tsx line 122",
    delayMs: 650,
    id: "error-card",
    type: "error"
  },
  {
    content: "Preserve selected node id only after the graph has rebuilt.",
    delayMs: 650,
    id: "resolution-note",
    type: "note"
  },
  {
    content: "Memory updated.",
    delayMs: 800,
    id: "memory-updated",
    type: "success"
  }
];

const loopDelayMs = 2300;

export const LandingHeroDemo = () => {
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const visibleSteps = demoSteps.slice(0, activeStepIndex + 1);
  const hasError = visibleSteps.some((step) => step.type === "error");
  const hasNote = visibleSteps.some((step) => step.type === "note");
  const hasSuccess = visibleSteps.some((step) => step.type === "success");
  const statusLabel = useMemo(() => {
    if (hasSuccess) {
      return "Memory updated";
    }

    if (hasNote) {
      return "Resolution attached";
    }

    if (hasError) {
      return "Error detected";
    }

    return "Capturing run";
  }, [hasError, hasNote, hasSuccess]);

  useEffect(() => {
    if (isPaused) {
      return undefined;
    }

    const isLastStep = activeStepIndex >= demoSteps.length - 1;
    const nextDelay = isLastStep
      ? loopDelayMs
      : demoSteps[activeStepIndex + 1].delayMs;
    const timeoutId = window.setTimeout(() => {
      setActiveStepIndex((currentIndex) =>
        currentIndex >= demoSteps.length - 1 ? 0 : currentIndex + 1
      );
    }, nextDelay);

    return () => window.clearTimeout(timeoutId);
  }, [activeStepIndex, isPaused]);

  const restart = () => {
    setActiveStepIndex(0);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.985 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.55, ease: "easeOut", delay: 0.08 }}
      className="min-h-[420px]"
    >
      <button
        type="button"
        className="block h-full min-h-[420px] w-full overflow-hidden rounded-lg border border-border/80 bg-card text-left shadow-panel"
        onClick={restart}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        <div className="flex h-full min-h-[420px] flex-col">
          <div className="flex h-12 items-center justify-between border-b border-border/80 px-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <TerminalSquare className="h-4 w-4 text-muted-foreground" />
              Kivra
            </div>
            <div className="flex items-center gap-2">
              <div className="rounded-md border border-border/80 bg-background px-2 py-1 font-mono text-[11px] text-muted-foreground">
                pnpm build
              </div>
              <div
                className={[
                  "rounded-md border px-2 py-1 text-[11px]",
                  hasSuccess
                    ? "border-[#59d6c2]/35 bg-[#121d1c] text-[#9beadf]"
                    : "border-border/80 bg-background text-muted-foreground"
                ].join(" ")}
              >
                {statusLabel}
              </div>
            </div>
          </div>

          <div className="grid min-h-0 flex-1 grid-rows-[minmax(0,1fr)_auto]">
            <div className="grid min-h-0 grid-cols-[minmax(0,1fr)_260px]">
              <HeroDemoLog steps={visibleSteps} />
              <div className="grid min-h-0 gap-3 bg-background/60 p-4">
                <div>
                  <div className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Detected error
                  </div>
                  <HeroDemoErrorCard isVisible={hasError} />
                </div>
                <div>
                  <div className="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    <FolderGit2 className="h-3.5 w-3.5" />
                    Project memory
                  </div>
                  <HeroDemoResolutionNote
                    isMemoryUpdated={hasSuccess}
                    isVisible={hasNote}
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-border/80 bg-card px-4 py-3">
              <motion.div
                key={statusLabel}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="flex items-center gap-2 text-xs text-muted-foreground"
              >
                <CheckCircle2
                  className={[
                    "h-4 w-4",
                    hasSuccess ? "text-[#59d6c2]" : "text-muted-foreground"
                  ].join(" ")}
                />
                {hasSuccess
                  ? "Run, error, file path, and resolution note are stored together."
                  : "Capturing stdout, stderr, exit code, and project path."}
              </motion.div>
            </div>
          </div>
        </div>
      </button>
    </motion.div>
  );
};
