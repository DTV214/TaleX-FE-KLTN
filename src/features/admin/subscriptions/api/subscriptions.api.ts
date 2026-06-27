import { httpClient } from "@/shared/api/http-client";
import type {
  CreateSubscriptionRequest,
  DeleteSubscriptionResponse,
  SubscriptionDetailResponse,
  SubscriptionFilterParams,
  SubscriptionListResponse,
  SubscriptionMutationResponse,
  UpdateSubscriptionRequest,
} from "../types/subscriptions.types";

const SUBSCRIPTIONS_ENDPOINT = "/api/v1/subscriptions";

export const subscriptionsApi = {
  async getSubscriptions(
    params: SubscriptionFilterParams,
  ): Promise<SubscriptionListResponse> {
    const response = await httpClient.get<SubscriptionListResponse>(
      SUBSCRIPTIONS_ENDPOINT,
      {
        params,
        paramsSerializer: {
          indexes: null,
        },
      },
    );

    return response.data;
  },

  async getSubscriptionById(
    subscriptionId: string,
  ): Promise<SubscriptionDetailResponse> {
    const response = await httpClient.get<SubscriptionDetailResponse>(
      `${SUBSCRIPTIONS_ENDPOINT}/${subscriptionId}`,
    );

    return response.data;
  },

  async createSubscription(
    payload: CreateSubscriptionRequest,
  ): Promise<SubscriptionMutationResponse> {
    const response = await httpClient.post<SubscriptionMutationResponse>(
      SUBSCRIPTIONS_ENDPOINT,
      payload,
    );

    return response.data;
  },

  async updateSubscription(
    subscriptionId: string,
    payload: UpdateSubscriptionRequest,
  ): Promise<SubscriptionMutationResponse> {
    const response = await httpClient.put<SubscriptionMutationResponse>(
      `${SUBSCRIPTIONS_ENDPOINT}/${subscriptionId}`,
      payload,
    );

    return response.data;
  },

  async deleteSubscription(
    subscriptionId: string,
  ): Promise<DeleteSubscriptionResponse> {
    const response = await httpClient.delete<DeleteSubscriptionResponse>(
      `${SUBSCRIPTIONS_ENDPOINT}/${subscriptionId}`,
    );

    return response.data;
  },
};
