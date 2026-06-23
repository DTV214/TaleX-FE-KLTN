"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  CircleDollarSign,
  Image as ImageIcon,
  Settings,
  BarChart as Analytics,
  LogOut,
  Plus,
  PlaySquare,
  BookOpen,
  FileText,
  Target,
} from "lucide-react";

export function AdminSidebar() {
  const pathname = usePathname();

  const navItems = [
    { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
    { name: "Video Content", href: "/admin/videos", icon: PlaySquare },
    { name: "Comics", href: "/admin/comics", icon: BookOpen },
    { name: "User Management", href: "/admin/users", icon: Users },
    { name: "Analytics", href: "/admin/analytics", icon: Analytics },
    { name: "Financials", href: "/admin/financials", icon: CircleDollarSign },
    {
      name: "Coin Economy",
      href: "/admin/coin-management",
      icon: CircleDollarSign,
    },
    {
      name: "Mission System",
      href: "/admin/mission-management",
      icon: Target,
    },
    { name: "Campaigns", href: "/admin/campaigns", icon: ImageIcon },
    { name: "Terms", href: "/admin/terms", icon: FileText },
    { name: "Settings", href: "/admin/settings", icon: Settings },
  ];

  return (
    <aside className="sticky top-0 hidden h-screen w-[260px] shrink-0 flex-col overflow-y-auto border-r border-gray-100 bg-white py-6 lg:flex">
      {/* Logo Area */}
      <div className="px-8 mb-8">
        <Link href="/admin/dashboard" className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded bg-[#00D1FF] text-white font-bold text-lg shadow-sm">
            T
          </div>
          <span className="font-heading text-xl font-extrabold text-gray-900 tracking-wide">
            TaleX{" "}
            <span className="text-gray-400 font-medium text-sm">Admin</span>
          </span>
        </Link>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname.startsWith(item.href);

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all ${
                isActive
                  ? "bg-[#F3F0FF] text-[#7B42FF]" // Màu tím nhạt tạo điểm nhấn tinh tế
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <Icon
                className={`w-5 h-5 ${isActive ? "text-[#7B42FF]" : "text-gray-400"}`}
              />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Actions */}
      <div className="px-6 mt-auto flex flex-col gap-4">
        <button className="flex items-center justify-center gap-2 w-full rounded-lg bg-[#00D1FF] py-3 text-sm font-bold text-white shadow-md transition-transform hover:-translate-y-0.5 active:translate-y-0">
          <Plus className="w-5 h-5" />
          New Content
        </button>

        <div className="pt-4 border-t border-gray-100 space-y-1">
          <button className="flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-900 w-full transition-colors">
            <Settings className="w-5 h-5 text-gray-400" />
            Support
          </button>
          <button className="flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium text-gray-500 hover:bg-red-50 hover:text-red-600 w-full transition-colors">
            <LogOut className="w-5 h-5 text-gray-400" />
            Logout
          </button>
        </div>
      </div>
    </aside>
  );
}
