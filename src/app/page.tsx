import { MainHeroBanner } from "@/features/home/components/main-hero-banner";
import { ContinueWatching } from "@/features/home/components/continue-watching";
import { InterestCategories } from "@/features/home/components/interest-categories";
import { Top10Today } from "@/features/home/components/top-10-today";
import { FeaturedPromo } from "@/features/home/components/featured-promo";
import { NewReleasesRow } from "@/features/home/components/new-releases-row";
import { DailyTopVideosRow } from "@/features/home/components/daily-top-videos-row";
import { MysteryThrillerRow } from "@/features/home/components/mystery-thriller-row";
import { ChineseSeriesRow } from "@/features/home/components/chinese-series-row";
import { KoreanDramaRow } from "@/features/home/components/korean-drama-row";

// IMPORT CÁC COMPONENT MỚI THÊM
import { DestinyCategories } from "@/features/home/components/destiny-categories";
import { EditorialSpotlight } from "@/features/home/components/editorial-spotlight";
import { WebtoonAdaptationsRow } from "@/features/home/components/webtoon-adaptations-row";
import { TrendingComics } from "@/features/intro/components/trending-comics";

export default function Home() {
  return (
    <main className="flex flex-col w-full min-h-screen bg-[#0B0B0C] pb-20 overflow-hidden">
      {/* --- PHẦN 1: KHỞI ĐẦU CHUNG --- */}
      <MainHeroBanner />
      <ContinueWatching />
      <Top10Today />
      {/* --- PHẦN 2: THẾ GIỚI PHIM & VIDEO --- */}
      <FeaturedPromo /> {/* Promo lớn cho phim */}
      <InterestCategories /> {/* Phân loại có ảnh nền cho Phim */}
      <DailyTopVideosRow />
      <ChineseSeriesRow />
      <KoreanDramaRow />
      {/* --- PHẦN 3: THẾ GIỚI TRUYỆN TRANH & WEBTOON --- */}
      {/* Khoảng trống để tách biệt 2 luồng nội dung */}
      <div className="w-full h-px bg-white/5 my-8" />
      <TrendingComics />
      <DestinyCategories /> {/* Phân loại dạng gradient cho Truyện */}
      <NewReleasesRow />
      <WebtoonAdaptationsRow />
      {/* --- PHẦN 4: BANNER TÍCH HỢP ADS & BÀI ĐỌC SÂU --- */}
      <EditorialSpotlight />
      {/* --- PHẦN 5: THỂ LOẠI ĐẶC THÙ CUỐI TRANG --- */}
      <MysteryThrillerRow />
    </main>
  );
}
