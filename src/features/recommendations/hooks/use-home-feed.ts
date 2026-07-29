import { useQuery } from "@tanstack/react-query";
import {
  DEFAULT_HOME_FEED_LIMITS,
  getHomeFeed,
} from "../api/home-feed.api";
import type { HomeFeedRequest } from "../types/home-feed.types";

export const HOME_FEED_QUERY_KEY = ["recommendations", "home-feed"] as const;

export function useHomeFeed(params: HomeFeedRequest = DEFAULT_HOME_FEED_LIMITS) {
  return useQuery({
    queryKey: [...HOME_FEED_QUERY_KEY, params],
    queryFn: () => getHomeFeed(params),
    placeholderData: (previousData) => previousData,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
}
