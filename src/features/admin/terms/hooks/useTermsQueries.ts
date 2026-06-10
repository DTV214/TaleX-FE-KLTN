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

// 1. Quản lý Query Keys tập trung để tránh gõ sai string và dễ dàng Invalidate
export const termsKeys = {
  all: ["terms"] as const,
  lists: () => [...termsKeys.all, "list"] as const,
  list: (filters: TermsFilterParams) =>
    [...termsKeys.lists(), filters] as const,
  details: () => [...termsKeys.all, "detail"] as const,
  detail: (id: string) => [...termsKeys.details(), id] as const,
};

// 2. Hook lấy danh sách Điều khoản (hỗ trợ phân trang & bộ lọc)
export const useTermsVersions = (filters: TermsFilterParams) => {
  return useQuery({
    queryKey: termsKeys.list(filters),
    queryFn: () => termsApi.getTermsVersions(filters),
    // Giữ lại dữ liệu cũ trong lúc fetch trang mới để UI không bị giật (nháy loading)
    placeholderData: keepPreviousData,
  });
};

// 3. Hook lấy chi tiết 1 Điều khoản
export const useTermsVersion = (id: string) => {
  return useQuery({
    queryKey: termsKeys.detail(id),
    queryFn: () => termsApi.getTermsVersionById(id),
    enabled: !!id, // Chỉ gọi API khi có id hợp lệ
  });
};

// 4. Hook Tạo mới Điều khoản
export const useCreateTermsVersion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateTermsPayload) =>
      termsApi.createTermsVersion(payload),
    onSuccess: () => {
      // Khi tạo thành công, xóa cache của danh sách để nó tự động fetch lại
      queryClient.invalidateQueries({ queryKey: termsKeys.lists() });
    },
  });
};

// 5. Hook Cập nhật Điều khoản
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
    onSuccess: (_, variables) => {
      // Làm mới danh sách và làm mới luôn cả chi tiết của chính item đó
      queryClient.invalidateQueries({ queryKey: termsKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: termsKeys.detail(variables.id),
      });
    },
  });
};

// 6. Hook Xóa (mềm) Điều khoản
export const useDeleteTermsVersion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => termsApi.deleteTermsVersion(id),
    onSuccess: () => {
      // Xóa xong thì fetch lại danh sách
      queryClient.invalidateQueries({ queryKey: termsKeys.lists() });
    },
  });
};
