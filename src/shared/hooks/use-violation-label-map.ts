"use client";

import { useQuery } from "@tanstack/react-query";
import { getViolationLabelMap } from "@/shared/api/violation-label-map.api";
import { makeTranslate } from "@/shared/utils/violation-label-translate";

// Bảng dịch nhãn vi phạm hiếm khi đổi (Admin sửa qua trang CRUD riêng) — cache dài hạn,
// SSE handler (use-pipeline-sse.ts) đọc thẳng từ cache này qua queryClient.getQueryData()
// vì nó chạy trong callback imperative, không gọi hook render được.
export const violationLabelMapQueryKey = ["violation-label-map"] as const;

export function useViolationLabelMap() {
  const query = useQuery({
    queryKey: violationLabelMapQueryKey,
    queryFn: getViolationLabelMap,
    staleTime: Infinity,
    gcTime: Infinity,
  });

  return {
    translate: makeTranslate(query.data ?? {}),
    isLoading: query.isLoading,
  };
}
