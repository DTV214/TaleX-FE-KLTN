"use client";

import { useState, MouseEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence, useMotionTemplate, useMotionValue } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Film,
  Eye,
  Users,
  AlertCircle,
  HelpCircle,
  Play,
  Sparkles,
} from "lucide-react";
import { getPublicSeriesList } from "../api/series-api";
import Link from "next/link";

export function SeriesList() {
  const [page, setPage] = useState(1);
  const [pageSize] = useState(12);

  // Chuỗi theo dõi tọa độ chuột cho hiệu ứng Spotlight trên toàn Grid
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  function handleMouseMove({ currentTarget, clientX, clientY }: MouseEvent) {
    const { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  }

  // Gọi API lấy danh sách phim bộ ("VIDEO")
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["publicMovieSeries", page, pageSize],
    queryFn: () => getPublicSeriesList(page, pageSize, "VIDEO"),
  });

  const seriesItems = data?.content || [];
  const totalPages = data?.totalPages || 1;
  const isFirst = data?.isFirst ?? true;
  const isLast = data?.isLast ?? true;

  const handlePrevPage = () => {
    if (page > 1) {
      setPage((prev) => prev - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleNextPage = () => {
    if (page < totalPages) {
      setPage((prev) => prev + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <div className="w-full min-h-screen bg-[#060607] text-gray-100 antialiased selection:bg-[#D4AF37]/30 selection:text-white">
      
      {/* 1. Phần tiêu đề đề mục nhỏ gọn nhưng sang trọng */}
      <div className="container mx-auto px-4 md:px-8 pt-10 pb-2">
        <div className="flex items-center gap-2.5 text-xs font-bold tracking-[0.2em] text-[#D4AF37] uppercase">
          <Sparkles className="w-3.5 h-3.5 animate-pulse" />
          <span>Khám Phá Điện Ảnh</span>
        </div>
        <h1 className="text-2xl md:text-3xl font-black text-white mt-1 tracking-tight">
          Danh Sách Phim Đặc Sắc
        </h1>
      </div>

      {/* Main Movie Section */}
      <section className="container mx-auto px-4 md:px-8 pb-16 pt-6">
        
        {/* TRẠNG THÁI LOADING */}
        {isLoading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-4 gap-6 md:gap-8">
            {Array.from({ length: 8 }).map((_, idx) => (
              <div key={idx} className="flex flex-col space-y-4">
                <div className="aspect-[2/3] w-full rounded-2xl bg-gradient-to-br from-white/[0.02] to-white/[0.05] border border-white/[0.04] relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/[0.03] before:to-transparent" />
                <div className="h-5 bg-white/[0.03] rounded-md w-5/6" />
                <div className="h-4 bg-white/[0.03] rounded-md w-2/3" />
              </div>
            ))}
          </div>
        )}

        {/* TRẠNG THÁI LỖI */}
        {isError && (
          <div className="py-24 text-center max-w-md mx-auto">
            <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center text-red-400 mx-auto mb-6 border border-red-500/20">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold mb-2 text-white">Không thể tải danh sách</h3>
            <p className="text-gray-400 text-sm mb-6">
              {error instanceof Error ? error.message : "Hệ thống gặp sự cố nhỏ, vui lòng thử lại."}
            </p>
            <button
              onClick={() => refetch()}
              className="px-6 py-2.5 bg-gradient-to-r from-white to-gray-200 text-black font-semibold rounded-xl hover:shadow-[0_0_30px_rgba(255,255,255,0.15)] transition-all"
            >
              Thử lại ngay
            </button>
          </div>
        )}

        {/* DANH SÁCH PHIM CHÍNH */}
        {!isLoading && !isError && (
          <>
            {seriesItems.length === 0 ? (
              <div className="py-32 text-center max-w-md mx-auto">
                <div className="w-16 h-16 rounded-full bg-white/[0.02] border border-white/[0.06] flex items-center justify-center text-gray-500 mx-auto mb-6">
                  <HelpCircle className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold mb-2 text-white">Kho phim trống</h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                  Hiện tại danh mục chưa cập nhật nội dung. Vui lòng quay lại sau!
                </p>
              </div>
            ) : (
              /* Grid bọc ngoài tích hợp hiệu ứng Spotlight Chuột */
              <div 
                onMouseMove={handleMouseMove}
                className="relative group/grid grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-4 gap-6 md:gap-8"
              >
                {/* Lớp ánh sáng chạy theo chuột (Ẩn trên thiết bị cảm ứng di động) */}
                <motion.div
                  className="pointer-events-none absolute -inset-px rounded-xl opacity-0 group-hover/grid:opacity-100 transition duration-500 hidden md:block z-0"
                  style={{
                    background: useMotionTemplate`
                      radial-gradient(
                        550px circle at ${mouseX}px ${mouseY}px,
                        rgba(214, 175, 55, 0.04),
                        transparent 80%
                      )
                    `,
                  }}
                />

                <AnimatePresence mode="popLayout">
                  {seriesItems.map((movie) => (
                    <motion.div
                      key={movie.seriesId}
                      variants={{
                        hidden: { opacity: 0, y: 24 },
                        visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.215, 0.61, 0.355, 1] } },
                      }}
                      className="group flex flex-col relative z-10"
                    >
                      <Link
                        href={`/series/${movie.seriesId}`}
                        className="relative block w-full cursor-pointer"
                      >
                        {/* Poster cao cấp ứng dụng zoom và trượt nút Play */}
                        <div className="relative aspect-[2/3] w-full rounded-2xl overflow-hidden bg-[#121214] mb-4 border border-white/[0.06] group-hover:border-[#D4AF37]/50 shadow-2xl transition-all duration-500 group-hover:scale-[1.01] group-hover:shadow-[0_20px_40px_rgba(0,0,0,0.7)]">
                          
                          {/* Ảnh nền */}
                          {movie.coverUrl ? (
                            <div
                              className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 ease-[cubic-bezier(0.25,1,0.5,1)] group-hover:scale-110 group-hover:blur-[1px]"
                              style={{ backgroundImage: `url(${movie.coverUrl})` }}
                            />
                          ) : (
                            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-white/[0.06] flex flex-col items-center justify-center p-4 text-center">
                              <Film className="w-9 h-9 text-gray-600 mb-2" />
                              <span className="text-[11px] text-gray-500">No Poster Available</span>
                            </div>
                          )}

                          {/* Lớp Overlay Đen Điện Ảnh sâu hơn */}
                          <div className="absolute inset-0 bg-gradient-to-t from-[#060607] via-black/10 to-transparent opacity-80 group-hover:opacity-85 transition-opacity duration-300" />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300" />

                          {/* ĐẶC SẮC: Nút Play tròn xuất hiện mượt mà ở chính giữa khi Hover */}
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 scale-75 group-hover:opacity-100 group-hover:scale-100 transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]">
                            <div className="w-14 h-14 rounded-full bg-[#D4AF37] text-black flex items-center justify-center shadow-[0_0_30px_rgba(212,175,55,0.5)] transform group-hover:rotate-12 transition-transform duration-500">
                              <Play className="w-6 h-6 fill-black ml-0.5" />
                            </div>
                          </div>

                          {/* Gắn nhãn phân loại tuổi ở góc */}
                          {movie.ageRating && (
                            <div className="absolute top-3.5 left-3.5 z-10">
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-black tracking-wider uppercase bg-black/70 border border-white/[0.12] text-[#D4AF37] backdrop-blur-md">
                                {movie.ageRating}
                              </span>
                            </div>
                          )}

                          {/* Thanh thống kê tối giản kết hợp kính mờ (Glassmorphism) */}
                          <div className="absolute bottom-3.5 left-3.5 right-3.5 flex items-center justify-between text-[10px] text-gray-200 font-bold tracking-wider z-10 opacity-100 group-hover:opacity-0 transition-opacity duration-200">
                            <span className="flex items-center gap-1.5 bg-black/50 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/[0.06]">
                              <Eye className="w-3 h-3 text-[#D4AF37]" /> {movie.totalViews.toLocaleString("vi-VN")}
                            </span>
                            <span className="flex items-center gap-1.5 bg-black/50 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/[0.06]">
                              <Users className="w-3 h-3 text-[#D4AF37]" /> {movie.totalSubscriptions.toLocaleString("vi-VN")}
                            </span>
                          </div>
                        </div>

                        {/* Tiêu đề và Mô tả được tối ưu hóa hiển thị */}
                        <div className="px-1.5 transform transition-transform duration-300 group-hover:translate-x-1">
                          <div className="flex items-center gap-2">
                            <Film className="w-3.5 h-3.5 text-gray-500 group-hover:text-[#D4AF37] flex-shrink-0 transition-colors" />
                            <h2 className="text-gray-100 font-extrabold text-base md:text-lg line-clamp-1 group-hover:text-[#D4AF37] transition-colors duration-300 tracking-tight">
                              {movie.title}
                            </h2>
                          </div>
                          <p className="text-gray-400 text-xs md:text-sm mt-1.5 line-clamp-2 leading-relaxed font-normal opacity-80 group-hover:opacity-100 transition-opacity">
                            {movie.description || "Bấm để xem thông tin chi tiết và lịch chiếu của bộ phim này trên hệ thống."}
                          </p>
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}

            {/* 4. Bộ phân trang tinh gọn cao cấp */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 mt-20 border-t border-white/[0.04] pt-10">
                <button
                  onClick={handlePrevPage}
                  disabled={isFirst}
                  className="flex items-center justify-center w-11 h-11 rounded-xl bg-white/[0.01] border border-white/[0.06] text-white transition-all hover:bg-white/[0.05] hover:border-[#D4AF37]/30 disabled:opacity-20 disabled:pointer-events-none active:scale-90"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-2">
                  {Array.from({ length: totalPages }).map((_, idx) => {
                    const pageIndex = idx + 1;
                    const isCurrent = page === pageIndex;

                    if (totalPages > 6 && Math.abs(page - pageIndex) > 2 && pageIndex !== 1 && pageIndex !== totalPages) {
                      if (pageIndex === 2 || pageIndex === totalPages - 1) {
                        return <span key={pageIndex} className="text-gray-600 px-1 select-none">...</span>;
                      }
                      return null;
                    }

                    return (
                      <button
                        key={pageIndex}
                        onClick={() => setPage(pageIndex)}
                        className={`w-11 h-11 rounded-xl text-sm font-black transition-all duration-300 ${
                          isCurrent
                            ? "bg-[#D4AF37] text-black shadow-[0_0_25px_rgba(212,175,55,0.4)] scale-105"
                            : "bg-white/[0.01] border border-white/[0.05] text-gray-400 hover:text-white hover:border-white/20 hover:bg-white/[0.03]"
                        }`}
                      >
                        {pageIndex}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={handleNextPage}
                  disabled={isLast}
                  className="flex items-center justify-center w-11 h-11 rounded-xl bg-white/[0.01] border border-white/[0.06] text-white transition-all hover:bg-white/[0.05] hover:border-[#D4AF37]/30 disabled:opacity-20 disabled:pointer-events-none active:scale-90"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}