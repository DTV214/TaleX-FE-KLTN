"use client";

import { type FormEvent, useMemo, useState } from "react";
import { Ban, ChevronLeft, ChevronRight, Loader2, RefreshCcw, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import {
  type Penalty,
  type PenaltyLevel,
  type PenaltyStatus,
  type ReportTargetType,
} from "../api/moderation-reports.api";
import {
  usePenalties,
  useRevokePenalty,
} from "../hooks/use-moderation-reports";
import {
  formatDateTime,
  labelForPenaltyLevel,
  labelForPenaltyStatus,
  labelForTargetType,
  penaltyLevelOptions,
  penaltyStatusOptions,
  reportTargetOptions,
  statusTone,
} from "../utils/moderation-labels";

const PAGE_SIZE = 20;

function PenaltyRevokeModal({
  penalty,
  onClose,
}: {
  penalty: Penalty | null;
  onClose: () => void;
}) {
  const [reason, setReason] = useState("");
  const revokeMutation = useRevokePenalty();

  if (!penalty) return null;
  const currentPenalty = penalty;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = reason.trim();
    if (!trimmed) {
      toast.error("Vui lòng nhập lý do gỡ hình phạt.");
      return;
    }
    await revokeMutation.mutateAsync({ penaltyId: currentPenalty.penaltyId, reason: trimmed });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/60 px-4 backdrop-blur-sm">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl"
      >
        <h2 className="text-lg font-black text-slate-950">Gỡ hình phạt</h2>
        <p className="mt-1 break-all text-xs font-semibold text-slate-500">
          {currentPenalty.penaltyId} · {labelForPenaltyLevel(currentPenalty.level)}
        </p>
        <label className="mt-5 block">
          <span className="mb-2 block text-sm font-bold text-slate-700">Lý do</span>
          <textarea
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            rows={5}
            className="w-full resize-none rounded-lg border border-slate-200 px-3 py-3 text-sm font-medium text-slate-900 outline-none focus:border-amber-500"
            placeholder="Ví dụ: Admin xác minh lại và gỡ hình phạt thủ công..."
          />
        </label>
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={revokeMutation.isPending}
            className="h-10 rounded-lg border border-slate-200 px-4 text-sm font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={revokeMutation.isPending}
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-slate-950 px-4 text-sm font-black text-white hover:bg-slate-800 disabled:opacity-50"
          >
            {revokeMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Xác nhận gỡ
          </button>
        </div>
      </form>
    </div>
  );
}

export function PenaltiesDashboard() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<PenaltyStatus | "ALL">("ALL");
  const [level, setLevel] = useState<PenaltyLevel | "ALL">("ALL");
  const [targetType, setTargetType] = useState<ReportTargetType | "ALL">("ALL");
  const [revokeTarget, setRevokeTarget] = useState<Penalty | null>(null);

  const queryParams = useMemo(
    () => ({ page, pageSize: PAGE_SIZE, status, level, targetType }),
    [page, status, level, targetType],
  );
  const penaltiesQuery = usePenalties(queryParams);
  const penalties = penaltiesQuery.data?.content ?? [];

  return (
    <div className="w-full space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-black text-red-700">
              <Ban className="h-3.5 w-3.5" />
              Penalties
            </div>
            <h1 className="text-2xl font-black text-slate-950">Hình phạt vi phạm</h1>
            <p className="mt-1 max-w-2xl text-sm font-semibold leading-relaxed text-slate-500">
              Tra cứu các penalty tạo ra khi admin/staff xác nhận ticket vi phạm. Tác động ban/ẩn
              thực tế còn phụ thuộc worker phía BE.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <select
              value={status}
              onChange={(event) => {
                setStatus(event.target.value as PenaltyStatus | "ALL");
                setPage(1);
              }}
              className="h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 outline-none focus:border-red-500"
            >
              {penaltyStatusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <select
              value={level}
              onChange={(event) => {
                setLevel(event.target.value as PenaltyLevel | "ALL");
                setPage(1);
              }}
              className="h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 outline-none focus:border-red-500"
            >
              <option value="ALL">Tất cả mức phạt</option>
              {penaltyLevelOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <select
              value={targetType}
              onChange={(event) => {
                setTargetType(event.target.value as ReportTargetType | "ALL");
                setPage(1);
              }}
              className="h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 outline-none focus:border-red-500"
            >
              <option value="ALL">Tất cả đối tượng</option>
              {reportTargetOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => penaltiesQuery.refetch()}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-black text-slate-600 hover:bg-slate-50"
            >
              <RefreshCcw className="h-4 w-4" />
              Tải lại
            </button>
          </div>
        </div>
      </section>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {penaltiesQuery.isLoading ? (
          <div className="px-6 py-16 text-center">
            <Loader2 className="mx-auto h-7 w-7 animate-spin text-slate-400" />
            <p className="mt-3 text-sm font-semibold text-slate-500">Đang tải hình phạt...</p>
          </div>
        ) : penaltiesQuery.isError ? (
          <div className="px-6 py-16 text-center text-sm font-bold text-red-600">
            Không thể tải danh sách hình phạt.
          </div>
        ) : penalties.length === 0 ? (
          <div className="px-6 py-16 text-center text-sm font-semibold text-slate-500">
            Không có hình phạt phù hợp bộ lọc.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs font-black uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-4">Penalty</th>
                  <th className="px-5 py-4">Người bị phạt</th>
                  <th className="px-5 py-4">Đối tượng</th>
                  <th className="px-5 py-4">Mức phạt</th>
                  <th className="px-5 py-4">Trạng thái</th>
                  <th className="px-5 py-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {penalties.map((penalty) => (
                  <tr key={penalty.penaltyId} className="hover:bg-slate-50">
                    <td className="px-5 py-4">
                      <p className="font-black text-slate-950">{penalty.penaltyId}</p>
                      <p className="mt-1 text-xs font-semibold text-slate-500">
                        {formatDateTime(penalty.createdAt)}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-bold text-slate-800">
                        {penalty.targetUsername || penalty.targetUserId || "-"}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-bold text-slate-800">{labelForTargetType(penalty.targetType)}</p>
                      <p className="mt-1 max-w-[220px] truncate text-xs font-semibold text-slate-500">
                        {penalty.targetId || "-"}
                      </p>
                    </td>
                    <td className="px-5 py-4 font-black text-slate-800">
                      {labelForPenaltyLevel(penalty.level)}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`rounded-full border px-2.5 py-1 text-[11px] font-black ${statusTone(penalty.status)}`}>
                        {labelForPenaltyStatus(penalty.status)}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => setRevokeTarget(penalty)}
                        disabled={penalty.status !== "ACTIVE"}
                        className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-black text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <RotateCcw className="h-4 w-4" />
                        Gỡ phạt
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {penaltiesQuery.data && penaltiesQuery.data.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-200 px-5 py-3">
            <p className="text-sm font-semibold text-slate-500">
              Trang {penaltiesQuery.data.pageNumber} / {penaltiesQuery.data.totalPages}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={penaltiesQuery.data.isFirst || penaltiesQuery.isFetching}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 disabled:opacity-40"
                aria-label="Trang trước"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setPage((current) => current + 1)}
                disabled={penaltiesQuery.data.isLast || penaltiesQuery.isFetching}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 disabled:opacity-40"
                aria-label="Trang sau"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      <PenaltyRevokeModal penalty={revokeTarget} onClose={() => setRevokeTarget(null)} />
    </div>
  );
}
