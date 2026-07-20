import {
  httpClient,
  unwrapBaseResponse,
} from "@/shared/api/http-client";
import type { BaseSliceResponse } from "@/features/series/api/episode-likes-api";

export type CommentDto = {
  commentId: string;
  episodeId?: string;
  commentParentId?: string | null;
  accountId?: string;
  username?: string;
  displayName?: string;
  avatarUrl?: string | null;
  content: string;
  replyCount?: number;
  status?: "ACTIVE" | "HIDDEN" | "DELETED" | string;
  createdAt?: string;
  updatedAt?: string;
  isOwner?: boolean;
};

export type CreateCommentPayload = {
  content: string;
  episodeId: string;
  commentParentId?: string;
};

export type UpdateCommentPayload = {
  content: string;
};

// 1. GET /api/v1/episodes/{episodeId}/comments - Lấy danh sách bình luận gốc
export async function getEpisodeComments(
  episodeId: string,
  page = 0,
  size = 10,
  sort = "createdAt,DESC"
) {
  return unwrapBaseResponse<BaseSliceResponse<CommentDto>>(
    httpClient.get(`/api/v1/episodes/${episodeId}/comments`, {
      params: { page, size, sort },
    })
  );
}

// 2. GET /api/v1/comments/{commentId}/replies - Lấy danh sách phản hồi
export async function getCommentReplies(
  commentId: string,
  page = 0,
  size = 10,
  sort = "createdAt,ASC"
) {
  return unwrapBaseResponse<BaseSliceResponse<CommentDto>>(
    httpClient.get(`/api/v1/comments/${commentId}/replies`, {
      params: { page, size, sort },
    })
  );
}

// 3. POST /api/v1/comments - Ghi nhận bình luận (gốc hoặc phản hồi)
export async function createComment(payload: CreateCommentPayload) {
  return unwrapBaseResponse<any>(
    httpClient.post("/api/v1/comments", payload)
  );
}

// 4. PUT /api/v1/comments/{commentId} - Chỉnh sửa bình luận
export async function updateComment(commentId: string, content: string) {
  return unwrapBaseResponse<any>(
    httpClient.put(`/api/v1/comments/${commentId}`, { content })
  );
}

// 5. DELETE /api/v1/comments/{commentId} - Xóa bình luận
export async function deleteComment(commentId: string) {
  return unwrapBaseResponse<any>(
    httpClient.delete(`/api/v1/comments/${commentId}`)
  );
}

// 6. PATCH /api/v1/comments/{commentId} - Ẩn bình luận
export async function hideComment(commentId: string) {
  return unwrapBaseResponse<any>(
    httpClient.patch(`/api/v1/comments/${commentId}`)
  );
}
