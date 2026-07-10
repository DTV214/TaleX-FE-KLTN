import type { BaseResponse } from "@/shared/api/http-client";

export type OrderStatus = "AWAITING_PAYMENT" | "COMPLETED" | "OUT_OF_TIME" | "CANCELLED";

export type CreateOrderRequest = {
  subscriptionId: string;
};

export type ContentOrderItemType = "EPISODE" | "COMBO";

export type CreateContentOrderRequest = {
  itemId: string;
  itemType: ContentOrderItemType;
  coinAmountToUse?: number;
};

export type OrderResponse = {
  orderId: string;
  paymentCode: string;
  qrUrl: string | null;
  totalAmount: number;
  coinAmountUsed: number;
  fiatAmount: number;
  status: OrderStatus;
  expiresAt: string;
};

export type CreateOrderResponse = BaseResponse<OrderResponse>;
export type GetOrderResponse = BaseResponse<OrderResponse>;

export type AccountSubscription = {
  accountSubscriptionId: string;
  accountId: string;
  subscriptionId: string;
  startTime: string;
  endTime: string;
  updatedAt: string;
  cancelledAt: string | null;
  isAdBlocked: boolean;
  isMovieUnlocked: boolean;
  isStoryUnlocked: boolean;
  isCancelled: boolean;
};
