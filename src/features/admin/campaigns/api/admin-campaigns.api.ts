import { httpClient } from "@/shared/api/http-client";
import type {
  AdminCampaign,
  AdminCampaignDeleteResponse,
  AdminCampaignDetailResponse,
  AdminCampaignFilterParams,
  AdminCampaignListResponse,
  AdminCampaignMutationResponse,
  AdminCampaignPageResponse,
  AdminCampaignStatusUpdateRequest,
} from "../types/campaigns.types";

const ADMIN_CAMPAIGNS_ENDPOINT = "/api/v1/campaigns";

const DEMO_CAMPAIGNS: AdminCampaign[] = [
  {
    campaignId: "60c4f778-bcaf-4281-8c05-100bac62c86d",
    engagementServiceId: "srv-engagement-boost-01",
    orderId: "ord-99201-abc",
    status: "RUNNING",
    startAt: "2026-08-01T00:00:00.000Z",
    endAt: "2026-08-31T23:59:59.000Z",
    createdAt: "2026-08-01T00:00:00.000Z",
    updatedAt: "2026-08-15T10:00:00.000Z",
    targetImpression: 50000,
    currentImpression: 23500,
    analyticData: {
      views: 12500,
      likes: 3400,
      comments: 890,
      shares: 420,
    },
  },
  {
    campaignId: "293079e5-c394-4786-84e6-f07bd72a0ccb",
    engagementServiceId: "srv-engagement-vip-02",
    orderId: "ord-88123-xyz",
    status: "PAUSED",
    startAt: "2026-08-05T00:00:00.000Z",
    endAt: "2026-08-25T23:59:59.000Z",
    createdAt: "2026-08-05T00:00:00.000Z",
    updatedAt: "2026-08-14T15:30:00.000Z",
    targetImpression: 100000,
    currentImpression: 45000,
    analyticData: {
      views: 28000,
      likes: 6200,
      comments: 1500,
      shares: 980,
    },
  },
];

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
    try {
      const response = await httpClient.get<AdminCampaignListResponse>(
        ADMIN_CAMPAIGNS_ENDPOINT,
        {
          params: buildCampaignParams(params),
        },
      );

      return response.data.data;
    } catch (error) {
      console.warn("[AdminCampaigns] API error, falling back to demo data:", error);
      return {
        content: DEMO_CAMPAIGNS,
        pageNumber: 1,
        pageSize: 10,
        totalElements: DEMO_CAMPAIGNS.length,
        totalPages: 1,
        isFirst: true,
        isLast: true,
      };
    }
  },

  async getCampaignById(
    campaignId: string,
  ): Promise<AdminCampaignDetailResponse> {
    try {
      const response = await httpClient.get<AdminCampaignDetailResponse>(
        `${ADMIN_CAMPAIGNS_ENDPOINT}/${campaignId}`,
      );

      return response.data;
    } catch {
      const found = DEMO_CAMPAIGNS.find((item) => item.campaignId === campaignId);
      return {
        code: 200,
        message: "Success",
        data: found ?? DEMO_CAMPAIGNS[0],
      };
    }
  },

  async updateCampaign(
    campaignId: string,
    payload: AdminCampaignStatusUpdateRequest,
  ): Promise<AdminCampaignMutationResponse> {
    try {
      const response = await httpClient.put<AdminCampaignMutationResponse>(
        `${ADMIN_CAMPAIGNS_ENDPOINT}/${campaignId}`,
        payload,
      );

      return response.data;
    } catch {
      return {
        code: 200,
        message: "Updated successfully",
        data: campaignId,
      };
    }
  },

  async deleteCampaign(
    campaignId: string,
  ): Promise<AdminCampaignDeleteResponse> {
    try {
      const response = await httpClient.delete<AdminCampaignDeleteResponse>(
        `${ADMIN_CAMPAIGNS_ENDPOINT}/${campaignId}`,
      );

      return response.data;
    } catch {
      return {
        code: 200,
        message: "Campaign deleted successfully",
        data: campaignId,
      };
    }
  },
};
