import { motion } from "framer-motion";
import { CheckCircle2, CircleAlert, TerminalSquare } from "lucide-react";

export const HeroMemoryPanel = ({
  labels
}: {
  labels: {
    command: string;
    error: string;
    note: string;
    title: string;
  };
}) => {
  return (
    <div className="relative h-full min-h-[420px] overflow-hidden rounded-lg border border-border/80 bg-card">
      <div className="flex h-full flex-col">
        <div className="flex h-12 items-center justify-between border-b border-border/80 px-4">
          <div className="flex items-center gap-2 text-sm font-medium">
            <TerminalSquare className="h-4 w-4 text-muted-foreground" />
            {labels.title}
          </div>
          <div className="rounded-md border border-border/80 bg-background px-2 py-1 font-mono text-[11px] text-muted-foreground">
            pnpm build
          </div>
        </div>

        <div className="grid min-h-0 flex-1 grid-rows-[1fr_auto]">
          <div className="grid min-h-0 grid-cols-[minmax(0,1fr)_260px]">
            <div className="min-h-0 border-r border-border/80 bg-[#0b0d11] p-4">
              <div className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {labels.command}
              </div>
              <div className="space-y-2 font-mono text-xs leading-5 text-muted-foreground">
                <TerminalLine delay={0}>$ pnpm --filter @kivra/desktop build</TerminalLine>
                <TerminalLine delay={0.08}>vite v5.4.21 building for production...</TerminalLine>
                <TerminalLine delay={0.16}>transforming modules...</TerminalLine>
                <TerminalLine delay={0.24} tone="error">
                  src/features/project/components/code-node-viewer.tsx:122:18
                </TerminalLine>
                <TerminalLine delay={0.32} tone="error">
                  Type error: selected node is not reachable from current graph
                </TerminalLine>
                <TerminalLine delay={0.4}>captured stdout, stderr, exit code, and project path</TerminalLine>
              </div>
            </div>

            <div className="min-h-0 bg-background/60 p-4">
              <div className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {labels.error}
              </div>
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.22, duration: 0.32, ease: "easeOut" }}
                className="rounded-lg border border-[#59d6c2]/35 bg-[#121d1c] p-3"
              >
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <CircleAlert className="h-4 w-4 text-[#59d6c2]" />
                  code-node-viewer.tsx
                </div>
                <div className="mt-2 font-mono text-[11px] leading-5 text-muted-foreground">
                  line 122
                  <br />
                  graph selection
                  <br />
                  exit code 2
                </div>
              </motion.div>
            </div>
          </div>

          <div className="border-t border-border/80 bg-card p-4">
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.42, duration: 0.32, ease: "easeOut" }}
              className="grid gap-3 sm:grid-cols-[auto_1fr]"
            >
              <div className="grid h-10 w-10 place-items-center rounded-md border border-border/80 bg-background">
                <CheckCircle2 className="h-4 w-4 text-[#59d6c2]" />
              </div>
              <div>
                <div className="text-sm font-medium">{labels.note}</div>
                <div className="mt-1 text-xs leading-5 text-muted-foreground">
                  Reuse the last fix: preserve selected node id only after the graph has rebuilt.
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

const TerminalLine = ({
  children,
  delay,
  tone = "default"
}: {
  children: string;
  delay: number;
  tone?: "default" | "error";
}) => (
  <motion.div
    initial={{ opacity: 0, x: -4 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay, duration: 0.22, ease: "easeOut" }}
    className={tone === "error" ? "text-[#fca5a5]" : undefined}
  >
    {children}
  </motion.div>
);
