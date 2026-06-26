import { cn } from "@/shared/lib/utils";

type skeletonProps = {
  className?: string;
};

export const Skeleton = ({ className }: skeletonProps) => (
  <div
    aria-hidden="true"
    className={cn("animate-pulse rounded-md bg-muted/70", className)}
  />
);
