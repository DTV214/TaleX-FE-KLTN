"use client";

import { useState } from "react";
import {
  Search,
  ChevronDown,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

// Mock Data chuẩn theo thiết kế
const mockUsers = [
  {
    id: "9283-SF",
    name: "Julianne Devis",
    email: "julianne.d@streamflow.io",
    avatar: "https://i.pravatar.cc/150?img=47",
    role: "CREATOR",
    date: "Oct 12, 2023",
    status: "Active",
  },
  {
    id: "1104-SF",
    name: "Marcus Laine",
    email: "marcus.laine@gmail.com",
    avatar: "https://i.pravatar.cc/150?img=33",
    role: "VIEWER",
    date: "Nov 03, 2023",
    status: "Banned",
  },
  {
    id: "8821-SF",
    name: "Sarah Chen",
    email: "s.chen@techglobal.net",
    avatar: "https://i.pravatar.cc/150?img=32",
    role: "MODERATOR",
    date: "Dec 20, 2023",
    status: "Active",
  },
  {
    id: "5542-SF",
    name: "Riley King",
    email: "rking_creative@yahoo.com",
    avatar: "https://i.pravatar.cc/150?img=11",
    role: "CREATOR",
    date: "Jan 05, 2024",
    status: "Active",
  },
];

// Hàm phụ trợ render màu sắc cho Role Badge
const getRoleBadge = (role: string) => {
  switch (role) {
    case "CREATOR":
      return (
        <span className="px-2.5 py-1 text-[10px] font-bold tracking-wider text-[#7B42FF] bg-[#F3F0FF] rounded-md uppercase">
          Creator
        </span>
      );
    case "MODERATOR":
      return (
        <span className="px-2.5 py-1 text-[10px] font-bold tracking-wider text-[#00D1FF] bg-[#E5FAFF] rounded-md uppercase">
          Moderator
        </span>
      );
    default:
      return (
        <span className="px-2.5 py-1 text-[10px] font-bold tracking-wider text-gray-600 bg-gray-100 rounded-md uppercase">
          Viewer
        </span>
      );
  }
};

// Hàm phụ trợ render trạng thái (Status)
const getStatusDisplay = (status: string) => {
  const isActive = status === "Active";
  return (
    <div className="flex items-center gap-2">
      <div
        className={`w-2 h-2 rounded-full ${isActive ? "bg-[#00A389]" : "bg-[#E50914]"}`}
      />
      <span
        className={`text-sm font-semibold ${isActive ? "text-[#00A389]" : "text-[#E50914]"}`}
      >
        {status}
      </span>
    </div>
  );
};

export function UserManagementTable() {
  const [searchTerm, setSearchTerm] = useState("");

  return (
    <div className="w-full flex flex-col gap-6">
      {/* 1. Header Bảng & Bộ Lọc (Filters) */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        {/* Tìm kiếm */}
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Filter by name, email or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-11 w-full rounded-lg border border-gray-200 bg-white pl-10 pr-4 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#00D1FF]/20 focus:border-[#00D1FF] transition-all shadow-sm"
          />
        </div>

        {/* Dropdowns Lọc */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <button className="flex h-11 items-center justify-between gap-2 w-full md:w-40 rounded-lg border border-gray-200 bg-white px-4 text-sm font-medium text-gray-600 shadow-sm hover:bg-gray-50 transition-colors">
            Sort by Role
            <ChevronDown className="h-4 w-4 text-gray-400" />
          </button>
          <button className="flex h-11 items-center justify-between gap-2 w-full md:w-40 rounded-lg border border-gray-200 bg-white px-4 text-sm font-medium text-gray-600 shadow-sm hover:bg-gray-50 transition-colors">
            Filter by Status
            <ChevronDown className="h-4 w-4 text-gray-400" />
          </button>
        </div>
      </div>

      {/* 2. Khung Bảng Dữ Liệu */}
      <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            {/* Table Header */}
            <thead className="bg-gray-50/80 text-gray-500 text-xs font-bold uppercase tracking-wider border-b border-gray-100">
              <tr>
                <th className="px-6 py-4">Avatar & User Details</th>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Registration Date</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-gray-50">
              {mockUsers.map((user) => (
                <tr
                  key={user.id}
                  className="hover:bg-gray-50/80 transition-colors group"
                >
                  {/* Cột 1: Thông tin User */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="w-10 h-10 rounded-full border border-gray-200 object-cover"
                      />
                      <div>
                        <p className="text-sm font-bold text-gray-900 leading-tight">
                          {user.name}
                        </p>
                        <p className="text-[11px] text-gray-400 mt-0.5">
                          UID: {user.id}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Cột 2: Email */}
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600 font-medium">
                    {user.email}
                  </td>

                  {/* Cột 3: Role Badge */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getRoleBadge(user.role)}
                  </td>

                  {/* Cột 4: Date */}
                  <td className="px-6 py-4 whitespace-nowrap text-gray-500 font-medium">
                    {user.date}
                  </td>

                  {/* Cột 5: Status */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusDisplay(user.status)}
                  </td>

                  {/* Cột 6: Actions */}
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <button className="p-2 text-gray-400 hover:text-gray-900 rounded-full hover:bg-gray-100 transition-colors inline-flex">
                      <MoreVertical className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 3. Phân trang (Pagination Footer) */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50/30">
          <p className="text-xs text-gray-500">
            Showing <span className="font-semibold text-gray-900">1</span> to{" "}
            <span className="font-semibold text-gray-900">4</span> of{" "}
            <span className="font-semibold text-gray-900">2,450</span> users
          </p>
          <div className="flex items-center gap-1">
            <button className="flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 bg-white text-gray-400 hover:bg-gray-50 hover:text-gray-900 transition-colors shadow-sm">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button className="flex h-8 w-8 items-center justify-center rounded-md bg-[#00A389] text-white text-sm font-bold shadow-sm transition-colors">
              1
            </button>
            <button className="flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 bg-white text-sm font-semibold text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors shadow-sm">
              2
            </button>
            <button className="flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 bg-white text-sm font-semibold text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors shadow-sm">
              3
            </button>
            <button className="flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 bg-white text-gray-400 hover:bg-gray-50 hover:text-gray-900 transition-colors shadow-sm">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
