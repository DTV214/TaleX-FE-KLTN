import type { BasePageResponse, BaseResponse } from "@/shared/api/http-client";

export type OrderStatus =
  | "AWAITING_PAYMENT"
  | "COMPLETED"
  | "OUT_OF_TIME"
  | "CANCELLED";

export type OrderItemType = "SUBSCRIPTION" | "EPISODE" | "COMBO" | "ENGAGEMENT";

export type AdminOrderListItem = {
  orderId: string;
  paymentCode: string;
  status: OrderStatus;
  itemType: string;
  itemId: string;
  totalAmount: number;
  coinAmount: number;
  fiatAmount: number;
  campaignWalletAmount: number;
  vatAmount: number | null;
  createdAt: string;
  expiresAt: string | null;
  buyerUsername: string | null;
  buyerEmail: string | null;
};

export type AdminOrderDetail = AdminOrderListItem & {
  overpaidAmount: number | null;
  vatRate: number | null;
  metadata: string | null;
  updatedAt: string;
  buyerAccountId: string | null;
};

export type AdminOrderRevenueByItemType = {
  itemType: string;
  totalRevenue: number;
  orderCount: number;
};

export type AdminOrderStats = {
  totalOrders: number;
  countByStatus: Record<string, number>;
  revenueByItemType: AdminOrderRevenueByItemType[];
  cancelledRatePercent: number;
  expiredRatePercent: number;
};

export type OrderSearchParams = {
  status?: OrderStatus;
  itemType?: OrderItemType;
  createdAtFrom?: string;
  createdAtTo?: string;
  keyword?: string;
  page: number;
  pageSize: number;
};

export type OrderStatsParams = {
  from: string;
  to: string;
};

export type AdminOrderListResponse = BaseResponse<
  BasePageResponse<AdminOrderListItem>
>;

export type AdminOrderDetailResponse = BaseResponse<AdminOrderDetail>;

export type AdminOrderStatsResponse = BaseResponse<AdminOrderStats>;
