"use client";

import { useState, type ReactNode } from "react";
import { Plus } from "lucide-react";
import { CreatorDashboardSidebar } from "@/features/creator-dashboard/components/sidebar";
import { CreatorDashboardTopbar } from "@/features/creator-dashboard/components/topbar";

export type CreatorDashboardLayoutView =
  | "dashboard"
  | "series"
  | "seasons"
  | "episodes"
  | "create"
  | "comic"
  | "video"
  | "combos"
  | "analytics"
  | "revenue"
  | "campaign"
  | "production";

type CreatorDashboardLayoutProps = {
  activeView: CreatorDashboardLayoutView;
  title: string;
  description: string;
  children: ReactNode;
  primaryAction?: {
    label: string;
    onClick: () => void;
  };
  onNavigate: (view: CreatorDashboardLayoutView) => void;
};

export function CreatorDashboardLayout({
  activeView,
  title,
  description,
  children,
  primaryAction,
  onNavigate,
}: CreatorDashboardLayoutProps) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-zinc-100">
      <CreatorDashboardSidebar
        activeView={activeView}
        isCollapsed={isSidebarCollapsed}
        mobileOpen={mobileSidebarOpen}
        onClose={() => setMobileSidebarOpen(false)}
        onNavigate={onNavigate}
        onToggleCollapse={() => setIsSidebarCollapsed((collapsed) => !collapsed)}
      />

      <div
        className={`min-h-screen transition-all duration-300 ${
          isSidebarCollapsed ? "lg:pl-[88px]" : "lg:pl-[284px]"
        }`}
      >
        <CreatorDashboardTopbar onMenuClick={() => setMobileSidebarOpen(true)} />

        <main className="px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-6">
            <header className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-[#121212] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.28)] md:flex-row md:items-end md:justify-between">
              <div>
                <p className="mb-2 text-xs font-black uppercase tracking-[0.2em] text-yellow-400">
                  Creator Dashboard
                </p>
                <h1 className="text-3xl font-black tracking-tight text-zinc-50 md:text-5xl">
                  {title}
                </h1>
                <p className="mt-3 max-w-3xl text-sm font-semibold leading-6 text-zinc-400 md:text-base">
                  {description}
                </p>
              </div>

              {primaryAction && (
                <button
                  type="button"
                  onClick={primaryAction.onClick}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-yellow-400 px-5 text-sm font-black text-black shadow-[0_18px_46px_rgba(250,204,21,0.18)] transition hover:bg-yellow-300"
                >
                  <Plus className="h-5 w-5" />
                  {primaryAction.label}
                </button>
              )}
            </header>

            <div className="min-w-0">{children}</div>
          </div>
        </main>
      </div>
    </div>
  );
}
