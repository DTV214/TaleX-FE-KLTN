"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  approveMedia,
  type ApprovedReviewFilter,
  forceHideEpisode,
  forceUnhideEpisode,
  getApprovedMedia,
  getMediaById,
  getMediaViolations,
  getPendingMedia,
  type ModerationTypeFilter,
  rejectMedia,
} from "@/features/admin/api/moderation.api";

export const moderationKeys = {
  all: ["admin", "moderation"] as const,
  pending: (page: number, size: number, mediaType: ModerationTypeFilter) =>
    [...moderationKeys.all, "pending", page, size, mediaType] as const,
  approved: (
    page: number,
    size: number,
    filter: ApprovedReviewFilter,
    mediaType: ModerationTypeFilter,
  ) => [...moderationKeys.all, "approved", page, size, filter, mediaType] as const,
  violations: (mediaId: string) =>
    [...moderationKeys.all, "violations", mediaId] as const,
  mediaDetail: (mediaId: string) =>
    [...moderationKeys.all, "media-detail", mediaId] as const,
};

export function useMediaViolations(mediaId: string | null) {
  return useQuery({
    queryKey: moderationKeys.violations(mediaId ?? ""),
    queryFn: () => getMediaViolations(mediaId!),
    enabled: Boolean(mediaId),
  });
}

// Dùng cho nút "Xem nội dung gốc" — chỉ fetch khi modal thật sự mở (enabled), tránh gọi
// thừa API khi admin chỉ đang xem danh sách vi phạm mà chưa bấm xem chi tiết nội dung gốc.
export function useMediaDetail(mediaId: string | null) {
  return useQuery({
    queryKey: moderationKeys.mediaDetail(mediaId ?? ""),
    queryFn: () => getMediaById(mediaId!),
    enabled: Boolean(mediaId),
    retry: false,
  });
}

export function useGetPendingMedia(
  page = 0,
  size = 12,
  mediaType: ModerationTypeFilter = "all",
) {
  return useQuery({
    queryKey: moderationKeys.pending(page, size, mediaType),
    queryFn: () => getPendingMedia(page, size, mediaType),
    staleTime: 30 * 1000,
  });
}

export function useApproveMedia() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => approveMedia(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: moderationKeys.all });
    },
  });
}

export function useRejectMedia() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      rejectMedia(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: moderationKeys.all });
    },
  });
}

export function useGetApprovedMedia(
  page = 0,
  size = 12,
  filter: ApprovedReviewFilter = "all",
  mediaType: ModerationTypeFilter = "all",
) {
  return useQuery({
    queryKey: moderationKeys.approved(page, size, filter, mediaType),
    queryFn: () => getApprovedMedia(page, size, filter, mediaType),
    staleTime: 30 * 1000,
  });
}

export function useForceHideEpisode() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (episodeId: string) => forceHideEpisode(episodeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: moderationKeys.all });
    },
  });
}

export function useForceUnhideEpisode() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (episodeId: string) => forceUnhideEpisode(episodeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: moderationKeys.all });
    },
  });
}
