"use client";

import { Flag, RefreshCcw, AlertOctagon } from "lucide-react";
import { ReportManagementTable } from "@/features/staff/components/report-management-table";

export default function ReportsPage() {
  return (
    <div className="flex flex-col gap-8 max-w-7xl mx-auto w-full">
      {/* 1. Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight mb-2">
            Reports & Tickets
          </h1>
          <p className="text-sm text-gray-500 font-medium">
            Manage user reports, content flags, and process refund requests.
          </p>
        </div>
      </div>

      {/* 2. KPIs Phân loại Ticket (Ticket Stats) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Open Tickets (Content & Users) */}
        <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100 flex items-center gap-4 border-l-4 border-l-red-500">
          <div className="h-12 w-12 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
            <AlertOctagon className="h-6 w-6 text-red-500" />
          </div>
          <div>
            <p className="text-sm font-bold text-red-600">
              Open Tickets (Action Needed)
            </p>
            <h3 className="text-2xl font-black text-gray-900">14</h3>
          </div>
        </div>

        {/* Card 2: Refund Requests */}
        <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-purple-50 flex items-center justify-center shrink-0">
            <RefreshCcw className="h-6 w-6 text-purple-500" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-500">Pending Refunds</p>
            <h3 className="text-2xl font-black text-gray-900">6</h3>
          </div>
        </div>

        {/* Card 3: Resolved Today */}
        <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-[#ECFDF5] flex items-center justify-center shrink-0">
            <Flag className="h-6 w-6 text-[#10B981]" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-500">Resolved Today</p>
            <h3 className="text-2xl font-black text-gray-900">38</h3>
          </div>
        </div>
      </div>

      {/* 3. Bảng Dữ Liệu Báo Cáo */}
      <ReportManagementTable />
    </div>
  );
}
