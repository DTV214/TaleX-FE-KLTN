"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { approveMedia, rejectMedia } from "../api/staff-moderation-api";
import { moderationKeys } from "./use-moderation-queries";

export function useApproveMedia() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (mediaId: string) => approveMedia(mediaId),
    onSuccess: () => {
      toast.success("Đã phê duyệt nội dung");
      queryClient.invalidateQueries({ queryKey: moderationKeys.all });
    },
    onError: () => {
      toast.error("Phê duyệt thất bại", { description: "Vui lòng thử lại" });
    },
  });
}

export function useRejectMedia() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ mediaId, reason }: { mediaId: string; reason?: string }) =>
      rejectMedia(mediaId, reason),
    onSuccess: () => {
      toast.success("Đã từ chối nội dung");
      queryClient.invalidateQueries({ queryKey: moderationKeys.all });
    },
    onError: () => {
      toast.error("Từ chối thất bại", { description: "Vui lòng thử lại" });
    },
  });
}
