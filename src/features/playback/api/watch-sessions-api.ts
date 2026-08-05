import { httpClient, unwrapBaseResponse } from "@/shared/api/http-client";
import type { BaseSliceResponse } from "@/features/series/api/episode-likes-api";

export type AnalyticData = {
  likes: number;
  views: number;
  comments: number;
  shares: number;
  bookmarks: number;
  watchTime: number;
};

export type WatchSessionEpisode = {
  episodeId: string;
  seasonId: string;
  seriesId: string;
  creatorId: string;
  episodeNumber: number;
  title: string;
  description: string | null;
  thumbnail: string | null;
  contentType: "VIDEO" | "COMIC";
  status: string;
  scheduledPublishAt: string | null;
  publishedAt: string;
  unlockType: string;
  priceVnd: number;
  analyticData: AnalyticData;
  totalPage: number | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  isDeleted: boolean;
};

export type WatchSessionItem = {
  id: string;
  episode: WatchSessionEpisode;
  watchDuration: number;
  heartbeatCount: number;
  startTime: string;
  endTime: string;
  currentPosition: number;
  updatedAt: string;
};

/**
 * GET /api/v1/watch-sessions/recent
 * Lấy danh sách các phiên xem có thời gian cập nhật gần nhất của tài khoản theo dạng Slice.
 */
export async function getRecentWatchSessions(
  page = 0,
  size = 20,
  sort: string[] = []
) {
  return unwrapBaseResponse<BaseSliceResponse<WatchSessionItem>>(
    httpClient.get("/api/v1/watch-sessions/recent", {
      params: {
        page,
        size,
        ...(sort.length > 0 ? { sort } : {}),
      },
    })
  );
}

/**
 * Lấy phiên xem gần nhất của một tập phim cụ thể
 */
export async function getEpisodeWatchPosition(episodeId: string): Promise<number | null> {
  try {
    const res = await getRecentWatchSessions(0, 50);
    const session = res.content.find((item) => item.episode?.episodeId === episodeId);
    return session ? session.currentPosition : null;
  } catch {
    return null;
  }
}

