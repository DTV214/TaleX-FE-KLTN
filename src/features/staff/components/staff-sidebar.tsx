"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { create } from "zustand";
import { logoutAction } from "@/features/auth/api/auth.actions";
import { useAuthStore } from "@/features/auth/store/auth.store";
import {
  LayoutDashboard,
  FileCheck2, // Cho Creator Applications
  ShieldAlert, // Cho Content Moderation
  Flag, // Cho Report Management
  ShieldCheck,
  Users,
  Clapperboard,
  LogOut,
} from "lucide-react";

type StaffSidebarState = {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
};

export const useStaffSidebarStore = create<StaffSidebarState>((set) => ({
  isSidebarOpen: true,
  toggleSidebar: () =>
    set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
}));

export function StaffSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { clearAuth } = useAuthStore();
  const isSidebarOpen = useStaffSidebarStore((state) => state.isSidebarOpen);

  const handleLogout = async () => {
    await logoutAction();
    clearAuth();
    router.push("/login");
    router.refresh();
  };

  const navItems = [
    { name: "Dashboard", href: "/staff/dashboard", icon: LayoutDashboard },
    { name: "Applications", href: "/staff/applications", icon: FileCheck2 },
    { name: "Moderation", href: "/staff/moderation", icon: ShieldAlert },
    { name: "Reports & Tickets", href: "/staff/reports", icon: Flag },
    {
      name: "Kiểm duyệt Hồ sơ",
      href: "/staff/creator-verification",
      icon: ShieldCheck,
    },
    {
      name: "Người sáng tạo",
      href: "/staff/creators",
      icon: Users,
    },
    {
      name: "Danh sách Series",
      href: "/staff/series",
      icon: Clapperboard,
    },
  ];

  return (
    <aside
      className={`flex h-[calc(100vh-64px)] shrink-0 flex-col border-r border-gray-100 bg-white py-4 transition-all duration-300 ${
        isSidebarOpen ? "w-[260px]" : "w-[80px]"
      }`}
    >
      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto px-3 space-y-1">
        {isSidebarOpen && (
          <div className="px-3 mb-2 text-xs font-bold tracking-widest text-gray-400 uppercase">
            Workspace
          </div>
        )}
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname.startsWith(item.href);

          return (
            <Link
              key={item.name}
              href={item.href}
              title={item.name}
              className={`relative flex items-center rounded-lg py-3 text-sm font-bold transition-all ${
                isSidebarOpen
                  ? "justify-start gap-3 px-4"
                  : "justify-center px-0"
              } ${
                isActive
                  ? "bg-[#ECFDF5] text-[#10B981]" // Nền xanh ngọc nhạt, chữ đậm
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <Icon
                className={`w-5 h-5 shrink-0 ${isActive ? "text-[#10B981]" : "text-gray-400"}`}
              />
              {isSidebarOpen && <span className="truncate">{item.name}</span>}
              {/* Badge thông báo số lượng công việc chờ */}
              {item.name === "Moderation" && (
                <span
                  className={`flex items-center justify-center rounded-full bg-red-100 text-[10px] text-red-600 ${
                    isSidebarOpen
                      ? "ml-auto h-5 w-5"
                      : "absolute top-1 right-2 h-4 w-4 text-[9px]"
                  }`}
                >
                  12
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Pinned Logout Button */}
      <div className="mt-auto border-t border-gray-100 px-3 pt-3">
        <button
          onClick={handleLogout}
          title="Đăng xuất"
          aria-label="Đăng xuất"
          className={`flex items-center gap-3 rounded-lg py-3 text-sm font-bold transition-all text-red-500 hover:bg-red-50 hover:text-red-600 ${
            isSidebarOpen
              ? "w-full justify-start px-4"
              : "w-full justify-center px-0"
          }`}
        >
          <LogOut className="w-5 h-5 shrink-0" />
          {isSidebarOpen && <span className="truncate">Đăng xuất</span>}
        </button>
      </div>
    </aside>
  );
}



