import { httpClient } from "@/shared/api/http-client";
import type {
  AdminCampaignDeleteResponse,
  AdminCampaignDetailResponse,
  AdminCampaignFilterParams,
  AdminCampaignListResponse,
  AdminCampaignMutationResponse,
  AdminCampaignPageResponse,
  AdminCampaignStatusUpdateRequest,
} from "../types/campaigns.types";

const ADMIN_CAMPAIGNS_ENDPOINT = "/api/v1/campaigns";

function buildCampaignParams(params: AdminCampaignFilterParams) {
  const searchParams = new URLSearchParams();

  params.statuses?.forEach((status) => {
    if (status) searchParams.append("statuses", status);
  });

  params.targets?.forEach((target) => {
    if (target) searchParams.append("targets", target);
  });

  if (params.page !== undefined) searchParams.set("page", String(params.page));
  if (params.pageSize !== undefined) {
    searchParams.set("pageSize", String(params.pageSize));
  }
  if (params.sortBy) searchParams.set("sortBy", params.sortBy);
  if (params.sortDirection) {
    searchParams.set("sortDirection", params.sortDirection);
  }

  return searchParams;
}

export const adminCampaignsApi = {
  async getCampaigns(
    params: AdminCampaignFilterParams = { page: 1, pageSize: 10 },
  ): Promise<AdminCampaignPageResponse> {
    const response = await httpClient.get<AdminCampaignListResponse>(
      ADMIN_CAMPAIGNS_ENDPOINT,
      {
        params: buildCampaignParams(params),
      },
    );

    return response.data.data;
  },

  async getCampaignById(
    campaignId: string,
  ): Promise<AdminCampaignDetailResponse> {
    const response = await httpClient.get<AdminCampaignDetailResponse>(
      `${ADMIN_CAMPAIGNS_ENDPOINT}/${campaignId}`,
    );

    return response.data;
  },

  async updateCampaign(
    campaignId: string,
    payload: AdminCampaignStatusUpdateRequest,
  ): Promise<AdminCampaignMutationResponse> {
    const response = await httpClient.put<AdminCampaignMutationResponse>(
      `${ADMIN_CAMPAIGNS_ENDPOINT}/${campaignId}`,
      payload,
    );

    return response.data;
  },

  async deleteCampaign(
    campaignId: string,
  ): Promise<AdminCampaignDeleteResponse> {
    const response = await httpClient.delete<AdminCampaignDeleteResponse>(
      `${ADMIN_CAMPAIGNS_ENDPOINT}/${campaignId}`,
    );

    return response.data;
  },
};
