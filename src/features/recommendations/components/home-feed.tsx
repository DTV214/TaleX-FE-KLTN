"use client";

import Link from "next/link";
import {
  Fragment,
  type CSSProperties,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { motion } from "framer-motion";
import {
  AlertCircle,
  ArrowRight,
  BookmarkPlus,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Clapperboard,
  Crown,
  Eye,
  Filter,
  Play,
  RefreshCw,
  Sparkles,
  Star,
  TrendingUp,
  X,
} from "lucide-react";
import { DEFAULT_HOME_FEED_LIMITS } from "../api/home-feed.api";
import { useHomeFeed, useRecommendationFeedInfinite } from "../hooks/use-home-feed";
import type {
  HomeFeedPoolKey,
  HomeFeedRequest,
  HomeFeedSeries,
} from "../types/home-feed.types";
import { ContinueWatching } from "@/features/home/components/continue-watching";
import { AdSlot } from "@/shared/ui/ad-slot";

type FeedKind = "COMIC" | "VIDEO";
type SectionVariant = "hero" | "ranking" | "row" | "spotlight";

type TypedHomeSection = {
  id: string;
  poolKey: HomeFeedPoolKey;
  eyebrow: string;
  title: string;
  description: string;
  items: HomeFeedSeries[];
  variant: SectionVariant;
};

const CHANNEL_POOL_ORDER: HomeFeedPoolKey[] = [
  "promoted",
  "trending",
  "newReleases",
  "recentlyUpdated",
  "randomCategory",
  "accountSubscription",
  "latestCommunityChoice",
  "communityChoice",
];

const RECOMMENDATION_POOLS: HomeFeedPoolKey[] = [
  "latestCommunityChoice",
  "communityChoice",
];

const MIXED_RECOMMENDATION_LIMIT = 10;

const poolCopy: Record<
  HomeFeedPoolKey,
  {
    eyebrow: string;
    title: string;
    description: string;
    variant: SectionVariant;
  }
> = {
  promoted: {
    eyebrow: "",
    title: "Nội Dung Quảng Bá",
    description: "",
    variant: "hero",
  },
  trending: {
    eyebrow: "",
    title: "Xu Hướng",
    description: "",
    variant: "ranking",
  },
  newReleases: {
    eyebrow: "",
    title: "Mới Ra Mắt",
    description: "",
    variant: "row",
  },
  recentlyUpdated: {
    eyebrow: "",
    title: "Vừa Cập Nhật",
    description: "",
    variant: "row",
  },
  latestCommunityChoice: {
    eyebrow: "",
    title: "Cộng Đồng Bình Chọn Gần Đây",
    description: "",
    variant: "row",
  },
  communityChoice: {
    eyebrow: "",
    title: "Được Xem Nhiều Nhất",
    description: "",
    variant: "row",
  },
  randomCategory: {
    eyebrow: "",
    title: "Khám Phá",
    description: "",
    variant: "spotlight",
  },
  accountSubscription: {
    eyebrow: "",
    title: "Từ Kênh Theo Dõi",
    description: "",
    variant: "row",
  },
};

const fallbackImages = [
  "https://images.unsplash.com/photo-1518676590629-3dcbd9c5a5c9?q=80&w=1400&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1400&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=1400&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=1400&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1524985069026-dd778a71c7b4?q=80&w=1400&auto=format&fit=crop",
];

function imageFor(
  series: HomeFeedSeries,
  index = 0,
  variant: "cover" | "banner" = "banner",
) {
  if (variant === "cover") {
    return (
      series.coverUrl ||
      series.bannerUrl ||
      fallbackImages[index % fallbackImages.length]
    );
  }

  return (
    series.bannerUrl ||
    series.coverUrl ||
    fallbackImages[index % fallbackImages.length]
  );
}

function seriesHref(series: HomeFeedSeries) {
  return `/series/${series.seriesId}`;
}

function normalizeKind(series: HomeFeedSeries): FeedKind {
  return series.contentType?.toUpperCase() === "COMIC" ? "COMIC" : "VIDEO";
}

function uniqueSeries(items: HomeFeedSeries[]) {
  const seen = new Set<string>();

  return items.filter((item) => {
    if (!item.seriesId || seen.has(item.seriesId)) return false;
    seen.add(item.seriesId);
    return true;
  });
}

function buildChannelSections(
  feed: Record<HomeFeedPoolKey, HomeFeedSeries[]> | undefined,
) {
  if (!feed) return [];

  const sections: TypedHomeSection[] = [];

  CHANNEL_POOL_ORDER.forEach((poolKey) => {
    const config = poolCopy[poolKey];
    const items = uniqueSeries(feed[poolKey] ?? []);
    if (items.length === 0) return;

    sections.push({
      id: poolKey,
      poolKey,
      eyebrow: config.eyebrow,
      title: config.title,
      description: config.description,
      items,
      variant: config.variant,
    });
  });

  return sections;
}

function buildMixedRecommendations(
  feed: Record<HomeFeedPoolKey, HomeFeedSeries[]> | undefined,
  channelSections: TypedHomeSection[],
) {
  if (!feed) return [];

  const channelIds = new Set(
    channelSections.flatMap((section) =>
      section.items.map((series) => series.seriesId),
    ),
  );
  const raw = uniqueSeries(
    RECOMMENDATION_POOLS.flatMap((poolKey) => feed[poolKey] ?? []),
  );
  const fresh = raw.filter((series) => !channelIds.has(series.seriesId));

  return fresh;
}

function formatViews(value?: number, analyticViews?: number) {
  const actualViews = analyticViews ?? value;
  if (typeof actualViews !== "number") return "0 lượt xem";
  if (actualViews >= 1_000_000) {
    return `${(actualViews / 1_000_000).toFixed(actualViews >= 10_000_000 ? 0 : 1)} Tr lượt xem`;
  }
  if (actualViews >= 1_000) {
    return `${(actualViews / 1_000).toFixed(actualViews >= 10_000 ? 0 : 1)} N lượt xem`;
  }
  return `${actualViews} lượt xem`;
}

function contentLabel(kind: FeedKind) {
  return kind === "COMIC" ? "Truyện tranh" : "Phim bộ";
}

function getSectionIcon(poolKey: HomeFeedPoolKey) {
  switch (poolKey) {
    case "promoted":
      return <Crown className="h-5 w-5" />;
    case "trending":
      return <TrendingUp className="h-5 w-5" />;
    case "newReleases":
      return <Sparkles className="h-5 w-5" />;
    case "recentlyUpdated":
      return <RefreshCw className="h-5 w-5" />;
    case "randomCategory":
      return <Clapperboard className="h-5 w-5" />;
    case "accountSubscription":
      return <BookmarkPlus className="h-5 w-5" />;
    default:
      return <Sparkles className="h-5 w-5" />;
  }
}

export function HomeFeed({
  promotedComicAfter,
}: {
  promotedComicAfter?: ReactNode;
}) {
  const queryParams = useMemo<HomeFeedRequest>(
    () => ({
      ...DEFAULT_HOME_FEED_LIMITS,
      trendingLimit: 7,
      latestCommunityChoiceLimit: MIXED_RECOMMENDATION_LIMIT,
      communityChoiceLimit: MIXED_RECOMMENDATION_LIMIT,
    }),
    [],
  );
  const { data: feed, isError, isLoading, refetch } = useHomeFeed(queryParams);
  const channelSections = useMemo(() => buildChannelSections(feed), [feed]);
  const mixedRecommendations = useMemo(
    () => buildMixedRecommendations(feed, channelSections),
    [feed, channelSections],
  );
  const navSections = useMemo(
    () => [
      ...channelSections,
      {
        id: "mixed-recommendations",
        title: "Đề Xuất Cho Bạn",
      },
    ],
    [channelSections],
  );

  if (isLoading) {
    return <HomeFeedSkeleton />;
  }

  if (isError) {
    return (
      <section className="mt-10 rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-white">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-1 h-5 w-5 shrink-0 text-[#D4AF37]" />
            <div>
              <h2 className="font-heading text-xl font-bold">
                Chưa tải được đề xuất
              </h2>
              <p className="mt-1 text-sm font-medium text-white/50">
                TaleX chưa thể lấy dữ liệu trang chủ lúc này.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => void refetch()}
            className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-4 py-2 text-sm font-bold text-[#D4AF37] transition hover:bg-[#D4AF37] hover:text-black"
          >
            <RefreshCw className="h-4 w-4" />
            Thử lại
          </button>
        </div>
      </section>
    );
  }

  if (channelSections.length === 0 && mixedRecommendations.length === 0) {
    return null;
  }

  return (
    <div
      id="home-feed-top"
      className="mt-5 flex w-full max-w-full flex-col gap-y-10 overflow-hidden pb-24"
    >
      <HomeFeedNav sections={navSections} />
      <ContinueWatching />

      {channelSections.map((section, index) => {
        let content: ReactNode;

        if (section.variant === "hero") {
          content = <TypedHeroSection section={section} />;
        } else if (section.variant === "ranking") {
          content = <TypedRankingSection section={section} />;
        } else if (section.variant === "spotlight") {
          content = <TypedSpotlightSection section={section} />;
        } else {
          content = <TypedRowSection section={section} />;
        }

        return (
          <Fragment key={section.id}>
            {index > 0 ? <DecorativeSectionDivider /> : null}
            {index === 0 && promotedComicAfter ? (
              <CompactSponsorFrame>{promotedComicAfter}</CompactSponsorFrame>
            ) : null}
            {content}
            {shouldShowHomeAdBreak(index, channelSections.length) ? (
              <HomeChannelAdBreak index={index} />
            ) : null}
          </Fragment>
        );
      })}

      <MixedRecommendationSection fallbackItems={mixedRecommendations} />
    </div>
  );
}

function shouldShowHomeAdBreak(index: number, total: number) {
  if (total <= 1) return index === 0;
  if (index === 1) return true;
  return total >= 5 && index === 3;
}

function CompactSponsorFrame({ children }: { children: ReactNode }) {
  return (
    <div className="relative overflow-hidden rounded-[1.3rem] border border-[#D4AF37]/14 bg-[linear-gradient(120deg,rgba(212,175,55,0.08),rgba(255,255,255,0.045)_42%,rgba(91,112,184,0.08))] p-1 shadow-[0_16px_48px_rgba(0,0,0,0.22)]">
      <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-[#D4AF37]/45 to-transparent" />
      <div className="relative [&>section]:my-0 [&>section]:border-0 [&>section]:bg-transparent [&>section]:p-0 [&>section]:shadow-none">
        {children}
      </div>
    </div>
  );
}

function HomeChannelAdBreak({ index }: { index: number }) {
  const slotId = index <= 1 ? "mock-home-feed-mid-1" : "mock-home-feed-mid-2";

  return (
    <div className="relative overflow-hidden rounded-[1.4rem] border border-[#D4AF37]/16 bg-[linear-gradient(120deg,rgba(212,175,55,0.11),rgba(255,255,255,0.05)_42%,rgba(90,118,205,0.1))] p-1 shadow-[0_18px_54px_rgba(0,0,0,0.24)]">
      <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-[#D4AF37]/55 to-transparent" />
      <AdSlot
        slotId={slotId}
        format="horizontal"
        className="min-h-[92px] rounded-[1.15rem]"
      />
    </div>
  );
}

function DecorativeSectionDivider() {
  return (
    <div className="pointer-events-none -my-3 flex items-center justify-center px-6">
      <div className="relative h-8 w-full max-w-5xl">
        <div className="absolute left-0 right-0 top-1/2 h-px -translate-y-1/2 bg-gradient-to-r from-transparent via-[#D4AF37]/45 to-transparent" />
        <div className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rotate-45 rounded-[3px] border border-[#D4AF37]/45 bg-black/70 shadow-[0_0_22px_rgba(212,175,55,0.24)]" />
        <div className="absolute left-[44%] top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-[#D4AF37]/45" />
        <div className="absolute right-[44%] top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-[#D4AF37]/45" />
      </div>
    </div>
  );
}

function HomeFeedNav({
  sections,
}: {
  sections: Array<{ id: string; title: string }>;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const navItems = [
    { id: "home-feed-top", label: "Tất cả" },
    ...sections.map((section) => ({
      id: section.id,
      label: section.title,
    })),
  ];
  const filterItems = navItems.slice(1);
  const visibleItems = isExpanded ? filterItems : filterItems.slice(0, 4);
  const hiddenCount = filterItems.length - visibleItems.length;

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  return (
    <div className="sticky top-0 z-30 -mx-4 px-4 py-3 md:-mx-6 md:px-6">
      <div className="relative overflow-hidden rounded-[1.35rem] border border-[#D4AF37]/18 bg-[linear-gradient(115deg,rgba(212,175,55,0.18),rgba(255,255,255,0.07)_38%,rgba(79,103,176,0.14)_72%,rgba(10,10,12,0.86))] px-3 py-3 shadow-[0_18px_46px_rgba(0,0,0,0.28),0_0_34px_rgba(212,175,55,0.08)] backdrop-blur-xl">
        <Sparkles className="pointer-events-none absolute left-8 top-1 h-5 w-5 rotate-12 text-[#D4AF37]/25" />
        <Clapperboard className="pointer-events-none absolute right-24 top-1/2 h-7 w-7 -translate-y-1/2 rotate-12 text-white/10" />
        <BookOpen className="pointer-events-none absolute bottom-1 right-8 h-5 w-5 -rotate-12 text-[#D4AF37]/18" />
        <div className={`relative flex gap-3 ${isExpanded ? "flex-wrap items-center" : "items-center overflow-hidden"}`}>
          <button
            type="button"
            onClick={() => setIsExpanded((value) => !value)}
            aria-expanded={isExpanded}
            className="inline-flex shrink-0 cursor-pointer items-center gap-2 rounded-full border border-[#D4AF37]/35 bg-black/40 px-4 py-2.5 text-sm font-black uppercase tracking-[0.16em] text-[#F2D76B] shadow-[0_0_24px_rgba(212,175,55,0.18)] transition duration-300 hover:border-[#F5D65E]/70 hover:bg-[#D4AF37]/18 hover:text-[#FFE88A]"
          >
            {isExpanded ? <X className="h-4 w-4" /> : <Filter className="h-4 w-4" />}
            Bộ lọc
          </button>
          {visibleItems.map((item, index) => (
            <button
              key={`${item.id}-${index}`}
              type="button"
              onClick={() => scrollToSection(item.id)}
              className="shrink-0 cursor-pointer rounded-full border border-white/10 bg-white/[0.08] px-4 py-2.5 font-sans text-sm font-bold text-white/70 shadow-[0_0_18px_rgba(255,255,255,0.04)] transition duration-300 hover:-translate-y-0.5 hover:border-[#D4AF37]/45 hover:bg-[#D4AF37]/15 hover:text-white hover:shadow-[0_0_26px_rgba(212,175,55,0.22)] md:text-base"
            >
              {item.label}
            </button>
          ))}
          {!isExpanded && hiddenCount > 0 ? (
            <button
              type="button"
              onClick={() => setIsExpanded(true)}
              className="shrink-0 cursor-pointer rounded-full border border-[#D4AF37]/24 bg-black/25 px-4 py-2.5 text-sm font-black text-[#F2D76B] transition hover:border-[#D4AF37]/55 hover:bg-[#D4AF37]/14"
            >
              +{hiddenCount}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function TypedHeroSection({ section }: { section: TypedHomeSection }) {
  return <FeaturedShowcase section={section} items={section.items.slice(0, 10)} />;
}

function FeaturedShowcase({
  section,
  items,
}: {
  section: TypedHomeSection;
  items: HomeFeedSeries[];
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const featured = items[activeIndex] ?? items[0];
  if (!featured) return null;
  const count = items.length;
  const goTo = (direction: -1 | 1) => {
    if (count <= 1) return;
    setActiveIndex((current) => (current + direction + count) % count);
  };

  return (
    <section
      id={section.id}
      className="relative scroll-mt-24 overflow-hidden rounded-[2rem] border border-white/10 bg-[#080b10] shadow-[0_34px_100px_rgba(0,0,0,0.48)]"
    >
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${imageFor(featured, 0, "banner")})` }}
      />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(5,7,10,0.96),rgba(5,7,10,0.72)_44%,rgba(5,7,10,0.38)),linear-gradient(180deg,rgba(5,7,10,0.22),rgba(5,7,10,0.98)_78%)]" />
      <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-[#D4AF37]/55 to-transparent" />

      <div className="relative z-10 px-5 py-8 md:px-9 md:py-10">
        <div className="grid min-h-[420px] gap-7 lg:grid-cols-[minmax(300px,0.56fr)_minmax(460px,0.74fr)] lg:items-center">
          <div
            key={`${featured.seriesId}-copy`}
            className="animate-in fade-in slide-in-from-left-4 duration-500"
          >
            <SectionHeading
              section={section}
              icon={<Crown className="h-5 w-5" />}
              compact
            />
            <h3 className="mt-8 line-clamp-2 max-w-2xl font-sans text-4xl font-semibold leading-[1.03] text-white md:text-6xl">
              {featured.title}
            </h3>
            <p className="mt-5 line-clamp-3 max-w-xl text-base font-medium leading-relaxed text-white/54">
              {featured.description || section.description}
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-3 text-sm font-bold text-white/65">
              <span className="inline-flex items-center gap-1.5">
                <Eye className="h-4 w-4 text-[#D4AF37]" />
                {formatViews(featured.totalViews, featured.analyticData?.views)}
              </span>
              <span className="rounded-full bg-white/10 px-3 py-1">
                {contentLabel(normalizeKind(featured))}
              </span>
              {featured.ageRating ? (
                <span className="rounded-full bg-[#D4AF37]/16 px-3 py-1 text-[#D4AF37]">
                  {featured.ageRating}
                </span>
              ) : null}
            </div>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href={seriesHref(featured)}
                className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-[#D4AF37] px-5 py-3 text-sm font-black text-black transition hover:bg-[#f1d766]"
              >
                <Play className="h-4 w-4 fill-black" />
                Xem chi tiết
              </Link>
              <button
                type="button"
                className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-white/10 bg-white/8 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/14"
              >
                <BookmarkPlus className="h-4 w-4" />
                Lưu vào thư viện
              </button>
            </div>
          </div>

          <Link
            key={`${featured.seriesId}-preview`}
            href={seriesHref(featured)}
            className="group relative block aspect-video cursor-pointer overflow-hidden rounded-[1.55rem] border border-white/12 bg-white/[0.04] shadow-[0_28px_80px_rgba(0,0,0,0.46)] transition duration-300 animate-in fade-in zoom-in-95 slide-in-from-right-4 hover:-translate-y-1 hover:border-[#D4AF37]/45"
          >
            <div
              className="absolute inset-0 bg-cover bg-center transition duration-700 group-hover:scale-105"
              style={{
                backgroundImage: `url(${imageFor(featured, 0, "banner")})`,
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/88 via-black/20 to-transparent" />
            <CardSunSheen />
            {count > 1 ? (
              <>
                <button
                  type="button"
                  aria-label="Mục trước"
                  onClick={(event) => {
                    event.preventDefault();
                    goTo(-1);
                  }}
                  className="absolute left-4 top-1/2 z-30 flex h-10 w-10 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-white/12 bg-black/55 text-white shadow-[0_0_24px_rgba(0,0,0,0.35)] backdrop-blur-md transition hover:border-[#D4AF37]/50 hover:bg-[#D4AF37] hover:text-black"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  aria-label="Mục tiếp theo"
                  onClick={(event) => {
                    event.preventDefault();
                    goTo(1);
                  }}
                  className="absolute right-4 top-1/2 z-30 flex h-10 w-10 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-white/12 bg-black/55 text-white shadow-[0_0_24px_rgba(0,0,0,0.35)] backdrop-blur-md transition hover:border-[#D4AF37]/50 hover:bg-[#D4AF37] hover:text-black"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </>
            ) : null}
            <div className="absolute bottom-5 left-5 right-5">
              <p className="line-clamp-1 text-xl font-black text-white">
                {featured.title}
              </p>
              <p className="mt-1 text-sm font-bold text-[#D4AF37]">
                {contentLabel(normalizeKind(featured))}
              </p>
            </div>
          </Link>
        </div>

        {items.length > 1 ? (
          <div className="mt-4">
            {items.length <= 4 ? (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 md:gap-5 lg:gap-6">
                {items.map((series, index) => (
                  <StripCard
                    key={series.seriesId}
                    series={series}
                    index={index}
                    active={index === activeIndex}
                    onSelect={() => setActiveIndex(index)}
                    fullWidth
                  />
                ))}
              </div>
            ) : (
              <ScrollableRow>
                {items.map((series, index) => (
                  <StripCard
                    key={series.seriesId}
                    series={series}
                    index={index}
                    active={index === activeIndex}
                    onSelect={() => setActiveIndex(index)}
                  />
                ))}
              </ScrollableRow>
            )}
          </div>
        ) : null}
      </div>
    </section>
  );
}

function StripCard({
  series,
  index,
  active,
  onSelect,
  fullWidth = false,
}: {
  series: HomeFeedSeries;
  index: number;
  active: boolean;
  onSelect: () => void;
  fullWidth?: boolean;
}) {
  const kind = normalizeKind(series);

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`group cursor-pointer text-left ${fullWidth
        ? "w-full min-w-0"
        : "w-[240px] shrink-0 sm:w-[285px] lg:w-[320px]"
        }`}
    >
      <div
        className={`relative aspect-video overflow-hidden rounded-xl border bg-white/[0.04] transition duration-300 group-hover:-translate-y-1 ${active
          ? "border-[#D4AF37]/70 shadow-[0_0_28px_rgba(212,175,55,0.22)]"
          : "border-white/10 group-hover:border-[#D4AF37]/45"
          }`}
      >
        <div
          className="absolute inset-0 bg-cover bg-center transition duration-500 group-hover:scale-105"
          style={{
            backgroundImage: `url(${imageFor(series, index, "banner")})`,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/84 via-black/12 to-transparent" />
        <CardSunSheen />
        <CardNumber value={index + 1} />
        <TypeBadge kind={kind} />
      </div>
      <h4 className="mt-2 line-clamp-1 text-sm font-black text-white">
        {series.title}
      </h4>
    </button>
  );
}

function TypedRankingSection({ section }: { section: TypedHomeSection }) {
  const items = section.items.slice(0, 7);
  const [activeIndex, setActiveIndex] = useState(0);
  const featured = items[activeIndex] ?? items[0];
  if (!featured) return null;

  const featuredKind = normalizeKind(featured);

  return (
    <motion.section
      id={section.id}
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-90px" }}
      transition={{ duration: 0.55, ease: "easeOut" }}
      className="group relative scroll-mt-24 overflow-hidden rounded-[1.8rem] border border-[#D4AF37]/20 bg-[#030406] shadow-[0_24px_80px_rgba(0,0,0,0.36)]"
    >
      <div
        className="absolute inset-0 bg-cover bg-center opacity-34 transition duration-700 group-hover:scale-[1.012]"
        style={{
          backgroundImage: `url(${imageFor(featured, activeIndex, "banner")})`,
        }}
      />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(3,4,6,0.9)_0%,rgba(3,4,6,0.52)_36%,rgba(3,4,6,0.82)_72%,rgba(3,4,6,0.98)_100%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(212,175,55,0.14),transparent_42%),linear-gradient(90deg,rgba(3,4,6,0.92),rgba(3,4,6,0.38)_48%,rgba(3,4,6,0.92))]" />
      <div className="pointer-events-none absolute inset-x-7 top-0 h-px bg-gradient-to-r from-transparent via-[#D4AF37]/70 to-transparent" />
      <div className="pointer-events-none absolute inset-x-10 bottom-0 h-px bg-gradient-to-r from-transparent via-white/18 to-transparent" />
      <div className="pointer-events-none absolute left-8 right-8 top-16 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-36 bg-[linear-gradient(180deg,transparent,rgba(10,13,18,0.9)),repeating-linear-gradient(100deg,rgba(255,255,255,0.08)_0_1px,transparent_1px_18px)] opacity-35" />

      <div className="relative px-5 py-5 md:px-7 md:py-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="inline-flex items-center gap-3 rounded-full border border-[#D4AF37]/22 bg-black/32 px-4 py-2 shadow-[0_0_26px_rgba(212,175,55,0.12)] backdrop-blur">
            <span className="h-px w-8 bg-gradient-to-r from-transparent to-[#D4AF37]/70" />
            <SectionHeading
              section={section}
              icon={getSectionIcon(section.poolKey)}
              compact
            />
            <span className="h-px w-8 bg-gradient-to-l from-transparent to-[#D4AF37]/70" />
          </div>
          <p className="max-w-xl text-xs font-bold uppercase tracking-[0.24em] text-white/34">
            Gallery xu hướng TaleX
          </p>
        </div>

        <div
          className="relative mt-7 overflow-x-auto overflow-y-visible pb-4 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
          onMouseLeave={() => setActiveIndex(0)}
        >
          <div className="mx-auto flex min-w-max items-end justify-center gap-4 px-2 md:min-w-0 md:gap-5 lg:gap-6">
            {items.map((series, index) => (
              <NetflixRankCard
                key={series.seriesId}
                series={series}
                index={index}
                rank={index + 1}
                active={index === activeIndex}
                onPreview={() => {
                  if (activeIndex !== index) setActiveIndex(index);
                }}
              />
            ))}
          </div>
        </div>

        <div className="relative mt-1 min-h-[230px] overflow-hidden rounded-2xl border border-white/10 bg-black/38 p-4 shadow-[0_16px_46px_rgba(0,0,0,0.28)] backdrop-blur-md sm:min-h-[214px] md:min-h-[198px] md:p-5 lg:min-h-[158px]">
          <div className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-[#D4AF37]/55 to-transparent" />
          <div className="flex h-full flex-col gap-4 lg:flex-row lg:items-stretch lg:justify-between">
            <div className="flex min-w-0 flex-1 flex-col justify-center">
              <div className="flex min-h-[28px] flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#D4AF37] px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-black shadow-[0_0_28px_rgba(212,175,55,0.24)]">
                  <TrendingUp className="h-3.5 w-3.5" />
                  #{activeIndex + 1} Xu hướng
                </span>
                <span className="rounded-full border border-white/14 bg-white/[0.08] px-3 py-1 text-xs font-black text-white/78">
                  {contentLabel(featuredKind)}
                </span>
                {featured.ageRating ? (
                  <span className="rounded-full border border-[#D4AF37]/28 bg-[#D4AF37]/12 px-3 py-1 text-xs font-black text-[#F2D76B]">
                    {featured.ageRating}
                  </span>
                ) : null}
                <span className="inline-flex items-center gap-1.5 text-xs font-black text-white/62">
                  <Eye className="h-3.5 w-3.5 text-[#D4AF37]" />
                  {formatViews(featured.totalViews, featured.analyticData?.views)}
                </span>
              </div>
              <h3 className="mt-3 min-h-[32px] line-clamp-1 font-sans text-2xl font-black leading-tight text-white md:min-h-[38px] md:text-3xl">
                {featured.title}
              </h3>
              <p className="mt-2 min-h-[48px] max-w-3xl text-sm font-semibold leading-6 text-white/52 line-clamp-2">
                {featured.description || section.description || contentLabel(featuredKind)}
              </p>
            </div>

            <div className="flex shrink-0 flex-wrap items-center gap-3 lg:justify-end">
              <div className="hidden items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-2.5 md:flex">
                <Eye className="h-4 w-4 text-[#D4AF37]" />
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.14em] text-white/34">
                    Trending pool
                  </p>
                  <p className="text-sm font-black text-white">Top {items.length}</p>
                </div>
              </div>
              <Link
                href={seriesHref(featured)}
                className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-full bg-[#D4AF37] px-5 text-sm font-black text-black shadow-[0_0_30px_rgba(212,175,55,0.24)] transition hover:bg-[#f2d761] hover:shadow-[0_0_42px_rgba(212,175,55,0.36)]"
              >
                <Play className="h-4 w-4 fill-current" />
                Xem chi tiết
              </Link>
              <Link
                href={seriesHref(featured)}
                className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-full border border-white/14 bg-white/[0.08] px-5 text-sm font-black text-white backdrop-blur transition hover:border-[#D4AF37]/40 hover:bg-white/[0.13]"
              >
                <ArrowRight className="h-4 w-4" />
                Mở trang
              </Link>
            </div>
          </div>
        </div>
      </div>
    </motion.section>
  );
}

function TypedRowSection({ section }: { section: TypedHomeSection }) {
  return (
    <section
      id={section.id}
      className="relative scroll-mt-24 overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#101012]/86 p-5 md:p-6"
    >
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,rgba(212,175,55,0.12),transparent_34%),radial-gradient(circle_at_90%_18%,rgba(255,255,255,0.08),transparent_28%)]" />
      <div className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-white/18 to-transparent" />
      <div className="relative">
        <SectionHeading
          section={section}
          icon={getSectionIcon(section.poolKey)}
        />
        <ScrollableRow>
          {section.items.map((series, index) => (
            <LandscapeCard key={series.seriesId} series={series} index={index} />
          ))}
        </ScrollableRow>
      </div>
    </section>
  );
}

function TypedSpotlightSection({ section }: { section: TypedHomeSection }) {
  const featured = section.items[0];
  const rest = section.items.slice(1, 5);
  if (!featured) return null;

  return (
    <section
      id={section.id}
      className="group relative scroll-mt-24 overflow-hidden rounded-[1.6rem] border border-[#D4AF37]/18 bg-[#101012] shadow-[0_24px_80px_rgba(0,0,0,0.34)]"
    >
      <div
        className="absolute inset-0 bg-cover bg-center opacity-58 transition duration-700 group-hover:scale-[1.02]"
        style={{
          backgroundImage: `url(${imageFor(featured, 0, "banner")})`,
        }}
      />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.9)_0%,rgba(0,0,0,0.68)_38%,rgba(0,0,0,0.28)_72%,rgba(0,0,0,0.76)_100%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(11,11,13,0.14)_0%,rgba(11,11,13,0.5)_52%,rgba(11,11,13,0.96)_100%)]" />
      <div className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-[#D4AF37]/70 to-transparent" />
      <div className="pointer-events-none absolute -left-24 top-10 h-52 w-52 rounded-full bg-[#D4AF37]/18 blur-3xl" />
      <div className="relative min-h-[520px] p-5 md:p-7 lg:p-9">
        <div className="max-w-2xl pt-6 md:pt-10">
          <SectionHeading
            section={section}
            icon={getSectionIcon(section.poolKey)}
            compact
          />
          <h3 className="mt-5 max-w-3xl text-4xl font-black leading-[0.96] text-white drop-shadow-[0_12px_32px_rgba(0,0,0,0.62)] md:text-6xl">
            {featured.title}
          </h3>
          <div className="mt-5 flex flex-wrap items-center gap-3 text-sm font-black text-white">
            {featured.ageRating ? (
              <span className="rounded-md bg-[#D4AF37] px-3 py-1 text-black">
                {featured.ageRating}
              </span>
            ) : null}
            <span>{contentLabel(normalizeKind(featured))}</span>
            {featured.language ? <span>{featured.language}</span> : null}
          </div>
          <p className="mt-4 line-clamp-3 max-w-xl text-sm font-semibold leading-relaxed text-white/70 md:text-base">
            {featured.description || section.description}
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link
              href={seriesHref(featured)}
              className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-[#D4AF37] px-5 py-2.5 text-sm font-black text-black shadow-[0_0_28px_rgba(212,175,55,0.34)] transition hover:bg-[#f2d761] hover:shadow-[0_0_42px_rgba(212,175,55,0.48)]"
            >
              <Play className="h-4 w-4 fill-current" />
              Khám phá
            </Link>
            <Link
              href={seriesHref(featured)}
              className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-white/18 bg-white/[0.08] px-5 py-2.5 text-sm font-black text-white backdrop-blur transition hover:border-white/32 hover:bg-white/[0.14]"
            >
              <BookmarkPlus className="h-4 w-4" />
              Lưu lại
            </Link>
          </div>
        </div>

        <div className="mt-10 grid gap-4 lg:grid-cols-2 xl:max-w-5xl">
          {rest.map((series, index) => (
            <Link
              key={`${series.seriesId}-${index}`}
              href={seriesHref(series)}
              className="group/card grid cursor-pointer grid-cols-[112px_minmax(0,1fr)] overflow-hidden rounded-2xl border border-white/10 bg-white/[0.07] shadow-[0_18px_42px_rgba(0,0,0,0.24)] backdrop-blur transition duration-300 hover:-translate-y-1 hover:border-[#D4AF37]/45 hover:bg-white/[0.1]"
            >
              <div className="relative min-h-[92px] overflow-hidden">
                <div
                  className="absolute inset-0 bg-cover bg-center transition duration-500 group-hover/card:scale-110"
                  style={{
                    backgroundImage: `url(${imageFor(series, index + 1, "banner")})`,
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/55 to-transparent" />
              </div>
              <div className="flex min-w-0 flex-col justify-center px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <h4 className="line-clamp-1 text-base font-black text-white">
                    {series.title}
                  </h4>
                  <span className="shrink-0 text-xs font-black text-white/58">
                    {formatViews(series.totalViews, series.analyticData?.views)}
                  </span>
                </div>
                <p className="mt-1 line-clamp-2 text-xs font-semibold leading-relaxed text-white/48">
                  {series.description || contentLabel(normalizeKind(series))}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function MixedRecommendationSection({
  fallbackItems = [],
}: {
  fallbackItems?: HomeFeedSeries[];
}) {
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const {
    data: feedData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useRecommendationFeedInfinite(12, "HOME", {
    forceNewSessionOnMount: true,
  });

  const fetchedItems = useMemo(() => {
    return feedData?.pages.flatMap((page) => page.items) ?? [];
  }, [feedData]);

  const items = fetchedItems.length > 0 ? fetchedItems : fallbackItems;

  useEffect(() => {
    const target = loadMoreRef.current;
    if (!target || !hasNextPage || isFetchingNextPage) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting && hasNextPage && !isFetchingNextPage) {
          void fetchNextPage();
        }
      },
      { rootMargin: "520px 0px 520px 0px" },
    );

    observer.observe(target);

    return () => {
      observer.disconnect();
    };
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (isLoading && items.length === 0) {
    return (
      <section id="mixed-recommendations" className="scroll-mt-24">
        <div className="mb-5 flex items-end justify-between gap-4">
          <SectionHeading
            section={{
              eyebrow: "",
              title: "Đề xuất cho bạn",
              description: "",
            }}
            icon={<Sparkles className="h-5 w-5" />}
          />
        </div>
        <MixedRecommendationSkeleton />
      </section>
    );
  }

  if (items.length === 0) return null;

  return (
    <section id="mixed-recommendations" className="scroll-mt-24">
      <div className="mb-5 flex items-end justify-between gap-4">
        <SectionHeading
          section={{
            eyebrow: "",
            title: "Đề xuất cho bạn",
            description: "",
          }}
          icon={<Sparkles className="h-5 w-5" />}
        />
      </div>

      <div className="grid grid-cols-1 gap-x-4 gap-y-9 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {items.map((series, index) => (
          <MixedRecommendationCard
            key={`${series.seriesId}-${index}`}
            series={series}
            index={index}
          />
        ))}
      </div>

      {isFetchingNextPage ? <MixedRecommendationSkeleton /> : null}

      <div
        ref={loadMoreRef}
        className="flex min-h-16 items-center justify-center py-6"
      >
        {hasNextPage && !isFetchingNextPage ? (
          <span className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-bold text-white/38">
            Đang tải thêm đề xuất cá nhân hóa...
          </span>
        ) : null}
      </div>
    </section>
  );
}

function ScrollableRow({ children }: { children: ReactNode }) {
  const rowRef = useRef<HTMLDivElement | null>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollState = () => {
    const row = rowRef.current;
    if (!row) return;

    setCanScrollLeft(row.scrollLeft > 2);
    setCanScrollRight(row.scrollLeft + row.clientWidth < row.scrollWidth - 2);
  };

  const scrollByPage = (direction: -1 | 1) => {
    const row = rowRef.current;
    if (!row) return;

    row.scrollBy({
      left: direction * Math.min(row.clientWidth * 0.88, 760),
      behavior: "smooth",
    });
  };

  useEffect(() => {
    const row = rowRef.current;
    if (!row) return;

    updateScrollState();
    const resizeObserver = new ResizeObserver(updateScrollState);
    resizeObserver.observe(row);
    row.addEventListener("scroll", updateScrollState, { passive: true });

    return () => {
      resizeObserver.disconnect();
      row.removeEventListener("scroll", updateScrollState);
    };
  }, []);

  return (
    <div className="relative mt-5">
      {canScrollLeft ? (
        <button
          type="button"
          aria-label="Cuộn về trước"
          onClick={() => scrollByPage(-1)}
          className="absolute left-2 top-1/2 z-20 hidden h-10 w-10 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-white/10 bg-black/65 text-white shadow-xl backdrop-blur-md transition hover:bg-[#D4AF37] hover:text-black md:flex"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
      ) : null}
      {canScrollRight ? (
        <button
          type="button"
          aria-label="Cuộn tiếp"
          onClick={() => scrollByPage(1)}
          className="absolute right-2 top-1/2 z-20 hidden h-10 w-10 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-white/10 bg-black/65 text-white shadow-xl backdrop-blur-md transition hover:bg-[#D4AF37] hover:text-black md:flex"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      ) : null}
      <div
        ref={rowRef}
        className="flex gap-6 overflow-x-auto scroll-smooth pb-2 md:gap-7 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
      >
        {children}
      </div>
    </div>
  );
}

function NetflixRankCard({
  series,
  index,
  rank,
  active,
  onPreview,
}: {
  series: HomeFeedSeries;
  index: number;
  rank: number;
  active?: boolean;
  onPreview?: () => void;
}) {
  const stageCenter = 3;
  const distance = Math.abs(index - stageCenter);
  const cardStyle: CSSProperties = {
    transform: `perspective(900px) rotateY(${(stageCenter - index) * 4}deg) translateY(${active ? -10 : distance * 5}px)`,
    transformOrigin: "center bottom",
  };

  return (
    <Link
      href={seriesHref(series)}
      onMouseEnter={onPreview}
      onFocus={onPreview}
      className="group group/rank relative w-[132px] shrink-0 cursor-pointer transition-transform duration-300 ease-out sm:w-[150px] md:w-[166px]"
      style={cardStyle}
    >
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.32, delay: index * 0.04, ease: "easeOut" }}
        className={`relative transition-transform duration-300 ease-out ${
          active
            ? "-translate-y-2 scale-[1.06]"
            : "group-hover/rank:-translate-y-1 group-hover/rank:scale-[1.025]"
        }`}
      >
        <p
          className={`mb-2 line-clamp-1 text-center font-sans text-[10px] font-black uppercase tracking-[0.14em] transition ${
            active ? "text-[#F2D76B]" : "text-white/44 group-hover/rank:text-white/70"
          }`}
        >
          {series.title}
        </p>
        <div
          className={`relative aspect-[3/4] overflow-hidden rounded-[1.1rem] border bg-white/[0.04] shadow-[0_20px_46px_rgba(0,0,0,0.44)] transition duration-300 ${
            active
              ? "border-[#D4AF37]/80 shadow-[0_0_0_1px_rgba(212,175,55,0.28),0_0_34px_rgba(212,175,55,0.28),0_24px_54px_rgba(0,0,0,0.46)]"
              : "border-white/12 group-hover/rank:border-[#D4AF37]/46"
          }`}
        >
          <div
            className="absolute inset-0 bg-cover bg-center transition duration-500 group-hover/rank:scale-105"
            style={{
              backgroundImage: `url(${imageFor(series, index, "cover")})`,
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/86 via-black/16 to-black/8" />
          <CardSunSheen />
          <span
            className={`absolute left-2 top-2 z-10 rounded-full px-2 py-1 text-[10px] font-black backdrop-blur ${
              active
                ? "bg-[#D4AF37] text-black"
                : "bg-black/62 text-white/82"
            }`}
          >
            #{rank}
          </span>
          <span className="absolute bottom-2 left-2 right-2 z-10 rounded-xl border border-white/10 bg-black/54 px-2 py-1.5 text-center text-[10px] font-black text-white/78 backdrop-blur">
            {contentLabel(normalizeKind(series))}
          </span>
        </div>
        <div
          aria-hidden="true"
          className={`mx-auto mt-2 h-8 w-[78%] rounded-[50%] blur-md transition ${
            active ? "bg-[#D4AF37]/24" : "bg-white/10 group-hover/rank:bg-[#D4AF37]/16"
          }`}
        />
      </motion.div>
    </Link>
  );
}

function LandscapeCard({
  series,
  index,
}: {
  series: HomeFeedSeries;
  index: number;
}) {
  const kind = normalizeKind(series);

  return (
    <Link
      href={seriesHref(series)}
      className="group w-[260px] shrink-0 sm:w-[320px] lg:w-[360px]"
    >
      <div className="relative aspect-video overflow-hidden rounded-xl border border-white/10 bg-white/[0.04]">
        <div
          className="absolute inset-0 bg-cover bg-center transition duration-500 group-hover:scale-105"
          style={{ backgroundImage: `url(${imageFor(series, index)})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/10" />
        <CardSunSheen />
        <CardStar rating={series.averageRating} />
        <CardNumber value={index + 1} />
        <TypeBadge kind={kind} />
        {series.ageRating ? <AgeBadge value={series.ageRating} /> : null}
      </div>
      <SeriesMeta series={series} />
    </Link>
  );
}

function MixedRecommendationCard({
  series,
  index,
}: {
  series: HomeFeedSeries;
  index: number;
}) {
  const kind = normalizeKind(series);

  return (
    <Link href={seriesHref(series)} className="group">
      <div className="relative aspect-video overflow-hidden rounded-xl bg-white/[0.04]">
        <div
          className="absolute inset-0 bg-cover bg-center transition duration-500 group-hover:scale-105"
          style={{ backgroundImage: `url(${imageFor(series, index)})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />
        <CardSunSheen />
        <CardStar rating={series.averageRating} />
        <TypeBadge kind={kind} />
      </div>
      <div className="mt-3 flex gap-3">
        <CreatorAvatar series={series} />
        <div className="min-w-0">
          <h3 className="line-clamp-2 text-sm font-black leading-snug text-white">
            {series.title}
          </h3>
          <p className="mt-1 truncate text-sm font-semibold text-white/45">
            {series.creatorName || "TaleX Creator"}
          </p>
          <p className="mt-0.5 text-xs font-bold text-white/38">
            {formatViews(series.totalViews, series.analyticData?.views)}
          </p>
        </div>
      </div>
    </Link>
  );
}

function SeriesMeta({ series }: { series: HomeFeedSeries }) {
  return (
    <div className="mt-3 flex gap-3">
      <CreatorAvatar series={series} />
      <div className="min-w-0">
        <h3 className="line-clamp-2 text-sm font-black leading-snug text-white">
          {series.title}
        </h3>
        <p className="mt-1 truncate text-sm font-semibold text-white/45">
          {series.creatorName || "TaleX Creator"}
        </p>
        <p className="mt-0.5 text-xs font-bold text-white/38">
          {formatViews(series.totalViews, series.analyticData?.views)}
        </p>
      </div>
    </div>
  );
}

function CreatorAvatar({ series }: { series: HomeFeedSeries }) {
  if (series.creatorAvatar) {
    return (
      <div
        className="h-9 w-9 shrink-0 rounded-full bg-cover bg-center ring-1 ring-white/10"
        style={{ backgroundImage: `url(${series.creatorAvatar})` }}
      />
    );
  }

  return (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#D4AF37]/15 text-xs font-black text-[#D4AF37] ring-1 ring-[#D4AF37]/25">
      {(series.creatorName || "T").slice(0, 1).toUpperCase()}
    </div>
  );
}

function CardStar({ rating }: { rating?: number }) {
  return (
    <span className="absolute right-2 top-2 z-10 flex h-7 items-center gap-1 rounded-full border border-[#D4AF37]/35 bg-black/60 px-2 text-[#D4AF37] shadow-lg backdrop-blur-md">
      <Star className="h-3.5 w-3.5 fill-[#D4AF37]" />
      {rating != null && rating > 0 ? (
        <span className="text-[11px] font-black text-white">{rating.toFixed(1)}</span>
      ) : null}
    </span>
  );
}

function CardNumber({ value }: { value: number }) {
  return (
    <span className="absolute left-2 top-2 z-10 rounded-full bg-black/65 px-2 py-1 text-[10px] font-black text-white/75 backdrop-blur-md">
      {String(value).padStart(2, "0")}
    </span>
  );
}

function TypeBadge({ kind }: { kind: FeedKind }) {
  return (
    <span className="absolute bottom-2 right-2 rounded-md bg-black/75 px-2 py-1 text-[11px] font-black text-white shadow-lg backdrop-blur">
      {contentLabel(kind)}
    </span>
  );
}

function AgeBadge({ value }: { value: string }) {
  return (
    <span className="absolute bottom-2 left-2 rounded-md bg-[#D4AF37] px-2 py-1 text-[10px] font-black text-black">
      {value}
    </span>
  );
}

function CardSunSheen() {
  return (
    <span className="pointer-events-none absolute -left-20 -top-24 z-[8] h-[180%] w-12 -translate-x-full rotate-12 bg-gradient-to-r from-transparent via-white/18 to-transparent opacity-0 blur-[1px] transition-all duration-700 ease-out group-hover:translate-x-[760%] group-hover:opacity-100" />
  );
}

function SectionHeading({
  section,
  icon,
  compact = false,
}: {
  section: Pick<TypedHomeSection, "eyebrow" | "title" | "description">;
  icon: ReactNode;
  compact?: boolean;
}) {
  return (
    <div>
      <div className="flex items-center gap-3">
        <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-[#D4AF37]/22 bg-[#D4AF37]/10 text-[#D4AF37] shadow-[0_0_20px_rgba(212,175,55,0.12)]">
          {icon}
        </span>
        <div className="min-w-0">
          {section.eyebrow ? (
            <p className="mb-1 text-[11px] font-black uppercase tracking-[0.22em] text-[#D4AF37]">
              {section.eyebrow}
            </p>
          ) : null}
          <h2 className="bg-[linear-gradient(110deg,rgba(255,255,255,0.76),rgba(255,255,255,0.76),rgba(212,175,55,0.92),rgba(151,176,255,0.7),rgba(255,255,255,0.76))] bg-[length:220%_100%] bg-clip-text font-sans text-2xl font-semibold tracking-normal text-white/82 transition-[color,filter] duration-300 hover:text-transparent hover:drop-shadow-[0_0_18px_rgba(212,175,55,0.18)] md:text-4xl">
            {section.title}
          </h2>
        </div>
      </div>
      {!compact && section.description ? (
        <p className="mt-2 text-sm font-medium text-white/38">
          {section.description}
        </p>
      ) : null}
    </div>
  );
}

function HomeFeedSkeleton() {
  return (
    <div className="mt-8 flex flex-col gap-8 pb-24">
      <div className="flex gap-3 overflow-hidden">
        {Array.from({ length: 7 }).map((_, index) => (
          <div
            key={index}
            className="h-11 w-28 shrink-0 animate-pulse rounded-xl bg-white/[0.06]"
          />
        ))}
      </div>
      <div className="h-[360px] animate-pulse rounded-3xl border border-[#D4AF37]/10 bg-white/[0.04]" />
      <MixedRecommendationSkeleton />
    </div>
  );
}

function MixedRecommendationSkeleton() {
  return (
    <div className="mt-8 grid grid-cols-1 gap-x-4 gap-y-9 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      {Array.from({ length: 8 }).map((_, index) => (
        <div key={index}>
          <div className="aspect-video animate-pulse rounded-xl bg-white/[0.08]" />
          <div className="mt-3 flex gap-3">
            <div className="h-9 w-9 shrink-0 animate-pulse rounded-full bg-white/[0.08]" />
            <div className="min-w-0 flex-1 space-y-2">
              <div className="h-4 w-4/5 animate-pulse rounded bg-white/[0.08]" />
              <div className="h-3 w-3/5 animate-pulse rounded bg-white/[0.06]" />
              <div className="h-3 w-2/5 animate-pulse rounded bg-white/[0.05]" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
