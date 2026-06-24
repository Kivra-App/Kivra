import { z } from "zod";

import type {
  project,
  projectFile,
  projectNode,
  projectSource
} from "@/features/project/types/project";

export const projectSourceSchema: z.ZodType<projectSource> = z.enum([
  "local",
  "github"
]);

export const projectNodeSchema: z.ZodType<projectNode> = z.lazy(() =>
  z.object({
    id: z.string(),
    name: z.string(),
    path: z.string(),
    type: z.enum(["file", "folder"]),
    children: z.array(projectNodeSchema).optional()
  })
);

export const projectFileSchema: z.ZodType<projectFile> = z.object({
  path: z.string(),
  content: z.string(),
  size: z.number(),
  truncated: z.boolean()
});

export const projectSchema: z.ZodType<project> = z.object({
  id: z.string(),
  name: z.string(),
  path: z.string(),
  runtime: z.string(),
  framework: z.string(),
  packageManager: z.string(),
  branch: z.string(),
  repositoryUrl: z.string().nullable(),
  createdAt: z.string(),
  source: projectSourceSchema,
  tree: projectNodeSchema
});

export const scannedProjectSchema: z.ZodType<
  Omit<project, "id" | "createdAt" | "source">
> = z.object({
  name: z.string(),
  path: z.string(),
  runtime: z.string(),
  framework: z.string(),
  packageManager: z.string(),
  branch: z.string(),
  repositoryUrl: z.string().nullable(),
  tree: projectNodeSchema
});

export const projectsSchema = z.array(projectSchema);
export const projectNodesSchema = z.array(projectNodeSchema);
