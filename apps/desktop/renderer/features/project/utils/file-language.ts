export const getFileLanguage = (filePath: string | null) => {
  const extension = filePath?.split(".").pop()?.toLowerCase();

  if (!extension) {
    return "Text";
  }

  if (["js", "jsx", "ts", "tsx", "mjs", "cjs"].includes(extension)) {
    return "Node";
  }

  if (["md", "mdx"].includes(extension)) {
    return "Markdown";
  }

  const labels: Record<string, string> = {
    css: "CSS",
    html: "HTML",
    json: "JSON",
    rs: "Rust",
    toml: "TOML",
    yaml: "YAML",
    yml: "YAML"
  };

  return labels[extension] ?? extension.toUpperCase();
};

export const getLanguageLabel = (language: string) => {
  return getFileLanguage(`file.${language.toLowerCase()}`);
};

export const canShowNodeView = (language: string) => {
  return ["JSON", "Node", "Rust"].includes(language);
};
