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
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-950 backoffice-dark:text-white">
          Báo Cáo Thuế
        </h1>

        {/* PayOS Payout Account Balance Badge */}
        <PayoutBalanceBadge />
      </div>

      {/* 3 Tabs Bar */}
      <div className="flex items-center gap-8 border-b border-gray-200 dark:border-white/10">
        <button
          type="button"
          onClick={() => setActiveTab("overview")}
          className={`flex items-center gap-2 py-3 text-sm font-bold border-b-2 transition-all cursor-pointer ${activeTab === "overview"
            ? "border-violet-600 text-violet-600 dark:border-transparent dark:text-primary"
            : "border-transparent text-gray-500 hover:text-violet-600 hover:border-violet-300 dark:text-white/60 dark:hover:text-white dark:hover:border-transparent"
            }`}
        >
          <PieChart className="w-4 h-4" />
          Tổng quan
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("vat")}
          className={`flex items-center gap-2 py-3 text-sm font-bold border-b-2 transition-all cursor-pointer ${activeTab === "vat"
            ? "border-violet-600 text-violet-600 dark:border-transparent dark:text-primary"
            : "border-transparent text-gray-500 hover:text-violet-600 hover:border-violet-300 dark:text-white/60 dark:hover:text-white dark:hover:border-transparent"
            }`}
        >
          <Receipt className="w-4 h-4" />
          Báo Cáo VAT
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("pit")}
          className={`flex items-center gap-2 py-3 text-sm font-bold border-b-2 transition-all cursor-pointer ${activeTab === "pit"
            ? "border-violet-600 text-violet-600 dark:border-transparent dark:text-primary"
            : "border-transparent text-gray-500 hover:text-violet-600 hover:border-violet-300 dark:text-white/60 dark:hover:text-white dark:hover:border-transparent"
            }`}
        >
          <Scale className="w-4 h-4" />
          Báo Cáo PIT
        </button>
      </div>

      {/* Tab Content Container - Only renders active tab */}
      <div className="w-full">
        {activeTab === "overview" && <AdminTaxSummaryCard />}
        {activeTab === "vat" && <AdminVatReportTable />}
        {activeTab === "pit" && <AdminPitReportTable />}
      </div>
    </div>
  );
}
