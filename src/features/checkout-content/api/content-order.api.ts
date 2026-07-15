import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import { httpClient } from "@/shared/api/http-client";
import { coinKeys } from "@/features/coin/hooks/useCoinQueries";
import { paymentKeys } from "@/features/payment/api/payment.api";
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
  const queryClient = useQueryClient();

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
      const order = response.data.data;
      // Đồng bộ ngay vào cache của useOrderStatus (poll mỗi 3s) để số tiền/QR cập nhật
      // tức thời sau khi đổi Coin, không phải chờ tới tick poll tiếp theo.
      queryClient.setQueryData(paymentKeys.order(order.orderId), order);
      // Server có thể vừa debit/credit Coin (áp dụng lựa chọn mới) — làm mới số dư hiển
      // thị ở header/CoinPaymentSelector ngay, không chờ staleTime 60s của useCoinWallet.
      queryClient.invalidateQueries({ queryKey: coinKeys.wallet() });
      queryClient.invalidateQueries({ queryKey: coinKeys.transactions() });
      return order;
    },
    enabled: Boolean(itemId),
    staleTime: 0,
    refetchOnMount: "always",
    retry: false,
    // Giữ dữ liệu đơn hàng cũ trong lúc đổi Coin đang tính lại — tránh cả khung QR/giá
    // biến mất rồi hiện spinner toàn màn hình mỗi lần bật/tắt Coin, giật mắt người dùng.
    placeholderData: keepPreviousData,
  });
}
