import axios from "axios";
import { httpClient, type BaseResponse } from "@/shared/api/http-client";

export type CreatorTermsVersion = {
  id: string;
  version: string;
  type: "CREATOR";
  content: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string | null;
};

export type OwnCreatorResponse = {
  creatorId: string;
  accountId?: string;
  displayName?: string;
  avatarUrl?: string;
  bio?: string;
  status?: string;
  createdAt?: string;
  isAcceptedLatestTerms: boolean;
  termsVersion?: CreatorTermsVersion | null;
};

export type RegisterCreatorResponse = OwnCreatorResponse;

export type TermsLogResponse = {
  termsLogId?: string;
  termsVersionId?: string;
  creatorId?: string;
  accountId?: string;
  acceptedAt?: string;
};

export const creatorOnboardingKeys = {
  all: ["creator-onboarding"] as const,
  ownCreator: () => [...creatorOnboardingKeys.all, "own-creator"] as const,
  activeCreatorTerms: () =>
    [...creatorOnboardingKeys.all, "active-creator-terms"] as const,
};

export function isCreatorNotFoundError(error: unknown) {
  return (
    axios.isAxiosError<BaseResponse<unknown>>(error) &&
    error.response?.data?.code === 4041
  );
}

export function shouldRetryOwnCreatorQuery(
  failureCount: number,
  error: unknown,
) {
  if (isCreatorNotFoundError(error)) {
    return false;
  }

  return failureCount < 1;
}

export async function getOwnCreator() {
  const response = await httpClient.get<BaseResponse<OwnCreatorResponse>>(
    "/api/v1/creators/own",
  );

  return response.data.data;
}

export async function getActiveCreatorTerms() {
  const response = await httpClient.get<BaseResponse<CreatorTermsVersion>>(
    "/api/v1/terms-versions/active/CREATOR",
  );

  return response.data.data;
}

export async function registerCreator(termsId: string) {
  const response = await httpClient.post<BaseResponse<RegisterCreatorResponse>>(
    "/api/v1/creators",
    {
      termsId,
    },
  );

  return response.data.data;
}

export async function acceptNewTerms(versionId: string) {
  const response = await httpClient.post<BaseResponse<TermsLogResponse>>(
    "/api/v1/terms-logs",
    {
      versionId,
    },
  );

  return response.data.data;
}
