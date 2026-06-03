"use client";

import { ShieldCheck } from "lucide-react";
import { UserManagementTable } from "@/features/admin/components/user-management-table";

export default function UsersPage() {
  return (
    <div className="flex flex-col gap-8 max-w-7xl mx-auto w-full">
      {/* 1. Header & Tabs */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight mb-2">
            User Management
          </h1>
          <p className="text-sm text-gray-500">
            Oversee community members, roles, and platform integrity.
          </p>
        </div>

        {/* Toggle Tabs */}
        <div className="flex items-center p-1 bg-gray-100 border border-gray-200 rounded-xl w-fit">
          <button className="px-6 py-2 rounded-lg bg-white text-sm font-bold text-gray-900 shadow-sm transition-all">
            All Users
          </button>
          <button className="px-6 py-2 rounded-lg text-sm font-medium text-gray-500 hover:text-gray-900 transition-all">
            Activity Log
          </button>
        </div>
      </div>

      {/* 2. Bảng Quản lý Người dùng (Đã tách component) */}
      <UserManagementTable />

      {/* 3. Khối Thống kê cuối trang (Bottom Stats) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
        {/* Khối Biểu đồ Platform Growth (Chiếm 2 cột) */}
        <div className="md:col-span-2 rounded-2xl bg-white border border-gray-100 shadow-sm p-6 flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-bold text-gray-900">Platform Growth</h3>
            <span className="text-sm font-bold text-[#00A389]">
              +12% this month
            </span>
          </div>

          {/* Giả lập Biểu đồ cột (Bar Chart Mock) */}
          <div className="flex-1 flex items-end justify-between gap-2 h-40 mt-auto">
            <div className="w-full bg-[#E5FAFF] rounded-t-md h-[30%] hover:bg-[#00D1FF] transition-colors" />
            <div className="w-full bg-[#E5FAFF] rounded-t-md h-[50%] hover:bg-[#00D1FF] transition-colors" />
            <div className="w-full bg-[#E5FAFF] rounded-t-md h-[40%] hover:bg-[#00D1FF] transition-colors" />
            <div className="w-full bg-[#E5FAFF] rounded-t-md h-[80%] hover:bg-[#00D1FF] transition-colors" />
            <div className="w-full bg-[#E5FAFF] rounded-t-md h-[60%] hover:bg-[#00D1FF] transition-colors" />
            <div
              className="w-full bg-[#007A8A] rounded-t-md h-[100%] shadow-md cursor-pointer"
              title="Current Month"
            />
            <div className="w-full bg-[#E5FAFF] rounded-t-md h-[70%] hover:bg-[#00D1FF] transition-colors" />
          </div>
        </div>

        {/* Khối Sức khỏe Cộng đồng (Community Health) */}
        <div className="rounded-2xl bg-[#007A8A] p-6 shadow-md flex flex-col justify-between text-white relative overflow-hidden">
          {/* Background pattern nhẹ */}
          <ShieldCheck className="absolute -right-4 -bottom-4 w-32 h-32 opacity-10 pointer-events-none" />

          <div>
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm border border-white/20 mb-5">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-bold mb-2">Community Health</h3>
            <p className="text-white/80 text-sm leading-relaxed mb-6 pr-4">
              98.4% of users are active and compliant with community guidelines.
            </p>
          </div>

          <button className="w-full py-3 bg-white text-[#007A8A] text-sm font-bold rounded-xl hover:bg-gray-50 transition-colors shadow-sm active:scale-95">
            Review Flags
          </button>
        </div>
      </div>
    </div>
  );
}
