import { projectFileSchema } from "@/features/project/schemas/project-schema";
import {
  githubBranchesResponseSchema,
  githubContentResponseSchema,
  githubFetch,
  githubRepositoriesResponseSchema,
  githubTreeResponseSchema,
  type githubBranchResponse,
  type githubContentResponse,
  type githubRepositoryResponse,
  type githubTreeResponse
} from "@/features/project/services/github-api";
import {
  inferFramework,
  inferPackageManager,
  inferRuntime
} from "@/features/project/services/github-project-inference";
import {
  decodeBase64Content,
  getGithubRepoPath
} from "@/features/project/services/github-project-path";
import type {
  githubBranch,
  project,
  projectFile,
  projectNode
} from "@/features/project/types/project";
import { addTreePath, sortTree } from "@/features/project/utils/project-tree";

export type githubRepository = {
  id: number;
  name: string;
  fullName: string;
  owner: string;
  defaultBranch: string;
  description: string | null;
  htmlUrl: string;
  private: boolean;
  language: string | null;
  updatedAt: string;
};

export const fetchGithubRepositories = async (): Promise<githubRepository[]> => {
  const repos = githubRepositoriesResponseSchema.parse(
    await githubFetch<githubRepositoryResponse[]>(
      "/user/repos?per_page=50&sort=updated&type=all"
    )
  );

  return repos.map((repo) => ({
    id: repo.id,
    name: repo.name,
    fullName: repo.full_name,
    owner: repo.owner.login,
    defaultBranch: repo.default_branch,
    description: repo.description,
    htmlUrl: repo.html_url,
    private: repo.private,
    language: repo.language,
    updatedAt: repo.updated_at
  }));
};

export const createGithubProject = async (
  repo: githubRepository
): Promise<project> => {
  const tree = await fetchGithubProjectTree({
    defaultBranch: repo.defaultBranch,
    fullName: repo.fullName,
    name: repo.name
  });
  const now = new Date().toISOString();

  return {
    id: crypto.randomUUID(),
    name: repo.name,
    path: repo.fullName,
    runtime: inferRuntime(repo.language),
    framework: inferFramework(tree),
    packageManager: inferPackageManager(tree),
    branch: repo.defaultBranch,
    repositoryUrl: repo.htmlUrl,
    createdAt: now,
    source: "github",
    tree
  };
};

export const hydrateGithubProjectTree = async (
  project: project
): Promise<project> => {
  const repoPath = getGithubRepoPath(project);

  return {
    ...project,
    path: repoPath,
    tree: await fetchGithubProjectTree({
      defaultBranch: project.branch,
      fullName: repoPath,
      name: project.name
    })
  };
};

export const hydrateGithubProjectBranch = async (args: {
  branch: string;
  project: project;
}): Promise<project> => {
  const repoPath = getGithubRepoPath(args.project);

  return {
    ...args.project,
    path: repoPath,
    branch: args.branch,
    tree: await fetchGithubProjectTree({
      defaultBranch: args.branch,
      fullName: repoPath,
      name: args.project.name
    })
  };
};

export const fetchGithubProjectBranches = async (
  project: project
): Promise<githubBranch[]> => {
  const repoPath = getGithubRepoPath(project);
  const branches = githubBranchesResponseSchema.parse(
    await githubFetch<githubBranchResponse[]>(
      `/repos/${repoPath}/branches?per_page=100`
    )
  );

  return branches.map((branch) => ({ name: branch.name }));
};

export const readGithubProjectFile = async (args: {
  filePath: string;
  project: project;
}): Promise<projectFile> => {
  const repoPath = getGithubRepoPath(args.project);
  const encodedPath = args.filePath
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("/");
  const content = githubContentResponseSchema.parse(
    await githubFetch<githubContentResponse>(
      `/repos/${repoPath}/contents/${encodedPath}?ref=${encodeURIComponent(args.project.branch)}`
    )
  );

  if (content.type !== "file" || content.encoding !== "base64" || !content.content) {
    throw new Error("GITHUB_FILE_UNREADABLE");
  }

  const decoded = decodeBase64Content(content.content);

  return projectFileSchema.parse({
    path: args.filePath,
    content: decoded.slice(0, 200_000),
    size: content.size,
    truncated: decoded.length > 200_000
  });
};

const fetchGithubProjectTree = async (repo: {
  defaultBranch: string;
  fullName: string;
  name: string;
}): Promise<projectNode> => {
  const data = githubTreeResponseSchema.parse(
    await githubFetch<githubTreeResponse>(
      `/repos/${repo.fullName}/git/trees/${encodeURIComponent(repo.defaultBranch)}?recursive=1`
    )
  );
  const root: projectNode = {
    id: repo.fullName,
    name: repo.name,
    path: repo.fullName,
    type: "folder",
    children: []
  };

  for (const item of data.tree) {
    if (!item.path || item.path.includes(".git/")) {
      continue;
    }

    addTreePath(root, item.path, item.type === "tree" ? "folder" : "file");
  }

  sortTree(root);

  return root;
};
