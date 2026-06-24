"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import useEmblaCarousel from "embla-carousel-react";
import {
  Award,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Flame,
  Sparkles,
  Star,
} from "lucide-react";

const rankedComics = [
  {
    id: 2,
    rank: "02",
    title: "Giai Điệu Nửa Đêm",
    genre: "Hình sự đen tối",
    chapters: 35,
    rating: 4.8,
    badge: "Thịnh hành nổi bật",
    image:
      "https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=900&auto=format&fit=crop",
  },
  {
    id: 1,
    rank: "01",
    title: "Đội Tiên Phong Thiên Giới",
    genre: "Hành động",
    chapters: 48,
    rating: 4.9,
    badge: "Xếp hạng cao nhất",
    highlight: "Chương 48",
    isSpotlight: true,
    image:
      "https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=1000&auto=format&fit=crop",
  },
  {
    id: 3,
    rank: "03",
    title: "Lời Thì Thầm Của Rừng",
    genre: "Kỳ ảo",
    chapters: 22,
    rating: 4.7,
    badge: "Đề xuất",
    highlight: "Chương mới",
    image:
      "https://images.unsplash.com/photo-1448375240586-882707db888b?q=80&w=900&auto=format&fit=crop",
  },
  {
    id: 4,
    rank: "04",
    title: "Tiếng Vọng Vực Thẳm",
    genre: "Kỳ ảo đen tối",
    chapters: 67,
    rating: 4.6,
    badge: "Biên tập viên đề cử",
    image:
      "https://images.unsplash.com/photo-1507842217343-583bb7270b66?q=80&w=900&auto=format&fit=crop",
  },
  {
    id: 5,
    rank: "05",
    title: "Nhà Tiên Tri Trong Kính",
    genre: "Bí ẩn",
    chapters: 19,
    rating: 4.5,
    badge: "Đang lên",
    image:
      "https://images.unsplash.com/photo-1541961017774-22a55fa24283?q=80&w=900&auto=format&fit=crop",
  },
];

export function TrendingComics() {
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
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
      <div className="absolute left-1/2 top-[48%] -z-10 h-[620px] w-[620px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/5 blur-[150px]" />

      <div className="container mx-auto px-4 md:px-8">
        <div className="mb-12 flex flex-col items-center text-center md:mb-16">
          <span className="mb-3 block text-xs font-bold uppercase tracking-[0.45em] text-primary">
            Huyền Thoại Thị Giác
          </span>
          <h2 className="font-heading text-4xl font-extrabold leading-none text-foreground md:text-6xl lg:text-7xl">
            Truyện Tranh Thịnh Hành
          </h2>
          <div className="mt-7 h-1 w-20 rounded-full bg-primary shadow-[0_0_18px_rgba(212,175,55,0.45)]" />
        </div>

        <div className="relative">
          <div className="overflow-hidden py-8" ref={emblaRef}>
            <div className="flex items-center">
              {rankedComics.map((comic, index) => {
                const isActive = selectedIndex === index;

                return (
                  <article
                    key={comic.id}
                    className="min-w-0 flex-[0_0_74%] px-3 sm:flex-[0_0_46%] lg:flex-[0_0_32%] xl:flex-[0_0_28%]"
                  >
                    <Link
                      href={`/comics/${comic.id}`}
                      className={`group relative block overflow-hidden rounded-lg border bg-black shadow-2xl transition-all duration-500 ${
                        isActive
                          ? "aspect-[3/4] scale-100 border-primary/45 shadow-[0_22px_80px_rgba(212,175,55,0.16)] lg:scale-110"
                          : "aspect-[2/3] scale-90 border-white/10 opacity-75 hover:scale-95 hover:opacity-100"
                      }`}
                    >
                      <div
                        className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                        style={{ backgroundImage: `url(${comic.image})` }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/35 to-transparent" />
                      <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/25" />

                      <div className="pointer-events-none absolute inset-0 -translate-x-full bg-[linear-gradient(115deg,transparent_0%,rgba(255,255,255,0.06)_35%,rgba(212,175,55,0.35)_50%,rgba(255,255,255,0.08)_65%,transparent_100%)] transition-transform duration-1000 group-hover:translate-x-full" />
                      <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
                        <Sparkles className="absolute right-6 top-8 h-5 w-5 text-primary/80" />
                        <Sparkles className="absolute bottom-28 left-8 h-4 w-4 text-primary/60" />
                        <Sparkles className="absolute right-12 top-1/2 h-3.5 w-3.5 text-white/70" />
                      </div>

                      <div className="absolute left-4 top-4 flex items-center gap-2">
                        <span
                          className={`flex h-10 min-w-12 items-center justify-center rounded-md border px-3 text-sm font-extrabold tracking-wider ${
                            isActive
                              ? "border-primary bg-primary text-black"
                              : "border-primary/35 bg-black/35 text-primary backdrop-blur-md"
                          }`}
                        >
                          {comic.rank}
                        </span>
                        {isActive && (
                          <span className="hidden items-center gap-1 rounded-full border border-primary/35 bg-black/40 px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-primary backdrop-blur-md sm:flex">
                            <Award className="h-3.5 w-3.5" />
                            {comic.badge}
                          </span>
                        )}
                      </div>

                      <div className="absolute right-4 top-4 flex items-center gap-1 rounded-full bg-black/45 px-3 py-1.5 text-xs font-bold text-primary backdrop-blur-md">
                        <Star className="h-3.5 w-3.5 fill-current" />
                        {comic.rating.toFixed(1)}
                      </div>

                      <div className="absolute inset-x-0 bottom-0 p-5 md:p-6">
                        {isActive && (
                          <span className="mb-4 inline-flex rounded-full bg-primary px-4 py-1.5 text-[10px] font-extrabold uppercase tracking-widest text-black">
                            {comic.badge}
                          </span>
                        )}

                        <h3
                          className={`font-heading font-extrabold leading-tight text-white transition-all ${
                            isActive
                              ? "text-3xl md:text-4xl"
                              : "text-2xl md:text-3xl"
                          }`}
                        >
                          {comic.title}
                        </h3>

                        <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] font-bold uppercase tracking-[0.28em] text-primary">
                          <span>{comic.genre}</span>
                          <span className="h-1 w-1 rounded-full bg-primary/70" />
                          <span>{comic.highlight ?? `${comic.chapters} chương`}</span>
                        </div>

                        <div
                          className={`mt-5 flex items-center gap-2 text-sm font-semibold text-white/80 transition-opacity ${
                            isActive
                              ? "opacity-100"
                              : "opacity-0 group-hover:opacity-100"
                          }`}
                        >
                          <BookOpen className="h-4 w-4 text-primary" />
                          Bắt đầu đọc
                        </div>
                      </div>
                    </Link>
                  </article>
                );
              })}
            </div>
          </div>

          <button
            type="button"
            aria-label="Xem truyện thịnh hành trước"
            onClick={() => emblaApi?.scrollPrev()}
            className="absolute left-0 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-black/60 text-foreground backdrop-blur-md transition hover:border-primary/50 hover:text-primary md:flex"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            aria-label="Xem truyện thịnh hành tiếp theo"
            onClick={() => emblaApi?.scrollNext()}
            className="absolute right-0 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-black/60 text-foreground backdrop-blur-md transition hover:border-primary/50 hover:text-primary md:flex"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-5 md:flex-row">
          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            <Flame className="h-4 w-4 text-primary" />
            Truyện được đọc nhiều, đánh giá cao và tuyển chọn kỹ lưỡng.
          </div>

          <div className="flex items-center gap-3">
            {rankedComics.map((comic, index) => (
              <button
                key={comic.id}
                type="button"
                aria-label={`Chuyển đến truyện xếp hạng ${comic.rank}`}
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
            href="/comics"
            className="group inline-flex items-center justify-center gap-2 rounded-lg border border-primary/30 bg-white/[0.04] px-8 py-3 text-sm font-semibold text-foreground transition hover:border-primary/60 hover:bg-primary/10 hover:text-primary"
          >
            Khám phá tất cả truyện tranh
            <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </section>
  );
}
