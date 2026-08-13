import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminChannelsApi } from "../api/channels.api";
import { GENERAL_CHANNELS, type ChannelKey, type RankCandidatesRequest } from "../types/channels.types";

export const adminChannelKeys = {
  all: ["admin", "channels"] as const,
  channel: (key: ChannelKey) => [...adminChannelKeys.all, key] as const,
  accounts: () => [...adminChannelKeys.all, "accounts"] as const,
  recentSeries: (accountId: string) => [...adminChannelKeys.all, "recent-series", accountId] as const,
  similarSeries: (seriesId: string) => [...adminChannelKeys.all, "similar-series", seriesId] as const,
  recommendationPool: (accountId: string) => [...adminChannelKeys.all, "recommendation-pool", accountId] as const,
  alreadyWatchedPool: (accountId: string) => [...adminChannelKeys.all, "already-watched-pool", accountId] as const,
  mongoFeatures: (accountId: string) => [...adminChannelKeys.all, "mongo-features", accountId] as const,
  mongoDynamicFeatures: (accountId: string) => [...adminChannelKeys.all, "mongo-dynamic-features", accountId] as const,
};

export function useAdminChannelCards(key: ChannelKey) {
  return useQuery({
    queryKey: adminChannelKeys.channel(key),
    queryFn: () => adminChannelsApi.getChannelCards(key),
    staleTime: 60 * 1000,
  });
}

export function useTriggerChannelsPool() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => adminChannelsApi.triggerChannelsPool(),
    onSuccess: () => {
      // Invalidate all channel queries so they fetch updated pool data
      GENERAL_CHANNELS.forEach((ch) => {
        queryClient.invalidateQueries({
          queryKey: adminChannelKeys.channel(ch.key),
        });
      });
    },
  });
}

export function useAdminAllChannels() {
  const queryClient = useQueryClient();

  const refetchAll = async () => {
    await Promise.all(
      GENERAL_CHANNELS.map((ch) =>
        queryClient.invalidateQueries({
          queryKey: adminChannelKeys.channel(ch.key),
        })
      )
    );
  };

  return {
    refetchAll,
  };
}

// 1. Hook to fetch admin accounts list for dropdown selector
export function useAdminAccountsList() {
  return useQuery({
    queryKey: adminChannelKeys.accounts(),
    queryFn: () => adminChannelsApi.getAdminAccountsList(),
    staleTime: 5 * 60 * 1000,
  });
}

// 2. Hook to fetch recent 5 watched series for selected accountId
export function useRecentSeriesByAccount(accountId: string) {
  return useQuery({
    queryKey: adminChannelKeys.recentSeries(accountId),
    queryFn: () => adminChannelsApi.getRecentSeriesByAccount(accountId),
    enabled: !!accountId,
    staleTime: 60 * 1000,
  });
}

// 3. Hook to fetch similar series recommendation for selected seriesId
export function useSimilarSeries(seriesId: string) {
  return useQuery({
    queryKey: adminChannelKeys.similarSeries(seriesId),
    queryFn: () => adminChannelsApi.getSimilarSeries(seriesId),
    enabled: !!seriesId,
    staleTime: 60 * 1000,
  });
}

// 4. Hook to fetch recommendation pool with scores for accountId
export function useRecommendationPoolByAccount(accountId: string) {
  return useQuery({
    queryKey: adminChannelKeys.recommendationPool(accountId),
    queryFn: () => adminChannelsApi.getRecommendationPoolByAccount(accountId),
    enabled: !!accountId,
    staleTime: 60 * 1000,
  });
}

// 5. Hook to fetch already watched pool for accountId
export function useAlreadyWatchedPoolByAccount(accountId: string) {
  return useQuery({
    queryKey: adminChannelKeys.alreadyWatchedPool(accountId),
    queryFn: () => adminChannelsApi.getAlreadyWatchedPoolByAccount(accountId),
    enabled: !!accountId,
    staleTime: 60 * 1000,
  });
}

// 6. Hook to fetch MongoDB User Features profile for accountId
export function useMongoUserFeatures(accountId: string) {
  return useQuery({
    queryKey: adminChannelKeys.mongoFeatures(accountId),
    queryFn: () => adminChannelsApi.getMongoUserFeatures(accountId),
    enabled: !!accountId,
    staleTime: 60 * 1000,
  });
}

// 7. Hook to fetch MongoDB User Dynamic Features profile (Top 5 categories & tags)
export function useMongoUserDynamicFeatures(accountId: string) {
  return useQuery({
    queryKey: adminChannelKeys.mongoDynamicFeatures(accountId),
    queryFn: () => adminChannelsApi.getMongoUserDynamicFeatures(accountId),
    enabled: !!accountId,
    staleTime: 60 * 1000,
  });
}

// 8. Hook to trigger Train Init (Mock Data)
export function useTrainInit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (token?: string) => adminChannelsApi.trainInit(token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminChannelKeys.all });
    },
  });
}

// 9. Hook to trigger Train Init Real (Supabase DB + MongoDB Atlas)
export function useTrainInitReal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ token, maxSamples }: { token?: string; maxSamples?: number }) =>
      adminChannelsApi.trainInitReal(token, maxSamples),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminChannelKeys.all });
    },
  });
}

// 10. Hook to rank candidate series
export function useRankCandidates() {
  return useMutation({
    mutationFn: (payload: RankCandidatesRequest) => adminChannelsApi.rankCandidates(payload),
  });
}

// 11. Hook to download train dataset Excel
export function useDownloadTrainData() {
  return useMutation({
    mutationFn: async () => {
      const blob = await adminChannelsApi.downloadTrainData();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "train_data.xlsx");
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    },
  });
}

