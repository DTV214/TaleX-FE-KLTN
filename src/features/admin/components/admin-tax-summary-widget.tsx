"use client";

import Link from "next/link";
import { ArrowRight, Calculator, Receipt, Scale, ShieldCheck, DollarSign } from "lucide-react";
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
    <div className="w-full rounded-2xl bg-white border border-slate-200/80 p-5 shadow-sm transition-all hover:shadow-md backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.04]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4 backoffice-dark:border-white/10">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-violet-600/10 text-violet-600 dark:bg-violet-500/20 dark:text-violet-300">
            <Calculator className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900 backoffice-dark:text-white">
                Tổng Quan Thuế Enterprise ({currentYear})
              </h3>
              <span className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-bold text-violet-700 dark:bg-violet-900/40 dark:text-violet-300">
                <ShieldCheck className="h-3 w-3" /> VAT & PIT
              </span>
            </div>
            <p className="text-xs text-slate-500 backoffice-dark:text-slate-400">
              Tổng quan nghĩa vụ thuế và thực chi quyết toán năm {currentYear}
            </p>
          </div>
        </div>

        <Link
          href="/admin/tax-summary"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-violet-600 hover:text-violet-700 dark:text-violet-400 dark:hover:text-violet-300 group shrink-0"
        >
          <span>Xem báo cáo thuế đầy đủ</span>
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>

      {query.isLoading ? (
        <div className="py-6 flex justify-center text-xs text-slate-400">
          Đang tải dữ liệu thuế...
        </div>
      ) : query.isError ? (
        <div className="py-4 text-xs text-rose-500">
          Không thể tải dữ liệu thuế tổng quan.
        </div>
      ) : summary ? (
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Total VAT */}
          <div className="rounded-xl bg-violet-50/60 p-3.5 border border-violet-100/80 dark:bg-violet-950/20 dark:border-violet-900/30">
            <div className="flex items-center justify-between text-xs font-bold text-violet-700 dark:text-violet-300">
              <span>TỔNG THUẾ VAT</span>
              <Receipt className="h-4 w-4 text-violet-600 dark:text-violet-400" />
            </div>
            <p className="mt-1.5 text-lg font-black text-violet-950 dark:text-violet-100">
              {formatVND(summary.totalVatAmount)}
            </p>
          </div>

          {/* PIT Withheld */}
          <div className="rounded-xl bg-rose-50/60 p-3.5 border border-rose-100/80 dark:bg-rose-950/20 dark:border-rose-900/30">
            <div className="flex items-center justify-between text-xs font-bold text-rose-700 dark:text-rose-300">
              <span>KHẤU TRỪ PIT</span>
              <Scale className="h-4 w-4 text-rose-600 dark:text-rose-400" />
            </div>
            <p className="mt-1.5 text-lg font-black text-rose-950 dark:text-rose-100">
              {formatVND(summary.totalPitWithheld)}
            </p>
          </div>

          {/* Net Payout */}
          <div className="rounded-xl bg-emerald-50/60 p-3.5 border border-emerald-100/80 dark:bg-emerald-950/20 dark:border-emerald-900/30">
            <div className="flex items-center justify-between text-xs font-bold text-emerald-700 dark:text-emerald-300">
              <span>THỰC CHI (NET PAYOUT)</span>
              <DollarSign className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <p className="mt-1.5 text-lg font-black text-emerald-950 dark:text-emerald-100">
              {formatVND(summary.totalNetPayout)}
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
