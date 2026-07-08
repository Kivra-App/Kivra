import type { ReactNode } from "react";

type infoNoteProps = {
  children: ReactNode;
  icon: ReactNode;
  title: string;
};

export const InfoNote = ({ children, icon, title }: infoNoteProps) => (
  <div className="flex items-start gap-2 text-xs leading-5 text-muted-foreground">
    <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md border bg-muted text-foreground">
      {icon}
    </div>
    <div>
      <div className="font-medium text-foreground">{title}</div>
      <p>{children}</p>
    </div>
  </div>
);
