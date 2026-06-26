import { ChevronRight, FileCode2, FolderTree, Search, ZoomIn } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type language = "en" | "ko";

type mockNode = {
  detail: string;
  id: string;
  label: string;
  x: string;
  y: string;
};

type mockFile = {
  id: string;
  name: string;
  nodes: mockNode[];
};

type edgePair = [string, string];

const buildFiles = (language: language): mockFile[] => {
  const ko = language === "ko";

  return [
    {
      id: "run-log",
      name: "run-log-panel.tsx",
      nodes: [
        {
          detail: ko ? "실행한 명령과 종료 코드를 함께 저장합니다." : "Stores the command and exit code together.",
          id: "command",
          label: ko ? "명령" : "Command",
          x: "50%",
          y: "18%"
        },
        {
          detail: ko ? "stdout과 stderr를 분리해서 긴 로그를 읽기 쉽게 만듭니다." : "Splits stdout and stderr so long output stays readable.",
          id: "logs",
          label: ko ? "로그" : "Logs",
          x: "32%",
          y: "42%"
        },
        {
          detail: ko ? "실패 지점의 파일, 줄 번호, 메시지를 추출합니다." : "Extracts file, line, and failure message.",
          id: "error",
          label: ko ? "에러" : "Error",
          x: "68%",
          y: "42%"
        },
        {
          detail: ko ? "같은 실패를 다시 만났을 때 이전 해결 과정을 찾습니다." : "Finds previous fixes when the same failure returns.",
          id: "note",
          label: ko ? "해결 노트" : "Fix Note",
          x: "50%",
          y: "68%"
        }
      ]
    },
    {
      id: "code-node-viewer",
      name: "code-node-viewer.tsx",
      nodes: [
        {
          detail: ko ? "선택한 파일을 중심 노드로 둡니다." : "Keeps the selected file as the center node.",
          id: "file",
          label: "main.tsx",
          x: "50%",
          y: "20%"
        },
        {
          detail: ko ? "가져온 모듈과 외부 의존성을 연결합니다." : "Connects imported modules and external dependencies.",
          id: "imports",
          label: ko ? "가져오기" : "Imports",
          x: "30%",
          y: "45%"
        },
        {
          detail: ko ? "내보낸 컴포넌트와 함수를 보여줍니다." : "Shows exported components and functions.",
          id: "exports",
          label: ko ? "내보내기" : "Exports",
          x: "70%",
          y: "45%"
        },
        {
          detail: ko ? "실행 로그에서 연결된 문제를 붙여 둡니다." : "Attaches related issues from captured runs.",
          id: "runs",
          label: ko ? "실행" : "Runs",
          x: "50%",
          y: "72%"
        }
      ]
    },
    {
      id: "project-memory",
      name: "projects/$project-id/index.tsx",
      nodes: [
        {
          detail: ko ? "프로젝트별로 실행 기록과 노트를 묶습니다." : "Groups run history and notes by project.",
          id: "project",
          label: ko ? "프로젝트" : "Project",
          x: "50%",
          y: "18%"
        },
        {
          detail: ko ? "파일별 메모리를 검색 가능한 단위로 저장합니다." : "Stores file memory as searchable units.",
          id: "memory",
          label: ko ? "메모리" : "Memory",
          x: "32%",
          y: "44%"
        },
        {
          detail: ko ? "최근 실행에서 나온 실패를 바로 확인합니다." : "Reviews failures from recent runs.",
          id: "failures",
          label: ko ? "실패" : "Failures",
          x: "68%",
          y: "44%"
        },
        {
          detail: ko ? "다음 실행 전에 참고할 해결 맥락을 남깁니다." : "Keeps fix context ready for the next run.",
          id: "context",
          label: ko ? "맥락" : "Context",
          x: "50%",
          y: "72%"
        }
      ]
    }
  ];
};

const edgePairs: Record<string, edgePair[]> = {
  "code-node-viewer.tsx": [
    ["main.tsx", "Imports"],
    ["main.tsx", "Exports"],
    ["main.tsx", "Runs"],
    ["main.tsx", "가져오기"],
    ["main.tsx", "내보내기"],
    ["main.tsx", "실행"]
  ],
  "projects/$project-id/index.tsx": [
    ["Project", "Memory"],
    ["Project", "Failures"],
    ["Project", "Context"],
    ["프로젝트", "메모리"],
    ["프로젝트", "실패"],
    ["프로젝트", "맥락"]
  ],
  "run-log-panel.tsx": [
    ["Command", "Logs"],
    ["Command", "Error"],
    ["Logs", "Fix Note"],
    ["Error", "Fix Note"],
    ["명령", "로그"],
    ["명령", "에러"],
    ["로그", "해결 노트"],
    ["에러", "해결 노트"]
  ]
};

export const NodeViewMockup = ({
  labels,
  language
}: {
  labels: {
    graph: string;
    preview: string;
    search: string;
  };
  language: language;
}) => {
  const files = useMemo(() => buildFiles(language), [language]);
  const [activeFileId, setActiveFileId] = useState(files[0].id);
  const activeFile = files.find((file) => file.id === activeFileId) ?? files[0];
  const [activeNodeId, setActiveNodeId] = useState(activeFile.nodes[0].id);
  const activeNode =
    activeFile.nodes.find((node) => node.id === activeNodeId) ?? activeFile.nodes[0];
  const activeEdges = edgePairs[activeFile.name] ?? [];
  const nodeLabel = language === "ko" ? "노드" : "Node";

  useEffect(() => {
    if (!files.some((file) => file.id === activeFileId)) {
      setActiveFileId(files[0].id);
    }
  }, [activeFileId, files]);

  useEffect(() => {
    setActiveNodeId(activeFile.nodes[0]?.id ?? "");
  }, [activeFile.id, activeFile.nodes]);

  const treeItems = [
    { depth: 0, name: "apps", target: null },
    { depth: 1, name: "desktop", target: null },
    { depth: 2, name: "renderer", target: null },
    { depth: 3, name: "features", target: null },
    { depth: 4, name: "run", target: null },
    { depth: 5, name: "run-log-panel.tsx", target: "run-log" },
    { depth: 4, name: "project", target: null },
    { depth: 5, name: "code-node-viewer.tsx", target: "code-node-viewer" },
    { depth: 5, name: "projects/$project-id/index.tsx", target: "project-memory" }
  ] as const;

  return (
    <div className="overflow-hidden rounded-lg border border-border/80 bg-card">
      <div className="flex items-center justify-between border-b border-border/80 px-4 py-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-sm font-medium">
            <FileCode2 className="h-4 w-4 text-muted-foreground" />
            <span className="truncate">
              apps/desktop/renderer/features/project/components/{activeFile.name}
            </span>
          </div>
          <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
            <span>{activeNode.label}</span>
            <span className="rounded border border-border/80 px-1.5 py-0.5">{nodeLabel}</span>
          </div>
        </div>
        <div className="hidden items-center gap-2 sm:flex">
          <div className="rounded-md border border-border/80 bg-background px-3 py-1.5 text-xs">
            {labels.preview}
          </div>
          <div className="rounded-md border border-border/80 bg-background px-3 py-1.5 text-xs">
            {labels.graph}
          </div>
        </div>
      </div>

      <div className="grid min-h-[540px] lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="border-b border-border/80 bg-background/60 lg:border-b-0 lg:border-r">
          <div className="border-b border-border/80 p-3">
            <div className="flex h-9 items-center gap-2 rounded-md border border-border/80 bg-card px-3">
              <Search className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{labels.search}</span>
            </div>
          </div>
          <div className="p-2">
            {treeItems.map((item) => {
              const isActive = item.target === activeFile.id;

              return (
                <button
                  key={`${item.depth}-${item.name}`}
                  type="button"
                  className={[
                    "flex h-8 w-full items-center gap-2 rounded-md px-2 text-left text-sm transition",
                    isActive
                      ? "bg-muted text-foreground"
                      : "text-muted-foreground hover:bg-muted/50"
                  ].join(" ")}
                  style={{ paddingLeft: `${item.depth * 14 + 10}px` }}
                  onClick={() => {
                    if (item.target) {
                      setActiveFileId(item.target);
                    }
                  }}
                >
                  <ChevronRight className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{item.name}</span>
                </button>
              );
            })}
          </div>
        </aside>

        <section className="relative min-h-[540px] overflow-hidden bg-[#0b0d11]">
          <div className="absolute right-4 top-4 flex items-center gap-2 rounded-md border border-border/80 bg-card/95 px-2 py-1.5 text-xs text-muted-foreground">
            <ZoomIn className="h-3.5 w-3.5" />
            <FolderTree className="h-3.5 w-3.5" />
          </div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(89,214,194,0.08),transparent_44%)]" />
          <svg className="absolute inset-0 h-full w-full">
            {activeEdges.map(([from, to]) => {
              const start = activeFile.nodes.find((node) => node.label === from);
              const end = activeFile.nodes.find((node) => node.label === to);

              if (!start || !end) {
                return null;
              }

              const isActive = from === activeNode.label || to === activeNode.label;

              return (
                <line
                  key={`${from}-${to}`}
                  x1={start.x}
                  y1={start.y}
                  x2={end.x}
                  y2={end.y}
                  stroke={isActive ? "rgba(89, 214, 194, 0.42)" : "rgba(124, 138, 155, 0.2)"}
                  strokeWidth={isActive ? "1.75" : "1.25"}
                />
              );
            })}
          </svg>
          {activeFile.nodes.map((node) => {
            const isActive = node.id === activeNode.id;

            return (
              <button
                key={node.id}
                type="button"
                className={[
                  "absolute w-[136px] -translate-x-1/2 -translate-y-1/2 rounded-xl border px-4 py-3 text-sm font-medium shadow-[0_18px_40px_rgba(0,0,0,0.35)] transition",
                  isActive
                    ? "border-[#59d6c2] bg-[#162220] text-white"
                    : "border-white/10 bg-[#14181e] text-[#d6dde5] opacity-70 hover:opacity-100"
                ].join(" ")}
                style={{ left: node.x, top: node.y }}
                onClick={() => setActiveNodeId(node.id)}
                onFocus={() => setActiveNodeId(node.id)}
              >
                {node.label}
              </button>
            );
          })}
          <div className="absolute bottom-4 left-4 right-4 rounded-lg border border-border/80 bg-card/95 p-3 shadow-[0_18px_50px_rgba(0,0,0,0.35)]">
            <div className="text-sm font-medium text-foreground">{activeNode.label}</div>
            <div className="mt-2 text-xs leading-5 text-muted-foreground">{activeNode.detail}</div>
          </div>
        </section>
      </div>
    </div>
  );
};
