"use client";

import { type ReactNode, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  FileText,
  Loader2,
  ReceiptText,
  RefreshCw,
  WalletCards,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/shared/utils/utils";
import {
  useCreatorSettlementDetail,
  useUpdateCreatorSettlementStatus,
} from "../hooks/use-creator-settlements";
import type {
  CreatorSettlementDetail,
  CreatorSettlementSummary,
  PayoutStatus,
  RevenueTransactionType,
  SettlementStatus,
} from "../types/creator-settlements.types";

export const settlementStatuses: SettlementStatus[] = [
  "CALCULATED",
  "APPROVED",
  "PAID",
  "UNDER_REVIEW",
  "FROZEN_PENALTY",
  "FORFEITED",
];

const validNextStatuses: Record<SettlementStatus, SettlementStatus[]> = {
  CALCULATED: ["APPROVED", "UNDER_REVIEW", "FORFEITED", "FROZEN_PENALTY"],
  FROZEN_PENALTY: ["APPROVED", "UNDER_REVIEW", "FORFEITED"],
  APPROVED: ["PAID", "UNDER_REVIEW", "FORFEITED"],
  UNDER_REVIEW: ["APPROVED", "FORFEITED"],
  PAID: [],
  FORFEITED: [],
};

const statusLabels: Record<SettlementStatus, string> = {
  CALCULATED: "Đã tính",
  APPROVED: "Đã duyệt",
  PAID: "Đã chi trả",
  UNDER_REVIEW: "Đang xem xét",
  FROZEN_PENALTY: "Đóng băng",
  FORFEITED: "Không chi",
};

const revenueTypeLabels: Record<RevenueTransactionType, string> = {
  PREMIUM_SHARE: "Chia sẻ Premium",
  WITHDRAWAL: "Rút tiền",
  PENALTY_DEDUCTION: "Khấu trừ phạt",
  ADJUSTMENT: "Điều chỉnh",
  CONTENT_SHARE: "Chia sẻ nội dung",
};

const payoutStatusLabels: Record<PayoutStatus, string> = {
  PENDING: "Đang chờ",
  SUCCESS: "Thành công",
  FAILED: "Thất bại",
};

export function formatVND(value?: number | null) {
  return new Intl.NumberFormat("vi-VN", {
    maximumFractionDigits: 0,
    style: "currency",
    currency: "VND",
  }).format(value ?? 0);
}

export function formatNumber(value?: number | null) {
  return new Intl.NumberFormat("vi-VN").format(value ?? 0);
}

export function formatPercent(value?: number | null) {
  return `${new Intl.NumberFormat("vi-VN", {
    maximumFractionDigits: 2,
  }).format((value ?? 0) * 100)}%`;
}

export function formatDateTime(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

export function formatMonth(value?: string | null) {
  if (!value) return "-";
  const [year, month] = value.split("-");
  if (!year || !month) return value;
  return `Tháng ${Number(month)}/${year}`;
}

export function labelForSettlementStatus(status?: string | null) {
  return statusLabels[status as SettlementStatus] ?? status ?? "-";
}

function statusTone(status?: string | null) {
  switch (status) {
    case "CALCULATED":
      return "border-blue-200 bg-blue-50 text-blue-700 backoffice-dark:border-blue-400/25 backoffice-dark:bg-blue-400/10 backoffice-dark:text-blue-200";
    case "APPROVED":
      return "border-emerald-200 bg-emerald-50 text-emerald-700 backoffice-dark:border-emerald-400/25 backoffice-dark:bg-emerald-400/10 backoffice-dark:text-emerald-200";
    case "PAID":
      return "border-cyan-200 bg-cyan-50 text-cyan-700 backoffice-dark:border-cyan-400/25 backoffice-dark:bg-cyan-400/10 backoffice-dark:text-cyan-200";
    case "UNDER_REVIEW":
      return "border-amber-200 bg-amber-50 text-amber-700 backoffice-dark:border-amber-400/25 backoffice-dark:bg-amber-400/10 backoffice-dark:text-amber-200";
    case "FROZEN_PENALTY":
      return "border-violet-200 bg-violet-50 text-violet-700 backoffice-dark:border-violet-400/25 backoffice-dark:bg-violet-400/10 backoffice-dark:text-violet-200";
    case "FORFEITED":
      return "border-red-200 bg-red-50 text-red-700 backoffice-dark:border-red-400/25 backoffice-dark:bg-red-400/10 backoffice-dark:text-red-200";
    default:
      return "border-slate-200 bg-slate-50 text-slate-600 backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.04] backoffice-dark:text-white/60";
  }
}

function payoutTone(status?: string | null) {
  switch (status) {
    case "SUCCESS":
      return "text-emerald-600";
    case "FAILED":
      return "text-red-600";
    default:
      return "text-amber-600";
  }
}

export function SettlementStatusBadge({ status }: { status?: string | null }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-2.5 py-1 text-[11px] font-black",
        statusTone(status),
      )}
    >
      {labelForSettlementStatus(status)}
    </span>
  );
}

export function SettlementMetricCard({
  help,
  label,
  tone = "default",
  value,
}: {
  help?: string;
  label: string;
  tone?: "default" | "good" | "warn" | "danger";
  value: ReactNode;
}) {
  const toneClass =
    tone === "good"
      ? "text-emerald-600 backoffice-dark:text-emerald-300"
      : tone === "warn"
        ? "text-amber-600 backoffice-dark:text-amber-300"
        : tone === "danger"
          ? "text-red-600 backoffice-dark:text-red-300"
          : "text-slate-950 backoffice-dark:text-white";

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.045]">
      <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-400 backoffice-dark:text-white/40">
        {label}
      </p>
      <div className={cn("mt-2 text-2xl font-black tracking-tight", toneClass)}>
        {value}
      </div>
      {help && (
        <p className="mt-2 text-xs font-semibold leading-relaxed text-slate-500 backoffice-dark:text-white/45">
          {help}
        </p>
      )}
    </div>
  );
}

export function SettlementSummaryMetrics({
  settlement,
}: {
  settlement: CreatorSettlementSummary | CreatorSettlementDetail;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <SettlementMetricCard label="Tổng Gross" value={formatVND(settlement.grossAmount)} />
      <SettlementMetricCard
        label="Khấu trừ phạt"
        tone={settlement.totalPenaltyAmount > 0 ? "danger" : "default"}
        value={formatVND(settlement.totalPenaltyAmount)}
      />
      <SettlementMetricCard
        label="Thuế TNCN (PIT)"
        help={`Tỷ lệ ${formatPercent(settlement.taxRate)}`}
        tone={settlement.taxWithheldAmount > 0 ? "warn" : "default"}
        value={formatVND(settlement.taxWithheldAmount)}
      />
      <SettlementMetricCard
        label="Thực nhận (Net)"
        tone="good"
        value={formatVND(settlement.netPayoutAmount)}
      />
    </div>
  );
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-slate-100 py-2 last:border-b-0 backoffice-dark:border-white/10">
      <span className="text-[11px] font-black uppercase tracking-[0.1em] text-slate-400 backoffice-dark:text-white/35 shrink-0">
        {label}
      </span>
      <span className="text-right text-xs font-bold text-slate-800 backoffice-dark:text-white/80 break-all">
        {value || "-"}
      </span>
    </div>
  );
}

function RevenueTransactionsTable({
  detail,
}: {
  detail: CreatorSettlementDetail;
}) {
  const transactions = detail.revenueTransactions ?? [];

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.035]">
      <div className="flex items-center gap-2 border-b border-slate-200 px-4 py-2.5 backoffice-dark:border-white/10">
        <ReceiptText className="h-4 w-4 text-amber-500" />
        <h3 className="text-xs sm:text-sm font-black text-slate-950 backoffice-dark:text-white">
          Giao dịch doanh thu
        </h3>
        <span className="ml-auto text-xs font-bold text-slate-400">
          {transactions.length} giao dịch
        </span>
      </div>

      {transactions.length === 0 ? (
        <div className="px-4 py-6 text-center text-xs sm:text-sm font-semibold text-slate-500 backoffice-dark:text-white/45">
          Chưa có revenue transaction trong response.
        </div>
      ) : (
        <div className="w-full">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 text-[11px] font-black uppercase tracking-wide text-slate-500 backoffice-dark:bg-[#141416] backoffice-dark:text-white/45">
              <tr>
                <th className="px-3.5 py-2">Loại</th>
                <th className="px-3.5 py-2">Tháng</th>
                <th className="px-3.5 py-2">Mô tả</th>
                <th className="px-3.5 py-2 text-right">Số tiền</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 backoffice-dark:divide-white/10">
              {transactions.map((transaction) => (
                <tr key={transaction.revenueTransactionId}>
                  <td className="px-3.5 py-2.5 font-bold text-slate-800 backoffice-dark:text-white/85">
                    {revenueTypeLabels[transaction.revenueTransactionType] ??
                      transaction.revenueTransactionType}
                  </td>
                  <td className="px-3.5 py-2.5 text-xs font-semibold text-slate-500 backoffice-dark:text-white/45 whitespace-nowrap">
                    {formatDateTime(transaction.monthYear)}
                  </td>
                  <td className="px-3.5 py-2.5 text-xs font-semibold text-slate-500 backoffice-dark:text-white/50 leading-relaxed">
                    {transaction.description || "-"}
                  </td>
                  <td
                    className={cn(
                      "px-3.5 py-2.5 text-right font-black whitespace-nowrap",
                      transaction.amount < 0 ||
                        transaction.revenueTransactionType === "PENALTY_DEDUCTION"
                        ? "text-red-600"
                        : "text-emerald-600",
                    )}
                  >
                    {formatVND(transaction.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function PayoutTransactionsTable({ detail }: { detail: CreatorSettlementDetail }) {
  const transactions = detail.payoutTransactions ?? [];

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.035]">
      <div className="flex items-center gap-2 border-b border-slate-200 px-4 py-2.5 backoffice-dark:border-white/10">
        <WalletCards className="h-4 w-4 text-cyan-500" />
        <h3 className="text-xs sm:text-sm font-black text-slate-950 backoffice-dark:text-white">
          Giao dịch chi trả
        </h3>
        <span className="ml-auto text-xs font-bold text-slate-400">
          {transactions.length} payout
        </span>
      </div>

      {transactions.length === 0 ? (
        <div className="px-4 py-6 text-center text-xs sm:text-sm font-semibold text-slate-500 backoffice-dark:text-white/45">
          Chưa có payout transaction. Settlement chỉ có payout sau khi được duyệt và xử lý chi trả.
        </div>
      ) : (
        <div className="w-full">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 text-[11px] font-black uppercase tracking-wide text-slate-500 backoffice-dark:bg-[#141416] backoffice-dark:text-white/45">
              <tr>
                <th className="px-3.5 py-2">Mã tham chiếu</th>
                <th className="px-3.5 py-2">Tài khoản nhận</th>
                <th className="px-3.5 py-2">Trạng thái</th>
                <th className="px-3.5 py-2 text-right">Số tiền</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 backoffice-dark:divide-white/10">
              {transactions.map((transaction) => (
                <tr key={transaction.payoutTransactionId}>
                  <td className="px-3.5 py-2.5">
                    <p className="font-bold text-slate-800 backoffice-dark:text-white/85 break-all">
                      {transaction.payoutReference ||
                        transaction.transactionReferenceId ||
                        transaction.payoutTransactionId}
                    </p>
                    <p className="mt-0.5 text-xs font-semibold text-slate-400 whitespace-nowrap">
                      {formatDateTime(transaction.paidAt || transaction.createdAt)}
                    </p>
                  </td>
                  <td className="px-3.5 py-2.5 text-xs font-semibold text-slate-500 backoffice-dark:text-white/50 leading-relaxed">
                    <span className="font-bold text-slate-700 backoffice-dark:text-white/80">{transaction.toAccountName || "-"}</span>
                    <br />
                    {transaction.toBin || "-"} · {transaction.toAccountNumber || "-"}
                  </td>
                  <td className={cn("px-3.5 py-2.5 text-xs font-black whitespace-nowrap", payoutTone(transaction.status))}>
                    {payoutStatusLabels[transaction.status] ?? transaction.status}
                    {transaction.failureReason && (
                      <p className="mt-0.5 font-semibold text-red-500">
                        {transaction.failureReason}
                      </p>
                    )}
                  </td>
                  <td className="px-3.5 py-2.5 text-right font-black text-slate-950 backoffice-dark:text-white whitespace-nowrap">
                    {formatVND(transaction.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function AdminStatusPanel({ detail }: { detail: CreatorSettlementDetail }) {
  const nextStatuses = validNextStatuses[detail.status] ?? [];
  const [status, setStatus] = useState<SettlementStatus>(
    nextStatuses[0] ?? detail.status,
  );
  const [note, setNote] = useState("");
  const updateMutation = useUpdateCreatorSettlementStatus(
    detail.creatorMonthlySettlementId,
  );

  const requiresNote = status === "UNDER_REVIEW" || status === "FORFEITED";
  const isTerminal = nextStatuses.length === 0;

  // Nếu settlement đã ở trạng thái cuối (PAID, FORFEITED), không hiển thị khung cập nhật trạng thái
  if (isTerminal) {
    return null;
  }

  async function handleSubmit() {
    const trimmedNote = note.trim();
    if (requiresNote && !trimmedNote) {
      toast.error("Vui lòng nhập ghi chú xử lý.");
      return;
    }

    await updateMutation.mutateAsync({
      status,
      note: trimmedNote || undefined,
    });
    toast.success("Đã cập nhật trạng thái settlement.");
    setNote("");
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.04]">
      <div className="flex items-center gap-2">
        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
        <h3 className="text-sm font-black text-slate-950 backoffice-dark:text-white">
          Cập nhật trạng thái
        </h3>
      </div>

      <div className="mt-3.5 space-y-3">
        <label className="block">
          <span className="mb-1.5 block text-xs font-bold text-slate-600 backoffice-dark:text-white/70">
            Chuyển sang
          </span>
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value as SettlementStatus)}
            disabled={updateMutation.isPending}
            className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs sm:text-sm font-bold text-slate-900 outline-none transition focus:border-amber-500 backoffice-dark:border-white/10 backoffice-dark:bg-black/30 backoffice-dark:text-white"
          >
            {nextStatuses.map((option) => (
              <option key={option} value={option}>
                {labelForSettlementStatus(option)}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1.5 block text-xs font-bold text-slate-600 backoffice-dark:text-white/70">
            Ghi chú {requiresNote ? "(bắt buộc)" : "(không bắt buộc)"}
          </span>
          <textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            disabled={updateMutation.isPending}
            rows={3}
            placeholder="Ví dụ: Đủ điều kiện duyệt chi trả kỳ này..."
            className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs sm:text-sm font-semibold text-slate-900 outline-none transition focus:border-amber-500 backoffice-dark:border-white/10 backoffice-dark:bg-black/30 backoffice-dark:text-white"
          />
        </label>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={updateMutation.isPending}
          className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-slate-950 text-xs sm:text-sm font-black text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50 backoffice-dark:bg-[var(--backoffice-primary)] backoffice-dark:text-black backoffice-dark:hover:bg-[var(--backoffice-primary-bright)] cursor-pointer"
        >
          {updateMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          Lưu trạng thái
        </button>
      </div>
    </div>
  );
}

export function SettlementDetailDialog({
  onClose,
  role,
  settlementId,
}: {
  onClose: () => void;
  role: "admin" | "creator";
  settlementId: string | null;
}) {
  const detailQuery = useCreatorSettlementDetail(settlementId);
  const detail = detailQuery.data;

  if (!settlementId) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/60 p-3 sm:p-6 backdrop-blur-sm",
        role === "creator" && "backoffice-dark",
      )}
      onClick={onClose}
    >
      <div
        className="flex max-h-[96vh] w-full max-w-6xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl backoffice-dark:border-white/10 backoffice-dark:bg-[#111113]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-5 py-3.5 backoffice-dark:border-white/10 shrink-0">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-black text-slate-950 backoffice-dark:text-white">
                Chi tiết quyết toán
              </h2>
              {detail && <SettlementStatusBadge status={detail.status} />}
            </div>
            <p className="mt-0.5 break-all text-xs font-semibold text-slate-500 backoffice-dark:text-white/45">
              {settlementId}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 backoffice-dark:hover:bg-white/10 backoffice-dark:hover:text-white cursor-pointer"
            aria-label="Đóng"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-5 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-200 backoffice-dark:[&::-webkit-scrollbar-thumb]:bg-white/10">
          {detailQuery.isLoading && (
            <div className="flex h-80 items-center justify-center text-sm font-semibold text-slate-500">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Đang tải chi tiết settlement...
            </div>
          )}

          {detailQuery.isError && (
            <div className="flex h-80 flex-col items-center justify-center text-center">
              <AlertTriangle className="h-8 w-8 text-red-500" />
              <p className="mt-3 text-sm font-bold text-red-600">
                Không thể tải chi tiết settlement.
              </p>
            </div>
          )}

          {detail && (
            <div className="grid gap-4 xl:grid-cols-[1fr_340px]">
              <div className="space-y-4">
                <section className="rounded-2xl border border-slate-200 bg-slate-50 p-3.5 sm:p-4 backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.035]">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-[11px] font-black uppercase tracking-[0.16em] text-amber-600">
                        {formatMonth(detail.settlementMonth)}
                      </p>
                      <h3 className="mt-0.5 text-base sm:text-lg font-black text-slate-950 backoffice-dark:text-white">
                        {detail.creatorName ||
                          detail.creatorDetail?.username ||
                          "Creator"}
                      </h3>
                    </div>
                    <div className="text-right text-[11px] font-bold text-slate-500 backoffice-dark:text-white/45 leading-tight">
                      Ngày tạo: {formatDateTime(detail.createdAt)}
                      <br />
                      Hạn chốt: {formatDateTime(detail.cutoffDate)}
                    </div>
                  </div>
                  <SettlementSummaryMetrics settlement={detail} />
                </section>

                <RevenueTransactionsTable detail={detail} />
                <PayoutTransactionsTable detail={detail} />
              </div>

              <aside className="space-y-4">
                <div className="rounded-2xl border border-slate-200 bg-white p-3.5 sm:p-4 backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.035]">
                  <div className="mb-2 flex items-center gap-2">
                    <FileText className="h-4 w-4 text-violet-500" />
                    <h3 className="text-xs sm:text-sm font-black text-slate-950 backoffice-dark:text-white">
                      Hồ sơ creator
                    </h3>
                  </div>
                  <InfoRow
                    label="Tên tài khoản"
                    value={detail.creatorDetail?.username || detail.creatorName}
                  />
                  <InfoRow label="Email" value={detail.creatorDetail?.email} />
                  <InfoRow label="Mã Creator" value={detail.creatorDetail?.creatorId || detail.creatorId} />
                  <InfoRow
                    label="Tài khoản"
                    value={
                      detail.creatorDetail?.accountStatus === "ACTIVE"
                        ? "Hoạt động"
                        : detail.creatorDetail?.accountStatus === "BANNED"
                          ? "Bị khóa"
                          : detail.creatorDetail?.accountStatus || "-"
                    }
                  />
                  <InfoRow label="Mã số thuế" value={detail.creatorDetail?.taxId} />
                  <InfoRow
                    label="Trạng thái thuế"
                    value={
                      detail.creatorDetail?.taxStatus === "APPROVED"
                        ? "Đã duyệt"
                        : detail.creatorDetail?.taxStatus === "PENDING"
                          ? "Chờ duyệt"
                          : detail.creatorDetail?.taxStatus === "REJECTED"
                            ? "Bị từ chối"
                            : detail.creatorDetail?.taxStatus || "-"
                    }
                  />
                  <InfoRow
                    label="Bị khóa"
                    value={detail.creatorDetail?.isBanned ? "Có" : "Không"}
                  />
                </div>

                {role === "admin" && <AdminStatusPanel detail={detail} />}
              </aside>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function SettlementEmptyState({
  description,
  title,
  variant = "admin",
}: {
  description: string;
  title: string;
  variant?: "admin" | "creator";
}) {
  const isCreator = variant === "creator";

  return (
    <div
      className={cn(
        "rounded-2xl border border-dashed px-6 py-14 text-center shadow-sm",
        isCreator
          ? "border-white/10 bg-white/[0.04]"
          : "border-slate-200 bg-white backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.035]",
      )}
    >
      <RefreshCw
        className={cn(
          "mx-auto h-8 w-8",
          isCreator ? "text-white/25" : "text-slate-300 backoffice-dark:text-white/25",
        )}
      />
      <h2
        className={cn(
          "mt-3 text-lg font-black",
          isCreator ? "text-white" : "text-slate-950 backoffice-dark:text-white",
        )}
      >
        {title}
      </h2>
      <p
        className={cn(
          "mx-auto mt-1 max-w-lg text-sm font-semibold leading-relaxed",
          isCreator ? "text-creator-muted" : "text-slate-500 backoffice-dark:text-white/45",
        )}
      >
        {description}
      </p>
    </div>
  );
}

export function SettlementErrorState({
  message,
  onRetry,
  variant = "admin",
}: {
  message: string;
  onRetry: () => void;
  variant?: "admin" | "creator";
}) {
  const isCreator = variant === "creator";

  return (
    <div
      className={cn(
        "rounded-2xl border px-6 py-14 text-center shadow-sm",
        isCreator
          ? "border-red-400/20 bg-red-400/10"
          : "border-red-200 bg-white backoffice-dark:border-red-400/20 backoffice-dark:bg-red-400/5",
      )}
    >
      <AlertTriangle className="mx-auto h-8 w-8 text-red-500" />
      <p
        className={cn(
          "mt-3 text-sm font-bold",
          isCreator ? "text-red-200" : "text-red-600 backoffice-dark:text-red-200",
        )}
      >
        {message}
      </p>
      <button
        type="button"
        onClick={onRetry}
        className={cn(
          "mt-4 inline-flex h-10 items-center justify-center gap-2 rounded-xl border px-4 text-sm font-black transition",
          isCreator
            ? "border-red-400/25 text-red-100 hover:bg-red-400/10"
            : "border-red-200 text-red-600 hover:bg-red-50 backoffice-dark:border-red-400/20 backoffice-dark:hover:bg-red-400/10",
        )}
      >
        <RefreshCw className="h-4 w-4" />
        Tải lại
      </button>
    </div>
  );
}
