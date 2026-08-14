"use client";

import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { fetchEventSource } from "@microsoft/fetch-event-source";
import { toast } from "sonner";
import type { PipelineEvent } from "../api/pipeline-api";
import { useViolationLabelMap, violationLabelMapQueryKey } from "@/shared/hooks/use-violation-label-map";
import { makeTranslate } from "@/shared/utils/violation-label-translate";

interface UsePipelineSSEOptions {
  enabled?: boolean;
  /** Đổi giá trị này (vd đổi view/tab) sẽ tự đóng các toast pipeline đang mở. */
  dismissOnChangeOf?: unknown;
  /**
   * Trả về true nếu mediaId thuộc 1 đợt comic nhiều trang (>1 ảnh) — khi đó ẩn TOÀN BỘ
   * toast kết quả riêng lẻ của TỪNG trang (đạt/chờ duyệt/từ chối), vì push N ảnh vi phạm
   * cùng lúc trước đây bắn ra N toast chồng nhau (mỗi toast duration:Infinity, Creator phải
   * bấm X từng cái một). Toast tổng kết cả đợt (batch-summary, bắn từ component cha) + panel
   * ComicPipelineAggregateSummary đã đủ để báo kết quả — chỉ show toast riêng lẻ khi có <=1 ảnh.
   */
  shouldSuppressToast?: (mediaId: string) => boolean;
}

type PipelineToastKind =
  | "copyright-review"
  | "copyright-ok"
  | "moderation-ok"
  | "moderation-review"
  | "moderation-rejected"
  | "staff-rejected"
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
  shouldSuppressToast,
}: UsePipelineSSEOptions = {}) {
  const queryClient = useQueryClient();
  // Chỉ để làm nóng cache violationLabelMapQueryKey lúc mount — onmessage bên dưới chạy
  // trong callback imperative (SSE), không gọi hook render được nên phải đọc thẳng từ
  // queryClient.getQueryData() thay vì destructure translate() ở đây.
  useViolationLabelMap();
  const ctrlRef = useRef<AbortController | null>(null);
  const activeToastIdsRef = useRef<Set<string>>(new Set());
  // Ref để onmessage (đóng 1 lần khi effect mount, xem dep [enabled, queryClient] bên
  // dưới) luôn đọc được callback mới nhất mà không phải reconnect SSE mỗi lần đổi trang.
  const shouldSuppressToastRef = useRef(shouldSuppressToast);
  useEffect(() => {
    shouldSuppressToastRef.current = shouldSuppressToast;
  }, [shouldSuppressToast]);

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
              if (!shouldSuppressToastRef.current?.(data.mediaId)) {
                const id = pipelineToastId("copyright-review", data.mediaId);
                registerToast(id);
                toast.warning("Nội dung cần kiểm duyệt thủ công", {
                  id,
                  description: `Phát hiện ${data.violationsCount} đoạn giống nội dung đã có trên hệ thống của creator khác — vui lòng chờ xác nhận thủ công trước khi xuất bản.`,
                  duration: Infinity,
                });
              }
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
            const violationLabelMap =
              queryClient.getQueryData<Record<string, string>>(violationLabelMapQueryKey) ?? {};
            const label = makeTranslate(violationLabelMap)(data.primaryLabel);

            if (data.isSafe) {
              // "Đã qua kiểm duyệt" — KHÔNG phải "đã xuất bản". Xuất bản là hành động
              // Creator chủ động bấm ở bước cuối (XUẤT BẢN); pass kiểm duyệt chỉ nghĩa
              // là trang này sẵn sàng, chưa chắc đã hiển thị công khai trên nền tảng.
              if (!shouldSuppressToastRef.current?.(data.mediaId)) {
                const id = pipelineToastId("moderation-ok", data.mediaId);
                registerToast(id);
                toast.success("Nội dung đã qua kiểm duyệt", {
                  id,
                  description: "Trang đã kiểm duyệt thành công, sẵn sàng để xuất bản. Nhấn Xuất bản ở bước cuối để công khai.",
                  duration: Infinity,
                });
              }
            } else if (data.approvalStatus === "APPROVED") {
              // MỚI: AI phát hiện nhãn nhạy cảm (isSafe=false) nhưng series đã khai báo
              // trước đúng "Cảnh báo nội dung" + đủ 18+ (xem ContentPipelineServiceImpl.
              // areAllViolationsShieldedByDeclaredWarnings) — hệ thống tự động duyệt,
              // KHÔNG đẩy Staff review. Phải tách riêng khỏi nhánh isSafe true ở trên vì
              // lý do khác nhau (nội dung sạch hoàn toàn vs nội dung nhạy cảm đã được khai
              // báo trước) — Creator nên biết rõ AI thực sự có phát hiện gì hay không.
              if (!shouldSuppressToastRef.current?.(data.mediaId)) {
                const id = pipelineToastId("moderation-ok", data.mediaId);
                registerToast(id);
                toast.success("Nội dung đã qua kiểm duyệt", {
                  id,
                  description: `Phát hiện ${label} nhưng đã tự động duyệt vì series đã khai báo trước cảnh báo nội dung phù hợp. Sẵn sàng để xuất bản.`,
                  duration: Infinity,
                });
              }
            } else if (data.approvalStatus === "PENDING_REVIEW") {
              // Nhãn nhạy cảm có thể hợp lệ tùy bối cảnh — không tự động từ chối, đẩy qua
              // đội kiểm duyệt xét duyệt thủ công (khác hẳn bị từ chối vĩnh viễn).
              if (!shouldSuppressToastRef.current?.(data.mediaId)) {
                const id = pipelineToastId("moderation-review", data.mediaId);
                registerToast(id);
                toast.warning("Nội dung cần kiểm duyệt thủ công", {
                  id,
                  description: `Phát hiện ${label} — vui lòng chờ xác nhận thủ công trước khi xuất bản.`,
                  duration: Infinity,
                });
              }
            } else if (!shouldSuppressToastRef.current?.(data.mediaId)) {
              const id = pipelineToastId("moderation-rejected", data.mediaId);
              registerToast(id);
              toast.error("Nội dung chưa đạt yêu cầu kiểm duyệt", {
                id,
                description: `Lý do: phát hiện ${label}. Nội dung đã bị tạm ẩn — vui lòng chỉnh sửa hoặc thay thế nội dung trước khi tải lên lại.`,
                duration: Infinity,
              });
            }
          } else if (ev.event === "pipeline:staff_rejected") {
            // Staff duyệt tay từ chối kèm lý do (khác nhánh moderation-rejected ở trên —
            // đó là lúc AI tự flag lúc upload, cái này bắn MUỘN HƠN, lúc Staff thật sự
            // bấm nút Từ chối trên trang kiểm duyệt, có thể sau upload rất lâu).
            if (!shouldSuppressToastRef.current?.(data.mediaId)) {
              const id = pipelineToastId("staff-rejected", data.mediaId);
              registerToast(id);
              toast.error("Nội dung bị từ chối", {
                id,
                description: data.reviewerNotes
                  ? `Lý do từ kiểm duyệt viên: ${data.reviewerNotes}`
                  : "Nội dung đã bị từ chối sau khi Staff xem xét thủ công.",
                duration: Infinity,
              });
            }
          } else if (ev.event === "pipeline:failed") {
            if (!shouldSuppressToastRef.current?.(data.mediaId)) {
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
