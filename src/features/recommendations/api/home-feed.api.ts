import { httpClient, unwrapBaseResponse } from "@/shared/api/http-client";
import type {
  HomeFeedRequest,
  HomeFeedResponse,
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
