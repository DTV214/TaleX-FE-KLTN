import {
  httpClient,
  unwrapBaseResponse,
} from "@/shared/api/http-client";

// 1. POST /api/v1/episodes/shares - Ghi nhận lượt chia sẻ Tập phim/truyện
export async function shareEpisode(episodeId: string) {
  return unwrapBaseResponse<{ code: number; message: string; data: any }>(
    httpClient.post("/api/v1/episodes/shares", { episodeId })
  );
}
