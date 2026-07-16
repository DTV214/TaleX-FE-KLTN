import {
  httpClient,
  unwrapBaseResponse,
} from "@/shared/api/http-client";
import type { BaseSliceResponse } from "./episode-likes-api";

export type FollowRequest = {
  followedId: string; // Account ID of the creator to follow
};

export type AccountFollowInfoDto = {
  accountId: string;
  username: string;
  avatarUrl: string | null;
  followedAt: string;
};

// 1. POST /api/v1/follows - Theo dõi tài khoản
export async function followCreator(followedId: string) {
  return unwrapBaseResponse<{ code: number; message: string; data: any }>(
    httpClient.post("/api/v1/follows", { followedId })
  );
}

// 2. DELETE /api/v1/follows - Hủy theo dõi tài khoản
export async function unfollowCreator(followedId: string) {
  return unwrapBaseResponse<{ code: number; message: string; data: any }>(
    httpClient.delete("/api/v1/follows", {
      data: { followedId },
    })
  );
}

// 3. GET /api/v1/follows/followers - Lấy danh sách người theo dõi
export async function getFollowers(page = 0, size = 20) {
  return unwrapBaseResponse<BaseSliceResponse<AccountFollowInfoDto>>(
    httpClient.get("/api/v1/follows/followers", {
      params: { page, size },
    })
  );
}

// 4. GET /api/v1/follows/followed - Lấy danh sách đang theo dõi
export async function getFollowedCreators(page = 0, size = 20) {
  return unwrapBaseResponse<BaseSliceResponse<AccountFollowInfoDto>>(
    httpClient.get("/api/v1/follows/followed", {
      params: { page, size },
    })
  );
}

// 5. GET /api/v1/creators/{id} - Lấy chi tiết creator
export async function getCreatorDetail(creatorId: string) {
  return unwrapBaseResponse<any>(
    httpClient.get(`/api/v1/creators/${creatorId}`)
  );
}
