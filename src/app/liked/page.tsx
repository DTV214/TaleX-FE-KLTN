"use client";

import { useEffect, useRef, useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { getMyLikedEpisodes } from "@/features/series/api/episode-likes-api";
import { getPublicEpisodeDetail } from "@/features/series/api/series-api";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Heart, Loader2, Play, BookOpen, Clock, Calendar } from "lucide-react";
import Link from "next/link";

export default function LikedPage() {
  const authUser = useAuthStore((state) => state.user);
  const router = useRouter();
  const [redirectingId, setRedirectingId] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<HTMLDivElement>(null);

  // 1. Fetch danh sách tập đã thích dạng vô hạn (12 phần tử mỗi trang)
  const {
    data,
    isLoading,
    isError,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["myLikedEpisodesInfinite"],
    queryFn: ({ pageParam = 0 }) => getMyLikedEpisodes(pageParam, 12),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => {
      return lastPage.last ? undefined : lastPage.number + 1;
    },
    enabled: !!authUser,
  });

  const likedEpisodes = data?.pages.flatMap((page) => page.content) || [];

  // 2. Tự động load trang tiếp theo khi cuộn xuống cuối màn hình
  useEffect(() => {
    const triggerEl = observerRef.current;
    if (!triggerEl || !hasNextPage || isFetchingNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          void fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(triggerEl);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // 3. Xử lý click chuyển tiếp (Lấy chi tiết để biết truyện hay phim)
  const handleEpisodeClick = async (episodeId: string) => {
    if (redirectingId) return;

    try {
      setRedirectingId(episodeId);
      const detail = await getPublicEpisodeDetail(episodeId);
      if (detail.contentType === "COMIC") {
        router.push(`/read/${episodeId}`);
      } else {
        router.push(`/watch/${episodeId}`);
      }
    } catch {
      toast.error("Không thể mở tập này. Vui lòng thử lại sau.");
      setRedirectingId(null);
    }
  };

  // Trạng thái chưa đăng nhập
  if (!authUser) {
    return (
      <div className="relative min-h-screen bg-[#080808] text-white flex flex-col items-center justify-center px-6">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(212,175,55,0.1),transparent_50%)]" />
        
        <div className="relative z-10 text-center max-w-sm">
          <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-6 text-slate-400">
            <Heart className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold mb-3">Nội dung đã thích</h1>
          <p className="text-sm text-gray-400 mb-8">
            Vui lòng đăng nhập tài khoản TaleX để quản lý và xem lại danh sách các tập phim, truyện bạn đã yêu thích.
          </p>
          <Link
            href="/login"
            className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-[#D4AF37] text-black font-extrabold hover:bg-[#E5C158] transition-all active:scale-[0.98]"
          >
            Đăng nhập ngay
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[#080808] text-white pb-24">
      {/* Lớp nền mờ */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_10%,rgba(212,175,55,0.12),transparent_35%),radial-gradient(circle_at_85%_15%,rgba(125,211,252,0.06),transparent_30%),linear-gradient(180deg,#080808_0%,#111114_60%,#080808_100%)]" />

      <div className="relative z-10 mx-auto w-full max-w-6xl px-4 py-8 lg:py-10">
        
        {/* Banner tiêu đề */}
        <div className="mb-8 rounded-3xl border border-white/10 bg-[#121214]/60 p-6 md:p-8 backdrop-blur-md shadow-2xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="absolute inset-0 bg-gradient-to-r from-[#D4AF37]/5 to-transparent pointer-events-none" />
          <div className="space-y-2 relative z-10">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black tracking-wider uppercase border border-red-500/20 bg-red-500/10 text-red-400">
              <Heart className="w-3 h-3 fill-current" /> Thư viện cá nhân
            </span>
            <h1 className="text-3xl font-black tracking-wide text-white">
              Nội Dung Đã Thích
            </h1>
            <p className="text-xs text-gray-400 max-w-xl">
              Nơi lưu trữ tất cả các tập phim, video và chương truyện tranh bạn từng nhấn yêu thích trên TaleX.
            </p>
          </div>
          
          <div className="flex items-center gap-4 shrink-0 bg-black/40 border border-white/5 px-6 py-4 rounded-2xl relative z-10">
            <div>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Tổng cộng</p>
              <p className="text-3xl font-black text-[#D4AF37] tabular-nums mt-0.5">
                {likedEpisodes.length}
              </p>
            </div>
            <div className="w-10 h-10 rounded-full bg-[#D4AF37]/10 flex items-center justify-center text-[#D4AF37]">
              <Heart className="w-5 h-5 fill-current" />
            </div>
          </div>
        </div>

        {/* LOADING BAN ĐẦU */}
        {isLoading && (
          <div className="min-h-[400px] flex flex-col items-center justify-center">
            <Loader2 className="w-10 h-10 animate-spin text-[#D4AF37] mb-4" />
            <p className="text-sm text-gray-400 animate-pulse font-medium">
              Đang tải danh sách yêu thích...
            </p>
          </div>
        )}

        {/* LỖI TẢI TRANG */}
        {isError && (
          <div className="min-h-[400px] flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 mb-6">
              <Heart className="w-8 h-8 stroke-[1.5]" />
            </div>
            <h2 className="text-xl font-bold mb-2">Tải dữ liệu thất bại</h2>
            <p className="text-sm text-gray-500 max-w-sm mb-6">
              Đã có lỗi xảy ra trong quá trình kết nối dữ liệu. Vui lòng làm mới lại trang web.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2.5 bg-white text-black font-bold rounded-xl hover:bg-gray-200 transition-all active:scale-[0.98]"
            >
              Tải lại trang
            </button>
          </div>
        )}

        {/* DANH SÁCH RỖNG */}
        {!isLoading && !isError && likedEpisodes.length === 0 && (
          <div className="min-h-[400px] rounded-3xl border border-dashed border-white/10 bg-white/[0.01] flex flex-col items-center justify-center text-center px-6 py-12">
            <div className="w-16 h-16 rounded-full bg-white/[0.03] flex items-center justify-center text-slate-500 mb-6 border border-white/5">
              <Heart className="w-8 h-8" />
            </div>
            <h2 className="text-lg font-bold mb-1">Chưa có nội dung yêu thích</h2>
            <p className="text-xs text-gray-500 max-w-xs mb-8">
              Bấm biểu tượng trái tim khi đang xem phim hoặc đọc truyện để lưu các tập phim yêu thích vào đây.
            </p>
            <Link
              href="/series"
              className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl text-xs font-bold transition-all active:scale-[0.98]"
            >
              Khám phá thư viện phim
            </Link>
          </div>
        )}

        {/* MẠNG LƯỚI CARD BÀI VIẾT ĐÃ THÍCH */}
        {!isLoading && !isError && likedEpisodes.length > 0 && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {likedEpisodes.map((item, idx) => {
                const isRedirecting = redirectingId === item.episodeId;
                
                return (
                  <div
                    key={`${item.episodeId}-${idx}`}
                    onClick={() => handleEpisodeClick(item.episodeId)}
                    className="group relative flex flex-col bg-[#121214]/40 border border-white/5 hover:border-[#D4AF37]/40 rounded-2xl overflow-hidden shadow-lg hover:shadow-[0_8px_30px_rgba(0,0,0,0.4)] transition-all duration-300 cursor-pointer"
                  >
                    {/* Cover Image & Action Overlay */}
                    <div className="relative aspect-video w-full overflow-hidden bg-white/[0.02]">
                      {/* Lớp phủ hành động */}
                      <div className="absolute inset-0 bg-black/40 group-hover:bg-black/50 transition-colors z-10 flex items-center justify-center">
                        <div className="w-11 h-11 rounded-full bg-[#D4AF37]/90 group-hover:bg-[#D4AF37] group-hover:scale-110 flex items-center justify-center text-black shadow-lg transition duration-300">
                          {isRedirecting ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : (
                            <Play className="w-5 h-5 fill-current ml-0.5" />
                          )}
                        </div>
                      </div>

                      {/* Image */}
                      <div
                        className="w-full h-full bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                        style={{
                          backgroundImage: `url(${
                            item.seriesCoverUrl ||
                            "https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?q=80&w=500&auto=format&fit=crop"
                          })`,
                        }}
                      />
                    </div>

                    {/* Content Detail */}
                    <div className="flex-1 p-5 flex flex-col justify-between space-y-4">
                      <div className="space-y-1.5">
                        <p className="text-[10px] font-black text-[#D4AF37] uppercase tracking-widest line-clamp-1">
                          {item.seriesTitle}
                        </p>
                        <h3 className="text-white font-bold text-sm leading-snug line-clamp-2 group-hover:text-[#D4AF37] transition-colors duration-200">
                          Tập {item.episodeNumber}: {item.episodeTitle}
                        </h3>
                      </div>

                      <div className="pt-3 border-t border-white/5 flex flex-col gap-1.5 text-[10px] text-gray-500 font-bold">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-gray-600" />
                          Thích lúc: {new Date(item.likedAt).toLocaleString("vi-VN", {
                            hour: "2-digit",
                            minute: "2-digit",
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric"
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Vùng Trigger tải tiếp trang sau */}
            <div ref={observerRef} className="py-12 flex justify-center">
              {isFetchingNextPage ? (
                <div className="flex items-center gap-2 text-sm text-gray-500 font-bold">
                  <Loader2 className="w-5 h-5 animate-spin text-[#D4AF37]" />
                  Đang tải thêm...
                </div>
              ) : hasNextPage ? (
                <div className="h-4" />
              ) : (
                <p className="text-xs text-gray-600 font-extrabold uppercase tracking-wider">
                  Đã tải hết nội dung yêu thích của bạn
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
