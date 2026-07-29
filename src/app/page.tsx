"use client";

import { useCallback, useRef } from "react";
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { adsApi, type AdServeResponse } from "@/features/ads/api/ads-api";
import { HomeFeed } from "@/features/recommendations/components/home-feed";
import { AdSlot } from "@/shared/ui/ad-slot";

export default function Home() {
  return (
    <div className="flex h-[calc(100vh-64px)] w-full overflow-hidden bg-[#0F0F0F] text-white md:h-[calc(100vh-80px)]">
      <main className="relative h-full min-w-0 flex-1 overflow-y-auto p-4 transition-all duration-300 ease-in-out md:p-6 no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        <AdImageCarousel />
        <SponsoredRecommendationSection />
        <HomeFeed />
      </main>
    </div>
  );
}

function AdImageCarousel() {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const { data: ads, isLoading } = useQuery({
    queryKey: ["serve-all-ads", "HOME_BANNER"],
    queryFn: () => adsApi.serveAllAds("HOME_BANNER"),
    staleTime: 0,
    refetchOnWindowFocus: false,
  });

  const scrollCarousel = useCallback((direction: -1 | 1) => {
    const container = scrollRef.current;
    if (!container) return;

    const scrollDistance = Math.min(container.clientWidth * 0.78, 430);
    container.scrollBy({
      left: direction * scrollDistance,
      behavior: "smooth",
    });
  }, []);

  if (isLoading || !ads || ads.length === 0) return null;

  const displayAds =
    ads.length < 4
      ? Array.from({ length: 4 }, (_, index) => ads[index % ads.length])
      : ads;

  return (
    <section className="relative mt-5 overflow-hidden rounded-2xl border border-white/5 bg-[#111113] p-2 shadow-[0_18px_60px_rgba(0,0,0,0.35)]">
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-20 bg-gradient-to-r from-[#111113] to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-20 bg-gradient-to-l from-[#111113] to-transparent" />

      {displayAds.length > 1 ? (
        <>
          <button
            type="button"
            aria-label="Quảng cáo trước"
            onClick={() => scrollCarousel(-1)}
            className="absolute left-3 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-white/10 bg-black/55 text-white/80 shadow-lg backdrop-blur-md transition hover:border-[#D4AF37]/40 hover:bg-[#D4AF37] hover:text-black"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="Quảng cáo tiếp theo"
            onClick={() => scrollCarousel(1)}
            className="absolute right-3 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-white/10 bg-black/55 text-white/80 shadow-lg backdrop-blur-md transition hover:border-[#D4AF37]/40 hover:bg-[#D4AF37] hover:text-black"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </>
      ) : null}

      <div
        ref={scrollRef}
        className="flex h-[230px] snap-x snap-mandatory gap-2 overflow-x-auto scroll-smooth pr-12 [scrollbar-width:none] md:h-[270px] lg:h-[310px] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
      >
        {displayAds.map((ad: AdServeResponse, index) => (
          <div
            key={`${ad.campaignId}-${index}`}
            className="relative ml-2 h-full w-[78vw] shrink-0 snap-start overflow-hidden rounded-xl border border-white/5 bg-white/[0.04] md:w-[360px] lg:w-[430px]"
          >
            <AdSlot
              adData={ad}
              className="h-full min-h-0 w-full rounded-none border-none bg-transparent"
            />
          </div>
        ))}
      </div>
    </section>
  );
}

function SponsoredRecommendationSection() {
  const previewTiles = [
    "https://images.unsplash.com/photo-1518791841217-8f162f1e1131?q=80&w=240&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=240&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1612036782180-6f0b6cd846fe?q=80&w=240&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=240&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=240&auto=format&fit=crop",
  ];

  return (
    <section className="my-10">
      <div className="mb-5 flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-[#D4AF37]" />
          <h2 className="font-heading text-2xl font-bold tracking-tight text-white">
            Đề xuất dành cho bạn
          </h2>
        </div>
        <p className="text-sm font-medium text-white/45">
          Hãy chọn món bạn thích nhất!
        </p>
      </div>

      <div className="flex flex-col gap-6 rounded-2xl border border-white/5 bg-[#1a1a1c] p-6 md:flex-row">
        <div className="min-w-0 flex-1">
          <div className="mb-4 inline-flex items-center rounded-full border border-[#D4AF37]/20 bg-[#D4AF37]/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-[#D4AF37]">
            TaleX chọn lọc
          </div>

          <h3 className="font-heading text-2xl font-black tracking-tight text-white md:text-3xl">
            Cuộc sống thường nhật của vị vua bất tử
          </h3>

          <div className="mt-4 flex flex-wrap gap-2">
            {["Trồng trọt", "Khuôn viên đại học"].map((tag) => (
              <span
                key={tag}
                className="rounded-md bg-white/10 px-2.5 py-1 text-xs font-bold text-white/70"
              >
                {tag}
              </span>
            ))}
          </div>

          <p className="mt-4 max-w-2xl text-sm font-medium leading-relaxed text-white/55">
            Một lát cắt đời thường dịu mắt, nơi những bí mật cổ xưa va vào
            nhịp sống trẻ trung và các câu chuyện nhỏ dần trở nên đáng nhớ.
          </p>

          <div className="mt-6 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            {previewTiles.map((imageUrl, index) => (
              <div
                key={imageUrl}
                className="group relative h-16 w-12 shrink-0 overflow-hidden rounded-md bg-white/10 ring-1 ring-white/5"
              >
                <div
                  className="absolute inset-0 bg-cover bg-center opacity-[0.78] transition duration-300 group-hover:scale-110 group-hover:opacity-100"
                  style={{ backgroundImage: `url(${imageUrl})` }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
                <span className="absolute bottom-1 right-1 rounded bg-black/55 px-1 text-[9px] font-black text-white/70">
                  {index + 1}
                </span>
              </div>
            ))}
          </div>
        </div>

        <AdSlot
          slotId="mock-home-featured"
          format="rectangle"
          className="h-full min-h-[280px] w-full shrink-0 md:w-[320px] lg:w-[400px]"
        />
      </div>
    </section>
  );
}
