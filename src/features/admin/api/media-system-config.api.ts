import {
  httpClient,
  unwrapBaseResponse,
} from "@/shared/api/http-client";

export type MediaSystemConfig = {
  configId: string;
  maxComicImages: number;
  maxComicImageSizeMb: number;
  maxVideoSizeMb: number;
};

export type MediaSystemConfigPayload = {
  maxComicImages: number;
  maxComicImageSizeMb: number;
  maxVideoSizeMb: number;
};

export const mediaSystemConfigApi = {
  getConfig: () =>
    unwrapBaseResponse<MediaSystemConfig>(
      httpClient.get("/api/v1/media-system-configs")
    ),
      
  updateConfig: (payload: MediaSystemConfigPayload) =>
    unwrapBaseResponse<MediaSystemConfig>(
      httpClient.put("/api/v1/admin/media-system-configs", payload)
    ),
};
