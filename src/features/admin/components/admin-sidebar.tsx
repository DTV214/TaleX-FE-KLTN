"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
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
} from "lucide-react";

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
  { name: "Chiến Dịch", href: "/admin/campaigns", icon: ImageIcon },
  { name: "Điều Khoản", href: "/admin/terms", icon: FileText },
  { name: "Cài Đặt", href: "/admin/settings", icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { clearAuth } = useAuthStore();

  const handleLogout = async () => {
    await logoutAction();
    clearAuth();
    router.push("/login");
    router.refresh();
  };

  return (
    <aside className="sticky top-0 hidden h-screen w-[260px] shrink-0 flex-col overflow-y-auto border-r border-gray-100 bg-white py-6 lg:flex">
      <div className="mb-8 px-8">
        <Link href="/admin/dashboard" className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded bg-[#00D1FF] text-lg font-bold text-white shadow-sm">
            T
          </div>
          <span className="font-heading text-xl font-extrabold tracking-wide text-gray-900">
            TaleX{" "}
            <span className="text-sm font-medium text-gray-400">Quản trị</span>
          </span>
        </Link>
      </div>

      <nav className="flex-1 space-y-1 px-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all ${
                isActive
                  ? "bg-[#F3F0FF] text-[#7B42FF]"
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <Icon
                className={`h-5 w-5 ${
                  isActive ? "text-[#7B42FF]" : "text-gray-400"
                }`}
              />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto flex flex-col gap-4 px-6">
        <button className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#00D1FF] py-3 text-sm font-bold text-white shadow-md transition-transform hover:-translate-y-0.5 active:translate-y-0">
          <Plus className="h-5 w-5" />
          Thêm Mới
        </button>

        <div className="space-y-1 border-t border-gray-100 pt-4">
          <button className="flex w-full items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-900">
            <Settings className="h-5 w-5 text-gray-400" />
            Hỗ Trợ
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium text-gray-500 transition-colors hover:bg-red-50 hover:text-red-600"
          >
            <LogOut className="h-5 w-5 text-gray-400" />
            Đăng xuất
          </button>
        </div>
      </div>
    </aside>
  );
}
