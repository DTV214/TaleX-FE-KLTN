import type { BaseResponse } from "@/shared/api/http-client";

export type OrderStatus = "AWAITING_PAYMENT" | "COMPLETED" | "OUT_OF_TIME" | "CANCELLED";

export type CreateOrderRequest = {
  subscriptionId: string;
};

export type OrderResponse = {
  orderId: string;
  paymentCode: string;
  qrUrl: string;
  totalAmount: number;
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
