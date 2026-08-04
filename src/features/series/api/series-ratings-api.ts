import { httpClient, type BasePageResponse, type BaseResponse } from "@/shared/api/http-client";

export interface RateSeriesRequest {
  seriesId: string;
  rate: number;
}

export interface SeriesRatingItem {
  ratingId: string;
  seriesId: string;
  accountId: string;
  accountName?: string;
  avatarUrl?: string;
  rate: number;
  updatedAt: string;
  createdAt: string;
  seriesTitle?: string;
  seriesCoverUrl?: string;
}

export interface RatingFilterParams {
  page?: number;
  size?: number;
  sort?: string;
}

/**
 * 1. POST /api/v1/series/{seriesId}/rate
 * Đánh giá hoặc Cập nhật điểm đánh giá cho Series
 */
export async function rateSeries(payload: RateSeriesRequest) {
  const response = await httpClient.post<BaseResponse<any>>(
    `/api/v1/series/${payload.seriesId}/rate`,
    payload
  );
  return response.data;
}

/**
 * 2. DELETE /api/v1/series/{seriesId}/rate
 * Xóa đánh giá của tài khoản đối với Series
 */
export async function deleteSeriesRating(seriesId: string) {
  const response = await httpClient.delete<BaseResponse<any>>(
    `/api/v1/series/${seriesId}/rate`
  );
  return response.data;
}

/**
 * 3. GET /api/v1/series/{seriesId}/ratings
 * Lấy danh sách tất cả các lượt đánh giá của một Series cụ thể
 */
export async function getSeriesRatings(seriesId: string, params?: RatingFilterParams) {
  const response = await httpClient.get<BaseResponse<BasePageResponse<SeriesRatingItem>>>(
    `/api/v1/series/${seriesId}/ratings`,
    {
      params: {
        page: params?.page ?? 0,
        size: params?.size ?? 10,
        sort: params?.sort ?? "updatedAt,DESC",
      },
    }
  );
  return response.data.data;
}

/**
 * 4. GET /api/v1/ratings/me
 * Lấy danh sách tất cả các series mà tài khoản hiện tại đã đánh giá
 */
export async function getMyRatings(params?: RatingFilterParams) {
  const response = await httpClient.get<BaseResponse<BasePageResponse<SeriesRatingItem>>>(
    `/api/v1/ratings/me`,
    {
      params: {
        page: params?.page ?? 0,
        size: params?.size ?? 10,
        sort: params?.sort ?? "updatedAt,DESC",
      },
    }
  );
  return response.data.data;
}
