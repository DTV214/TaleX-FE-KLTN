import {
  httpClient,
  unwrapBaseResponse,
  type BasePageResponse,
  type BaseResponse,
} from "@/shared/api/http-client";

const CATEGORIES_ENDPOINT = "/api/v1/categories";

export type CategoryStatus = "ACTIVE" | "INACTIVE" | "DELETED";

export type Category = {
  id: string;
  name: string;
  description: string;
  status: CategoryStatus;
};

export type CategoryPayload = {
  name: string;
  description?: string;
};

type CategoryApiItem = {
  id?: string;
  categoryId?: string;
  name?: string;
  categoryName?: string;
  description?: string | null;
  status?: string | null;
};

type CategoryListPayload =
  | CategoryApiItem[]
  | BasePageResponse<CategoryApiItem>
  | {
      content?: CategoryApiItem[];
      data?: CategoryApiItem[] | BasePageResponse<CategoryApiItem>;
    };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function normalizeStatus(status: unknown): CategoryStatus {
  if (status === "ACTIVE" || status === "INACTIVE" || status === "DELETED") {
    return status;
  }

  return "INACTIVE";
}

function normalizeCategory(item: CategoryApiItem): Category {
  return {
    id: item.id ?? item.categoryId ?? "",
    name: item.name ?? item.categoryName ?? "",
    description: item.description ?? "",
    status: normalizeStatus(item.status),
  };
}

function extractCategoryItems(payload: unknown): CategoryApiItem[] {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (!isRecord(payload)) {
    return [];
  }

  if (Array.isArray(payload.content)) {
    return payload.content as CategoryApiItem[];
  }

  if (Array.isArray(payload.data)) {
    return payload.data as CategoryApiItem[];
  }

  if (isRecord(payload.data) && Array.isArray(payload.data.content)) {
    return payload.data.content as CategoryApiItem[];
  }

  return [];
}

async function unwrapFlexible<T>(
  request: Promise<{ data: BaseResponse<T> | T }>,
) {
  const response = await request;

  if (isRecord(response.data) && "data" in response.data) {
    return unwrapBaseResponse<T>(
      Promise.resolve({ data: response.data as BaseResponse<T> }),
    );
  }

  return response.data as T;
}

function toCategoryRequest(payload: CategoryPayload) {
  return {
    categoryName: payload.name.trim(),
    description: payload.description?.trim() || "",
  };
}

export async function getCategories() {
  const payload = await unwrapFlexible<CategoryListPayload>(
    httpClient.get(CATEGORIES_ENDPOINT, {
      params: { pageSize: 100 },
    }),
  );

  return extractCategoryItems(payload)
    .map(normalizeCategory)
    .filter((category) => category.id && category.name);
}

export async function createCategory(payload: CategoryPayload) {
  const data = await unwrapBaseResponse<CategoryApiItem>(
    httpClient.post(CATEGORIES_ENDPOINT, toCategoryRequest(payload)),
  );

  return normalizeCategory(data);
}

export async function updateCategory(id: string, payload: CategoryPayload) {
  const data = await unwrapBaseResponse<CategoryApiItem>(
    httpClient.put(`${CATEGORIES_ENDPOINT}/${id}`, toCategoryRequest(payload)),
  );

  return normalizeCategory(data);
}

export async function deleteCategory(id: string) {
  return unwrapBaseResponse<void>(httpClient.delete(`${CATEGORIES_ENDPOINT}/${id}`));
}

export async function hideCategory(id: string) {
  const data = await unwrapBaseResponse<CategoryApiItem>(
    httpClient.patch(`${CATEGORIES_ENDPOINT}/${id}/hide`),
  );

  return normalizeCategory(data);
}

export async function unhideCategory(id: string) {
  const data = await unwrapBaseResponse<CategoryApiItem>(
    httpClient.patch(`${CATEGORIES_ENDPOINT}/${id}/unhide`),
  );

  return normalizeCategory(data);
}
