import axios from "axios";
import {
  getApiErrorMessage,
  httpClient,
  type BaseResponse,
} from "@/shared/api/http-client";

export type CreatorMonetizationTermType =
  | "CREATOR_VERIFYING_PROCESS"
  | "CREATOR_ENABLE_MONETIZATION";

export type CreatorIdentityStatus =
  | "AWAITING_FILL"
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | (string & {})
  | number;

export type CreatorPaymentStatus =
  | "PENDING"
  | "VERIFIED"
  | "REJECTED"
  | "CANCELLED"
  | (string & {})
  | number;

export type VerificationStatusDto = {
  isCreatorVerified: boolean;
  isTermsAccepted: boolean;
  identityStatus: CreatorIdentityStatus | null;
  identityVerifiedAt: string | null;
  identityVerifiedNote: string | null;
  taxId: string | null;
  paymentStatus: CreatorPaymentStatus | null;
  paymentVerifiedAt: string | null;
  paymentVerifiedNote: string | null;
  paymentProfileId: string | null;
};

export type TermVersionDto = {
  id?: string;
  versionId?: string;
  content: string;
};

export type TermsLogDto = {
  termsLogId?: string;
  termVersionId?: string;
  versionId?: string;
  acceptedAt?: string;
};

export type PaymentProfileRequestDto = {
  bankCode: string;
  accountNumber: string;
  accountName: string;
  isPrimary: boolean;
};

export type PaymentProfileDto = PaymentProfileRequestDto & {
  id?: string;
  paymentProfileId?: string;
  status?: CreatorPaymentStatus;
  verifiedAt?: string | null;
  verifiedNote?: string | null;
};

export const creatorMonetizationKeys = {
  all: ["creator-monetization"] as const,
  verificationStatus: () =>
    [...creatorMonetizationKeys.all, "verification-status"] as const,
  activeTerm: (type: CreatorMonetizationTermType) =>
    [...creatorMonetizationKeys.all, "active-term", type] as const,
};

const CREATOR_NOT_VERIFIED_CODE = 4003;

function createUnverifiedStatus(): VerificationStatusDto {
  return {
    isCreatorVerified: false,
    isTermsAccepted: false,
    identityStatus: null,
    identityVerifiedAt: null,
    identityVerifiedNote: null,
    taxId: null,
    paymentStatus: null,
    paymentVerifiedAt: null,
    paymentVerifiedNote: null,
    paymentProfileId: null,
  };
}

async function requestCreatorMonetization<T>(
  label: string,
  request: Promise<{ data: BaseResponse<T> }>,
) {
  console.log(`[CreatorMonetizationAPI] ${label} request:start`);

  try {
    const response = await request;
    console.log(`[CreatorMonetizationAPI] ${label} response:success`, {
      code: response.data.code,
      message: response.data.message,
      data: response.data.data,
    });

    return response.data.data;
  } catch (error) {
    if (axios.isAxiosError<BaseResponse<unknown>>(error)) {
      console.error(`[CreatorMonetizationAPI] ${label} response:error`, {
        status: error.response?.status,
        statusText: error.response?.statusText,
        method: error.config?.method,
        url: error.config?.url,
        baseURL: error.config?.baseURL,
        responseData: error.response?.data,
        withCredentials: error.config?.withCredentials,
      });
    } else {
      console.error(`[CreatorMonetizationAPI] ${label} response:error`, error);
    }

    throw new Error(getApiErrorMessage(error));
  }
}

export async function getCreatorVerificationStatus() {
  const label = "GET /api/v1/creators/verification-status";
  console.log(`[CreatorMonetizationAPI] ${label} request:start`);

  try {
    const response = await httpClient.get<BaseResponse<VerificationStatusDto>>(
      "/api/v1/creators/verification-status",
    );
    console.log(`[CreatorMonetizationAPI] ${label} response:success`, {
      code: response.data.code,
      message: response.data.message,
      data: response.data.data,
    });

    return response.data.data;
  } catch (error) {
    if (axios.isAxiosError<BaseResponse<unknown>>(error)) {
      const responseCode = error.response?.data?.code;
      const shouldTreatAsUnverified =
        error.response?.status === 403 &&
        responseCode === CREATOR_NOT_VERIFIED_CODE;

      if (shouldTreatAsUnverified) {
        const fallbackStatus = createUnverifiedStatus();
        console.warn(
          `[CreatorMonetizationAPI] ${label} response:unverified-fallback`,
          {
            status: error.response?.status,
            code: responseCode,
            message: error.response?.data?.message,
            data: fallbackStatus,
          },
        );

        return fallbackStatus;
      }

      console.error(`[CreatorMonetizationAPI] ${label} response:error`, {
        status: error.response?.status,
        statusText: error.response?.statusText,
        method: error.config?.method,
        url: error.config?.url,
        baseURL: error.config?.baseURL,
        responseData: error.response?.data,
        withCredentials: error.config?.withCredentials,
      });
    } else {
      console.error(`[CreatorMonetizationAPI] ${label} response:error`, error);
    }

    throw new Error(getApiErrorMessage(error));
  }
}

export function getActiveCreatorMonetizationTerm(
  type: CreatorMonetizationTermType,
) {
  return requestCreatorMonetization<TermVersionDto>(
    `GET /api/v1/terms-versions/active/${type}`,
    httpClient.get(`/api/v1/terms-versions/active/${type}`),
  );
}

export function submitCreatorVerification(termsId: string) {
  console.log("[CreatorMonetizationAPI] POST /api/v1/creators/verification payload", {
    termsId,
  });

  return requestCreatorMonetization<VerificationStatusDto>(
    "POST /api/v1/creators/verification",
    httpClient.post("/api/v1/creators/verification", {
      termsId,
    }),
  );
}

export function acceptCreatorMonetizationTerms(versionId: string) {
  return requestCreatorMonetization<TermsLogDto>(
    "POST /api/v1/terms-logs",
    httpClient.post("/api/v1/terms-logs", {
      versionId,
    }),
  );
}

export function updateCreatorTaxIdentity(taxId: string) {
  return requestCreatorMonetization<VerificationStatusDto>(
    "PUT /api/v1/creators/identities/tax",
    httpClient.put("/api/v1/creators/identities/tax", {
      taxId,
    }),
  );
}

export function createPaymentProfile(payload: PaymentProfileRequestDto) {
  return requestCreatorMonetization<PaymentProfileDto>(
    "POST /api/v1/payment-profiles",
    httpClient.post("/api/v1/payment-profiles", payload),
  );
}

export function updatePaymentProfile(
  id: string,
  payload: PaymentProfileRequestDto,
) {
  return requestCreatorMonetization<PaymentProfileDto>(
    `PUT /api/v1/payment-profiles/${id}`,
    httpClient.put(`/api/v1/payment-profiles/${id}`, payload),
  );
}

export function deletePaymentProfile(id: string) {
  return requestCreatorMonetization<void>(
    `DELETE /api/v1/payment-profiles/${id}`,
    httpClient.delete(`/api/v1/payment-profiles/${id}`),
  );
}
