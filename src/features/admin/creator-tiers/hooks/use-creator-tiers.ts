import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { creatorTiersApi } from "../api/creator-tiers.api";
import type {
  CreateCreatorTierRequest,
  CreatorTierFilterParams,
  UpdateCreatorTierRequest,
} from "../types/creator-tiers.types";

export const creatorTierKeys = {
  all: ["admin", "creator-tiers"] as const,
  lists: () => [...creatorTierKeys.all, "list"] as const,
  list: (filters: CreatorTierFilterParams) =>
    [...creatorTierKeys.lists(), filters] as const,
  details: () => [...creatorTierKeys.all, "detail"] as const,
  detail: (creatorTierId: string) =>
    [...creatorTierKeys.details(), creatorTierId] as const,
};

export function useGetCreatorTiers(filters: CreatorTierFilterParams) {
  return useQuery({
    queryKey: creatorTierKeys.list(filters),
    queryFn: () => creatorTiersApi.getCreatorTiers(filters),
    placeholderData: keepPreviousData,
    staleTime: 60 * 1000,
  });
}

export function useGetCreatorTier(creatorTierId: string) {
  return useQuery({
    queryKey: creatorTierKeys.detail(creatorTierId),
    queryFn: () => creatorTiersApi.getCreatorTierById(creatorTierId),
    enabled: Boolean(creatorTierId),
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateTier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateCreatorTierRequest) =>
      creatorTiersApi.createCreatorTier(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: creatorTierKeys.lists() });
    },
  });
}

export function useUpdateTier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      creatorTierId,
      payload,
    }: {
      creatorTierId: string;
      payload: UpdateCreatorTierRequest;
    }) => creatorTiersApi.updateCreatorTier(creatorTierId, payload),
    onSuccess: (_response, variables) => {
      queryClient.invalidateQueries({ queryKey: creatorTierKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: creatorTierKeys.detail(variables.creatorTierId),
      });
    },
  });
}

export function useDeleteTier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (creatorTierId: string) =>
      creatorTiersApi.deleteCreatorTier(creatorTierId),
    onSuccess: (_response, creatorTierId) => {
      queryClient.invalidateQueries({ queryKey: creatorTierKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: creatorTierKeys.detail(creatorTierId),
      });
    },
  });
}
