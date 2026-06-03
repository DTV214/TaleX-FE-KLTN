"use client";

import { useState } from "react";
import {
  Search,
  ChevronDown,
  Eye,
  CheckCircle2,
  XCircle,
  History,
  Film,
  BookOpen,
} from "lucide-react";

// Mock Data bám sát Use Case "Review Creator Content"
const mockContents = [
  {
    id: "MOD-1045",
    title: "Cyber Edge: Neon City - Episode 1",
    creator: "Alex Rivera",
    type: "Video",
    submittedDate: "Oct 26, 2023, 10:30 AM",
    durationOrPages: "24 mins",
    status: "Pending Review",
  },
  {
    id: "MOD-1046",
    title: "Tower of Sky - Chapter 155",
    creator: "Studio Mirai",
    type: "Comic",
    submittedDate: "Oct 26, 2023, 11:15 AM",
    durationOrPages: "32 pages",
    status: "In Progress",
  },
  {
    id: "MOD-1047",
    title: "The Silent Watcher - Trailer",
    creator: "Elena Chen",
    type: "Video",
    submittedDate: "Oct 25, 2023, 04:20 PM",
    durationOrPages: "2 mins",
    status: "Flagged by AI", // Cảnh báo tự động từ hệ thống AI (nếu có)
  },
];

export function ContentModerationTable() {
  const [searchTerm, setSearchTerm] = useState("");

  return (
    <div className="w-full flex flex-col gap-6 mt-6">
      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by title, creator, or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-11 w-full rounded-lg border border-gray-200 bg-white pl-10 pr-4 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#10B981]/20 focus:border-[#10B981] transition-all shadow-sm"
          />
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <button className="flex h-11 items-center justify-between gap-2 w-full md:w-36 rounded-lg border border-gray-200 bg-white px-4 text-sm font-medium text-gray-600 shadow-sm hover:bg-gray-50 transition-colors">
            Format
            <ChevronDown className="h-4 w-4 text-gray-400" />
          </button>
          <button className="flex h-11 items-center justify-between gap-2 w-full md:w-40 rounded-lg border border-gray-200 bg-white px-4 text-sm font-medium text-gray-600 shadow-sm hover:bg-gray-50 transition-colors">
            Sort by: Oldest
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
                <th className="px-6 py-4">Content Details</th>
                <th className="px-6 py-4">Creator</th>
                <th className="px-6 py-4">Format / Size</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {mockContents.map((content) => (
                <tr
                  key={content.id}
                  className="hover:bg-gray-50/80 transition-colors group"
                >
                  {/* Cột 1: Thông tin nội dung */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <p className="text-sm font-bold text-gray-900 mb-1 truncate max-wxs">
                      {content.title}
                    </p>
                    <p className="text-[11px] text-gray-500">
                      ID: {content.id} • Submitted: {content.submittedDate}
                    </p>
                  </td>

                  {/* Cột 2: Tên Creator */}
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-700">
                    {content.creator}
                  </td>

                  {/* Cột 3: Định dạng (Video/Comic) và Kích thước */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {content.type === "Video" ? (
                        <Film className="w-4 h-4 text-blue-500" />
                      ) : (
                        <BookOpen className="w-4 h-4 text-purple-500" />
                      )}
                      <span className="text-xs font-bold text-gray-700">
                        {content.type}
                      </span>
                      <span className="text-xs text-gray-400">
                        ({content.durationOrPages})
                      </span>
                    </div>
                  </td>

                  {/* Cột 4: Trạng thái (Pending / Flagged) */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2.5 py-1 text-[10px] font-bold tracking-wider rounded-md uppercase ${
                        content.status === "Flagged by AI"
                          ? "bg-red-100 text-red-600"
                          : content.status === "In Progress"
                            ? "bg-blue-50 text-blue-600"
                            : "bg-amber-50 text-amber-600"
                      }`}
                    >
                      {content.status}
                    </span>
                  </td>

                  {/* Cột 5: Actions (Review / Approve / Reject / History) */}
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-1">
                      {/* Lịch sử kiểm duyệt (Track Moderation History) */}
                      <button
                        className="p-2 text-gray-400 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors"
                        title="Moderation History"
                      >
                        <History className="w-4 h-4" />
                      </button>
                      <div className="w-px h-4 bg-gray-200 mx-1" />
                      {/* Xem trước nội dung */}
                      <button
                        className="p-2 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                        title="Preview Content"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {/* Duyệt & Từ chối */}
                      <button
                        className="p-2 text-gray-400 hover:text-[#10B981] rounded-lg hover:bg-[#ECFDF5] transition-colors"
                        title="Approve for Publication"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </button>
                      <button
                        className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                        title="Reject Content"
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
