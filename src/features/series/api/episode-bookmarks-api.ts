import {
  httpClient,
  unwrapBaseResponse,
} from "@/shared/api/http-client";

export type BaseSliceResponse<T> = {
  content: T[];
  number: number;
  size: number;
  numberOfElements: number;
  first: boolean;
  last: boolean;
  empty: boolean;
};

export type BookmarkedUser = {
  accountId: string;
  username: string;
  avatarUrl?: string;
  bookmarkedAt?: string;
};

export type AccountBookmarkResponse = {
  episodeId: string;
  episodeTitle: string;
  episodeNumber: number;
  seriesId?: string;
  seriesTitle: string;
  seriesCoverUrl?: string;
  bookmarkedAt: string;
};

// 1. POST /api/v1/episodes/{episodeId}/bookmark - Bookmark tập phim/truyện
export async function bookmarkEpisode(episodeId: string) {
  return unwrapBaseResponse<{ code: number; message: string; data: any }>(
    httpClient.post(`/api/v1/episodes/${episodeId}/bookmark`)
  );
}

// 2. DELETE /api/v1/episodes/{episodeId}/bookmark - Hủy Bookmark tập phim/truyện
export async function unbookmarkEpisode(episodeId: string) {
  return unwrapBaseResponse<{ code: number; message: string; data: any }>(
    httpClient.delete(`/api/v1/episodes/${episodeId}/bookmark`)
  );
}

// 3. GET /api/v1/episodes/{episodeId}/bookmarks - Lấy danh sách người dùng đã Bookmark tập phim này
export async function getEpisodeBookmarks(
  episodeId: string,
  page = 0,
  size = 10,
  sort = ["createdAt,DESC"]
) {
  return unwrapBaseResponse<BaseSliceResponse<BookmarkedUser>>(
    httpClient.get(`/api/v1/episodes/${episodeId}/bookmarks`, {
      params: { page, size, sort },
    })
  );
}

// 4. GET /api/v1/bookmarks/me - Lấy danh sách các tập phim/truyện mà tài khoản hiện tại đã Bookmark
export async function getMyBookmarkedEpisodes(
  page = 0,
  size = 10,
  sort = ["createdAt,DESC"]
) {
  return unwrapBaseResponse<BaseSliceResponse<AccountBookmarkResponse>>(
    httpClient.get("/api/v1/bookmarks/me", {
      params: { page, size, sort },
    })
  );
}
