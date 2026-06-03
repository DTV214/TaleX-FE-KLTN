"use client";

import {
  Users,
  CreditCard,
  Film,
  AlertCircle,
  TrendingUp,
  Activity,
  ArrowUpRight,
  MoreHorizontal,
} from "lucide-react";

export default function AdminDashboardPage() {
  return (
    <div className="flex flex-col gap-8 max-w-7xl mx-auto w-full">
      {/* 1. Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight mb-2">
            Dashboard Overview
          </h1>
          <p className="text-sm text-gray-500 font-medium">
            Welcome back! Here is what is happening on TaleX today.
          </p>
        </div>
        <button className="flex items-center gap-2 rounded-lg bg-white border border-gray-200 px-4 py-2.5 text-sm font-bold text-gray-700 shadow-sm transition-all hover:bg-gray-50 active:scale-95">
          <Activity className="h-4 w-4 text-[#00D1FF]" />
          System Status: Healthy
        </button>
      </div>

      {/* 2. Top Metrics (KPI Cards) */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {/* Metric 1: Total Users */}
        <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="h-10 w-10 rounded-full bg-[#E5FAFF] flex items-center justify-center">
              <Users className="h-5 w-5 text-[#00D1FF]" />
            </div>
            <span className="flex items-center text-xs font-bold text-[#00A389] bg-[#E6F6F4] px-2 py-1 rounded-md">
              <ArrowUpRight className="w-3 h-3 mr-1" /> 12%
            </span>
          </div>
          <p className="text-sm font-medium text-gray-500 mb-1">
            Total Active Users
          </p>
          <h3 className="text-2xl font-bold text-gray-900">124,592</h3>
        </div>

        {/* Metric 2: Monthly Revenue */}
        <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="h-10 w-10 rounded-full bg-[#F3F0FF] flex items-center justify-center">
              <CreditCard className="h-5 w-5 text-[#7B42FF]" />
            </div>
            <span className="flex items-center text-xs font-bold text-[#00A389] bg-[#E6F6F4] px-2 py-1 rounded-md">
              <ArrowUpRight className="w-3 h-3 mr-1" /> 8.4%
            </span>
          </div>
          <p className="text-sm font-medium text-gray-500 mb-1">
            Monthly Revenue
          </p>
          <h3 className="text-2xl font-bold text-gray-900">$84,230</h3>
        </div>

        {/* Metric 3: New Content (Video & Comic) */}
        <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="h-10 w-10 rounded-full bg-orange-50 flex items-center justify-center">
              <Film className="h-5 w-5 text-orange-500" />
            </div>
            <span className="flex items-center text-xs font-bold text-gray-600 bg-gray-100 px-2 py-1 rounded-md">
              This Week
            </span>
          </div>
          <p className="text-sm font-medium text-gray-500 mb-1">New Uploads</p>
          <h3 className="text-2xl font-bold text-gray-900">1,204</h3>
        </div>

        {/* Metric 4: Reports / Flags */}
        <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="h-10 w-10 rounded-full bg-red-50 flex items-center justify-center">
              <AlertCircle className="h-5 w-5 text-red-500" />
            </div>
            <span className="flex items-center text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded-md">
              Needs Action
            </span>
          </div>
          <p className="text-sm font-medium text-gray-500 mb-1">
            Pending Reports
          </p>
          <h3 className="text-2xl font-bold text-gray-900">42</h3>
        </div>
      </div>

      {/* 3. Khu vực Biểu đồ & Hoạt động gần đây */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart Area (Giả lập đồ thị Analytics) */}
        <div className="lg:col-span-2 rounded-2xl bg-white border border-gray-100 shadow-sm p-6 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-900">
              Traffic & Engagement
            </h3>
            <button className="text-sm font-medium text-[#7B42FF] hover:text-[#6528F7] transition-colors">
              View Detailed Report
            </button>
          </div>

          {/* Giả lập đường Line Chart */}
          <div className="relative flex-1 w-full h-64 bg-gray-50/50 rounded-xl border border-gray-100 flex items-end px-4 pt-8 pb-4">
            {/* SVG Giả lập biểu đồ */}
            <svg
              className="absolute inset-0 w-full h-full text-[#00D1FF] opacity-20"
              preserveAspectRatio="none"
              viewBox="0 0 100 100"
            >
              <path
                d="M0,100 L0,50 Q25,20 50,60 T100,30 L100,100 Z"
                fill="currentColor"
              />
            </svg>
            <svg
              className="absolute inset-0 w-full h-full text-[#7B42FF]"
              preserveAspectRatio="none"
              viewBox="0 0 100 100"
            >
              <path
                d="M0,60 Q25,30 50,70 T100,40"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              />
            </svg>

            {/* Trục X (Ngày tháng) */}
            <div className="absolute bottom-4 left-4 right-4 flex justify-between text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              <span>Mon</span>
              <span>Tue</span>
              <span>Wed</span>
              <span>Thu</span>
              <span>Fri</span>
              <span>Sat</span>
              <span>Sun</span>
            </div>
          </div>
        </div>

        {/* Recent Activity Feed */}
        <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-900">Recent Activity</h3>
            <button className="text-gray-400 hover:text-gray-900 transition-colors">
              <MoreHorizontal className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-6">
            <ActivityItem
              avatar="https://i.pravatar.cc/150?img=11"
              title="New Video Upload"
              desc="Alex Rivera uploaded 'Cyberpunk 2077 Walkthrough'"
              time="2 mins ago"
              type="upload"
            />
            <ActivityItem
              avatar="https://i.pravatar.cc/150?img=47"
              title="Payout Processed"
              desc="$1,200.00 transferred to Elena Chen"
              time="1 hour ago"
              type="financial"
            />
            <ActivityItem
              avatar="https://i.pravatar.cc/150?img=33"
              title="User Banned"
              desc="System automatically banned User UID:1104-SF"
              time="3 hours ago"
              type="alert"
            />
            <ActivityItem
              avatar="https://i.pravatar.cc/150?img=32"
              title="New Campaign"
              desc="Summer Horizon Series is now Active"
              time="5 hours ago"
              type="campaign"
            />
          </div>

          <button className="w-full mt-6 py-2.5 rounded-lg border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors">
            View All Activity
          </button>
        </div>
      </div>
    </div>
  );
}

// Component phụ trợ cho danh sách hoạt động
function ActivityItem({
  avatar,
  title,
  desc,
  time,
  type,
}: {
  avatar: string;
  title: string;
  desc: string;
  time: string;
  type: string;
}) {
  return (
    <div className="flex gap-4 items-start">
      <img
        src={avatar}
        alt=""
        className="w-9 h-9 rounded-full object-cover border border-gray-100 shadow-sm"
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-gray-900 truncate">{title}</p>
        <p className="text-xs text-gray-500 truncate mt-0.5">{desc}</p>
      </div>
      <span className="text-[10px] font-bold text-gray-400 whitespace-nowrap">
        {time}
      </span>
    </div>
  );
}
