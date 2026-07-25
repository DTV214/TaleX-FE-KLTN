import { httpClient as api } from "@/shared/api/http-client";

export interface AdvertiseProfile {
  profileId: string;
  accountId: string;
  walletBalance: number;
  billingInfo: string;
}

export interface AdCampaignCreate {
  slotId: string;
  name: string;
  targetImpressions: number;
  mediaType: "IMAGE" | "VIDEO" | "HTML";
  mediaUrl: string;
  targetUrl: string;
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
    
  topupWallet: (amount: number) =>
    api.post("/api/v1/ads/wallet/topup", { amount }).then((res) => res.data.data),

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
};
