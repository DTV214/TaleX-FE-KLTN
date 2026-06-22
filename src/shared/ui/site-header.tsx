"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, Search, LogOut, User as UserIcon } from "lucide-react";
import { siteConfig } from "@/core/config/site";
import { isFullProfile, useAuthStore } from "@/features/auth/store/auth.store";
import { logoutAction } from "@/features/auth/api/auth.actions";
import { CoinWalletWidget } from "@/features/coin";

function isActiveRoute(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname.startsWith(href);
}

export function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();

  // Lấy thông tin user và hàm xóa Auth
  const { user, isAuthenticated, clearAuth } = useAuthStore();
  const profileUser = isFullProfile(user) ? user : null;

  const isAuthOrAdminPage =
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/forgot-password" ||
    pathname.startsWith("/creator-dashboard") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/staff");

  if (isAuthOrAdminPage) {
    return null;
  }

  // Hàm xử lý Đăng xuất ngay trên Header
  const handleLogout = async () => {
    await logoutAction(); // Xóa cookie và gọi API BE
    clearAuth(); // Xóa state
    router.push("/login"); // Đẩy về login
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-background/75 backdrop-blur-2xl">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_0%,rgba(212,175,55,0.10),transparent_36%),radial-gradient(circle_at_70%_0%,rgba(255,255,255,0.06),transparent_30%)]" />

      <div className="container mx-auto flex h-16 md:h-20 items-center justify-between gap-4 md:gap-5 px-4 md:px-8 lg:justify-start">
        {/* Logo */}
        <Link
          href="/"
          aria-label={`${siteConfig.name} home`}
          className="group flex min-w-fit items-center gap-3"
        >
          {siteConfig.logo ? (
            <span
              className="block h-8 w-24 md:h-10 md:w-28 bg-contain bg-left bg-no-repeat"
              style={{ backgroundImage: `url(${siteConfig.logo})` }}
            />
          ) : (
            <span className="font-heading text-xl md:text-2xl font-extrabold tracking-tight text-primary transition group-hover:drop-shadow-[0_0_12px_rgba(212,175,55,0.55)]">
              {siteConfig.name}
            </span>
          )}
        </Link>

        {/* Navigation - Desktop */}
        <nav
          aria-label="Main navigation"
          className="hidden items-center gap-8 lg:flex"
        >
          {siteConfig.mainNav.map((item) => {
            const isActive = isActiveRoute(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group relative py-2 font-heading text-lg font-semibold tracking-wide transition-colors ${
                  isActive
                    ? "text-primary"
                    : "text-foreground/65 hover:text-foreground"
                }`}
              >
                {item.title}
                <span
                  className={`absolute inset-x-0 -bottom-0.5 h-0.5 rounded-full bg-primary transition-all duration-300 ${
                    isActive
                      ? "opacity-100"
                      : "scale-x-0 opacity-0 group-hover:opacity-100"
                  }`}
                />
              </Link>
            );
          })}
        </nav>

        {/* Thanh Tìm Kiếm - Desktop */}
        <div className="ml-auto hidden min-w-[260px] max-w-xl flex-1 items-center lg:flex">
          <label className="group relative w-full">
            <span className="sr-only">Search titles</span>
            <Search className="absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
            <input
              type="search"
              placeholder="Search titles..."
              className="h-14 w-full rounded-2xl border border-white/10 bg-[#14151b]/85 px-14 text-base text-foreground outline-none shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition-all placeholder:text-muted-foreground/75 focus:border-primary/50 focus:bg-black/50 focus:shadow-[0_0_28px_rgba(212,175,55,0.12)]"
            />
          </label>
        </div>

        {/* Nhóm Nút Tiện Ích */}
        <div className="flex items-center gap-2 md:gap-3 lg:ml-0">
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-full text-foreground/80 transition hover:text-primary lg:hidden"
          >
            <Search className="h-5 w-5" />
          </button>

          <Link
            href="/creator"
            className="hidden h-10 md:h-11 items-center justify-center rounded-xl md:rounded-2xl bg-primary px-4 md:px-6 text-xs md:text-sm font-extrabold text-black shadow-[0_0_30px_rgba(212,175,55,0.28)] transition-all hover:-translate-y-0.5 hover:bg-primary/90 hover:shadow-[0_0_42px_rgba(212,175,55,0.38)] sm:flex"
          >
            Become a Creator
          </Link>

          {/* KHU VỰC AVATAR & DROPDOWN MỚI */}
          {isAuthenticated && profileUser ? (
            <>
              <CoinWalletWidget />

              <div className="relative group">
              {/* Vùng Avatar để hover */}
              <button className="flex h-10 w-10 md:h-12 md:w-12 items-center justify-center overflow-hidden rounded-full border border-primary/35 bg-primary/10 text-primary transition hover:border-primary hover:shadow-[0_0_26px_rgba(212,175,55,0.24)]">
                {profileUser.avatarUrl ? (
                  <span
                    className="h-full w-full bg-cover bg-center"
                    style={{ backgroundImage: `url(${profileUser.avatarUrl})` }}
                  />
                ) : (
                  <span className="font-heading text-xs md:text-sm font-extrabold uppercase">
                    {profileUser.username.slice(0, 2)}
                  </span>
                )}
              </button>

              {/* Menu Dropdown - Tự động hiện khi hover */}
              <div className="absolute right-0 top-full pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <div className="w-48 rounded-xl bg-[#121214] border border-white/10 shadow-2xl p-2 flex flex-col gap-1">
                  <div className="px-3 py-2 border-b border-white/10 mb-1">
                    <p className="text-sm font-bold text-white truncate">
                      {profileUser.fullName}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      @{profileUser.username}
                    </p>
                  </div>

                  <Link
                    href="/profile"
                    className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-300 rounded-lg hover:bg-white/5 hover:text-primary transition-colors"
                  >
                    <UserIcon className="h-4 w-4" />
                    Hồ sơ cá nhân
                  </Link>

                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-3 px-3 py-2 text-sm font-medium text-[#E50914] rounded-lg hover:bg-[#E50914]/10 transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    Đăng xuất
                  </button>
                </div>
              </div>
              </div>
            </>
          ) : (
            <Link
              href="/login"
              className="flex h-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.05] px-4 text-xs font-bold text-gray-300 transition-all hover:border-[#D4AF37]/40 hover:bg-white/10 hover:text-[#D4AF37] md:h-11 md:px-6 md:text-sm"
            >
              Đăng Nhập
            </Link>
          )}

          <button
            type="button"
            className="flex h-10 w-10 md:h-11 md:w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-foreground transition hover:border-primary/40 hover:text-primary lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
