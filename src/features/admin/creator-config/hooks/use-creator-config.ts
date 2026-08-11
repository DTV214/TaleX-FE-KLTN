import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { creatorConfigApi } from "../api/creator-config.api";
import type { CreatorConfigRequest } from "../types/creator-config.types";

export const creatorConfigKeys = {
  all: ["admin", "creator-config"] as const,
  config: () => [...creatorConfigKeys.all, "config"] as const,
};

export function useCreatorConfig() {
  return useQuery({
    queryKey: creatorConfigKeys.config(),
    queryFn: () => creatorConfigApi.getConfig(),
    staleTime: 60 * 1000,
  });
}

export function useCreateCreatorConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreatorConfigRequest) =>
      creatorConfigApi.createConfig(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: creatorConfigKeys.config() });
    },
  });
}

export function useUpdateCreatorConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreatorConfigRequest) =>
      creatorConfigApi.updateConfig(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: creatorConfigKeys.config() });
    },
  });
}
