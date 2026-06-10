// Định nghĩa các loại điều khoản (map với enum TermsType phía BE)
export type TermsType = "CREATOR" | "GENERAL_TOS";

// Định nghĩa base response chung từ Backend trả về
export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

// Cấu trúc phân trang trả về từ Spring Boot (BasePageResponse)
export interface PaginatedData<T> {
  content: T[]; // Danh sách items
  totalElements: number; // Tổng số bản ghi
  totalPages: number; // Tổng số trang
  pageNumber: number; // Trang hiện tại
  pageSize: number; // Số bản ghi / trang
  isLast: boolean; // Đã là trang cuối chưa
}

// Model chính của TermsVersion
export interface TermsVersion {
  id: string; // UUID
  version: string;
  type: TermsType;
  content: string;
  isActive: boolean;
  createdAt: string; // ISO-8601 string
  updatedAt: string | null; // ISO-8601 string hoặc null
}

// Payload khi tạo mới Điều khoản (POST)
export interface CreateTermsPayload {
  version: string;
  type: TermsType;
  content: string;
  isActive: boolean;
}

// Payload khi cập nhật Điều khoản (PUT) - Các trường đều là optional theo tính chất null-safe
export interface UpdateTermsPayload {
  version?: string;
  type?: TermsType;
  content?: string;
  isActive?: boolean;
}

// Tham số query string để filter/pagination (GET)
export interface TermsFilterParams {
  page?: number; // Mặc định: 1
  pageSize?: number; // Mặc định: 20
  version?: string;
  content?: string;
  isActive?: boolean;
  types?: TermsType[]; // Mảng các type, VD: ['CREATOR', 'GENERAL_TOS']
  createdAtFrom?: string; // Format: YYYY-MM-DDTHH:mm:ss
  createdAtTo?: string; // Format: YYYY-MM-DDTHH:mm:ss
  updatedAtFrom?: string;
  updatedAtTo?: string;
  sortBy?: "version" | "type" | "createdAt" | "updatedAt"; // Mặc định: createdAt
  sortDirection?: "ASC" | "DESC"; // Mặc định: DESC
}
