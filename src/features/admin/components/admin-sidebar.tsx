"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Fragment, useState } from "react";
import { create } from "zustand";
import { logoutAction } from "@/features/auth/api/auth.actions";
import { useAuthStore } from "@/features/auth/store/auth.store";
import {
  AlertTriangle,
  Ban,
  ChevronRight,
  CircleDollarSign,
  Clapperboard,
  CreditCard,
  FileQuestion,
  FileText,
  Flag,
  Folder,
  Grid3X3,
  Home,
  Image as ImageIcon,
  Languages,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Percent,
  Receipt,
  Scan,
  Settings,
  ShieldAlert,
  ShieldCheck,
  SlidersHorizontal,
  Tag,
  Target,
  TrendingUp,
  Tv,
  UserCheck,
  Users,
} from "lucide-react";

type AdminSidebarState = {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
};

type AdminIcon = typeof LayoutDashboard;

type NavItem = {
  name: string;
  href: string;
  icon: AdminIcon;
};

export const useAdminSidebarStore = create<AdminSidebarState>((set) => ({
  isSidebarOpen: true,
  toggleSidebar: () =>
    set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
}));

const contentNavItems: NavItem[] = [
  { name: "Danh sách Series", href: "/admin/series", icon: Clapperboard },
  { name: "Thể loại", href: "/admin/categories", icon: Grid3X3 },
  { name: "Thẻ", href: "/admin/tags", icon: Tag },
  { name: "Kiểm duyệt", href: "/admin/moderation", icon: ShieldAlert },
  { name: "Nhãn kiểm duyệt", href: "/admin/violation-labels", icon: Languages },
  { name: "Cảnh báo nội dung", href: "/admin/content-warnings", icon: AlertTriangle },
  { name: "Xu hướng", href: "/admin/trending", icon: TrendingUp },
  { name: "Báo cáo", href: "/admin/reports", icon: Flag },
  { name: "Hình phạt", href: "/admin/penalties", icon: Ban },
  { name: "Khiếu nại", href: "/admin/appeals", icon: FileQuestion },
  { name: "Quản lý Kênh", href: "/admin/channels", icon: Tv },
];

const creatorNavItems: NavItem[] = [
  { name: "Người sáng tạo", href: "/admin/creators", icon: Users },
  { name: "Cấp Creator", href: "/admin/creator-tiers", icon: ShieldCheck },
  {
    name: "Creator Config",
    href: "/admin/creator-config",
    icon: SlidersHorizontal,
  },
];

const creatorVerificationNavItems: NavItem[] = [
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

const financialNavItems: NavItem[] = [
  { name: "Quyết toán Creator", href: "/admin/financials", icon: CircleDollarSign },
  { name: "Tax & Settlement", href: "/admin/tax-summary", icon: Receipt },
  { name: "Cấu hình Thuế", href: "/admin/tax-config", icon: Percent },
];

const interactionNavItems: NavItem[] = [
  {
    name: "Dịch vụ tương tác",
    href: "/admin/engagement-services",
    icon: Megaphone,
  },
  { name: "Chiến dịch", href: "/admin/campaigns", icon: ImageIcon },
];

const navItems: NavItem[] = [
  { name: "Bảng Điều Khiển", href: "/admin/dashboard", icon: LayoutDashboard },
  { name: "Người Dùng", href: "/admin/users", icon: Users },
  {
    name: "Gói Premium",
    href: "/admin/subscriptions",
    icon: CreditCard,
  },
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
  { name: "Quảng cáo Direct", href: "/admin/ads", icon: Megaphone },
  { name: "Điều Khoản", href: "/admin/terms", icon: FileText },
  { name: "Quét Bản Quyền", href: "/admin/copyright-check", icon: Scan },
  { name: "Cài Đặt", href: "/admin/settings", icon: Settings },
];

const sidebarScrollbarClass =
  "[scrollbar-gutter:stable] [scrollbar-width:thin] [scrollbar-color:rgba(148,163,184,0.55)_transparent] backoffice-dark:[scrollbar-color:transparent_transparent] backoffice-dark:hover:[scrollbar-color:rgba(212,175,55,0.38)_transparent] backoffice-dark:focus-within:[scrollbar-color:rgba(212,175,55,0.38)_transparent] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:border-2 [&::-webkit-scrollbar-thumb]:border-transparent [&::-webkit-scrollbar-thumb]:bg-slate-400/55 [&::-webkit-scrollbar-thumb]:bg-clip-content hover:[&::-webkit-scrollbar-thumb]:bg-slate-500/60 focus-within:[&::-webkit-scrollbar-thumb]:bg-slate-500/60 backoffice-dark:[&::-webkit-scrollbar-thumb]:bg-transparent backoffice-dark:hover:[&::-webkit-scrollbar-thumb]:bg-white/30 backoffice-dark:focus-within:[&::-webkit-scrollbar-thumb]:bg-white/30 [&::-webkit-scrollbar-button]:hidden";

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
  icon: AdminIcon;
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
          ? "bg-violet-50 text-violet-600 backoffice-dark:bg-white/10 backoffice-dark:text-white font-semibold"
          : "text-slate-700 hover:bg-slate-100 hover:text-slate-900 backoffice-dark:text-white/70 backoffice-dark:hover:bg-white/5 backoffice-dark:hover:text-white"
      }`}
    >
      <Icon
        className={`h-5 w-5 shrink-0 ${
          isActive ? "text-violet-600 backoffice-dark:text-violet-400" : "text-slate-400 backoffice-dark:text-white/40"
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

function AdminNavGroup({
  currentHref,
  icon: Icon,
  isOpen,
  isRouteGroup,
  isSidebarOpen,
  items,
  label,
  pathname,
  setIsOpen,
}: {
  currentHref: string;
  icon: AdminIcon;
  isOpen: boolean;
  isRouteGroup?: boolean;
  isSidebarOpen: boolean;
  items: NavItem[];
  label: string;
  pathname: string;
  setIsOpen: (updater: (open: boolean) => boolean) => void;
}) {
  const isActive = items.some((item) =>
    isRouteGroup
      ? isRouteActive(pathname, item.href)
      : isHrefActive(pathname, currentHref, item.href),
  );

  return (
    <div>
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        title={label}
        aria-expanded={isOpen}
        className={`flex w-full items-center rounded-lg py-3 text-sm font-medium transition-all duration-300 cursor-pointer ${
          isSidebarOpen ? "justify-start gap-3 px-4" : "justify-center px-0"
        } ${
          isActive
            ? "bg-violet-50 text-violet-600 backoffice-dark:bg-white/10 backoffice-dark:text-white font-semibold"
            : "text-slate-700 hover:bg-slate-100 hover:text-slate-900 backoffice-dark:text-white/70 backoffice-dark:hover:bg-white/5 backoffice-dark:hover:text-white"
        }`}
      >
        <Icon
          className={`h-5 w-5 shrink-0 ${
            isActive ? "text-violet-600 backoffice-dark:text-violet-400" : "text-slate-400 backoffice-dark:text-white/40"
          }`}
        />
        <span
          className={`truncate whitespace-nowrap transition-all duration-200 ${
            isSidebarOpen
              ? "max-w-[170px] opacity-100"
              : "max-w-0 overflow-hidden opacity-0"
          }`}
        >
          {label}
        </span>
        <ChevronRight
          className={`ml-auto h-4 w-4 shrink-0 transition-transform duration-300 ${
            isOpen ? "rotate-90" : ""
          } ${isSidebarOpen ? "opacity-100" : "hidden opacity-0"}`}
        />
      </button>

      <div
        className={`grid transition-all duration-300 ease-in-out ${
          isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <div className="mt-1 space-y-1">
            {items.map((item) => {
              const ItemIcon = item.icon;
              const itemActive = isRouteGroup
                ? isRouteActive(pathname, item.href)
                : isHrefActive(pathname, currentHref, item.href);

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
                    itemActive
                      ? "bg-violet-50 text-violet-600 backoffice-dark:bg-white/10 backoffice-dark:text-white font-semibold"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 backoffice-dark:text-white/60 backoffice-dark:hover:bg-white/5 backoffice-dark:hover:text-white"
                  }`}
                >
                  <ItemIcon
                    className={`h-4 w-4 shrink-0 ${
                      itemActive ? "text-violet-600 backoffice-dark:text-violet-400" : "text-slate-400 backoffice-dark:text-white/40"
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
  const isCreatorRouteActive = creatorNavItems.some((item) =>
    isRouteActive(pathname, item.href),
  );
  const isCreatorVerificationRouteActive = creatorVerificationNavItems.some(
    (item) => isHrefActive(pathname, currentHref, item.href),
  );
  const isFinancialRouteActive = financialNavItems.some((item) =>
    isRouteActive(pathname, item.href),
  );
  const isInteractionRouteActive = interactionNavItems.some((item) =>
    isRouteActive(pathname, item.href),
  );
  const [isContentMenuOpen, setIsContentMenuOpen] =
    useState(isContentRouteActive);
  const [isCreatorMenuOpen, setIsCreatorMenuOpen] =
    useState(isCreatorRouteActive);
  const [isCreatorVerificationMenuOpen, setIsCreatorVerificationMenuOpen] =
    useState(isCreatorVerificationRouteActive);
  const [isFinancialMenuOpen, setIsFinancialMenuOpen] =
    useState(isFinancialRouteActive);
  const [isInteractionMenuOpen, setIsInteractionMenuOpen] = useState(
    isInteractionRouteActive,
  );

  const handleLogout = async () => {
    await logoutAction();
    clearAuth();
    router.push("/login");
    router.refresh();
  };

  return (
    <aside
      className={`hidden h-[calc(100vh-64px)] flex-shrink-0 flex-col overflow-x-hidden overflow-y-auto border-r border-slate-100 bg-white py-4 transition-all duration-300 ease-in-out lg:flex backoffice-dark:border-white/10 backoffice-dark:bg-transparent ${sidebarScrollbarClass} ${
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

        <AdminNavGroup
          currentHref={currentHref}
          icon={UserCheck}
          isOpen={isCreatorVerificationMenuOpen}
          isSidebarOpen={isSidebarOpen}
          items={creatorVerificationNavItems}
          label="Kiểm duyệt"
          pathname={pathname}
          setIsOpen={setIsCreatorVerificationMenuOpen}
        />

        <AdminNavGroup
          currentHref={currentHref}
          icon={Folder}
          isOpen={isContentMenuOpen}
          isRouteGroup
          isSidebarOpen={isSidebarOpen}
          items={contentNavItems}
          label="Nội dung"
          pathname={pathname}
          setIsOpen={setIsContentMenuOpen}
        />

        <AdminNavGroup
          currentHref={currentHref}
          icon={Users}
          isOpen={isCreatorMenuOpen}
          isRouteGroup
          isSidebarOpen={isSidebarOpen}
          items={creatorNavItems}
          label="Creator"
          pathname={pathname}
          setIsOpen={setIsCreatorMenuOpen}
        />

        {navItems.slice(1).map((item) => (
          <Fragment key={item.href}>
            <AdminNavLink
              href={item.href}
              icon={item.icon}
              isSidebarOpen={isSidebarOpen}
              name={item.name}
              pathname={pathname}
            />

            {item.href === "/admin/subscriptions" && (
              <AdminNavGroup
                currentHref={currentHref}
                icon={CircleDollarSign}
                isOpen={isFinancialMenuOpen}
                isRouteGroup
                isSidebarOpen={isSidebarOpen}
                items={financialNavItems}
                label="Tài chính"
                pathname={pathname}
                setIsOpen={setIsFinancialMenuOpen}
              />
            )}

            {item.href === "/admin/mission-management" && (
              <AdminNavGroup
                currentHref={currentHref}
                icon={Megaphone}
                isOpen={isInteractionMenuOpen}
                isRouteGroup
                isSidebarOpen={isSidebarOpen}
                items={interactionNavItems}
                label="Tương tác"
                pathname={pathname}
                setIsOpen={setIsInteractionMenuOpen}
              />
            )}
          </Fragment>
        ))}
      </nav>

      <div className="mt-auto flex flex-col gap-4">
        <div className="space-y-1 border-t border-slate-100 pt-4 backoffice-dark:border-white/10">
          <Link
            href="/"
            className={`flex w-full items-center rounded-lg py-2.5 text-sm font-medium text-slate-600 transition-all hover:bg-slate-100 hover:text-slate-900 backoffice-dark:text-white/70 backoffice-dark:hover:bg-white/5 backoffice-dark:hover:text-white ${
              isSidebarOpen ? "justify-start gap-3 px-4" : "justify-center px-0"
            }`}
            title="Về Trang Chủ"
          >
            <Home className="h-5 w-5 shrink-0 text-slate-400 backoffice-dark:text-white/40" />
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

          <Link
            href="/admin/support"
            className={`flex w-full items-center rounded-lg py-2.5 text-sm font-medium text-slate-600 transition-all hover:bg-slate-100 hover:text-slate-900 backoffice-dark:text-white/70 backoffice-dark:hover:bg-white/5 backoffice-dark:hover:text-white ${
              isSidebarOpen ? "justify-start gap-3 px-4" : "justify-center px-0"
            }`}
            title="Hỗ Trợ"
          >
            <Settings className="h-5 w-5 shrink-0 text-slate-400 backoffice-dark:text-white/40" />
            <span
              className={`truncate whitespace-nowrap transition-all duration-200 ${
                isSidebarOpen
                  ? "max-w-[120px] opacity-100"
                  : "max-w-0 overflow-hidden opacity-0"
              }`}
            >
              Hỗ Trợ
            </span>
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className={`flex w-full items-center rounded-lg py-2.5 text-sm font-medium text-slate-600 transition-all hover:bg-red-50 hover:text-red-600 backoffice-dark:text-white/70 backoffice-dark:hover:bg-red-500/10 backoffice-dark:hover:text-red-400 cursor-pointer ${
              isSidebarOpen ? "justify-start gap-3 px-4" : "justify-center px-0"
            }`}
            title="Đăng xuất"
          >
            <LogOut className="h-5 w-5 shrink-0 text-slate-400 backoffice-dark:text-white/40" />
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
