import { cn } from "@/shared/lib/utils";

type codeViewerProps = {
  content: string;
  compact?: boolean;
  language: string;
};

export const CodeViewer = ({
  compact = false,
  content,
  language
}: codeViewerProps) => {
  const lines = content.split("\n");
  const isNode = language === "Node";

  return (
    <div
      className={cn(
        "overflow-auto bg-background",
        compact ? "max-h-80" : "h-[calc(100%-57px)]"
      )}
    >
      {isNode && (
        <div className="sticky top-0 z-10 border-b bg-card px-3 py-2 font-mono text-[11px] text-muted-foreground">
          Node runtime view
        </div>
      )}
      <pre className="min-w-max p-0 font-mono text-xs leading-5">
        {lines.map((line, index) => (
          <div key={`${index}-${line}`} className="grid grid-cols-[48px_1fr]">
            <span className="select-none border-r px-3 text-right text-muted-foreground/60">
              {index + 1}
            </span>
            <code className="px-3">
              {isNode ? highlightNodeLine(line) : line || " "}
            </code>
          </div>
        ))}
      </pre>
    </div>
  );
};

const highlightNodeLine = (line: string) => {
  const tokens = line.split(
    /(\b(?:const|let|var|function|return|import|from|export|async|await|type|interface|class|new|if|else|throw|try|catch)\b|"[^"]*"|'[^']*'|`[^`]*`|\/\/.*)/g
  );

  return tokens.map((token, index) => {
    const key = `${token}-${index}`;

    if (/^\/\/.*/.test(token)) {
      return (
        <span key={key} className="text-muted-foreground">
          {token}
        </span>
      );
    }

    if (/^["'`]/.test(token)) {
      return (
        <span key={key} className="text-emerald-300">
          {token}
        </span>
      );
    }

    if (
      /^\b(?:const|let|var|function|return|import|from|export|async|await|type|interface|class|new|if|else|throw|try|catch)\b$/.test(
        token
      )
    ) {
      return (
        <span key={key} className="text-primary">
          {token}
        </span>
      );
    }

    return <span key={key}>{token}</span>;
  });
};
