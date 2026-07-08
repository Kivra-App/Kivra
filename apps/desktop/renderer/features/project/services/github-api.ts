import { z } from "zod";

import { getGithubAccessToken } from "@/features/auth/services/auth-service";

export type githubRepositoryResponse = {
  id: number;
  name: string;
  full_name: string;
  owner: { login: string };
  default_branch: string;
  description: string | null;
  html_url: string;
  private: boolean;
  language: string | null;
  updated_at: string;
};

export type githubTreeResponse = {
  tree: Array<{
    path: string;
    type: "blob" | "tree";
  }>;
};

export type githubBranchResponse = {
  name: string;
};

export type githubContentResponse = {
  content?: string;
  encoding?: string;
  size: number;
  type: string;
};

const githubRepositoryResponseSchema = z.object({
  id: z.number(),
  name: z.string(),
  full_name: z.string(),
  owner: z.object({ login: z.string() }),
  default_branch: z.string(),
  description: z.string().nullable(),
  html_url: z.string(),
  private: z.boolean(),
  language: z.string().nullable(),
  updated_at: z.string()
});

export const githubRepositoriesResponseSchema = z.array(
  githubRepositoryResponseSchema
);

export const githubTreeResponseSchema = z.object({
  tree: z.array(
    z.object({
      path: z.string(),
      type: z.enum(["blob", "tree"])
    })
  )
});

export const githubBranchesResponseSchema = z.array(
  z.object({
    name: z.string()
  })
);

export const githubContentResponseSchema = z.object({
  content: z.string().optional(),
  encoding: z.string().optional(),
  size: z.number(),
  type: z.string()
});

export const githubFetch = async <T>(path: string): Promise<T> => {
  const token = await getGithubAccessToken();

  if (!token) {
    throw new Error("GITHUB_TOKEN_REQUIRED");
  }

  let response = await fetchGithubPath(path, token);

  if (response.status === 401) {
    const refreshedToken = await getGithubAccessToken({ forceRefresh: true });

    if (!refreshedToken) {
      throw new Error("GITHUB_TOKEN_REQUIRED");
    }

    response = await fetchGithubPath(path, refreshedToken);
  }

  if (response.status === 401) {
    throw new Error("GITHUB_TOKEN_REQUIRED");
  }

  if (!response.ok) {
    throw new Error(`GITHUB_API_${response.status}`);
  }

  return response.json() as Promise<T>;
};

const fetchGithubPath = (path: string, token: string) =>
  fetch(`https://api.github.com${path}`, {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "X-GitHub-Api-Version": "2022-11-28"
    }
  });
