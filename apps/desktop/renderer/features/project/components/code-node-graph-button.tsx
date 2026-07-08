import type { ReactNode } from "react";

type codeNodeGraphButtonProps = {
  children: ReactNode;
  label: string;
  onClick: () => void;
};

export const CodeNodeGraphButton = ({
  children,
  label,
  onClick
}: codeNodeGraphButtonProps) => (
  <button
    type="button"
    title={label}
    className="flex h-8 w-8 items-center justify-center rounded text-muted-foreground transition hover:bg-muted hover:text-foreground"
    onClick={onClick}
  >
    {children}
  </button>
);
