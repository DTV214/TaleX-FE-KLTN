"use client";

import { useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  FileText,
  Loader2,
  RefreshCw,
  ReceiptText,
  ShieldCheck,
  WalletCards,
} from "lucide-react";
import { useOwnCreatorSettlements } from "../hooks/use-creator-settlements";
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

type CreatorRevenueTab = "overview" | "settlements" | "tax";
type StatusFilter = SettlementStatus | "ALL";

const tabs: Array<{
  icon: typeof WalletCards;
  label: string;
  value: CreatorRevenueTab;
}> = [
  { icon: WalletCards, label: "Tổng quan", value: "overview" },
  { icon: ReceiptText, label: "Quyết toán", value: "settlements" },
  { icon: FileText, label: "Thuế", value: "tax" },
];

function CreatorMetricCard({
  label,
  value,
  variant = "default",
}: {
  label: string;
  value: string;
  variant?: "default" | "gold" | "green" | "red";
}) {
  const valueClass =
    variant === "gold"
      ? "text-creator-gold"
      : variant === "green"
        ? "text-emerald-300"
        : variant === "red"
          ? "text-red-300"
          : "text-white";

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-5 shadow-[0_20px_70px_rgba(0,0,0,0.22)]">
      <p className="text-xs font-black uppercase tracking-[0.16em] text-creator-muted">
        {label}
      </p>
      <p className={`mt-3 text-2xl font-black tracking-tight ${valueClass}`}>
        {value}
      </p>
    </div>
  );
}

function CreatorSettlementRow({
  onOpen,
  settlement,
}: {
  onOpen: (id: string) => void;
  settlement: CreatorSettlementSummary;
}) {
  return (
    <tr className="transition hover:bg-white/[0.035]">
      <td className="px-5 py-4">
        <p className="font-black text-white">{formatMonth(settlement.settlementMonth)}</p>
        <p className="mt-1 text-xs font-semibold text-creator-muted">
          Tạo {formatDateTime(settlement.createdAt)}
        </p>
      </td>
      <td className="px-5 py-4 text-right font-black text-white">
        {formatVND(settlement.grossAmount)}
      </td>
      <td className="px-5 py-4 text-right font-black text-red-300">
        {formatVND(settlement.totalPenaltyAmount)}
      </td>
      <td className="px-5 py-4 text-right font-black text-amber-300">
        {formatVND(settlement.taxWithheldAmount)}
      </td>
      <td className="px-5 py-4 text-right font-black text-emerald-300">
        {formatVND(settlement.netPayoutAmount)}
      </td>
      <td className="px-5 py-4">
        <SettlementStatusBadge status={settlement.status} />
      </td>
      <td className="px-5 py-4 text-right">
        <button
          type="button"
          onClick={() => onOpen(settlement.creatorMonthlySettlementId)}
          className="inline-flex h-9 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 text-xs font-black text-zinc-200 transition hover:border-creator-gold/40 hover:text-creator-gold"
        >
          <Eye className="h-4 w-4" />
          Chi tiết
        </button>
      </td>
    </tr>
  );
}

export function CreatorSettlementsView() {
  const [activeTab, setActiveTab] = useState<CreatorRevenueTab>("overview");
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<StatusFilter>("ALL");
  const [settlementMonth, setSettlementMonth] = useState("");
  const [sortBy, setSortBy] = useState<SettlementSortBy>("settlementMonth");
  const [sortDirection, setSortDirection] = useState<SortDirection>("DESC");
  const [selectedSettlementId, setSelectedSettlementId] = useState<string | null>(null);

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

  const settlementsQuery = useOwnCreatorSettlements(queryParams);
  const settlements = settlementsQuery.data?.content ?? [];
  const totalNet = settlements.reduce((sum, item) => sum + item.netPayoutAmount, 0);
  const totalGross = settlements.reduce((sum, item) => sum + item.grossAmount, 0);
  const totalTax = settlements.reduce((sum, item) => sum + item.taxWithheldAmount, 0);
  const latestSettlement = settlements[0];

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[1.75rem] border border-white/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.08),rgba(255,255,255,0.025))] p-6 shadow-[0_28px_90px_rgba(0,0,0,0.35)]">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-creator-gold/25 bg-creator-gold/10 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-creator-gold">
              <WalletCards className="h-4 w-4" />
              Creator revenue
            </div>
            <h1 className="mt-4 text-3xl font-black tracking-tight text-white md:text-5xl">
              Doanh thu
            </h1>
            <p className="mt-3 max-w-3xl text-sm font-semibold leading-relaxed text-creator-muted md:text-base">
              Theo dõi các kỳ quyết toán doanh thu theo tháng, khoản khấu trừ, thuế PIT và trạng thái chi trả.
              Dữ liệu được lấy từ API `creator-settlement/own` theo tài khoản creator hiện tại.
            </p>
          </div>

          <button
            type="button"
            onClick={() => settlementsQuery.refetch()}
            disabled={settlementsQuery.isFetching}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.045] px-4 text-sm font-black text-zinc-200 transition hover:border-creator-gold/40 hover:text-creator-gold disabled:opacity-50"
          >
            <RefreshCw className={settlementsQuery.isFetching ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
            Tải lại
          </button>
        </div>
      </section>

      <div className="flex flex-wrap gap-2 rounded-2xl border border-white/10 bg-black/35 p-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.value;

          return (
            <button
              key={tab.value}
              type="button"
              onClick={() => setActiveTab(tab.value)}
              className={`inline-flex h-11 items-center gap-2 rounded-xl px-4 text-sm font-black transition ${
                active
                  ? "bg-creator-gold text-black shadow-[0_12px_40px_rgba(226,177,60,0.18)]"
                  : "text-creator-muted hover:bg-white/[0.05] hover:text-white"
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === "overview" && (
        <div className="space-y-6">
          <div className="grid gap-3 md:grid-cols-4">
            <CreatorMetricCard label="Gross trang này" value={formatVND(totalGross)} />
            <CreatorMetricCard label="Thuế PIT" value={formatVND(totalTax)} variant="gold" />
            <CreatorMetricCard label="Net payout" value={formatVND(totalNet)} variant="green" />
            <CreatorMetricCard
              label="Settlement mới nhất"
              value={latestSettlement ? labelForSettlementStatus(latestSettlement.status) : "-"}
            />
          </div>

          <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-5 w-5 text-creator-gold" />
              <div>
                <h2 className="text-lg font-black text-white">Cách hệ thống quyết toán</h2>
                <p className="mt-1 text-sm font-semibold leading-relaxed text-creator-muted">
                  BE gom các revenue transaction chưa quyết toán đến tháng target, trừ phạt,
                  tính thuế PIT nếu đủ ngưỡng, rồi tạo kỳ settlement. Creator chỉ xem dữ liệu của
                  chính mình từ danh sách `/own`.
                </p>
              </div>
            </div>
          </section>
        </div>
      )}

      {activeTab === "tax" && (
        <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
          <div className="flex items-start gap-4">
            <FileText className="mt-1 h-6 w-6 text-creator-gold" />
            <div>
              <h2 className="text-xl font-black text-white">Thuế</h2>
              <p className="mt-2 max-w-3xl text-sm font-semibold leading-relaxed text-creator-muted">
                Tab này được giữ sẵn cho bước tiếp theo. Hiện tại thuế PIT đã xuất hiện trong từng
                settlement qua `taxRate` và `taxWithheldAmount`; hồ sơ mã số thuế vẫn nằm ở mục
                Kiếm tiền/Tài khoản thanh toán.
              </p>
            </div>
          </div>
        </section>
      )}

      {activeTab === "settlements" && (
        <div className="space-y-5">
          <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <div className="grid gap-3 lg:grid-cols-[1fr_220px_220px_220px]">
              <input
                type="month"
                value={settlementMonth}
                onChange={(event) => {
                  setSettlementMonth(event.target.value);
                  setPage(1);
                }}
                className="h-11 rounded-xl border border-white/10 bg-black/35 px-3 text-sm font-bold text-white outline-none transition focus:border-creator-gold/60"
              />
              <select
                value={status}
                onChange={(event) => {
                  setStatus(event.target.value as StatusFilter);
                  setPage(1);
                }}
                className="h-11 rounded-xl border border-white/10 bg-black/35 px-3 text-sm font-bold text-white outline-none transition focus:border-creator-gold/60"
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
                className="h-11 rounded-xl border border-white/10 bg-black/35 px-3 text-sm font-bold text-white outline-none transition focus:border-creator-gold/60"
              >
                <option value="settlementMonth">Theo tháng</option>
                <option value="createdAt">Theo ngày tạo</option>
                <option value="grossAmount">Theo gross</option>
                <option value="netPayoutAmount">Theo net payout</option>
                <option value="status">Theo trạng thái</option>
              </select>
              <select
                value={sortDirection}
                onChange={(event) => setSortDirection(event.target.value as SortDirection)}
                className="h-11 rounded-xl border border-white/10 bg-black/35 px-3 text-sm font-bold text-white outline-none transition focus:border-creator-gold/60"
              >
                <option value="DESC">Giảm dần</option>
                <option value="ASC">Tăng dần</option>
              </select>
            </div>
          </section>

          {settlementsQuery.isLoading && (
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-6 py-16 text-center">
              <Loader2 className="mx-auto h-7 w-7 animate-spin text-creator-muted" />
              <p className="mt-3 text-sm font-semibold text-creator-muted">
                Đang tải quyết toán của bạn...
              </p>
            </div>
          )}

          {settlementsQuery.isError && (
            <SettlementErrorState
              message="Không thể tải danh sách quyết toán của creator."
              onRetry={() => settlementsQuery.refetch()}
              variant="creator"
            />
          )}

          {!settlementsQuery.isLoading && !settlementsQuery.isError && settlements.length === 0 && (
            <SettlementEmptyState
              title="Chưa có kỳ quyết toán"
              description="Khi hệ thống chốt sổ tháng hoặc admin chạy quyết toán, dữ liệu của bạn sẽ xuất hiện ở đây."
              variant="creator"
            />
          )}

          {settlements.length > 0 && (
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04]">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[980px] text-left text-sm">
                  <thead className="border-b border-white/10 bg-white/[0.035] text-xs font-black uppercase tracking-wide text-creator-muted">
                    <tr>
                      <th className="px-5 py-4">Kỳ</th>
                      <th className="px-5 py-4 text-right">Gross</th>
                      <th className="px-5 py-4 text-right">Phạt</th>
                      <th className="px-5 py-4 text-right">Thuế</th>
                      <th className="px-5 py-4 text-right">Net payout</th>
                      <th className="px-5 py-4">Status</th>
                      <th className="px-5 py-4 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {settlements.map((settlement) => (
                      <CreatorSettlementRow
                        key={settlement.creatorMonthlySettlementId}
                        settlement={settlement}
                        onOpen={setSelectedSettlementId}
                      />
                    ))}
                  </tbody>
                </table>
              </div>

              {settlementsQuery.data && (
                <div className="flex items-center justify-between border-t border-white/10 px-5 py-3">
                  <p className="text-sm font-semibold text-creator-muted">
                    Trang {settlementsQuery.data.pageNumber} / {settlementsQuery.data.totalPages || 1} ·{" "}
                    {settlementsQuery.data.totalElements} settlement
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setPage((current) => Math.max(1, current - 1))}
                      disabled={settlementsQuery.data.isFirst || settlementsQuery.isFetching}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 text-creator-muted transition hover:border-creator-gold/40 hover:text-creator-gold disabled:opacity-40"
                      aria-label="Trang trước"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setPage((current) => current + 1)}
                      disabled={settlementsQuery.data.isLast || settlementsQuery.isFetching}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 text-creator-muted transition hover:border-creator-gold/40 hover:text-creator-gold disabled:opacity-40"
                      aria-label="Trang sau"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <SettlementDetailDialog
        role="creator"
        settlementId={selectedSettlementId}
        onClose={() => setSelectedSettlementId(null)}
      />
    </div>
  );
}
