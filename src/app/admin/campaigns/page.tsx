"use client";

import { Eye, MousePointerClick, Timer, Plus } from "lucide-react";
import { CampaignManagementTable } from "@/features/admin/components/campaign-management-table";

export default function CampaignsPage() {
  return (
    <div className="flex flex-col gap-8 max-w-7xl mx-auto w-full">
      {/* 1. Header & Call to Action */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight mb-2">
            Banner & Campaign Management
          </h1>
          <p className="text-sm text-gray-500 font-medium">
            Curate and schedule high-impact visual campaigns for the homepage.
          </p>
        </div>

        <button className="flex items-center gap-2 rounded-lg bg-[#007A8A] px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-[#006673] hover:shadow-md active:scale-95 whitespace-nowrap">
          <Plus className="h-5 w-5" />
          Upload New Banner
        </button>
      </div>

      {/* 2. Bảng Quản lý Chiến dịch */}
      <CampaignManagementTable />

      {/* 3. Cụm Thẻ Thống Kê Hiệu Suất (Performance Stats) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-2">
        {/* Card 1: Total Impressions */}
        <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100 flex flex-col justify-center relative overflow-hidden">
          <div className="flex items-center gap-2 mb-4 text-gray-500">
            <Eye className="w-5 h-5 text-[#007A8A]" />
            <h4 className="text-xs font-bold uppercase tracking-wider">
              Total Impressions
            </h4>
          </div>
          <h3 className="text-4xl font-extrabold text-gray-900 mb-2">1.2M</h3>
          <p className="text-sm font-bold text-[#00A389] flex items-center gap-1">
            <TrendingIcon /> 12% vs last month
          </p>
        </div>

        {/* Card 2: Avg. CTR */}
        <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100 flex flex-col justify-center relative overflow-hidden">
          <div className="flex items-center gap-2 mb-4 text-gray-500">
            <MousePointerClick className="w-5 h-5 text-[#7B42FF]" />
            <h4 className="text-xs font-bold uppercase tracking-wider">
              Avg. CTR
            </h4>
          </div>
          <h3 className="text-4xl font-extrabold text-gray-900 mb-2">4.8%</h3>
          <p className="text-sm font-bold text-[#00A389] flex items-center gap-1">
            <TrendingIcon /> 3.1% vs last month
          </p>
        </div>

        {/* Card 3: Active Campaigns */}
        <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100 flex flex-col justify-center relative overflow-hidden">
          <div className="flex items-center gap-2 mb-4 text-gray-500">
            <Timer className="w-5 h-5 text-[#E50914]" />
            <h4 className="text-xs font-bold uppercase tracking-wider">
              Active Campaigns
            </h4>
          </div>
          <h3 className="text-4xl font-extrabold text-gray-900 mb-2">8</h3>
          <p className="text-sm font-medium text-gray-400">
            4 ending this week
          </p>
        </div>
      </div>
    </div>
  );
}

// Icon mũi tên tăng trưởng (Dùng chung cho các thẻ thống kê)
function TrendingIcon() {
  return (
    <svg
      className="w-4 h-4"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2.5}
        d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
      />
    </svg>
  );
}
