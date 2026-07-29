import { httpClient, unwrapBaseResponse } from "@/shared/api/http-client";
import type {
  HomeFeedRequest,
  HomeFeedResponse,
} from "../types/home-feed.types";

export const DEFAULT_HOME_FEED_LIMITS: Required<HomeFeedRequest> = {
  promotedLimit: 6,
  trendingLimit: 12,
  newReleasesLimit: 14,
  recentlyUpdatedLimit: 14,
  latestCommunityChoiceLimit: 12,
  communityChoiceLimit: 12,
  randomCategoryLimit: 12,
  subscriptionLimit: 12,
};

export async function getHomeFeed(params: HomeFeedRequest = DEFAULT_HOME_FEED_LIMITS) {
  return unwrapBaseResponse<HomeFeedResponse>(
    httpClient.get("/api/v1/recommendations/home-feed", { params }),
  );
}
