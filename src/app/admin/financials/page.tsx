"use client";

import { PayoutRequestsTable } from "@/features/admin/components/payout-requests-table";
import {
  Download,
  CheckSquare,
  TrendingUp,
  Clock,
  CheckCircle2,
} from "lucide-react";

export default function FinancialsPage() {
  return (
    <div className="flex flex-col gap-8 max-w-7xl mx-auto w-full">
      {/* 1. Tiêu đề và Nút thao tác (Header & Actions) */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-sm text-gray-500 font-medium mb-1">
            Admin / Financials & Payouts
          </p>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
            Financials Overview
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 hover:text-gray-900 active:scale-95">
            <Download className="h-4 w-4" />
            Export CSV
          </button>
          {/* Màu Teal đậm theo chuẩn thiết kế */}
          <button className="flex items-center gap-2 rounded-lg bg-[#007A8A] px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-[#006673] hover:shadow-md active:scale-95">
            <CheckSquare className="h-4 w-4" />
            Bulk Process
          </button>
        </div>
      </div>

      {/* 2. Cụm Thẻ Thống Kê Tổng Quan (Stats Cards) */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {/* Card 1: Tổng doanh thu nền tảng */}
        <div className="relative overflow-hidden rounded-2xl bg-white p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
              <TrendingUp className="h-5 w-5 text-blue-500" />
            </div>
            <span className="flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-600">
              <TrendingUp className="h-3 w-3" /> +12.4%
            </span>
          </div>
          <p className="text-sm font-medium text-gray-500 mb-1">
            Total Platform Revenue
          </p>
          <h3 className="text-3xl font-bold text-gray-900">$2,458,920.00</h3>
          {/* Watermark mờ phía sau tạo độ sâu */}
          <TrendingUp className="absolute -bottom-4 -right-4 h-24 w-24 text-gray-50 opacity-50 pointer-events-none" />
        </div>

        {/* Card 2: Yêu cầu thanh toán đang chờ */}
        <div className="relative overflow-hidden rounded-2xl bg-white p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#F3F0FF]">
              <Clock className="h-5 w-5 text-[#7B42FF]" />
            </div>
            <span className="rounded-full bg-[#F3F0FF] px-2.5 py-1 text-xs font-semibold text-[#7B42FF]">
              42 Requests
            </span>
          </div>
          <p className="text-sm font-medium text-gray-500 mb-1">
            Pending Payouts
          </p>
          <h3 className="text-3xl font-bold text-gray-900">$124,500.00</h3>
          <Clock className="absolute -bottom-4 -right-4 h-24 w-24 text-gray-50 opacity-50 pointer-events-none" />
        </div>

        {/* Card 3: Thanh toán đã hoàn tất */}
        <div className="relative overflow-hidden rounded-2xl bg-white p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-50">
              <CheckCircle2 className="h-5 w-5 text-cyan-500" />
            </div>
            <span className="rounded-full bg-cyan-50 px-2.5 py-1 text-xs font-semibold text-cyan-600 tracking-wide uppercase">
              Lifetime
            </span>
          </div>
          <p className="text-sm font-medium text-gray-500 mb-1">
            Completed Payouts
          </p>
          <h3 className="text-3xl font-bold text-gray-900">$1,982,310.00</h3>
          <CheckCircle2 className="absolute -bottom-4 -right-4 h-24 w-24 text-gray-50 opacity-50 pointer-events-none" />
        </div>
      </div>
      {/* 3. Bảng Yêu cầu thanh toán */}
      <PayoutRequestsTable />
      {/* KHU VỰC DÀNH CHO BẢNG VÀ BIỂU ĐỒ SẼ ĐƯỢC THÊM SAU */}
    </div>
  );
}
