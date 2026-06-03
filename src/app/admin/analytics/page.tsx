"use client";

import { Clock, Users, UserCheck } from "lucide-react";

export default function AnalyticsPage() {
  return (
    <div className="flex flex-col gap-8 max-w-7xl mx-auto w-full">
      {/* 1. Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight mb-2">
          System Analytics
        </h1>
        <p className="text-sm text-gray-500 font-medium">
          Real-time engagement tracking and platform performance metrics.
        </p>
      </div>

      {/* 2. Biểu đồ Chính: Daily Active Users (DAU) */}
      <div className="w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-xl font-bold text-gray-900">
              Daily Active Users (DAU)
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Real-time engagement tracking across all regions.
            </p>
          </div>
          <div className="flex items-center p-1 bg-gray-100 border border-gray-200 rounded-lg">
            <button className="px-4 py-1.5 rounded bg-[#00D1FF] text-xs font-bold text-white shadow-sm">
              Live
            </button>
            <button className="px-4 py-1.5 rounded text-xs font-bold text-gray-500 hover:text-gray-900 transition-colors">
              Last 30 Days
            </button>
          </div>
        </div>

        {/* Khu vực vẽ biểu đồ (SVG giả lập Line Chart mượt) */}
        <div className="relative w-full h-[280px] mt-4 flex items-end pb-8">
          <svg
            className="absolute inset-0 w-full h-full"
            preserveAspectRatio="none"
            viewBox="0 0 1000 300"
          >
            {/* Lưới ngang (Grid lines) */}
            <line
              x1="0"
              y1="50"
              x2="1000"
              y2="50"
              stroke="#F3F4F6"
              strokeWidth="1"
            />
            <line
              x1="0"
              y1="150"
              x2="1000"
              y2="150"
              stroke="#F3F4F6"
              strokeWidth="1"
            />
            <line
              x1="0"
              y1="250"
              x2="1000"
              y2="250"
              stroke="#F3F4F6"
              strokeWidth="1"
            />

            {/* Vùng mờ bên dưới đường line (Gradient Fill) */}
            <defs>
              <linearGradient id="dau-gradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#7B42FF" stopOpacity="0.15" />
                <stop offset="100%" stopColor="#7B42FF" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path
              d="M0,250 C100,250 150,150 250,200 C350,250 450,100 550,50 C650,0 700,200 800,250 C900,300 950,50 1000,80 L1000,300 L0,300 Z"
              fill="url(#dau-gradient)"
            />

            {/* Đường Line chính */}
            <path
              d="M0,250 C100,250 150,150 250,200 C350,250 450,100 550,50 C650,0 700,200 800,250 C900,300 950,50 1000,80"
              fill="none"
              stroke="#7B42FF"
              strokeWidth="5"
              strokeLinecap="round"
              className="drop-shadow-[0_8px_12px_rgba(123,66,255,0.3)]"
            />

            {/* Điểm nhấn (Tooltip marker) */}
            <circle
              cx="880"
              cy="80"
              r="6"
              fill="white"
              stroke="#7B42FF"
              strokeWidth="3"
            />
          </svg>

          {/* Nhãn Tooltip giả lập */}
          <div className="absolute top-[40px] right-[70px] bg-gray-900 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-lg">
            1.2M
          </div>

          {/* Trục X (Labels) */}
          <div className="absolute bottom-0 left-0 w-full flex justify-between text-xs font-bold text-gray-400">
            <span>Oct 01</span>
            <span>Oct 07</span>
            <span>Oct 14</span>
            <span>Oct 21</span>
            <span>Oct 28</span>
            <span>Now</span>
          </div>
        </div>
      </div>

      {/* 3. Lưới chỉ số phụ (Bottom Grid) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Cột 1: Content Genre Popularity (Donut Chart) */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col">
          <h3 className="text-base font-bold text-gray-900 mb-6">
            Content Genre Popularity
          </h3>

          {/* CSS Conic Gradient Donut Chart */}
          <div className="flex-1 flex flex-col items-center justify-center mb-6">
            <div
              className="relative w-40 h-40 rounded-full flex items-center justify-center shadow-inner"
              style={{
                background:
                  "conic-gradient(#7B42FF 0% 35%, #00D1FF 35% 60%, #007A8A 60% 80%, #F3F4F6 80% 100%)",
              }}
            >
              <div className="absolute inset-0 m-4 bg-white rounded-full flex flex-col items-center justify-center shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)]">
                <span className="text-xl font-black text-gray-900 leading-none mb-1">
                  100%
                </span>
                <span className="text-[10px] font-bold text-gray-400 tracking-wider">
                  TOTAL
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-3 mt-auto">
            <LegendItem color="bg-[#7B42FF]" label="Action" value="35%" />
            <LegendItem color="bg-[#00D1FF]" label="Romance" value="25%" />
            <LegendItem color="bg-[#007A8A]" label="Sci-Fi" value="20%" />
            <LegendItem color="bg-gray-200" label="Others" value="20%" />
          </div>
        </div>

        {/* Cột 2: Key Metrics Cards */}
        <div className="flex flex-col gap-4">
          <MiniMetricCard
            title="Avg. Session Duration"
            value="42m 15s"
            icon={<Clock className="w-5 h-5 text-[#007A8A]" />}
            strokeColor="#00D1FF"
          />
          <MiniMetricCard
            title="Peak Concurrent Users"
            value="84.2K"
            icon={<Users className="w-5 h-5 text-[#7B42FF]" />}
            strokeColor="#7B42FF"
          />
          <MiniMetricCard
            title="Retention Rate"
            value="68.4%"
            icon={<UserCheck className="w-5 h-5 text-[#E50914]" />}
            strokeColor="#E50914"
          />
        </div>

        {/* Cột 3: Top Creators Leaderboard */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-base font-bold text-gray-900">Top Creators</h3>
            <button className="text-xs font-bold text-[#007A8A] hover:underline">
              View All
            </button>
          </div>
          <div className="flex flex-col gap-5">
            <CreatorItem
              avatar="https://i.pravatar.cc/150?img=11"
              name="Alex River"
              category="Digital Art"
              score="9.8"
            />
            <CreatorItem
              avatar="https://i.pravatar.cc/150?img=47"
              name="Beatrix K."
              category="Lifestyle Vlogs"
              score="9.5"
            />
            <CreatorItem
              avatar="https://i.pravatar.cc/150?img=33"
              name="Cassian Grey"
              category="Tech Reviews"
              score="9.2"
            />
            <CreatorItem
              avatar="https://i.pravatar.cc/150?img=12"
              name="Dara Moon"
              category="Sci-Fi Writer"
              score="8.9"
            />
            <CreatorItem
              avatar="https://i.pravatar.cc/150?img=14"
              name="Evan Thorne"
              category="Music Prod."
              score="8.7"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ================= Phụ trợ Components =================

function LegendItem({
  color,
  label,
  value,
}: {
  color: string;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between text-sm">
      <div className="flex items-center gap-2">
        <span className={`w-3 h-3 rounded-full ${color}`} />
        <span className="font-medium text-gray-600">{label}</span>
      </div>
      <span className="font-bold text-gray-900">{value}</span>
    </div>
  );
}

function MiniMetricCard({
  title,
  value,
  icon,
  strokeColor,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  strokeColor: string;
}) {
  return (
    <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex flex-col justify-between group hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-xs font-bold text-gray-500">{title}</h4>
        {icon}
      </div>
      <div className="flex items-end justify-between">
        <span className="text-3xl font-extrabold text-gray-900">{value}</span>
        {/* Sparkline giả lập bằng SVG */}
        <svg
          className="w-16 h-8 opacity-70 group-hover:opacity-100 transition-opacity"
          viewBox="0 0 100 40"
        >
          <path
            d="M0,30 Q25,10 50,20 T100,5"
            fill="none"
            stroke={strokeColor}
            strokeWidth="3"
            strokeLinecap="round"
          />
        </svg>
      </div>
    </div>
  );
}

function CreatorItem({
  avatar,
  name,
  category,
  score,
}: {
  avatar: string;
  name: string;
  category: string;
  score: string;
}) {
  return (
    <div className="flex items-center justify-between group">
      <div className="flex items-center gap-3">
        <img
          src={avatar}
          alt={name}
          className="w-10 h-10 rounded-full object-cover border border-gray-100 shadow-sm"
        />
        <div>
          <p className="text-sm font-bold text-gray-900 group-hover:text-[#7B42FF] transition-colors cursor-pointer">
            {name}
          </p>
          <p className="text-[11px] text-gray-500 font-medium">{category}</p>
        </div>
      </div>
      <div className="text-right">
        <p className="text-sm font-bold text-[#00A389]">{score}</p>
        <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">
          Engagement Score
        </p>
      </div>
    </div>
  );
}
