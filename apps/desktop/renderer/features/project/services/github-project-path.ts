import type { project } from "@/features/project/types/project";

export const getGithubRepoPath = (project: project) => {
  if (project.path.includes("/")) {
    return project.path;
  }

  if (!project.repositoryUrl) {
    throw new Error("GITHUB_REPOSITORY_REQUIRED");
  }

  return new URL(project.repositoryUrl).pathname.replace(/^\/|\.git$/g, "");
};

export const decodeBase64Content = (content: string) => {
  const binary = window.atob(content.replace(/\n/g, ""));
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));

  return new TextDecoder().decode(bytes);
};
