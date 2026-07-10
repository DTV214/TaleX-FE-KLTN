import { useQuery } from "@tanstack/react-query";
import { httpClient } from "@/shared/api/http-client";
import type {
  ContentOrderItemType,
  CreateContentOrderRequest,
  CreateOrderResponse,
  OrderResponse,
} from "@/features/payment/types/payment.types";

const CONTENT_ORDERS_ENDPOINT = "/api/v1/orders/content";

/**
 * Mirrors `useEnsureOrder` (Premium flow): idempotent creation modeled as a query,
 * not a manually fired mutation. `coinAmountToUse` is part of the query key so
 * adjusting the Coin slider re-fires creation — the server is idempotent while the
 * order is AWAITING_PAYMENT and returns the recalculated coin/fiat split.
 */
export function useEnsureContentOrder(
  itemId: string | undefined,
  itemType: ContentOrderItemType,
  coinAmountToUse: number,
) {
  return useQuery({
    queryKey: ["payment", "create-content-order", itemId, itemType, coinAmountToUse],
    queryFn: async (): Promise<OrderResponse> => {
      const request: CreateContentOrderRequest = {
        itemId: itemId as string,
        itemType,
        coinAmountToUse,
      };
      const response = await httpClient.post<CreateOrderResponse>(
        CONTENT_ORDERS_ENDPOINT,
        request,
      );
      return response.data.data;
    },
    enabled: Boolean(itemId),
    staleTime: 0,
    refetchOnMount: "always",
    retry: false,
  });
}
