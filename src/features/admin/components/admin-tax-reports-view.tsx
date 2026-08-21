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
