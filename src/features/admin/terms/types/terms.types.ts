// ==========================================
// 1. ENUMS & CORE ENTITIES
// ==========================================

export type TermsType =
  | "CREATOR"
  | "GENERAL_TOS"
  | "CREATOR_VERIFYING_PROCESS"
  | "CREATOR_ENABLE_MONETIZATION";

export interface TermsVersion {
  id: string; // UUID
  version: string;
  type: TermsType;
  content: string;
  isActive: boolean;
  createdAt: string; // Format: ISO-8601 string
  updatedAt: string | null; // Có thể null nếu chưa từng update
}

// ==========================================
// 2. RESPONSE WRAPPERS (Dữ liệu nhận từ BE)
// ==========================================

export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
  timestamp?: string;
}

export interface PaginatedData<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  pageNumber: number;
  pageSize: number;
  isFirst: boolean;
  isLast: boolean;
}

// ==========================================
// 3. REQUEST PAYLOADS (Dữ liệu gửi lên BE để Create/Update)
// ==========================================

export interface CreateTermsPayload {
  version: string;
  type: TermsType;
  content: string;
  isActive: boolean;
}

export interface UpdateTermsPayload {
  version?: string;
  type?: TermsType;
  content?: string;
  isActive?: boolean;
}

// ==========================================
// 4. FILTER PARAMS (Dùng cho API & FE Filter)
// ==========================================

// Cấu trúc phẳng hoàn toàn, khớp 100% với Swagger UI
export interface TermsFilterParams {
  // --- Dùng để truyền lên API Backend ---
  page: number;
  pageSize: number;
  sortBy?: "version" | "type" | "createdAt" | "updatedAt";
  sortDirection?: "ASC" | "DESC";
  types?: TermsType[];

  // --- Dùng để tự lọc (filter) trên giao diện Frontend ---
  version?: string;
  isActive?: boolean;
}
