"use client";

import { Loader2 } from "lucide-react";
import {
  type ModerationTargetDetail,
  type ReportTargetType,
} from "../api/moderation-reports.api";
import { useModerationTargetDetail } from "../hooks/use-moderation-reports";
import { labelForTargetType } from "../utils/moderation-labels";

type Props = {
  targetType?: ReportTargetType | null;
  targetId?: string | null;
  fallbackTitle?: string;
  showId?: boolean;
};

function shortId(value?: string | null) {
  if (!value) return "-";
  if (value.length <= 14) return value;
  return `${value.slice(0, 8)}...${value.slice(-6)}`;
}

export function getTargetDisplayTitle(
  detail?: ModerationTargetDetail | null,
  fallbackTitle?: string,
) {
  return detail?.title || fallbackTitle || "Chưa có thông tin đối tượng";
}

export function ModerationTargetSummary({
  fallbackTitle,
  showId = true,
  targetId,
  targetType,
}: Props) {
  const detailQuery = useModerationTargetDetail(
    targetType && targetId ? { targetType, targetId } : null,
  );
  const detail = detailQuery.data;

  return (
    <div className="min-w-0">
      <div className="flex min-w-0 items-center gap-2">
        {detailQuery.isLoading && (
          <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-slate-400" />
        )}
        <p
          className="truncate font-black text-slate-800 backoffice-dark:text-white"
          title={detail?.title ?? fallbackTitle ?? targetId ?? undefined}
        >
          {getTargetDisplayTitle(detail, fallbackTitle)}
        </p>
      </div>
      <p className="mt-1 truncate text-xs font-semibold text-slate-500 backoffice-dark:text-white/55">
        {labelForTargetType(targetType ?? undefined)}
        {detail?.subtitle ? ` · ${detail.subtitle}` : ""}
      </p>
      {showId && targetId && (
        <p className="mt-1 truncate text-[11px] font-semibold text-slate-400">
          Mã: {shortId(targetId)}
        </p>
      )}
      {detailQuery.isError && (
        <p className="mt-1 text-[11px] font-semibold text-amber-600">
          Chưa lấy được chi tiết, tạm hiển thị mã đối tượng.
        </p>
      )}
    </div>
  );
}
