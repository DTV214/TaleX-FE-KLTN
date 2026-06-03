"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileCheck2, // Cho Creator Applications
  ShieldAlert, // Cho Content Moderation
  Flag, // Cho Report Management
  Settings,
  LogOut,
  HelpCircle,
} from "lucide-react";

export function StaffSidebar() {
  const pathname = usePathname();

  const navItems = [
    { name: "Dashboard", href: "/staff/dashboard", icon: LayoutDashboard },
    { name: "Applications", href: "/staff/applications", icon: FileCheck2 },
    { name: "Moderation", href: "/staff/moderation", icon: ShieldAlert },
    { name: "Reports & Tickets", href: "/staff/reports", icon: Flag },
  ];

  return (
    <aside className="sticky top-0 flex h-screen w-[260px] flex-col border-r border-gray-100 bg-white py-6 shrink-0">
      {/* Logo Area */}
      <div className="px-8 mb-8">
        <Link href="/staff/dashboard" className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded bg-[#10B981] text-white font-bold text-lg shadow-sm">
            T
          </div>
          <span className="font-heading text-xl font-extrabold text-gray-900 tracking-wide">
            TaleX{" "}
            <span className="text-gray-400 font-medium text-sm">Staff</span>
          </span>
        </Link>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-4 space-y-1">
        <div className="px-4 mb-2 text-xs font-bold tracking-widest text-gray-400 uppercase">
          Workspace
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname.startsWith(item.href);

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-bold transition-all ${
                isActive
                  ? "bg-[#ECFDF5] text-[#10B981]" // Nền xanh ngọc nhạt, chữ đậm
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <Icon
                className={`w-5 h-5 ${isActive ? "text-[#10B981]" : "text-gray-400"}`}
              />
              {item.name}
              {/* Badge thông báo số lượng công việc chờ (Mock) */}
              {item.name === "Moderation" && (
                <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-red-100 text-[10px] text-red-600">
                  12
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Actions */}
      <div className="px-6 mt-auto flex flex-col gap-2 border-t border-gray-100 pt-4">
        <button className="flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-900 w-full transition-colors">
          <Settings className="w-5 h-5 text-gray-400" />
          Preferences
        </button>
        <button className="flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-900 w-full transition-colors">
          <HelpCircle className="w-5 h-5 text-gray-400" />
          Staff Guidelines
        </button>
        <button className="flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium text-gray-500 hover:bg-red-50 hover:text-red-600 w-full transition-colors mt-2">
          <LogOut className="w-5 h-5 text-gray-400" />
          Logout
        </button>
      </div>
    </aside>
  );
}
