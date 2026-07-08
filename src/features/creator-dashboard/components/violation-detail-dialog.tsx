"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import {
  fetchMediaViolations,
  type MediaViolationsResponse,
} from "../api/pipeline-api";
import {
  getBlockingCopyrightViolations,
  getPermittedCopyrightMatches,
  getRejectedCensorshipResults,
} from "@/features/creator-dashboard/utils/media-violations";

interface ViolationDetailDialogProps {
  mediaId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ViolationDetailDialog({
  mediaId,
  open,
  onOpenChange,
}: ViolationDetailDialogProps) {
  const [data, setData] = useState<MediaViolationsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const blockingCopyright = getBlockingCopyrightViolations(data ?? undefined);
  const permittedCopyright = getPermittedCopyrightMatches(data ?? undefined);
  const rejectedCensorship = getRejectedCensorshipResults(data ?? undefined);

  useEffect(() => {
    if (!open || !mediaId) return;
    setLoading(true);
    fetchMediaViolations(mediaId)
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [open, mediaId]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Chi tiết vi phạm</DialogTitle>
        </DialogHeader>

        {loading && (
          <p className="text-muted-foreground py-4">Đang tải...</p>
        )}

        {data && (
          <div className="space-y-6">
            {data.copyrightViolations.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-white mb-3">
                  Kết quả đối chiếu bản quyền ({data.copyrightViolations.length})
                </h3>
                <div className="space-y-3">
                  {data.copyrightViolations.map((v) => (
                    <div
                      key={v.mediaCopyrightId}
                      className={`rounded-lg border p-3 text-sm ${
                        v.isValid
                          ? "border-green-500/20 bg-green-500/5"
                          : "border-red-500/20 bg-red-500/5"
                      }`}
                    >
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="text-muted-foreground">
                            Đoạn trùng:
                          </span>{" "}
                          {fmt(v.startTimeTarget)} - {fmt(v.endTimeTarget)}
                        </div>
                        <div>
                          <span className="text-muted-foreground">
                            Độ trùng:
                          </span>{" "}
                          <span className="text-red-400 font-medium">
                            {((v.similarityScore ?? 0) * 100).toFixed(0)}%
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Loại:</span>{" "}
                          {v.violationType}
                        </div>
                        {v.isValid && (
                          <div className="text-green-400">
                            CC0 — Được phép sử dụng
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {data.censorshipResults.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-amber-400 mb-3">
                  Kiểm duyệt nội dung
                </h3>
                {data.censorshipResults.map((c) => (
                  <div key={c.censorshipId} className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <span
                        className={
                          c.status === "APPROVED"
                            ? "text-green-400"
                            : "text-red-400"
                        }
                      >
                        {c.status === "APPROVED"
                          ? "Đạt"
                          : c.status === "REJECTED"
                            ? "Không đạt"
                            : c.status}
                      </span>
                      {c.primaryViolationLabel && (
                        <span className="text-muted-foreground">
                          — {c.primaryViolationLabel}
                        </span>
                      )}
                    </div>
                    {c.violationDetails && c.violationDetails.length > 0 && (
                      <div className="space-y-2 pl-3 border-l border-amber-500/20">
                        {c.violationDetails.map((d) => (
                          <div
                            key={d.violationDetailId}
                            className="text-sm rounded bg-amber-500/5 p-2"
                          >
                            <div className="font-medium text-amber-300">
                              {d.label}
                            </div>
                            <div className="text-muted-foreground">
                              {d.violationAt != null &&
                                `Tại ${fmt(d.violationAt / 1000)}`}
                              {d.confidence != null &&
                                ` — Độ tin cậy: ${d.confidence.toFixed(0)}%`}
                            </div>
                            {d.suggestion && (
                              <div className="text-xs text-muted-foreground mt-1">
                                {d.suggestion}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {blockingCopyright.length === 0 &&
              permittedCopyright.length === 0 &&
              rejectedCensorship.length === 0 &&
              data.censorshipResults.length === 0 && (
                <p className="text-muted-foreground py-4">
                  Không có dữ liệu vi phạm.
                </p>
              )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function fmt(seconds?: number): string {
  if (seconds == null) return "--:--";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}
