import { MainHeroBanner } from "@/features/home/components/main-hero-banner";
import { ContinueWatching } from "@/features/home/components/continue-watching";
import { InterestCategories } from "@/features/home/components/interest-categories";
import { Top10Today } from "@/features/home/components/top-10-today";
import { FeaturedPromo } from "@/features/home/components/featured-promo";
import { MysteryThrillerRow } from "@/features/home/components/mystery-thriller-row";
import { ChineseSeriesRow } from "@/features/home/components/chinese-series-row";
import { KoreanDramaRow } from "@/features/home/components/korean-drama-row";
import { NewReleasesRow } from "@/features/home/components/new-releases-row";
import { DailyTopVideosRow } from "@/features/home/components/daily-top-videos-row";

export default function Home() {
  return (
    <main className="flex flex-col w-full min-h-screen bg-[#0B0B0C] pb-20">
      {/* 1. Main Hero Banner */}
      <MainHeroBanner />

      {/* 2. Tiếp tục xem */}
      <ContinueWatching />

      {/* 3. Thể loại yêu thích */}
      <InterestCategories />

      {/* 4. TaleX Top 10 Today */}
      <Top10Today />

      {/* 5. Banner Quảng bá Nổi bật */}
      <FeaturedPromo />

      {/* 6. Mới Nhất Trên TaleX (Banner Mới) */}
      <NewReleasesRow />

      {/* 7. Video Hay Mỗi Ngày (Banner Mới) */}
      <DailyTopVideosRow />

      {/* 8. Mystery & Thriller */}
      <MysteryThrillerRow />

      {/* 9. New Chinese Series */}
      <ChineseSeriesRow />

      {/* 10. Korean Drama Collection */}
      <KoreanDramaRow />
    </main>
  );
}
