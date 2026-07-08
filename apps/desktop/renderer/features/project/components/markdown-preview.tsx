import { CodeViewer } from "@/features/project/components/code-viewer";
import { getLanguageLabel } from "@/features/project/utils/file-language";
import { cn } from "@/shared/lib/utils";

export const MarkdownPreview = ({ content }: { content: string }) => {
  const lines = content.split("\n");
  const blocks = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];

    if (line.startsWith("```")) {
      const codeLines = [];
      const language = line.replace("```", "").trim() || "Code";
      index += 1;

      while (index < lines.length && !lines[index].startsWith("```")) {
        codeLines.push(lines[index]);
        index += 1;
      }

      blocks.push(
        <div key={index} className="overflow-hidden rounded-md border bg-background">
          <div className="border-b px-3 py-2 font-mono text-[11px] text-muted-foreground">
            {language}
          </div>
          <CodeViewer
            compact
            content={codeLines.join("\n")}
            language={getLanguageLabel(language)}
          />
        </div>
      );
      index += 1;
      continue;
    }

    if (!line.trim()) {
      blocks.push(<div key={index} className="h-3" />);
      index += 1;
      continue;
    }

    const heading = line.match(/^(#{1,3})\s+(.*)$/);

    if (heading) {
      const level = heading[1].length;
      const className =
        level === 1
          ? "text-2xl font-semibold"
          : level === 2
            ? "text-lg font-semibold"
            : "text-sm font-semibold";
      blocks.push(
        <div key={index} className={cn("mt-3 first:mt-0", className)}>
          {renderInlineMarkdown(heading[2])}
        </div>
      );
      index += 1;
      continue;
    }

    const listItem = line.match(/^[-*]\s+(.*)$/);

    if (listItem) {
      blocks.push(
        <div
          key={index}
          className="flex gap-2 text-sm leading-6 text-muted-foreground"
        >
          <span className="mt-2 h-1 w-1 rounded-full bg-muted-foreground" />
          <span>{renderInlineMarkdown(listItem[1])}</span>
        </div>
      );
      index += 1;
      continue;
    }

    blocks.push(
      <p key={index} className="text-sm leading-6 text-muted-foreground">
        {renderInlineMarkdown(line)}
      </p>
    );
    index += 1;
  }

  return (
    <div className="h-[calc(100%-57px)] overflow-auto bg-background p-5">
      <div className="mx-auto max-w-3xl space-y-1">{blocks}</div>
    </div>
  );
};

const renderInlineMarkdown = (value: string) => {
  const parts = value.split(/(`[^`]+`)/g);

  return parts.map((part, index) => {
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code
          key={`${part}-${index}`}
          className="rounded border bg-card px-1 py-0.5 font-mono text-xs text-foreground"
        >
          {part.slice(1, -1)}
        </code>
      );
    }

    return <span key={`${part}-${index}`}>{part}</span>;
  });
};
