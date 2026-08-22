import { httpClient, unwrapBaseResponse } from "@/shared/api/http-client";

export type CreatorIdentityStatus =
  | "PENDING"
  | "IN_PROGRESS"
  | "APPROVED"
  | "REJECTED"
  | "AWAITING_FILL"
  | (string & {});

export type CreatorIdentityProfile = {
  creatorIdentityId: string;
  creatorId: string;
  accountName: string;
  idNumber: string | null;
  fullName: string | null;
  dob: string | null;
  sex: string | null;
  address: string | null;
  doe: string | null;
  status: CreatorIdentityStatus;
  taxId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type UpdateCreatorIdentityProfilePayload = {
  idNumber: string;
  fullName: string;
  dob: string;
  sex: string;
  address: string;
  doe: string;
  taxId: string;
};

export const creatorIdentityProfileKeys = {
  all: ["creator-identity-profile"] as const,
  own: () => [...creatorIdentityProfileKeys.all, "own"] as const,
};

export async function getOwnCreatorIdentityProfile() {
  return unwrapBaseResponse<CreatorIdentityProfile>(
    httpClient.get("/api/v1/creators/identities/own"),
  );
}

export async function updateCreatorIdentityProfile(
  id: string,
  payload: UpdateCreatorIdentityProfilePayload,
) {
  return unwrapBaseResponse<CreatorIdentityProfile | string>(
    httpClient.put(`/api/v1/creators/identities/${id}`, payload),
  );
}
