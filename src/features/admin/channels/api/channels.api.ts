import axios from "axios";
import { httpClient, unwrapBaseResponse, type BaseResponse } from "@/shared/api/http-client";
import { AI_RECOMMENDATION_API_URL } from "@/core/config/api";
import type {
  ChannelKey,
  ChannelSeriesCard,
  MongoUserDynamicFeatures,
  MongoUserFeatures,
  RecommendationPoolItem,
  TrainInitResponse,
  RankCandidatesRequest,
  RankCandidatesResponse,
  SeriesFeatureData,
} from "../types/channels.types";
import { getAdminAccounts, type AdminAccountItem } from "@/features/admin/api/account.api";

/**
 * Robust response extractor:
 * Handles direct array `ChannelSeriesCard[]`,
 * wrapped `{ code, message, data: ChannelSeriesCard[] }`,
 * paginated `{ content: ChannelSeriesCard[] }`, or `{ data: { content: ChannelSeriesCard[] } }`.
 */
async function safeFetchCards(url: string, params?: Record<string, unknown>): Promise<ChannelSeriesCard[]> {
  const response = await httpClient.get(url, { params });
  const body = response.data;

  if (Array.isArray(body)) {
    return body;
  }
  if (Array.isArray(body?.data)) {
    return body.data;
  }
  if (Array.isArray(body?.content)) {
    return body.content;
  }
  if (Array.isArray(body?.data?.content)) {
    return body.data.content;
  }
  return [];
}

export const adminChannelsApi = {
  // POST /api/v1/channels/pool - Kích hoạt tiến trình tạo pool cho các series
  async triggerChannelsPool() {
    return unwrapBaseResponse(
      httpClient.post("/api/v1/channels/pool")
    );
  },

  // 1. Promoted Channel
  getPromotedCards(): Promise<ChannelSeriesCard[]> {
    return safeFetchCards("/api/v1/channels/promoted/cards");
  },

  // 2. New Releases Channel
  getNewReleasesCards(): Promise<ChannelSeriesCard[]> {
    return safeFetchCards("/api/v1/channels/new-releases/cards");
  },

  // 3. Recently Updated Channel
  getRecentlyUpdatedCards(): Promise<ChannelSeriesCard[]> {
    return safeFetchCards("/api/v1/channels/recently-updated/cards");
  },

  // 4. Latest Community Choice Channel
  getLatestCommunityChoiceCards(): Promise<ChannelSeriesCard[]> {
    return safeFetchCards("/api/v1/channels/latest-community-choice/cards");
  },

  // 5. Community Choice All-Time Channel
  getCommunityChoiceCards(): Promise<ChannelSeriesCard[]> {
    return safeFetchCards("/api/v1/channels/community-choice/cards");
  },

  // 6. Random Category Channel
  getRandomCategoryCards(): Promise<ChannelSeriesCard[]> {
    return safeFetchCards("/api/v1/channels/random-category/cards");
  },

  // 7. Trending Channel
  getTrendingCards(): Promise<ChannelSeriesCard[]> {
    return safeFetchCards("/api/v1/channels/trending/cards");
  },

  // Helper dispatcher method by key
  getChannelCards(key: ChannelKey): Promise<ChannelSeriesCard[]> {
    switch (key) {
      case "promoted":
        return this.getPromotedCards();
      case "new-releases":
        return this.getNewReleasesCards();
      case "recently-updated":
        return this.getRecentlyUpdatedCards();
      case "latest-community-choice":
        return this.getLatestCommunityChoiceCards();
      case "community-choice":
        return this.getCommunityChoiceCards();
      case "random-category":
        return this.getRandomCategoryCards();
      case "trending":
        return this.getTrendingCards();
      default:
        return Promise.resolve([]);
    }
  },

  // 8. Get admin accounts list for dropdown (GET /api/v1/admin/accounts)
  async getAdminAccountsList(): Promise<AdminAccountItem[]> {
    try {
      const pageRes = await getAdminAccounts({ size: 100 });
      if (pageRes && Array.isArray(pageRes.content) && pageRes.content.length > 0) {
        return pageRes.content;
      }
    } catch {
      // Fallback manual extract
    }
    const response = await httpClient.get("/api/v1/admin/accounts", {
      params: { size: 100 },
    });
    const body = response.data;
    const rawList: Record<string, unknown>[] = Array.isArray(body)
      ? body
      : Array.isArray(body?.data)
      ? body.data
      : Array.isArray(body?.content)
      ? body.content
      : Array.isArray(body?.data?.content)
      ? body.data.content
      : [];

    return rawList.map((item) => ({
      accountId: String(item.accountId || item.id || ""),
      email: String(item.email || ""),
      username: String(item.username || ""),
      fullName: String(item.fullName || item.name || item.username || "User"),
      avatarUrl: item.avatarUrl ? String(item.avatarUrl) : undefined,
      roleName: (item.roleName || item.role || "VIEWER") as AdminAccountItem["roleName"],
      status: (item.status || "ACTIVE") as AdminAccountItem["status"],
      createdAt: String(item.createdAt || ""),
    }));
  },

  // 9. Get recent watched series for account (GET /api/v1/recommendations/recent-series?accountId=...)
  async getRecentSeriesByAccount(accountId: string): Promise<ChannelSeriesCard[]> {
    return safeFetchCards("/api/v1/recommendations/recent-series", { accountId });
  },

  // 10. Get similar series recommendations (GET /api/v1/recommendations/similar?seriesId=...)
  async getSimilarSeries(seriesId: string): Promise<ChannelSeriesCard[]> {
    return safeFetchCards("/api/v1/recommendations/similar", { seriesId });
  },

  // 11. Get recommendation pool with scores (GET /api/v1/recommendations/pools/recommendation?accountId=...)
  async getRecommendationPoolByAccount(accountId: string): Promise<RecommendationPoolItem[]> {
    const response = await httpClient.get("/api/v1/recommendations/pools/recommendation", {
      params: { accountId },
    });
    const body = response.data;

    if (Array.isArray(body)) return body;
    if (Array.isArray(body?.data)) return body.data;
    if (Array.isArray(body?.content)) return body.content;
    if (Array.isArray(body?.data?.content)) return body.data.content;
    return [];
  },

  // 12. Get already watched pool for account (GET /api/v1/recommendations/pools/already-watched?accountId=...)
  async getAlreadyWatchedPoolByAccount(accountId: string): Promise<ChannelSeriesCard[]> {
    return safeFetchCards("/api/v1/recommendations/pools/already-watched", { accountId });
  },

  // 13. Get MongoDB User Features Profile (GET /api/v1/mongo/features/user/{accountId})
  async getMongoUserFeatures(accountId: string): Promise<MongoUserFeatures | null> {
    try {
      const res = await httpClient.get(`/api/v1/mongo/features/user/${accountId}`);
      const body = res.data;
      const data = (body && typeof body === "object" && "data" in body) ? body.data : body;
      if (data && typeof data === "object") {
        return data as MongoUserFeatures;
      }
    } catch {
      // Path param failed, fallback to query param
    }

    const response = await httpClient.get("/api/v1/mongo/features/user", {
      params: { accountId, userId: accountId },
    });
    const body = response.data;
    if (body && typeof body === "object") {
      if ("data" in body && body.data) return body.data as MongoUserFeatures;
      if ("accountId" in body) return body as MongoUserFeatures;
    }
    return null;
  },

  // 14. Get MongoDB User Dynamic Features Profile (GET /api/v1/mongo/features/user/{accountId}/dynamic)
  async getMongoUserDynamicFeatures(accountId: string): Promise<MongoUserDynamicFeatures | null> {
    try {
      const res = await httpClient.get(`/api/v1/mongo/features/user/${accountId}/dynamic`);
      const body = res.data;
      const data = (body && typeof body === "object" && "data" in body) ? body.data : body;
      if (data && typeof data === "object") {
        return data as MongoUserDynamicFeatures;
      }
    } catch {
      // Fallback query param
    }

    try {
      const res = await httpClient.get("/api/v1/mongo/features/user/dynamic", {
        params: { accountId, userId: accountId },
      });
      const body = res.data;
      const data = (body && typeof body === "object" && "data" in body) ? body.data : body;
      if (data && typeof data === "object") {
        return data as MongoUserDynamicFeatures;
      }
    } catch {
      // Ignore fallback error
    }

    return null;
  },

  // 15. Trigger Train Init (POST /api/v1/recommendations/model/train-init)
  async trainInit(): Promise<TrainInitResponse> {
    const response = await httpClient.post<BaseResponse<TrainInitResponse>>(
      "/api/v1/recommendations/model/train-init"
    );
    const body = response.data;
    if (body && typeof body === "object" && "data" in body && body.data) {
      return body.data;
    }
    return body as unknown as TrainInitResponse;
  },

  // 16. Trigger Train Init Real (POST /api/v1/recommendations/model/train-init-real?maxSamples=...)
  async trainInitReal(maxSamples: number = 10000): Promise<TrainInitResponse> {
    const response = await httpClient.post<BaseResponse<TrainInitResponse>>(
      "/api/v1/recommendations/model/train-init-real",
      null,
      {
        params: { maxSamples },
      }
    );
    const body = response.data;
    if (body && typeof body === "object" && "data" in body && body.data) {
      return body.data;
    }
    return body as unknown as TrainInitResponse;
  },

  // 17. Rank Candidates (POST /api/v1/recommendations/rank)
  async rankCandidates(payload: RankCandidatesRequest): Promise<RankCandidatesResponse> {
    const response = await recommendationBrainClient.post(
      getBrainUrl("/recommendations/rank"),
      payload
    );
    return response.data?.data || response.data;
  },

  // 18. Download train data Excel file (GET /api/v1/recommendations/model/train-data/download)
  async downloadTrainData(): Promise<Blob> {
    const response = await httpClient.get(
      "/api/v1/recommendations/model/train-data/download",
      {
        responseType: "blob",
      }
    );
    return response.data;
  },

  // 19. Get Series Feature by Series ID (GET /api/v1/series-features/{seriesId})
  async getSeriesFeatureById(seriesId: string): Promise<SeriesFeatureData> {
    const response = await httpClient.get<BaseResponse<SeriesFeatureData>>(
      `/api/v1/series-features/${seriesId}`
    );
    const body = response.data;
    if (body && typeof body === "object" && "data" in body && body.data) {
      return body.data;
    }
    return body as unknown as SeriesFeatureData;
  },
};

const recommendationBrainClient = axios.create({
  withCredentials: true,
});

function getBrainUrl(endpoint: string): string {
  const base = AI_RECOMMENDATION_API_URL.replace(/\/$/, "");
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;

  if (base.endsWith("/api/v1") && cleanEndpoint.startsWith("/api/v1")) {
    return `${base}${cleanEndpoint.substring(7)}`;
  }
  if (!base.endsWith("/api/v1") && !cleanEndpoint.startsWith("/api/v1")) {
    return `${base}/api/v1${cleanEndpoint}`;
  }
  return `${base}${cleanEndpoint}`;
}


