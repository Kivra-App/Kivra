import { Skeleton } from "@/shared/ui/skeleton";

export const ProjectDetailSkeleton = () => (
  <div className="flex h-screen flex-col overflow-hidden">
    <div className="border-b bg-card px-4 py-3">
      <Skeleton className="h-6 w-48" />
      <Skeleton className="mt-2 h-4 w-80 max-w-full" />
      <div className="mt-4 grid grid-cols-5 gap-2">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="rounded-md border bg-background p-2">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="mt-2 h-4 w-20" />
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-center justify-between gap-4">
        <div className="flex gap-2">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-7 w-16" />
          ))}
        </div>
        <Skeleton className="h-9 w-28" />
      </div>
    </div>
    <div className="grid min-h-0 flex-1 grid-cols-[320px_1fr] gap-4 p-4">
      <div className="rounded-md border bg-card p-3">
        {Array.from({ length: 10 }).map((_, index) => (
          <Skeleton key={index} className="mb-2 h-7 w-full last:mb-0" />
        ))}
      </div>
      <div className="rounded-md border bg-card p-3">
        <Skeleton className="h-5 w-56" />
        <Skeleton className="mt-2 h-4 w-32" />
        <div className="mt-4 space-y-2">
          {Array.from({ length: 14 }).map((_, index) => (
            <Skeleton key={index} className="h-4 w-full" />
          ))}
        </div>
      </div>
    </div>
  </div>
);
