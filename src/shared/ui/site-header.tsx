"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Search, UserCircle } from "lucide-react";
import { siteConfig } from "@/core/config/site";

const currentUser: {
  name: string;
  avatar?: string;
} | null = null;

function isActiveRoute(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname.startsWith(href);
}

export function SiteHeader() {
  const pathname = usePathname();

  // ĐÃ THÊM: Kiểm tra xem có đang ở trang xác thực (Auth) không
  const isAuthOrAdminPage =
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/forgot-password" ||
    pathname.startsWith("/creator-dashboard") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/staff");

  // Nếu đang ở trang Auth, trả về null để ẩn hoàn toàn Header này đi
  if (isAuthOrAdminPage) {
    return null;
  }
  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-background/75 backdrop-blur-2xl">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_0%,rgba(212,175,55,0.10),transparent_36%),radial-gradient(circle_at_70%_0%,rgba(255,255,255,0.06),transparent_30%)]" />

      {/* Đã thêm justify-between để Logo và Nhóm nút 2 bên tự động đẩy ra xa nhau trên Mobile */}
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
        {/* Đã thêm ml-auto cho LG để tự động đẩy sang phải khi có thanh Search */}
        <div className="flex items-center gap-2 md:gap-3 lg:ml-0">
          {/* MỚI: Nút icon tìm kiếm chỉ dành cho Mobile */}
          <button
            type="button"
            aria-label="Open search"
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

          {currentUser ? (
            <Link
              href="/account"
              aria-label="Open account"
              className="flex h-10 w-10 md:h-12 md:w-12 items-center justify-center overflow-hidden rounded-full border border-primary/35 bg-primary/10 text-primary transition hover:border-primary hover:shadow-[0_0_26px_rgba(212,175,55,0.24)]"
            >
              {currentUser.avatar ? (
                <span
                  className="h-full w-full bg-cover bg-center"
                  style={{ backgroundImage: `url(${currentUser.avatar})` }}
                />
              ) : (
                <span className="font-heading text-xs md:text-sm font-extrabold">
                  {currentUser.name.slice(0, 2).toUpperCase()}
                </span>
              )}
            </Link>
          ) : (
            <Link
              href="/login"
              aria-label="Login"
              className="flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-full text-foreground/80 transition hover:text-primary hover:drop-shadow-[0_0_16px_rgba(212,175,55,0.35)]"
            >
              <UserCircle className="h-8 w-8 md:h-10 md:w-10 stroke-[1.7]" />
            </Link>
          )}

          {/* ĐÃ SỬA: Bỏ text "Become a Creator" gây vỡ layout ra khỏi nút Hamburger */}
          <button
            type="button"
            aria-label="Open navigation menu"
            className="flex h-10 w-10 md:h-11 md:w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-foreground transition hover:border-primary/40 hover:text-primary lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
