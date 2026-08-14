import { httpClient as api } from "@/shared/api/http-client";

export interface AdCreative {
  creativeId: string;
  mediaType: string;
  mediaUrl: string;
  targetUrl: string;
}

export interface AdCampaign {
  campaignId: string;
  profileId: string;
  slotId: string;
  slotCodeName: string;
  slotType?: string;
  name: string;
  targetImpressions: number;
  spentImpressions: number;
  campaignBudget: number;
  spentBudget: number;
  status: "PENDING" | "RUNNING" | "PAUSED" | "COMPLETED" | "CANCELLED";
  startDate?: string;
  endDate?: string;
  createdAt: string;
  labels?: string[];
  creatives?: AdCreative[];
}

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
  startDate?: string;
  endDate?: string;
}

export interface AdSlot {
  slotId: string;
  codeName: string;
  displayName: string;
  type: "BANNER" | "VIDEO" | "POPUP";
  price: number;
  totalViewOfPrice: number;
  isActive: boolean;
  isServingEnabled: boolean;
}

export interface InVideoConfig {
  skipAfterSec: number;
  cooldownSeconds: number;
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

export interface PopupConfig {
  allowedRoutes: string[];
  showDelayMs: number;
  cooldownMinutes: number;
}

export interface AdMetricResponse {
  reportDate: string;
  impressions: number;
  clicks: number;
  focusedViews6s: number;
  paidFocusedViews6s: number;
  spend: number;
  ctr: number;
}

export const adsApi = {
  // ... other methods ...
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
    api.get<{ data: AdMetricResponse[] }>(`/api/v1/ads/campaigns/${campaignId}/metrics`).then((res) => res.data.data),

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

  track6sView: (campaignId: string) =>
    api.post("/api/v1/ads/track/view-6s", { campaignId }),

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

  toggleCampaign: (campaignId: string) =>
    api.patch(`/api/v1/ads/campaigns/${campaignId}/toggle`).then((res) => res.data),

  cancelCampaign: (campaignId: string) =>
    api.post(`/api/v1/ads/campaigns/${campaignId}/cancel`).then((res) => res.data),

  updateCampaignSchedule: (campaignId: string, data: { startDate?: string, endDate?: string }) =>
    api.patch(`/api/v1/ads/campaigns/${campaignId}/schedule`, data).then((res) => res.data),

  cloneCampaign: (data: { campaignId: string, campaignBudget: number, targetImpressions: number, startDate?: string, endDate?: string }) =>
    api.post(`/api/v1/ads/campaigns/${data.campaignId}/clone`, { 
      campaignBudget: data.campaignBudget, 
      targetImpressions: data.targetImpressions,
      startDate: data.startDate,
      endDate: data.endDate
    }).then((res) => res.data),

  renameCampaign: (campaignId: string, name: string) =>
    api.patch(`/api/v1/ads/campaigns/${campaignId}/name`, { name }).then((res) => res.data),

  bulkCancelCampaigns: (campaignIds: string[]) =>
    api.post(`/api/v1/ads/campaigns/bulk-cancel`, { campaignIds }).then((res) => res.data),
  // ---- System Config ----
  /** Lấy cấu hình Popup (public, FE dùng khi load) */
  getPopupConfig: (): Promise<PopupConfig> =>
    api.get<{ data: PopupConfig }>("/api/v1/ads/config/popup").then((res) => res.data.data),

  /** Admin cập nhật cấu hình Popup */
  updatePopupConfig: (config: PopupConfig): Promise<PopupConfig> =>
    api.put<{ data: PopupConfig }>("/api/v1/ads/config/popup", config).then((res) => res.data.data),

  /** Lấy cấu hình In-Video (public) */
  getInVideoConfig: (): Promise<InVideoConfig> =>
    api.get<{ data: InVideoConfig }>("/api/v1/ads/config/in-video").then((res) => res.data.data),

  /** Admin cập nhật cấu hình In-Video */
  updateInVideoConfig: (config: InVideoConfig): Promise<InVideoConfig> =>
    api.put<{ data: InVideoConfig }>("/api/v1/ads/config/in-video", config).then((res) => res.data.data),
};
