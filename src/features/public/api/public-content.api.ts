import {
  httpClient,
  type BasePageResponse,
  type BaseResponse,
} from "@/shared/api/http-client";

export type PublicComboEpisode = {
  episodeId: string;
  title: string;
  episodeNumber?: number;
  priceVnd?: number;
  seasonId?: string;
  seasonTitle?: string;
  seriesId?: string;
  seriesTitle?: string;
  thumbnail?: string;
};

export type PublicCombo = {
  comboId: string;
  creatorId?: string;
  title: string;
  description?: string;
  status?: string;
  priceVnd: number;
  originalPriceVnd?: number;
  episodes?: PublicComboEpisode[];
  createdAt?: string;
  updatedAt?: string;
};

type PublicCombosPayload = PublicCombo[] | BasePageResponse<PublicCombo>;

function isPagedCombosPayload(
  value: PublicCombosPayload,
): value is BasePageResponse<PublicCombo> {
  return !Array.isArray(value) && Array.isArray(value.content);
}

export async function getPublicCombos(): Promise<PublicCombo[]> {
  const response = await httpClient.get<BaseResponse<PublicCombosPayload>>(
    "/api/v1/public/combos",
  );
  const payload = response.data.data;

  if (Array.isArray(payload)) {
    return payload;
  }

  if (isPagedCombosPayload(payload)) {
    return payload.content;
  }

  return [];
}
