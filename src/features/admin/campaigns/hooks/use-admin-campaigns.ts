import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { adminCampaignsApi } from "../api/admin-campaigns.api";
import type {
  AdminCampaignFilterParams,
  AdminCampaignStatusUpdateRequest,
} from "../types/campaigns.types";

export const adminCampaignKeys = {
  all: ["admin", "campaigns"] as const,
  lists: () => [...adminCampaignKeys.all, "list"] as const,
  list: (filters: AdminCampaignFilterParams) =>
    [...adminCampaignKeys.lists(), filters] as const,
  details: () => [...adminCampaignKeys.all, "detail"] as const,
  detail: (campaignId: string) =>
    [...adminCampaignKeys.details(), campaignId] as const,
};

export function useGetAdminCampaigns(filters: AdminCampaignFilterParams) {
  return useQuery({
    queryKey: adminCampaignKeys.list(filters),
    queryFn: () => adminCampaignsApi.getCampaigns(filters),
    placeholderData: keepPreviousData,
    staleTime: 30 * 1000,
  });
}

export function useGetAdminCampaign(campaignId: string) {
  return useQuery({
    queryKey: adminCampaignKeys.detail(campaignId),
    queryFn: () => adminCampaignsApi.getCampaignById(campaignId),
    enabled: Boolean(campaignId),
    staleTime: 60 * 1000,
  });
}

export function useUpdateAdminCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      campaignId,
      payload,
    }: {
      campaignId: string;
      payload: AdminCampaignStatusUpdateRequest;
    }) => adminCampaignsApi.updateCampaign(campaignId, payload),
    onSuccess: (_response, variables) => {
      queryClient.invalidateQueries({
        queryKey: adminCampaignKeys.lists(),
      });
      queryClient.invalidateQueries({
        queryKey: adminCampaignKeys.detail(variables.campaignId),
      });
    },
  });
}

export function useDeleteAdminCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (campaignId: string) =>
      adminCampaignsApi.deleteCampaign(campaignId),
    onSuccess: (_response, campaignId) => {
      queryClient.invalidateQueries({
        queryKey: adminCampaignKeys.lists(),
      });
      queryClient.invalidateQueries({
        queryKey: adminCampaignKeys.detail(campaignId),
      });
    },
  });
}
