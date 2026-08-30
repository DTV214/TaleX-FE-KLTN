import {
  httpClient,
  unwrapBaseResponse,
  type BasePageResponse,
} from "@/shared/api/http-client";

export type IdentityVerificationStatus =
  | "PENDING"
  | "IN_PROGRESS"
  | "APPROVED"
  | "REJECTED";

export type PaymentVerificationStatus =
  | "PENDING"
  | "VERIFIED"
  | "REJECTED"
  | "CANCELLED";

export type CreatorIdentityRecord = {
  id: string;
  creatorIdentityId: string;
  accountName: string;
  taxId: string;
  status: IdentityVerificationStatus;
  verifiedNote?: string;
};

export type CreatorIdentityDetail = {
  creatorIdentityId?: string;
  creatorId?: string;
  accountName?: string;
  idNumber?: string;
  fullName?: string;
  dob?: string;
  sex?: string;
  address?: string;
  doe?: string;
  status?: IdentityVerificationStatus;
  taxId?: string;
  verifiedNote?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type PaymentProfileRecord = {
  id: string;
  accountName: string;
  bankCode: string;
  accountNumber: string;
  status: PaymentVerificationStatus;
  verifiedNote?: string;
};

type CreatorIdentityDto = Partial<CreatorIdentityRecord> & {
  creatorIdentityId?: string;
  identityId?: string;
  creatorId?: string;
  accountName?: string;
  taxCode?: string;
  taxId?: string;
  verifiedNote?: string;
  status?: string;
};

type PaymentProfileDto = Partial<PaymentProfileRecord> & {
  paymentProfileId?: string;
  creatorId?: string;
  accountName?: string;
  bankCode?: string;
  accountNumber?: string;
  verifiedNote?: string;
  status?: string;
};

type ListPayload<T> = T[] | BasePageResponse<T> | { content?: T[]; data?: T[] };

export type IdentityVerificationPayload = {
  status: IdentityVerificationStatus;
  verifiedNote?: string;
};

export type PaymentVerificationPayload = {
  status: Extract<PaymentVerificationStatus, "VERIFIED" | "REJECTED">;
  verifiedNote?: string;
};

export const adminVerificationKeys = {
  all: ["admin-creator-verification"] as const,
  identities: (params?: Record<string, unknown>) =>
    [...adminVerificationKeys.all, "identities", params ?? {}] as const,
  identityDetail: (id: string) =>
    [...adminVerificationKeys.all, "identity-detail", id] as const,
  paymentProfiles: (params?: Record<string, unknown>) =>
    [...adminVerificationKeys.all, "payment-profiles", params ?? {}] as const,
};

function getString(value: unknown, fallback = "-") {
  return typeof value === "string" && value.trim() ? value : fallback;
}

function normalizeIdentityStatus(value: unknown): IdentityVerificationStatus {
  if (
    value === "PENDING" ||
    value === "IN_PROGRESS" ||
    value === "APPROVED" ||
    value === "REJECTED"
  ) {
    return value;
  }

  return "PENDING";
}

function normalizePaymentStatus(value: unknown): PaymentVerificationStatus {
  if (
    value === "PENDING" ||
    value === "VERIFIED" ||
    value === "REJECTED" ||
    value === "CANCELLED"
  ) {
    return value;
  }

  return "PENDING";
}

function extractItems<T>(payload: ListPayload<T>): T[] {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload.content)) {
    return payload.content;
  }

  if ("data" in payload && Array.isArray(payload.data)) {
    return payload.data;
  }

  return [];
}

function normalizeIdentity(item: CreatorIdentityDto): CreatorIdentityRecord {
  const creatorIdentityId = getString(
    item.creatorIdentityId ?? item.identityId,
    "",
  );

  return {
    id: creatorIdentityId,
    creatorIdentityId,
    accountName: getString(item.accountName, "Creator"),
    taxId: getString(item.taxId ?? item.taxCode, "-"),
    status: normalizeIdentityStatus(item.status),
    verifiedNote: item.verifiedNote,
  };
}

function normalizePaymentProfile(item: PaymentProfileDto): PaymentProfileRecord {
  return {
    id: getString(item.paymentProfileId ?? item.id, ""),
    accountName: getString(item.accountName, "Creator"),
    bankCode: getString(item.bankCode, "-"),
    accountNumber: getString(item.accountNumber, "-"),
    status: normalizePaymentStatus(item.status),
    verifiedNote: item.verifiedNote,
  };
}

export type CreatorIdentitiesPageResponse = {
  content: CreatorIdentityRecord[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  isFirst: boolean;
  isLast: boolean;
};

export async function getCreatorIdentities(
  params?: Record<string, unknown>,
): Promise<CreatorIdentitiesPageResponse> {
  const payload = await unwrapBaseResponse<ListPayload<CreatorIdentityDto>>(
    httpClient.get("/api/v1/creators/identities", { params }),
  );

  if (Array.isArray(payload)) {
    const items = payload.map(normalizeIdentity).filter((item) => item.id);
    return {
      content: items,
      pageNumber: 1,
      pageSize: items.length || 20,
      totalElements: items.length,
      totalPages: 1,
      isFirst: true,
      isLast: true,
    };
  }

  const content = extractItems(payload).map(normalizeIdentity).filter((item) => item.id);
  const pageNumber =
    "pageNumber" in payload && typeof payload.pageNumber === "number"
      ? payload.pageNumber
      : 1;
  const pageSize =
    "pageSize" in payload && typeof payload.pageSize === "number"
      ? payload.pageSize
      : 20;
  const totalElements =
    "totalElements" in payload && typeof payload.totalElements === "number"
      ? payload.totalElements
      : content.length;
  const totalPages =
    "totalPages" in payload && typeof payload.totalPages === "number"
      ? payload.totalPages
      : 1;
  const isFirst =
    "isFirst" in payload && typeof payload.isFirst === "boolean"
      ? payload.isFirst
      : pageNumber <= 1;
  const isLast =
    "isLast" in payload && typeof payload.isLast === "boolean"
      ? payload.isLast
      : pageNumber >= totalPages;

  return {
    content,
    pageNumber,
    pageSize,
    totalElements,
    totalPages,
    isFirst,
    isLast,
  };
}

export function getCreatorIdentityById(
  id: string,
): Promise<CreatorIdentityDetail> {
  return unwrapBaseResponse<CreatorIdentityDetail>(
    httpClient.get(`/api/v1/creators/identities/${id}`),
  );
}

export function updateIdentityVerification(
  id: string,
  payload: IdentityVerificationPayload,
) {
  return unwrapBaseResponse<CreatorIdentityDto>(
    httpClient.put(`/api/v1/creators/identities/verification/${id}`, payload),
  );
}

export async function getPaymentProfiles(
  params?: Record<string, unknown>,
): Promise<PaymentProfileRecord[]> {
  const payload = await unwrapBaseResponse<ListPayload<PaymentProfileDto>>(
    httpClient.get("/api/v1/payment-profiles", { params }),
  );

  return extractItems(payload)
    .map(normalizePaymentProfile)
    .filter((item) => item.id);
}

export function updatePaymentVerification(
  id: string,
  payload: PaymentVerificationPayload,
) {
  return unwrapBaseResponse<PaymentProfileDto>(
    httpClient.put(`/api/v1/payment-profiles/verification/${id}`, payload),
  );
}
