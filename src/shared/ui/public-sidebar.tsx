"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/features/auth/store/auth.store";
import {
  getFollowedCreators,
  type AccountFollowInfoDto,
} from "@/features/series/api/creator-follows-api";
import { getPublicSeriesDetail } from "@/features/series/api/series-api";
import {
  BookOpen,
  Bookmark,
  ChevronDown,
  ChevronUp,
  Flame,
  Heart,
  History,
  Home,
  Loader2,
  Radio,
  Sparkles,
  Tv,
  UserRoundCog,
  Megaphone,
  X,
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
];

const libraryMenu: MenuItem[] = [
  { title: "Video đã xem", href: "/history", icon: History },
  { title: "Đã thích", href: "/liked", icon: Heart },
  { title: "Đã bookmark", href: "/bookmarks", icon: Bookmark },
];

const platformMenu: MenuItem[] = [
  { title: "Giới thiệu", href: "/intro", icon: Sparkles },
  { title: "Creator Studio", href: "/creator-dashboard", icon: UserRoundCog },
  { title: "Quảng cáo", href: "/advertiser-dashboard", icon: Megaphone },
];

const legalLinks = [
  { title: "Chính sách bảo mật", href: "/privacy" },
  { title: "Điều khoản dịch vụ", href: "/terms" },
  { title: "Liên hệ", href: "/contact" },
  { title: "Câu hỏi thường gặp", href: "/faq" },
];

const noPrefetchRoutes = new Set([
  "/history",
  "/faq",
  "/terms",
  "/privacy",
  "/contact",
]);

export function PublicSidebar() {
  const isSidebarOpen = usePublicSidebarStore((state) => state.isSidebarOpen);
  const isMobileSidebarOpen = usePublicSidebarStore(
    (state) => state.isMobileSidebarOpen,
  );
  const closeMobileSidebar = usePublicSidebarStore(
    (state) => state.closeMobileSidebar,
  );
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return (
    <>
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 hidden h-screen flex-col overflow-y-auto border-r border-white/5 bg-[#0f0f0f] pt-16 text-white shadow-[16px_0_40px_rgba(0,0,0,0.28)] transition-all duration-300 ease-in-out md:flex",
          isSidebarOpen ? "w-64 px-3" : "w-20 px-2",
        )}
      >
        <div className="flex min-h-full flex-col py-4">
          <SidebarGroup items={primaryMenu} isOpen={isSidebarOpen} />
          <SidebarDivider />
          <SubscriptionsSidebarSection
            isAuthenticated={isAuthenticated}
            isOpen={isSidebarOpen}
          />
          <SidebarDivider />
          <SidebarGroup items={libraryMenu} isOpen={isSidebarOpen} />
          <SidebarDivider />
          <SidebarGroup items={platformMenu} isOpen={isSidebarOpen} />
          <SidebarLegalLinks isOpen={isSidebarOpen} />
        </div>
      </aside>

      <div
        className={cn(
          "fixed inset-0 z-[60] md:hidden",
          isMobileSidebarOpen ? "pointer-events-auto" : "pointer-events-none",
        )}
      >
        <button
          type="button"
          aria-label="Đóng menu"
          className={cn(
            "absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300",
            isMobileSidebarOpen ? "opacity-100" : "opacity-0",
          )}
          onClick={closeMobileSidebar}
        />

        <aside
          className={cn(
            "absolute left-0 top-0 flex h-full w-[min(82vw,320px)] flex-col overflow-y-auto border-r border-white/10 bg-[#0f0f0f] px-3 pt-4 text-white shadow-[24px_0_70px_rgba(0,0,0,0.55)] transition-transform duration-300 ease-out",
            isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <div className="mb-4 flex items-center justify-between px-2">
            <Link
              href="/"
              onClick={closeMobileSidebar}
              className="font-heading text-lg font-black tracking-tight text-white"
            >
              TaleX
            </Link>
            <button
              type="button"
              onClick={closeMobileSidebar}
              aria-label="Đóng menu"
              title="Đóng menu"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white/75 transition hover:bg-white/10 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex min-h-full flex-col pb-4">
            <SidebarGroup
              items={primaryMenu}
              isOpen
              onNavigate={closeMobileSidebar}
            />
            <SidebarDivider />
            <SubscriptionsSidebarSection
              isAuthenticated={isAuthenticated}
              isOpen
              onNavigate={closeMobileSidebar}
            />
            <SidebarDivider />
            <SidebarGroup
              items={libraryMenu}
              isOpen
              onNavigate={closeMobileSidebar}
            />
            <SidebarDivider />
            <SidebarGroup
              items={platformMenu}
              isOpen
              onNavigate={closeMobileSidebar}
            />
            <SidebarLegalLinks isOpen />
          </div>
        </aside>
      </div>
    </>
  );
}

function SubscriptionsSidebarSection({
  isAuthenticated,
  isOpen,
  onNavigate,
}: {
  isAuthenticated: boolean;
  isOpen: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const [isExpanded, setIsExpanded] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const shouldFetchCreators = isAuthenticated && isOpen && isExpanded;

  const creatorsQuery = useQuery({
    queryKey: ["publicSidebarFollowedCreators"],
    queryFn: () => getFollowedCreators(0, 20),
    enabled: shouldFetchCreators,
    staleTime: 60 * 1000,
  });

  const creators = useMemo(
    () => creatorsQuery.data?.content ?? [],
    [creatorsQuery.data?.content],
  );
  const visibleCreators = showAll ? creators : creators.slice(0, 5);
  const isActive = pathname.startsWith("/subscriptions");

  if (!isOpen) {
    return (
      <button
        type="button"
        title="Kênh đăng ký"
        aria-label="Kênh đăng ký"
        onClick={() => setIsExpanded((value) => !value)}
        className={cn(
          "flex w-full items-center justify-center rounded-xl px-0 py-2.5 text-sm font-bold transition-all duration-300 hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]/60",
          isActive
            ? "bg-[#D4AF37]/12 text-[#D4AF37] shadow-[inset_3px_0_0_rgba(212,175,55,0.85)]"
            : "text-white/72",
        )}
      >
        <Radio className="h-5 w-5 shrink-0" strokeWidth={1.8} />
      </button>
    );
  }

  return (
    <section className="space-y-2">
      <button
        type="button"
        onClick={() => setIsExpanded((value) => !value)}
        className={cn(
          "flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm font-extrabold transition-all duration-300 hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]/60",
          isActive
            ? "bg-[#D4AF37]/12 text-[#D4AF37] shadow-[inset_3px_0_0_rgba(212,175,55,0.85)]"
            : "text-white/82",
        )}
      >
        <span className="flex min-w-0 items-center gap-3">
          <Radio className="h-5 w-5 shrink-0" strokeWidth={1.8} />
          <span className="truncate">Kênh đăng ký</span>
        </span>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4 shrink-0 text-white/45" />
        ) : (
          <ChevronDown className="h-4 w-4 shrink-0 text-white/45" />
        )}
      </button>

      {isExpanded && (
        <div className="space-y-1 pl-1">
          {!isAuthenticated && (
            <div className="rounded-xl border border-white/5 bg-white/[0.03] px-3 py-3 text-xs font-semibold leading-relaxed text-slate-500">
              Đăng nhập để xem các nhà sáng tạo bạn đang theo dõi.
            </div>
          )}

          {isAuthenticated && creatorsQuery.isLoading && (
            <div className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin text-[#D4AF37]" />
              Đang tải kênh...
            </div>
          )}

          {isAuthenticated &&
            !creatorsQuery.isLoading &&
            creators.length === 0 && (
              <div className="rounded-xl border border-white/5 bg-white/[0.03] px-3 py-3 text-xs font-semibold leading-relaxed text-slate-500">
                Chưa theo dõi nhà sáng tạo nào.
              </div>
            )}

          {visibleCreators.map((creator) => (
            <FollowedCreatorSidebarLink
              key={creator.accountId}
              creator={creator}
              onNavigate={onNavigate}
            />
          ))}

          {creators.length > 5 && (
            <button
              type="button"
              onClick={() => setShowAll((value) => !value)}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-xs font-extrabold text-white/65 transition hover:bg-white/10 hover:text-[#D4AF37]"
            >
              {showAll ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
              {showAll ? "Ẩn bớt" : "Xem thêm"}
            </button>
          )}
        </div>
      )}
    </section>
  );
}

function FollowedCreatorSidebarLink({
  creator,
  onNavigate,
}: {
  creator: AccountFollowInfoDto;
  onNavigate?: () => void;
}) {
  const avatarStyle = creator.avatarUrl
    ? { backgroundImage: `url("${creator.avatarUrl}")` }
    : undefined;

  return (
    <Link
      href={`/public-channel?creatorId=${creator.accountId}`}
      title={creator.username}
      onClick={onNavigate}
      className="group flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-bold text-white/72 transition hover:bg-white/10 hover:text-white"
    >
      <span
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-cover bg-center text-[11px] font-black uppercase text-white/70 shadow-[0_8px_20px_rgba(0,0,0,0.25)]",
          creator.avatarUrl ? "bg-white/5" : "bg-[#D4AF37]/15 text-[#D4AF37]",
        )}
        style={avatarStyle}
      >
        {!creator.avatarUrl ? creator.username.slice(0, 1) : null}
      </span>
      <span className="min-w-0 flex-1 truncate">{creator.username}</span>
      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-sky-400 opacity-80 transition group-hover:bg-[#D4AF37]" />
    </Link>
  );
}

function SidebarGroup({
  items,
  isOpen,
  onNavigate,
}: {
  items: MenuItem[];
  isOpen: boolean;
  onNavigate?: () => void;
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
            prefetch={noPrefetchRoutes.has(item.href) ? false : undefined}
            title={item.title}
            onClick={onNavigate}
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
            prefetch={false}
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
