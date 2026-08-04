"use client";

import { useCallback, useRef } from "react";
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Clapperboard,
  Heart,
  Sparkles,
  Star,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { adsApi, type AdServeResponse } from "@/features/ads/api/ads-api";
import { HomeFeed } from "@/features/recommendations/components/home-feed";
import { AdSlot } from "@/shared/ui/ad-slot";

export default function Home() {
  return (
    <div className="relative flex h-[calc(100vh-64px)] w-full overflow-hidden bg-[#12100d] text-white md:h-[calc(100vh-80px)]">
      <HomeAtmosphere />
      <main className="relative z-10 h-full min-w-0 flex-1 overflow-y-auto p-4 transition-all duration-300 ease-in-out md:p-6 no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        <div className="mx-auto w-full max-w-[1680px]">
          <HomeFeed promotedComicAfter={<AdImageCarousel />} />
        </div>
      </main>
    </div>
  );
}

function HomeAtmosphere() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center opacity-[0.13]"
        style={{
          backgroundImage:
            "url(https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=2200&auto=format&fit=crop)",
        }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(212,175,55,0.18),transparent_32%),radial-gradient(circle_at_88%_18%,rgba(151,176,255,0.12),transparent_28%),linear-gradient(180deg,rgba(18,16,13,0.7)_0%,rgba(8,8,8,0.93)_48%,#080808_100%)]" />
      <div className="absolute -left-28 top-28 h-72 w-[720px] rotate-[-10deg] rounded-[100%] border-t border-[#D4AF37]/14" />
      <div className="absolute right-[-180px] top-20 h-[380px] w-[760px] rotate-[16deg] rounded-[100%] border-t border-cyan-100/10" />
      <Sparkles className="absolute left-[18%] top-[18%] h-6 w-6 text-[#D4AF37]/16" />
      <Star className="absolute right-[12%] top-[22%] h-7 w-7 text-[#D4AF37]/14" />
      <Heart className="absolute right-[20%] top-[48%] h-6 w-6 text-rose-200/10" />
      <BookOpen className="absolute left-[12%] top-[55%] h-7 w-7 text-cyan-100/10" />
      <Clapperboard className="absolute left-[46%] top-[15%] h-7 w-7 rotate-[-12deg] text-white/8" />
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
    <section className="relative overflow-hidden rounded-[1.15rem] border border-white/7 bg-[#111113]/92 p-1.5 shadow-[0_14px_42px_rgba(0,0,0,0.26)]">
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-[#111113] to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-[#111113] to-transparent" />

      {displayAds.length > 1 ? (
        <>
          <button
            type="button"
            aria-label="Quảng cáo trước"
            onClick={() => scrollCarousel(-1)}
            className="absolute left-2 top-1/2 z-20 flex h-8 w-8 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-white/10 bg-black/55 text-white/80 shadow-lg backdrop-blur-md transition hover:border-[#D4AF37]/40 hover:bg-[#D4AF37] hover:text-black"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="Quảng cáo tiếp theo"
            onClick={() => scrollCarousel(1)}
            className="absolute right-2 top-1/2 z-20 flex h-8 w-8 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-white/10 bg-black/55 text-white/80 shadow-lg backdrop-blur-md transition hover:border-[#D4AF37]/40 hover:bg-[#D4AF37] hover:text-black"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </>
      ) : null}

      <div
        ref={scrollRef}
        className="flex h-[118px] snap-x snap-mandatory gap-2 overflow-x-auto scroll-smooth pr-10 [scrollbar-width:none] md:h-[140px] lg:h-[158px] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
      >
        {displayAds.map((ad: AdServeResponse, index) => (
          <div
            key={`${ad.campaignId}-${index}`}
            className="group relative ml-1 h-full w-[76vw] shrink-0 snap-start overflow-hidden rounded-[0.95rem] border border-white/5 bg-white/[0.04] md:w-[330px] lg:w-[410px]"
          >
            <SunSheen />
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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function SponsoredRecommendationSection() {
  const sponsorCards = [
    {
      title: "Manga Night",
      description: "Góc truyện đêm nhẹ",
      imageUrl:
        "https://images.unsplash.com/photo-1612036782180-6f0b6cd846fe?q=80&w=520&auto=format&fit=crop",
    },
    {
      title: "Anime Mood",
      description: "Sắc màu cinematic",
      imageUrl:
        "https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=520&auto=format&fit=crop",
    },
    {
      title: "Creator Pick",
      description: "Nội dung nổi bật",
      imageUrl:
        "https://images.unsplash.com/photo-1518709268805-4e9042af2176?q=80&w=520&auto=format&fit=crop",
    },
    {
      title: "TaleX Space",
      description: "Vị trí tài trợ mới",
      imageUrl:
        "https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=520&auto=format&fit=crop",
    },
  ];
  return (
    <section className="my-10">
      <div className="mb-5 flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-[#D4AF37]" />
          <h2 className="bg-[linear-gradient(110deg,rgba(255,255,255,0.78),rgba(255,255,255,0.78),rgba(212,175,55,0.95),rgba(151,176,255,0.72),rgba(255,255,255,0.78))] bg-[length:220%_100%] bg-clip-text font-sans text-2xl font-semibold tracking-tight text-white/84 transition-[color,filter] duration-300 hover:text-transparent hover:drop-shadow-[0_0_18px_rgba(212,175,55,0.22)]">
            Nhà tài trợ
          </h2>
        </div>
        <p className="text-sm font-medium text-white/40">
          Không gian tài trợ được đặt riêng để trải nghiệm vẫn thoáng mắt.
        </p>
      </div>

      <div className="group relative flex flex-col gap-6 overflow-hidden rounded-2xl border border-white/5 bg-[#1a1a1c]/92 p-6 shadow-[0_18px_70px_rgba(0,0,0,0.22)] md:flex-row">
        <SunSheen />
        <div className="relative min-w-0 flex-1">
          <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="mb-2 inline-flex items-center rounded-full border border-[#D4AF37]/20 bg-[#D4AF37]/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-[#D4AF37]">
                TaleX sponsor space
              </div>
              <h3 className="bg-[linear-gradient(110deg,rgba(255,255,255,0.82),rgba(255,255,255,0.82),rgba(212,175,55,0.95),rgba(255,255,255,0.82))] bg-[length:220%_100%] bg-clip-text font-sans text-xl font-semibold tracking-tight text-white/84 transition-[color,filter] duration-300 hover:text-transparent hover:drop-shadow-[0_0_18px_rgba(212,175,55,0.2)] md:text-2xl">
                Nổi bật nhẹ, không làm phiền mạch xem
              </h3>
              <p className="mt-2 max-w-xl text-sm font-medium leading-relaxed text-white/42">
                Các thẻ gợi ý được sắp xếp ziczac để tạo nhịp thị giác, phần
                quảng cáo thật vẫn nằm riêng bên phải.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pb-1 sm:grid-cols-4 sm:pb-7 lg:max-w-[720px]">
            {sponsorCards.map((card, index) => (
              <div
                key={card.title}
                className={`group/card relative min-h-[150px] overflow-hidden rounded-[1.35rem] border border-white/[0.08] bg-white/[0.04] shadow-[0_16px_36px_rgba(0,0,0,0.22)] transition duration-300 hover:-translate-y-1 hover:border-[#D4AF37]/35 sm:min-h-[190px] ${
                  index % 2 === 1 ? "sm:translate-y-7" : ""
                }`}
              >
                <div
                  className="absolute inset-0 bg-cover bg-center opacity-70 transition duration-500 group-hover/card:scale-105 group-hover/card:opacity-90"
                  style={{ backgroundImage: `url(${card.imageUrl})` }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/88 via-black/22 to-transparent" />
                <span className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full border border-[#D4AF37]/35 bg-black/55 text-[#D4AF37] backdrop-blur-md">
                  <Star className="h-4 w-4 fill-[#D4AF37]" />
                </span>
                <span className="absolute left-3 top-3 rounded-full bg-black/55 px-2 py-1 text-[10px] font-bold text-white/58 backdrop-blur-md">
                  0{index + 1}
                </span>
                <div className="absolute bottom-4 left-4 right-4">
                  <h4 className="line-clamp-1 font-sans text-sm font-semibold text-white/88">
                    {card.title}
                  </h4>
                  <p className="mt-1 line-clamp-2 text-xs font-medium text-white/46">
                    {card.description}
                  </p>
                </div>
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

function SunSheen() {
  return (
    <span className="pointer-events-none absolute -left-20 -top-24 z-20 h-[180%] w-14 -translate-x-full rotate-12 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 blur-[1px] transition-all duration-700 ease-out group-hover:translate-x-[820%] group-hover:opacity-100" />
  );
}
