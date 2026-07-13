import {
  httpClient,
  unwrapBaseResponse,
  type BasePageResponse,
  type BaseResponse,
} from "@/shared/api/http-client";

const ADMIN_ACCOUNTS_ENDPOINT = "/api/v1/admin/accounts";

export type AccountRole = "VIEWER" | "CREATOR" | "ADMIN" | "STAFF";
export type AccountStatus =
  | "ACTIVE"
  | "BANNED"
  | "SUSPENDED"
  | "DELETED"
  | "PENDING";

export type AdminAccountItem = {
  accountId: string;
  email: string;
  username: string;
  fullName: string;
  avatarUrl?: string;
  roleName: AccountRole;
  status: AccountStatus;
  createdAt: string;
  phone?: string;
};

export type CreateStaffPayload = {
  email: string;
  username: string;
  fullName: string;
  password: string;
};

export type GetAdminAccountsParams = {
  page?: number;
  size?: number;
  keyword?: string;
  roleName?: AccountRole | "";
  status?: AccountStatus | "";
};

export type AdminAccountPage = BasePageResponse<AdminAccountItem>;

type AccountApiItem = {
  accountId?: string;
  id?: string;
  email?: string | null;
  username?: string | null;
  fullName?: string | null;
  name?: string | null;
  avatarUrl?: string | null;
  avatar?: string | null;
  roleName?: string | null;
  role?: string | null;
  status?: string | null;
  createdAt?: string | null;
  phone?: string | null;
};

type AccountListPayload =
  | AccountApiItem[]
  | BasePageResponse<AccountApiItem>
  | {
      content?: AccountApiItem[];
      data?: AccountApiItem[] | BasePageResponse<AccountApiItem>;
      pageNumber?: number;
      pageSize?: number;
      totalElements?: number;
      totalPages?: number;
      isFirst?: boolean;
      isLast?: boolean;
    };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function normalizeRole(value: unknown): AccountRole {
  if (
    value === "VIEWER" ||
    value === "CREATOR" ||
    value === "ADMIN" ||
    value === "STAFF"
  ) {
    return value;
  }

  return "VIEWER";
}

function normalizeStatus(value: unknown): AccountStatus {
  if (
    value === "ACTIVE" ||
    value === "BANNED" ||
    value === "SUSPENDED" ||
    value === "DELETED" ||
    value === "PENDING"
  ) {
    return value;
  }

  return "PENDING";
}

function normalizeAccount(item: AccountApiItem): AdminAccountItem {
  return {
    accountId: item.accountId ?? item.id ?? "",
    email: item.email ?? "",
    username: item.username ?? "",
    fullName: item.fullName ?? item.name ?? item.username ?? "Unnamed user",
    avatarUrl: item.avatarUrl ?? item.avatar ?? undefined,
    roleName: normalizeRole(item.roleName ?? item.role),
    status: normalizeStatus(item.status),
    createdAt: item.createdAt ?? "",
    phone: item.phone ?? undefined,
  };
}

function unwrapPayload<T>(responseData: BaseResponse<T> | T): T {
  if (isRecord(responseData) && "data" in responseData) {
    return responseData.data as T;
  }

  return responseData as T;
}

function getNumber(value: unknown, fallback: number) {
  return typeof value === "number" ? value : fallback;
}

function getBoolean(value: unknown, fallback: boolean) {
  return typeof value === "boolean" ? value : fallback;
}

function normalizePage(
  payload: unknown,
  page = 0,
  size = 10,
): AdminAccountPage {
  const unwrappedPayload = unwrapPayload<unknown>(payload);
  const nestedPayload =
    isRecord(unwrappedPayload) &&
    (Array.isArray(unwrappedPayload.data) || isRecord(unwrappedPayload.data))
      ? unwrappedPayload.data
      : unwrappedPayload;
  const pageRecord = isRecord(nestedPayload) ? nestedPayload : {};
  const rawContent = Array.isArray(nestedPayload)
    ? nestedPayload
    : Array.isArray(pageRecord.content)
      ? pageRecord.content
      : [];
  const content = rawContent
    .filter(isRecord)
    .map((item) => normalizeAccount(item))
    .filter((account) => account.accountId);
  const totalElements = getNumber(pageRecord.totalElements, content.length);
  const totalPages = getNumber(
    pageRecord.totalPages,
    content.length > 0 ? 1 : 0,
  );
  const pageNumber = getNumber(pageRecord.pageNumber, page);
  const pageSize = getNumber(pageRecord.pageSize, size);

  return {
    content,
    pageNumber,
    pageSize,
    totalElements,
    totalPages,
    isFirst: getBoolean(pageRecord.isFirst, pageNumber <= 0),
    isLast: getBoolean(
      pageRecord.isLast,
      totalPages <= 1 || pageNumber >= totalPages - 1,
    ),
  };
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

function toCleanParams(params: GetAdminAccountsParams) {
  return {
    page: params.page ?? 0,
    size: params.size ?? 10,
    keyword: params.keyword?.trim() || undefined,
    roleName: params.roleName || undefined,
    status: params.status || undefined,
  };
}

export async function getAdminAccounts(params: GetAdminAccountsParams = {}) {
  const page = params.page ?? 0;
  const size = params.size ?? 10;
  const payload = await unwrapFlexible<AccountListPayload>(
    httpClient.get(ADMIN_ACCOUNTS_ENDPOINT, {
      params: toCleanParams(params),
    }),
  );

  return normalizePage(payload, page, size);
}

export async function createStaff(payload: CreateStaffPayload) {
  const data = await unwrapBaseResponse<AccountApiItem>(
    httpClient.post(`${ADMIN_ACCOUNTS_ENDPOINT}/staff`, payload),
  );

  return normalizeAccount(data);
}

export async function banAccount(accountId: string) {
  const data = await unwrapBaseResponse<AccountApiItem>(
    httpClient.patch(`${ADMIN_ACCOUNTS_ENDPOINT}/${accountId}/ban`),
  );

  return normalizeAccount(data);
}

export async function unbanAccount(accountId: string) {
  const data = await unwrapBaseResponse<AccountApiItem>(
    httpClient.patch(`${ADMIN_ACCOUNTS_ENDPOINT}/${accountId}/unban`),
  );

  return normalizeAccount(data);
}
