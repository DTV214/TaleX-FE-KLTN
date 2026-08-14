"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createViolationLabelCategory,
  deleteViolationLabelCategory,
  getViolationLabelCategories,
  updateViolationLabelCategory,
} from "@/features/admin/api/violation-label-category.api";
import { violationLabelTranslationKeys } from "@/features/admin/hooks/use-violation-label-translation";

export const violationLabelCategoryKeys = {
  all: ["admin", "violation-label-categories"] as const,
  lists: () => [...violationLabelCategoryKeys.all, "list"] as const,
};

export function useGetViolationLabelCategories() {
  return useQuery({
    queryKey: violationLabelCategoryKeys.lists(),
    queryFn: getViolationLabelCategories,
    staleTime: 60 * 1000,
  });
}

// Đổi/xóa nhóm ảnh hưởng tới categoryName hiển thị trên các bản dịch đang tham chiếu —
// invalidate luôn danh sách bản dịch để bảng chính cập nhật theo, không chỉ list nhóm.
export function useCreateViolationLabelCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (name: string) => createViolationLabelCategory(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: violationLabelCategoryKeys.lists() });
    },
  });
}

export function useUpdateViolationLabelCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      updateViolationLabelCategory(id, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: violationLabelCategoryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: violationLabelTranslationKeys.lists() });
    },
  });
}

export function useDeleteViolationLabelCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteViolationLabelCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: violationLabelCategoryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: violationLabelTranslationKeys.lists() });
    },
  });
}
