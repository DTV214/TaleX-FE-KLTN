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
  creatorName: string;
  taxId: string;
  status: IdentityVerificationStatus;
  verifiedNote?: string;
};

export type PaymentProfileRecord = {
  id: string;
  creatorName: string;
  bankCode: string;
  accountNumber: string;
  accountName: string;
  status: PaymentVerificationStatus;
  verifiedNote?: string;
};

type CreatorIdentityDto = Partial<CreatorIdentityRecord> & {
  creatorIdentityId?: string;
  identityId?: string;
  creatorId?: string;
  creatorName?: string;
  displayName?: string;
  fullName?: string;
  username?: string;
  taxCode?: string;
  taxId?: string;
  verifiedNote?: string;
  status?: string;
};

type PaymentProfileDto = Partial<PaymentProfileRecord> & {
  paymentProfileId?: string;
  creatorId?: string;
  creatorName?: string;
  displayName?: string;
  username?: string;
  bankCode?: string;
  accountNumber?: string;
  accountName?: string;
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
    creatorName: getString(
      item.creatorName ?? item.fullName ?? item.displayName ?? item.username,
      "Creator",
    ),
    taxId: getString(item.taxId ?? item.taxCode, "-"),
    status: normalizeIdentityStatus(item.status),
    verifiedNote: item.verifiedNote,
  };
}

function normalizePaymentProfile(item: PaymentProfileDto): PaymentProfileRecord {
  return {
    id: getString(item.paymentProfileId ?? item.id, ""),
    creatorName: getString(
      item.creatorName ?? item.displayName ?? item.username,
      "Creator",
    ),
    bankCode: getString(item.bankCode, "-"),
    accountNumber: getString(item.accountNumber, "-"),
    accountName: getString(item.accountName, "-"),
    status: normalizePaymentStatus(item.status),
    verifiedNote: item.verifiedNote,
  };
}

export async function getCreatorIdentities(
  params?: Record<string, unknown>,
): Promise<CreatorIdentityRecord[]> {
  const payload = await unwrapBaseResponse<ListPayload<CreatorIdentityDto>>(
    httpClient.get("/api/v1/creators/identities", { params }),
  );

  return extractItems(payload).map(normalizeIdentity).filter((item) => item.id);
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
