import { httpClient, type BaseResponse } from "@/shared/api/http-client";

const ADMIN_CREATORS_ENDPOINT = "/api/v1/creators";
const CREATOR_VIOLATIONS_ENDPOINT = "/api/v1/media/creators";

export type AdminCreatorStatus =
  | "ACTIVE"
  | "INACTIVE"
  | "BANNED"
  | "SUSPENDED"
  | "PENDING";

export type AdminCreatorItem = {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  status: AdminCreatorStatus;
};

export type CreatorViolationSummary = {
  creatorId: string;
  copyrightStrikes: number;
  censorshipViolations: number;
};

type AdminCreatorApiItem = {
  id?: string;
  userId?: string;
  creatorId?: string;
  name?: string | null;
  displayName?: string | null;
  fullName?: string | null;
  username?: string | null;
  email?: string | null;
  avatar?: string | null;
  avatarUrl?: string | null;
  profileImageUrl?: string | null;
  status?: string | null;
};

type CreatorListPayload =
  | AdminCreatorApiItem[]
  | {
      content?: AdminCreatorApiItem[];
      data?: AdminCreatorApiItem[] | { content?: AdminCreatorApiItem[] };
    };

type CreatorViolationPayload = {
  creatorId?: string;
  copyrightStrikes?: number;
  censorshipViolations?: number;
  data?: CreatorViolationPayload;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function unwrapPayload<T>(responseData: BaseResponse<T> | T): T {
  if (isRecord(responseData) && "data" in responseData) {
    return responseData.data as T;
  }

  return responseData as T;
}

function extractCreatorItems(payload: unknown): AdminCreatorApiItem[] {
  const unwrappedPayload = unwrapPayload<unknown>(payload);
  const nestedPayload =
    isRecord(unwrappedPayload) &&
    (Array.isArray(unwrappedPayload.data) || isRecord(unwrappedPayload.data))
      ? unwrappedPayload.data
      : unwrappedPayload;

  if (Array.isArray(nestedPayload)) {
    return nestedPayload.filter(isRecord);
  }

  if (!isRecord(nestedPayload)) {
    return [];
  }

  return Array.isArray(nestedPayload.content)
    ? nestedPayload.content.filter(isRecord)
    : [];
}

function normalizeStatus(value: unknown): AdminCreatorStatus {
  if (
    value === "ACTIVE" ||
    value === "INACTIVE" ||
    value === "BANNED" ||
    value === "SUSPENDED" ||
    value === "PENDING"
  ) {
    return value;
  }

  return "INACTIVE";
}

function normalizeCreator(item: AdminCreatorApiItem): AdminCreatorItem {
  const id = item.id ?? item.creatorId ?? item.userId ?? "";

  return {
    id,
    name:
      item.name ??
      item.displayName ??
      item.fullName ??
      item.username ??
      "Unnamed creator",
    email: item.email ?? "-",
    avatar: item.avatar ?? item.avatarUrl ?? item.profileImageUrl ?? undefined,
    status: normalizeStatus(item.status),
  };
}

function getNumber(value: unknown, fallback = 0) {
  return typeof value === "number" ? value : fallback;
}

function normalizeViolationSummary(
  payload: unknown,
  creatorId: string,
): CreatorViolationSummary {
  const unwrappedPayload = unwrapPayload<unknown>(payload);
  const summary =
    isRecord(unwrappedPayload) && isRecord(unwrappedPayload.data)
      ? unwrappedPayload.data
      : unwrappedPayload;
  const record = isRecord(summary) ? summary : {};

  return {
    creatorId:
      typeof record.creatorId === "string" ? record.creatorId : creatorId,
    copyrightStrikes: getNumber(record.copyrightStrikes),
    censorshipViolations: getNumber(record.censorshipViolations),
  };
}

export async function getAdminCreators() {
  const response = await httpClient.get<
    BaseResponse<CreatorListPayload> | CreatorListPayload
  >(ADMIN_CREATORS_ENDPOINT, {
    params: { pageSize: 100 },
  });

  return extractCreatorItems(response.data)
    .map(normalizeCreator)
    .filter((creator) => creator.id);
}

export async function getCreatorViolations(creatorId: string) {
  const response = await httpClient.get<
    BaseResponse<CreatorViolationPayload> | CreatorViolationPayload
  >(`${CREATOR_VIOLATIONS_ENDPOINT}/${creatorId}/violations-summary`);

  return normalizeViolationSummary(response.data, creatorId);
}
