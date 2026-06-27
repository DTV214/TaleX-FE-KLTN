"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Clapperboard,
  LogOut,
  Menu,
  Search,
  User as UserIcon,
} from "lucide-react";
import { DropdownMenu } from "radix-ui";
import { siteConfig } from "@/core/config/site";
import { isFullProfile, useAuthStore } from "@/features/auth/store/auth.store";
import { logoutAction } from "@/features/auth/api/auth.actions";
import { CoinWalletWidget } from "@/features/coin";
import { useMissionHeartbeat } from "@/features/mission/hooks/useMissionHeartbeat";

function isActiveRoute(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname.startsWith(href);
}

export function SiteHeader() {
  useMissionHeartbeat();

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
          aria-label={`Trang chủ ${siteConfig.name}`}
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
          aria-label="Điều hướng chính"
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
            <span className="sr-only">Tìm kiếm truyện, phim</span>
            <Search className="absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
            <input
              type="search"
              placeholder="Tìm kiếm truyện, phim..."
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

          {/* KHU VỰC AVATAR & DROPDOWN MỚI */}
          {isAuthenticated && profileUser ? (
            <>
              <CoinWalletWidget />

              <DropdownMenu.Root>
                <DropdownMenu.Trigger asChild>
                  <button className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-primary/35 bg-primary/10 text-primary transition hover:border-primary hover:shadow-[0_0_26px_rgba(212,175,55,0.24)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70 md:h-12 md:w-12">
                    {profileUser.avatarUrl ? (
                      <span
                        className="h-full w-full bg-cover bg-center"
                        style={{
                          backgroundImage: `url(${profileUser.avatarUrl})`,
                        }}
                      />
                    ) : (
                      <span className="font-heading text-xs font-extrabold uppercase md:text-sm">
                        {profileUser.username.slice(0, 2)}
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
                        {profileUser.fullName}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-gray-500">
                        @{profileUser.username}
                      </p>
                    </div>

                    <DropdownMenu.Item
                      onSelect={() => router.push("/creator-dashboard")}
                      className="flex cursor-pointer select-none items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium outline-none transition-colors hover:bg-white/5 hover:text-primary focus:bg-white/5 focus:text-primary"
                    >
                      <Clapperboard className="h-4 w-4" />
                      Creator Studio
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
