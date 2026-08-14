export const FALLBACK_VIOLATION_LABEL = "nội dung không phù hợp";

// Pure — không phụ thuộc React Query/API, để dùng được cả trong render (qua
// useViolationLabelMap) lẫn trong callback imperative (SSE handler đọc map thẳng từ
// queryClient cache rồi gọi hàm này, xem use-pipeline-sse.ts).
export function makeTranslate(map: Record<string, string>) {
  return (label?: string | null): string => {
    if (!label) return FALLBACK_VIOLATION_LABEL;
    return map[label] || label;
  };
}
