import axios from "axios";
import { API_BASE_URL } from "@/core/config/api";

export type BaseResponse<T> = {
  code: number;
  message: string;
  data: T;
};

export type BasePageResponse<T> = {
  content: T[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  isFirst: boolean;
  isLast: boolean;
};

export const httpClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

export function getApiErrorMessage(error: unknown) {
  if (axios.isAxiosError<BaseResponse<unknown>>(error)) {
    return error.response?.data?.message || error.message;
  }

  return error instanceof Error ? error.message : "Request failed.";
}

export async function unwrapBaseResponse<T>(
  promise: Promise<{ data: BaseResponse<T> }>,
) {
  try {
    const response = await promise;
    return response.data.data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error));
  }
}
