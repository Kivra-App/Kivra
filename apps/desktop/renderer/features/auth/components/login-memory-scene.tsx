import {
  AlertTriangle,
  Box,
  CheckCircle2,
  Clock3,
  FolderOpen,
  ListFilter,
  Play,
  Settings,
  Terminal,
  Timer
} from "lucide-react";

import { Logo } from "@/shared/ui/logo";

type loginMemorySceneProps = {
  className?: string;
};

const runRows = [
  {
    command: "pnpm build",
    duration: "11918 ms",
    status: "FAILED",
    time: "11:58:18",
    tone: "danger"
  },
  {
    command: "http://localhost:3000/",
    duration: "12738 ms",
    status: "SUCCESS",
    time: "11:58:17",
    tone: "default"
  },
  {
    command: "Node.js Process",
    duration: "1837 ms",
    status: "SUCCESS",
    time: "11:57:37",
    tone: "default"
  }
];

const outputLines = [
  "pagePath=\"layout.tsx\">",
  "  <SegmentTrieNode>",
  "  <link>",
  "  <script>",
  "  <RootLayout>",
  "    <html lang=\"ko\"",
  "      className=\"outfit_2c3...\"",
  "      suppressHydrationWarning={true}>"
];

export const LoginMemoryScene = ({ className }: loginMemorySceneProps) => {
  return (
    <div className={className} aria-hidden="true">
      <div className="flex h-full items-center">
        <div className="w-full min-w-[660px] origin-center -rotate-[1.5deg] rounded-[14px] border border-white/10 bg-card shadow-2xl shadow-black/50">
          <div className="flex h-7 items-center gap-2 border-b border-border bg-background/80 px-3">
            <span className="h-3 w-3 rounded-full bg-muted" />
            <span className="h-3 w-3 rounded-full bg-muted" />
            <span className="h-3 w-3 rounded-full bg-muted" />
            <span className="ml-2 text-[11px] font-medium text-muted-foreground">
              Kivra
            </span>
          </div>

          <div className="grid h-[470px] grid-cols-[150px_minmax(0,1fr)] overflow-hidden rounded-b-[14px]">
            <aside className="flex min-h-0 flex-col border-r bg-card">
              <div className="border-b px-3 py-3">
                <Logo size="sm" showTagline />
              </div>
              <nav className="space-y-1 p-2 text-[11px]">
                <MockNavItem icon={<Box className="h-3.5 w-3.5" />} label="Dashboard" />
                <MockNavItem
                  active
                  icon={<FolderOpen className="h-3.5 w-3.5" />}
                  label="bigtablet-notiiv"
                />
                <MockNavItem
                  icon={<Settings className="h-3.5 w-3.5" />}
                  label="Settings"
                />
              </nav>
              <div className="mt-auto border-t p-2">
                <div className="flex items-center gap-2 rounded-md px-2 py-2">
                  <span className="h-6 w-6 rounded-md border bg-background" />
                  <span className="text-[11px] font-medium">8954sood</span>
                </div>
              </div>
            </aside>

            <main className="min-w-0 bg-background">
              <header className="border-b bg-card px-4 py-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h2 className="truncate text-sm font-semibold">
                      bigtablet-notiiv-monorepo-web
                    </h2>
                    <p className="mt-1 truncate font-mono text-[11px] text-muted-foreground">
                      /Users/byungjun/Desktop/web/bigtablet-insight-monorepo-web
                    </p>
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-[10px]">
                    <MockMetadata label="Runtime" value="Node.js" />
                    <MockMetadata label="Framework" value="Vite" />
                    <MockMetadata label="Package" value="pnpm" />
                    <MockMetadata label="Branch" value="feat/log-search" />
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between gap-3">
                  <div className="flex rounded-md border bg-background p-1 text-[10px]">
                    <span className="rounded px-2 py-1 text-muted-foreground">
                      Explorer
                    </span>
                    <span className="rounded bg-muted px-2 py-1 text-foreground">
                      Runs
                    </span>
                    <span className="rounded px-2 py-1 text-muted-foreground">
                      Errors
                    </span>
                  </div>
                  <div className="flex min-w-[230px] items-center gap-2">
                    <div className="h-8 flex-1 rounded-md border bg-background px-3 py-2 font-mono text-[10px]">
                      pnpm build
                    </div>
                    <div className="flex h-8 items-center gap-1 rounded-md bg-primary px-3 text-[10px] font-medium text-primary-foreground">
                      <Play className="h-3.5 w-3.5" />
                      Run
                    </div>
                  </div>
                </div>
              </header>

              <section className="grid h-[355px] min-h-0 grid-cols-[210px_minmax(0,1fr)] gap-3 p-3">
                <div className="min-h-0 overflow-hidden rounded-md border bg-card">
                  <div className="border-b px-3 py-2">
                    <div className="text-[11px] font-medium">Run History</div>
                    <div className="mt-1 text-[10px] text-muted-foreground">
                      33 runs
                    </div>
                  </div>
                  <div className="space-y-2 p-2">
                    {runRows.map((run) => (
                      <MockRunRow key={`${run.command}-${run.time}`} {...run} />
                    ))}
                  </div>
                </div>

                <div className="grid min-h-0 min-w-0 grid-cols-[minmax(0,1fr)_170px] gap-3">
                  <div className="flex min-h-0 min-w-0 flex-col overflow-hidden rounded-md border bg-card">
                    <div className="border-b px-3 py-2">
                      <div className="flex items-center gap-2 text-[11px] font-medium">
                        <Terminal className="h-3.5 w-3.5" />
                        Output
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        <MockChip
                          icon={<AlertTriangle className="h-3 w-3" />}
                          label="Status"
                          value="FAILED"
                          tone="danger"
                        />
                        <MockChip
                          icon={<Timer className="h-3 w-3" />}
                          label="Duration"
                          value="11918 ms"
                        />
                        <MockChip
                          icon={<Clock3 className="h-3 w-3" />}
                          label="Exit"
                          value="-"
                        />
                      </div>
                    </div>
                    <pre className="min-h-0 flex-1 overflow-hidden bg-background p-3 font-mono text-[10px] leading-5 text-foreground">
                      {outputLines.join("\n")}
                    </pre>
                  </div>

                  <div className="min-h-0 space-y-3 overflow-hidden">
                    <aside className="rounded-md border bg-card p-3">
                      <div className="mb-2 flex items-center gap-2 text-[11px] font-medium">
                        <ListFilter className="h-3.5 w-3.5" />
                        Stream Overview
                      </div>
                      <MockStat label="STDOUT" lines="3" characters="141" />
                      <MockStat
                        label="STDERR"
                        lines="53"
                        characters="4,628"
                        tone="danger"
                      />
                    </aside>
                    <aside className="rounded-md border bg-card p-3">
                      <div className="mb-2 flex items-center gap-2 text-[11px] font-medium">
                        <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
                        Detected Errors
                      </div>
                      <div className="rounded-md border bg-background p-2 text-[10px] leading-4">
                        &lt;HotReload globalError=&#123;...&#125; /&gt;
                      </div>
                    </aside>
                  </div>
                </div>
              </section>
            </main>
          </div>
        </div>
      </div>
    </div>
  );
};

type mockNavItemProps = {
  active?: boolean;
  icon: JSX.Element;
  label: string;
};

const MockNavItem = ({ active = false, icon, label }: mockNavItemProps) => (
  <div
    className={`flex h-8 items-center gap-2 rounded-md px-2 ${
      active ? "bg-muted text-foreground" : "text-muted-foreground"
    }`}
  >
    {icon}
    <span className="truncate">{label}</span>
  </div>
);

type mockMetadataProps = {
  label: string;
  value: string;
};

const MockMetadata = ({ label, value }: mockMetadataProps) => (
  <div className="min-w-[72px] rounded-md border bg-background px-2 py-1.5">
    <div className="text-muted-foreground">{label}</div>
    <div className="mt-1 truncate font-mono text-foreground">{value}</div>
  </div>
);

type mockRunRowProps = {
  command: string;
  duration: string;
  status: string;
  time: string;
  tone: string;
};

const MockRunRow = ({
  command,
  duration,
  status,
  time,
  tone
}: mockRunRowProps) => (
  <div className="rounded-md border bg-background p-2">
    <div className="truncate font-mono text-[10px]">{command}</div>
    <div className="mt-2 flex flex-wrap gap-1">
      <span
        className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-1 text-[9px] ${
          tone === "danger"
            ? "border-destructive/30 bg-destructive/10 text-destructive"
            : "bg-card text-muted-foreground"
        }`}
      >
        {tone === "danger" ? (
          <AlertTriangle className="h-3 w-3" />
        ) : (
          <CheckCircle2 className="h-3 w-3" />
        )}
        {status}
      </span>
      <span className="rounded-md border bg-card px-1.5 py-1 text-[9px] text-muted-foreground">
        {duration}
      </span>
      <span className="rounded-md border bg-card px-1.5 py-1 text-[9px] text-muted-foreground">
        {time}
      </span>
    </div>
  </div>
);

type mockChipProps = {
  icon: JSX.Element;
  label: string;
  tone?: "default" | "danger";
  value: string;
};

const MockChip = ({
  icon,
  label,
  tone = "default",
  value
}: mockChipProps) => (
  <span
    className={`inline-flex items-center gap-1.5 rounded-md border bg-background px-2 py-1 text-[10px] ${
      tone === "danger" ? "text-destructive" : "text-foreground"
    }`}
  >
    {icon}
    <span className="text-muted-foreground">{label}</span>
    <span className="font-medium">{value}</span>
  </span>
);

type mockStatProps = {
  characters: string;
  label: string;
  lines: string;
  tone?: "default" | "danger";
};

const MockStat = ({
  characters,
  label,
  lines,
  tone = "default"
}: mockStatProps) => (
  <div
    className={`mt-2 rounded-md border bg-background p-2 ${
      tone === "danger" ? "border-destructive/30" : ""
    }`}
  >
    <div className="text-[10px] font-medium text-muted-foreground">{label}</div>
    <div className="mt-2 grid grid-cols-2 gap-2">
      <div>
        <div className="text-[9px] text-muted-foreground">Lines</div>
        <div className="text-[11px] font-medium">{lines}</div>
      </div>
      <div>
        <div className="text-[9px] text-muted-foreground">Chars</div>
        <div className="text-[11px] font-medium">{characters}</div>
      </div>
    </div>
  </div>
);
