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
  Play,
  RefreshCw,
  Sparkles,
  Star,
  TrendingUp,
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

const MIXED_RECOMMENDATION_LIMIT = 48;
const MIXED_INITIAL_VISIBLE = 12;
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

  return CHANNEL_POOL_ORDER.flatMap((poolKey) => {
    const config = poolCopy[poolKey];
    const items = uniqueSeries(feed[poolKey] ?? []);
    const comics = items.filter((item) => normalizeKind(item) === "COMIC");
    const videos = items.filter((item) => normalizeKind(item) === "VIDEO");
    const sections: TypedHomeSection[] = [];

    if (comics.length > 0) {
      sections.push({
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

    if (videos.length > 0) {
      sections.push({
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

    return sections;
  });
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

export function HomeFeed() {
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

function HomeChannelAdBreak({ index }: { index: number }) {
  const slotId = index <= 1 ? "mock-home-feed-mid-1" : "mock-home-feed-mid-2";

  return (
    <AdSlot
      slotId={slotId}
      format="horizontal"
      className="min-h-[96px] rounded-2xl"
    />
  );
}

function HomeFeedNav({
  sections,
}: {
  sections: Array<{ id: string; title: string }>;
}) {
  const navItems = [
    { id: "home-feed-top", label: "Tất cả" },
    ...sections.map((section) => ({
      id: section.id,
      label: section.title,
    })),
  ];

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  return (
    <div className="sticky top-0 z-30 -mx-4 bg-[#0d0c0a]/78 px-4 py-3 backdrop-blur-xl md:-mx-6 md:px-6">
      <div className="flex gap-3 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {navItems.map((item, index) => (
          <button
            key={`${item.id}-${index}`}
            type="button"
            onClick={() => scrollToSection(item.id)}
            className={`shrink-0 cursor-pointer rounded-xl px-4 py-2.5 font-sans text-sm font-semibold transition md:text-base ${
              index === 0
                ? "bg-white/90 text-black/88 hover:bg-white"
                : "bg-white/[0.08] text-white/58 hover:bg-white/[0.12] hover:text-white/76"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function TypedHeroSection({ section }: { section: TypedHomeSection }) {
  const featured = section.items[0];
  const supporting = section.items.slice(1, 5);
  if (!featured) return null;

  return (
    <section
      id={section.id}
      className="scroll-mt-24 overflow-hidden rounded-3xl border border-white/10 bg-[#111113] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.35)] md:p-7"
    >
      <div className="relative grid gap-7 lg:grid-cols-[minmax(0,0.9fr)_minmax(360px,0.8fr)] lg:items-center">
        <div
          className="absolute inset-0 -m-7 bg-cover bg-center opacity-20 blur-[1px]"
          style={{ backgroundImage: `url(${imageFor(featured, 0)})` }}
        />
        <div className="absolute inset-0 -m-7 bg-[radial-gradient(circle_at_20%_20%,rgba(212,175,55,0.2),transparent_30%),linear-gradient(90deg,#111113_0%,rgba(17,17,19,0.9)_45%,rgba(17,17,19,0.55)_100%)]" />

        <div className="relative max-w-3xl">
          <SectionHeading
            section={section}
            icon={<Crown className="h-5 w-5" />}
          />
          <h3 className="mt-5 bg-[linear-gradient(110deg,rgba(255,255,255,0.82),rgba(255,255,255,0.82),rgba(212,175,55,0.92),rgba(255,255,255,0.82))] bg-[length:220%_100%] bg-clip-text font-sans text-4xl font-semibold leading-tight tracking-tight text-white/86 transition-[color,filter] duration-300 hover:text-transparent hover:drop-shadow-[0_0_20px_rgba(212,175,55,0.18)] md:text-6xl">
            {featured.title}
          </h3>
          <p className="mt-5 line-clamp-3 max-w-2xl text-base font-medium leading-relaxed text-white/50 md:text-lg">
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

        <div className="relative grid grid-cols-2 gap-3">
          {[featured, ...supporting].slice(0, 5).map((series, index) => (
            <HeroMiniCard
              key={`${series.seriesId}-${index}`}
              series={series}
              kind={section.kind}
              index={index}
            />
          ))}
        </div>
      </div>
    </section>
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
      className={`group relative min-h-[130px] overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] transition hover:border-[#D4AF37]/45 ${
        index === 0
          ? "col-span-2 aspect-[16/7]"
          : kind === "COMIC"
            ? "aspect-[3/4]"
            : "aspect-video"
      }`}
    >
      <div
        className="absolute inset-0 bg-cover bg-center transition duration-500 group-hover:scale-105"
        style={{
          backgroundImage: `url(${imageFor(series, index, kind === "COMIC" ? "cover" : "banner")})`,
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/88 via-black/24 to-transparent" />
      <CardSunSheen />
      <div className="absolute bottom-3 left-3 right-3">
        <p className="line-clamp-1 text-sm font-black text-white">
          {series.title}
        </p>
        <p className="mt-1 text-xs font-bold text-[#D4AF37]">
          {contentLabel(kind)}
        </p>
      </div>
    </Link>
  );
}

function TypedRankingSection({ section }: { section: TypedHomeSection }) {
  return (
    <section id={section.id} className="scroll-mt-24">
      <SectionHeading
        section={section}
        icon={<TrendingUp className="h-5 w-5" />}
      />
      <ScrollableRow>
        {section.items.slice(0, 12).map((series, index) =>
          section.kind === "COMIC" ? (
            <PortraitCard
              key={series.seriesId}
              series={series}
              index={index}
              rank={index + 1}
            />
          ) : (
            <RankingLandscapeCard
              key={series.seriesId}
              series={series}
              index={index}
              rank={index + 1}
            />
          ),
        )}
      </ScrollableRow>
    </section>
  );
}

function TypedRowSection({ section }: { section: TypedHomeSection }) {
  return (
    <section id={section.id} className="scroll-mt-24">
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
      className="scroll-mt-24 overflow-hidden rounded-3xl border border-white/10 bg-[#131315]"
    >
      <div className="grid lg:grid-cols-[minmax(0,0.65fr)_minmax(360px,1fr)]">
        <div className="flex flex-col justify-center p-6 md:p-9">
          <SectionHeading
            section={section}
            icon={<Clapperboard className="h-5 w-5" />}
            compact
          />
          <h3 className="mt-5 bg-[linear-gradient(110deg,rgba(255,255,255,0.82),rgba(255,255,255,0.82),rgba(212,175,55,0.92),rgba(255,255,255,0.82))] bg-[length:220%_100%] bg-clip-text font-sans text-3xl font-semibold leading-tight text-white/86 transition-[color,filter] duration-300 hover:text-transparent hover:drop-shadow-[0_0_20px_rgba(212,175,55,0.18)] md:text-5xl">
            {featured.title}
          </h3>
          <p className="mt-4 line-clamp-4 max-w-xl text-sm font-medium leading-relaxed text-white/48 md:text-base">
            {featured.description || section.description}
          </p>
          <Link
            href={seriesHref(featured)}
            className="mt-7 inline-flex w-fit cursor-pointer items-center gap-2 rounded-full bg-[#D4AF37] px-5 py-3 text-sm font-black text-black transition hover:bg-[#f1d766]"
          >
            Khám phá
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid min-h-[360px] grid-cols-2 gap-2 p-2">
          {[featured, ...rest].slice(0, 5).map((series, index) => (
            <Link
              key={`${series.seriesId}-${index}`}
              href={seriesHref(series)}
              className={`group relative overflow-hidden rounded-2xl bg-white/[0.04] ${
                index === 0
                  ? "col-span-2"
                  : section.kind === "COMIC"
                    ? "aspect-[3/4]"
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

function RankingLandscapeCard({
  series,
  index,
  rank,
}: {
  series: HomeFeedSeries;
  index: number;
  rank: number;
}) {
  return (
    <Link
      href={seriesHref(series)}
      className="group relative h-[190px] w-[250px] shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] transition hover:border-[#D4AF37]/45 sm:w-[300px]"
    >
      <div
        className="absolute inset-0 bg-cover bg-center transition duration-500 group-hover:scale-105"
        style={{ backgroundImage: `url(${imageFor(series, index)})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
      <CardSunSheen />
      <CardStar />
      <span className="absolute left-3 top-3 font-heading text-5xl font-black text-white/18">
        {String(rank).padStart(2, "0")}
      </span>
      <div className="absolute bottom-4 left-4 right-4">
        <p className="line-clamp-2 text-lg font-black leading-tight text-white">
          {series.title}
        </p>
        <p className="mt-1 text-sm font-bold text-[#D4AF37]">
          {formatViews(series.totalViews)}
        </p>
      </div>
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
