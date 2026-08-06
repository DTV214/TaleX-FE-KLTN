import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
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

const HTTP_CLIENT_BASE_URL =
  typeof window === "undefined" ? API_BASE_URL : "";

const PUBLIC_ROUTE_PREFIXES = [
  "/login",
  "/register",
  "/forgot-password",
  "/complete-profile",
  "/intro",
  "/series",
  "/search",
  "/comics",
  "/movies",
  "/watch",
  "/read",
  "/public-channel",
  "/premium",
];

function isPublicRoute(pathname: string) {
  return (
    pathname === "/" ||
    PUBLIC_ROUTE_PREFIXES.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
    )
  );
}

// Browser requests stay on the Next.js origin and are rewritten to the
// selected backend. Server-side requests can call the backend directly.
export const httpClient = axios.create({
  baseURL: HTTP_CLIENT_BASE_URL,
  withCredentials: true,
});

// ==========================================
// AXIOS INTERCEPTOR: XỬ LÝ TOKEN ROTATION
// ==========================================

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

httpClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // Nếu lỗi là 401 Unauthorized và chưa từng thử retry
    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry
    ) {
      if (
        originalRequest.url?.includes("/api/auth/login") ||
        originalRequest.url?.includes("/api/auth/refresh-token")
      ) {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise(function (resolve, reject) {
          failedQueue.push({ resolve, reject });
        })
          .then(() => {
            return httpClient(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        await axios.post("/api/internal/auth/refresh");

        isRefreshing = false;
        processQueue(null);

        return httpClient(originalRequest);
      } catch (refreshError) {
        isRefreshing = false;
        processQueue(refreshError as Error);

        // ======= PHẦN FIX LỖI INFINITE LOOP =======
        if (typeof window !== "undefined") {
          const currentPath = window.location.pathname;
          // Chỉ định những trang được phép truy cập mà KHÔNG CẦN đăng nhập
          const isPublicPage = isPublicRoute(currentPath);

          // Chỉ đá văng về login nếu user đang ở các trang cần bảo vệ (VD: /admin, /staff)
          if (!isPublicPage) {
            window.location.href = "/login";
          }
        }
        // ==========================================

        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

// ==========================================
// UTILS
// ==========================================

export function getApiErrorMessage(error: unknown) {
  if (axios.isAxiosError<BaseResponse<unknown>>(error)) {
    return error.response?.data?.message || error.message;
  }
  return error instanceof Error ? error.message : "Request failed.";
}

export function getApiErrorCode(error: unknown): number | undefined {
  if (axios.isAxiosError<BaseResponse<unknown>>(error)) {
    return error.response?.data?.code;
  }
  return undefined;
}

/**
 * Giữ lại HTTP status khi wrap lỗi — caller cần phân biệt lỗi auth thật (401/403,
 * request tới được server và bị từ chối) khỏi lỗi mạng/5xx thuần túy (không có
 * `status`, request có thể chưa từng tới server). Không giữ status thì caller như
 * AuthProvider buộc phải xử lý MỌI lỗi giống nhau, dẫn tới clear session oan khi
 * chỉ là network glitch.
 */
export class ApiError extends Error {
  status?: number;
  code?: number;

  constructor(message: string, opts?: { status?: number; code?: number }) {
    super(message);
    this.name = "ApiError";
    this.status = opts?.status;
    this.code = opts?.code;
  }
}

export async function unwrapBaseResponse<T>(
  promise: Promise<{ data: BaseResponse<T> }>,
) {
  try {
    const response = await promise;
    return response.data.data;
  } catch (error) {
    const status = axios.isAxiosError(error) ? error.response?.status : undefined;
    throw new ApiError(getApiErrorMessage(error), { status, code: getApiErrorCode(error) });
  }
}
