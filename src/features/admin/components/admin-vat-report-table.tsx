"use client";

import { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  FileSpreadsheet,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";

import { useVatReport } from "@/features/admin/hooks/use-admin-tax-summary";
import {
  exportVatExcel,
  triggerFileDownload,
  type VatReportItem,
} from "@/features/admin/api/admin-tax.api";
import { Button } from "@/shared/ui/button";

function formatVND(value: number = 0): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDateTime(isoString: string): string {
  if (!isoString) return "-";
  try {
    const date = new Date(isoString);
    return new Intl.DateTimeFormat("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }).format(date);
  } catch {
    return isoString;
  }
}

const ITEM_TYPES = [
  { label: "Tất cả các loại", value: "" },
  { label: "Gói Premium (SUBSCRIPTION)", value: "SUBSCRIPTION" },
  { label: "Tập phim/truyện (EPISODE)", value: "EPISODE" },
  { label: "Dịch vụ tương tác (ENGAGEMENT)", value: "ENGAGEMENT" },
];

function getItemTypeBadge(itemType: string) {
  switch (itemType?.toUpperCase()) {
    case "SUBSCRIPTION":
      return (
        <span className="inline-flex items-center rounded-md bg-purple-50 backoffice-dark:bg-purple-950/50 px-2 py-0.5 text-xs font-bold text-purple-700 backoffice-dark:text-purple-300 border border-purple-200 backoffice-dark:border-purple-800/40">
          SUBSCRIPTION
        </span>
      );
    case "EPISODE":
      return (
        <span className="inline-flex items-center rounded-md bg-blue-50 backoffice-dark:bg-blue-950/50 px-2 py-0.5 text-xs font-bold text-blue-700 backoffice-dark:text-blue-300 border border-blue-200 backoffice-dark:border-blue-800/40">
          EPISODE
        </span>
      );
    case "ENGAGEMENT":
      return (
        <span className="inline-flex items-center rounded-md bg-emerald-50 backoffice-dark:bg-emerald-950/50 px-2 py-0.5 text-xs font-bold text-emerald-700 backoffice-dark:text-emerald-300 border border-emerald-200 backoffice-dark:border-emerald-800/40">
          ENGAGEMENT
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center rounded-md bg-gray-100 backoffice-dark:bg-gray-800 px-2 py-0.5 text-xs font-bold text-gray-700 backoffice-dark:text-gray-300 border border-gray-200 backoffice-dark:border-gray-700">
          {itemType || "OTHER"}
        </span>
      );
  }
}

function getRevenueGroupBadge(group: string) {
  switch (group?.toUpperCase()) {
    case "CREATOR":
      return (
        <span className="inline-flex items-center rounded-md bg-amber-50 backoffice-dark:bg-amber-950/50 px-2 py-0.5 text-xs font-bold text-amber-700 backoffice-dark:text-amber-300 border border-amber-200 backoffice-dark:border-amber-800/40">
          CREATOR
        </span>
      );
    case "PLATFORM":
      return (
        <span className="inline-flex items-center rounded-md bg-indigo-50 backoffice-dark:bg-indigo-950/50 px-2 py-0.5 text-xs font-bold text-indigo-700 backoffice-dark:text-indigo-300 border border-indigo-200 backoffice-dark:border-indigo-800/40">
          PLATFORM
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center rounded-md bg-gray-100 backoffice-dark:bg-gray-800 px-2 py-0.5 text-xs font-bold text-gray-600 backoffice-dark:text-gray-400">
          {group || "-"}
        </span>
      );
  }
}

export function AdminVatReportTable() {
  const [selectedItemType, setSelectedItemType] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  const query = useVatReport({
    itemType: selectedItemType || undefined,
    startDate: startDate ? new Date(startDate).toISOString() : undefined,
    endDate: endDate ? new Date(endDate).toISOString() : undefined,
    page,
    pageSize,
  });

  const data = query.data;
  const items: VatReportItem[] = data?.content ?? [];
  const totalPages = data?.totalPages ?? 1;
  const totalElements = data?.totalElements ?? 0;

  const handleResetFilter = () => {
    setSelectedItemType("");
    setStartDate("");
    setEndDate("");
    setPage(1);
  };

  const handleExportExcel = async () => {
    try {
      setIsExporting(true);
      const blob = await exportVatExcel(
        startDate ? new Date(startDate).toISOString() : undefined,
        endDate ? new Date(endDate).toISOString() : undefined
      );
      triggerFileDownload(
        blob,
        `Bang_Ke_Thue_VAT_Ban_Ra_${new Date().toISOString().slice(0, 10)}.xlsx`
      );
      toast.success("Đã tải file Excel Bảng kê Thuế VAT Bán ra!");
    } catch {
      toast.error("Không thể xuất file Excel VAT.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="w-full space-y-6 max-w-7xl mx-auto font-sans">
      {/* Container Card */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.04]">
        {/* Header & Title */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-gray-100 pb-5 mb-5 backoffice-dark:border-white/10">
          <div>
            <h2 className="text-xl font-bold text-gray-900 backoffice-dark:text-white tracking-tight flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-violet-600" />
              Báo Cáo Chi Tiết Thuế VAT Theo Đơn Hàng
            </h2>
            <p className="text-xs font-semibold text-gray-500 mt-1 backoffice-dark:text-white/60">
              Tra cứu và đối soát dữ liệu thuế VAT phát sinh của từng mã giao dịch thanh toán
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="rounded-xl bg-violet-50 backoffice-dark:bg-violet-950/40 border border-violet-200 backoffice-dark:border-violet-800/40 px-3 py-1.5 text-xs font-bold text-violet-700 backoffice-dark:text-violet-300">
              Tổng cộng {totalElements} đơn hàng
            </span>

            {/* Export Excel Button */}
            <Button
              type="button"
              onClick={handleExportExcel}
              disabled={isExporting}
              className="h-9 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold px-3.5 flex items-center gap-1.5 shadow-sm"
            >
              {isExporting ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              Xuất Excel VAT Bán Ra
            </Button>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-gray-50/80 backoffice-dark:bg-slate-900/60 p-4 rounded-xl border border-gray-200/80 backoffice-dark:border-white/10 mb-6">
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            {/* ItemType Filter */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-500 backoffice-dark:text-gray-400">Loại đơn:</span>
              <select
                value={selectedItemType}
                onChange={(e) => {
                  setSelectedItemType(e.target.value);
                  setPage(1);
                }}
                className="bg-white backoffice-dark:bg-slate-900 border border-gray-200 backoffice-dark:border-white/10 rounded-xl px-3 py-1.5 text-xs font-bold text-gray-900 backoffice-dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500 shadow-sm"
              >
                {ITEM_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Range Inputs */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-500 backoffice-dark:text-gray-400">Từ ngày:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setPage(1);
                }}
                className="bg-white backoffice-dark:bg-slate-900 border border-gray-200 backoffice-dark:border-white/10 rounded-xl px-3 py-1.5 text-xs font-bold text-gray-900 backoffice-dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500 shadow-sm"
              />
              <span className="text-xs font-bold text-gray-400">-</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setPage(1);
                }}
                className="bg-white backoffice-dark:bg-slate-900 border border-gray-200 backoffice-dark:border-white/10 rounded-xl px-3 py-1.5 text-xs font-bold text-gray-900 backoffice-dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500 shadow-sm"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            {(selectedItemType || startDate || endDate) && (
              <button
                type="button"
                onClick={handleResetFilter}
                className="h-8 px-3 text-xs font-bold rounded-xl border border-gray-200 bg-white text-gray-700 hover:bg-gray-100 hover:text-gray-900 shadow-sm transition backoffice-dark:bg-white/5 backoffice-dark:border-white/10 backoffice-dark:text-white"
              >
                Xóa lọc
              </button>
            )}

            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
              className="bg-white backoffice-dark:bg-slate-900 border border-gray-200 backoffice-dark:border-white/10 rounded-xl px-3 py-1.5 text-xs font-bold text-gray-900 backoffice-dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
            >
              <option value={10}>10 đơn/trang</option>
              <option value={20}>20 đơn/trang</option>
              <option value={50}>50 đơn/trang</option>
            </select>
          </div>
        </div>

        {/* Loading State */}
        {query.isLoading && (
          <div className="min-h-64 flex items-center justify-center text-xs font-semibold text-gray-400 animate-pulse">
            Đang tải danh sách báo cáo chi tiết VAT...
          </div>
        )}

        {/* Error State */}
        {query.isError && (
          <div className="min-h-64 flex flex-col items-center justify-center p-6 text-center">
            <p className="text-xs font-bold text-red-500">
              Không thể tải dữ liệu báo cáo thuế VAT.
            </p>
            <Button
              type="button"
              onClick={() => void query.refetch()}
              className="mt-3 h-8 bg-blue-600 text-white text-xs font-bold px-4 rounded-xl"
            >
              Thử lại
            </Button>
          </div>
        )}

        {/* Table Content */}
        {!query.isLoading && !query.isError && (
          <>
            <div className="overflow-x-auto rounded-xl border border-gray-200 backoffice-dark:border-white/10">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-gray-50 backoffice-dark:bg-slate-900 text-gray-500 backoffice-dark:text-gray-400 uppercase font-bold tracking-wider border-b border-gray-200 backoffice-dark:border-white/10">
                  <tr>
                    <th className="px-4 py-3.5">Mã thanh toán</th>
                    <th className="px-4 py-3.5">Loại đơn</th>
                    <th className="px-4 py-3.5">Nhóm doanh thu</th>
                    <th className="px-4 py-3.5 text-right">Giá trị (Fiat)</th>
                    <th className="px-4 py-3.5 text-right">Tỷ lệ VAT</th>
                    <th className="px-4 py-3.5 text-right">Tiền VAT</th>
                    <th className="px-4 py-3.5">Ngày phát sinh</th>
                    <th className="px-4 py-3.5">Mã đơn hàng (Order ID)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 backoffice-dark:divide-white/10">
                  {items.length > 0 ? (
                    items.map((item) => (
                      <tr
                        key={item.orderId}
                        className="hover:bg-gray-50/80 backoffice-dark:hover:bg-white/[0.02] transition"
                      >
                        <td className="px-4 py-3.5 font-bold text-gray-900 backoffice-dark:text-white">
                          {item.paymentCode}
                        </td>
                        <td className="px-4 py-3.5">{getItemTypeBadge(item.itemType)}</td>
                        <td className="px-4 py-3.5">
                          {getRevenueGroupBadge(item.revenueGroup)}
                        </td>
                        <td className="px-4 py-3.5 text-right font-extrabold text-gray-900 backoffice-dark:text-white">
                          {formatVND(item.fiatAmount)}
                        </td>
                        <td className="px-4 py-3.5 text-right font-bold text-violet-600 backoffice-dark:text-violet-400">
                          {Math.round((item.vatRate ?? 0) * 100)}%
                        </td>
                        <td className="px-4 py-3.5 text-right font-black text-emerald-600 backoffice-dark:text-emerald-400">
                          {formatVND(item.vatAmount)}
                        </td>
                        <td className="px-4 py-3.5 font-semibold text-gray-500 backoffice-dark:text-gray-400">
                          {formatDateTime(item.createdAt)}
                        </td>
                        <td className="px-4 py-3.5 text-[11px] text-gray-400 max-w-[140px] truncate" title={item.orderId}>
                          {item.orderId}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={8}
                        className="px-4 py-12 text-center text-xs font-semibold text-gray-400"
                      >
                        Không có dữ liệu báo cáo chi tiết VAT phù hợp với bộ lọc.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-gray-100 backoffice-dark:border-white/10 pt-4 mt-4 text-xs font-bold text-gray-500">
              <span>
                Hiển thị trang <strong>{page}</strong> / <strong>{totalPages}</strong> (Tổng <strong>{totalElements}</strong> kết quả)
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1 || query.isFetching}
                  className="h-8 px-3 text-xs font-bold rounded-xl border border-gray-200 bg-white text-gray-700 hover:bg-gray-100 hover:text-gray-900 shadow-sm transition flex items-center gap-1 disabled:opacity-40 disabled:pointer-events-none backoffice-dark:bg-white/5 backoffice-dark:border-white/10 backoffice-dark:text-white"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Trước
                </button>

                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages || query.isFetching}
                  className="h-8 px-3 text-xs font-bold rounded-xl border border-gray-200 bg-white text-gray-700 hover:bg-gray-100 hover:text-gray-900 shadow-sm transition flex items-center gap-1 disabled:opacity-40 disabled:pointer-events-none backoffice-dark:bg-white/5 backoffice-dark:border-white/10 backoffice-dark:text-white"
                >
                  Sau
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
