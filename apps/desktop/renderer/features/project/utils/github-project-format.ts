import type { TFunction } from "i18next";

export const formatUpdatedAt = (updatedAt: string) => {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric"
  }).format(new Date(updatedAt));
};

export const formatGithubRepositoryError = (
  error: Error,
  t: TFunction
) => {
  if (error.message === "GITHUB_TOKEN_REQUIRED") {
    return t("project.githubTokenRequired");
  }

  if (error.message === "GITHUB_API_403") {
    return t("project.githubForbidden");
  }

  return error.message;
};
