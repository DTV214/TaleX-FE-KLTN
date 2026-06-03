"use client";

import { useState } from "react";
import {
  Search,
  ChevronDown,
  Eye,
  RefreshCcw,
  Ban,
  CheckCircle2,
  AlertOctagon,
  CreditCard,
  UserX,
} from "lucide-react";

// Mock Data bám sát Use Case "Manage Report" (Bao gồm Cờ nội dung & Hoàn tiền)
const mockReports = [
  {
    id: "TKT-5091",
    reporter: "alex_fan99",
    target: "Cyber Edge: Neon City - Ep 4",
    targetType: "Content", // Báo cáo nội dung
    issue: "Copyright Infringement",
    date: "Oct 27, 2023, 08:15 AM",
    status: "Open",
  },
  {
    id: "TKT-5092",
    reporter: "sarah_reads",
    target: "Tower of Sky - Premium Ch.15",
    targetType: "Transaction", // Báo cáo giao dịch / Xin hoàn tiền
    issue: "Double Charge / Payment Error",
    date: "Oct 27, 2023, 09:30 AM",
    status: "Pending Refund",
  },
  {
    id: "TKT-5093",
    reporter: "System Auto-Mod",
    target: "User @spambot_x2",
    targetType: "User", // Báo cáo tài khoản spam
    issue: "Malicious Links in Comments",
    date: "Oct 26, 2023, 11:45 PM",
    status: "Resolved",
  },
];

// Hàm phụ trợ chọn Icon theo Loại Báo Cáo
const getTargetIcon = (type: string) => {
  switch (type) {
    case "Transaction":
      return <CreditCard className="w-4 h-4 text-purple-500" />;
    case "User":
      return <UserX className="w-4 h-4 text-red-500" />;
    default:
      return <AlertOctagon className="w-4 h-4 text-blue-500" />;
  }
};

export function ReportManagementTable() {
  const [searchTerm, setSearchTerm] = useState("");

  return (
    <div className="w-full flex flex-col gap-6 mt-6">
      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by Ticket ID or Reporter..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-11 w-full rounded-lg border border-gray-200 bg-white pl-10 pr-4 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#10B981]/20 focus:border-[#10B981] transition-all shadow-sm"
          />
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <button className="flex h-11 items-center justify-between gap-2 w-full md:w-40 rounded-lg border border-gray-200 bg-white px-4 text-sm font-medium text-gray-600 shadow-sm hover:bg-gray-50 transition-colors">
            Report Type
            <ChevronDown className="h-4 w-4 text-gray-400" />
          </button>
          <button className="flex h-11 items-center justify-between gap-2 w-full md:w-40 rounded-lg border border-gray-200 bg-white px-4 text-sm font-medium text-gray-600 shadow-sm hover:bg-gray-50 transition-colors">
            Status
            <ChevronDown className="h-4 w-4 text-gray-400" />
          </button>
        </div>
      </div>

      {/* Bảng Dữ Liệu */}
      <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50/80 text-gray-500 text-xs font-bold uppercase tracking-wider border-b border-gray-100">
              <tr>
                <th className="px-6 py-4">Ticket Info</th>
                <th className="px-6 py-4">Reported Target</th>
                <th className="px-6 py-4">Issue Summary</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {mockReports.map((report) => (
                <tr
                  key={report.id}
                  className="hover:bg-gray-50/80 transition-colors group"
                >
                  {/* Cột 1: Thông tin Ticket */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <p className="text-sm font-bold text-gray-900 mb-1">
                      {report.id}
                    </p>
                    <p className="text-[11px] text-gray-500">
                      By: {report.reporter}
                    </p>
                  </td>

                  {/* Cột 2: Đối tượng bị báo cáo */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2 mb-1">
                      {getTargetIcon(report.targetType)}
                      <span className="text-xs font-bold text-gray-700">
                        {report.targetType}
                      </span>
                    </div>
                    <p className="text-[12px] text-gray-900 truncate max-w-[200px]">
                      {report.target}
                    </p>
                  </td>

                  {/* Cột 3: Vấn đề (Issue) */}
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-700">
                    {report.issue}
                  </td>

                  {/* Cột 4: Status */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2.5 py-1 text-[10px] font-bold tracking-wider rounded-md uppercase ${
                        report.status === "Open"
                          ? "bg-red-50 text-red-600"
                          : report.status === "Pending Refund"
                            ? "bg-purple-50 text-purple-600"
                            : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {report.status}
                    </span>
                  </td>

                  {/* Cột 5: Actions (View / Process Refund / Flag Content / Resolve) */}
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-1">
                      {/* Xem chi tiết Report (View Report Details) */}
                      <button
                        className="p-2 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      <div className="w-px h-4 bg-gray-200 mx-1" />

                      {/* Xử lý Hoàn tiền (Chỉ hiện khi là lỗi giao dịch) */}
                      {report.targetType === "Transaction" && (
                        <button
                          className="p-2 text-gray-400 hover:text-purple-600 rounded-lg hover:bg-purple-50 transition-colors"
                          title="Process Refund"
                        >
                          <RefreshCcw className="w-4 h-4" />
                        </button>
                      )}

                      {/* Gắn cờ/Khóa nội dung (Flag Content) */}
                      {(report.targetType === "Content" ||
                        report.targetType === "User") && (
                        <button
                          className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                          title="Flag / Ban Target"
                        >
                          <Ban className="w-4 h-4" />
                        </button>
                      )}

                      {/* Đánh dấu đã giải quyết (Resolve) */}
                      <button
                        className="p-2 text-gray-400 hover:text-[#10B981] rounded-lg hover:bg-[#ECFDF5] transition-colors"
                        title="Mark as Resolved"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
