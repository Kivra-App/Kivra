import { BookOpenText } from "lucide-react";

type githubProjectMemoryBannerProps = {
  detail: string;
  error: Error | null;
  title: string;
};

export const GithubProjectMemoryBanner = ({
  detail,
  error,
  title
}: githubProjectMemoryBannerProps) => (
  <section className="mb-3 shrink-0 rounded-md border bg-card p-3">
    <div className="flex items-start justify-between gap-4">
      <div>
        <div className="flex items-center gap-2 text-sm font-medium">
          <BookOpenText className="h-4 w-4" />
          {title}
        </div>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          {detail}
        </p>
      </div>
    </div>
    {error && <p className="mt-2 text-xs text-destructive">{error.message}</p>}
  </section>
);
