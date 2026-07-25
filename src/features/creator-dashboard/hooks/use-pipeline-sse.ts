"use client";

import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { fetchEventSource } from "@microsoft/fetch-event-source";
import { toast } from "sonner";
import type { PipelineEvent } from "../api/pipeline-api";
import { translateViolationLabel } from "../utils/media-violations";

interface UsePipelineSSEOptions {
  enabled?: boolean;
  /** Đổi giá trị này (vd đổi view/tab) sẽ tự đóng các toast pipeline đang mở. */
  dismissOnChangeOf?: unknown;
}

export const PIPELINE_TOAST_IDS = [
  "pipeline-copyright-review",
  "pipeline-copyright-ok",
  "pipeline-moderation-ok",
  "pipeline-moderation-review",
  "pipeline-moderation-rejected",
  "pipeline-failed",
];

export function usePipelineSSE({ enabled = true, dismissOnChangeOf }: UsePipelineSSEOptions = {}) {
  const queryClient = useQueryClient();
  const ctrlRef = useRef<AbortController | null>(null);

  // Đóng toast pipeline khi user chuyển view/tab khác — không để tồn tại xuyên suốt
  // dashboard vì duration giờ là Infinity (chỉ tự đóng khi bấm X hoặc chuyển view).
  useEffect(() => {
    return () => {
      PIPELINE_TOAST_IDS.forEach((id) => toast.dismiss(id));
    };
  }, [dismissOnChangeOf]);

  useEffect(() => {
    if (!enabled) return;

    const ctrl = new AbortController();
    ctrlRef.current = ctrl;

    fetchEventSource("/api/v1/sse/pipeline/connect", {
      signal: ctrl.signal,
      credentials: "include",

      onmessage(ev) {
        if (ev.event === "heartbeat" || ev.event === "connected") return;

        try {
          const data: PipelineEvent = JSON.parse(ev.data);

          if (ev.event === "pipeline:copyright_complete") {
            if (data.isDuplicate && (data.violationsCount ?? 0) > 0) {
              // Không còn tự động chặn cứng — chỉ máy phát hiện "giống nhau", cần Staff
              // xem lại mới kết luận được có thật sự vi phạm hay không (xem BE).
              toast.warning("Nội dung đang chờ đội kiểm duyệt xác nhận", {
                id: "pipeline-copyright-review",
                description: `Phát hiện ${data.violationsCount} đoạn giống nội dung đã có trên hệ thống của creator khác — cần đội kiểm duyệt xác nhận thủ công trước khi xuất bản.`,
                duration: Infinity,
              });
            } else {
              toast.info("Kiểm tra bản quyền hoàn tất", {
                id: "pipeline-copyright-ok",
                description: "Không phát hiện vi phạm. Đang tiến hành kiểm duyệt nội dung...",
                duration: Infinity,
              });
            }
          } else if (ev.event === "pipeline:moderation_complete") {
            const label = translateViolationLabel(data.primaryLabel);

            if (data.isSafe) {
              // "Đã qua kiểm duyệt" — KHÔNG phải "đã xuất bản". Xuất bản là hành động
              // Creator chủ động bấm ở bước cuối (XUẤT BẢN); pass kiểm duyệt chỉ nghĩa
              // là trang này sẵn sàng, chưa chắc đã hiển thị công khai trên nền tảng.
              toast.success("Nội dung đã qua kiểm duyệt", {
                id: "pipeline-moderation-ok",
                description: "Trang đã kiểm duyệt thành công, sẵn sàng để xuất bản. Nhấn Xuất bản ở bước cuối để công khai.",
                duration: Infinity,
              });
            } else if (data.approvalStatus === "PENDING_REVIEW") {
              // Nhãn nhạy cảm có thể hợp lệ tùy bối cảnh — không tự động từ chối, đẩy qua
              // đội kiểm duyệt xét duyệt thủ công (khác hẳn bị từ chối vĩnh viễn).
              toast.warning("Nội dung đang chờ đội kiểm duyệt xác nhận", {
                id: "pipeline-moderation-review",
                description: `Phát hiện ${label} — cần đội kiểm duyệt xác nhận thủ công trước khi xuất bản.`,
                duration: Infinity,
              });
            } else {
              toast.error("Nội dung chưa đạt yêu cầu kiểm duyệt", {
                id: "pipeline-moderation-rejected",
                description: `Lý do: phát hiện ${label}. Nội dung đã bị tạm ẩn — vui lòng chỉnh sửa hoặc thay thế nội dung trước khi tải lên lại.`,
                duration: Infinity,
              });
            }
          } else if (ev.event === "pipeline:failed") {
            const errorMap: Record<string, string> = {
              "COPYRIGHT": "kiểm tra bản quyền",
              "MODERATION": "kiểm duyệt nội dung",
            };
            const step = data.failedStep
              ? errorMap[data.failedStep] || data.failedStep
              : "xử lý";
            toast.error("Xử lý nội dung thất bại", {
              id: "pipeline-failed",
              description: `Đã xảy ra lỗi trong quá trình ${step}. ${data.errorMessage || "Vui lòng thử đăng tải lại hoặc liên hệ hỗ trợ."}`,
              duration: Infinity,
            });
          }

          queryClient.invalidateQueries({ queryKey: ["creator-dashboard", "media"] });
          queryClient.invalidateQueries({
            queryKey: ["creator-dashboard", "media-violations", data.mediaId],
          });
          queryClient.invalidateQueries({ queryKey: ["creator-dashboard", "episodes"] });
          queryClient.invalidateQueries({ queryKey: ["media"] });
          queryClient.invalidateQueries({ queryKey: ["episodes"] });
        } catch {
          // Ignore parse errors for non-JSON events
        }
      },

      onerror(err) {
        console.error("SSE connection error:", err);
      },
    });

    return () => {
      ctrl.abort();
      ctrlRef.current = null;
    };
  }, [enabled, queryClient]);
}
