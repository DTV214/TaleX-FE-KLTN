import { httpClient, unwrapBaseResponse } from "@/shared/api/http-client";

const ENDPOINT = "/api/v1/violation-label-translations";

type ViolationLabelTranslationApiItem = {
  awsLabel?: string;
  vietnameseText?: string;
};

// Public endpoint (không cần quyền Admin) — dùng chung cho cả creator-dashboard và admin,
// nên đặt ở shared/api thay vì features/admin. Trả về map phẳng awsLabel -> vietnameseText,
// khớp đúng shape mà makeTranslate() (shared/utils/violation-label-translate.ts) cần.
export async function getViolationLabelMap(): Promise<Record<string, string>> {
  const items = await unwrapBaseResponse<ViolationLabelTranslationApiItem[]>(
    httpClient.get(ENDPOINT),
  );

  const map: Record<string, string> = {};
  for (const item of items ?? []) {
    if (item.awsLabel && item.vietnameseText) {
      map[item.awsLabel] = item.vietnameseText;
    }
  }
  return map;
}
