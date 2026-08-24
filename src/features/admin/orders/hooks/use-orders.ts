import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { ordersApi } from "../api/orders.api";
import type { OrderSearchParams, OrderStatsParams } from "../types/orders.types";

export const orderKeys = {
  all: ["admin", "orders"] as const,
  lists: () => [...orderKeys.all, "list"] as const,
  list: (filters: OrderSearchParams) =>
    [...orderKeys.lists(), filters] as const,
  details: () => [...orderKeys.all, "detail"] as const,
  detail: (orderId: string) => [...orderKeys.details(), orderId] as const,
  stats: () => [...orderKeys.all, "stats"] as const,
  statsRange: (params: OrderStatsParams) =>
    [...orderKeys.stats(), params] as const,
};

export function useSearchOrders(filters: OrderSearchParams) {
  return useQuery({
    queryKey: orderKeys.list(filters),
    queryFn: () => ordersApi.searchOrders(filters),
    placeholderData: keepPreviousData,
    staleTime: 30 * 1000,
  });
}

export function useOrderDetail(orderId: string) {
  return useQuery({
    queryKey: orderKeys.detail(orderId),
    queryFn: () => ordersApi.getOrderDetail(orderId),
    enabled: Boolean(orderId),
    staleTime: 30 * 1000,
  });
}

export function useOrderStats(params: OrderStatsParams) {
  return useQuery({
    queryKey: orderKeys.statsRange(params),
    queryFn: () => ordersApi.getStats(params),
    staleTime: 60 * 1000,
  });
}
