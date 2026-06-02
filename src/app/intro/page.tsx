import { HeroBanner } from "@/features/intro/components/hero-banner";
import { NarrativeSection } from "@/features/intro/components/narrative-section";
import { FeaturedSeries } from "@/features/intro/components/featured-series";
import { TrendingComics } from "@/features/intro/components/trending-comics";
import { ExploreChambers } from "@/features/intro/components/explore-chambers";
import { CountNumber } from "@/features/intro/components/count-number";
import { CreatorHighlight } from "@/features/intro/components/creator-highlight";
import { FinalCta } from "@/features/intro/components/final-cta";

export default function Intro() {
  return (
    <div className="flex flex-col w-full">
      {/* 1. Màn hình chính */}
      <HeroBanner />

      {/* 2. Lưới ảnh bất đối xứng & Tầm nhìn */}
      <NarrativeSection />

      {/* 3. Cụm Video Nổi Bật ngang */}
      <FeaturedSeries />

      {/* 4. Cụm Truyện Thịnh Hành dọc */}
      <TrendingComics />

      {/* 5. Khám phá Thể loại */}
      <ExploreChambers />

      {/* 6. Các con số nổi bật */}
      <CountNumber />

      {/* 7. Góc nhìn Creators & Khung Avatar */}
      <CreatorHighlight />

      {/* 8. Lời kêu gọi hành động cuối trang (Hình nền núi) */}
      <FinalCta />
    </div>
  );
}
