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
    <div className="flex flex-col gap-6 max-w-7xl mx-auto w-full font-sans">
      {/* Header with Title & PayOS Balance Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 dark:border-white/10 pb-4">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-900 backoffice-dark:text-white">
            Tax & Settlement
          </h1>
          <p className="text-xs sm:text-sm font-semibold text-gray-500 backoffice-dark:text-white/60">
            Quản lý tổng quan nghĩa vụ thuế VAT, PIT và các báo cáo đối soát chi tiết.
          </p>
        </div>

        {/* PayOS Payout Account Balance Badge */}
        <PayoutBalanceBadge />
      </div>

      {/* 3 Tabs Bar */}
      <div className="flex items-center gap-2 border-b border-gray-200 dark:border-white/10">
        <button
          type="button"
          onClick={() => setActiveTab("overview")}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === "overview"
              ? "border-violet-600 text-violet-600 dark:text-violet-400 bg-violet-50/60 dark:bg-violet-950/40 rounded-t-xl"
              : "border-transparent text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/[0.02] rounded-t-xl"
          }`}
        >
          <PieChart className="w-4 h-4" />
          Overview
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("vat")}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === "vat"
              ? "border-violet-600 text-violet-600 dark:text-violet-400 bg-violet-50/60 dark:bg-violet-950/40 rounded-t-xl"
              : "border-transparent text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/[0.02] rounded-t-xl"
          }`}
        >
          <Receipt className="w-4 h-4" />
          VAT Report
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("pit")}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === "pit"
              ? "border-violet-600 text-violet-600 dark:text-violet-400 bg-violet-50/60 dark:bg-violet-950/40 rounded-t-xl"
              : "border-transparent text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/[0.02] rounded-t-xl"
          }`}
        >
          <Scale className="w-4 h-4" />
          PIT Report
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
