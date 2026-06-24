import { invokeCommand } from "@/core/tauri/tauri-client";
import { projectNodesSchema } from "@/features/project/schemas/project-schema";
import type { projectNode } from "@/features/project/types/project";

export const readProjectDirectory = async (args: {
  directoryPath: string;
  projectPath: string;
}): Promise<projectNode[]> =>
  projectNodesSchema.parse(
    await invokeCommand<projectNode[]>("read_project_directory", {
      directoryPath: args.directoryPath,
      projectPath: args.projectPath
    })
  );
