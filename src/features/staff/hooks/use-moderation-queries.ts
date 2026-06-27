"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchPendingMedia } from "../api/staff-moderation-api";

export const moderationKeys = {
  all: ["moderation"] as const,
  pending: (page: number, size: number) =>
    [...moderationKeys.all, "pending", page, size] as const,
};

export function usePendingMedia(page = 0, size = 20) {
  return useQuery({
    queryKey: moderationKeys.pending(page, size),
    queryFn: () => fetchPendingMedia(page, size),
  });
}
