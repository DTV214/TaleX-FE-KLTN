import { httpClient } from "@/shared/api/http-client";

export interface PendingMediaItem {
  mediaId: string;
  episodeId: string;
  mediaType: string;
  mimeType: string;
  fileUrl?: string;
  thumbnailUrl?: string;
  originalUrl?: string;
  status: string;
  approvalStatus: string;
  contentId?: string;
  errorMessage?: string;
  createdAt: string;
  createdBy?: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  pageNumber: number;
  pageSize: number;
  isFirst: boolean;
  isLast: boolean;
}

export async function fetchPendingMedia(
  page = 0,
  size = 20,
): Promise<PageResponse<PendingMediaItem>> {
  const response = await httpClient.get("/api/v1/media/pending-review", {
    params: { page, size },
  });
  return response.data;
}

export async function approveMedia(mediaId: string): Promise<void> {
  await httpClient.patch(`/api/v1/media/${mediaId}/approve`);
}

export async function rejectMedia(
  mediaId: string,
  reason?: string,
): Promise<void> {
  await httpClient.patch(`/api/v1/media/${mediaId}/reject`, { reason });
}
