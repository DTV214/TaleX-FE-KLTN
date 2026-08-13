import { httpClient, unwrapBaseResponse } from "@/shared/api/http-client";
import type {
  HomeFeedRequest,
  HomeFeedResponse,
  HomeFeedSeries,
  RecommendationFeedRequest,
} from "../types/home-feed.types";

export const DEFAULT_HOME_FEED_LIMITS: Required<HomeFeedRequest> = {
  promotedLimit: 6,
  trendingLimit: 10,
  newReleasesLimit: 10,
  recentlyUpdatedLimit: 10,
  latestCommunityChoiceLimit: 10,
  communityChoiceLimit: 10,
  randomCategoryLimit: 10,
  subscriptionLimit: 10,
};

export async function getHomeFeed(params: HomeFeedRequest = DEFAULT_HOME_FEED_LIMITS) {
  return unwrapBaseResponse<HomeFeedResponse>(
    httpClient.get("/api/v1/recommendations/home-feed", { params }),
  );
}

export function generateFreshSessionId(prefix = "sess"): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

export function getOrCreateSessionId(): string {
  if (typeof window === "undefined") return "server-session";
  let sessionId = sessionStorage.getItem("talex_recommendations_session_id");
  if (!sessionId) {
    sessionId = generateFreshSessionId("sess");
    sessionStorage.setItem("talex_recommendations_session_id", sessionId);
  }
  return sessionId;
}

export async function getRecommendationFeed(
  params: Partial<RecommendationFeedRequest> = {},
) {
  const sessionId = params.sessionId || getOrCreateSessionId();
  const queryParams = {
    sessionId,
    pageType: params.pageType || "HOME",
    limit: params.limit ?? 12,
    ...(params.offset !== undefined ? { offset: params.offset } : {}),
  };

  return unwrapBaseResponse<
    HomeFeedSeries[] | { items?: HomeFeedSeries[]; content?: HomeFeedSeries[]; data?: HomeFeedSeries[] }
  >(httpClient.get("/api/v1/recommendations/feed", { params: queryParams }));
}

