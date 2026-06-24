import { ChevronDown, Loader2 } from "lucide-react";
import type { ReactNode, SelectHTMLAttributes } from "react";

import { cn } from "@/shared/lib/utils";

export type selectOption = {
  disabled?: boolean;
  label: string;
  value: string;
};

type selectProps = Omit<SelectHTMLAttributes<HTMLSelectElement>, "children" | "size"> & {
  className?: string;
  icon?: ReactNode;
  isLoading?: boolean;
  options: selectOption[];
  selectClassName?: string;
  size?: "sm" | "md";
};

const sizeClassName = {
  sm: "h-8 text-xs",
  md: "h-9 text-sm"
};

export const Select = ({
  className,
  disabled,
  icon,
  isLoading = false,
  options,
  selectClassName,
  size = "md",
  ...props
}: selectProps) => {
  return (
    <div
      className={cn(
        "relative inline-flex min-w-0 items-center gap-2 rounded-md border bg-background px-2 text-foreground transition focus-within:border-foreground",
        sizeClassName[size],
        disabled && "opacity-50",
        className
      )}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 shrink-0 animate-spin text-muted-foreground" />
      ) : (
        icon
      )}
      <select
        disabled={disabled || isLoading}
        className={cn(
          "h-full min-w-0 flex-1 appearance-none bg-transparent pr-6 outline-none disabled:cursor-not-allowed",
          selectClassName
        )}
        {...props}
      >
        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
            disabled={option.disabled}
          >
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2 h-4 w-4 text-muted-foreground" />
    </div>
  );
};
