import { httpClient } from "@/shared/api/http-client";
import type {
  AdminOrderDetailResponse,
  AdminOrderListResponse,
  AdminOrderStatsResponse,
  OrderInterventionRequest,
  OrderPageParams,
  OrderSearchParams,
  OrderStatsParams,
} from "../types/orders.types";

const ADMIN_ORDERS_ENDPOINT = "/api/v1/admin/orders";

export const ordersApi = {
  async searchOrders(
    params: OrderSearchParams,
  ): Promise<AdminOrderListResponse> {
    const response = await httpClient.get<AdminOrderListResponse>(
      ADMIN_ORDERS_ENDPOINT,
      {
        params,
        paramsSerializer: {
          indexes: null,
        },
      },
    );

    return response.data;
  },

  async getOrderDetail(orderId: string): Promise<AdminOrderDetailResponse> {
    const response = await httpClient.get<AdminOrderDetailResponse>(
      `${ADMIN_ORDERS_ENDPOINT}/${orderId}`,
    );

    return response.data;
  },

  async listOverpaid(
    params: OrderPageParams,
  ): Promise<AdminOrderListResponse> {
    const response = await httpClient.get<AdminOrderListResponse>(
      `${ADMIN_ORDERS_ENDPOINT}/overpaid`,
      { params },
    );

    return response.data;
  },

  async getStats(params: OrderStatsParams): Promise<AdminOrderStatsResponse> {
    const response = await httpClient.get<AdminOrderStatsResponse>(
      `${ADMIN_ORDERS_ENDPOINT}/stats`,
      { params },
    );

    return response.data;
  },

  async cancelOrder(
    orderId: string,
    payload: OrderInterventionRequest,
  ): Promise<AdminOrderDetailResponse> {
    const response = await httpClient.post<AdminOrderDetailResponse>(
      `${ADMIN_ORDERS_ENDPOINT}/${orderId}/cancel`,
      payload,
    );

    return response.data;
  },

  async forceCompleteOrder(
    orderId: string,
    payload: OrderInterventionRequest,
  ): Promise<AdminOrderDetailResponse> {
    const response = await httpClient.post<AdminOrderDetailResponse>(
      `${ADMIN_ORDERS_ENDPOINT}/${orderId}/force-complete`,
      payload,
    );

    return response.data;
  },
};
