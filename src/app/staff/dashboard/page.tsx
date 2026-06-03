"use client";

import Link from "next/link";
import {
  FileCheck2,
  ShieldAlert,
  Flag,
  Activity,
  ArrowRight,
  Clock,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";

export default function StaffDashboardPage() {
  return (
    <div className="flex flex-col gap-8 max-w-7xl mx-auto w-full">
      {/* 1. Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight mb-2">
            My Workspace
          </h1>
          <p className="text-sm text-gray-500 font-medium">
            Welcome back, Sarah. Here is your current task queue for today.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-white border border-gray-200 px-4 py-2.5 text-sm font-bold text-gray-700 shadow-sm">
          <Activity className="h-4 w-4 text-[#10B981]" />
          Shift Status: Active
        </div>
      </div>

      {/* 2. Workload Overview (KPI Cards) */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Creator Applications */}
        <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center">
              <FileCheck2 className="h-5 w-5 text-blue-500" />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-black text-gray-900 mb-1">24</h3>
            <p className="text-sm font-medium text-gray-500">
              Pending Applications
            </p>
          </div>
        </div>

        {/* Card 2: Content Moderation */}
        <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div className="h-10 w-10 rounded-full bg-amber-50 flex items-center justify-center relative">
              <ShieldAlert className="h-5 w-5 text-amber-500" />
              {/* Notification dot */}
              <span className="absolute top-0 right-0 flex h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white"></span>
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-black text-gray-900 mb-1">42</h3>
            <p className="text-sm font-medium text-gray-500">
              Content to Review
            </p>
          </div>
        </div>

        {/* Card 3: Open Tickets */}
        <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all flex flex-col justify-between border-b-4 border-b-red-500">
          <div className="flex items-center justify-between mb-4">
            <div className="h-10 w-10 rounded-full bg-red-50 flex items-center justify-center">
              <Flag className="h-5 w-5 text-red-500" />
            </div>
            <span className="text-[10px] font-bold text-red-600 bg-red-50 px-2 py-1 rounded-md uppercase tracking-wider">
              High Priority
            </span>
          </div>
          <div>
            <h3 className="text-2xl font-black text-gray-900 mb-1">14</h3>
            <p className="text-sm font-medium text-gray-500">
              Open Tickets & Reports
            </p>
          </div>
        </div>

        {/* Card 4: Resolved Today */}
        <div className="rounded-2xl bg-[#ECFDF5] p-6 shadow-sm border border-[#10B981]/20 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center shadow-sm">
              <CheckCircle2 className="h-5 w-5 text-[#10B981]" />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-black text-[#047857] mb-1">86</h3>
            <p className="text-sm font-bold text-[#059669]">
              Tasks Resolved Today
            </p>
          </div>
        </div>
      </div>

      {/* 3. Priority Action Queue & Recent Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cột trái: Priority Action Queue */}
        <div className="rounded-2xl bg-white border border-gray-100 shadow-sm flex flex-col overflow-hidden">
          <div className="p-6 border-b border-gray-50">
            <h3 className="text-lg font-bold text-gray-900">
              Priority Action Queue
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              Items requiring immediate attention
            </p>
          </div>

          <div className="flex flex-col">
            <QueueItem
              icon={<AlertTriangle className="w-5 h-5 text-red-500" />}
              title="Ticket TKT-5091"
              desc="Copyright Infringement Report on Cyber Edge Ep 4"
              time="10 mins ago"
              href="/staff/reports"
            />
            <QueueItem
              icon={<ShieldAlert className="w-5 h-5 text-amber-500" />}
              title="Content MOD-1047"
              desc="Video flagged by AI for explicit content"
              time="25 mins ago"
              href="/staff/moderation"
            />
            <QueueItem
              icon={<FileCheck2 className="w-5 h-5 text-blue-500" />}
              title="Application APP-9022"
              desc="Missing Tax Documentation for Elena Chen"
              time="1 hour ago"
              href="/staff/applications"
            />
          </div>
        </div>

        {/* Cột phải: My Recent Activity */}
        <div className="rounded-2xl bg-white border border-gray-100 shadow-sm flex flex-col overflow-hidden">
          <div className="p-6 border-b border-gray-50 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-gray-900">
                My Recent Activity
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                Your moderation log for this shift
              </p>
            </div>
          </div>

          <div className="p-6 flex flex-col gap-6">
            <LogItem
              status="approved"
              title="Approved Application APP-9021"
              desc="Creator Marcus Thorne successfully onboarded."
              time="10:45 AM"
            />
            <LogItem
              status="resolved"
              title="Resolved Ticket TKT-5088"
              desc="Processed refund for user ID 8821-SF."
              time="09:30 AM"
            />
            <LogItem
              status="rejected"
              title="Rejected Content MOD-1033"
              desc="Removed spam video uploaded by untrusted source."
              time="08:15 AM"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// === Phụ trợ Components ===

function QueueItem({
  icon,
  title,
  desc,
  time,
  href,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  time: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-4 p-5 hover:bg-gray-50 border-b border-gray-50 transition-colors group"
    >
      <div className="h-10 w-10 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0 group-hover:bg-white transition-colors">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-bold text-gray-900 truncate">{title}</h4>
        <p className="text-[12px] font-medium text-gray-500 truncate mt-0.5">
          {desc}
        </p>
      </div>
      <div className="flex flex-col items-end gap-1 shrink-0">
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
          {time}
        </span>
        <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-[#10B981] transition-colors group-hover:translate-x-1" />
      </div>
    </Link>
  );
}

function LogItem({
  status,
  title,
  desc,
  time,
}: {
  status: "approved" | "rejected" | "resolved";
  title: string;
  desc: string;
  time: string;
}) {
  let iconObj;
  switch (status) {
    case "approved":
      iconObj = <CheckCircle2 className="w-4 h-4 text-blue-500" />;
      break;
    case "rejected":
      iconObj = <AlertTriangle className="w-4 h-4 text-amber-500" />;
      break;
    case "resolved":
      iconObj = <Flag className="w-4 h-4 text-[#10B981]" />;
      break;
  }

  return (
    <div className="flex gap-4 relative">
      <div className="flex flex-col items-center">
        <div className="h-8 w-8 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center z-10">
          {iconObj}
        </div>
        <div className="w-px h-full bg-gray-100 absolute top-8 bottom-0 -z-0"></div>
      </div>
      <div className="pb-2">
        <div className="flex items-center gap-2 mb-1">
          <h4 className="text-sm font-bold text-gray-900">{title}</h4>
          <span className="text-[10px] font-bold text-gray-400 flex items-center gap-1">
            <Clock className="w-3 h-3" /> {time}
          </span>
        </div>
        <p className="text-xs text-gray-500 font-medium">{desc}</p>
      </div>
    </div>
  );
}
