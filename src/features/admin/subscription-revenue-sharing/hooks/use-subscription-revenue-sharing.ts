import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { subscriptionRevenueSharingApi } from "../api/subscription-revenue-sharing.api";
import type {
  MonthYearParams,
  PagedMonthYearParams,
} from "../types/subscription-revenue-sharing.types";

export const subscriptionRevenueSharingKeys = {
  all: ["admin", "subscription-revenue-sharing"] as const,
  syncMetadata: () =>
    [...subscriptionRevenueSharingKeys.all, "sync-metadata"] as const,
  results: (params: MonthYearParams) =>
    [...subscriptionRevenueSharingKeys.all, "results", params] as const,
  revenueLogs: (subscriptionResultId: string, page: number, pageSize: number) =>
    [
      ...subscriptionRevenueSharingKeys.all,
      "revenue-logs",
      subscriptionResultId,
      page,
      pageSize,
    ] as const,
  monthlySubscriptions: (params: PagedMonthYearParams) =>
    [
      ...subscriptionRevenueSharingKeys.all,
      "monthly-subscriptions",
      params,
    ] as const,
  accountSubscriptionStats: (
    accountSubscriptionId: string,
    page: number,
    pageSize: number,
  ) =>
    [
      ...subscriptionRevenueSharingKeys.all,
      "account-subscription-stats",
      accountSubscriptionId,
      page,
      pageSize,
    ] as const,
};

export function useSubscriptionSyncMetadata() {
  return useQuery({
    queryKey: subscriptionRevenueSharingKeys.syncMetadata(),
    queryFn: () => subscriptionRevenueSharingApi.getSyncMetadata(),
    staleTime: 60 * 1000,
  });
}

export function useSubscriptionResults(params: MonthYearParams) {
  return useQuery({
    queryKey: subscriptionRevenueSharingKeys.results(params),
    queryFn: () => subscriptionRevenueSharingApi.getSubscriptionResults(params),
    placeholderData: keepPreviousData,
    staleTime: 30 * 1000,
  });
}

export function useSubscriptionRevenueLogs(
  subscriptionResultId: string | null,
  page: number,
  pageSize: number,
) {
  return useQuery({
    queryKey: subscriptionRevenueSharingKeys.revenueLogs(
      subscriptionResultId ?? "",
      page,
      pageSize,
    ),
    queryFn: () =>
      subscriptionRevenueSharingApi.getRevenueLogs(
        subscriptionResultId!,
        page,
        pageSize,
      ),
    enabled: Boolean(subscriptionResultId),
    placeholderData: keepPreviousData,
    staleTime: 30 * 1000,
  });
}

export function useMonthlyAccountSubscriptions(params: PagedMonthYearParams) {
  return useQuery({
    queryKey: subscriptionRevenueSharingKeys.monthlySubscriptions(params),
    queryFn: () =>
      subscriptionRevenueSharingApi.getMonthlyAccountSubscriptions(params),
    placeholderData: keepPreviousData,
    staleTime: 30 * 1000,
  });
}

export function useAccountSubscriptionStats(
  accountSubscriptionId: string | null,
  page = 1,
  pageSize = 20,
) {
  return useQuery({
    queryKey: subscriptionRevenueSharingKeys.accountSubscriptionStats(
      accountSubscriptionId ?? "",
      page,
      pageSize,
    ),
    queryFn: () =>
      subscriptionRevenueSharingApi.getAccountSubscriptionStats(
        accountSubscriptionId!,
        page,
        pageSize,
      ),
    enabled: Boolean(accountSubscriptionId),
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: false,
  });
}

export function useProcessSubscriptionStats() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: MonthYearParams) =>
      subscriptionRevenueSharingApi.processStats(params),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: subscriptionRevenueSharingKeys.all,
      });
    },
  });
}

export function useCalculateSubscriptionRevenueSharing() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: MonthYearParams) =>
      subscriptionRevenueSharingApi.calculateAndSave(params),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: subscriptionRevenueSharingKeys.all,
      });
    },
  });
}
