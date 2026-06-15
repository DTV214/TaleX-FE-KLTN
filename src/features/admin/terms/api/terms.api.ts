import { httpClient } from "@/shared/api/http-client";
import {
  ApiResponse,
  PaginatedData,
  TermsVersion,
  TermsFilterParams,
  CreateTermsPayload,
  UpdateTermsPayload,
} from "../types/terms.types";

const BASE_URL = "/api/v1/terms-versions";

export const termsApi = {
  /**
   * Lấy danh sách Điều khoản từ Backend
   * Chỉ gửi đi các tham số phân trang và sắp xếp mà Swagger BE hỗ trợ.
   */
  getTermsVersions: async (
    params: TermsFilterParams,
  ): Promise<ApiResponse<PaginatedData<TermsVersion>>> => {
    // Tách các biến lọc Frontend ra, chỉ giữ lại API params cho Backend
    const apiParams = {
      page: params.page,
      pageSize: params.pageSize,
      sortBy: params.sortBy,
      sortDirection: params.sortDirection,
      types: params.types,
    };

    const response = await httpClient.get<
      ApiResponse<PaginatedData<TermsVersion>>
    >(BASE_URL, {
      params: apiParams,
      // BẮT BUỘC BẬT: Spring Boot yêu cầu mảng phải được truyền dưới dạng lặp key.
      paramsSerializer: {
        indexes: null,
      },
    });
    return response.data;
  },

  /**
   * Lấy chi tiết 1 Điều khoản theo ID
   */
  getTermsVersionById: async (
    id: string,
  ): Promise<ApiResponse<TermsVersion>> => {
    const response = await httpClient.get<ApiResponse<TermsVersion>>(
      `${BASE_URL}/${id}`,
    );
    return response.data;
  },

  /**
   * Tạo mới một Điều khoản
   */
  createTermsVersion: async (
    payload: CreateTermsPayload,
  ): Promise<ApiResponse<TermsVersion>> => {
    const response = await httpClient.post<ApiResponse<TermsVersion>>(
      BASE_URL,
      payload,
    );
    return response.data;
  },

  /**
   * Cập nhật Điều khoản
   * (Chúng ta sẽ gửi FULL payload bao gồm cả 'type' để tránh lỗi 500 NullPointerException từ BE)
   */
  updateTermsVersion: async (
    id: string,
    payload: UpdateTermsPayload,
  ): Promise<ApiResponse<TermsVersion>> => {
    const response = await httpClient.put<ApiResponse<TermsVersion>>(
      `${BASE_URL}/${id}`,
      payload,
    );
    return response.data;
  },

  /**
   * Xóa mềm một Điều khoản (chuyển isActive = false ở BE)
   */
  deleteTermsVersion: async (id: string): Promise<ApiResponse<null>> => {
    const response = await httpClient.delete<ApiResponse<null>>(
      `${BASE_URL}/${id}`,
    );
    return response.data;
  },
};
