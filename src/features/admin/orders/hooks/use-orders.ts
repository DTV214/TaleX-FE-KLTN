import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { ordersApi } from "../api/orders.api";
import type {
  OrderInterventionRequest,
  OrderPageParams,
  OrderSearchParams,
  OrderStatsParams,
} from "../types/orders.types";

export const orderKeys = {
  all: ["admin", "orders"] as const,
  lists: () => [...orderKeys.all, "list"] as const,
  list: (filters: OrderSearchParams) =>
    [...orderKeys.lists(), filters] as const,
  details: () => [...orderKeys.all, "detail"] as const,
  detail: (orderId: string) => [...orderKeys.details(), orderId] as const,
  overpaid: () => [...orderKeys.all, "overpaid"] as const,
  overpaidList: (params: OrderPageParams) =>
    [...orderKeys.overpaid(), params] as const,
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

export function useOverpaidOrders(params: OrderPageParams) {
  return useQuery({
    queryKey: orderKeys.overpaidList(params),
    queryFn: () => ordersApi.listOverpaid(params),
    placeholderData: keepPreviousData,
    staleTime: 60 * 1000,
  });
}

export function useOrderStats(params: OrderStatsParams) {
  return useQuery({
    queryKey: orderKeys.statsRange(params),
    queryFn: () => ordersApi.getStats(params),
    staleTime: 60 * 1000,
  });
}

function invalidateOrderQueries(
  queryClient: ReturnType<typeof useQueryClient>,
  orderId: string,
) {
  queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
  queryClient.invalidateQueries({ queryKey: orderKeys.detail(orderId) });
  queryClient.invalidateQueries({ queryKey: orderKeys.overpaid() });
  queryClient.invalidateQueries({ queryKey: orderKeys.stats() });
}

export function useCancelOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      orderId,
      payload,
    }: {
      orderId: string;
      payload: OrderInterventionRequest;
    }) => ordersApi.cancelOrder(orderId, payload),
    onSuccess: (_response, variables) => {
      invalidateOrderQueries(queryClient, variables.orderId);
    },
  });
}

export function useForceCompleteOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      orderId,
      payload,
    }: {
      orderId: string;
      payload: OrderInterventionRequest;
    }) => ordersApi.forceCompleteOrder(orderId, payload),
    onSuccess: (_response, variables) => {
      invalidateOrderQueries(queryClient, variables.orderId);
    },
  });
}
