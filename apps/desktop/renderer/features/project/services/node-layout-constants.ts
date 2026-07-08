import type { CSSProperties } from "react";

import type {
  codeNodeCategory,
  codeNodeType
} from "@/features/project/services/node-graph-service";

export const VISIBLE_CHILD_LIMIT = 8;

export const CATEGORY_POSITIONS: Record<codeNodeCategory, { x: number; y: number }> = {
  imports: { x: 0, y: -210 },
  exports: { x: 250, y: -60 },
  declarations: { x: 0, y: 220 },
  hooks: { x: -250, y: -70 },
  functions: { x: -250, y: 110 },
  constants: { x: 245, y: 150 }
};

export const CHILD_LANES: Record<
  codeNodeCategory,
  {
    crossAxis: "x" | "y";
    crossStep: number;
    mainAxis: "x" | "y";
    mainStep: number;
    originX: number;
    originY: number;
    wrapAfter: number;
  }
> = {
  imports: {
    crossAxis: "x",
    crossStep: 178,
    mainAxis: "y",
    mainStep: 66,
    originX: -178,
    originY: -118,
    wrapAfter: 3
  },
  exports: {
    crossAxis: "y",
    crossStep: 70,
    mainAxis: "x",
    mainStep: 184,
    originX: 176,
    originY: -70,
    wrapAfter: 4
  },
  declarations: {
    crossAxis: "x",
    crossStep: 178,
    mainAxis: "y",
    mainStep: 66,
    originX: -178,
    originY: 98,
    wrapAfter: 3
  },
  hooks: {
    crossAxis: "y",
    crossStep: 70,
    mainAxis: "x",
    mainStep: -184,
    originX: -176,
    originY: -70,
    wrapAfter: 4
  },
  functions: {
    crossAxis: "y",
    crossStep: 70,
    mainAxis: "x",
    mainStep: -184,
    originX: -176,
    originY: -70,
    wrapAfter: 4
  },
  constants: {
    crossAxis: "y",
    crossStep: 70,
    mainAxis: "x",
    mainStep: 184,
    originX: 176,
    originY: -70,
    wrapAfter: 4
  }
};

export const getNodeClassName = (
  type: codeNodeType | "category",
  searchMatch: boolean
) => {
  const base =
    "flex items-center justify-center overflow-hidden border px-3 text-center font-mono text-[11px] shadow-lg shadow-black/20 transition-colors";
  const highlight = searchMatch ? " ring-2 ring-primary/70" : "";

  if (type === "file") {
    return `${base} border-primary bg-primary text-primary-foreground${highlight}`;
  }

  if (type === "category") {
    return `${base} border-teal-300/30 bg-teal-400/14 text-teal-100${highlight}`;
  }

  if (type === "more") {
    return `${base} border-border bg-muted text-muted-foreground${highlight}`;
  }

  return `${base} border-sky-300/24 bg-sky-400/12 text-sky-100${highlight}`;
};

export const getNodeStyle = (
  type: codeNodeType | "category" | "file" | "more"
): CSSProperties => {
  if (type === "file") {
    return {
      borderRadius: 14,
      fontSize: 12,
      fontWeight: 600,
      height: 56,
      lineHeight: 1.3,
      paddingInline: 16,
      width: 176
    };
  }

  if (type === "category") {
    return {
      borderRadius: 12,
      fontWeight: 600,
      height: 40,
      lineHeight: 1.2,
      paddingInline: 12,
      width: 140
    };
  }

  if (type === "more") {
    return {
      borderRadius: 12,
      height: 40,
      lineHeight: 1.2,
      paddingInline: 12,
      width: 104
    };
  }

  return {
    borderRadius: 12,
    height: 48,
    lineHeight: 1.2,
    paddingInline: 12,
    width: 152
  };
};

export const isSearchMatch = (value: string, query: string) => {
  return query.length > 0 && value.toLowerCase().includes(query);
};
