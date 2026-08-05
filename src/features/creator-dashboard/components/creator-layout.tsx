import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Film,
  BarChart2,
  BadgeDollarSign,
  DollarSign,
  Settings,
  Search,
  User,
  LogOut,
  Clapperboard,
  Tag,
  Zap,
  Megaphone,
  Home,
  Tv,
} from "lucide-react";
import { DropdownMenu } from "radix-ui";
import { logoutAction } from "@/features/auth/api/auth.actions";
import { isFullProfile, useAuthStore } from "@/features/auth/store/auth.store";
import { NotificationBell } from "@/features/creator-dashboard/components/notification-bell";

interface CreatorLayoutProps {
  children: React.ReactNode;
  activeView?: string;
  onNavigate?: (view: string) => void;
}

export function CreatorLayout({
  children,
  activeView,
  onNavigate,
}: CreatorLayoutProps) {
  const router = useRouter();
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const user = useAuthStore((state) => state.user);
  const profileUser = isFullProfile(user) ? user : null;
  const displayName = profileUser?.username || user?.accountId || "Creator";

  const navItems = [
    { label: "Tổng quan", view: "dashboard", icon: LayoutDashboard },
    { label: "Tác phẩm của tôi", view: "series", icon: Film },
    { label: "Thống kê", view: "analytics", icon: BarChart2 },
    { label: "Doanh thu", view: "revenue", icon: DollarSign },
    { label: "Kiếm tiền", view: "monetization", icon: BadgeDollarSign },
    { label: "Quản lý sản xuất", view: "production", icon: Clapperboard },
    { label: "Quản lý Combo", view: "combos", icon: Tag },
    { label: "Tăng tương tác", view: "campaign", icon: Zap },
    { label: "Chiến dịch", view: "campaigns", icon: Megaphone },
  ];

  const handleLogout = async () => {
    await logoutAction();
    clearAuth();
    router.push("/login");
    router.refresh();
  };

  return (
    <div className="creator-studio-shell flex h-screen overflow-hidden font-sans text-creator-text">
      {/* Sidebar */}
      <aside className="relative z-20 flex w-64 flex-shrink-0 flex-col border-r border-white/10 bg-black/80 shadow-[18px_0_60px_rgba(0,0,0,0.28)] backdrop-blur-2xl">
        <div className="flex h-16 items-center border-b border-white/10 px-6">
          <span className="creator-spotlight-text text-xl font-bold tracking-wider text-creator-gold">
            TaleX <span className="text-white">Studio</span>
          </span>
        </div>

        <div className="creator-soft-scrollbar flex-1 overflow-y-auto p-4 pr-3">
          <div className="space-y-1">
            {navItems.map((item) => {
              // Basic active state logic
              const isActive =
                activeView === item.view ||
                (item.view === "series" && activeView === "create");

              return (
                <button
                  key={item.label}
                  onClick={() => {
                    if (item.view && onNavigate) {
                      onNavigate(item.view);
                    }
                  }}
                  className={`group flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left transition-colors ${
                    isActive
                      ? "border border-creator-gold/20 bg-creator-gold/15 text-creator-gold shadow-[0_10px_30px_rgba(226,177,60,0.08)]"
                      : "text-creator-muted hover:bg-white/[0.055] hover:text-white"
                  }`}
                >
                  <item.icon
                    size={18}
                    className={
                      isActive
                        ? "text-creator-gold"
                        : "text-creator-muted transition-colors group-hover:text-creator-gold"
                    }
                  />
                  <span className="text-sm font-semibold">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="border-t border-white/10 p-4">
          <Link
            href="/"
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-creator-muted transition-colors hover:bg-white/[0.055] hover:text-white"
          >
            <Home size={18} />
            Về Trang Chủ
          </Link>
          <button className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-creator-muted transition-colors hover:bg-white/[0.055] hover:text-white">
            <Settings size={18} />
            Cài đặt
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className="mt-1 flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-creator-muted transition-colors hover:bg-red-500/10 hover:text-red-300"
          >
            <LogOut size={18} />
            Đăng xuất
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="relative z-10 flex flex-1 flex-col overflow-hidden">
        {/* Topbar */}
        <header className="sticky top-0 z-10 flex h-16 flex-shrink-0 items-center justify-between border-b border-white/10 bg-black/45 px-8 backdrop-blur-2xl">
          <div className="relative flex w-full max-w-md items-center">
            <Search className="absolute left-3 text-creator-muted" size={18} />
            <input
              type="text"
              placeholder="Tìm kiếm trong studio..."
              className="w-full rounded-full border border-white/10 bg-white/[0.045] py-2 pl-10 pr-4 text-sm text-white outline-none transition-colors placeholder:text-creator-muted focus:border-creator-gold/70 focus:bg-black/35"
            />
          </div>

          <div className="flex items-center gap-6">
            <NotificationBell />
            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild>
                <button type="button" className="flex cursor-pointer items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.035] px-3 py-2 text-left outline-none transition-colors hover:border-creator-gold/35 hover:bg-white/[0.06]">
                  <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-creator-gold/20 text-creator-gold ring-1 ring-creator-gold/25">
                    {profileUser?.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={profileUser.avatarUrl}
                        alt="Avatar"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User size={16} />
                    )}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{displayName}</span>
                    <span className="text-xs text-creator-muted">
                      Nhà xuất bản Pro
                    </span>
                  </div>
                </button>
              </DropdownMenu.Trigger>

              <DropdownMenu.Portal>
                <DropdownMenu.Content
                  align="end"
                  sideOffset={10}
                  className="z-50 w-48 rounded-xl border border-white/10 bg-[#161619] p-2 text-zinc-300 shadow-2xl outline-none data-[side=bottom]:animate-in data-[side=bottom]:fade-in data-[side=bottom]:slide-in-from-top-2"
                >
                  <DropdownMenu.Item
                    onSelect={() => router.push("/creator-channel")}
                    className="flex cursor-pointer select-none items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium outline-none transition-colors hover:bg-white/5 hover:text-creator-gold focus:bg-white/5 focus:text-creator-gold"
                  >
                    <Tv size={16} className="text-creator-muted" />
                    Xem kênh của bạn
                  </DropdownMenu.Item>

                  <DropdownMenu.Separator className="my-1 h-px bg-white/10" />

                  <DropdownMenu.Item
                    onSelect={handleLogout}
                    className="flex cursor-pointer select-none items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-red-500 outline-none transition-colors hover:bg-red-500/10 focus:bg-red-500/10"
                  >
                    <LogOut size={16} />
                    Đăng xuất
                  </DropdownMenu.Item>
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>
          </div>
        </header>

        {/* Page Content */}
        <main className="creator-soft-scrollbar flex-1 overflow-y-auto bg-transparent">
          <div className="relative z-10 mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
