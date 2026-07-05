"use client";

import { Bell, Coins, Menu, Search } from "lucide-react";
import { useAuthStore } from "@/features/auth/store/auth.store";

type CreatorDashboardTopbarProps = {
  onMenuClick: () => void;
  walletBalanceVnd?: number;
};

function formatVnd(value: number) {
  return `${new Intl.NumberFormat("vi-VN").format(value)} VNĐ`;
}

function getDisplayName(user: ReturnType<typeof useAuthStore.getState>["user"]) {
  if (!user) {
    return "Creator";
  }

  if ("fullName" in user && user.fullName) {
    return user.fullName;
  }

  if ("username" in user && user.username) {
    return user.username;
  }

  return user.accountId || "Creator";
}

function getAvatarUrl(user: ReturnType<typeof useAuthStore.getState>["user"]) {
  return user && "avatarUrl" in user ? user.avatarUrl : undefined;
}

export function CreatorDashboardTopbar({
  onMenuClick,
  walletBalanceVnd = 150000,
}: CreatorDashboardTopbarProps) {
  const user = useAuthStore((state) => state.user);
  const displayName = getDisplayName(user);
  const avatarUrl = getAvatarUrl(user);
  const initial = displayName.trim().charAt(0).toUpperCase() || "C";

  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-[#0A0A0A]/90 backdrop-blur-xl">
      <div className="grid min-h-20 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-4 sm:gap-4 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={onMenuClick}
          className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-zinc-100 transition hover:border-yellow-400/50 hover:text-yellow-400 lg:hidden"
          aria-label="Mở menu Creator Studio"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="hidden h-11 w-11 lg:block" aria-hidden="true" />

        <div className="min-w-0 w-full max-w-2xl justify-self-center">
          <label className="relative mx-auto block w-full max-w-2xl">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-500" />
            <input
              type="search"
              placeholder="Tìm kiếm series, tập truyện, chiến dịch..."
              className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.06] pl-12 pr-4 text-sm font-semibold text-zinc-100 outline-none transition placeholder:text-zinc-500 focus:border-yellow-400/60 focus:bg-white/[0.09] focus:ring-4 focus:ring-yellow-400/10"
            />
          </label>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <button
            type="button"
            className="relative flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-zinc-300 transition hover:border-yellow-400/50 hover:text-yellow-400"
            aria-label="Thông báo"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-yellow-400" />
          </button>

          <div className="hidden h-11 items-center gap-2 rounded-xl border border-yellow-400/20 bg-yellow-400/10 px-4 text-sm font-black text-yellow-300 md:flex">
            <Coins className="h-5 w-5" />
            {formatVnd(walletBalanceVnd)}
          </div>

          <button
            type="button"
            className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border border-yellow-400/40 bg-[#1A1A1A] text-sm font-black text-yellow-300 shadow-[0_0_24px_rgba(250,204,21,0.12)]"
            aria-label="Tài khoản creator"
            title={displayName}
          >
            {avatarUrl ? (
              <span
                aria-label={displayName}
                className="h-full w-full bg-cover bg-center"
                style={{ backgroundImage: `url("${avatarUrl}")` }}
              />
            ) : (
              initial
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
