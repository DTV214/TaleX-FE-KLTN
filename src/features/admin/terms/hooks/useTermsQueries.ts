import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import { termsApi } from "../api/terms.api";
import {
  TermsFilterParams,
  CreateTermsPayload,
  UpdateTermsPayload,
} from "../types/terms.types";

// ==========================================
// 1. QUERY KEYS FACTORY (Quản lý Key tập trung)
// ==========================================
export const termsKeys = {
  all: ["terms"] as const,
  lists: () => [...termsKeys.all, "list"] as const,
  list: (filters: TermsFilterParams) =>
    [...termsKeys.lists(), filters] as const,
  details: () => [...termsKeys.all, "detail"] as const,
  detail: (id: string) => [...termsKeys.details(), id] as const,
};

// ==========================================
// 2. QUERIES (Lấy dữ liệu)
// ==========================================

// Hook lấy danh sách Điều khoản (hỗ trợ phân trang & bộ lọc)
export const useTermsVersions = (filters: TermsFilterParams) => {
  return useQuery({
    queryKey: termsKeys.list(filters),
    queryFn: () => termsApi.getTermsVersions(filters),
    // Giữ lại dữ liệu cũ trong lúc fetch trang mới để UI không bị giật (nháy loading)
    placeholderData: keepPreviousData,
    // BẮT BUỘC CÓ Ở TRANG ADMIN: Giữ cache "tươi" trong 1 phút để tránh spam API khi user đổi tab
    staleTime: 60 * 1000,
  });
};

// Hook lấy chi tiết 1 Điều khoản
export const useTermsVersion = (id: string) => {
  return useQuery({
    queryKey: termsKeys.detail(id),
    queryFn: () => termsApi.getTermsVersionById(id),
    enabled: !!id, // Chỉ gọi API khi có id hợp lệ
    // Chi tiết ít bị thay đổi, ta có thể giữ cache lâu hơn (ví dụ 5 phút)
    staleTime: 5 * 60 * 1000,
  });
};

// ==========================================
// 3. MUTATIONS (Thay đổi dữ liệu)
// ==========================================

// Hook Tạo mới Điều khoản
export const useCreateTermsVersion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateTermsPayload) =>
      termsApi.createTermsVersion(payload),
    onSuccess: (res) => {
      // Chỉ Invalidate (làm mới bảng) NẾU Backend trả về code thành công
      if (res.code === 200 || res.code === 201) {
        queryClient.invalidateQueries({ queryKey: termsKeys.lists() });
      }
    },
  });
};

// Hook Cập nhật Điều khoản
export const useUpdateTermsVersion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateTermsPayload;
    }) => termsApi.updateTermsVersion(id, payload),
    onSuccess: (res, variables) => {
      // Chỉ Invalidate NẾU Backend trả về code thành công
      if (res.code === 200) {
        // Làm mới danh sách và làm mới luôn cả chi tiết của chính item đó
        queryClient.invalidateQueries({ queryKey: termsKeys.lists() });
        queryClient.invalidateQueries({
          queryKey: termsKeys.detail(variables.id),
        });
      }
    },
  });
};

// Hook Xóa (mềm) Điều khoản
export const useDeleteTermsVersion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => termsApi.deleteTermsVersion(id),
    onSuccess: (res) => {
      // Chỉ Invalidate NẾU Backend trả về code thành công
      if (res.code === 200) {
        // Xóa xong thì fetch lại danh sách
        queryClient.invalidateQueries({ queryKey: termsKeys.lists() });
      }
    },
  });
};
