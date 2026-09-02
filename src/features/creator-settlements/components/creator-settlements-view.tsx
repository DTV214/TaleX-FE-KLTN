"use client";

import { useMemo, useState } from "react";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  FileDown,
  FileText,
  Info,
  Loader2,
  ReceiptText,
  RefreshCw,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import {
  exportCreatorTaxCertificate,
  triggerFileDownload,
} from "../api/creator-settlements.api";
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

type CreatorRevenueTab = "settlements" | "tax";
type StatusFilter = SettlementStatus | "ALL";

const tabs: Array<{
  icon: LucideIcon;
  label: string;
  value: CreatorRevenueTab;
}> = [
    { icon: ReceiptText, label: "Quyết toán", value: "settlements" },
    { icon: FileText, label: "Thuế", value: "tax" },
  ];

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
  const [activeTab, setActiveTab] = useState<CreatorRevenueTab>("settlements");
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

  const [taxYear, setTaxYear] = useState<number>(new Date().getFullYear());
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  const totalTaxWithheld = useMemo(
    () => settlements.reduce((sum, s) => sum + (s.taxWithheldAmount || 0), 0),
    [settlements]
  );
  const totalGrossIncome = useMemo(
    () => settlements.reduce((sum, s) => sum + (s.grossAmount || 0), 0),
    [settlements]
  );
  const totalNetPayout = useMemo(
    () => settlements.reduce((sum, s) => sum + (s.netPayoutAmount || 0), 0),
    [settlements]
  );

  const handleDownloadTaxCertificate = async (yearToDownload?: number) => {
    const targetYear = yearToDownload ?? taxYear;
    try {
      setIsDownloadingPdf(true);
      const blob = await exportCreatorTaxCertificate({ taxYear: targetYear });
      triggerFileDownload(
        blob,
        `Chung_Tu_Khau_Tru_Thue_TNCN_Nam_${targetYear}.pdf`
      );
      toast.success(
        `Tải file thành công!`
      );
    } catch {
      toast.error(
        "Không thể tải file. Vui lòng kiểm tra lại hoặc thử lại sau."
      );
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-creator-border pb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-2xl sm:text-3xl font-bold text-white">
              {activeTab === "tax" ? "Thuế & Chứng từ khấu trừ" : "Quyết Toán"}
            </h2>
          </div>
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

      <div className="flex flex-wrap gap-2 rounded-2xl border border-white/10 bg-black/35 p-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.value;

          return (
            <button
              key={tab.value}
              type="button"
              onClick={() => setActiveTab(tab.value)}
              className={`inline-flex h-11 items-center gap-2 rounded-xl px-4 text-sm font-black transition ${active
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

      {activeTab === "tax" && (
        <div className="space-y-6">
          {/* Summary Metric Cards */}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/[0.04] p-5">
              <p className="text-xs font-bold uppercase tracking-wider text-amber-300/80">
                Tổng Thuế TNCN Đã Khấu Trừ
              </p>
              <p className="mt-2 text-2xl font-black text-amber-300 md:text-3xl">
                {formatVND(totalTaxWithheld)}
              </p>
              <p className="mt-1 text-xs font-semibold text-creator-muted">
                Khấu trừ tự động qua các kỳ quyết toán
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
              <p className="text-xs font-bold uppercase tracking-wider text-creator-muted">
                Tổng Thu Nhập Trước Thuế (Gross)
              </p>
              <p className="mt-2 text-2xl font-black text-white md:text-3xl">
                {formatVND(totalGrossIncome)}
              </p>
              <p className="mt-1 text-xs font-semibold text-creator-muted">
                Tổng thu nhập phát sinh từ nội dung & chia sẻ
              </p>
            </div>

            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.04] p-5 sm:col-span-2 xl:col-span-1">
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-300/80">
                Tổng Thực Nhận (Net Payout)
              </p>
              <p className="mt-2 text-2xl font-black text-emerald-300 md:text-3xl">
                {formatVND(totalNetPayout)}
              </p>
              <p className="mt-1 text-xs font-semibold text-creator-muted">
                Thu nhập thực tế chuyển về tài khoản
              </p>
            </div>
          </div>

          {/* Export Tax Certificate Card */}
          <section className="overflow-hidden rounded-2xl border border-creator-gold/20 bg-[linear-gradient(135deg,rgba(226,177,60,0.08),rgba(255,255,255,0.02))] p-6 shadow-lg">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 rounded-full border border-creator-gold/30 bg-creator-gold/10 px-3 py-1 text-xs font-black text-creator-gold">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Chứng từ điện tử hợp lệ
                </div>
                <h2 className="text-xl font-black text-white md:text-2xl">
                  Chứng từ Khấu trừ Thuế TNCN Điện tử
                </h2>
                <p className="max-w-2xl text-sm font-semibold leading-relaxed text-creator-muted">
                  Tải chứng từ khấu trừ thuế TNCN điện tử theo quy định của Tổng cục Thuế để sử dụng khi thực hiện quyết toán thuế cuối năm hoặc hoàn thuế TNCN cá nhân.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-white/10 bg-black/40 p-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-creator-gold" />
                  <span className="text-xs font-bold text-creator-muted">Năm tính thuế:</span>
                  <select
                    value={taxYear}
                    onChange={(e) => setTaxYear(Number(e.target.value))}
                    className="h-10 rounded-xl border border-white/10 bg-zinc-900 px-3 text-sm font-bold text-white outline-none transition focus:border-creator-gold/60"
                  >
                    {Array.from({ length: 4 }, (_, i) => new Date().getFullYear() - i).map((year) => (
                      <option key={year} value={year}>
                        Năm {year}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="button"
                  onClick={() => handleDownloadTaxCertificate()}
                  disabled={isDownloadingPdf}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-creator-gold px-5 text-sm font-black text-black shadow-[0_8px_24px_rgba(226,177,60,0.25)] transition hover:bg-yellow-400 disabled:opacity-50"
                >
                  {isDownloadingPdf ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <FileDown className="h-4 w-4" />
                  )}
                  Tải Chứng Từ Thuế
                </button>
              </div>
            </div>
          </section>

          {/* Tax Breakdown Table per Settlement */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-white">
                Chi tiết khấu trừ thuế qua các kỳ quyết toán
              </h3>
              <span className="text-xs font-semibold text-creator-muted">
                {settlements.length} kỳ quyết toán
              </span>
            </div>

            {settlementsQuery.isLoading && (
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-6 py-12 text-center">
                <Loader2 className="mx-auto h-7 w-7 animate-spin text-creator-muted" />
                <p className="mt-3 text-sm font-semibold text-creator-muted">
                  Đang tải thông tin thuế của bạn...
                </p>
              </div>
            )}

            {!settlementsQuery.isLoading && settlements.length === 0 && (
              <SettlementEmptyState
                title="Chưa có dữ liệu thuế"
                description="Khi có các kỳ quyết toán phát sinh thu nhập và thuế được khấu trừ, lịch sử sẽ xuất hiện tại đây."
                variant="creator"
              />
            )}

            {settlements.length > 0 && (
              <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04]">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[900px] text-left text-sm">
                    <thead className="border-b border-white/10 bg-white/[0.035] text-xs font-black uppercase tracking-wide text-creator-muted">
                      <tr>
                        <th className="px-5 py-4">Kỳ quyết toán</th>
                        <th className="px-5 py-4 text-right">Thu nhập chịu thuế (Gross)</th>
                        <th className="px-5 py-4 text-right">Tỷ lệ thuế TNCN</th>
                        <th className="px-5 py-4 text-right">Thuế TNCN đã khấu trừ</th>
                        <th className="px-5 py-4 text-right">Thực nhận (Net)</th>
                        <th className="px-5 py-4">Trạng thái</th>
                        <th className="px-5 py-4 text-right">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                      {settlements.map((item) => (
                        <tr key={item.creatorMonthlySettlementId} className="transition hover:bg-white/[0.035]">
                          <td className="px-5 py-4 font-black text-white">
                            {formatMonth(item.settlementMonth)}
                          </td>
                          <td className="px-5 py-4 text-right font-black text-white">
                            {formatVND(item.grossAmount)}
                          </td>
                          <td className="px-5 py-4 text-right font-bold text-amber-300/90">
                            {item.taxRate ? `${(item.taxRate * 100).toFixed(0)}%` : "0%"}
                          </td>
                          <td className="px-5 py-4 text-right font-black text-amber-300">
                            {formatVND(item.taxWithheldAmount)}
                          </td>
                          <td className="px-5 py-4 text-right font-black text-emerald-300">
                            {formatVND(item.netPayoutAmount)}
                          </td>
                          <td className="px-5 py-4">
                            <SettlementStatusBadge status={item.status} />
                          </td>
                          <td className="px-5 py-4 text-right">
                            <button
                              type="button"
                              onClick={() => setSelectedSettlementId(item.creatorMonthlySettlementId)}
                              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-3 text-xs font-bold text-zinc-200 transition hover:border-creator-gold/40 hover:text-creator-gold"
                            >
                              <Eye className="h-3.5 w-3.5" />
                              Xem
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Tax Information Banner */}
          <div className="flex items-start gap-3.5 rounded-2xl border border-white/10 bg-white/[0.02] p-5">
            <Info className="mt-0.5 h-5 w-5 flex-shrink-0 text-creator-gold" />
            <div className="space-y-1 text-xs font-medium leading-relaxed text-creator-muted">
              <p className="font-bold text-zinc-200">Quy định khấu trừ thuế đối với Creator:</p>
              <p>
                - Theo quy định pháp luật thuế Việt Nam, nền tảng thực hiện khấu trừ thuế TNCN trực tiếp trên từng khoản thu nhập quyết toán của Creator trước khi chi trả.
              </p>
              <p>
                - Đảm bảo bạn đã cập nhật chính xác Mã số thuế cá nhân và CCCD tại mục{" "}
                <span className="font-bold text-white">Kiếm tiền / Tài khoản thanh toán</span> để thông tin chứng từ khấu trừ thuế điện tử được cơ quan Thuế chấp thuận.
              </p>
            </div>
          </div>
        </div>
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
                <option value="grossAmount">Theo doanh thu</option>
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
                      <th className="px-5 py-4 text-right">Doanh Thu</th>
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
