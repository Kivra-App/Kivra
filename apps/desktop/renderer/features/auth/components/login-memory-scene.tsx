import {
  AlertTriangle,
  Box,
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
                <SceneNavItem icon={<Box className="h-3.5 w-3.5" />} />
                <SceneNavItem active icon={<FolderOpen className="h-3.5 w-3.5" />} />
                <SceneNavItem icon={<Settings className="h-3.5 w-3.5" />} />
              </nav>
              <div className="mt-auto border-t p-2">
                <div className="flex items-center gap-2 rounded-md px-2 py-2">
                  <span className="h-6 w-6 rounded-md border bg-background" />
                  <span className="h-2 w-16 rounded bg-muted" />
                </div>
              </div>
            </aside>

            <main className="min-w-0 bg-background">
              <header className="border-b bg-card px-4 py-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="h-4 w-56 rounded bg-muted" />
                    <div className="mt-2 h-3 w-72 rounded bg-muted/70" />
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-[10px]">
                    {Array.from({ length: 4 }).map((_, index) => (
                      <SceneMetadata key={index} />
                    ))}
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
                    <div className="h-8 flex-1 rounded-md border bg-background px-3 py-2">
                      <div className="mt-1 h-2 w-20 rounded bg-muted" />
                    </div>
                    <div className="flex h-8 items-center gap-1 rounded-md bg-primary px-3 text-[10px] font-medium text-primary-foreground">
                      <Play className="h-3.5 w-3.5" />
                      <span className="h-2 w-7 rounded bg-primary-foreground/70" />
                    </div>
                  </div>
                </div>
              </header>

              <section className="grid h-[355px] min-h-0 grid-cols-[210px_minmax(0,1fr)] gap-3 p-3">
                <div className="min-h-0 overflow-hidden rounded-md border bg-card">
                  <div className="border-b px-3 py-2">
                    <div className="h-3 w-20 rounded bg-muted" />
                    <div className="mt-2 h-2 w-10 rounded bg-muted/70" />
                  </div>
                  <div className="space-y-2 p-2">
                    {Array.from({ length: 3 }).map((_, index) => (
                      <SceneRunRow key={index} tone={index === 0 ? "danger" : "default"} />
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
                        <SceneChip
                          icon={<AlertTriangle className="h-3 w-3" />}
                          tone="danger"
                        />
                        <SceneChip icon={<Timer className="h-3 w-3" />} />
                        <SceneChip icon={<Clock3 className="h-3 w-3" />} />
                      </div>
                    </div>
                    <div className="min-h-0 flex-1 space-y-2 overflow-hidden bg-background p-3">
                      {Array.from({ length: 8 }).map((_, index) => (
                        <div
                          key={index}
                          className="h-2 rounded bg-muted"
                          style={{ width: `${88 - (index % 4) * 13}%` }}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="min-h-0 space-y-3 overflow-hidden">
                    <aside className="rounded-md border bg-card p-3">
                      <div className="mb-2 flex items-center gap-2 text-[11px] font-medium">
                        <ListFilter className="h-3.5 w-3.5" />
                        <span className="h-2 w-20 rounded bg-muted" />
                      </div>
                      <SceneStat />
                      <SceneStat tone="danger" />
                    </aside>
                    <aside className="rounded-md border bg-card p-3">
                      <div className="mb-2 flex items-center gap-2 text-[11px] font-medium">
                        <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
                        <span className="h-2 w-20 rounded bg-muted" />
                      </div>
                      <div className="space-y-2 rounded-md border bg-background p-2">
                        <div className="h-2 w-full rounded bg-muted" />
                        <div className="h-2 w-2/3 rounded bg-muted" />
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

const SceneNavItem = ({
  active = false,
  icon
}: {
  active?: boolean;
  icon: JSX.Element;
}) => (
  <div
    className={`flex h-8 items-center gap-2 rounded-md px-2 ${
      active ? "bg-muted text-foreground" : "text-muted-foreground"
    }`}
  >
    {icon}
    <span className="h-2 flex-1 rounded bg-current opacity-30" />
  </div>
);

const SceneMetadata = () => (
  <div className="min-w-[72px] rounded-md border bg-background px-2 py-1.5">
    <div className="h-2 w-10 rounded bg-muted" />
    <div className="mt-2 h-2 w-12 rounded bg-muted/70" />
  </div>
);

const SceneRunRow = ({ tone }: { tone: "default" | "danger" }) => (
  <div className="rounded-md border bg-background p-2">
    <div className="h-2 w-28 rounded bg-muted" />
    <div className="mt-3 flex gap-1">
      <span
        className={`h-5 w-14 rounded-md border ${
          tone === "danger"
            ? "border-destructive/30 bg-destructive/10"
            : "bg-card"
        }`}
      />
      <span className="h-5 w-12 rounded-md border bg-card" />
      <span className="h-5 w-10 rounded-md border bg-card" />
    </div>
  </div>
);

const SceneChip = ({
  icon,
  tone = "default"
}: {
  icon: JSX.Element;
  tone?: "default" | "danger";
}) => (
  <span
    className={`inline-flex items-center gap-1.5 rounded-md border bg-background px-2 py-1 text-[10px] ${
      tone === "danger" ? "text-destructive" : "text-foreground"
    }`}
  >
    {icon}
    <span className="h-2 w-10 rounded bg-muted" />
  </span>
);

const SceneStat = ({ tone = "default" }: { tone?: "default" | "danger" }) => (
  <div
    className={`mt-2 rounded-md border bg-background p-2 ${
      tone === "danger" ? "border-destructive/30" : ""
    }`}
  >
    <div className="h-2 w-14 rounded bg-muted" />
    <div className="mt-3 grid grid-cols-2 gap-2">
      <div className="h-7 rounded bg-muted/60" />
      <div className="h-7 rounded bg-muted/60" />
    </div>
  </div>
);
