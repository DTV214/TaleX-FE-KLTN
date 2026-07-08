"use client";

import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { fetchEventSource } from "@microsoft/fetch-event-source";
import { toast } from "sonner";
import type { PipelineEvent } from "../api/pipeline-api";

interface UsePipelineSSEOptions {
  enabled?: boolean;
}

export function usePipelineSSE({ enabled = true }: UsePipelineSSEOptions = {}) {
  const queryClient = useQueryClient();
  const ctrlRef = useRef<AbortController | null>(null);

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
              toast.warning("Phát hiện trùng lặp bản quyền", {
                description: `Nội dung có ${data.violationsCount} đoạn trùng lặp với nội dung đã có trên hệ thống.`,
                duration: 10000,
              });
            } else {
              toast.info("Kiểm tra bản quyền hoàn tất", {
                description: "Không phát hiện vi phạm. Đang tiến hành kiểm duyệt nội dung...",
                duration: 5000,
              });
            }
          } else if (ev.event === "pipeline:moderation_complete") {
            if (data.isSafe) {
              toast.success("Nội dung đã được xuất bản", {
                description: "Nội dung đã qua kiểm duyệt thành công và hiện đang hiển thị trên nền tảng TaleX.",
                duration: 8000,
              });
            } else {
              const violationMap: Record<string, string> = {
                "Explicit Nudity": "nội dung khỏa thân",
                "Violence": "bạo lực",
                "Visually Disturbing": "hình ảnh gây khó chịu",
                "Drugs": "ma túy / chất cấm",
                "Tobacco": "thuốc lá",
                "Alcohol": "rượu bia",
                "Gambling": "cờ bạc",
                "Hate Symbols": "biểu tượng thù hận",
                "Rude Gestures": "cử chỉ thô tục",
              };
              const label = data.primaryLabel
                ? violationMap[data.primaryLabel] || data.primaryLabel
                : "nội dung không phù hợp";
              toast.error("Nội dung không đạt kiểm duyệt", {
                description: `Lý do: Phát hiện ${label}. Nội dung đã bị tạm ẩn. Bạn có thể chỉnh sửa và đăng tải lại.`,
                duration: 15000,
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
              description: `Đã xảy ra lỗi trong quá trình ${step}. ${data.errorMessage || "Vui lòng thử đăng tải lại hoặc liên hệ hỗ trợ."}`,
              duration: 10000,
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
