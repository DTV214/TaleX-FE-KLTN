"use client";

import { ShieldAlert, Play, CheckCircle, AlertTriangle } from "lucide-react";
import { ContentModerationTable } from "@/features/staff/components/content-moderation-table";

export default function ContentModerationPage() {
  return (
    <div className="flex flex-col gap-8 max-w-7xl mx-auto w-full">
      {/* 1. Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight mb-2">
            Content Moderation
          </h1>
          <p className="text-sm text-gray-500 font-medium">
            Review and enforce community guidelines on user-submitted videos and
            comics.
          </p>
        </div>
      </div>

      {/* 2. KPIs Hàng Chờ Kiểm Duyệt (Moderation Queue Stats) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Pending Moderation */}
        <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
            <Play className="h-5 w-5 text-amber-500" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-500">
              In Queue (Pending)
            </p>
            <h3 className="text-2xl font-black text-gray-900">42</h3>
          </div>
        </div>

        {/* Card 2: AI Flagged (High Priority) */}
        <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100 flex items-center gap-4 border-l-4 border-l-red-500">
          <div className="h-12 w-12 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
            <AlertTriangle className="h-5 w-5 text-red-500" />
          </div>
          <div>
            <p className="text-sm font-bold text-red-600">
              AI Flagged (Priority)
            </p>
            <h3 className="text-2xl font-black text-gray-900">8</h3>
          </div>
        </div>

        {/* Card 3: Reviewed Today */}
        <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-[#ECFDF5] flex items-center justify-center shrink-0">
            <CheckCircle className="h-5 w-5 text-[#10B981]" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-500">Reviewed Today</p>
            <h3 className="text-2xl font-black text-gray-900">124</h3>
          </div>
        </div>
      </div>

      {/* 3. Bảng Dữ Liệu Kiểm Duyệt */}
      <ContentModerationTable />
    </div>
  );
}
