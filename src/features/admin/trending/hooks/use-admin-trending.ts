import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { adminTrendingApi } from "../api/trending.api";
import type {
  TrendingCandidateParams,
  TrendingConfigRequest,
} from "../types/trending.types";

export const adminTrendingKeys = {
  all: ["admin", "trending"] as const,
  config: () => [...adminTrendingKeys.all, "config"] as const,
  candidates: () => [...adminTrendingKeys.all, "candidate-new-releases"] as const,
  candidateList: (params: TrendingCandidateParams) =>
    [...adminTrendingKeys.candidates(), params] as const,
  pool: () => [...adminTrendingKeys.all, "new-releases-pool"] as const,
};

export function useAdminTrendingConfig() {
  return useQuery({
    queryKey: adminTrendingKeys.config(),
    queryFn: () => adminTrendingApi.getConfig(),
    staleTime: 60 * 1000,
  });
}

export function useCreateAdminTrendingConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: TrendingConfigRequest) =>
      adminTrendingApi.createConfig(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminTrendingKeys.config() });
    },
  });
}

export function useUpdateAdminTrendingConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: TrendingConfigRequest) =>
      adminTrendingApi.updateConfig(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminTrendingKeys.config() });
      queryClient.invalidateQueries({ queryKey: adminTrendingKeys.candidates() });
      queryClient.invalidateQueries({ queryKey: adminTrendingKeys.pool() });
    },
  });
}

export function useAdminTrendingCandidates(params: TrendingCandidateParams) {
  return useQuery({
    queryKey: adminTrendingKeys.candidateList(params),
    queryFn: () => adminTrendingApi.getCandidateNewReleases(params),
    placeholderData: keepPreviousData,
    staleTime: 30 * 1000,
  });
}

export function useAdminTrendingPool() {
  return useQuery({
    queryKey: adminTrendingKeys.pool(),
    queryFn: () => adminTrendingApi.getNewReleasesPool(),
    staleTime: 30 * 1000,
  });
}

export function useForceTrendingThreshold() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => adminTrendingApi.forceThreshold(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminTrendingKeys.candidates() });
      queryClient.invalidateQueries({ queryKey: adminTrendingKeys.pool() });
    },
  });
}
