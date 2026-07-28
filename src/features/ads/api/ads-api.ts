import { httpClient as api } from "@/shared/api/http-client";

export interface AdLabel {
  labelId: string;
  name: string;
  color: string;
  profileId: string;
}

export interface AdvertiseProfile {
  profileId: string;
  accountId: string;
  walletBalance: number;
  billingInfo: string;
  companyName: string;
  phone: string;
  website: string;
  isSetupCompleted: boolean;
}

export interface AdProfileSetup {
  companyName: string;
  phone: string;
  website?: string;
}

export interface AdCampaignCreate {
  slotId: string;
  name: string;
  targetImpressions: number;
  campaignBudget: number;
  mediaType: "IMAGE" | "VIDEO" | "HTML";
  mediaUrl: string;
  targetUrl: string;
  labels?: string[];
}

export interface AdSlot {
  slotId: string;
  codeName: string;
  displayName: string;
  type: "BANNER" | "VIDEO" | "POPUP";
  price: number;
  totalViewOfPrice: number;
  isActive: boolean;
}

export interface AdServeResponse {
  campaignId: string;
  mediaUrl: string;
  targetUrl: string;
  mediaType: "IMAGE" | "VIDEO" | "HTML";
}

export interface AdTrackRequest {
  campaignId: string;
}

export const adsApi = {
  getWalletBalance: () =>
    api.get<{ data: AdvertiseProfile }>("/api/v1/ads/wallet/balance").then((res) => res.data.data),
    
  topupWallet: async (amount: number) => {
    const res = await api.post("/api/v1/ads/wallet/topup", { amount });
    return res.data?.data;
  },

  setupProfile: async (data: AdProfileSetup) => {
    const res = await api.post("/api/v1/ads/campaigns/profile/setup", data);
    return res.data?.data;
  },

  getCampaignMetrics: (campaignId: string) =>
    api.get(`/api/v1/ads/campaigns/${campaignId}/metrics`).then((res) => res.data.data),

  getCampaignTransactions: (campaignId: string) =>
    api.get(`/api/v1/ads/campaigns/${campaignId}/transactions`).then((res) => res.data.data),

  createCampaign: (data: AdCampaignCreate) =>
    api.post("/api/v1/ads/campaigns", data).then((res) => res.data.data),

  getMyCampaigns: () =>
    api.get("/api/v1/ads/campaigns").then((res) => res.data.data),

  getAllSlots: () =>
    api.get<{ data: AdSlot[] }>("/api/v1/ads/slots").then((res) => res.data.data),

  uploadMedia: (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return api.post("/api/v1/ads/campaigns/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }).then((res) => res.data.data as string);
  },

  serveAd: (slotCode: string) =>
    api.get<{ data: AdServeResponse }>(`/api/v1/ads/serve?slotCode=${slotCode}`).then((res) => res.data.data),

  serveAllAds: (slotCode: string) =>
    api.get<{ data: AdServeResponse[] }>(`/api/v1/ads/serve/all?slotCode=${slotCode}`).then((res) => res.data.data),

  trackImpression: (campaignId: string) =>
    api.post("/api/v1/ads/track/impression", { campaignId }),

  trackClick: (campaignId: string) =>
    api.post("/api/v1/ads/track/click", { campaignId }),

  getLabels: () =>
    api.get<{ data: AdLabel[] }>("/api/v1/ads/labels").then((res) => res.data.data),

  createLabel: (data: { name: string; color: string }) =>
    api.post<{ data: AdLabel }>("/api/v1/ads/labels", data).then((res) => res.data.data),

  updateLabel: (labelId: string, data: { name: string; color: string }) =>
    api.put<{ data: AdLabel }>(`/api/v1/ads/labels/${labelId}`, data).then((res) => res.data.data),

  deleteLabel: (labelId: string) =>
    api.delete(`/api/v1/ads/labels/${labelId}`).then((res) => res.data.data),

  updateCampaignLabels: async (campaignId: string, labels: string[]) => {
    const res = await api.patch(`/api/v1/ads/campaigns/${campaignId}/labels`, labels);
    return res.data?.data;
  },
  getWalletTransactions: () =>
    api.get("/api/v1/ads/wallet/transactions").then((res) => res.data.data),
};
