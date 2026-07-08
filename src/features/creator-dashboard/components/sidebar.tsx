"use client";

import Link from "next/link";
import {
  BarChart3,
  BadgeDollarSign,
  Clapperboard,
  Home,
  LayoutDashboard,
  LineChart,
  Menu,
  Rocket,
  WalletCards,
  X,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/shared/utils/utils";
import type { CreatorDashboardLayoutView } from "@/features/creator-dashboard/components/creator-dashboard-layout";

type CreatorDashboardSidebarProps = {
  activeView: CreatorDashboardLayoutView;
  isCollapsed: boolean;
  mobileOpen: boolean;
  onClose: () => void;
  onNavigate: (view: CreatorDashboardLayoutView) => void;
  onToggleCollapse: () => void;
};

type SidebarItem = {
  label: string;
  view: CreatorDashboardLayoutView;
  icon: LucideIcon;
  activeViews?: CreatorDashboardLayoutView[];
};

const sidebarItems: SidebarItem[] = [
  {
    label: "Tổng quan",
    view: "dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Quản lý Series",
    view: "series",
    icon: Clapperboard,
    activeViews: ["series", "seasons", "episodes", "create", "comic", "video", "combos"],
  },
  {
    label: "Thống kê",
    view: "analytics",
    icon: BarChart3,
  },
  {
    label: "Doanh thu",
    view: "revenue",
    icon: WalletCards,
  },
  {
    label: "Kiếm tiền",
    view: "monetization",
    icon: BadgeDollarSign,
  },
  {
    label: "Tăng tương tác",
    view: "campaign",
    icon: Rocket,
  },
  {
    label: "Sản xuất",
    view: "production",
    icon: LineChart,
  },
];

function isItemActive(
  item: SidebarItem,
  activeView: CreatorDashboardLayoutView,
) {
  return item.activeViews?.includes(activeView) ?? item.view === activeView;
}

export function CreatorDashboardSidebar({
  activeView,
  isCollapsed,
  mobileOpen,
  onClose,
  onNavigate,
  onToggleCollapse,
}: CreatorDashboardSidebarProps) {
  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/70 backdrop-blur-sm transition lg:hidden",
          mobileOpen ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={onClose}
      />

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[284px] flex-col border-r border-white/10 bg-[#0F0F0F] px-4 py-5 shadow-2xl shadow-black/40 transition-all duration-300 lg:translate-x-0",
          isCollapsed && "lg:w-[88px]",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="mb-8 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onToggleCollapse}
            className={cn(
              "hidden h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-zinc-300 transition hover:border-yellow-400/50 hover:text-yellow-400 lg:flex",
            )}
            aria-label="Thu gọn/mở rộng Sidebar"
            title="Thu gọn/mở rộng Sidebar"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className={cn("flex min-w-0 items-center transition-all duration-300", isCollapsed && "lg:hidden")}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://res.cloudinary.com/dratbz8bh/image/upload/v1783173753/1-removebg-preview_xv2wde.png"
              alt="TaleX"
              className="h-10 w-auto origin-left scale-110 object-contain"
            />
            <span className="ml-2 truncate text-lg font-black tracking-tight text-zinc-50">
              Creator Studio
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-zinc-300 lg:hidden"
            aria-label="Đóng menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="space-y-2">
          {sidebarItems.map((item) => {
            const active = isItemActive(item, activeView);
            const Icon = item.icon;

            return (
              <Link
                key={item.view}
                href={`/creator-dashboard?view=${item.view}`}
                onClick={() => {
                  onNavigate(item.view);
                  onClose();
                }}
                title={isCollapsed ? item.label : undefined}
                className={cn(
                  "group relative flex h-12 items-center gap-3 rounded-xl px-4 text-sm font-black transition",
                  isCollapsed && "lg:justify-center lg:px-0",
                  active
                    ? "bg-yellow-400/10 text-yellow-300"
                    : "text-zinc-400 hover:bg-white/[0.05] hover:text-yellow-300",
                )}
              >
                <span
                  className={cn(
                    "absolute left-0 top-2 h-8 w-1 rounded-r-full bg-yellow-400 transition",
                    active ? "opacity-100" : "opacity-0",
                  )}
                />
                <Icon
                  className={cn(
                    "h-5 w-5 shrink-0 transition",
                    active ? "text-yellow-300" : "text-zinc-500 group-hover:text-yellow-300",
                  )}
                />
                <span className={cn("truncate", isCollapsed && "lg:hidden")}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>

        <Link
          href="/"
          title={isCollapsed ? "Trở về Trang chủ" : undefined}
          className={cn(
            "mt-auto flex h-12 items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-4 text-sm font-black text-zinc-300 transition hover:border-yellow-400/50 hover:text-yellow-400",
            isCollapsed && "lg:justify-center lg:px-0",
          )}
        >
          <Home className="h-5 w-5 shrink-0" />
          <span className={cn("truncate", isCollapsed && "lg:hidden")}>
            Trở về Trang chủ
          </span>
        </Link>
      </aside>
    </>
  );
}
