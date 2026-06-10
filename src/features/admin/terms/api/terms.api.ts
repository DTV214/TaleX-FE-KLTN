
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
   * Lấy danh sách Điều khoản (hỗ trợ phân trang và filter linh động)
   */
  getTermsVersions: async (
    params?: TermsFilterParams,
  ): Promise<ApiResponse<PaginatedData<TermsVersion>>> => {
    const response = await httpClient.get<
      ApiResponse<PaginatedData<TermsVersion>>
    >(BASE_URL, {
      params,
      // Cấu hình paramsSerializer nếu BE cần mảng 'types' format dạng types=CREATOR&types=GENERAL_TOS
      // paramsSerializer: { indexes: null } // (Bật lên nếu bạn dùng axios ^1.x và API BE không nhận mảng)
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
   * Cập nhật Điều khoản (Chỉ gửi những trường cần update)
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
