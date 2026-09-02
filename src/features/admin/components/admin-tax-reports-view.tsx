"use client";

import { useState } from "react";
import {
  PieChart,
  Receipt,
  Scale,
} from "lucide-react";

import { AdminTaxSummaryCard } from "./admin-tax-summary-card";
import { AdminVatReportTable } from "./admin-vat-report-table";
import { AdminPitReportTable } from "./admin-pit-report-table";
import { PayoutBalanceBadge } from "./payout-balance-badge";

type TaxTab = "overview" | "vat" | "pit";

export function AdminTaxReportsView() {
  const [activeTab, setActiveTab] = useState<TaxTab>("overview");

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      {/* Header with Title & PayOS Balance Badge */}
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between border-gray-100 backoffice-dark:border-white/10">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-950 backoffice-dark:text-white">
            Báo Cáo Thuế
          </h2>
        </div>

        {/* PayOS Payout Account Balance Badge */}

      </div>

      {/* 3 Tabs Bar with Segmented Button styling */}
      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-gray-200 bg-gray-100/80 p-1.5 backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.04]">
        <button
          type="button"
          onClick={() => setActiveTab("overview")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all cursor-pointer ${activeTab === "overview"
            ? "bg-white text-violet-700 shadow-sm backoffice-dark:bg-violet-600 backoffice-dark:text-white"
            : "text-gray-600 hover:bg-white/60 hover:text-gray-900 backoffice-dark:text-white/70 backoffice-dark:hover:bg-white/[0.06] backoffice-dark:hover:text-white"
            }`}
        >
          <PieChart className="w-4 h-4 text-violet-600 backoffice-dark:text-white" />
          <span>Tổng quan</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("vat")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all cursor-pointer ${activeTab === "vat"
            ? "bg-white text-violet-700 shadow-sm backoffice-dark:bg-violet-600 backoffice-dark:text-white"
            : "text-gray-600 hover:bg-white/60 hover:text-gray-900 backoffice-dark:text-white/70 backoffice-dark:hover:bg-white/[0.06] backoffice-dark:hover:text-white"
            }`}
        >
          <Receipt className="w-4 h-4 text-emerald-600 backoffice-dark:text-emerald-400" />
          <span>Báo Cáo VAT (Xuất Excel VAT)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("pit")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all cursor-pointer ${activeTab === "pit"
            ? "bg-white text-violet-700 shadow-sm backoffice-dark:bg-violet-600 backoffice-dark:text-white"
            : "text-gray-600 hover:bg-white/60 hover:text-gray-900 backoffice-dark:text-white/70 backoffice-dark:hover:bg-white/[0.06] backoffice-dark:hover:text-white"
            }`}
        >
          <Scale className="w-4 h-4 text-amber-600 backoffice-dark:text-amber-400" />
          <span>Báo Cáo PIT (Xuất Bảng kê 05-2)</span>
        </button>
      </div>

      {/* Tab Content Container */}
      <div className="w-full">
        {activeTab === "overview" && <AdminTaxSummaryCard />}
        {activeTab === "vat" && <AdminVatReportTable />}
        {activeTab === "pit" && <AdminPitReportTable />}
      </div>
    </div>
  );
}
