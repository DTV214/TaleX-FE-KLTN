import {
  httpClient,
  unwrapBaseResponse,
} from "@/shared/api/http-client";

const PUBLIC_ENDPOINT = "/api/v1/violation-label-translations";
const ADMIN_ENDPOINT = "/api/v1/admin/violation-label-translations";

export type ViolationLabelTranslation = {
  id: string;
  awsLabel: string;
  vietnameseText: string;
  category: string;
};

export type ViolationLabelTranslationCreatePayload = {
  awsLabel: string;
  vietnameseText: string;
  category?: string;
};

export type ViolationLabelTranslationUpdatePayload = {
  vietnameseText: string;
  category?: string;
};

type ViolationLabelTranslationApiItem = {
  translationId?: string;
  awsLabel?: string;
  vietnameseText?: string;
  category?: string | null;
};

function normalize(item: ViolationLabelTranslationApiItem): ViolationLabelTranslation {
  return {
    id: item.translationId ?? "",
    awsLabel: item.awsLabel ?? "",
    vietnameseText: item.vietnameseText ?? "",
    category: item.category ?? "",
  };
}

export async function getViolationLabelTranslations() {
  const data = await unwrapBaseResponse<ViolationLabelTranslationApiItem[]>(
    httpClient.get(PUBLIC_ENDPOINT),
  );

  return (data ?? []).map(normalize);
}

export async function createViolationLabelTranslation(
  payload: ViolationLabelTranslationCreatePayload,
) {
  const data = await unwrapBaseResponse<ViolationLabelTranslationApiItem>(
    httpClient.post(ADMIN_ENDPOINT, {
      awsLabel: payload.awsLabel.trim(),
      vietnameseText: payload.vietnameseText.trim(),
      category: payload.category?.trim() || undefined,
    }),
  );

  return normalize(data);
}

export async function updateViolationLabelTranslation(
  id: string,
  payload: ViolationLabelTranslationUpdatePayload,
) {
  const data = await unwrapBaseResponse<ViolationLabelTranslationApiItem>(
    httpClient.put(`${ADMIN_ENDPOINT}/${id}`, {
      vietnameseText: payload.vietnameseText.trim(),
      category: payload.category?.trim() || undefined,
    }),
  );

  return normalize(data);
}

export async function deleteViolationLabelTranslation(id: string) {
  return unwrapBaseResponse<void>(httpClient.delete(`${ADMIN_ENDPOINT}/${id}`));
}
