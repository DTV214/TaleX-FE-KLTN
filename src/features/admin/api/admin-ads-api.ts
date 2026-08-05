import { httpClient as api } from "@/shared/api/http-client";
import { AdSlot } from "@/features/ads/api/ads-api";

export interface AdCampaignAdmin {
  campaignId: string;
  name: string;
  status: string;
  targetImpressions: number;
  totalBudget: number;
  createdAt: string;
  profileId: string;
  creatives: any[];
}

export const adminAdsApi = {
  getAllSlots: () =>
    api.get<{ data: AdSlot[] }>("/api/v1/ads/admin/slots").then((res) => res.data.data),

  getPendingCampaigns: () =>
    api.get<{ data: AdCampaignAdmin[] }>("/api/v1/ads/admin/campaigns/pending").then((res) => res.data.data),

  getAllCampaigns: () =>
    api.get<{ data: AdCampaignAdmin[] }>("/api/v1/ads/admin/campaigns").then((res) => res.data.data),

  patchCampaignStatus: (campaignId: string, status: string) =>
    api.patch(`/api/v1/ads/admin/campaigns/${campaignId}/status?status=${status}`).then((res) => res.data.data),

  reviewCampaign: (campaignId: string, status: "ACTIVE" | "REJECTED", adminNote?: string) =>
    api.post(`/api/v1/ads/admin/campaigns/${campaignId}/review`, { status, adminNote }).then((res) => res.data.data),

  createSlot: (data: Partial<AdSlot>) =>
    api.post("/api/v1/ads/admin/slots", data).then((res) => res.data.data),

  updateSlot: (slotId: string, data: Partial<AdSlot>) =>
    api.put(`/api/v1/ads/admin/slots/${slotId}`, data).then((res) => res.data.data),

  patchSlotStatus: (slotId: string, isActive: boolean) =>
    api.patch(`/api/v1/ads/admin/slots/${slotId}/status?isActive=${isActive}`).then((res) => res.data.data),
};
