"use client";

import { useState } from "react";
import {
  Building2,
  ChevronDown,
  FileCheck2,
  MapPin,
  Receipt,
  Scale,
  PieChart as PieIcon,
} from "lucide-react";
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
} from "recharts";

import { useAdminTaxSummary } from "@/features/admin/hooks/use-admin-tax-summary";

function formatVND(value: number = 0): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatNumber(value: number = 0): string {
  return new Intl.NumberFormat("vi-VN").format(value);
}

const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: 5 }, (_, i) => CURRENT_YEAR - i);

const VAT_DONUT_COLORS = ["#8b5cf6", "#3b82f6"]; // Creator VAT (violet-500), Platform VAT (blue-500)

export function AdminTaxSummaryCard() {
  const [selectedYear, setSelectedYear] = useState<number>(CURRENT_YEAR);
  const [selectedQuarter, setSelectedQuarter] = useState<number | undefined>(undefined);

  const query = useAdminTaxSummary({
    year: selectedYear,
    quarter: selectedQuarter,
  });

  const summary = query.data;

  // Donut chart data
  const creatorVat = summary?.creatorVatAmount ?? 0;
  const platformVat = summary?.platformVatAmount ?? 0;
  const donutData = [
    { name: "VAT Creator", value: creatorVat },
    { name: "VAT Nền Tảng", value: platformVat },
  ];

  return (
    <div className="w-full space-y-6 max-w-7xl mx-auto font-sans">
      {/* 1. Header Card: Tổng Quan Thuế */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.04]">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-gray-100 pb-4 mb-4 backoffice-dark:border-white/10">
          <div>
            <h2 className="text-xl font-bold text-gray-900 backoffice-dark:text-white tracking-tight flex items-center gap-2">
              <Receipt className="w-5 h-5 text-violet-600" />
              Tổng Quan Thuế
            </h2>
            <p className="text-xs font-semibold text-gray-500 mt-1 backoffice-dark:text-white/60">
              Tổng quan thuế VAT & PIT Enterprise
            </p>
          </div>

          {/* Year & Quarter Selector */}
          <div className="flex items-center gap-3">
            <div className="relative inline-flex items-center">
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="appearance-none bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2 pr-9 text-sm font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500 cursor-pointer shadow-sm"
              >
                {YEAR_OPTIONS.map((year) => (
                  <option key={year} value={year}>
                    Năm {year}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-gray-500 absolute right-3 pointer-events-none" />
            </div>

            <div className="relative inline-flex items-center">
              <select
                value={selectedQuarter ?? ""}
                onChange={(e) =>
                  setSelectedQuarter(
                    e.target.value ? Number(e.target.value) : undefined
                  )
                }
                className="appearance-none bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2 pr-8 text-xs font-bold text-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500 cursor-pointer shadow-sm"
              >
                <option value="">Tất cả các quý</option>
                <option value="1">Quý 1</option>
                <option value="2">Quý 2</option>
                <option value="3">Quý 3</option>
                <option value="4">Quý 4</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-gray-500 absolute right-2.5 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Company Info */}
        {query.isLoading ? (
          <div className="h-16 flex items-center text-xs text-gray-400 font-medium animate-pulse">
            Đang tải thông tin doanh nghiệp...
          </div>
        ) : query.isError ? (
          <div className="text-xs text-red-500 font-semibold">
            Không thể tải thông tin doanh nghiệp.
          </div>
        ) : summary ? (
          <div className="space-y-1.5">
            <h3 className="text-lg font-bold text-gray-900 backoffice-dark:text-white flex items-center gap-2">
              <Building2 className="w-4 h-4 text-violet-600 shrink-0" />
              {summary.companyName}
            </h3>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-xs text-gray-600 backoffice-dark:text-white/70 font-medium">
              <span className="flex items-center gap-1">
                <FileCheck2 className="w-3.5 h-3.5 text-emerald-600" />
                MST: <strong className="text-gray-900 backoffice-dark:text-white font-bold">{summary.enterpriseTaxCode}</strong>
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-amber-600" />
                {summary.companyAddress}
              </span>
            </div>
          </div>
        ) : null}
      </div>

      {/* 2. Top Row of 4 KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Gross Amount */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.04] transition hover:shadow-md">
          <p className="text-xs font-bold uppercase tracking-wider text-gray-500 backoffice-dark:text-white/60 mb-2">
            Tổng Gross
          </p>
          <h4 className="text-2xl font-extrabold text-gray-900 backoffice-dark:text-white">
            {formatVND(summary?.totalGrossAmount)}
          </h4>
        </div>

        {/* Total VAT */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.04] transition hover:shadow-md">
          <p className="text-xs font-bold uppercase tracking-wider text-gray-500 backoffice-dark:text-white/60 mb-2">
            Tổng Thuế VAT
          </p>
          <h4 className="text-2xl font-extrabold text-violet-600 dark:text-violet-400">
            {formatVND(summary?.totalVatAmount)}
          </h4>
        </div>

        {/* PIT Withheld */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.04] transition hover:shadow-md">
          <p className="text-xs font-bold uppercase tracking-wider text-gray-500 backoffice-dark:text-white/60 mb-2">
            Thuế TNCN (PIT) Khấu Trừ
          </p>
          <h4 className="text-2xl font-extrabold text-gray-900 backoffice-dark:text-white">
            {formatVND(summary?.totalPitWithheld)}
          </h4>
        </div>

        {/* Net Payout */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.04] transition hover:shadow-md">
          <p className="text-xs font-bold uppercase tracking-wider text-gray-500 backoffice-dark:text-white/60 mb-2">
            Tổng Thực Nhận (Net Payout)
          </p>
          <h4 className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
            {formatVND(summary?.totalNetPayout)}
          </h4>
        </div>
      </div>

      {/* 3. Bottom Row: 2 Split Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Phân Rã Thuế VAT (DONUT Chart) */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.04] flex flex-col justify-between">
          <div className="border-b border-gray-100 pb-3 mb-4 flex items-center justify-between backoffice-dark:border-white/10">
            <h3 className="text-base font-bold text-gray-900 backoffice-dark:text-white flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-violet-600" />
              Phân Rã Thuế VAT
            </h3>
          </div>

          {/* Donut Chart with Centered Overlay */}
          <div className="relative flex flex-col items-center justify-center my-2">
            <div className="w-full h-48 sm:h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={donutData}
                    cx="50%"
                    cy="50%"
                    innerRadius={62}
                    outerRadius={88}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {donutData.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={VAT_DONUT_COLORS[index % VAT_DONUT_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <RechartsTooltip
                    wrapperStyle={{ zIndex: 100 }}
                    formatter={(value: any, name: any) => [
                      formatVND(Number(value) || 0),
                      name,
                    ]}
                    contentStyle={{
                      borderRadius: "12px",
                      border: "1px solid #E5E7EB",
                      boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
                      fontSize: "12px",
                      fontWeight: 600,
                      backgroundColor: "rgba(255, 255, 255, 0.95)",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Centered Total Overlay inside Donut hole */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10 text-center">
              <span className="text-[11px] font-bold tracking-wider uppercase text-gray-400">
                TỔNG VAT
              </span>
              <span className="text-sm sm:text-base font-black text-gray-900 dark:text-white">
                {formatVND(summary?.totalVatAmount)}
              </span>
            </div>
          </div>

          {/* Donut Breakdown Legend Table */}
          <div className="border-t border-gray-100 pt-4 mt-2 space-y-2.5 backoffice-dark:border-white/10">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 font-medium text-gray-700 backoffice-dark:text-white/80">
                <span className="w-3 h-3 rounded-full bg-violet-500 inline-block" />
                <span>VAT Creator</span>
              </div>
              <span className="font-bold text-gray-900 backoffice-dark:text-white">
                {formatVND(summary?.creatorVatAmount)}
              </span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 font-medium text-gray-700 backoffice-dark:text-white/80">
                <span className="w-3 h-3 rounded-full bg-blue-500 inline-block" />
                <span>VAT Nền Tảng</span>
              </div>
              <span className="font-bold text-gray-900 backoffice-dark:text-white">
                {formatVND(summary?.platformVatAmount)}
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Tóm Tắt Quyết Toán (Key-Value List) */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.04] flex flex-col justify-between">
          <div className="border-b border-gray-100 pb-3 mb-4 backoffice-dark:border-white/10">
            <h3 className="text-base font-bold text-gray-900 backoffice-dark:text-white flex items-center gap-2">
              <Scale className="w-4 h-4 text-violet-600" />
              Tóm Tắt Quyết Toán
            </h3>
          </div>

          <div className="divide-y divide-gray-100 backoffice-dark:divide-white/10 my-auto">
            <div className="py-3 flex items-center justify-between text-sm">
              <span className="font-medium text-gray-600 backoffice-dark:text-white/70">
                Tổng Gross
              </span>
              <span className="font-extrabold text-gray-900 backoffice-dark:text-white">
                {formatVND(summary?.totalGrossAmount)}
              </span>
            </div>

            <div className="py-3 flex items-center justify-between text-sm">
              <span className="font-medium text-gray-600 backoffice-dark:text-white/70">
                Tổng Thuế VAT
              </span>
              <span className="font-extrabold text-violet-600 dark:text-violet-400">
                {formatVND(summary?.totalVatAmount)}
              </span>
            </div>

            <div className="py-3 flex items-center justify-between text-sm">
              <span className="font-medium text-gray-600 backoffice-dark:text-white/70">
                Thuế TNCN (PIT) Khấu Trừ
              </span>
              <span className="font-extrabold text-gray-900 backoffice-dark:text-white">
                {formatVND(summary?.totalPitWithheld)}
              </span>
            </div>

            <div className="py-3 flex items-center justify-between text-sm">
              <span className="font-medium text-gray-600 backoffice-dark:text-white/70">
                Tổng Thực Nhận (Net Payout)
              </span>
              <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
                {formatVND(summary?.totalNetPayout)}
              </span>
            </div>

            <div className="py-3 flex items-center justify-between text-sm">
              <span className="font-medium text-gray-600 backoffice-dark:text-white/70">
                Số Kỳ Quyết Toán
              </span>
              <span className="font-extrabold text-gray-900 backoffice-dark:text-white">
                {formatNumber(summary?.totalSettlementsCount)}
              </span>
            </div>
          </div>

          <div className="border-t border-gray-100 pt-4 mt-4 text-[11px] text-gray-400 font-medium flex items-center justify-between">
            <span>Báo Cáo Tổng Quan Thuế Enterprise</span>
            <span>Trạng thái: Hoàn tất đối soát</span>
          </div>
        </div>
      </div>
    </div>
  );
}
