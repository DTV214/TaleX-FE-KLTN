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
  /**
   * Trả về true nếu mediaId thuộc 1 đợt comic nhiều trang (>1 ảnh) — khi đó ẩn toast
   * "Nội dung đã qua kiểm duyệt" xanh của TỪNG trang, vì thấy toast "đã xong, sẵn sàng
   * xuất bản" của 1 trang trong khi trang khác cùng đợt còn đang chờ duyệt/bị từ chối
   * dễ gây hiểu nhầm "cả episode đã ổn". Toast tổng kết cả đợt (batch-summary, bắn từ
   * component cha) đã đủ để báo kết quả — chỉ show xanh riêng lẻ khi có <=1 ảnh.
   */
  shouldSuppressSuccessToast?: (mediaId: string) => boolean;
}

type PipelineToastKind =
  | "copyright-review"
  | "copyright-ok"
  | "moderation-ok"
  | "moderation-review"
  | "moderation-rejected"
  | "failed"
  | "batch-summary";

// Toast id theo TỪNG mediaId — trước đây id cố định theo loại sự kiện (vd luôn
// "pipeline-moderation-ok") khiến khi xử lý nhiều trang comic song song, kết quả của
// trang sau GHI ĐÈ lên toast của trang trước (Sonner coi cùng id là cùng 1 toast, chỉ
// cập nhật nội dung) — trang nào đạt/lỗi ra kết quả sau cùng mới là toast còn hiển thị,
// làm mất thông báo của các trang khác trong cùng đợt xử lý.
export const pipelineToastId = (kind: PipelineToastKind, mediaId: string) => `pipeline-${kind}-${mediaId}`;

export function usePipelineSSE({
  enabled = true,
  dismissOnChangeOf,
  shouldSuppressSuccessToast,
}: UsePipelineSSEOptions = {}) {
  const queryClient = useQueryClient();
  const ctrlRef = useRef<AbortController | null>(null);
  const activeToastIdsRef = useRef<Set<string>>(new Set());
  // Ref để onmessage (đóng 1 lần khi effect mount, xem dep [enabled, queryClient] bên
  // dưới) luôn đọc được callback mới nhất mà không phải reconnect SSE mỗi lần đổi trang.
  const shouldSuppressSuccessToastRef = useRef(shouldSuppressSuccessToast);
  useEffect(() => {
    shouldSuppressSuccessToastRef.current = shouldSuppressSuccessToast;
  }, [shouldSuppressSuccessToast]);

  // Đóng toast pipeline khi user chuyển view/tab khác — không để tồn tại xuyên suốt
  // dashboard vì duration giờ là Infinity (chỉ tự đóng khi bấm X hoặc chuyển view).
  // Id giờ động theo mediaId nên phải tự theo dõi danh sách id đã bắn ra (thay vì
  // danh sách cố định) để dismiss đúng hết khi rời view.
  useEffect(() => {
    return () => {
      activeToastIdsRef.current.forEach((id) => toast.dismiss(id));
      activeToastIdsRef.current.clear();
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
          const registerToast = (id: string) => activeToastIdsRef.current.add(id);

          if (ev.event === "pipeline:copyright_complete") {
            if (data.isDuplicate && (data.violationsCount ?? 0) > 0) {
              // Không còn tự động chặn cứng — chỉ máy phát hiện "giống nhau", cần Staff
              // xem lại mới kết luận được có thật sự vi phạm hay không (xem BE).
              const id = pipelineToastId("copyright-review", data.mediaId);
              registerToast(id);
              toast.warning("Nội dung đang chờ đội kiểm duyệt xác nhận", {
                id,
                description: `Phát hiện ${data.violationsCount} đoạn giống nội dung đã có trên hệ thống của creator khác — cần đội kiểm duyệt xác nhận thủ công trước khi xuất bản.`,
                duration: Infinity,
              });
            } else {
              const id = pipelineToastId("copyright-ok", data.mediaId);
              registerToast(id);
              toast.info("Kiểm tra bản quyền hoàn tất", {
                id,
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
              if (!shouldSuppressSuccessToastRef.current?.(data.mediaId)) {
                const id = pipelineToastId("moderation-ok", data.mediaId);
                registerToast(id);
                toast.success("Nội dung đã qua kiểm duyệt", {
                  id,
                  description: "Trang đã kiểm duyệt thành công, sẵn sàng để xuất bản. Nhấn Xuất bản ở bước cuối để công khai.",
                  duration: Infinity,
                });
              }
            } else if (data.approvalStatus === "PENDING_REVIEW") {
              // Nhãn nhạy cảm có thể hợp lệ tùy bối cảnh — không tự động từ chối, đẩy qua
              // đội kiểm duyệt xét duyệt thủ công (khác hẳn bị từ chối vĩnh viễn).
              const id = pipelineToastId("moderation-review", data.mediaId);
              registerToast(id);
              toast.warning("Nội dung đang chờ đội kiểm duyệt xác nhận", {
                id,
                description: `Phát hiện ${label} — cần đội kiểm duyệt xác nhận thủ công trước khi xuất bản.`,
                duration: Infinity,
              });
            } else {
              const id = pipelineToastId("moderation-rejected", data.mediaId);
              registerToast(id);
              toast.error("Nội dung chưa đạt yêu cầu kiểm duyệt", {
                id,
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
            const id = pipelineToastId("failed", data.mediaId);
            registerToast(id);
            toast.error("Xử lý nội dung thất bại", {
              id,
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
