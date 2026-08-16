"use client";

import Link from "next/link";
import { ArrowRight, Calculator, Receipt, Scale, DollarSign } from "lucide-react";
import { useAdminTaxSummary } from "@/features/admin/hooks/use-admin-tax-summary";

function formatVND(value: number = 0): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);
}

export function AdminTaxSummaryWidget() {
  const currentYear = new Date().getFullYear();
  const query = useAdminTaxSummary({ year: currentYear });
  const summary = query.data;

  return (
    <div className="w-full rounded-2xl bg-white border border-gray-100 p-6 shadow-sm transition-all hover:shadow-md backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.04]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-5 backoffice-dark:border-white/10">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-purple-50 flex items-center justify-center backoffice-dark:bg-purple-500/20">
            <Calculator className="h-5 w-5 text-purple-600 backoffice-dark:text-purple-300" />
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900 backoffice-dark:text-white">
              Tổng Quan Thuế Enterprise ({currentYear})
            </h3>
            <p className="text-xs font-medium text-gray-500 backoffice-dark:text-white/60 mt-0.5">
              Tổng quan nghĩa vụ thuế và thực chi quyết toán năm {currentYear}
            </p>
          </div>
        </div>

        <Link
          href="/admin/tax-summary"
          className="inline-flex items-center gap-1.5 rounded-xl border border-blue-100 bg-blue-50 px-3.5 py-2 text-xs font-bold text-blue-600 transition hover:bg-blue-100 hover:text-blue-700 backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.05] backoffice-dark:text-white/80 backoffice-dark:hover:bg-white/10 backoffice-dark:hover:text-white group shrink-0"
        >
          <span>Xem báo cáo thuế đầy đủ</span>
          <ArrowRight className="h-3.5 w-3.5 text-blue-500 transition-transform group-hover:translate-x-0.5 group-hover:text-blue-700 backoffice-dark:text-white/60 backoffice-dark:group-hover:text-white" />
        </Link>
      </div>

      {query.isLoading ? (
        <div className="py-8 flex justify-center text-xs font-medium text-gray-400">
          Đang tải dữ liệu thuế...
        </div>
      ) : query.isError ? (
        <div className="py-6 text-xs font-medium text-red-500 text-center">
          Không thể tải dữ liệu thuế tổng quan.
        </div>
      ) : summary ? (
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-6">
          {/* Total VAT */}
          <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.04]">
            <div className="h-10 w-10 rounded-xl bg-purple-50 flex items-center justify-center mb-4 backoffice-dark:bg-purple-500/20">
              <Receipt className="h-5 w-5 text-purple-600 backoffice-dark:text-purple-300" />
            </div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 backoffice-dark:text-white/60">
              Tổng Thuế VAT
            </p>
            <h3 className="text-2xl font-bold text-gray-900 backoffice-dark:text-white">
              {formatVND(summary.totalVatAmount)}
            </h3>
          </div>

          {/* PIT Withheld */}
          <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.04]">
            <div className="h-10 w-10 rounded-xl bg-rose-50 flex items-center justify-center mb-4 backoffice-dark:bg-rose-500/20">
              <Scale className="h-5 w-5 text-rose-600 backoffice-dark:text-rose-300" />
            </div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 backoffice-dark:text-white/60">
              Khấu Trừ PIT
            </p>
            <h3 className="text-2xl font-bold text-gray-900 backoffice-dark:text-white">
              {formatVND(summary.totalPitWithheld)}
            </h3>
          </div>

          {/* Net Payout */}
          <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.04]">
            <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center mb-4 backoffice-dark:bg-emerald-500/20">
              <DollarSign className="h-5 w-5 text-emerald-600 backoffice-dark:text-emerald-300" />
            </div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 backoffice-dark:text-white/60">
              Thực Chi (Net Payout)
            </p>
            <h3 className="text-2xl font-bold text-gray-900 backoffice-dark:text-white">
              {formatVND(summary.totalNetPayout)}
            </h3>
          </div>
        </div>
      ) : null}
    </div>
  );
}
