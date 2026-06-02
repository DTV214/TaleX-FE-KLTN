"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { Play, BookOpen } from "lucide-react";
import { motion } from "framer-motion";

export function HeroBanner() {
  // Cấu hình Embla Carousel với Autoplay (chuyển slide sau 7 giây)
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true }, [
    Autoplay({ delay: 7000, stopOnInteraction: false }),
  ]);

  const [selectedIndex, setSelectedIndex] = useState(0);

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

  // Dữ liệu Carousel
  const slides = [
    {
      id: 1,
      titleLine1: "Where Stories",
      titleHighlight: "Come Alive",
      desc: "Watch cinematic universes. Read immersive legends. Experience the fusion of high-fidelity streaming and premium digital literature.",
      // Ảnh mock cho nửa trái (Tone tối, có kiến trúc vòng quay như ảnh của bạn)
      bgLeft:
        "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1200&auto=format&fit=crop",
      // Ảnh mock cho nửa phải (Nhân vật, thế giới fantasy như ảnh tinh thể)
      bgRight:
        "https://plus.unsplash.com/premium_photo-1779748921527-5aeea34b3aad?q=80&w=2532&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      rightTag: "Explore Universes",
    },
    {
      id: 2,
      titleLine1: "Forge Your",
      titleHighlight: "Own Legacy",
      desc: "Step into realms where magic and technology collide. Uncover the secrets of a thousand worlds crafted by visionary creators.",
      bgLeft:
        "https://images.unsplash.com/photo-1504333638930-c8787321fee0?q=80&w=1200&auto=format&fit=crop",
      bgRight:
        "https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=1200&auto=format&fit=crop",
      rightTag: "Sci-Fi Chronicles",
    },
    {
      id: 3,
      titleLine1: "Feel Every",
      titleHighlight: "Heartbeat",
      desc: "Dive deep into emotional journeys. From breathtaking romances to tear-jerking slice-of-life tales, find the stories that resonate with your soul.",
      bgLeft:
        "https://images.unsplash.com/photo-1518621736915-f3b1c41bfd00?q=80&w=1200&auto=format&fit=crop",
      bgRight:
        "https://images.unsplash.com/photo-1499092346589-b9b6be3e94b2?q=80&w=1200&auto=format&fit=crop",
      rightTag: "Emotional Romance",
    },
  ];

  return (
    <section className="relative w-full min-h-[90vh] bg-black overflow-hidden group">
      {/* Khung Carousel */}
      <div
        className="overflow-hidden w-full h-full absolute inset-0"
        ref={emblaRef}
      >
        <div className="flex w-full h-full">
          {slides.map((slide, index) => (
            <div
              key={slide.id}
              className="relative flex-none w-full h-full flex flex-col md:flex-row"
            >
              {/* NỬA TRÁI: Nội dung chính */}
              <div className="w-full md:w-1/2 h-[50vh] md:h-full relative overflow-hidden flex flex-col justify-center px-6 md:px-16 lg:px-24 md:border-r border-white/10">
                {/* Background nửa trái với Overlay làm tối */}
                <div
                  className="absolute inset-0 bg-cover bg-center opacity-40 transition-transform duration-[10000ms] group-hover:scale-105"
                  style={{ backgroundImage: `url(${slide.bgLeft})` }}
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/70 to-transparent" />

                <motion.div
                  className="relative z-10"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{
                    opacity: selectedIndex === index ? 1 : 0,
                    y: selectedIndex === index ? 0 : 30,
                  }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                >
                  <h1 className="text-4xl md:text-5xl lg:text-7xl font-extrabold font-heading leading-[1.1] text-white tracking-tight mb-6">
                    {slide.titleLine1} <br />
                    <span className="text-[#D4AF37] drop-shadow-[0_0_15px_rgba(212,175,55,0.3)]">
                      {slide.titleHighlight}
                    </span>
                  </h1>

                  <p className="text-muted-foreground text-sm md:text-base max-w-md leading-relaxed font-sans mb-10">
                    {slide.desc}
                  </p>

                  {/* Khu vực Nút bấm chuẩn thiết kế */}
                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    {/* Nút Watch Now */}
                    <Link
                      href="/series"
                      className="group flex items-center justify-center gap-3 px-8 py-4 rounded-xl bg-[#D4AF37] text-black font-bold text-base transition-all hover:bg-[#E5C158] hover:scale-105 shadow-[0_0_20px_rgba(212,175,55,0.2)] w-full sm:w-auto"
                    >
                      <div className="w-6 h-6 rounded-full border border-black flex items-center justify-center group-hover:bg-black group-hover:text-[#D4AF37] transition-colors">
                        <Play className="w-3 h-3 ml-0.5" fill="currentColor" />
                      </div>
                      Watch Now
                    </Link>

                    {/* Nút Start Reading */}
                    <Link
                      href="/comics"
                      className="flex items-center justify-center gap-3 px-8 py-4 rounded-xl border border-white/10 bg-white/5 backdrop-blur-md text-white font-bold text-base transition-all hover:bg-white/10 hover:border-white/30 hover:scale-105 w-full sm:w-auto"
                    >
                      <BookOpen className="w-5 h-5 text-muted-foreground" />
                      Start Reading
                    </Link>
                  </div>
                </motion.div>
              </div>

              {/* NỬA PHẢI: Hình ảnh hiển thị nghệ thuật */}
              <div className="w-full md:w-1/2 h-[40vh] md:h-full relative overflow-hidden flex items-end p-8 md:p-16">
                <div
                  className="absolute inset-0 bg-cover bg-top md:bg-center transition-transform duration-[10000ms] group-hover:scale-110 opacity-80"
                  style={{ backgroundImage: `url(${slide.bgRight})` }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                <div className="absolute inset-0 md:bg-gradient-to-l from-transparent via-transparent to-black/80" />

                <motion.div
                  className="relative z-10"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{
                    opacity: selectedIndex === index ? 1 : 0,
                    x: selectedIndex === index ? 0 : 20,
                  }}
                  transition={{ duration: 0.8, delay: 0.5 }}
                >
                  <h3 className="text-white text-xl md:text-3xl font-heading font-bold drop-shadow-lg">
                    {slide.rightTag.split(" ").map((word, i) => (
                      <React.Fragment key={i}>
                        {word} <br />
                      </React.Fragment>
                    ))}
                  </h3>
                </motion.div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Điều hướng Carousel: Thanh tiến trình & Dots */}
      <div className="absolute bottom-8 left-0 w-full z-20 px-6 md:px-16 lg:px-24 flex items-center gap-4">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => emblaApi?.scrollTo(index)}
            className="group relative flex h-2 flex-1 max-w-[80px] cursor-pointer items-center justify-center overflow-hidden rounded-full bg-white/20"
          >
            {/* Thanh tiến trình chạy theo slide đang active */}
            {selectedIndex === index && (
              <motion.div
                className="absolute left-0 top-0 h-full bg-[#D4AF37]"
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 7, ease: "linear" }}
              />
            )}
          </button>
        ))}
      </div>
    </section>
  );
}
