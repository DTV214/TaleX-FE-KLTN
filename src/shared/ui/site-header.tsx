"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  Bell,
  ChevronDown,
  Clapperboard,
  CircleDollarSign,
  Crown,
  History,
  Layers3,
  LayoutDashboard,
  LogOut,
  Menu,
  Search,
  User as UserIcon,
} from "lucide-react";
import { DropdownMenu } from "radix-ui";
import { logoutAction } from "@/features/auth/api/auth.actions";
import { isFullProfile, useAuthStore } from "@/features/auth/store/auth.store";
import { CoinWalletWidget } from "@/features/coin";
import { useMissionHeartbeat } from "@/features/mission/hooks/useMissionHeartbeat";
import { useActiveSubscription } from "@/features/payment/api/payment.api";
import { usePublicSidebarStore } from "@/shared/stores/public-sidebar.store";

export function SiteHeader() {
  useMissionHeartbeat();

  const [isTransactionHistoryOpen, setIsTransactionHistoryOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const toggleSidebar = usePublicSidebarStore((state) => state.toggleSidebar);
  const { user, isAuthenticated, clearAuth } = useAuthStore();
  const activeSubscriptionQuery = useActiveSubscription(isAuthenticated);
  const profileUser = isFullProfile(user) ? user : null;
  const isPremiumMember = Boolean(activeSubscriptionQuery.data);
  const avatarLabel =
    profileUser?.username.slice(0, 2) || user?.roleName.slice(0, 2) || "TX";
  const isAdminRole = user?.roleName === "ADMIN" || user?.roleName === "STAFF";
  const workspaceMenu = {
    href: isAdminRole ? "/admin/dashboard" : "/creator-dashboard",
    label: isAdminRole ? "Trang Quản Trị" : "Creator Studio",
    icon: isAdminRole ? LayoutDashboard : Clapperboard,
  };
  const WorkspaceIcon = workspaceMenu.icon;

  const isAuthOrAdminPage =
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/forgot-password" ||
    pathname.startsWith("/complete-profile") ||
    pathname.startsWith("/creator-dashboard") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/staff");

  if (isAuthOrAdminPage) {
    return null;
  }

  const handleLogout = async () => {
    await logoutAction();
    clearAuth();
    router.push("/login");
    router.refresh();
  };

  return (
    <header className="fixed left-0 top-0 z-50 h-16 w-full border-b border-white/10 bg-black/95 backdrop-blur">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_0%,rgba(212,175,55,0.10),transparent_36%),radial-gradient(circle_at_70%_0%,rgba(255,255,255,0.06),transparent_30%)]" />

      <div className="flex h-16 items-center justify-between gap-4 px-4 md:px-6">
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={toggleSidebar}
            aria-label="Thu gọn hoặc mở rộng sidebar"
            title="Thu gọn hoặc mở rộng sidebar"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-foreground/85 transition hover:bg-white/10 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
          >
            <Menu className="h-6 w-6" />
          </button>

          <Link
            href="/"
            aria-label="Trang chủ TaleX"
            className="group flex min-w-fit items-center gap-2 outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://res.cloudinary.com/dratbz8bh/image/upload/v1783173753/1-removebg-preview_xv2wde.png"
              alt="TaleX Logo"
              className="h-9 w-auto object-contain"
            />
            <span className="font-heading text-xl font-bold tracking-tight text-white transition-colors group-hover:text-primary">
              TaleX
            </span>
          </Link>
        </div>

        <div className="mx-auto hidden min-w-[260px] max-w-xl flex-1 items-center lg:flex">
          <label className="group relative w-full">
            <span className="sr-only">Tìm kiếm truyện, phim</span>
            <Search className="absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
            <input
              type="search"
              placeholder="Tìm kiếm truyện, phim..."
              className="h-12 w-full rounded-2xl border border-white/10 bg-[#14151b]/85 px-14 text-base text-foreground outline-none shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition-all placeholder:text-muted-foreground/75 focus:border-primary/50 focus:bg-black/50 focus:shadow-[0_0_28px_rgba(212,175,55,0.12)]"
            />
          </label>
        </div>

        <div className="flex items-center gap-2 md:gap-3">
          <Link
            href="/premium"
            className={`hidden h-10 items-center justify-center gap-2 rounded-xl border border-[#D4AF37]/50 bg-[#D4AF37]/10 px-4 text-xs font-semibold text-[#D4AF37] transition-all hover:bg-[#D4AF37] hover:text-black hover:shadow-[0_0_15px_rgba(212,175,55,0.4)] ${isPremiumMember ? "md:hidden" : "md:flex"}`}
          >
            <Crown className="h-4 w-4" />
            Nâng cấp
          </Link>

          <button
            type="button"
            aria-label="Thông báo"
            title="Thông báo"
            className="hidden h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-foreground/75 transition hover:border-primary/40 hover:bg-white/[0.08] hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 md:flex"
          >
            <Bell className="h-4 w-4" />
          </button>

          <button
            type="button"
            aria-label="Tìm kiếm"
            title="Tìm kiếm"
            className="flex h-10 w-10 items-center justify-center rounded-full text-foreground/80 transition hover:text-primary lg:hidden"
          >
            <Search className="h-5 w-5" />
          </button>

          {isAuthenticated && user ? (
            <>
              <CoinWalletWidget />

              <DropdownMenu.Root
                onOpenChange={(open) => {
                  if (!open) {
                    setIsTransactionHistoryOpen(false);
                  }
                }}
              >
                <DropdownMenu.Trigger asChild>
                  <button className="relative flex h-10 w-10 items-center justify-center overflow-visible rounded-full border border-primary/35 bg-primary/10 text-primary transition hover:border-primary hover:shadow-[0_0_26px_rgba(212,175,55,0.24)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70">
                    {isPremiumMember && (
                      <span className="absolute -right-1 -top-1 z-10 flex h-5 w-5 items-center justify-center rounded-full border border-black bg-[#D4AF37] text-black shadow-[0_0_18px_rgba(212,175,55,0.45)]">
                        <Crown className="h-3 w-3" />
                      </span>
                    )}
                    {profileUser?.avatarUrl ? (
                      <span
                        className="h-full w-full overflow-hidden rounded-full bg-cover bg-center"
                        style={{
                          backgroundImage: `url(${profileUser.avatarUrl})`,
                        }}
                      />
                    ) : (
                      <span className="font-heading text-xs font-extrabold uppercase">
                        {avatarLabel}
                      </span>
                    )}
                  </button>
                </DropdownMenu.Trigger>

                <DropdownMenu.Portal>
                  <DropdownMenu.Content
                    align="end"
                    sideOffset={10}
                    className="z-50 w-56 rounded-xl border border-white/10 bg-[#121214] p-2 text-gray-300 shadow-2xl shadow-black/40 outline-none data-[side=bottom]:animate-in data-[side=bottom]:fade-in data-[side=bottom]:slide-in-from-top-2"
                  >
                    <div className="mb-1 border-b border-white/10 px-3 py-2">
                      <p className="truncate text-sm font-bold text-white">
                        {profileUser?.fullName || "TaleX Viewer"}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-gray-500">
                        {profileUser
                          ? `@${profileUser.username}`
                          : user.roleName}
                      </p>
                      {user?.roleName !== "ADMIN" && user?.roleName !== "STAFF" && (
                        <DropdownMenu.Item
                          onSelect={() => router.push("/creator-channel")}
                          className="mt-2 block text-left text-xs font-bold text-[#D4AF37] hover:underline cursor-pointer outline-none select-none"
                        >
                          Xem kênh của tôi
                        </DropdownMenu.Item>
                      )}
                    </div>

                    <DropdownMenu.Item
                      onSelect={() => router.push(workspaceMenu.href)}
                      className="flex cursor-pointer select-none items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium outline-none transition-colors hover:bg-white/5 hover:text-primary focus:bg-white/5 focus:text-primary"
                    >
                      <WorkspaceIcon className="h-4 w-4" />
                      {workspaceMenu.label}
                    </DropdownMenu.Item>

                    <DropdownMenu.Item asChild>
                      <Link
                        href="/profile"
                        className="flex cursor-pointer select-none items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium outline-none transition-colors hover:bg-white/5 hover:text-primary focus:bg-white/5 focus:text-primary"
                      >
                        <UserIcon className="h-4 w-4" />
                        Hồ sơ cá nhân
                      </Link>
                    </DropdownMenu.Item>

                    <DropdownMenu.Item
                      onSelect={(event) => {
                        event.preventDefault();
                        setIsTransactionHistoryOpen((current) => !current);
                      }}
                      className="flex cursor-pointer select-none items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium outline-none transition-colors hover:bg-white/5 hover:text-primary focus:bg-white/5 focus:text-primary"
                    >
                        <History className="h-4 w-4" />
                        <span className="flex-1">Lịch sử giao dịch</span>
                        <ChevronDown
                          className={`h-4 w-4 text-gray-500 transition ${isTransactionHistoryOpen ? "rotate-180 text-primary" : ""}`}
                        />
                    </DropdownMenu.Item>

                    {isTransactionHistoryOpen && (
                      <div className="mx-1 mb-1 mt-1 rounded-xl border border-white/10 bg-black/20 p-1">
                          <DropdownMenu.Item asChild>
                            <Link
                              href="/premium-history"
                              className="flex cursor-pointer select-none items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium outline-none transition-colors hover:bg-white/5 hover:text-primary focus:bg-white/5 focus:text-primary"
                            >
                              <Crown className="h-4 w-4 text-[#D4AF37]" />
                              Premium
                            </Link>
                          </DropdownMenu.Item>

                          <DropdownMenu.Item asChild>
                            <Link
                              href="/coin-history"
                              className="flex cursor-pointer select-none items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium outline-none transition-colors hover:bg-white/5 hover:text-primary focus:bg-white/5 focus:text-primary"
                            >
                              <CircleDollarSign className="h-4 w-4 text-cyan-200" />
                              Coins
                            </Link>
                          </DropdownMenu.Item>

                          <DropdownMenu.Item
                            disabled
                            className="flex select-none items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-500 outline-none"
                          >
                            <Layers3 className="h-4 w-4" />
                            Gói combo
                          </DropdownMenu.Item>
                      </div>
                    )}

                    <DropdownMenu.Separator className="my-1 h-px bg-white/10" />

                    <DropdownMenu.Item
                      onSelect={(event) => {
                        event.preventDefault();
                        void handleLogout();
                      }}
                      className="flex cursor-pointer select-none items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-[#E50914] outline-none transition-colors hover:bg-[#E50914]/10 focus:bg-[#E50914]/10"
                    >
                      <LogOut className="h-4 w-4" />
                      Đăng xuất
                    </DropdownMenu.Item>
                  </DropdownMenu.Content>
                </DropdownMenu.Portal>
              </DropdownMenu.Root>
            </>
          ) : (
            <Link
              href="/login"
              className="flex h-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.05] px-4 text-xs font-bold text-gray-300 transition-all hover:border-[#D4AF37]/40 hover:bg-white/10 hover:text-[#D4AF37] md:px-6 md:text-sm"
            >
              Đăng nhập
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
