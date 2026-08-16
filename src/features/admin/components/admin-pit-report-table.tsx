"use client";

import { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  RefreshCw,
  Scale,
} from "lucide-react";
import { toast } from "sonner";

import { usePitReport } from "@/features/admin/hooks/use-admin-tax-summary";
import {
  exportBk052Excel,
  triggerFileDownload,
  type PitReportItem,
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

function formatMonthLabel(yearMonth: string): string {
  if (!yearMonth) return "-";
  const [year, month] = yearMonth.split("-");
  if (year && month) {
    return `Tháng ${month}/${year}`;
  }
  return yearMonth;
}

const STATUS_OPTIONS = [
  { label: "Tất cả trạng thái", value: "" },
  { label: "Đã duyệt (APPROVED)", value: "APPROVED" },
  { label: "Đã thanh toán (PAID)", value: "PAID" },
  { label: "Chờ xử lý (PENDING)", value: "PENDING" },
  { label: "Từ chối (REJECTED)", value: "REJECTED" },
];

function getStatusBadge(status: string) {
  switch (status?.toUpperCase()) {
    case "APPROVED":
      return (
        <span className="inline-flex items-center rounded-md bg-blue-50 backoffice-dark:bg-blue-950/50 px-2 py-0.5 text-xs font-bold text-blue-700 backoffice-dark:text-blue-300 border border-blue-200 backoffice-dark:border-blue-800/40">
          ĐÃ DUYỆT
        </span>
      );
    case "PAID":
      return (
        <span className="inline-flex items-center rounded-md bg-emerald-50 backoffice-dark:bg-emerald-950/50 px-2 py-0.5 text-xs font-bold text-emerald-700 backoffice-dark:text-emerald-300 border border-emerald-200 backoffice-dark:border-emerald-800/40">
          ĐÃ THANH TOÁN
        </span>
      );
    case "PENDING":
      return (
        <span className="inline-flex items-center rounded-md bg-amber-50 backoffice-dark:bg-amber-950/50 px-2 py-0.5 text-xs font-bold text-amber-700 backoffice-dark:text-amber-300 border border-amber-200 backoffice-dark:border-amber-800/40">
          CHỜ XỬ LÝ
        </span>
      );
    case "REJECTED":
      return (
        <span className="inline-flex items-center rounded-md bg-red-50 backoffice-dark:bg-red-950/50 px-2 py-0.5 text-xs font-bold text-red-700 backoffice-dark:text-red-300 border border-red-200 backoffice-dark:border-red-800/40">
          TỪ CHỐI
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center rounded-md bg-gray-100 backoffice-dark:bg-gray-800 px-2 py-0.5 text-xs font-bold text-gray-700 backoffice-dark:text-gray-300 border border-gray-200 backoffice-dark:border-gray-700">
          {status || "UNKNOWN"}
        </span>
      );
  }
}

export function AdminPitReportTable() {
  const [yearMonth, setYearMonth] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  const query = usePitReport({
    yearMonth: yearMonth || undefined,
    status: selectedStatus || undefined,
    page,
    pageSize,
  });

  const data = query.data;
  const items: PitReportItem[] = data?.content ?? [];
  const totalPages = data?.totalPages ?? 1;
  const totalElements = data?.totalElements ?? 0;

  const handleResetFilter = () => {
    setYearMonth("");
    setSelectedStatus("");
    setPage(1);
  };

  const handleExportBk052 = async () => {
    try {
      setIsExporting(true);
      const yearToExport = yearMonth
        ? parseInt(yearMonth.split("-")[0])
        : new Date().getFullYear();
      const blob = await exportBk052Excel(yearToExport);
      triggerFileDownload(
        blob,
        `Bang_Ke_05_2_BK_TNCN_Nam_${yearToExport}.xlsx`
      );
      toast.success(`Đã tải Bảng kê 05-2/BK-TNCN năm ${yearToExport}!`);
    } catch {
      toast.error("Không thể xuất file Excel Bảng kê 05-2/BK-TNCN.");
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
              <Scale className="w-5 h-5 text-violet-600" />
              Báo Cáo Chi Tiết Thuế TNCN (PIT) Của Creator
            </h2>
            <p className="text-xs font-semibold text-gray-500 mt-1 backoffice-dark:text-white/60">
              Thống kê khấu trừ Thuế Thu Nhập Cá Nhân (PIT) theo kỳ quyết toán của Creator
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="rounded-xl bg-violet-50 backoffice-dark:bg-violet-950/40 border border-violet-200 backoffice-dark:border-violet-800/40 px-3 py-1.5 text-xs font-bold text-violet-700 backoffice-dark:text-violet-300">
              Tổng cộng {totalElements} bản ghi PIT
            </span>

            {/* Export Excel Button */}
            <Button
              type="button"
              onClick={handleExportBk052}
              disabled={isExporting}
              className="h-9 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-bold px-3.5 flex items-center gap-1.5 shadow-sm"
            >
              {isExporting ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              Xuất Bảng Kê 05-2/BK-TNCN
            </Button>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-gray-50/80 backoffice-dark:bg-slate-900/60 p-4 rounded-xl border border-gray-200/80 backoffice-dark:border-white/10 mb-6">
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            {/* YearMonth Filter */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-500 backoffice-dark:text-gray-400">Kỳ (Tháng/Năm):</span>
              <input
                type="month"
                value={yearMonth}
                onChange={(e) => {
                  setYearMonth(e.target.value);
                  setPage(1);
                }}
                className="bg-white backoffice-dark:bg-slate-900 border border-gray-200 backoffice-dark:border-white/10 rounded-xl px-3 py-1.5 text-xs font-bold text-gray-900 backoffice-dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500 shadow-sm"
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-500 backoffice-dark:text-gray-400">Trạng thái:</span>
              <select
                value={selectedStatus}
                onChange={(e) => {
                  setSelectedStatus(e.target.value);
                  setPage(1);
                }}
                className="bg-white backoffice-dark:bg-slate-900 border border-gray-200 backoffice-dark:border-white/10 rounded-xl px-3 py-1.5 text-xs font-bold text-gray-900 backoffice-dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500 shadow-sm"
              >
                {STATUS_OPTIONS.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {(yearMonth || selectedStatus) && (
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
              <option value={10}>10 bản ghi/trang</option>
              <option value={20}>20 bản ghi/trang</option>
              <option value={50}>50 bản ghi/trang</option>
            </select>
          </div>
        </div>

        {/* Loading State */}
        {query.isLoading && (
          <div className="min-h-64 flex items-center justify-center text-xs font-semibold text-gray-400 animate-pulse">
            Đang tải dữ liệu báo cáo thuế TNCN (PIT)...
          </div>
        )}

        {/* Error State */}
        {query.isError && (
          <div className="min-h-64 flex flex-col items-center justify-center p-6 text-center">
            <p className="text-xs font-bold text-red-500">
              Không thể tải dữ liệu báo cáo thuế TNCN.
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
                    <th className="px-4 py-3.5">Kỳ quyết toán</th>
                    <th className="px-4 py-3.5">Tên Creator</th>
                    <th className="px-4 py-3.5">MST cá nhân</th>
                    <th className="px-4 py-3.5">Số CCCD/CMND</th>
                    <th className="px-4 py-3.5 text-right">Thu nhập Gross</th>
                    <th className="px-4 py-3.5 text-right">Tỷ lệ PIT</th>
                    <th className="px-4 py-3.5 text-right">Thuế PIT khấu trừ</th>
                    <th className="px-4 py-3.5 text-right">Thực nhận (Net)</th>
                    <th className="px-4 py-3.5">Trạng thái</th>
                    <th className="px-4 py-3.5">Ngày khởi tạo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 backoffice-dark:divide-white/10">
                  {items.length > 0 ? (
                    items.map((item) => (
                      <tr
                        key={item.settlementId}
                        className="hover:bg-gray-50/80 backoffice-dark:hover:bg-white/[0.02] transition"
                      >
                        <td className="px-4 py-3.5 font-bold text-gray-900 backoffice-dark:text-white">
                          {formatMonthLabel(item.settlementMonth)}
                        </td>
                        <td className="px-4 py-3.5 font-bold text-gray-900 backoffice-dark:text-white">
                          {item.creatorFullName || (
                            <span className="text-gray-400 font-normal">
                              Creator #{item.creatorId ? item.creatorId.slice(0, 8) : "N/A"}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 font-semibold text-gray-700 backoffice-dark:text-gray-300">
                          {item.taxId ? (
                            <strong className="text-gray-900 backoffice-dark:text-white font-bold">
                              {item.taxId}
                            </strong>
                          ) : (
                            <span className="text-gray-400 font-normal italic">Chưa đăng ký</span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 font-semibold text-gray-700 backoffice-dark:text-gray-300">
                          {item.idNumber ? (
                            <span>{item.idNumber}</span>
                          ) : (
                            <span className="text-gray-400 font-normal italic">Chưa cập nhật</span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-right font-extrabold text-gray-900 backoffice-dark:text-white">
                          {formatVND(item.grossAmount)}
                        </td>
                        <td className="px-4 py-3.5 text-right font-bold text-violet-600 backoffice-dark:text-violet-400">
                          {Math.round((item.taxRate ?? 0) * 100)}%
                        </td>
                        <td className="px-4 py-3.5 text-right font-black text-rose-600 backoffice-dark:text-rose-400">
                          {formatVND(item.taxWithheldAmount)}
                        </td>
                        <td className="px-4 py-3.5 text-right font-black text-emerald-600 backoffice-dark:text-emerald-400">
                          {formatVND(item.netPayoutAmount)}
                        </td>
                        <td className="px-4 py-3.5">{getStatusBadge(item.status)}</td>
                        <td className="px-4 py-3.5 font-semibold text-gray-500 backoffice-dark:text-gray-400">
                          {formatDateTime(item.createdAt)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={10}
                        className="px-4 py-12 text-center text-xs font-semibold text-gray-400"
                      >
                        Không có dữ liệu báo cáo thuế TNCN phù hợp với bộ lọc.
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
