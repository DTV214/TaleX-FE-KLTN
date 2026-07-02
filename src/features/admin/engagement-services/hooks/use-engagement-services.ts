import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { engagementServicesApi } from "../api/engagement-services.api";
import type {
  EngagementServiceFilterParams,
  EngagementServiceRequest,
} from "../types/engagement-services.types";

export const engagementServiceKeys = {
  all: ["admin", "engagement-services"] as const,
  lists: () => [...engagementServiceKeys.all, "list"] as const,
  list: (filters: EngagementServiceFilterParams) =>
    [...engagementServiceKeys.lists(), filters] as const,
  details: () => [...engagementServiceKeys.all, "detail"] as const,
  detail: (engagementServiceId: string) =>
    [...engagementServiceKeys.details(), engagementServiceId] as const,
};

export function useGetEngagementServices(
  filters: EngagementServiceFilterParams,
) {
  return useQuery({
    queryKey: engagementServiceKeys.list(filters),
    queryFn: () => engagementServicesApi.getEngagementServices(filters),
    placeholderData: keepPreviousData,
    staleTime: 60 * 1000,
  });
}

export function useGetEngagementService(engagementServiceId: string) {
  return useQuery({
    queryKey: engagementServiceKeys.detail(engagementServiceId),
    queryFn: () =>
      engagementServicesApi.getEngagementServiceById(engagementServiceId),
    enabled: Boolean(engagementServiceId),
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateEngagementService() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: EngagementServiceRequest) =>
      engagementServicesApi.createEngagementService(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: engagementServiceKeys.lists(),
      });
    },
  });
}

export function useUpdateEngagementService() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      engagementServiceId,
      payload,
    }: {
      engagementServiceId: string;
      payload: EngagementServiceRequest;
    }) =>
      engagementServicesApi.updateEngagementService(
        engagementServiceId,
        payload,
      ),
    onSuccess: (_response, variables) => {
      queryClient.invalidateQueries({
        queryKey: engagementServiceKeys.lists(),
      });
      queryClient.invalidateQueries({
        queryKey: engagementServiceKeys.detail(variables.engagementServiceId),
      });
    },
  });
}

export function useDeleteEngagementService() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (engagementServiceId: string) =>
      engagementServicesApi.deleteEngagementService(engagementServiceId),
    onSuccess: (_response, engagementServiceId) => {
      queryClient.invalidateQueries({
        queryKey: engagementServiceKeys.lists(),
      });
      queryClient.invalidateQueries({
        queryKey: engagementServiceKeys.detail(engagementServiceId),
      });
    },
  });
}
