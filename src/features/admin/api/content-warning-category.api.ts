import {
  httpClient,
  unwrapBaseResponse,
} from "@/shared/api/http-client";

const PUBLIC_ENDPOINT = "/api/v1/content-warning-categories";
const ADMIN_ENDPOINT = "/api/v1/admin/content-warning-categories";

export type ContentWarningCategory = {
  id: string;
  code: string;
  label: string;
  isActive: boolean;
};

type ContentWarningCategoryApiItem = {
  categoryId?: string;
  code?: string;
  label?: string;
  isActive?: boolean;
};

function normalize(item: ContentWarningCategoryApiItem): ContentWarningCategory {
  return {
    id: item.categoryId ?? "",
    code: item.code ?? "",
    label: item.label ?? "",
    isActive: item.isActive ?? true,
  };
}

// Public — chỉ trả nhóm active, dùng cho form khai báo Cảnh báo nội dung (core-identity-step.tsx).
export async function getActiveContentWarningCategories() {
  const data = await unwrapBaseResponse<ContentWarningCategoryApiItem[]>(
    httpClient.get(PUBLIC_ENDPOINT),
  );

  return (data ?? []).map(normalize);
}

// Admin — trả cả nhóm đã ẩn (isActive=false) để CRUD đầy đủ.
export async function getAllContentWarningCategories() {
  const data = await unwrapBaseResponse<ContentWarningCategoryApiItem[]>(
    httpClient.get(ADMIN_ENDPOINT),
  );

  return (data ?? []).map(normalize);
}

export async function createContentWarningCategory(code: string, label: string) {
  const data = await unwrapBaseResponse<ContentWarningCategoryApiItem>(
    httpClient.post(ADMIN_ENDPOINT, { code: code.trim(), label: label.trim() }),
  );

  return normalize(data);
}

export async function updateContentWarningCategory(
  id: string,
  label: string,
  isActive: boolean,
) {
  const data = await unwrapBaseResponse<ContentWarningCategoryApiItem>(
    httpClient.put(`${ADMIN_ENDPOINT}/${id}`, { label: label.trim(), isActive }),
  );

  return normalize(data);
}

export async function deleteContentWarningCategory(id: string) {
  return unwrapBaseResponse<void>(httpClient.delete(`${ADMIN_ENDPOINT}/${id}`));
}
