"use client";

import Link from "next/link";
import {
  Fragment,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
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
  Film,
  Filter,
  Play,
  RefreshCw,
  Sparkles,
  Star,
  TrendingUp,
  X,
} from "lucide-react";
import {
  DEFAULT_HOME_FEED_LIMITS,
} from "../api/home-feed.api";
import { useHomeFeed } from "../hooks/use-home-feed";
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
  kind: FeedKind;
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
];

const RECOMMENDATION_POOLS: HomeFeedPoolKey[] = [
  "latestCommunityChoice",
  "communityChoice",
];

const MIXED_RECOMMENDATION_LIMIT = 10;
const MIXED_INITIAL_VISIBLE = 10;
const MIXED_LOAD_STEP = 8;
const MIN_RECOMMENDATION_AFTER_DEDUPE = 8;

const poolCopy: Record<
  HomeFeedPoolKey,
  {
    eyebrow: string;
    comicTitle: string;
    videoTitle: string;
    description: string;
    variant: SectionVariant;
  }
> = {
  promoted: {
    eyebrow: "TaleX chọn lọc",
    comicTitle: "Truyện nổi bật hôm nay",
    videoTitle: "Phim nổi bật hôm nay",
    description: "Những nội dung đang được TaleX ưu tiên giới thiệu.",
    variant: "hero",
  },
  trending: {
    eyebrow: "Đang tăng nhiệt",
    comicTitle: "Truyện tranh thịnh hành",
    videoTitle: "Video thịnh hành",
    description: "Các series đang có tín hiệu nổi bật trong cộng đồng.",
    variant: "ranking",
  },
  newReleases: {
    eyebrow: "Vừa ra mắt",
    comicTitle: "Truyện mới ra mắt",
    videoTitle: "Phim mới ra mắt",
    description: "Những series mới được phát hành gần đây.",
    variant: "row",
  },
  recentlyUpdated: {
    eyebrow: "Có cập nhật",
    comicTitle: "Truyện vừa cập nhật",
    videoTitle: "Phim vừa cập nhật",
    description: "Các series vừa có hoạt động mới trên hệ thống.",
    variant: "row",
  },
  latestCommunityChoice: {
    eyebrow: "Dành cho bạn",
    comicTitle: "Đề xuất truyện",
    videoTitle: "Đề xuất video",
    description: "Các nội dung được TaleX gợi ý dựa trên tín hiệu cộng đồng.",
    variant: "row",
  },
  communityChoice: {
    eyebrow: "Dành cho bạn",
    comicTitle: "Đề xuất truyện",
    videoTitle: "Đề xuất video",
    description: "Các nội dung được TaleX gợi ý dựa trên tín hiệu cộng đồng.",
    variant: "row",
  },
  randomCategory: {
    eyebrow: "Khám phá thêm",
    comicTitle: "Khám phá truyện tranh",
    videoTitle: "Khám phá phim bộ",
    description: "Một góc nội dung khác để đổi vị nhẹ nhàng.",
    variant: "spotlight",
  },
  accountSubscription: {
    eyebrow: "Kênh theo dõi",
    comicTitle: "Truyện từ kênh bạn theo dõi",
    videoTitle: "Video từ kênh bạn theo dõi",
    description: "Các cập nhật từ những kênh bạn đã đăng ký.",
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

  const videoSections: TypedHomeSection[] = [];
  const comicSections: TypedHomeSection[] = [];

  CHANNEL_POOL_ORDER.forEach((poolKey) => {
    const config = poolCopy[poolKey];
    const items = uniqueSeries(feed[poolKey] ?? []);
    const comics = items.filter((item) => normalizeKind(item) === "COMIC");
    const videos = items.filter((item) => normalizeKind(item) === "VIDEO");

    if (videos.length > 0) {
      videoSections.push({
        id: `${poolKey}-video`,
        poolKey,
        kind: "VIDEO",
        eyebrow: config.eyebrow,
        title: config.videoTitle,
        description: config.description,
        items: videos,
        variant: config.variant,
      });
    }

    if (comics.length > 0) {
      comicSections.push({
        id: `${poolKey}-comic`,
        poolKey,
        kind: "COMIC",
        eyebrow: config.eyebrow,
        title: config.comicTitle,
        description: config.description,
        items: comics,
        variant: config.variant,
      });
    }
  });

  return [...videoSections, ...comicSections];
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

  if (
    fresh.length >= MIN_RECOMMENDATION_AFTER_DEDUPE ||
    fresh.length === raw.length
  ) {
    return fresh;
  }

  const duplicateFallback = raw.filter((series) =>
    channelIds.has(series.seriesId),
  );

  return uniqueSeries([...fresh, ...duplicateFallback]);
}

function formatViews(value?: number) {
  if (typeof value !== "number") return "0 lượt xem";
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(value >= 10_000_000 ? 0 : 1)} Tr lượt xem`;
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(value >= 10_000 ? 0 : 1)} N lượt xem`;
  }
  return `${value} lượt xem`;
}

function contentLabel(kind: FeedKind) {
  return kind === "COMIC" ? "Truyện tranh" : "Phim bộ";
}

export function HomeFeed({
  promotedComicAfter,
}: {
  promotedComicAfter?: ReactNode;
}) {
  const [visibleRecommendationCount, setVisibleRecommendationCount] = useState(
    MIXED_INITIAL_VISIBLE,
  );
  const [isAppending, setIsAppending] = useState(false);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const appendTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const appendingRef = useRef(false);
  const queryParams = useMemo<HomeFeedRequest>(
    () => ({
      ...DEFAULT_HOME_FEED_LIMITS,
      latestCommunityChoiceLimit: MIXED_RECOMMENDATION_LIMIT,
      communityChoiceLimit: MIXED_RECOMMENDATION_LIMIT,
    }),
    [],
  );
  const { data: feed, isError, isLoading, refetch } = useHomeFeed(queryParams);
  const channelSections = useMemo(() => buildChannelSections(feed), [feed]);
  const firstVideoSectionIndex = channelSections.findIndex(
    (section) => section.kind === "VIDEO",
  );
  const firstComicSectionIndex = channelSections.findIndex(
    (section) => section.kind === "COMIC",
  );
  const mixedRecommendations = useMemo(
    () => buildMixedRecommendations(feed, channelSections),
    [feed, channelSections],
  );
  const visibleRecommendations = mixedRecommendations.slice(
    0,
    visibleRecommendationCount,
  );
  const canRevealMore =
    visibleRecommendationCount < mixedRecommendations.length;
  const navSections = useMemo(
    () => [
      ...channelSections,
      ...(mixedRecommendations.length > 0
        ? [
            {
              id: "mixed-recommendations",
              title: "Đề xuất cho bạn",
            },
          ]
        : []),
    ],
    [channelSections, mixedRecommendations.length],
  );

  useEffect(() => {
    const target = loadMoreRef.current;
    if (!target || !canRevealMore) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting || appendingRef.current) return;

        appendingRef.current = true;
        setIsAppending(true);
        appendTimerRef.current = setTimeout(() => {
          setVisibleRecommendationCount((current) =>
            Math.min(current + MIXED_LOAD_STEP, mixedRecommendations.length),
          );
          appendingRef.current = false;
          setIsAppending(false);
        }, 420);
      },
      { rootMargin: "520px 0px 520px 0px" },
    );

    observer.observe(target);

    return () => {
      observer.disconnect();
      if (appendTimerRef.current) {
        clearTimeout(appendTimerRef.current);
        appendTimerRef.current = null;
      }
      appendingRef.current = false;
    };
  }, [canRevealMore, mixedRecommendations.length]);

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

      {channelSections.map((section, index) => {
        let content: ReactNode;
        const isFirstVideoSection = index === firstVideoSectionIndex;
        const isFirstComicSection = index === firstComicSectionIndex;

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
            {isFirstVideoSection ? (
              <>
                <ContinueWatching />
                <HomeFeedZoneTitle
                  icon={<Film className="h-5 w-5" />}
                  title="Khu vực phim bộ"
                  description="Các nội dung video đang nổi bật, thịnh hành và mới cập nhật trên TaleX."
                />
              </>
            ) : null}
            {isFirstComicSection && promotedComicAfter ? (
              <CompactSponsorFrame>{promotedComicAfter}</CompactSponsorFrame>
            ) : null}
            {isFirstComicSection ? (
              <HomeFeedZoneTitle
                icon={<BookOpen className="h-5 w-5" />}
                title="Khu vực truyện tranh"
                description="Các series truyện được sắp xếp riêng để người đọc dễ khám phá hơn."
              />
            ) : null}
            {content}
            {shouldShowHomeAdBreak(index, channelSections.length) ? (
              <HomeChannelAdBreak index={index} />
            ) : null}
          </Fragment>
        );
      })}

      {mixedRecommendations.length > 0 ? (
        <MixedRecommendationSection
          items={visibleRecommendations}
          canRevealMore={canRevealMore}
          isAppending={isAppending}
          loadMoreRef={loadMoreRef}
        />
      ) : null}
    </div>
  );
}

function shouldShowHomeAdBreak(index: number, total: number) {
  if (total <= 1) return index === 0;
  if (index === 1) return true;
  return total >= 5 && index === 3;
}

function HomeFeedZoneTitle({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-[1.35rem] border border-[#D4AF37]/16 bg-[linear-gradient(115deg,rgba(212,175,55,0.14),rgba(255,255,255,0.055)_38%,rgba(91,112,184,0.12)_74%,rgba(12,12,14,0.9))] px-5 py-4 shadow-[0_16px_44px_rgba(0,0,0,0.24)]">
      <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-[#D4AF37]/55 to-transparent" />
      <div className="pointer-events-none absolute -right-8 -top-10 h-28 w-28 rounded-full bg-[#D4AF37]/12 blur-3xl" />
      <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-[#D4AF37]/24 bg-[#D4AF37]/12 text-[#F4D663] shadow-[0_0_22px_rgba(212,175,55,0.12)]">
            {icon}
          </span>
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#D4AF37]">
              TaleX zone
            </p>
            <h2 className="mt-1 bg-[linear-gradient(110deg,rgba(255,255,255,0.9),rgba(255,255,255,0.72),rgba(212,175,55,0.95))] bg-clip-text text-2xl font-black text-transparent md:text-3xl">
              {title}
            </h2>
            <p className="mt-1 max-w-3xl text-sm font-semibold leading-relaxed text-white/46">
              {description}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
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
  const featured = section.items[0];
  const supporting = section.items.slice(1, 10);
  if (!featured) return null;
  const heroItems = section.items.slice(0, 10);

  if (section.kind === "COMIC") {
    return <ComicFeaturedShowcase section={section} items={heroItems} />;
  }

  if (section.kind === "VIDEO") {
    return <VideoFeaturedShowcase section={section} items={heroItems} />;
  }

  return (
    <section
      id={section.id}
      className="relative scroll-mt-24 overflow-hidden rounded-[2rem] border border-white/10 bg-[#0b0b0d] p-4 shadow-[0_30px_90px_rgba(0,0,0,0.42)] md:p-6"
    >
      <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-[#D4AF37]/50 to-transparent" />
      <div className="pointer-events-none absolute -right-24 top-10 h-72 w-72 rounded-full border border-[#D4AF37]/12" />
      <div className="relative grid gap-7 lg:grid-cols-[minmax(300px,0.52fr)_minmax(560px,1fr)] lg:items-center">
        <div
          className="absolute inset-0 -m-7 bg-cover bg-center opacity-20 blur-[1px]"
          style={{ backgroundImage: `url(${imageFor(featured, 0)})` }}
        />
        <div className="absolute inset-0 -m-7 bg-[radial-gradient(circle_at_15%_18%,rgba(212,175,55,0.22),transparent_30%),radial-gradient(circle_at_90%_20%,rgba(99,137,255,0.16),transparent_32%),linear-gradient(90deg,rgba(9,9,10,0.98),rgba(9,9,10,0.86)_48%,rgba(9,9,10,0.96))]" />

        <div className="relative z-10 max-w-2xl py-4 lg:py-8">
          <SectionHeading
            section={section}
            icon={<Crown className="h-5 w-5" />}
          />
          <h3 className="mt-8 line-clamp-2 bg-[linear-gradient(110deg,rgba(255,255,255,0.92),rgba(255,255,255,0.92),rgba(212,175,55,0.85),rgba(255,255,255,0.86))] bg-[length:220%_100%] bg-clip-text font-sans text-4xl font-semibold leading-[1.03] tracking-normal text-white/92 transition-[color,filter] duration-300 hover:text-transparent hover:drop-shadow-[0_0_20px_rgba(212,175,55,0.18)] md:text-5xl">
            {featured.title}
          </h3>
          <p className="mt-5 line-clamp-3 max-w-xl text-base font-medium leading-relaxed text-white/52">
            {featured.description || section.description}
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-3 text-sm font-bold text-white/62">
            <span className="inline-flex items-center gap-1.5">
              <Eye className="h-4 w-4 text-[#D4AF37]" />
              {formatViews(featured.totalViews)}
            </span>
            <span className="rounded-full bg-white/10 px-3 py-1">
              {contentLabel(section.kind)}
            </span>
            {featured.ageRating ? (
              <span className="rounded-full bg-[#D4AF37]/15 px-3 py-1 text-[#D4AF37]">
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

        <HeroFeatureDeck
          featured={featured}
          supporting={supporting}
          kind={section.kind}
        />
      </div>
    </section>
  );
}

function ComicFeaturedShowcase({
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
  const stageItems = count
    ? [-2, -1, 0, 1, 2].map((offset) => ({
        series: items[(activeIndex + offset + count) % count],
        offset,
      }))
    : [];
  const goTo = (direction: -1 | 1) => {
    if (count <= 1) return;
    setActiveIndex((current) => (current + direction + count) % count);
  };

  return (
    <section
      id={section.id}
      className="relative scroll-mt-24 overflow-hidden rounded-[1.75rem] border border-[#D4AF37]/18 bg-[#11100f] px-4 py-5 shadow-[0_24px_80px_rgba(0,0,0,0.42),0_0_34px_rgba(212,175,55,0.12)] md:px-7 md:py-6"
    >
      <div
        className="absolute inset-0 bg-cover bg-center opacity-[0.42] transition duration-700"
        style={{ backgroundImage: `url(${imageFor(featured, 0, "banner")})` }}
      />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(13,12,12,0.46),rgba(10,10,12,0.74)_56%,rgba(8,8,10,0.9)),radial-gradient(circle_at_50%_12%,rgba(245,205,75,0.34),transparent_30%),radial-gradient(circle_at_18%_70%,rgba(112,143,255,0.18),transparent_32%),radial-gradient(circle_at_88%_56%,rgba(255,255,255,0.1),transparent_28%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:58px_58px] opacity-[0.42]" />
      <div className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-[#F5D65E]/80 to-transparent" />
      <div className="pointer-events-none absolute inset-x-16 bottom-0 h-px bg-gradient-to-r from-transparent via-[#8CA6FF]/45 to-transparent" />
      <div className="pointer-events-none absolute left-0 top-8 h-28 w-px bg-gradient-to-b from-transparent via-[#D4AF37]/60 to-transparent" />
      <div className="pointer-events-none absolute right-0 bottom-10 h-32 w-px bg-gradient-to-b from-transparent via-[#F5D65E]/50 to-transparent" />
      <div className="pointer-events-none absolute -left-16 -top-16 h-44 w-44 rounded-full bg-[#D4AF37]/16 blur-3xl" />
      <div className="pointer-events-none absolute -right-14 top-1/3 h-52 w-52 rounded-full bg-[#7F9DFF]/14 blur-3xl" />

      <div className="relative z-10 mx-auto max-w-6xl">
        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <SectionHeading
            section={section}
            icon={<Crown className="h-5 w-5" />}
            compact
          />
          <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-[#D4AF37]/20 bg-[#D4AF37]/10 px-3 py-1 text-xs font-black text-[#D4AF37]">
            <Eye className="h-3.5 w-3.5" />
            {formatViews(featured.totalViews)}
          </span>
        </div>
        <div className="space-y-4">
          <div className="hidden">
          <SectionHeading
            section={section}
            icon={<Crown className="h-5 w-5" />}
            compact
          />
          <h3 className="mt-5 line-clamp-2 font-sans text-3xl font-semibold leading-[1.04] text-white md:text-4xl">
            {featured.title}
          </h3>
          <p className="mt-3 line-clamp-3 max-w-md text-sm font-medium leading-relaxed text-white/50">
            {featured.description || section.description}
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-3 text-sm font-bold text-white/62">
            <span className="inline-flex items-center gap-1.5">
              <Eye className="h-4 w-4 text-[#D4AF37]" />
              {formatViews(featured.totalViews)}
            </span>
            <span className="rounded-full bg-white/10 px-3 py-1">
              {contentLabel(section.kind)}
            </span>
            {featured.ageRating ? (
              <span className="rounded-full bg-[#D4AF37]/16 px-3 py-1 text-[#D4AF37]">
                {featured.ageRating}
              </span>
            ) : null}
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href={seriesHref(featured)}
              className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-[#D4AF37] px-5 py-3 text-sm font-black text-black shadow-[0_0_26px_rgba(212,175,55,0.28)] transition hover:bg-[#f1d766] hover:shadow-[0_0_38px_rgba(212,175,55,0.42)]"
            >
              <Play className="h-4 w-4 fill-black" />
              Xem chi tiết
            </Link>
            <button
              type="button"
              className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-[#D4AF37]/20 bg-white/8 px-5 py-3 text-sm font-bold text-white shadow-[0_0_24px_rgba(255,255,255,0.08)] transition hover:border-[#D4AF37]/36 hover:bg-white/14 hover:shadow-[0_0_30px_rgba(212,175,55,0.18)]"
            >
              <BookmarkPlus className="h-4 w-4" />
              Lưu vào thư viện
            </button>
          </div>
        </div>

          <div className="relative min-h-[300px] overflow-hidden rounded-[1.35rem] border border-white/10 bg-[linear-gradient(90deg,rgba(0,0,0,0.58),rgba(255,255,255,0.035)_18%,rgba(212,175,55,0.08)_50%,rgba(255,255,255,0.035)_82%,rgba(0,0,0,0.58))] sm:min-h-[360px] lg:min-h-[420px]">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(245,214,94,0.16),transparent_34%),linear-gradient(90deg,rgba(0,0,0,0.74),transparent_18%,transparent_82%,rgba(0,0,0,0.74))]" />
            <div className="pointer-events-none absolute inset-x-8 top-1/2 h-px bg-gradient-to-r from-transparent via-white/12 to-transparent" />
            <button
              type="button"
              aria-label="Truyện trước"
              onClick={() => goTo(-1)}
              className="absolute left-3 top-1/2 z-50 flex h-10 w-10 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-white/12 bg-black/55 text-white shadow-[0_0_24px_rgba(0,0,0,0.35)] backdrop-blur-md transition hover:border-[#D4AF37]/50 hover:bg-[#D4AF37] hover:text-black"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              aria-label="Truyện tiếp theo"
              onClick={() => goTo(1)}
              className="absolute right-3 top-1/2 z-50 flex h-10 w-10 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-white/12 bg-black/55 text-white shadow-[0_0_24px_rgba(0,0,0,0.35)] backdrop-blur-md transition hover:border-[#D4AF37]/50 hover:bg-[#D4AF37] hover:text-black"
            >
              <ChevronRight className="h-5 w-5" />
            </button>

            <div className="absolute inset-0 [perspective:1500px]">
              {stageItems.map(({ series, offset }) => (
                <ComicStagePoster
                  key={`${series.seriesId}-${offset}`}
                  series={series}
                  offset={offset}
                  active={offset === 0}
                />
              ))}
            </div>
          </div>

          <div
            key={`${featured.seriesId}-comic-copy`}
            className="animate__animated animate__fadeIn mx-auto max-w-xl text-center [--animate-duration:760ms]"
          >
            <h3 className="line-clamp-1 font-sans text-3xl font-semibold leading-tight text-white md:text-5xl">
              {featured.title}
            </h3>
            <p className="mx-auto mt-2 line-clamp-2 max-w-lg text-sm font-medium leading-relaxed text-white/46">
              {featured.description || section.description}
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-3">
              <Link
                href={seriesHref(featured)}
                className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-[#D4AF37] px-5 py-2.5 text-sm font-black text-black shadow-[0_0_26px_rgba(212,175,55,0.28)] transition hover:bg-[#f1d766] hover:shadow-[0_0_38px_rgba(212,175,55,0.42)]"
              >
                <Play className="h-4 w-4 fill-black" />
                Xem chi tiết
              </Link>
              <button
                type="button"
                className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-[#D4AF37]/20 bg-white/8 px-5 py-2.5 text-sm font-bold text-white shadow-[0_0_24px_rgba(255,255,255,0.08)] transition hover:border-[#D4AF37]/36 hover:bg-white/14 hover:shadow-[0_0_30px_rgba(212,175,55,0.18)]"
              >
                <BookmarkPlus className="h-4 w-4" />
                Lưu vào thư viện
              </button>
            </div>
          </div>

          {items.length > 1 ? (
            <div className="mt-4 flex justify-center gap-2">
              {items.slice(0, Math.min(items.length, 8)).map((series, index) => (
                <button
                  key={`${series.seriesId}-dot`}
                  type="button"
                  aria-label={`Chọn ${series.title}`}
                  onClick={() => setActiveIndex(index)}
                  className={`h-1.5 cursor-pointer rounded-full transition ${
                    index === activeIndex
                      ? "w-8 bg-[#D4AF37] shadow-[0_0_18px_rgba(212,175,55,0.55)]"
                      : "w-3 bg-white/20 hover:bg-white/38"
                  }`}
                />
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function ComicStagePoster({
  series,
  offset,
  active,
}: {
  series: HomeFeedSeries;
  offset: number;
  active: boolean;
}) {
  const abs = Math.abs(offset);
  const x = offset * 62;
  const rotate = offset * -18;
  const scale = active ? 1 : abs === 1 ? 0.82 : 0.64;
  const opacity = active ? 1 : abs === 1 ? 0.78 : 0.38;

  return (
    <Link
      href={seriesHref(series)}
      className={`group absolute left-1/2 top-1/2 block aspect-[2/3] w-[195px] cursor-pointer overflow-hidden rounded-[1.35rem] border border-white/14 bg-white/[0.05] shadow-[0_30px_80px_rgba(0,0,0,0.55)] transition-all duration-500 ease-out hover:border-[#D4AF37]/55 sm:w-[225px] lg:w-[270px] ${
        active ? "animate__animated animate__fadeIn z-40 [--animate-duration:760ms]" : abs === 1 ? "z-30 hidden md:block" : "z-20 hidden lg:block"
      }`}
      style={{
        opacity,
        transform: `translate(-50%, -50%) translateX(${x}%) rotateY(${rotate}deg) scale(${scale})`,
        transformStyle: "preserve-3d",
      }}
    >
      <div
        className="absolute inset-0 bg-cover bg-center transition duration-500 group-hover:scale-105"
        style={{
          backgroundImage: `url(${imageFor(series, Math.abs(offset), "cover")})`,
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/86 via-transparent to-black/8" />
      <CardSunSheen />
      {active ? (
        <span className="absolute left-3 top-3 rounded-full bg-[#D4AF37] px-3 py-1 text-xs font-black text-black shadow-[0_0_18px_rgba(212,175,55,0.45)]">
          Nổi bật
        </span>
      ) : null}
      <div className="absolute bottom-3 left-3 right-3">
        <p className="line-clamp-2 text-sm font-black leading-tight text-white">
          {series.title}
        </p>
      </div>
    </Link>
  );
}

function VideoFeaturedShowcase({
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
                {formatViews(featured.totalViews)}
              </span>
              <span className="rounded-full bg-white/10 px-3 py-1">
                {contentLabel(section.kind)}
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
                  aria-label="Phim trước"
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
                  aria-label="Phim tiếp theo"
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
                {contentLabel(section.kind)}
              </p>
            </div>
          </Link>
        </div>

        {items.length > 1 ? (
          <div className="mt-2">
            <ScrollableRow>
              {items.map((series, index) => (
                <VideoStripCard
                  key={series.seriesId}
                  series={series}
                  index={index}
                  active={index === activeIndex}
                  onSelect={() => setActiveIndex(index)}
                />
              ))}
            </ScrollableRow>
          </div>
        ) : null}
      </div>
    </section>
  );
}

function VideoStripCard({
  series,
  index,
  active,
  onSelect,
}: {
  series: HomeFeedSeries;
  index: number;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="group w-[240px] shrink-0 cursor-pointer text-left sm:w-[285px] lg:w-[320px]"
    >
      <div
        className={`relative aspect-video overflow-hidden rounded-xl border bg-white/[0.04] transition duration-300 group-hover:-translate-y-1 ${
          active
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
        <TypeBadge kind="VIDEO" />
      </div>
      <h4 className="mt-2 line-clamp-1 text-sm font-black text-white">
        {series.title}
      </h4>
    </button>
  );
}

function HeroFeatureDeck({
  featured,
  supporting,
  kind,
}: {
  featured: HomeFeedSeries;
  supporting: HomeFeedSeries[];
  kind: FeedKind;
}) {
  const isComic = kind === "COMIC";

  return (
    <div className="relative z-10 min-w-0">
      <HeroMiniCard series={featured} kind={kind} index={0} />
      {supporting.length > 0 ? (
        <div className="-mx-1 mt-5">
          <ScrollableRow>
            {supporting.map((series, index) =>
              isComic ? (
                <PosterShelfCard
                  key={series.seriesId}
                  series={series}
                  index={index + 1}
                />
              ) : (
                <CinematicShelfCard
                  key={series.seriesId}
                  series={series}
                  index={index + 1}
                />
              ),
            )}
          </ScrollableRow>
        </div>
      ) : null}
    </div>
  );
}

function HeroMiniCard({
  series,
  kind,
  index,
}: {
  series: HomeFeedSeries;
  kind: FeedKind;
  index: number;
}) {
  return (
    <Link
      href={seriesHref(series)}
      className={`group relative block cursor-pointer overflow-hidden rounded-[1.6rem] border border-white/12 bg-white/[0.04] shadow-[0_28px_70px_rgba(0,0,0,0.38)] transition duration-300 hover:-translate-y-1 hover:border-[#D4AF37]/45 ${
        kind === "COMIC"
          ? "aspect-[16/6.2] min-h-[260px]"
          : "aspect-[16/7] min-h-[280px]"
      }`}
    >
      <div
        className="absolute inset-0 bg-cover bg-center transition duration-500 group-hover:scale-105"
        style={{
          backgroundImage: `url(${imageFor(series, index, "banner")})`,
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/28 to-black/4" />
      <div className="absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-black/40 to-transparent" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#D4AF37]/65 to-transparent" />
      <CardSunSheen />
      <div className="absolute bottom-5 left-5 right-5">
        <p className="line-clamp-1 text-xl font-black text-white">
          {series.title}
        </p>
        <p className="mt-1 text-sm font-bold text-[#D4AF37]">
          {contentLabel(kind)}
        </p>
      </div>
    </Link>
  );
}

function PosterShelfCard({
  series,
  index,
}: {
  series: HomeFeedSeries;
  index: number;
}) {
  return (
    <Link
      href={seriesHref(series)}
      className="group w-[148px] shrink-0 cursor-pointer sm:w-[166px] lg:w-[184px] [&>p:last-child]:hidden"
    >
      <div className="relative aspect-[2/3] overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] transition duration-300 group-hover:-translate-y-1 group-hover:border-[#D4AF37]/45">
        <div
          className="absolute inset-0 bg-cover bg-center transition duration-500 group-hover:scale-105"
          style={{ backgroundImage: `url(${imageFor(series, index, "cover")})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/86 via-black/12 to-black/12" />
        <CardSunSheen />
        <CardNumber value={index + 1} />
        <TypeBadge kind="COMIC" />
      </div>
      <h4 className="mt-2 line-clamp-1 text-sm font-black text-white">
        {series.title}
      </h4>
      <p className="mt-0.5 text-xs font-bold text-white/42">Truyá»‡n tranh</p>
    </Link>
  );
}

function CinematicShelfCard({
  series,
  index,
}: {
  series: HomeFeedSeries;
  index: number;
}) {
  return (
    <Link
      href={seriesHref(series)}
      className="group w-[270px] shrink-0 cursor-pointer sm:w-[320px] lg:w-[360px] [&>p:last-child]:hidden"
    >
      <div className="relative aspect-video overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] transition duration-300 group-hover:-translate-y-1 group-hover:border-[#D4AF37]/45">
        <div
          className="absolute inset-0 bg-cover bg-center transition duration-500 group-hover:scale-105"
          style={{
            backgroundImage: `url(${imageFor(series, index, "banner")})`,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/84 via-black/16 to-black/8" />
        <CardSunSheen />
        <CardNumber value={index + 1} />
        <TypeBadge kind="VIDEO" />
      </div>
      <h4 className="mt-2 line-clamp-1 text-sm font-black text-white">
        {series.title}
      </h4>
      <p className="mt-0.5 text-xs font-bold text-white/42">Phim bá»™</p>
    </Link>
  );
}

function TypedRankingSection({ section }: { section: TypedHomeSection }) {
  return (
    <section
      id={section.id}
      className="relative scroll-mt-24 overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/[0.035] p-5 shadow-[0_22px_70px_rgba(0,0,0,0.28)] md:p-6"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_8%_20%,rgba(212,175,55,0.14),transparent_28%),radial-gradient(circle_at_88%_12%,rgba(84,118,255,0.12),transparent_30%)]" />
      <div className="relative">
      <SectionHeading
        section={section}
        icon={<TrendingUp className="h-5 w-5" />}
      />
      <ScrollableRow>
        {section.items.slice(0, 10).map((series, index) => (
          <NetflixRankCard
            key={series.seriesId}
            series={series}
            index={index}
            kind={section.kind}
            rank={index + 1}
          />
        ))}
      </ScrollableRow>
      </div>
    </section>
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
        icon={
          section.kind === "COMIC" ? (
            <BookOpen className="h-5 w-5" />
          ) : (
            <Film className="h-5 w-5" />
          )
        }
      />
      <ScrollableRow>
        {section.items.map((series, index) =>
          section.kind === "COMIC" ? (
            <PortraitCard key={series.seriesId} series={series} index={index} />
          ) : (
            <LandscapeCard key={series.seriesId} series={series} index={index} />
          ),
        )}
      </ScrollableRow>
      </div>
    </section>
  );
}

function TypedSpotlightSection({ section }: { section: TypedHomeSection }) {
  const featured = section.items[0];
  const rest = section.items.slice(1, 5);
  const isComicSpotlight = section.kind === "COMIC";
  const usePosterSpotlight = section.variant === "spotlight";
  if (!featured) return null;

  if (usePosterSpotlight) {
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
              icon={
                isComicSpotlight ? (
                  <BookOpen className="h-5 w-5" />
                ) : (
                  <Clapperboard className="h-5 w-5" />
                )
              }
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
              <span>{contentLabel(section.kind)}</span>
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
                      backgroundImage: `url(${imageFor(series, index + 1, isComicSpotlight ? "cover" : "banner")})`,
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
                      {series.totalViews ?? 0} view
                    </span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs font-semibold leading-relaxed text-white/48">
                    {series.description || contentLabel(section.kind)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      id={section.id}
      className="relative scroll-mt-24 overflow-hidden rounded-[1.6rem] border border-[#D4AF37]/14 bg-[linear-gradient(125deg,rgba(212,175,55,0.1),rgba(19,19,21,0.92)_36%,rgba(88,112,190,0.11))] shadow-[0_22px_70px_rgba(0,0,0,0.3)]"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_16%_18%,rgba(212,175,55,0.16),transparent_28%),radial-gradient(circle_at_84%_18%,rgba(151,176,255,0.12),transparent_30%)]" />
      <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-[#D4AF37]/50 to-transparent" />
      <div
        className={`relative grid lg:items-center ${
          isComicSpotlight
            ? "lg:grid-cols-[minmax(340px,0.82fr)_minmax(280px,0.56fr)]"
            : "lg:grid-cols-[minmax(0,0.58fr)_minmax(360px,0.92fr)]"
        }`}
      >
        <div
          className={`flex flex-col justify-center p-5 md:p-7 ${
            isComicSpotlight ? "lg:order-2 lg:pl-6" : ""
          }`}
        >
          <SectionHeading
            section={section}
            icon={
              isComicSpotlight ? (
                <BookOpen className="h-5 w-5" />
              ) : (
                <Clapperboard className="h-5 w-5" />
              )
            }
            compact
          />
          <h3 className="mt-4 bg-[linear-gradient(110deg,rgba(255,255,255,0.86),rgba(255,255,255,0.86),rgba(212,175,55,0.92),rgba(255,255,255,0.82))] bg-[length:220%_100%] bg-clip-text font-sans text-3xl font-semibold leading-tight text-white/88 transition-[color,filter] duration-300 hover:text-transparent hover:drop-shadow-[0_0_20px_rgba(212,175,55,0.18)] md:text-4xl">
            {featured.title}
          </h3>
          <p className="mt-3 line-clamp-3 max-w-xl text-sm font-medium leading-relaxed text-white/50 md:text-[15px]">
            {featured.description || section.description}
          </p>
          <Link
            href={seriesHref(featured)}
            className="mt-6 inline-flex w-fit cursor-pointer items-center gap-2 rounded-full bg-[#D4AF37] px-5 py-2.5 text-sm font-black text-black shadow-[0_0_24px_rgba(212,175,55,0.24)] transition hover:bg-[#f1d766] hover:shadow-[0_0_34px_rgba(212,175,55,0.38)]"
          >
            Khám phá
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div
          className={`grid grid-cols-2 gap-2 p-2 ${
            isComicSpotlight
              ? "min-h-[230px] md:min-h-[270px] lg:order-1"
              : "min-h-[280px] md:min-h-[320px]"
          }`}
        >
          {[featured, ...rest].slice(0, 5).map((series, index) => (
            <Link
              key={`${series.seriesId}-${index}`}
              href={seriesHref(series)}
              className={`group relative overflow-hidden rounded-2xl bg-white/[0.04] ${
                index === 0
                  ? "col-span-2"
                  : isComicSpotlight
                    ? "aspect-[5/4]"
                    : "aspect-video"
              }`}
            >
              <div
                className="absolute inset-0 bg-cover bg-center transition duration-500 group-hover:scale-105"
                style={{
                  backgroundImage: `url(${imageFor(series, index, section.kind === "COMIC" ? "cover" : "banner")})`,
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/18 to-transparent" />
              <CardSunSheen />
              <p className="absolute bottom-3 left-3 right-3 line-clamp-1 text-sm font-black text-white">
                {series.title}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function MixedRecommendationSection({
  items,
  canRevealMore,
  isAppending,
  loadMoreRef,
}: {
  items: HomeFeedSeries[];
  canRevealMore: boolean;
  isAppending: boolean;
  loadMoreRef: React.RefObject<HTMLDivElement | null>;
}) {
  return (
    <section id="mixed-recommendations" className="scroll-mt-24">
      <div className="mb-5 flex items-end justify-between gap-4">
        <SectionHeading
          section={{
            eyebrow: "TaleX đề xuất",
            title: "Đề xuất cho bạn",
            description:
              "Video và truyện tranh được gợi ý chung trong một dòng xem tự nhiên.",
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

      {isAppending ? <MixedRecommendationSkeleton /> : null}

      <div
        ref={loadMoreRef}
        className="flex min-h-16 items-center justify-center py-6"
      >
        {canRevealMore && !isAppending ? (
          <span className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-bold text-white/38">
            Đang chuẩn bị thêm đề xuất...
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
        className="flex gap-4 overflow-x-auto scroll-smooth pb-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
      >
        {children}
      </div>
    </div>
  );
}

function NetflixRankCard({
  series,
  index,
  kind,
  rank,
}: {
  series: HomeFeedSeries;
  index: number;
  kind: FeedKind;
  rank: number;
}) {
  const isComic = kind === "COMIC";

  return (
    <Link
      href={seriesHref(series)}
      className={`group relative shrink-0 cursor-pointer ${
        isComic ? "w-[240px] sm:w-[270px]" : "w-[320px] sm:w-[380px]"
      }`}
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -left-2 top-1/2 z-0 -translate-y-1/2 font-heading text-[8.5rem] font-black leading-none text-white/[0.055] transition duration-300 group-hover:text-[#D4AF37]/12 sm:text-[10rem]"
      >
        {rank}
      </span>
      <div
        className={`relative z-10 ml-14 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.045] shadow-[0_18px_50px_rgba(0,0,0,0.3)] transition duration-300 group-hover:-translate-y-1 group-hover:border-[#D4AF37]/45 ${
          isComic ? "aspect-[2/3]" : "aspect-video"
        }`}
      >
        <div
          className="absolute inset-0 bg-cover bg-center transition duration-500 group-hover:scale-105"
          style={{
            backgroundImage: `url(${imageFor(series, index, isComic ? "cover" : "banner")})`,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/86 via-black/18 to-black/10" />
        <CardSunSheen />
        <CardStar />
        <TypeBadge kind={kind} />
        <div className="absolute bottom-3 left-3 right-3">
          <p className="line-clamp-2 text-sm font-black leading-tight text-white sm:text-base">
            {series.title}
          </p>
          <p className="mt-1 text-xs font-bold text-[#D4AF37]">
            {formatViews(series.totalViews)}
          </p>
        </div>
      </div>
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
        <CardStar />
        <CardNumber value={index + 1} />
        <TypeBadge kind="VIDEO" />
        {series.ageRating ? <AgeBadge value={series.ageRating} /> : null}
      </div>
      <SeriesMeta series={series} />
    </Link>
  );
}

function PortraitCard({
  series,
  index,
  rank,
}: {
  series: HomeFeedSeries;
  index: number;
  rank?: number;
}) {
  return (
    <Link
      href={seriesHref(series)}
      className="group w-[155px] shrink-0 sm:w-[175px] lg:w-[195px]"
    >
      <div className="relative aspect-[2/3] overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] shadow-[0_18px_40px_rgba(0,0,0,0.28)] transition group-hover:border-[#D4AF37]/45">
        <div
          className="absolute inset-0 bg-cover bg-center transition duration-500 group-hover:scale-105"
          style={{ backgroundImage: `url(${imageFor(series, index, "cover")})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/86 via-transparent to-black/14" />
        <CardSunSheen />
        <CardStar />
        <CardNumber value={rank ?? index + 1} />
        <TypeBadge kind="COMIC" />
        <span className="absolute bottom-2 right-2 inline-flex items-center gap-1 rounded-full bg-black/70 px-2 py-1 text-xs font-black text-white/88">
          <Eye className="h-3.5 w-3.5 text-[#D4AF37]" />
          {series.totalViews ?? 0}
        </span>
      </div>
      <h3 className="mt-3 line-clamp-2 text-base font-black leading-tight text-white">
        {series.title}
      </h3>
      <p className="mt-1 truncate text-sm font-semibold text-white/45">
        {series.creatorName || "TaleX Creator"}
      </p>
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
        <CardStar />
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
            {formatViews(series.totalViews)}
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
          {formatViews(series.totalViews)}
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

function CardStar() {
  return (
    <span className="absolute right-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full border border-[#D4AF37]/35 bg-black/60 text-[#D4AF37] shadow-lg backdrop-blur-md">
      <Star className="h-3.5 w-3.5 fill-[#D4AF37]" />
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
      <div className="flex items-center gap-2 text-[#D4AF37]">
        {icon}
        <span className="text-[11px] font-black uppercase tracking-[0.22em]">
          {section.eyebrow}
        </span>
      </div>
      <div className={compact ? "mt-2" : "mt-1"}>
        <h2 className="bg-[linear-gradient(110deg,rgba(255,255,255,0.76),rgba(255,255,255,0.76),rgba(212,175,55,0.92),rgba(151,176,255,0.7),rgba(255,255,255,0.76))] bg-[length:220%_100%] bg-clip-text font-sans text-2xl font-semibold tracking-tight text-white/82 transition-[color,filter] duration-300 hover:text-transparent hover:drop-shadow-[0_0_18px_rgba(212,175,55,0.18)] md:text-4xl">
          {section.title}
        </h2>
        {!compact ? (
          <p className="mt-1 text-sm font-medium text-white/38">
            {section.description}
          </p>
        ) : null}
      </div>
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
      <div className="h-[360px] animate-pulse rounded-3xl border border-white/5 bg-white/[0.04]" />
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
