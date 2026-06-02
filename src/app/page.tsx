import { HeroBanner } from "@/features/home/components/hero-banner";
import { NarrativeSection } from "@/features/home/components/narrative-section";
import { FeaturedSeries } from "@/features/home/components/featured-series";
import { TrendingComics } from "@/features/home/components/trending-comics";
import { ExploreChambers } from "@/features/home/components/explore-chambers";
import { CountNumber } from "@/features/home/components/count-number";
import { CreatorHighlight } from "@/features/home/components/creator-highlight";
import { FinalCta } from "@/features/home/components/final-cta";

export default function Home() {
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
