"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { create } from "zustand";
import { logoutAction } from "@/features/auth/api/auth.actions";
import { useAuthStore } from "@/features/auth/store/auth.store";
import {
  BarChart as Analytics,
  ChevronRight,
  CircleDollarSign,
  Clapperboard,
  CreditCard,
  FileText,
  Folder,
  Grid3X3,
  Home,
  Image as ImageIcon,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Plus,
  Settings,
  ShieldAlert,
  ShieldCheck,
  Tag,
  Target,
  UserCheck,
  Users,
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

const contentNavItems = [
  { name: "Danh sách Series", href: "/admin/series", icon: Clapperboard },
  { name: "Thể loại", href: "/admin/categories", icon: Grid3X3 },
  { name: "Thẻ", href: "/admin/tags", icon: Tag },
  { name: "Kiểm duyệt", href: "/admin/moderation", icon: ShieldAlert },
];

const creatorVerificationNavItems = [
  {
    name: "Hồ sơ thuế",
    href: "/admin/creator-verification?tab=tax",
    icon: UserCheck,
  },
  {
    name: "Hồ sơ thanh toán",
    href: "/admin/creator-verification?tab=payment",
    icon: CreditCard,
  },
];

const navItems = [
  { name: "Bảng Điều Khiển", href: "/admin/dashboard", icon: LayoutDashboard },
  { name: "Người Dùng", href: "/admin/users", icon: Users },
  { name: "Người sáng tạo", href: "/admin/creators", icon: Users },
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

function isRouteActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function isHrefActive(pathname: string, currentHref: string, href: string) {
  const [hrefPathname, hrefQuery] = href.split("?");

  if (!hrefQuery) {
    return isRouteActive(pathname, hrefPathname);
  }

  return (
    currentHref === href ||
    (pathname === hrefPathname && !currentHref.includes("?"))
  );
}

function AdminNavLink({
  href,
  icon: Icon,
  isSidebarOpen,
  name,
  pathname,
}: {
  href: string;
  icon: typeof LayoutDashboard;
  isSidebarOpen: boolean;
  name: string;
  pathname: string;
}) {
  const isActive = isRouteActive(pathname, href);

  return (
    <Link
      href={href}
      title={name}
      className={`flex items-center rounded-lg py-3 text-sm font-medium transition-all duration-300 ${
        isSidebarOpen ? "justify-start gap-3 px-4" : "justify-center px-0"
      } ${
        isActive
          ? "bg-violet-50 text-violet-600"
          : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
      }`}
    >
      <Icon
        className={`h-5 w-5 shrink-0 ${
          isActive ? "text-violet-600" : "text-slate-400"
        }`}
      />
      <span
        className={`truncate whitespace-nowrap transition-all duration-200 ${
          isSidebarOpen
            ? "max-w-[170px] opacity-100"
            : "max-w-0 overflow-hidden opacity-0"
        }`}
      >
        {name}
      </span>
    </Link>
  );
}

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { clearAuth } = useAuthStore();
  const isSidebarOpen = useAdminSidebarStore((state) => state.isSidebarOpen);
  const currentSearch = searchParams.toString();
  const currentHref = `${pathname}${currentSearch ? `?${currentSearch}` : ""}`;
  const isContentRouteActive = contentNavItems.some((item) =>
    isRouteActive(pathname, item.href),
  );
  const isCreatorVerificationRouteActive = creatorVerificationNavItems.some(
    (item) => isHrefActive(pathname, currentHref, item.href),
  );
  const [isContentMenuOpen, setIsContentMenuOpen] =
    useState(isContentRouteActive);
  const [isCreatorVerificationMenuOpen, setIsCreatorVerificationMenuOpen] =
    useState(isCreatorVerificationRouteActive);

  const handleLogout = async () => {
    await logoutAction();
    clearAuth();
    router.push("/login");
    router.refresh();
  };

  return (
    <aside
      className={`hidden h-[calc(100vh-64px)] flex-shrink-0 flex-col overflow-y-auto border-r border-slate-100 bg-white py-4 transition-all duration-300 ease-in-out lg:flex ${
        isSidebarOpen ? "w-[260px] px-4" : "w-[80px] px-2"
      }`}
    >
      <nav className="flex-1 space-y-1">
        <AdminNavLink
          href={navItems[0].href}
          icon={navItems[0].icon}
          isSidebarOpen={isSidebarOpen}
          name={navItems[0].name}
          pathname={pathname}
        />

        <div>
          <button
            type="button"
            onClick={() => setIsCreatorVerificationMenuOpen((open) => !open)}
            title="Kiểm duyệt Creator"
            aria-expanded={isCreatorVerificationMenuOpen}
            className={`flex w-full items-center rounded-lg py-3 text-sm font-medium transition-all duration-300 ${
              isSidebarOpen ? "justify-start gap-3 px-4" : "justify-center px-0"
            } ${
              isCreatorVerificationRouteActive
                ? "bg-violet-50 text-violet-600"
                : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            <UserCheck
              className={`h-5 w-5 shrink-0 ${
                isCreatorVerificationRouteActive
                  ? "text-violet-600"
                  : "text-slate-400"
              }`}
            />
            <span
              className={`truncate whitespace-nowrap transition-all duration-200 ${
                isSidebarOpen
                  ? "max-w-[170px] opacity-100"
                  : "max-w-0 overflow-hidden opacity-0"
              }`}
            >
              Kiểm duyệt
            </span>
            <ChevronRight
              className={`ml-auto h-4 w-4 shrink-0 transition-transform duration-300 ${
                isCreatorVerificationMenuOpen ? "rotate-90" : ""
              } ${isSidebarOpen ? "opacity-100" : "hidden opacity-0"}`}
            />
          </button>

          <div
            className={`grid transition-all duration-300 ease-in-out ${
              isCreatorVerificationMenuOpen
                ? "grid-rows-[1fr] opacity-100"
                : "grid-rows-[0fr] opacity-0"
            }`}
          >
            <div className="overflow-hidden">
              <div className="mt-1 space-y-1">
                {creatorVerificationNavItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = isHrefActive(
                    pathname,
                    currentHref,
                    item.href,
                  );

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      title={item.name}
                      className={`flex items-center rounded-lg py-2.5 text-sm font-medium transition-all duration-300 ${
                        isSidebarOpen
                          ? "justify-start gap-3 pl-12 pr-3"
                          : "justify-center px-0"
                      } ${
                        isActive
                          ? "bg-violet-50 text-violet-600"
                          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                      }`}
                    >
                      <Icon
                        className={`h-4 w-4 shrink-0 ${
                          isActive ? "text-violet-600" : "text-slate-400"
                        }`}
                      />
                      <span
                        className={`truncate whitespace-nowrap transition-all duration-200 ${
                          isSidebarOpen
                            ? "max-w-[150px] opacity-100"
                            : "max-w-0 overflow-hidden opacity-0"
                        }`}
                      >
                        {item.name}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div>
          <button
            type="button"
            onClick={() => setIsContentMenuOpen((open) => !open)}
            title="Quản lý Nội dung"
            aria-expanded={isContentMenuOpen}
            className={`flex w-full items-center rounded-lg py-3 text-sm font-medium transition-all duration-300 ${
              isSidebarOpen ? "justify-start gap-3 px-4" : "justify-center px-0"
            } ${
              isContentRouteActive
                ? "bg-violet-50 text-violet-600"
                : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            <Folder
              className={`h-5 w-5 shrink-0 ${
                isContentRouteActive ? "text-violet-600" : "text-slate-400"
              }`}
            />
            <span
              className={`truncate whitespace-nowrap transition-all duration-200 ${
                isSidebarOpen
                  ? "max-w-[170px] opacity-100"
                  : "max-w-0 overflow-hidden opacity-0"
              }`}
            >
              Quản lý Nội dung
            </span>
            <ChevronRight
              className={`ml-auto h-4 w-4 shrink-0 transition-transform duration-300 ${
                isContentMenuOpen ? "rotate-90" : ""
              } ${isSidebarOpen ? "opacity-100" : "hidden opacity-0"}`}
            />
          </button>

          <div
            className={`grid transition-all duration-300 ease-in-out ${
              isContentMenuOpen
                ? "grid-rows-[1fr] opacity-100"
                : "grid-rows-[0fr] opacity-0"
            }`}
          >
            <div className="overflow-hidden">
              <div className="mt-1 space-y-1">
                {contentNavItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = isRouteActive(pathname, item.href);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      title={item.name}
                      className={`flex items-center rounded-lg py-2.5 text-sm font-medium transition-all duration-300 ${
                        isSidebarOpen
                          ? "justify-start gap-3 pl-12 pr-3"
                          : "justify-center px-0"
                      } ${
                        isActive
                          ? "bg-violet-50 text-violet-600"
                          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                      }`}
                    >
                      <Icon
                        className={`h-4 w-4 shrink-0 ${
                          isActive ? "text-violet-600" : "text-slate-400"
                        }`}
                      />
                      <span
                        className={`truncate whitespace-nowrap transition-all duration-200 ${
                          isSidebarOpen
                            ? "max-w-[150px] opacity-100"
                            : "max-w-0 overflow-hidden opacity-0"
                        }`}
                      >
                        {item.name}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {navItems.slice(1).map((item) => (
          <AdminNavLink
            key={item.href}
            href={item.href}
            icon={item.icon}
            isSidebarOpen={isSidebarOpen}
            name={item.name}
            pathname={pathname}
          />
        ))}
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

        <div className="space-y-1 border-t border-slate-100 pt-4">
          <Link
            href="/"
            className={`flex w-full items-center rounded-lg py-2.5 text-sm font-medium text-slate-600 transition-all hover:bg-slate-100 hover:text-slate-900 ${
              isSidebarOpen ? "justify-start gap-3 px-4" : "justify-center px-0"
            }`}
            title="Về Trang Chủ"
          >
            <Home className="h-5 w-5 shrink-0 text-slate-400" />
            <span
              className={`truncate whitespace-nowrap transition-all duration-200 ${
                isSidebarOpen
                  ? "max-w-[120px] opacity-100"
                  : "max-w-0 overflow-hidden opacity-0"
              }`}
            >
              Về Trang Chủ
            </span>
          </Link>

          <button
            className={`flex w-full items-center rounded-lg py-2.5 text-sm font-medium text-slate-600 transition-all hover:bg-slate-100 hover:text-slate-900 ${
              isSidebarOpen ? "justify-start gap-3 px-4" : "justify-center px-0"
            }`}
            title="Hỗ Trợ"
          >
            <Settings className="h-5 w-5 shrink-0 text-slate-400" />
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
            className={`flex w-full items-center rounded-lg py-2.5 text-sm font-medium text-slate-600 transition-all hover:bg-red-50 hover:text-red-600 ${
              isSidebarOpen ? "justify-start gap-3 px-4" : "justify-center px-0"
            }`}
            title="Đăng xuất"
          >
            <LogOut className="h-5 w-5 shrink-0 text-slate-400" />
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
