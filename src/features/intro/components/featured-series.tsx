"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import useEmblaCarousel from "embla-carousel-react";
import {
  Award,
  ChevronLeft,
  ChevronRight,
  Flame,
  Play,
  Star,
} from "lucide-react";

const rankedSeries = [
  {
    id: 2,
    rank: "02",
    title: "Seoul Protocol",
    category: "Sci-fi Thriller",
    episodes: 18,
    rating: 4.8,
    badge: "Top Trend",
    image:
      "https://images.unsplash.com/photo-1480714378408-67cf0d13bc1f?q=80&w=1100&auto=format&fit=crop",
  },
  {
    id: 1,
    rank: "01",
    title: "The Last Alchemist",
    category: "Epic Fantasy",
    episodes: 24,
    rating: 4.9,
    badge: "Ranked",
    highlight: "Series of the Month",
    isSpotlight: true,
    image:
      "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1200&auto=format&fit=crop",
  },
  {
    id: 3,
    rank: "03",
    title: "Shadow of Aether",
    category: "Action Fantasy",
    episodes: 16,
    rating: 4.7,
    badge: "Recommended",
    image:
      "https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=1100&auto=format&fit=crop",
  },
  {
    id: 4,
    rank: "04",
    title: "Crimson Relay",
    category: "Mystery Drama",
    episodes: 10,
    rating: 4.6,
    badge: "Editor's Pick",
    image:
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1100&auto=format&fit=crop",
  },
  {
    id: 5,
    rank: "05",
    title: "Neon Promise",
    category: "Cyber Romance",
    episodes: 12,
    rating: 4.5,
    badge: "Rising",
    image:
      "https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=1100&auto=format&fit=crop",
  },
];

export function FeaturedSeries() {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "center",
    loop: true,
    startIndex: 1,
  });
  const [selectedIndex, setSelectedIndex] = useState(1);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;

    emblaApi.on("select", onSelect);

    return () => {
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi, onSelect]);

  return (
    <section className="relative w-full overflow-hidden bg-background py-20 md:py-28">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
      <div className="absolute left-1/2 top-1/2 -z-10 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/5 blur-[140px]" />

      <div className="container mx-auto px-4 md:px-8">
        <div className="mb-12 flex flex-col items-center text-center md:mb-16">
          <span className="mb-3 block text-xs font-bold uppercase tracking-[0.45em] text-primary">
            Premium Experience
          </span>
          <h2 className="font-heading text-4xl font-extrabold leading-none text-foreground md:text-6xl lg:text-7xl">
            Featured Series
          </h2>
          <div className="mt-7 h-1 w-20 rounded-full bg-primary shadow-[0_0_18px_rgba(212,175,55,0.45)]" />
        </div>

        <div className="relative">
          <div className="overflow-hidden py-6" ref={emblaRef}>
            <div className="flex items-center">
              {rankedSeries.map((series, index) => {
                const isActive = selectedIndex === index;

                return (
                  <article
                    key={series.id}
                    className="min-w-0 flex-[0_0_86%] px-3 sm:flex-[0_0_58%] lg:flex-[0_0_38%] xl:flex-[0_0_34%]"
                  >
                    <Link
                      href={`/series/${series.id}`}
                      className={`group relative block aspect-[16/9] overflow-hidden rounded-lg border bg-black shadow-2xl transition-all duration-500 ${
                        isActive
                          ? "scale-100 border-primary/45 shadow-[0_18px_70px_rgba(212,175,55,0.16)] lg:scale-110"
                          : "scale-95 border-white/10 opacity-80 hover:opacity-100"
                      }`}
                    >
                      <div
                        className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                        style={{ backgroundImage: `url(${series.image})` }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/35 to-black/5" />
                      <div className="absolute inset-0 bg-gradient-to-r from-black/45 via-transparent to-black/20" />

                      <div className="absolute left-4 top-4 flex items-center gap-2">
                        <span
                          className={`flex h-9 min-w-12 items-center justify-center rounded-md border px-3 text-sm font-extrabold tracking-wider ${
                            isActive
                              ? "border-primary bg-primary text-black"
                              : "border-primary/35 bg-black/35 text-primary backdrop-blur-md"
                          }`}
                        >
                          {series.rank}
                        </span>
                        {isActive && (
                          <span className="hidden items-center gap-1 rounded-full border border-primary/35 bg-black/35 px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-primary backdrop-blur-md sm:flex">
                            <Award className="h-3.5 w-3.5" />
                            {series.badge}
                          </span>
                        )}
                      </div>

                      <div className="absolute right-4 top-4 flex items-center gap-1 rounded-full bg-black/45 px-3 py-1.5 text-xs font-bold text-primary backdrop-blur-md">
                        <Star className="h-3.5 w-3.5 fill-current" />
                        {series.rating.toFixed(1)}
                      </div>

                      <div
                        className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${
                          isActive
                            ? "opacity-0 group-hover:opacity-100"
                            : "opacity-0"
                        }`}
                      >
                        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-black shadow-[0_0_28px_rgba(212,175,55,0.55)]">
                          <Play className="ml-1 h-6 w-6 fill-current" />
                        </span>
                      </div>

                      <div className="absolute inset-x-0 bottom-0 p-5 md:p-6">
                        <div className="mb-3 flex flex-wrap items-center gap-2 text-[11px] font-bold uppercase tracking-[0.28em] text-primary">
                          <span>{series.category}</span>
                          <span className="h-1 w-1 rounded-full bg-primary/70" />
                          <span>{series.highlight ?? `${series.episodes} Episodes`}</span>
                        </div>
                        <h3
                          className={`font-heading font-extrabold leading-tight text-white transition-all ${
                            isActive
                              ? "text-3xl md:text-4xl"
                              : "text-2xl md:text-3xl"
                          }`}
                        >
                          {series.title}
                        </h3>
                      </div>
                    </Link>
                  </article>
                );
              })}
            </div>
          </div>

          <button
            type="button"
            aria-label="Previous featured series"
            onClick={() => emblaApi?.scrollPrev()}
            className="absolute left-0 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-black/60 text-foreground backdrop-blur-md transition hover:border-primary/50 hover:text-primary md:flex"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            aria-label="Next featured series"
            onClick={() => emblaApi?.scrollNext()}
            className="absolute right-0 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-black/60 text-foreground backdrop-blur-md transition hover:border-primary/50 hover:text-primary md:flex"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-5 md:flex-row">
          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            <Flame className="h-4 w-4 text-primary" />
            Trending, top rated, and editor picks rotate in this ranking.
          </div>

          <div className="flex items-center gap-3">
            {rankedSeries.map((series, index) => (
              <button
                key={series.id}
                type="button"
                aria-label={`Go to ranked series ${series.rank}`}
                onClick={() => emblaApi?.scrollTo(index)}
                className={`h-2.5 rounded-full transition-all ${
                  selectedIndex === index
                    ? "w-8 bg-primary"
                    : "w-2.5 bg-white/20 hover:bg-white/40"
                }`}
              />
            ))}
          </div>

          <Link
            href="/series"
            className="group inline-flex items-center gap-2 border-b border-primary/30 pb-1 text-sm font-semibold text-primary transition hover:border-primary"
          >
            Explore All Series
            <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </section>
  );
}
