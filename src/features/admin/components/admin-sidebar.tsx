"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { create } from "zustand";
import { logoutAction } from "@/features/auth/api/auth.actions";
import { useAuthStore } from "@/features/auth/store/auth.store";
import {
  LayoutDashboard,
  Users,
  CircleDollarSign,
  CreditCard,
  Image as ImageIcon,
  Settings,
  BarChart as Analytics,
  LogOut,
  Plus,
  PlaySquare,
  BookOpen,
  FileText,
  ShieldCheck,
  Target,
  Megaphone,
} from "lucide-react";

type AdminSidebarState = {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
};

export const useAdminSidebarStore = create<AdminSidebarState>((set) => ({
  isSidebarOpen: true,
  toggleSidebar: () =>
    set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
}));

const navItems = [
  { name: "Bảng Điều Khiển", href: "/admin/dashboard", icon: LayoutDashboard },
  { name: "Nội Dung Phim", href: "/admin/videos", icon: PlaySquare },
  { name: "Nội Dung Truyện", href: "/admin/comics", icon: BookOpen },
  { name: "Người Dùng", href: "/admin/users", icon: Users },
  {
    name: "Cấp Creator",
    href: "/admin/creator-tiers",
    icon: ShieldCheck,
  },
  {
    name: "Gói Premium",
    href: "/admin/subscriptions",
    icon: CreditCard,
  },
  { name: "Thống Kê", href: "/admin/analytics", icon: Analytics },
  { name: "Tài Chính", href: "/admin/financials", icon: CircleDollarSign },
  {
    name: "Kinh Tế Coin",
    href: "/admin/coin-management",
    icon: CircleDollarSign,
  },
  {
    name: "Nhiệm Vụ",
    href: "/admin/mission-management",
    icon: Target,
  },
  {
    name: "Dịch vụ Tương tác",
    href: "/admin/engagement-services",
    icon: Megaphone,
  },
  { name: "Chiến Dịch", href: "/admin/campaigns", icon: ImageIcon },
  { name: "Điều Khoản", href: "/admin/terms", icon: FileText },
  { name: "Cài Đặt", href: "/admin/settings", icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { clearAuth } = useAuthStore();
  const isSidebarOpen = useAdminSidebarStore((state) => state.isSidebarOpen);

  const handleLogout = async () => {
    await logoutAction();
    clearAuth();
    router.push("/login");
    router.refresh();
  };

  return (
    <aside
      className={`hidden h-[calc(100vh-64px)] flex-shrink-0 flex-col overflow-y-auto border-r border-gray-100 bg-white py-4 transition-all duration-300 ease-in-out lg:flex ${
        isSidebarOpen ? "w-[260px] px-4" : "w-[80px] px-2"
      }`}
    >
      <nav className="flex-1 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              title={item.name}
              className={`flex items-center rounded-lg py-3 text-sm font-medium transition-all duration-300 ${
                isSidebarOpen ? "justify-start gap-3 px-4" : "justify-center px-0"
              } ${
                isActive
                  ? "bg-[#F3F0FF] text-[#7B42FF]"
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <Icon
                className={`h-5 w-5 shrink-0 ${
                  isActive ? "text-[#7B42FF]" : "text-gray-400"
                }`}
              />
              <span
                className={`truncate whitespace-nowrap transition-all duration-200 ${
                  isSidebarOpen
                    ? "max-w-[170px] opacity-100"
                    : "max-w-0 overflow-hidden opacity-0"
                }`}
              >
                {item.name}
              </span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto flex flex-col gap-4">
        <button
          className={`flex w-full items-center justify-center gap-2 rounded-lg bg-[#00D1FF] py-3 text-sm font-bold text-white shadow-md transition-all hover:-translate-y-0.5 active:translate-y-0 ${
            isSidebarOpen ? "px-4" : "px-0"
          }`}
          title="Thêm Mới"
        >
          <Plus className="h-5 w-5 shrink-0" />
          <span
            className={`truncate whitespace-nowrap transition-all duration-200 ${
              isSidebarOpen
                ? "max-w-[120px] opacity-100"
                : "max-w-0 overflow-hidden opacity-0"
            }`}
          >
            Thêm Mới
          </span>
        </button>

        <div className="space-y-1 border-t border-gray-100 pt-4">
          <button
            className={`flex w-full items-center rounded-lg py-2.5 text-sm font-medium text-gray-500 transition-all hover:bg-gray-50 hover:text-gray-900 ${
              isSidebarOpen ? "justify-start gap-3 px-4" : "justify-center px-0"
            }`}
            title="Hỗ Trợ"
          >
            <Settings className="h-5 w-5 shrink-0 text-gray-400" />
            <span
              className={`truncate whitespace-nowrap transition-all duration-200 ${
                isSidebarOpen
                  ? "max-w-[120px] opacity-100"
                  : "max-w-0 overflow-hidden opacity-0"
              }`}
            >
              Hỗ Trợ
            </span>
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className={`flex w-full items-center rounded-lg py-2.5 text-sm font-medium text-gray-500 transition-all hover:bg-red-50 hover:text-red-600 ${
              isSidebarOpen ? "justify-start gap-3 px-4" : "justify-center px-0"
            }`}
            title="Đăng xuất"
          >
            <LogOut className="h-5 w-5 shrink-0 text-gray-400" />
            <span
              className={`truncate whitespace-nowrap transition-all duration-200 ${
                isSidebarOpen
                  ? "max-w-[120px] opacity-100"
                  : "max-w-0 overflow-hidden opacity-0"
              }`}
            >
              Đăng xuất
            </span>
          </button>
        </div>
      </div>
    </aside>
  );
}
