import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  httpClient,
  type BasePageResponse,
  type BaseResponse,
} from "@/shared/api/http-client";
import { parseBackendDate } from "@/shared/utils/backend-date";
import type {
  AccountSubscription,
  CreateOrderRequest,
  CreateOrderResponse,
  GetOrderResponse,
  OrderResponse,
  OrderStatus,
} from "../types/payment.types";

const ORDERS_ENDPOINT = "/api/v1/orders";
const ACCOUNT_SUBSCRIPTIONS_OWN_ENDPOINT = "/api/v1/account-subscriptions/own";
const POLL_INTERVAL_MS = 3000;
const TERMINAL_STATUSES: OrderStatus[] = ["COMPLETED", "OUT_OF_TIME", "CANCELLED"];

export const paymentKeys = {
  all: ["payment"] as const,
  order: (orderId: string) => [...paymentKeys.all, "order", orderId] as const,
  activeSubscription: () => [...paymentKeys.all, "active-subscription"] as const,
};

export function useCreateOrder() {
  return useMutation({
    mutationFn: async (request: CreateOrderRequest): Promise<OrderResponse> => {
      const response = await httpClient.post<CreateOrderResponse>(
        ORDERS_ENDPOINT,
        request,
      );
      return response.data.data;
    },
  });
}

/**
 * Creating an Order is idempotent server-side (returns the same order while it's
 * still AWAITING_PAYMENT), so it's modeled as a query rather than a manually
 * fired mutation — avoids fragile effect+ref bookkeeping to fire it exactly once.
 */
export function useEnsureOrder(subscriptionId: string | undefined) {
  return useQuery({
    queryKey: ["payment", "create-order", subscriptionId],
    queryFn: async (): Promise<OrderResponse> => {
      const response = await httpClient.post<CreateOrderResponse>(ORDERS_ENDPOINT, {
        subscriptionId,
      });
      return response.data.data;
    },
    enabled: Boolean(subscriptionId),
    staleTime: 0,
    refetchOnMount: "always",
    retry: false,
  });
}

export function useOrderStatus(orderId: string | undefined) {
  return useQuery({
    queryKey: paymentKeys.order(orderId ?? ""),
    queryFn: async (): Promise<OrderResponse> => {
      const response = await httpClient.get<GetOrderResponse>(
        `${ORDERS_ENDPOINT}/${orderId}`,
      );
      return response.data.data;
    },
    enabled: Boolean(orderId),
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status && TERMINAL_STATUSES.includes(status) ? false : POLL_INTERVAL_MS;
    },
  });
}

export function useCancelOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (orderId: string): Promise<OrderResponse> => {
      const response = await httpClient.post<GetOrderResponse>(
        `${ORDERS_ENDPOINT}/${orderId}/cancel`,
      );
      return response.data.data;
    },
    onSuccess: (data, orderId) => {
      queryClient.setQueryData(paymentKeys.order(orderId), data);
    },
  });
}

export function useConfirmCoinPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (orderId: string): Promise<OrderResponse> => {
      const response = await httpClient.post<GetOrderResponse>(
        `${ORDERS_ENDPOINT}/${orderId}/confirm-coin-payment`,
      );
      return response.data.data;
    },
    onSuccess: (data, orderId) => {
      queryClient.setQueryData(paymentKeys.order(orderId), data);
    },
  });
}

export function useActiveSubscription() {
  return useQuery({
    queryKey: paymentKeys.activeSubscription(),
    queryFn: async (): Promise<AccountSubscription | null> => {
      const response = await httpClient.get<
        BaseResponse<BasePageResponse<AccountSubscription>>
      >(ACCOUNT_SUBSCRIPTIONS_OWN_ENDPOINT, {
        params: {
          page: 1,
          pageSize: 1,
          sortBy: "endTime",
          sortDirection: "DESC",
        },
      });

      const latest = response.data.data.content[0];
      if (!latest || latest.isCancelled) {
        return null;
      }
      return parseBackendDate(latest.endTime) > new Date() ? latest : null;
    },
    staleTime: 30 * 1000,
  });
}
