import type { TFunction } from "i18next";

export type runOutputStream = "all" | "stdout" | "stderr";

export const getVisibleOutput = ({
  stderr,
  stdout,
  stream,
  t
}: {
  stderr: string;
  stdout: string;
  stream: runOutputStream;
  t: TFunction;
}) => {
  const normalizedStdout = stdout.trim();
  const normalizedStderr = stderr.trim();

  if (stream === "stdout") {
    return normalizedStdout || t("runs.noOutput");
  }

  if (stream === "stderr") {
    return normalizedStderr || t("runs.noOutput");
  }

  if (!normalizedStdout && !normalizedStderr) {
    return t("runs.noOutput");
  }

  return [
    normalizedStdout
      ? `${t("runs.stdout").toUpperCase()}\n${normalizedStdout}`
      : `${t("runs.stdout").toUpperCase()}\n${t("runs.noOutput")}`,
    normalizedStderr
      ? `${t("runs.stderr").toUpperCase()}\n${normalizedStderr}`
      : null
  ]
    .filter(Boolean)
    .join("\n\n");
};

export const getOutputStats = (value: string) => {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return {
      lines: 0,
      characters: 0
    };
  }

  return {
    lines: trimmedValue.split(/\r?\n/).length,
    characters: trimmedValue.length
  };
};
