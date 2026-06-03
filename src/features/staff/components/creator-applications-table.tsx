"use client";

import { useState } from "react";
import {
  Search,
  ChevronDown,
  Eye,
  CheckCircle2,
  XCircle,
  FileText,
} from "lucide-react";

// Mock Data bám sát Use Case "Review Creator Application"
const mockApplications = [
  {
    id: "APP-9021",
    applicant: {
      name: "Marcus Thorne",
      email: "marcus.t@gmail.com",
      avatar: "https://i.pravatar.cc/150?img=33",
    },
    contentType: "Video Series",
    appliedDate: "Oct 24, 2023",
    taxInfoStatus: "Verified", // Trạng thái xác minh Thuế & Ngân hàng
    status: "Pending",
  },
  {
    id: "APP-9022",
    applicant: {
      name: "Elena Chen",
      email: "elena.creates@yahoo.com",
      avatar: "https://i.pravatar.cc/150?img=47",
    },
    contentType: "Webtoon",
    appliedDate: "Oct 25, 2023",
    taxInfoStatus: "Missing Docs",
    status: "Action Required",
  },
  {
    id: "APP-9023",
    applicant: {
      name: "Studio Mirai",
      email: "contact@studiomirai.jp",
      avatar: "https://i.pravatar.cc/150?img=11",
    },
    contentType: "Animation",
    appliedDate: "Oct 26, 2023",
    taxInfoStatus: "Under Review",
    status: "In Progress",
  },
];

export function CreatorApplicationsTable() {
  const [searchTerm, setSearchTerm] = useState("");

  return (
    <div className="w-full flex flex-col gap-6 mt-6">
      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by applicant name or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-11 w-full rounded-lg border border-gray-200 bg-white pl-10 pr-4 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#10B981]/20 focus:border-[#10B981] transition-all shadow-sm"
          />
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <button className="flex h-11 items-center justify-between gap-2 w-full md:w-40 rounded-lg border border-gray-200 bg-white px-4 text-sm font-medium text-gray-600 shadow-sm hover:bg-gray-50 transition-colors">
            Content Type
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
                <th className="px-6 py-4">Applicant</th>
                <th className="px-6 py-4">Content Type</th>
                <th className="px-6 py-4">Legal & Tax Info</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {mockApplications.map((app) => (
                <tr
                  key={app.id}
                  className="hover:bg-gray-50/80 transition-colors group"
                >
                  {/* Cột 1: Thông tin người nộp đơn */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <img
                        src={app.applicant.avatar}
                        alt={app.applicant.name}
                        className="w-10 h-10 rounded-full border border-gray-200 object-cover"
                      />
                      <div>
                        <p className="text-sm font-bold text-gray-900 leading-tight">
                          {app.applicant.name}
                        </p>
                        <p className="text-[11px] text-gray-500 mt-0.5">
                          {app.applicant.email} • ID: {app.id}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Cột 2: Loại nội dung đăng ký */}
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-700">
                    {app.contentType}
                  </td>

                  {/* Cột 3: Trạng thái pháp lý (Tax & Banking - Rất quan trọng theo Use Case) */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <FileText
                        className={`w-4 h-4 ${
                          app.taxInfoStatus === "Verified"
                            ? "text-green-500"
                            : app.taxInfoStatus === "Missing Docs"
                              ? "text-red-500"
                              : "text-amber-500"
                        }`}
                      />
                      <span
                        className={`text-xs font-bold ${
                          app.taxInfoStatus === "Verified"
                            ? "text-green-600"
                            : app.taxInfoStatus === "Missing Docs"
                              ? "text-red-600"
                              : "text-amber-600"
                        }`}
                      >
                        {app.taxInfoStatus}
                      </span>
                    </div>
                  </td>

                  {/* Cột 4: Trạng thái đơn */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2.5 py-1 text-[10px] font-bold tracking-wider text-gray-600 bg-gray-100 rounded-md uppercase">
                      {app.status}
                    </span>
                  </td>

                  {/* Cột 5: Actions (Duyệt / Từ chối / Xem chi tiết) */}
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        className="p-2 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                        title="View Full Application"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <div className="w-px h-4 bg-gray-200 mx-1" />
                      <button
                        className="p-2 text-gray-400 hover:text-[#10B981] rounded-lg hover:bg-[#ECFDF5] transition-colors"
                        title="Approve"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </button>
                      <button
                        className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                        title="Reject"
                      >
                        <XCircle className="w-4 h-4" />
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
