"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight, ChevronLeft } from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";

export function Top10Today() {
  // Cấu hình Embla Carousel: Căn giữa thẻ active, lặp vô tận
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    align: "center",
  });
  const [selectedIndex, setSelectedIndex] = useState(0);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
    return () => {
      emblaApi.off("select", onSelect);
      emblaApi.off("reInit", onSelect);
    };
  }, [emblaApi, onSelect]);

  const scrollPrev = useCallback(
    () => emblaApi && emblaApi.scrollPrev(),
    [emblaApi],
  );
  const scrollNext = useCallback(
    () => emblaApi && emblaApi.scrollNext(),
    [emblaApi],
  );

  const top10Data = [
    {
      id: 1,
      title: "Celestial Vanguard",
      genre: "Action Fantasy",
      image:
        "https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=800&auto=format&fit=crop",
    },
    {
      id: 2,
      title: "Shadow of Aether",
      genre: "Dark Fantasy",
      image:
        "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=800&auto=format&fit=crop",
    },
    {
      id: 3,
      title: "Neon Promise",
      genre: "Cyberpunk",
      image:
        "https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=800&auto=format&fit=crop",
    },
    {
      id: 4,
      title: "Seoul Protocol",
      genre: "Sci-Fi Thriller",
      image:
        "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=800&auto=format&fit=crop",
    },
    {
      id: 5,
      title: "Crimson Relay",
      genre: "Mystery",
      image:
        "https://images.unsplash.com/photo-1455390582262-044cdead277a?q=80&w=800&auto=format&fit=crop",
    },
  ];

  return (
    <section className="w-full py-12 overflow-hidden relative">
      <div className="container mx-auto px-4 md:px-8 relative z-10">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h3 className="text-xl md:text-2xl font-bold text-white tracking-wide mb-1">
              TaleX Top 10 Today
            </h3>
            <p className="text-sm text-gray-400">
              The most-watched series across the globe right now.
            </p>
          </div>
          <Link
            href="/top-10"
            className="flex items-center text-sm font-semibold text-[#D4AF37] hover:text-[#E5C158] transition-colors whitespace-nowrap"
          >
            View All <ChevronRight className="w-4 h-4 ml-1" />
          </Link>
        </div>

        <div className="relative group">
          <div className="overflow-visible" ref={emblaRef}>
            <div className="flex items-center py-10">
              {top10Data.map((item, index) => {
                const rank = index + 1;
                const isActive = selectedIndex === index;

                return (
                  <div
                    key={item.id}
                    className={`relative flex-[0_0_55%] sm:flex-[0_0_35%] md:flex-[0_0_22%] lg:flex-[0_0_18%] pl-8 md:pl-12 transition-all duration-700 ease-out ${
                      isActive
                        ? "z-20 scale-110"
                        : "z-10 scale-90 opacity-50 hover:opacity-80 cursor-pointer"
                    }`}
                    onClick={() => !isActive && emblaApi?.scrollTo(index)}
                  >
                    <div
                      className={`absolute -left-4 md:-left-8 top-1/2 -translate-y-1/2 font-heading font-black pointer-events-none select-none transition-all duration-700 ${
                        isActive
                          ? "text-[#D4AF37] drop-shadow-[0_0_20px_rgba(212,175,55,0.4)] z-30"
                          : "text-transparent z-0"
                      }`}
                      style={{
                        fontSize: isActive ? "160px" : "120px",
                        lineHeight: 1,
                        WebkitTextStroke: isActive
                          ? "0px"
                          : "2px rgba(255,255,255,0.2)",
                        textShadow: isActive
                          ? "4px 4px 0px rgba(0,0,0,0.8), 8px 8px 15px rgba(0,0,0,0.6)"
                          : "none",
                      }}
                    >
                      {rank}
                    </div>

                    <Link href={`/series/${item.id}`} className="block">
                      <div
                        className={`relative aspect-[2/3] rounded-xl overflow-hidden bg-[#1A1A1A] transition-all duration-500 shadow-2xl ${
                          isActive
                            ? "border border-[#D4AF37] shadow-[0_0_40px_rgba(212,175,55,0.25)]"
                            : "border border-white/5"
                        }`}
                      >
                        {rank === 1 && isActive && (
                          <div className="absolute top-0 right-0 bg-[#D4AF37] text-black text-[10px] font-bold px-3 py-1.5 rounded-bl-lg uppercase tracking-widest z-20 shadow-lg">
                            Top 1
                          </div>
                        )}

                        {/* Background Image trực tiếp */}
                        <div
                          className="absolute inset-0 bg-cover bg-center transition-transform duration-700 ease-out"
                          style={{ backgroundImage: `url(${item.image})` }}
                        />
                        <div className="absolute inset-0 bg-black/20 transition-colors duration-300 pointer-events-none" />

                        <div className="absolute inset-0 bg-gradient-to-t from-[#0B0B0C] via-[#0B0B0C]/40 to-transparent pointer-events-none" />

                        <div className="absolute bottom-0 left-0 w-full p-4">
                          <h4 className="text-white font-bold text-base md:text-lg leading-tight mb-1 line-clamp-2">
                            {item.title}
                          </h4>
                          <p className="text-[#D4AF37] text-[10px] md:text-xs font-semibold uppercase tracking-widest">
                            {item.genre}
                          </p>
                        </div>
                      </div>
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>

          <button
            onClick={scrollPrev}
            className="absolute -left-4 md:left-0 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/60 border border-white/10 backdrop-blur-md flex items-center justify-center text-white opacity-0 group-hover:opacity-100 hover:bg-[#D4AF37] hover:border-[#D4AF37] hover:text-black transition-all z-30 shadow-xl"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={scrollNext}
            className="absolute -right-4 md:right-0 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/60 border border-white/10 backdrop-blur-md flex items-center justify-center text-white opacity-0 group-hover:opacity-100 hover:bg-[#D4AF37] hover:border-[#D4AF37] hover:text-black transition-all z-30 shadow-xl"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>
      </div>
    </section>
  );
}
