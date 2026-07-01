import { httpClient, unwrapBaseResponse } from "@/shared/api/http-client";
import { EpisodeStatus } from "@/features/creator-dashboard/api/creator-content-api";

export type ComboEpisodeResponse = {
  comboId: string;
  creatorId: string;
  title: string;
  description: string;
  status: EpisodeStatus;
  priceVnd: number;
  originalPriceVnd: number;
  episodes: {
    episodeId: string;
    title: string;
    episodeNumber: number;
    priceVnd: number;
    seasonId: string;
    seasonTitle: string;
    seriesTitle: string;
  }[];
  createdAt: string;
  updatedAt: string;
};

export type ComboEpisodeRequest = {
  title: string;
  description: string;
  status: EpisodeStatus;
  priceVnd: number;
  episodeIds: string[];
};

export async function listCombos(): Promise<ComboEpisodeResponse[]> {
  return unwrapBaseResponse<ComboEpisodeResponse[]>(httpClient.get("/api/v1/combos"));
}

export async function getCombo(id: string): Promise<ComboEpisodeResponse> {
  return unwrapBaseResponse<ComboEpisodeResponse>(httpClient.get(`/api/v1/combos/${id}`));
}

export async function createCombo(
  payload: ComboEpisodeRequest
): Promise<ComboEpisodeResponse> {
  return unwrapBaseResponse<ComboEpisodeResponse>(httpClient.post("/api/v1/combos", payload));
}

export async function updateCombo(
  id: string,
  payload: ComboEpisodeRequest
): Promise<ComboEpisodeResponse> {
  return unwrapBaseResponse<ComboEpisodeResponse>(httpClient.put(`/api/v1/combos/${id}`, payload));
}

export async function deleteCombo(id: string): Promise<void> {
  return unwrapBaseResponse<void>(httpClient.delete(`/api/v1/combos/${id}`));
}
