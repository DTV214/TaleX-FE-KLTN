import { useEffect, useState } from "react";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import {
  DEFAULT_HOME_FEED_LIMITS,
  generateFreshSessionId,
  getHomeFeed,
  getOrCreateSessionId,
  getRecommendationFeed,
} from "../api/home-feed.api";
import type { HomeFeedRequest, HomeFeedSeries } from "../types/home-feed.types";

export const HOME_FEED_QUERY_KEY = ["recommendations", "home-feed"] as const;
export const RECOMMENDATION_FEED_QUERY_KEY = ["recommendations", "feed"] as const;

export function useHomeFeed(params: HomeFeedRequest = DEFAULT_HOME_FEED_LIMITS) {
  return useQuery({
    queryKey: [...HOME_FEED_QUERY_KEY, params],
    queryFn: () => getHomeFeed(params),
    placeholderData: (previousData) => previousData,
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: false,
  });
}

export function useRecommendationFeedInfinite(
  limit = 12,
  pageType = "HOME",
  options?: { forceNewSessionOnMount?: boolean },
) {
  // Synchronously initialize sessionId on 1st render so it never starts as empty string
  const [sessionId] = useState<string>(() => {
    if (typeof window === "undefined") return "server-session";
    const forceNew = options?.forceNewSessionOnMount ?? true;
    if (forceNew) {
      return generateFreshSessionId(`sess_${pageType.toLowerCase()}`);
    }
    return getOrCreateSessionId();
  });

  return useInfiniteQuery({
    queryKey: [...RECOMMENDATION_FEED_QUERY_KEY, sessionId, pageType, limit],
    queryFn: async ({ pageParam = 0 }) => {
      const rawData = await getRecommendationFeed({
        sessionId,
        pageType,
        limit,
        offset: pageParam as number,
      });

      let items: HomeFeedSeries[] = [];
      if (Array.isArray(rawData)) {
        items = rawData;
      } else if (rawData && typeof rawData === "object") {
        if ("content" in rawData && Array.isArray(rawData.content)) {
          items = rawData.content;
        } else if ("items" in rawData && Array.isArray(rawData.items)) {
          items = rawData.items;
        } else if ("data" in rawData && Array.isArray(rawData.data)) {
          items = rawData.data;
        } else if ("series" in rawData && Array.isArray((rawData as any).series)) {
          items = (rawData as any).series;
        } else if ("results" in rawData && Array.isArray((rawData as any).results)) {
          items = (rawData as any).results;
        } else if ("list" in rawData && Array.isArray((rawData as any).list)) {
          items = (rawData as any).list;
        }
      }

      return {
        items,
        nextOffset: items.length > 0 ? (pageParam as number) + (items.length >= limit ? limit : items.length) : undefined,
      };
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextOffset,
    enabled: Boolean(sessionId),
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: false,
  });
}

