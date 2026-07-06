import {
  httpClient,
  unwrapBaseResponse,
  type BasePageResponse,
  type BaseResponse,
} from "@/shared/api/http-client";

const TAGS_ENDPOINT = "/api/v1/tags";

export type TagStatus = "ACTIVE" | "INACTIVE" | "DELETED";

export type Tag = {
  id: string;
  name: string;
  description: string;
  status: TagStatus;
};

export type TagPayload = {
  name: string;
  description?: string;
};

type TagApiItem = {
  id?: string;
  tagId?: string;
  name?: string;
  tagName?: string;
  description?: string | null;
  status?: string | null;
};

type TagListPayload =
  | TagApiItem[]
  | BasePageResponse<TagApiItem>
  | {
      content?: TagApiItem[];
      data?: TagApiItem[] | BasePageResponse<TagApiItem>;
    };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function normalizeStatus(status: unknown): TagStatus {
  if (status === "ACTIVE" || status === "INACTIVE" || status === "DELETED") {
    return status;
  }

  return "INACTIVE";
}

function normalizeTag(item: TagApiItem): Tag {
  return {
    id: item.id ?? item.tagId ?? "",
    name: item.name ?? item.tagName ?? "",
    description: item.description ?? "",
    status: normalizeStatus(item.status),
  };
}

function extractTagItems(payload: unknown): TagApiItem[] {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (!isRecord(payload)) {
    return [];
  }

  if (Array.isArray(payload.content)) {
    return payload.content as TagApiItem[];
  }

  if (Array.isArray(payload.data)) {
    return payload.data as TagApiItem[];
  }

  if (isRecord(payload.data) && Array.isArray(payload.data.content)) {
    return payload.data.content as TagApiItem[];
  }

  return [];
}

async function unwrapFlexible<T>(request: Promise<{ data: BaseResponse<T> | T }>) {
  const response = await request;

  if (isRecord(response.data) && "data" in response.data) {
    return unwrapBaseResponse<T>(
      Promise.resolve({ data: response.data as BaseResponse<T> }),
    );
  }

  return response.data as T;
}

function toTagRequest(payload: TagPayload) {
  return {
    tagName: payload.name.trim(),
    description: payload.description?.trim() || "",
  };
}

export async function getTags() {
  const payload = await unwrapFlexible<TagListPayload>(
    httpClient.get(TAGS_ENDPOINT, {
      params: { pageSize: 100 },
    }),
  );

  return extractTagItems(payload)
    .map(normalizeTag)
    .filter((tag) => tag.id && tag.name);
}

export async function createTag(payload: TagPayload) {
  const data = await unwrapBaseResponse<TagApiItem>(
    httpClient.post(TAGS_ENDPOINT, toTagRequest(payload)),
  );

  return normalizeTag(data);
}

export async function updateTag(id: string, payload: TagPayload) {
  const data = await unwrapBaseResponse<TagApiItem>(
    httpClient.put(`${TAGS_ENDPOINT}/${id}`, toTagRequest(payload)),
  );

  return normalizeTag(data);
}

export async function deleteTag(id: string) {
  return unwrapBaseResponse<void>(httpClient.delete(`${TAGS_ENDPOINT}/${id}`));
}

export async function hideTag(id: string) {
  const data = await unwrapBaseResponse<TagApiItem>(
    httpClient.patch(`${TAGS_ENDPOINT}/${id}/hide`),
  );

  return normalizeTag(data);
}

export async function unhideTag(id: string) {
  const data = await unwrapBaseResponse<TagApiItem>(
    httpClient.patch(`${TAGS_ENDPOINT}/${id}/unhide`),
  );

  return normalizeTag(data);
}
