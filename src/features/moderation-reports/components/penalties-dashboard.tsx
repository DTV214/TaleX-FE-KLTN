"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { type FormEvent, useMemo, useState } from "react";
import {
  Ban,
  Eye,
  EyeOff,
  FileQuestion,
  Loader2,
  RefreshCcw,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import {
  type Penalty,
  type PenaltyLevel,
  type PenaltyStatus,
  type ReportTargetType,
} from "../api/moderation-reports.api";
import {
  useAppealByPenalty,
  usePenalty,
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
import { ModerationAccountSummary } from "./moderation-account-summary";
import { ModerationPagination } from "./moderation-pagination";
import { ModerationTargetSummary } from "./moderation-target-summary";

const PAGE_SIZE = 10;

function shortId(value?: string | null) {
  if (!value) return "-";
  if (value.length <= 14) return value;
  return `${value.slice(0, 8)}...${value.slice(-6)}`;
}

function MaskedId({
  label,
  value,
  className = "",
}: {
  label: string;
  value?: string | null;
  className?: string;
}) {
  const [isVisible, setIsVisible] = useState(false);

  if (!value) return <span className={className}>-</span>;

  return (
    <span className={`flex max-w-full items-start gap-2 ${className}`}>
      <span
        className={`min-w-0 font-bold leading-relaxed text-slate-600 backoffice-dark:text-white/65 ${isVisible ? "break-all" : "truncate"
          }`}
        title={isVisible ? value : `${label}: ${shortId(value)}`}
      >
        {isVisible ? value : shortId(value)}
      </span>
      <button
        type="button"
        onClick={() => setIsVisible((current) => !current)}
        className="inline-flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:border-red-300 hover:bg-red-50 hover:text-red-700 backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.05] backoffice-dark:text-white/55 backoffice-dark:hover:border-red-300/60 backoffice-dark:hover:bg-red-300/10 backoffice-dark:hover:text-red-200"
        aria-label={isVisible ? `Ẩn ${label}` : `Hiện ${label}`}
        title={isVisible ? `Ẩn ${label}` : `Hiện ${label}`}
      >
        {isVisible ? (
          <EyeOff className="h-3.5 w-3.5" />
        ) : (
          <Eye className="h-3.5 w-3.5" />
        )}
      </button>
    </span>
  );
}

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
        className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl backoffice-dark:border-white/10 backoffice-dark:bg-[#111113]"
      >
        <h2 className="text-lg font-black text-slate-950 backoffice-dark:text-white">
          Gỡ hình phạt
        </h2>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500">
          <MaskedId label="Penalty ID" value={currentPenalty.penaltyId} />
          <span className="text-slate-300 backoffice-dark:text-white/20">·</span>
          <span>{labelForPenaltyLevel(currentPenalty.level)}</span>
        </div>
        <label className="mt-5 block">
          <span className="mb-2 block text-sm font-bold text-slate-700 backoffice-dark:text-white/75">Lý do</span>
          <textarea
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            rows={5}
            className="w-full resize-none rounded-lg border border-slate-200 px-3 py-3 text-sm font-medium text-slate-900 outline-none focus:border-amber-500 backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.05] backoffice-dark:text-white"
            placeholder="Ví dụ: Admin xác minh lại và gỡ hình phạt thủ công..."
          />
        </label>
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={revokeMutation.isPending}
            className="h-10 cursor-pointer rounded-lg border border-slate-200 px-4 text-sm font-bold text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 backoffice-dark:border-white/10 backoffice-dark:text-white/70 backoffice-dark:hover:bg-white/10"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={revokeMutation.isPending}
            className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-lg bg-slate-950 px-4 text-sm font-black text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50 backoffice-dark:bg-white backoffice-dark:text-slate-950 backoffice-dark:hover:bg-white/85"
          >
            {revokeMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Xác nhận gỡ
          </button>
        </div>
      </form>
    </div>
  );
}

function PenaltyAppealCell({ penalty }: { penalty: Penalty }) {
  const appealQuery = useAppealByPenalty(penalty.penaltyId);
  const appealStatus = penalty.appealStatus ?? appealQuery.data?.status;

  if (appealQuery.isLoading && !appealStatus) {
    return (
      <span className="text-xs font-semibold text-slate-400">
        Đang kiểm tra...
      </span>
    );
  }

  if (appealStatus || appealQuery.data) {
    return (
      <Link
        href={`/admin/appeals?penaltyId=${penalty.penaltyId}`}
        className="inline-flex h-8 items-center gap-1.5 whitespace-nowrap rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-black text-slate-600 transition hover:border-amber-300 hover:bg-amber-50 hover:text-amber-700 backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.05] backoffice-dark:text-white/75"
      >
        <FileQuestion className="h-3.5 w-3.5" />
        Xem khiếu nại
      </Link>
    );
  }

  return (
    <span className="text-xs font-semibold text-slate-400">
      Chưa có
    </span>
  );
}

export function PenaltiesDashboard() {
  const searchParams = useSearchParams();
  const focusedPenaltyId = searchParams.get("penaltyId");
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
  const focusedPenaltyQuery = usePenalty(focusedPenaltyId);
  const penalties = penaltiesQuery.data?.content ?? [];
  const focusedPenalty = focusedPenaltyQuery.data;

  return (
    <div className="mx-auto flex w-full max-w-full flex-col gap-6">
      {focusedPenaltyId && (
        <section className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 shadow-sm backoffice-dark:border-red-300/20 backoffice-dark:bg-red-300/[0.08]">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="flex items-center gap-2 text-sm font-black text-red-700 backoffice-dark:text-red-200">
                <Ban className="h-4 w-4" />
                Hình phạt được liên kết
              </p>
              {focusedPenaltyQuery.isLoading ? (
                <p className="mt-1 text-xs font-semibold text-red-600/70 backoffice-dark:text-red-100/70">
                  Đang tải hình phạt...
                </p>
              ) : focusedPenaltyQuery.isError ? (
                <p className="mt-1 text-xs font-semibold text-red-600/70 backoffice-dark:text-red-100/70">
                  Không tải được hình phạt từ liên kết này.
                </p>
              ) : (
                <p className="mt-1 text-xs font-semibold text-red-600/80 backoffice-dark:text-red-100/80">
                  {labelForPenaltyLevel(focusedPenalty?.level)} ·{" "}
                  {labelForTargetType(focusedPenalty?.targetType)} ·{" "}
                  {formatDateTime(focusedPenalty?.createdAt)}
                </p>
              )}
            </div>
            {focusedPenalty?.appealStatus && (
              <Link
                href={`/admin/appeals?penaltyId=${focusedPenalty.penaltyId}`}
                className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-slate-950 px-3 text-xs font-black text-white transition hover:bg-slate-800 backoffice-dark:bg-white backoffice-dark:text-slate-950"
              >
                <FileQuestion className="h-4 w-4" />
                Xem khiếu nại
              </Link>
            )}
          </div>
        </section>
      )}

      <div className="mx-auto flex w-full max-w-full flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-950 backoffice-dark:text-white">
            Hình Phạt Vi Phạm
          </h1>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <select
              value={status}
              onChange={(event) => {
                setStatus(event.target.value as PenaltyStatus | "ALL");
                setPage(1);
              }}
              className="h-11 min-w-[170px] rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 outline-none focus:border-red-500"
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
              className="h-11 min-w-[180px] rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 outline-none focus:border-red-500"
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
              className="h-11 min-w-[190px] rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 outline-none focus:border-red-500"
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
              className="inline-flex h-11 min-w-[128px] cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-slate-200 bg-white px-4 text-sm font-black text-slate-600 hover:bg-slate-50 backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.05] backoffice-dark:text-white/70 backoffice-dark:hover:bg-white/10"
            >
              <RefreshCcw className="h-4 w-4" />
              Tải lại
            </button>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.04]">
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
            <table className="w-full table-fixed text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs font-black uppercase tracking-wide text-slate-500 backoffice-dark:border-white/10 backoffice-dark:bg-white/5 backoffice-dark:text-white/45">
                <tr>
                  <th className="w-[12%] px-4 py-4">Hình Phạt</th>
                  <th className="w-[19%] px-4 py-4">Người bị phạt</th>
                  <th className="w-[25%] px-4 py-4">Đối tượng</th>
                  <th className="w-[14%] px-4 py-4">Mức phạt</th>
                  <th className="w-[11%] px-4 py-4">Trạng thái</th>
                  <th className="w-[10%] px-4 py-4">Khiếu nại</th>
                  <th className="w-[9%] px-4 py-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 backoffice-dark:divide-white/10">
                {penalties.map((penalty) => (
                  <tr
                    key={penalty.penaltyId}
                    className={`hover:bg-slate-50 backoffice-dark:hover:bg-white/[0.05] ${
                      penalty.penaltyId === focusedPenaltyId
                        ? "bg-red-50/60 backoffice-dark:bg-red-300/[0.06]"
                        : ""
                    }`}
                  >
                    <td className="px-4 py-4 align-top">
                      <MaskedId
                        label="Penalty ID"
                        value={penalty.penaltyId}
                        className="max-w-full text-xs"
                      />
                      <p className="mt-1 text-xs font-semibold text-slate-500 backoffice-dark:text-white/55">
                        {formatDateTime(penalty.createdAt)}
                      </p>
                    </td>
                    <td className="px-4 py-4 align-top">
                      <ModerationAccountSummary
                        accountId={penalty.targetUserId}
                        fallbackName={penalty.targetUsername}
                      />
                    </td>
                    <td className="px-4 py-4 align-top">
                      <ModerationTargetSummary
                        fallbackTitle={labelForTargetType(penalty.targetType)}
                        targetId={penalty.targetId}
                        targetType={penalty.targetType}
                      />
                    </td>
                    <td className="px-4 py-4 align-top font-black text-slate-800 backoffice-dark:text-white">
                      {labelForPenaltyLevel(penalty.level)}
                    </td>
                    <td className="px-4 py-4 align-top">
                      <span className={`inline-flex whitespace-nowrap rounded-full border px-2.5 py-1 text-[11px] font-black ${statusTone(penalty.status)}`}>
                        {labelForPenaltyStatus(penalty.status)}
                      </span>
                    </td>
                    <td className="px-4 py-4 align-top">
                      <PenaltyAppealCell penalty={penalty} />
                    </td>
                    <td className="px-4 py-4 text-right align-top">
                      <button
                        type="button"
                        onClick={() => setRevokeTarget(penalty)}
                        disabled={penalty.status !== "ACTIVE"}
                        title="Gỡ phạt"
                        className="inline-flex h-9 w-full max-w-[92px] cursor-pointer items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border border-slate-200 bg-white px-2 text-xs font-black text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.05] backoffice-dark:text-white/75 backoffice-dark:hover:bg-white/10"
                      >
                        <RotateCcw className="h-4 w-4" />
                        Gỡ
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <ModerationPagination
          data={penaltiesQuery.data}
          isFetching={penaltiesQuery.isFetching}
          itemLabel="hình phạt"
          onPageChange={setPage}
        />
      </div>

      <PenaltyRevokeModal penalty={revokeTarget} onClose={() => setRevokeTarget(null)} />
    </div>
  );
}
