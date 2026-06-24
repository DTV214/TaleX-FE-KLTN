"use client";

import React, { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { Play, Plus, Info } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function MainHeroBanner() {
  // Cấu hình Carousel tự động chuyển sau 7s
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, duration: 40 }, [
    Autoplay({ delay: 7000, stopOnInteraction: false }),
  ]);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;

    // Đã FIX LỖI: Chỉ gán event listener thay vì gọi trực tiếp onSelect() đồng bộ
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);

    return () => {
      emblaApi.off("select", onSelect);
      emblaApi.off("reInit", onSelect);
    };
  }, [emblaApi, onSelect]);

  // Mock Data cho 3 Banner
  const banners = [
    {
      id: 1,
      badge1: "Tập mới tối nay",
      badge2: "Lãng mạn nổi bật",
      studio: "Xưởng phim TaleX",
      title: "Cơn Mưa Nặng Hạt Của \n Thế Giới Giấc Mơ Mới",
      image:
        "https://images.unsplash.com/photo-1707340733209-d8adf5ad25e6?q=80&w=2532&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", // Ảnh Totoro vibe
    },
    {
      id: 2,
      badge1: "Mùa cuối",
      badge2: "Hành động & Khoa học viễn tưởng",
      studio: "Hãng CyberWorks",
      title: "Tiếng Vọng Từ \n Thành Phố Cơ Giới",
      image:
        "https://plus.unsplash.com/premium_photo-1661964177687-57387c2cbd14?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    },
    {
      id: 3,
      badge1: "Thịnh hành số 1",
      badge2: "Kỳ ảo đen tối",
      studio: "Hãng hoạt hình Mythos",
      title: "Đôi Cánh Của \n Thiên Thần Sa Ngã",
      image:
        "https://plus.unsplash.com/premium_photo-1709311450621-6ce6545e2564?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    },
  ];

  return (
    <section className="relative w-full h-[85vh] min-h-[650px] flex items-end pb-24 pt-32 overflow-hidden group">
      {/* Khung Carousel */}
      <div className="absolute inset-0 z-0 overflow-hidden" ref={emblaRef}>
        <div className="flex w-full h-full">
          {banners.map((banner) => (
            <div key={banner.id} className="relative flex-none w-full h-full">
              {/* Ảnh nền */}
              <div
                className="absolute inset-0 bg-cover bg-center md:bg-top transition-transform duration-[10000ms] ease-out group-hover:scale-105"
                style={{ backgroundImage: `url(${banner.image})` }}
              />
              {/* Gradient che phủ để làm nổi chữ và blend với viền đen */}
              <div className="absolute inset-0 bg-gradient-to-r from-[#0B0B0C] via-[#0B0B0C]/70 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0B0B0C] via-[#0B0B0C]/20 to-transparent" />
            </div>
          ))}
        </div>
      </div>

      {/* Nội dung tĩnh (Chỉ thay đổi data bên trong để tạo hiệu ứng mượt) */}
      <div className="container relative z-10 mx-auto px-4 md:px-8">
        <div className="max-w-3xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedIndex}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            >
              {/* Nhãn (Badges) */}
              <div className="flex flex-wrap items-center gap-3 mb-6">
                <span className="px-3 py-1.5 rounded-sm bg-[#D4AF37]/20 text-[#D4AF37] text-xs font-bold uppercase tracking-wider border border-[#D4AF37]/30 backdrop-blur-md">
                  {banners[selectedIndex].badge1}
                </span>
                <span className="px-3 py-1.5 rounded-sm bg-white/10 text-white text-xs font-bold uppercase tracking-wider backdrop-blur-md border border-white/10">
                  {banners[selectedIndex].badge2}
                </span>
              </div>

              {/* Tiêu đề Phim/Truyện */}
              <h1 className="text-sm font-bold text-gray-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-3">
                <span className="w-1.5 h-5 bg-[#D4AF37] rounded-full shadow-[0_0_10px_rgba(212,175,55,0.8)]"></span>
                {banners[selectedIndex].studio}
              </h1>

              <h2 className="text-4xl md:text-6xl lg:text-7xl font-extrabold text-white mb-10 leading-[1.1] drop-shadow-[0_4px_24px_rgba(0,0,0,0.8)] font-heading whitespace-pre-line">
                {banners[selectedIndex].title}
              </h2>
            </motion.div>
          </AnimatePresence>

          {/* Cụm Nút Tương Tác - Thiết kế to, rõ, hover hiệu ứng nổi */}
          <div className="flex flex-wrap items-center gap-4">
            <button className="group flex items-center gap-3 px-8 py-4 bg-[#E50914] text-white rounded font-bold text-lg transition-all hover:bg-[#ff0a16] hover:scale-105 hover:shadow-[0_0_30px_rgba(229,9,20,0.5)] active:scale-95">
              <Play className="w-6 h-6 fill-current" />
              Xem ngay
            </button>

            <button className="flex items-center gap-3 px-8 py-4 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white rounded font-bold text-lg transition-all border border-white/20 hover:border-white/50 hover:scale-105 active:scale-95">
              <Info className="w-6 h-6" />
              Xem đoạn giới thiệu
            </button>

            <button
              type="button"
              aria-label="Thêm vào danh sách"
              className="flex items-center justify-center w-14 h-14 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white rounded transition-all border border-white/20 hover:border-white/50 hover:scale-105 active:scale-95"
            >
              <Plus className="w-7 h-7" />
            </button>
          </div>
        </div>
      </div>

      {/* Thanh Điều hướng Tiến trình (Progress Dots) */}
      <div className="absolute bottom-6 md:bottom-8 right-4 md:right-8 z-20 flex items-center gap-3">
        {banners.map((_, index) => (
          <button
            key={index}
            type="button"
            aria-label={`Chuyển đến banner ${index + 1}`}
            onClick={() => emblaApi?.scrollTo(index)}
            className="relative h-1.5 overflow-hidden rounded-full transition-all duration-300 bg-white/20"
            style={{ width: selectedIndex === index ? "48px" : "24px" }}
          >
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
