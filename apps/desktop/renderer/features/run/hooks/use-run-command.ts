import { useMutation } from "@tanstack/react-query";

import { runProjectCommand } from "@/features/run/services/run-service";

export const useRunCommand = () =>
  useMutation({
    mutationFn: runProjectCommand
  });
