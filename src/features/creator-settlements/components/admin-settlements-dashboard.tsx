"use client";

import { type FormEvent, useMemo, useState } from "react";
import {
  AlertTriangle,
  Calculator,
  ChevronLeft,
  ChevronRight,
  Eye,
  Loader2,
  Play,
  RefreshCw,
  Search,
  WalletCards,
  X,
} from "lucide-react";
import { toast } from "sonner";
import {
  useAdminCreatorSettlements,
  useRunCreatorSettlementProcess,
} from "../hooks/use-creator-settlements";
import type {
  CreatorSettlementSummary,
  SettlementSortBy,
  SettlementStatus,
  SortDirection,
} from "../types/creator-settlements.types";
import {
  formatDateTime,
  formatMonth,
  formatVND,
  labelForSettlementStatus,
  SettlementDetailDialog,
  SettlementEmptyState,
  SettlementErrorState,
  SettlementStatusBadge,
  settlementStatuses,
} from "./settlement-ui";

const PAGE_SIZE = 20;

type StatusFilter = SettlementStatus | "ALL";

const sortOptions: Array<{ label: string; value: SettlementSortBy }> = [
  { label: "Ngày tạo", value: "createdAt" },
  { label: "Tháng quyết toán", value: "settlementMonth" },
  { label: "Gross", value: "grossAmount" },
  { label: "Net payout", value: "netPayoutAmount" },
  { label: "Trạng thái", value: "status" },
];

function currentPreviousMonth() {
  const date = new Date();
  date.setMonth(date.getMonth() - 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function RunSettlementModal({
  onClose,
}: {
  onClose: () => void;
}) {
  const [targetMonth, setTargetMonth] = useState(currentPreviousMonth);
  const [isDemo, setIsDemo] = useState(true);
  const [confirmText, setConfirmText] = useState("");
  const runMutation = useRunCreatorSettlementProcess();

  const canRunReal = isDemo || confirmText.trim() === "CHAY THAT";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!targetMonth) {
      toast.error("Vui lòng chọn tháng cần quyết toán.");
      return;
    }
    if (!canRunReal) {
      toast.error("Để chạy thật, hãy nhập đúng CHAY THAT.");
      return;
    }

    const result = await runMutation.mutateAsync({
      isDemo,
      targetMonth,
    });

    if (isDemo) {
      toast.success(`Demo hoàn tất: ${result?.length ?? 0} settlement dự kiến.`);
      return;
    }

    toast.success("Đã chạy quyết toán thật. Danh sách sẽ được tải lại.");
    onClose();
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/60 px-4 py-8 backdrop-blur-sm">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-2xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl backoffice-dark:border-white/10 backoffice-dark:bg-[#111113]"
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 p-6 backoffice-dark:border-white/10">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-600">
              Settlement process
            </p>
            <h2 className="mt-2 text-2xl font-black text-slate-950 backoffice-dark:text-white">
              Chạy quyết toán thủ công
            </h2>
            <p className="mt-2 text-sm font-semibold leading-relaxed text-slate-500 backoffice-dark:text-white/50">
              Endpoint `demo-process` có thể chạy thử hoặc chạy thật. Chạy thật sẽ lưu settlement,
              gắn revenue transaction và cập nhật balance creator ở BE.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 backoffice-dark:hover:bg-white/10 backoffice-dark:hover:text-white"
            aria-label="Đóng"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5 p-6">
          <label className="block">
            <span className="mb-2 block text-sm font-black text-slate-700 backoffice-dark:text-white/75">
              Tháng target
            </span>
            <input
              type="month"
              value={targetMonth}
              onChange={(event) => setTargetMonth(event.target.value)}
              className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-900 outline-none transition focus:border-amber-500 backoffice-dark:border-white/10 backoffice-dark:bg-black/30 backoffice-dark:text-white"
            />
          </label>

          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setIsDemo(true)}
              className={`rounded-2xl border px-4 py-4 text-left transition ${
                isDemo
                  ? "border-amber-300 bg-amber-50 text-amber-800 backoffice-dark:bg-amber-400/10 backoffice-dark:text-amber-200"
                  : "border-slate-200 bg-white text-slate-600 backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.04] backoffice-dark:text-white/60"
              }`}
            >
              <p className="font-black">Chạy demo</p>
              <p className="mt-1 text-xs font-semibold leading-relaxed">
                Chỉ tính thử, không lưu database.
              </p>
            </button>
            <button
              type="button"
              onClick={() => setIsDemo(false)}
              className={`rounded-2xl border px-4 py-4 text-left transition ${
                !isDemo
                  ? "border-red-300 bg-red-50 text-red-700 backoffice-dark:bg-red-400/10 backoffice-dark:text-red-200"
                  : "border-slate-200 bg-white text-slate-600 backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.04] backoffice-dark:text-white/60"
              }`}
            >
              <p className="font-black">Chạy thật</p>
              <p className="mt-1 text-xs font-semibold leading-relaxed">
                Lưu settlement và cập nhật balance creator.
              </p>
            </button>
          </div>

          {!isDemo && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 backoffice-dark:border-red-400/20 backoffice-dark:bg-red-400/10">
              <div className="flex gap-3">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
                <div>
                  <p className="text-sm font-black text-red-700 backoffice-dark:text-red-200">
                    Đây là hành động nhạy cảm.
                  </p>
                  <p className="mt-1 text-xs font-semibold leading-relaxed text-red-600/80 backoffice-dark:text-red-100/70">
                    Nhập `CHAY THAT` để xác nhận chạy quyết toán thật.
                  </p>
                </div>
              </div>
              <input
                value={confirmText}
                onChange={(event) => setConfirmText(event.target.value)}
                placeholder="CHAY THAT"
                className="mt-3 h-11 w-full rounded-xl border border-red-200 bg-white px-3 text-sm font-black text-red-700 outline-none focus:border-red-500 backoffice-dark:border-red-400/20 backoffice-dark:bg-black/30 backoffice-dark:text-red-100"
              />
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 border-t border-slate-200 bg-slate-50 p-5 backoffice-dark:border-white/10 backoffice-dark:bg-black/25">
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-white backoffice-dark:border-white/10 backoffice-dark:text-white/70 backoffice-dark:hover:bg-white/10"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={runMutation.isPending || !canRunReal}
            className={`inline-flex items-center gap-2 rounded-2xl px-6 py-3 text-sm font-black transition disabled:cursor-not-allowed disabled:opacity-50 ${
              isDemo
                ? "bg-slate-950 text-white hover:bg-slate-800 backoffice-dark:bg-[var(--backoffice-primary)] backoffice-dark:text-black"
                : "bg-red-600 text-white hover:bg-red-500"
            }`}
          >
            {runMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Play className="h-4 w-4" />
            )}
            {isDemo ? "Chạy demo" : "Chạy thật"}
          </button>
        </div>
      </form>
    </div>
  );
}

function SettlementRow({
  onOpen,
  settlement,
}: {
  onOpen: (id: string) => void;
  settlement: CreatorSettlementSummary;
}) {
  return (
    <tr className="transition hover:bg-slate-50 backoffice-dark:hover:bg-white/[0.035]">
      <td className="px-5 py-4">
        <p className="font-black text-slate-950 backoffice-dark:text-white">
          {formatMonth(settlement.settlementMonth)}
        </p>
        <p className="mt-1 text-xs font-semibold text-slate-500 backoffice-dark:text-white/40">
          Cutoff {formatDateTime(settlement.cutoffDate)}
        </p>
      </td>
      <td className="px-5 py-4">
        <p className="font-black text-slate-800 backoffice-dark:text-white/85">
          {settlement.creatorName || "Creator"}
        </p>
        <p className="mt-1 max-w-[240px] truncate text-xs font-semibold text-slate-500 backoffice-dark:text-white/40">
          {settlement.creatorId || "-"}
        </p>
      </td>
      <td className="px-5 py-4 text-right font-black text-slate-950 backoffice-dark:text-white">
        {formatVND(settlement.grossAmount)}
      </td>
      <td className="px-5 py-4 text-right font-black text-amber-600">
        {formatVND(settlement.taxWithheldAmount)}
      </td>
      <td className="px-5 py-4 text-right font-black text-emerald-600">
        {formatVND(settlement.netPayoutAmount)}
      </td>
      <td className="px-5 py-4">
        <SettlementStatusBadge status={settlement.status} />
      </td>
      <td className="px-5 py-4 text-right">
        <button
          type="button"
          onClick={() => onOpen(settlement.creatorMonthlySettlementId)}
          className="inline-flex h-9 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-black text-slate-700 transition hover:bg-slate-50 backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.04] backoffice-dark:text-white/70 backoffice-dark:hover:bg-white/10"
        >
          <Eye className="h-4 w-4" />
          Chi tiết
        </button>
      </td>
    </tr>
  );
}

export function AdminSettlementsDashboard() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<StatusFilter>("ALL");
  const [settlementMonth, setSettlementMonth] = useState("");
  const [sortBy, setSortBy] = useState<SettlementSortBy>("createdAt");
  const [sortDirection, setSortDirection] = useState<SortDirection>("DESC");
  const [selectedSettlementId, setSelectedSettlementId] = useState<string | null>(null);
  const [isRunModalOpen, setIsRunModalOpen] = useState(false);

  const queryParams = useMemo(
    () => ({
      page,
      pageSize: PAGE_SIZE,
      statuses: status === "ALL" ? undefined : [status],
      settlementMonth: settlementMonth || undefined,
      sortBy,
      sortDirection,
    }),
    [page, settlementMonth, sortBy, sortDirection, status],
  );

  const settlementsQuery = useAdminCreatorSettlements(queryParams);
  const settlements = settlementsQuery.data?.content ?? [];
  const totalNet = settlements.reduce((sum, item) => sum + item.netPayoutAmount, 0);
  const totalTax = settlements.reduce((sum, item) => sum + item.taxWithheldAmount, 0);

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.04]">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-amber-700 backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.06] backoffice-dark:text-[var(--backoffice-primary)]">
              <WalletCards className="h-4 w-4" />
              Creator Settlements
            </div>
            <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-950 backoffice-dark:text-white">
              Quyết toán doanh thu Creator
            </h1>
            <p className="mt-2 max-w-3xl text-sm font-semibold leading-relaxed text-slate-500 backoffice-dark:text-white/55">
              Theo dõi các kỳ quyết toán đã được BE gom sổ theo tháng, xem chi tiết revenue transaction,
              thuế PIT, payout và xử lý trạng thái duyệt chi trả.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => settlementsQuery.refetch()}
              disabled={settlementsQuery.isFetching}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 transition hover:bg-slate-50 disabled:opacity-60 backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.04] backoffice-dark:text-white/70 backoffice-dark:hover:bg-white/10"
            >
              <RefreshCw className={settlementsQuery.isFetching ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
              Tải lại
            </button>
            <button
              type="button"
              onClick={() => setIsRunModalOpen(true)}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-black text-white transition hover:bg-slate-800 backoffice-dark:bg-[var(--backoffice-primary)] backoffice-dark:text-black backoffice-dark:hover:bg-[var(--backoffice-primary-bright)]"
            >
              <Calculator className="h-4 w-4" />
              Chạy quyết toán
            </button>
          </div>
        </div>
      </section>

      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.04]">
          <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">Settlement trên trang</p>
          <p className="mt-2 text-3xl font-black text-slate-950 backoffice-dark:text-white">
            {settlements.length}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.04]">
          <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">Net payout trang này</p>
          <p className="mt-2 text-2xl font-black text-emerald-600">{formatVND(totalNet)}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.04]">
          <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">Thuế PIT trang này</p>
          <p className="mt-2 text-2xl font-black text-amber-600">{formatVND(totalTax)}</p>
        </div>
      </div>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.04]">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="month"
              value={settlementMonth}
              onChange={(event) => {
                setSettlementMonth(event.target.value);
                setPage(1);
              }}
              className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm font-bold text-slate-800 outline-none transition focus:border-amber-500 backoffice-dark:border-white/10 backoffice-dark:bg-black/30 backoffice-dark:text-white"
            />
          </div>
          <select
            value={status}
            onChange={(event) => {
              setStatus(event.target.value as StatusFilter);
              setPage(1);
            }}
            className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 outline-none transition focus:border-amber-500 backoffice-dark:border-white/10 backoffice-dark:bg-black/30 backoffice-dark:text-white"
          >
            <option value="ALL">Tất cả trạng thái</option>
            {settlementStatuses.map((option) => (
              <option key={option} value={option}>
                {labelForSettlementStatus(option)}
              </option>
            ))}
          </select>
          <select
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value as SettlementSortBy)}
            className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 outline-none transition focus:border-amber-500 backoffice-dark:border-white/10 backoffice-dark:bg-black/30 backoffice-dark:text-white"
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                Sắp xếp: {option.label}
              </option>
            ))}
          </select>
          <select
            value={sortDirection}
            onChange={(event) => setSortDirection(event.target.value as SortDirection)}
            className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 outline-none transition focus:border-amber-500 backoffice-dark:border-white/10 backoffice-dark:bg-black/30 backoffice-dark:text-white"
          >
            <option value="DESC">Mới nhất / giảm dần</option>
            <option value="ASC">Cũ nhất / tăng dần</option>
          </select>
        </div>
      </section>

      {settlementsQuery.isLoading && (
        <div className="rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.04]">
          <Loader2 className="mx-auto h-7 w-7 animate-spin text-slate-400" />
          <p className="mt-3 text-sm font-semibold text-slate-500">Đang tải danh sách quyết toán...</p>
        </div>
      )}

      {settlementsQuery.isError && (
        <SettlementErrorState
          message="Không thể tải danh sách creator settlement."
          onRetry={() => settlementsQuery.refetch()}
        />
      )}

      {!settlementsQuery.isLoading && !settlementsQuery.isError && settlements.length === 0 && (
        <SettlementEmptyState
          title="Chưa có quyết toán phù hợp"
          description="Khi BE cron hoặc admin chạy quyết toán thủ công, settlement sẽ xuất hiện tại đây."
        />
      )}

      {settlements.length > 0 && (
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.04]">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1080px] text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs font-black uppercase tracking-wide text-slate-500 backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.04] backoffice-dark:text-white/45">
                <tr>
                  <th className="px-5 py-4">Kỳ</th>
                  <th className="px-5 py-4">Creator</th>
                  <th className="px-5 py-4 text-right">Gross</th>
                  <th className="px-5 py-4 text-right">Thuế PIT</th>
                  <th className="px-5 py-4 text-right">Net payout</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 backoffice-dark:divide-white/10">
                {settlements.map((settlement) => (
                  <SettlementRow
                    key={settlement.creatorMonthlySettlementId}
                    settlement={settlement}
                    onOpen={setSelectedSettlementId}
                  />
                ))}
              </tbody>
            </table>
          </div>

          {settlementsQuery.data && (
            <div className="flex items-center justify-between border-t border-slate-200 px-5 py-3 backoffice-dark:border-white/10">
              <p className="text-sm font-semibold text-slate-500 backoffice-dark:text-white/45">
                Trang {settlementsQuery.data.pageNumber} / {settlementsQuery.data.totalPages || 1} ·{" "}
                {settlementsQuery.data.totalElements} settlement
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  disabled={settlementsQuery.data.isFirst || settlementsQuery.isFetching}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-50 disabled:opacity-40 backoffice-dark:border-white/10 backoffice-dark:hover:bg-white/10"
                  aria-label="Trang trước"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setPage((current) => current + 1)}
                  disabled={settlementsQuery.data.isLast || settlementsQuery.isFetching}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-50 disabled:opacity-40 backoffice-dark:border-white/10 backoffice-dark:hover:bg-white/10"
                  aria-label="Trang sau"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <SettlementDetailDialog
        role="admin"
        settlementId={selectedSettlementId}
        onClose={() => setSelectedSettlementId(null)}
      />

      {isRunModalOpen && <RunSettlementModal onClose={() => setIsRunModalOpen(false)} />}
    </div>
  );
}
