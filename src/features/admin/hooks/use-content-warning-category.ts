"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createContentWarningCategory,
  deleteContentWarningCategory,
  getActiveContentWarningCategories,
  getAllContentWarningCategories,
  updateContentWarningCategory,
} from "@/features/admin/api/content-warning-category.api";

export const contentWarningCategoryKeys = {
  all: ["admin", "content-warning-categories"] as const,
  active: () => [...contentWarningCategoryKeys.all, "active"] as const,
  lists: () => [...contentWarningCategoryKeys.all, "list"] as const,
};

// Dùng ở core-identity-step.tsx (form khai báo của Creator) — chỉ nhóm active.
export function useGetActiveContentWarningCategories() {
  return useQuery({
    queryKey: contentWarningCategoryKeys.active(),
    queryFn: getActiveContentWarningCategories,
    staleTime: 60 * 1000,
  });
}

// Dùng ở trang Admin CRUD — cả nhóm đã ẩn.
export function useGetAllContentWarningCategories() {
  return useQuery({
    queryKey: contentWarningCategoryKeys.lists(),
    queryFn: getAllContentWarningCategories,
    staleTime: 60 * 1000,
  });
}

function invalidateAll(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: contentWarningCategoryKeys.active() });
  queryClient.invalidateQueries({ queryKey: contentWarningCategoryKeys.lists() });
}

export function useCreateContentWarningCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ code, label }: { code: string; label: string }) =>
      createContentWarningCategory(code, label),
    onSuccess: () => invalidateAll(queryClient),
  });
}

export function useUpdateContentWarningCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, label, isActive }: { id: string; label: string; isActive: boolean }) =>
      updateContentWarningCategory(id, label, isActive),
    onSuccess: () => invalidateAll(queryClient),
  });
}

export function useDeleteContentWarningCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteContentWarningCategory(id),
    onSuccess: () => invalidateAll(queryClient),
  });
}
