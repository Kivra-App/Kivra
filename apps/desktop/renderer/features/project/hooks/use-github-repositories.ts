import { useQuery } from "@tanstack/react-query";

import { fetchGithubRepositories } from "@/features/project/services/github-project-service";

export const useGithubRepositories = () =>
  useQuery({
    queryKey: ["github-repositories"],
    queryFn: fetchGithubRepositories,
    enabled: false
  });
