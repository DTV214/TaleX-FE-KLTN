"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  approveMedia,
  getMediaViolations,
  getPendingMedia,
  rejectMedia,
} from "@/features/admin/api/moderation.api";

export const moderationKeys = {
  all: ["admin", "moderation"] as const,
  pending: (page: number, size: number) =>
    [...moderationKeys.all, "pending", page, size] as const,
  violations: (mediaId: string) =>
    [...moderationKeys.all, "violations", mediaId] as const,
};

export function useMediaViolations(mediaId: string | null) {
  return useQuery({
    queryKey: moderationKeys.violations(mediaId ?? ""),
    queryFn: () => getMediaViolations(mediaId!),
    enabled: Boolean(mediaId),
  });
}

export function useGetPendingMedia(page = 0, size = 12) {
  return useQuery({
    queryKey: moderationKeys.pending(page, size),
    queryFn: () => getPendingMedia(page, size),
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
