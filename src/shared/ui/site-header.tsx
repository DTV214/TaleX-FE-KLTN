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

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-background/75 backdrop-blur-2xl">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_0%,rgba(212,175,55,0.10),transparent_36%),radial-gradient(circle_at_70%_0%,rgba(255,255,255,0.06),transparent_30%)]" />

      <div className="container mx-auto flex h-20 items-center gap-5 px-4 md:px-8">
        <Link
          href="/"
          aria-label={`${siteConfig.name} home`}
          className="group flex min-w-fit items-center gap-3"
        >
          {siteConfig.logo ? (
            <span
              className="block h-10 w-28 bg-contain bg-left bg-no-repeat"
              style={{ backgroundImage: `url(${siteConfig.logo})` }}
            />
          ) : (
            <span className="font-heading text-2xl font-extrabold tracking-tight text-primary transition group-hover:drop-shadow-[0_0_12px_rgba(212,175,55,0.55)]">
              {siteConfig.name}
            </span>
          )}
        </Link>

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

        <div className="flex items-center gap-3">
          <Link
            href="/creator"
            className="hidden h-11 items-center justify-center rounded-2xl bg-primary px-6 text-sm font-extrabold text-black shadow-[0_0_30px_rgba(212,175,55,0.28)] transition-all hover:-translate-y-0.5 hover:bg-primary/90 hover:shadow-[0_0_42px_rgba(212,175,55,0.38)] sm:flex"
          >
            Become a Creator
          </Link>

          {currentUser ? (
            <Link
              href="/account"
              aria-label="Open account"
              className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border border-primary/35 bg-primary/10 text-primary transition hover:border-primary hover:shadow-[0_0_26px_rgba(212,175,55,0.24)]"
            >
              {currentUser.avatar ? (
                <span
                  className="h-full w-full bg-cover bg-center"
                  style={{ backgroundImage: `url(${currentUser.avatar})` }}
                />
              ) : (
                <span className="font-heading text-sm font-extrabold">
                  {currentUser.name.slice(0, 2).toUpperCase()}
                </span>
              )}
            </Link>
          ) : (
            <Link
              href="/login"
              aria-label="Login"
              className="flex h-12 w-12 items-center justify-center rounded-full text-foreground/80 transition hover:text-primary hover:drop-shadow-[0_0_16px_rgba(212,175,55,0.35)]"
            >
              <UserCircle className="h-10 w-10 stroke-[1.7]" />
            </Link>
          )}

          <button
            type="button"
            aria-label="Open navigation menu"
            className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-foreground transition hover:border-primary/40 hover:text-primary lg:hidden"
          >
            <Menu className="h-5 w-5" />
            Become a Creator
          </button>
        </div>
      </div>
    </header>
  );
}
 
