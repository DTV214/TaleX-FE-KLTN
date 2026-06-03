"use client";

import { FileCheck2, Clock, CheckCircle } from "lucide-react";
import { CreatorApplicationsTable } from "@/features/staff/components/creator-applications-table";

export default function CreatorApplicationsPage() {
  return (
    <div className="flex flex-col gap-8 max-w-7xl mx-auto w-full">
      {/* 1. Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight mb-2">
            Creator Applications
          </h1>
          <p className="text-sm text-gray-500 font-medium">
            Review and process incoming applications for the TaleX Creator
            Program.
          </p>
        </div>
      </div>

      {/* 2. Cụm thẻ thống kê công việc (Task Stats) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Pending */}
        <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
            <Clock className="h-6 w-6 text-amber-500" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-500">Pending Review</p>
            <h3 className="text-2xl font-black text-gray-900">24</h3>
          </div>
        </div>

        {/* Card 2: Approved */}
        <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-[#ECFDF5] flex items-center justify-center shrink-0">
            <CheckCircle className="h-6 w-6 text-[#10B981]" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-500">
              Approved This Week
            </p>
            <h3 className="text-2xl font-black text-gray-900">18</h3>
          </div>
        </div>

        {/* Card 3: Avg Review Time */}
        <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
            <FileCheck2 className="h-6 w-6 text-blue-500" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-500">Avg. Review Time</p>
            <h3 className="text-2xl font-black text-gray-900">2.4 Days</h3>
          </div>
        </div>
      </div>

      {/* 3. Bảng Dữ Liệu */}
      <CreatorApplicationsTable />
    </div>
  );
}
