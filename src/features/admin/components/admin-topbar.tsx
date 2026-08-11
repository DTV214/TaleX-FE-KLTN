"use client";

import Link from "next/link";
import { Bell, HelpCircle, Menu, Moon, Sun } from "lucide-react";
import { isFullProfile, useAuthStore } from "@/features/auth/store/auth.store";
import { useBackofficeTheme } from "@/shared/ui/backoffice-theme-provider";
import { useAdminSidebarStore } from "./admin-sidebar";

function getAdminDisplayName(
  user: ReturnType<typeof useAuthStore.getState>["user"],
) {
  if (!user) return "Admin";
  if (isFullProfile(user)) {
    return user.fullName || user.username || user.email || "Admin";
  }
  return user.roleName || "Admin";
}

function getAdminAvatarUrl(
  user: ReturnType<typeof useAuthStore.getState>["user"],
) {
  return isFullProfile(user) ? user.avatarUrl : undefined;
}

function getAdminInitials(
  user: ReturnType<typeof useAuthStore.getState>["user"],
) {
  const label = getAdminDisplayName(user);
  return (
    label
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "AD"
  );
}

export function AdminTopbar() {
  const toggleSidebar = useAdminSidebarStore((state) => state.toggleSidebar);
  const { isDark, toggleTheme } = useBackofficeTheme();
  const user = useAuthStore((state) => state.user);
  const displayName = getAdminDisplayName(user);
  const avatarUrl = getAdminAvatarUrl(user);
  const initials = getAdminInitials(user);

  return (
    <header className="sticky top-0 z-50 flex h-16 w-full items-center justify-between border-b border-gray-100 bg-white px-4 backoffice-dark:border-white/10 backoffice-dark:bg-[#0d0d0f]/95 backoffice-dark:backdrop-blur-xl md:px-8">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={toggleSidebar}
          aria-label="Mo hoac thu gon sidebar admin"
          title="Mo hoac thu gon sidebar admin"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-gray-600 transition hover:bg-gray-100 hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/30 backoffice-dark:text-white/70 backoffice-dark:hover:bg-white/10 backoffice-dark:hover:text-white backoffice-dark:focus-visible:ring-[var(--backoffice-primary)]/40"
        >
          <Menu className="h-6 w-6" />
        </button>

        <Link
          href="/admin/dashboard"
          className="group flex min-w-fit items-center rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-violet-500/30 backoffice-dark:focus-visible:ring-[var(--backoffice-primary)]/40"
          aria-label="TaleX Admin Dashboard"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://res.cloudinary.com/dratbz8bh/image/upload/v1783173753/1-removebg-preview_xv2wde.png"
            alt="TaleX Admin Logo"
            className="h-12 w-auto max-w-[160px] object-contain"
          />
        </Link>
      </div>

      <div className="ml-auto flex items-center gap-3 md:gap-4">
        <button
          type="button"
          onClick={toggleTheme}
          aria-label={isDark ? "Chuyen sang giao dien sang" : "Chuyen sang giao dien toi"}
          title={isDark ? "Chuyen sang giao dien sang" : "Chuyen sang giao dien toi"}
          className="backoffice-theme-toggle inline-flex h-9 items-center justify-center gap-2 rounded-full border px-3 text-xs font-black transition active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]/35"
        >
          <span className="backoffice-theme-toggle-icon inline-flex h-5 w-5 items-center justify-center rounded-full">
            {isDark ? (
              <Sun className="h-3.5 w-3.5" />
            ) : (
              <Moon className="h-3.5 w-3.5" />
            )}
          </span>
          <span className="hidden sm:inline">{isDark ? "Sang" : "Toi"}</span>
        </button>
        <button
          type="button"
          aria-label="Thong bao"
          className="rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-50 hover:text-gray-600 backoffice-dark:text-white/45 backoffice-dark:hover:bg-white/10 backoffice-dark:hover:text-white"
        >
          <Bell className="h-5 w-5" />
        </button>
        <button
          type="button"
          aria-label="Tro giup"
          className="rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-50 hover:text-gray-600 backoffice-dark:text-white/45 backoffice-dark:hover:bg-white/10 backoffice-dark:hover:text-white"
        >
          <HelpCircle className="h-5 w-5" />
        </button>
        <div className="ml-1 h-8 w-px bg-gray-200 backoffice-dark:bg-white/10" />
        <button
          type="button"
          className="flex items-center gap-2 rounded-full pl-1 outline-none focus-visible:ring-2 focus-visible:ring-violet-500/30 backoffice-dark:focus-visible:ring-[var(--backoffice-primary)]/40"
          aria-label="Tai khoan admin"
          title={displayName}
        >
          <span className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-gray-200 bg-violet-50 text-xs font-black uppercase text-violet-600 backoffice-dark:border-[var(--backoffice-primary)]/40 backoffice-dark:bg-[var(--backoffice-primary-soft)] backoffice-dark:text-[var(--backoffice-primary)]">
            {avatarUrl ? (
              <span
                aria-label={displayName}
                className="h-full w-full bg-cover bg-center"
                style={{ backgroundImage: `url("${avatarUrl}")` }}
              />
            ) : (
              initials
            )}
          </span>
        </button>
      </div>
    </header>
  );
}
