"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { getPublicSeriesDetail } from "@/features/series/api/series-api";
import {
  BookOpen,
  Bookmark,
  Flame,
  Heart,
  History,
  Home,
  Radio,
  Sparkles,
  Tv,
  UserRoundCog,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { usePublicSidebarStore } from "@/shared/stores/public-sidebar.store";
import { cn } from "@/shared/utils/utils";

type MenuItem = {
  title: string;
  href: string;
  icon: LucideIcon;
};

const primaryMenu: MenuItem[] = [
  { title: "Trang chủ", href: "/", icon: Home },
  { title: "Phim bộ", href: "/series", icon: Tv },
  { title: "Truyện tranh", href: "/comics", icon: BookOpen },
  { title: "Shorts", href: "/#shorts", icon: Flame },
  { title: "Kênh đăng ký", href: "/subscriptions", icon: Radio },
];

const libraryMenu: MenuItem[] = [
  { title: "Video đã xem", href: "/history", icon: History },
  { title: "Đã thích", href: "/liked", icon: Heart },
  { title: "Đã bookmark", href: "/bookmarks", icon: Bookmark },
];

const platformMenu: MenuItem[] = [
  { title: "Giới thiệu", href: "/intro", icon: Sparkles },
  { title: "Creator Studio", href: "/creator-dashboard", icon: UserRoundCog },
];

const legalLinks = [
  { title: "Chính sách bảo mật", href: "/privacy" },
  { title: "Điều khoản dịch vụ", href: "/terms" },
  { title: "Liên hệ", href: "/contact" },
  { title: "Câu hỏi thường gặp", href: "/faq" },
];

export function PublicSidebar() {
  const isSidebarOpen = usePublicSidebarStore((state) => state.isSidebarOpen);

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 hidden h-screen flex-col overflow-y-auto border-r border-white/5 bg-[#0f0f0f] pt-16 text-white shadow-[16px_0_40px_rgba(0,0,0,0.28)] transition-all duration-300 ease-in-out md:flex",
        isSidebarOpen ? "w-64 px-3" : "w-20 px-2",
      )}
    >
      <div className="flex min-h-full flex-col py-4">
        <SidebarGroup items={primaryMenu} isOpen={isSidebarOpen} />
        <SidebarDivider />
        <SidebarGroup items={libraryMenu} isOpen={isSidebarOpen} />
        <SidebarDivider />
        <SidebarGroup items={platformMenu} isOpen={isSidebarOpen} />
        <SidebarLegalLinks isOpen={isSidebarOpen} />
      </div>
    </aside>
  );
}

function SidebarGroup({
  items,
  isOpen,
}: {
  items: MenuItem[];
  isOpen: boolean;
}) {
  const pathname = usePathname();

  const isSeriesRoute = pathname.startsWith("/series/");
  const seriesId = isSeriesRoute ? pathname.split("/")[2] : null;

  const { data: seriesDetail } = useQuery({
    queryKey: ["publicSeriesDetail", seriesId],
    queryFn: () => getPublicSeriesDetail(seriesId!),
    enabled: !!seriesId,
    staleTime: 5 * 60 * 1000,
  });

  const isComicSeries = seriesDetail?.contentType
    ? String(seriesDetail.contentType).toUpperCase() === "COMIC"
    : false;

  return (
    <nav className="space-y-1">
      {items.map((item) => {
        const Icon = item.icon;

        let isActive = false;
        if (item.href === "/") {
          isActive = pathname === "/";
        } else if (item.href === "/comics") {
          isActive =
            pathname.startsWith("/comics") ||
            pathname.startsWith("/read") ||
            (isSeriesRoute && isComicSeries);
        } else if (item.href === "/series") {
          isActive =
            (pathname.startsWith("/series") && !isComicSeries) ||
            pathname.startsWith("/watch");
        } else {
          isActive = pathname.startsWith(item.href);
        }

        return (
          <Link
            key={item.title}
            href={item.href}
            title={item.title}
            className={cn(
              "flex w-full items-center rounded-xl py-2.5 text-left text-sm font-bold transition-all duration-300 hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]/60",
              isOpen ? "justify-start gap-3 px-3" : "justify-center px-0",
              isActive
                ? "bg-[#D4AF37]/12 text-[#D4AF37] shadow-[inset_3px_0_0_rgba(212,175,55,0.85)]"
                : "text-white/72",
            )}
          >
            <Icon className="h-5 w-5 shrink-0" strokeWidth={1.8} />
            <span
              className={cn(
                "truncate whitespace-nowrap transition-all duration-200",
                isOpen
                  ? "max-w-[160px] opacity-100"
                  : "max-w-0 overflow-hidden opacity-0",
              )}
            >
              {item.title}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}

function SidebarDivider() {
  return <div className="my-3 h-px bg-white/10" />;
}

function SidebarLegalLinks({ isOpen }: { isOpen: boolean }) {
  if (!isOpen) return null;

  return (
    <div className="mt-auto border-t border-white/10 px-3 pt-4 text-[11px] leading-relaxed text-slate-500">
      <div className="flex flex-wrap gap-x-3 gap-y-1">
        {legalLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="transition-colors hover:text-[#D4AF37]"
          >
            {link.title}
          </Link>
        ))}
      </div>
      <p className="mt-3 font-medium text-slate-600">© 2026 TaleX</p>
    </div>
  );
}
