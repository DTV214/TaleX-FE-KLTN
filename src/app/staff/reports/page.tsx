"use client";

import { Flag, RefreshCcw, AlertOctagon } from "lucide-react";
import { ReportManagementTable } from "@/features/staff/components/report-management-table";

export default function ReportsPage() {
  return (
    <div className="flex flex-col gap-8 max-w-7xl mx-auto w-full">
      {/* 3. Bảng Dữ Liệu Báo Cáo */}
      <ReportManagementTable />
    </div>
  );
}
