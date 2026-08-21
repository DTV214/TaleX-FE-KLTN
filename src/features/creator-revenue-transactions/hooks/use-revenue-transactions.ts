import { useQuery } from "@tanstack/react-query";
import { revenueTransactionsApi } from "../api/revenue-transactions.api";
import type {
  RevenueDateRangeParams,
  RevenueTransactionListParams,
} from "../types/revenue-transactions.types";

export const revenueTransactionKeys = {
  all: ["creator-revenue-transactions"] as const,
  summary: (params: RevenueDateRangeParams) =>
    [...revenueTransactionKeys.all, "summary", params] as const,
  timeSeries: (params: RevenueDateRangeParams) =>
    [...revenueTransactionKeys.all, "time-series", params] as const,
  list: (params: RevenueTransactionListParams) =>
    [...revenueTransactionKeys.all, "list", params] as const,
};

export function useRevenueTransactionSummary(params: RevenueDateRangeParams) {
  return useQuery({
    queryKey: revenueTransactionKeys.summary(params),
    queryFn: () => revenueTransactionsApi.summary(params),
    enabled: Boolean(params.startDate && params.endDate),
    staleTime: 30 * 1000,
  });
}

export function useRevenueTransactionTimeSeries(params: RevenueDateRangeParams) {
  return useQuery({
    queryKey: revenueTransactionKeys.timeSeries(params),
    queryFn: () => revenueTransactionsApi.timeSeries(params),
    enabled: Boolean(params.startDate && params.endDate),
    staleTime: 30 * 1000,
  });
}

export function useRevenueTransactionsList(
  params: RevenueTransactionListParams,
  enabled: boolean,
) {
  return useQuery({
    queryKey: revenueTransactionKeys.list(params),
    queryFn: () => revenueTransactionsApi.list(params),
    enabled,
    staleTime: 30 * 1000,
  });
}
