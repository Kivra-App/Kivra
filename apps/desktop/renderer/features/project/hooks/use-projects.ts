import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  connectGithubProjectToLocalFolder,
  getGithubProjectBranches,
  getProject,
  getProjects,
  importGithubProject,
  registerProject,
  switchGithubProjectBranch
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

export const useGithubProjectBranches = (args: {
  enabled: boolean;
  projectId: string;
}) =>
  useQuery({
    queryKey: ["projects", args.projectId, "github-branches"],
    queryFn: () => getGithubProjectBranches(args.projectId),
    enabled: args.enabled
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

export const useConnectGithubProjectToLocalFolder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: connectGithubProjectToLocalFolder,
    onSuccess: (project) => {
      void queryClient.invalidateQueries({ queryKey: ["projects"] });
      void queryClient.invalidateQueries({ queryKey: ["projects", project.id] });
    }
  });
};

export const useSwitchGithubProjectBranch = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: switchGithubProjectBranch,
    onSuccess: (project) => {
      void queryClient.invalidateQueries({ queryKey: ["projects"] });
      void queryClient.invalidateQueries({ queryKey: ["projects", project.id] });
    }
  });
};
