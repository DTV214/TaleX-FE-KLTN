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

export type LikedUser = {
  accountId: string;
  username: string;
  avatarUrl?: string;
  likedAt?: string;
};

export type AccountLikeResponse = {
  episodeId: string;
  episodeTitle: string;
  episodeNumber: number;
  seriesTitle: string;
  seriesCoverUrl?: string;
  likedAt: string;
};

// 1. GET /api/v1/episodes/{episodeId}/likes - Lấy danh sách người đã thích (Slice)
export async function getEpisodeLikes(
  episodeId: string,
  page = 0,
  size = 20,
  sort = ["createdAt,DESC"]
) {
  return unwrapBaseResponse<BaseSliceResponse<LikedUser>>(
    httpClient.get(`/api/v1/episodes/${episodeId}/likes`, {
      params: { page, size, sort },
    })
  );
}

// 2. POST /api/v1/episodes/{episodeId}/likes - Thích tập phim
export async function likeEpisode(episodeId: string) {
  return unwrapBaseResponse<{ code: number; message: string; data: any }>(
    httpClient.post(`/api/v1/episodes/${episodeId}/likes`)
  );
}

// 3. DELETE /api/v1/episodes/{episodeId}/likes - Bỏ thích tập phim
export async function unlikeEpisode(episodeId: string) {
  return unwrapBaseResponse<{ code: number; message: string; data: any }>(
    httpClient.delete(`/api/v1/episodes/${episodeId}/likes`)
  );
}

// 4. GET /api/v1/accounts/me/likes - Lấy danh sách tập phim đã thích của user hiện tại (Slice)
export async function getMyLikedEpisodes(page = 0, size = 100) {
  return unwrapBaseResponse<BaseSliceResponse<AccountLikeResponse>>(
    httpClient.get("/api/v1/accounts/me/likes", {
      params: { page, size },
    })
  );
}

