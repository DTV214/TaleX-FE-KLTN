import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { subscriptionsApi } from "../api/subscriptions.api";
import type {
  CreateSubscriptionRequest,
  SubscriptionFilterParams,
  UpdateSubscriptionRequest,
} from "../types/subscriptions.types";

export const subscriptionKeys = {
  all: ["admin", "subscriptions"] as const,
  lists: () => [...subscriptionKeys.all, "list"] as const,
  list: (filters: SubscriptionFilterParams) =>
    [...subscriptionKeys.lists(), filters] as const,
  details: () => [...subscriptionKeys.all, "detail"] as const,
  detail: (subscriptionId: string) =>
    [...subscriptionKeys.details(), subscriptionId] as const,
};

export function useGetSubscriptions(filters: SubscriptionFilterParams) {
  return useQuery({
    queryKey: subscriptionKeys.list(filters),
    queryFn: () => subscriptionsApi.getSubscriptions(filters),
    placeholderData: keepPreviousData,
    staleTime: 60 * 1000,
  });
}

export function useGetSubscription(subscriptionId: string) {
  return useQuery({
    queryKey: subscriptionKeys.detail(subscriptionId),
    queryFn: () => subscriptionsApi.getSubscriptionById(subscriptionId),
    enabled: Boolean(subscriptionId),
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateSubscription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateSubscriptionRequest) =>
      subscriptionsApi.createSubscription(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.lists() });
    },
  });
}

export function useUpdateSubscription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      subscriptionId,
      payload,
    }: {
      subscriptionId: string;
      payload: UpdateSubscriptionRequest;
    }) => subscriptionsApi.updateSubscription(subscriptionId, payload),
    onSuccess: (_response, variables) => {
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: subscriptionKeys.detail(variables.subscriptionId),
      });
    },
  });
}

export function useDeleteSubscription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (subscriptionId: string) =>
      subscriptionsApi.deleteSubscription(subscriptionId),
    onSuccess: (_response, subscriptionId) => {
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: subscriptionKeys.detail(subscriptionId),
      });
    },
  });
}
