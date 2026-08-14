import {
  httpClient,
  unwrapBaseResponse,
} from "@/shared/api/http-client";

const PUBLIC_ENDPOINT = "/api/v1/violation-label-categories";
const ADMIN_ENDPOINT = "/api/v1/admin/violation-label-categories";

export type ViolationLabelCategory = {
  id: string;
  name: string;
};

type ViolationLabelCategoryApiItem = {
  categoryId?: string;
  name?: string;
};

function normalize(item: ViolationLabelCategoryApiItem): ViolationLabelCategory {
  return {
    id: item.categoryId ?? "",
    name: item.name ?? "",
  };
}

export async function getViolationLabelCategories() {
  const data = await unwrapBaseResponse<ViolationLabelCategoryApiItem[]>(
    httpClient.get(PUBLIC_ENDPOINT),
  );

  return (data ?? []).map(normalize);
}

export async function createViolationLabelCategory(name: string) {
  const data = await unwrapBaseResponse<ViolationLabelCategoryApiItem>(
    httpClient.post(ADMIN_ENDPOINT, { name: name.trim() }),
  );

  return normalize(data);
}

export async function updateViolationLabelCategory(id: string, name: string) {
  const data = await unwrapBaseResponse<ViolationLabelCategoryApiItem>(
    httpClient.put(`${ADMIN_ENDPOINT}/${id}`, { name: name.trim() }),
  );

  return normalize(data);
}

export async function deleteViolationLabelCategory(id: string) {
  return unwrapBaseResponse<void>(httpClient.delete(`${ADMIN_ENDPOINT}/${id}`));
}
