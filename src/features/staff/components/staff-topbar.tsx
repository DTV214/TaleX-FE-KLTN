"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, HelpCircle, Home, LogOut, Menu, Moon, Sun } from "lucide-react";
import { logoutAction } from "@/features/auth/api/auth.actions";
import { isFullProfile, useAuthStore } from "@/features/auth/store/auth.store";
import { useBackofficeTheme } from "@/shared/ui/backoffice-theme-provider";
import { useStaffSidebarStore } from "./staff-sidebar";

export function StaffTopbar() {
  const router = useRouter();
  const { isDark, toggleTheme } = useBackofficeTheme();
  const toggleSidebar = useStaffSidebarStore((state) => state.toggleSidebar);
  const { clearAuth, user } = useAuthStore();

  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const displayName = isFullProfile(user)
    ? user.fullName || user.username || user.email || "Staff"
    : user?.accountId || "Staff";

  const avatarUrl = isFullProfile(user) ? user.avatarUrl : undefined;

  const roleLabel = user?.roleName || "STAFF";

  const initials =
    displayName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "ST";

  const handleLogout = async () => {
    await logoutAction();
    clearAuth();
    router.push("/login");
    router.refresh();
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <header className="sticky top-0 z-50 flex h-16 w-full items-center justify-between border-b border-gray-100 bg-white px-4 md:px-8">
      {/* Left Menu Toggle & Brand Logo */}
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={toggleSidebar}
          aria-label="Mở hoặc thu gọn sidebar staff"
          title="Mở hoặc thu gọn sidebar staff"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-gray-600 transition hover:bg-gray-100 hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#10B981]/30"
        >
          <Menu className="h-6 w-6" />
        </button>

        <Link
          href="/"
          className="group flex min-w-fit items-center gap-2 rounded-xl outline-none"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://res.cloudinary.com/dratbz8bh/image/upload/v1783173753/1-removebg-preview_xv2wde.png"
            alt="TaleX Logo"
            className="h-10 w-auto max-w-[140px] object-contain"
          />
          <span className="rounded bg-[#10B981]/10 px-2 py-0.5 text-xs font-bold text-[#10B981]">
            Staff
          </span>
        </Link>
      </div>

      {/* Right Utilities */}
      <div className="flex items-center gap-3 md:gap-4 ml-auto">
        <button
          type="button"
          onClick={toggleTheme}
          aria-label={isDark ? "Chuyển sang giao diện sáng" : "Chuyển sang giao diện tối"}
          title={isDark ? "Chuyển sang giao diện sáng" : "Chuyển sang giao diện tối"}
          className="backoffice-theme-toggle inline-flex h-9 items-center justify-center gap-2 rounded-full border px-3 text-xs font-black transition active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]/35"
        >
          <span className="backoffice-theme-toggle-icon inline-flex h-5 w-5 items-center justify-center rounded-full">
            {isDark ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
          </span>
          <span className="hidden sm:inline">{isDark ? "Sáng" : "Tối"}</span>
        </button>
        <button
          type="button"
          aria-label="Thông báo"
          title="Thông báo"
          className="relative p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-full hover:bg-gray-50"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 flex h-2 w-2 rounded-full bg-red-500 ring-2 ring-white"></span>
        </button>
        <button
          type="button"
          aria-label="Trợ giúp"
          title="Trợ giúp"
          className="p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-full hover:bg-gray-50"
        >
          <HelpCircle className="w-5 h-5" />
        </button>
        <div className="ml-1 h-8 w-px bg-gray-200" /> {/* Divider */}

        {/* Profile Card Button & Dropdown Modal */}
        <div className="relative ml-1" ref={menuRef}>
          <button
            type="button"
            onClick={() => setIsProfileMenuOpen((prev) => !prev)}
            className="flex items-center gap-3 rounded-xl p-1.5 transition hover:bg-gray-100/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#10B981]/30"
            aria-label="Menu tài khoản cá nhân"
            aria-expanded={isProfileMenuOpen}
          >
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-gray-900 leading-tight">
                {displayName}
              </p>
              <p className="text-[11px] text-gray-500 font-medium capitalize">
                {roleLabel}
              </p>
            </div>
            <div className="h-10 w-10 overflow-hidden rounded-full border-2 border-white shadow-sm ring-1 ring-gray-100 bg-[#10B981]/10 flex items-center justify-center font-bold text-[#10B981] text-sm shrink-0">
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatarUrl}
                  alt={displayName}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span>{initials}</span>
              )}
            </div>
          </button>

          {/* Profile Dropdown Modal */}
          {isProfileMenuOpen && (
            <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-gray-100 bg-white p-2 shadow-xl ring-1 ring-black/5 animate-in fade-in zoom-in-95 duration-150 z-50 text-gray-900">
              <div className="px-3 py-2 border-b border-gray-100">
                <p className="text-xs font-bold text-gray-900 truncate">
                  {displayName}
                </p>
                <p className="text-[10px] text-gray-500 font-medium capitalize truncate">
                  {roleLabel}
                </p>
              </div>

              <div className="py-1 space-y-1">
                <Link
                  href="/"
                  onClick={() => setIsProfileMenuOpen(false)}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-gray-700 transition hover:bg-gray-50 hover:text-gray-900"
                >
                  <Home className="h-4 w-4 text-gray-500" />
                  Trang chủ
                </Link>

                <button
                  type="button"
                  onClick={() => {
                    setIsProfileMenuOpen(false);
                    void handleLogout();
                  }}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-red-500 transition hover:bg-red-50 hover:text-red-600"
                >
                  <LogOut className="h-4 w-4 text-red-500" />
                  Đăng xuất
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}


