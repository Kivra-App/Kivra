import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  getProject,
  getProjects,
  importGithubProject,
  registerProject
} from "@/features/project/services/project-service";

export const useProjects = () =>
  useQuery({
    queryKey: ["projects"],
    queryFn: getProjects
  });

export const useProject = (projectId: string) =>
  useQuery({
    queryKey: ["projects", projectId],
    queryFn: () => getProject(projectId)
  });

export const useRegisterProject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: registerProject,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["projects"] });
    }
  });
};

export const useImportGithubProject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: importGithubProject,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["projects"] });
    }
  });
};
