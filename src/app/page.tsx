"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Clock3,
  Film,
  Flame,
  Heart,
  History,
  Home as HomeIcon,
  ListVideo,
  Play,
  Radio,
  Sparkles,
  UserRoundCog,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { ContinueWatching } from "@/features/home/components/continue-watching";
import { InterestCategories } from "@/features/home/components/interest-categories";
import { Top10Today } from "@/features/home/components/top-10-today";
import { FeaturedPromo } from "@/features/home/components/featured-promo";
import { NewReleasesRow } from "@/features/home/components/new-releases-row";
import { DailyTopVideosRow } from "@/features/home/components/daily-top-videos-row";
import { MysteryThrillerRow } from "@/features/home/components/mystery-thriller-row";
import { ChineseSeriesRow } from "@/features/home/components/chinese-series-row";
import { KoreanDramaRow } from "@/features/home/components/korean-drama-row";
import { DestinyCategories } from "@/features/home/components/destiny-categories";
import { EditorialSpotlight } from "@/features/home/components/editorial-spotlight";
import { WebtoonAdaptationsRow } from "@/features/home/components/webtoon-adaptations-row";
import { TrendingComics } from "@/features/intro/components/trending-comics";
import { usePublicSidebarStore } from "@/shared/stores/public-sidebar.store";

type MenuItem = {
  title: string;
  href: string;
  icon: LucideIcon;
};

type ShortItem = {
  title: string;
  views: string;
  thumbnail: string;
};

type VideoItem = {
  title: string;
  creator: string;
  views: string;
  postedAt: string;
  duration: string;
  thumbnail: string;
  avatar: string;
};

const primaryMenu: MenuItem[] = [
  { title: "Trang chủ", href: "/", icon: HomeIcon },
  { title: "Shorts", href: "/#shorts", icon: Flame },
  { title: "Kênh đăng ký", href: "/subscriptions", icon: Radio },
];

const libraryMenu: MenuItem[] = [
  { title: "Video đã xem", href: "/history", icon: History },
  { title: "Danh sách phát", href: "/playlists", icon: ListVideo },
  { title: "Xem sau", href: "/watch-later", icon: Clock3 },
  { title: "Video đã thích", href: "/liked", icon: Heart },
];

const platformMenu: MenuItem[] = [
  { title: "Giới thiệu", href: "/intro", icon: Sparkles },
  { title: "Creator Studio", href: "/creator-dashboard", icon: UserRoundCog },
];

const filterChips = [
  "Tất cả",
  "Phim Lẻ",
  "Phim Bộ",
  "Truyện Tranh",
  "Hoạt Hình",
  "Trò Chơi",
  "Hành Động",
  "Lãng Mạn",
  "Kinh Dị",
  "Đang thịnh hành",
];

const shorts: ShortItem[] = [
  {
    title: "Một cú twist khiến cả rạp nín thở",
    views: "2,4 Tr lượt xem",
    thumbnail:
      "https://images.unsplash.com/photo-1518676590629-3dcbd9c5a5c9?q=80&w=900&auto=format&fit=crop",
  },
  {
    title: "Khi nhân vật phụ trở thành huyền thoại",
    views: "918 N lượt xem",
    thumbnail:
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=900&auto=format&fit=crop",
  },
  {
    title: "Màn rượt đuổi đắt giá nhất đêm nay",
    views: "1,1 Tr lượt xem",
    thumbnail:
      "https://images.unsplash.com/photo-1524985069026-dd778a71c7b4?q=80&w=900&auto=format&fit=crop",
  },
  {
    title: "Một trang truyện, ba lần nổi da gà",
    views: "643 N lượt xem",
    thumbnail:
      "https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?q=80&w=900&auto=format&fit=crop",
  },
  {
    title: "Cú ra đòn cuối cùng của vũ trụ TaleX",
    views: "3,7 Tr lượt xem",
    thumbnail:
      "https://images.unsplash.com/photo-1542204165-65bf26472b9b?q=80&w=900&auto=format&fit=crop",
  },
];

const videos: VideoItem[] = [
  {
    title: "Hành trình xuyên đêm của đội săn bóng tối",
    creator: "TaleX Originals",
    views: "1,2 Tr lượt xem",
    postedAt: "2 tháng trước",
    duration: "24:50",
    thumbnail:
      "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=1200&auto=format&fit=crop",
    avatar:
      "https://images.unsplash.com/photo-1527980965255-d3b416303d12?q=80&w=200&auto=format&fit=crop",
  },
  {
    title: "Biệt đội mùa đông và lời thề ở ga cuối",
    creator: "North Star Studio",
    views: "864 N lượt xem",
    postedAt: "3 tuần trước",
    duration: "18:12",
    thumbnail:
      "https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=1200&auto=format&fit=crop",
    avatar:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200&auto=format&fit=crop",
  },
  {
    title: "Đọc thử chương 15: Thành phố dưới đáy mưa",
    creator: "Ink Motion",
    views: "421 N lượt xem",
    postedAt: "5 ngày trước",
    duration: "12:44",
    thumbnail:
      "https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?q=80&w=1200&auto=format&fit=crop",
    avatar:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200&auto=format&fit=crop",
  },
  {
    title: "Cuộc đấu boss ẩn trong thành phố neon",
    creator: "GameFrame VN",
    views: "2,8 Tr lượt xem",
    postedAt: "1 tháng trước",
    duration: "31:09",
    thumbnail:
      "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=1200&auto=format&fit=crop",
    avatar:
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=200&auto=format&fit=crop",
  },
  {
    title: "Tập đặc biệt: Lời thú nhận trước bình minh",
    creator: "Moonlit Drama",
    views: "735 N lượt xem",
    postedAt: "2 tuần trước",
    duration: "42:18",
    thumbnail:
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1200&auto=format&fit=crop",
    avatar:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop",
  },
  {
    title: "Phân tích vũ trụ TaleX: Những chi tiết bị bỏ lỡ",
    creator: "Frame by Frame",
    views: "598 N lượt xem",
    postedAt: "6 ngày trước",
    duration: "27:36",
    thumbnail:
      "https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=1200&auto=format&fit=crop",
    avatar:
      "https://images.unsplash.com/photo-1519345182560-3f2917c472ef?q=80&w=200&auto=format&fit=crop",
  },
  {
    title: "Hoạt hình ngắn: Đốm sáng cuối đường hầm",
    creator: "Aurora Animation",
    views: "1,9 Tr lượt xem",
    postedAt: "4 tháng trước",
    duration: "09:58",
    thumbnail:
      "https://images.unsplash.com/photo-1520509414578-d9cbf09933a1?q=80&w=1200&auto=format&fit=crop",
    avatar:
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?q=80&w=200&auto=format&fit=crop",
  },
  {
    title: "Từ storyboard đến cảnh quay: Bí mật hậu trường",
    creator: "Creator Lab",
    views: "318 N lượt xem",
    postedAt: "11 ngày trước",
    duration: "16:20",
    thumbnail:
      "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?q=80&w=1200&auto=format&fit=crop",
    avatar:
      "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200&auto=format&fit=crop",
  },
  {
    title: "Kẻ gác cổng và căn phòng không có cửa",
    creator: "Mystery House",
    views: "1,4 Tr lượt xem",
    postedAt: "8 tháng trước",
    duration: "38:02",
    thumbnail:
      "https://images.unsplash.com/photo-1509248961158-e54f6934749c?q=80&w=1200&auto=format&fit=crop",
    avatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop",
  },
  {
    title: "Top khoảnh khắc khiến cộng đồng TaleX bùng nổ",
    creator: "TaleX Daily",
    views: "4,6 Tr lượt xem",
    postedAt: "1 năm trước",
    duration: "22:15",
    thumbnail:
      "https://images.unsplash.com/photo-1517602302552-471fe67acf66?q=80&w=1200&auto=format&fit=crop",
    avatar:
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=200&auto=format&fit=crop",
  },
  {
    title: "Câu chuyện tình yêu trong mùa sao băng",
    creator: "Velvet Series",
    views: "902 N lượt xem",
    postedAt: "7 tuần trước",
    duration: "45:00",
    thumbnail:
      "https://images.unsplash.com/photo-1518895949257-7621c3c786d7?q=80&w=1200&auto=format&fit=crop",
    avatar:
      "https://images.unsplash.com/photo-1520813792240-56fc4a3765a7?q=80&w=200&auto=format&fit=crop",
  },
  {
    title: "Truyện tranh chuyển thể: Cảnh mở màn đáng nhớ",
    creator: "Webtoon Vault",
    views: "677 N lượt xem",
    postedAt: "12 ngày trước",
    duration: "14:32",
    thumbnail:
      "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=1200&auto=format&fit=crop",
    avatar:
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=200&auto=format&fit=crop",
  },
];

export default function Home() {
  const isSidebarOpen = usePublicSidebarStore((state) => state.isSidebarOpen);

  return (
    <div className="flex h-[calc(100vh-64px)] w-full overflow-hidden bg-[#0F0F0F] text-white md:h-[calc(100vh-80px)]">
      <Sidebar isOpen={isSidebarOpen} />

      <main className="relative h-full min-w-0 flex-1 overflow-y-auto p-4 transition-all duration-300 ease-in-out md:p-6 no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        <FilterChips />
        <ShortsSection />
        <VideoGrid />
        <LegacyHomeSections />
      </main>
    </div>
  );
}

function Sidebar({ isOpen }: { isOpen: boolean }) {
  return (
    <aside
      className={`hidden h-full flex-shrink-0 flex-col overflow-y-auto border-r border-white/5 bg-[#0F0F0F] py-4 transition-all duration-300 ease-in-out md:flex ${
        isOpen ? "w-[240px] px-3" : "w-[72px] px-1"
      }`}
    >
      <SidebarGroup items={primaryMenu} isOpen={isOpen} />
      <SidebarDivider />
      <SidebarGroup items={libraryMenu} isOpen={isOpen} />
      <SidebarDivider />
      <SidebarGroup items={platformMenu} isOpen={isOpen} />
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

  return (
    <nav className="space-y-1">
      {items.map((item) => {
        const Icon = item.icon;
        const isActive =
          item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

        return (
          <Link
            key={item.title}
            href={item.href}
            title={item.title}
            className={`flex w-full items-center rounded-lg py-2.5 text-left text-sm font-medium text-white/82 transition-all duration-300 hover:bg-white/10 hover:text-white ${
              isOpen ? "justify-start gap-3 px-3" : "justify-center gap-0 px-0"
            } ${
              isActive
                ? "bg-white/10 text-[#D4AF37]"
                : "text-white/82 hover:text-white"
            }`}
          >
            <Icon className="h-5 w-5 shrink-0" strokeWidth={1.75} />
            <span
              className={`truncate whitespace-nowrap transition-all duration-200 ${
                isOpen
                  ? "max-w-[150px] opacity-100"
                  : "max-w-0 overflow-hidden opacity-0"
              }`}
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

function FilterChips() {
  return (
    <div className="flex min-w-0 flex-1 gap-3 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
      {filterChips.map((chip, index) => (
        <button
          key={chip}
          type="button"
          className={`shrink-0 rounded-lg px-4 py-2 text-sm font-semibold transition ${
            index === 0
              ? "bg-white text-black hover:bg-white/90"
              : "bg-white/10 text-white hover:bg-white/20"
          }`}
        >
          {chip}
        </button>
      ))}
    </div>
  );
}

function ShortsSection() {
  return (
    <section className="mt-4">
      <div className="mb-4 flex items-center gap-3">
        <Flame className="h-6 w-6 fill-[#D4AF37]/20 text-[#D4AF37]" />
        <h2 className="font-heading text-2xl font-bold tracking-tight text-white">
          Shorts
        </h2>
      </div>

      <div className="grid grid-cols-[repeat(5,minmax(160px,1fr))] gap-4 overflow-x-auto pb-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {shorts.map((short) => (
          <ShortCard key={short.title} short={short} />
        ))}
      </div>
    </section>
  );
}

function ShortCard({ short }: { short: ShortItem }) {
  return (
    <article className="group relative aspect-[9/16] min-w-[160px] overflow-hidden rounded-xl bg-white/5">
      <div
        className="absolute inset-0 bg-cover bg-center transition duration-300 group-hover:scale-105"
        style={{ backgroundImage: `url(${short.thumbnail})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/88 via-black/18 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 p-3">
        <h3 className="line-clamp-2 text-sm font-bold leading-snug text-white">
          {short.title}
        </h3>
        <p className="mt-1 text-xs font-medium text-white/65">{short.views}</p>
      </div>
    </article>
  );
}

function VideoGrid() {
  return (
    <section className="mt-8">
      <div className="mb-5 flex items-center gap-3">
        <Film className="h-6 w-6 text-[#D4AF37]" />
        <h2 className="font-heading text-2xl font-bold tracking-tight text-white">
          Đề xuất cho bạn
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
        {videos.slice(0, 10).map((video) => (
          <VideoCard key={video.title} video={video} />
        ))}
      </div>
    </section>
  );
}

function LegacyHomeSections() {
  return (
    <div className="mt-16 flex w-full max-w-full flex-col gap-y-12 overflow-hidden pb-24 [&_.container]:mx-0 [&_.container]:max-w-full [&_.container]:px-0 [&_.keen-slider]:overflow-visible [&_img]:aspect-video [&_img]:w-full [&_img]:rounded-xl [&_img]:object-cover [&_img]:transition-transform [&_img]:duration-500 hover:[&_img]:scale-105">
      <ContinueWatching />
      <Top10Today />
      <InterestCategories />
      <FeaturedPromo />
      <DailyTopVideosRow />
      <ChineseSeriesRow />
      <KoreanDramaRow />

      <div className="h-px w-full bg-white/5" />

      <TrendingComics />
      <DestinyCategories />
      <NewReleasesRow />
      <WebtoonAdaptationsRow />
      <EditorialSpotlight />
      <MysteryThrillerRow />
    </div>
  );
}

function VideoCard({ video }: { video: VideoItem }) {
  return (
    <article className="group">
      <div className="relative aspect-video overflow-hidden rounded-xl bg-white/5">
        <div
          className="absolute inset-0 bg-cover bg-center transition duration-300 group-hover:scale-105"
          style={{ backgroundImage: `url(${video.thumbnail})` }}
        />
        <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition group-hover:bg-black/25 group-hover:opacity-100">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur">
            <Play className="ml-0.5 h-5 w-5 fill-white" />
          </span>
        </div>
        <span className="absolute bottom-2 right-2 rounded bg-black/78 px-1.5 py-0.5 text-xs font-bold text-white">
          {video.duration}
        </span>
      </div>

      <div className="mt-3 flex gap-3">
        <div
          className="h-9 w-9 shrink-0 rounded-full bg-cover bg-center ring-1 ring-white/10"
          style={{ backgroundImage: `url(${video.avatar})` }}
        />
        <div className="min-w-0">
          <h3 className="line-clamp-2 text-sm font-bold leading-snug text-white">
            {video.title}
          </h3>
          <p className="mt-1 truncate text-sm font-medium text-white/48">
            {video.creator}
          </p>
          <p className="mt-0.5 text-sm font-medium text-white/48">
            {video.views} • {video.postedAt}
          </p>
        </div>
      </div>
    </article>
  );
}
