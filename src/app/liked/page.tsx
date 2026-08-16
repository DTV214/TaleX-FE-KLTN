"use client";

import { useEffect, useRef, useState } from "react";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getMyLikedEpisodes, unlikeEpisode } from "@/features/series/api/episode-likes-api";
import { getPublicEpisodeDetail } from "@/features/series/api/series-api";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Heart,
  Loader2,
  Play,
  BookOpen,
  Calendar,
  MoreVertical,
  Trash2,
  ExternalLink,
  Film,
  Sparkles,
  Star,
  Clapperboard,
  Flame,
  Tag,
} from "lucide-react";
import { cn } from "@/shared/utils/utils";
import Link from "next/link";

type TabType = "ALL" | "VIDEO" | "COMIC";

function PageAtmosphere() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center opacity-[0.14]"
        style={{
          backgroundImage:
            "url(https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=2200&auto=format&fit=crop)",
        }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(212,175,55,0.18),transparent_32%),radial-gradient(circle_at_88%_18%,rgba(151,176,255,0.12),transparent_28%),linear-gradient(180deg,rgba(18,16,13,0.7)_0%,rgba(8,8,8,0.93)_48%,#080808_100%)]" />
      <div className="absolute -left-28 top-28 h-72 w-[720px] rotate-[-10deg] rounded-[100%] border-t border-[#D4AF37]/14" />
      <div className="absolute right-[-180px] top-20 h-[380px] w-[760px] rotate-[16deg] rounded-[100%] border-t border-cyan-100/10" />

      {/* Floating Translucent Lucide Icons */}
      <Sparkles className="absolute left-[8%] top-[8%] h-7 w-7 text-[#D4AF37]/20" />
      <Star className="absolute right-[12%] top-[12%] h-8 w-8 text-[#D4AF37]/18" />
      <Clapperboard className="absolute left-[44%] top-[10%] h-8 w-8 rotate-[-12deg] text-white/10" />
      <BookOpen className="absolute left-[6%] top-[35%] h-8 w-8 text-cyan-100/14" />
      <Heart className="absolute right-[8%] top-[30%] h-7 w-7 text-rose-300/14" />
      <Film className="absolute left-[38%] top-[45%] h-9 w-9 rotate-[14deg] text-amber-200/12" />
      <Flame className="absolute right-[22%] top-[55%] h-8 w-8 text-orange-400/14" />
      <Tag className="absolute left-[14%] top-[70%] h-8 w-8 rotate-[-18deg] text-emerald-200/12" />
      <Sparkles className="absolute right-[10%] top-[8%] h-9 w-9 text-[#D4AF37]/20" />
      <Star className="absolute left-[48%] top-[85%] h-8 w-8 text-[#D4AF37]/16" />
    </div>
  );
}

export default function LikedPage() {
  const authUser = useAuthStore((state) => state.user);
  const router = useRouter();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<TabType>("ALL");
  const [redirectingId, setRedirectingId] = useState<string | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Client-side cache để lưu map từ episodeId -> contentType
  const [contentTypes, setContentTypes] = useState<Record<string, TabType>>({});

  const observerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // 1. Fetch danh sách tập đã thích
  const {
    data,
    isLoading,
    isError,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["myLikedEpisodesInfinite"],
    queryFn: ({ pageParam = 0 }) => getMyLikedEpisodes(pageParam, 15),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => {
      return lastPage.last ? undefined : lastPage.number + 1;
    },
    enabled: !!authUser,
  });

  const likedEpisodes = data?.pages.flatMap((page) => page.content) || [];

  // 2. Tự động truy vấn chi tiết của các tập hiển thị để lấy contentType (Video hoặc Comic) phục vụ việc lọc Tab
  useEffect(() => {
    likedEpisodes.forEach(async (item) => {
      if (contentTypes[item.episodeId]) return;
      try {
        const detail = await getPublicEpisodeDetail(item.episodeId);
        setContentTypes((prev) => ({
          ...prev,
          [item.episodeId]: detail.contentType as TabType,
        }));
      } catch {
        // bỏ qua lỗi
      }
    });
  }, [likedEpisodes, contentTypes]);

  // Lọc tập phim dựa theo tab đang chọn
  const filteredEpisodes = likedEpisodes.filter((item) => {
    if (activeTab === "ALL") return true;
    const type = contentTypes[item.episodeId];
    if (!type) return true; // Hiển thị tạm thời lúc đang load
    return type === activeTab;
  });

  // 3. Tự động load trang tiếp theo khi cuộn xuống dưới cùng
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

  // Click ra ngoài để tắt Menu 3 chấm
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setActiveMenuId(null);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  // 4. Mutation Bỏ thích tập phim trực tiếp từ trang danh sách
  const unlikeMutation = useMutation({
    mutationFn: (episodeId: string) => unlikeEpisode(episodeId),
    onMutate: async (episodeId) => {
      await queryClient.cancelQueries({ queryKey: ["myLikedEpisodesInfinite"] });
      const previousData = queryClient.getQueryData(["myLikedEpisodesInfinite"]);

      // Cập nhật Optimistic xóa tập khỏi danh sách
      queryClient.setQueryData(["myLikedEpisodesInfinite"], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page: any) => ({
            ...page,
            content: page.content.filter((item: any) => item.episodeId !== episodeId),
          })),
        };
      });

      return { previousData };
    },
    onError: (err, variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(["myLikedEpisodesInfinite"], context.previousData);
      }
      toast.error("Không thể bỏ thích tập phim. Vui lòng thử lại!");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myLikedEpisodesInfinite"] });
      queryClient.invalidateQueries({ queryKey: ["myLikedEpisodes"] });
      toast.success("Đã bỏ yêu thích tập phim.");
    },
  });

  // 5. Xử lý click chuyển hướng chi tiết
  const handleEpisodeClick = async (episodeId: string) => {
    if (redirectingId) return;

    // Nếu đã biết loại nội dung thì bay thẳng
    const type = contentTypes[episodeId];
    if (type) {
      router.push(`/${String(type).toUpperCase() === "COMIC" ? "read" : "watch"}/${episodeId}`);
      return;
    }

    try {
      setRedirectingId(episodeId);
      const detail = await getPublicEpisodeDetail(episodeId);
      router.push(`/${String(detail.contentType).toUpperCase() === "COMIC" ? "read" : "watch"}/${episodeId}`);
    } catch {
      toast.error("Không thể mở tập này. Vui lòng thử lại sau.");
      setRedirectingId(null);
    }
  };

  // Trạng thái chưa đăng nhập
  if (!authUser) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-[#12100d] pb-24 text-gray-100 antialiased flex flex-col items-center justify-center">
        <PageAtmosphere />
        <div className="relative z-10 mx-auto max-w-md px-4 py-16 text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl border border-rose-500/30 bg-rose-500/10 text-rose-500 shadow-[0_0_30px_rgba(244,63,94,0.15)]">
            <Heart className="h-10 w-10 fill-rose-500" />
          </div>
          <h1 className="mb-3 text-2xl font-extrabold tracking-tight text-white md:text-3xl">
            Nội dung đã thích
          </h1>
          <p className="mx-auto mb-8 max-w-sm text-sm text-gray-400 leading-relaxed">
            Vui lòng đăng nhập tài khoản TaleX để quản lý và xem lại danh sách các tập phim, truyện bạn đã yêu thích.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center justify-center px-8 py-3 rounded-2xl bg-[#D4AF37] hover:bg-[#E5C158] text-black font-extrabold transition-all duration-300 shadow-[0_6px_25px_rgba(212,175,55,0.3)] hover:scale-105"
          >
            Đăng nhập ngay
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#12100d] pb-24 text-gray-100 antialiased">
      <PageAtmosphere />

      <main className="relative z-10 mx-auto w-full max-w-[1680px] px-4 pt-8 md:px-8">
        
        {/* Banner tiêu đề & Tab Filters */}
        <div className="mb-10 flex flex-col justify-between gap-6 border-b border-white/10 pb-6 md:flex-row md:items-center">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-rose-500/30 bg-rose-500/10 text-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.15)]">
              <Heart className="h-6 w-6 fill-rose-500" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-white md:text-3xl flex items-center gap-2">
                Video & Truyện đã thích
              </h1>
              <p className="mt-0.5 text-xs text-gray-400 md:text-sm">
                Tổng số lượng: <strong className="text-[#D4AF37]">{likedEpisodes.length}</strong> tập phim/truyện đã yêu thích
              </p>
            </div>
          </div>

          {/* Cụm Tabs dạng Pill (Tất cả, Video, Truyện tranh) */}
          <div className="flex items-center gap-1.5 self-start rounded-2xl border border-white/10 bg-[#18181c]/90 p-1.5 backdrop-blur-md shadow-inner md:self-auto">
            <button
              onClick={() => setActiveTab("ALL")}
              className={cn(
                "rounded-xl px-4 py-2 text-xs font-bold transition-all cursor-pointer",
                activeTab === "ALL"
                  ? "bg-[#D4AF37] text-black shadow-md"
                  : "text-gray-400 hover:bg-white/5 hover:text-white"
              )}
            >
              Tất cả
            </button>
            <button
              onClick={() => setActiveTab("VIDEO")}
              className={cn(
                "flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition-all cursor-pointer",
                activeTab === "VIDEO"
                  ? "bg-[#D4AF37] text-black shadow-md"
                  : "text-gray-400 hover:bg-white/5 hover:text-white"
              )}
            >
              <Film className="h-3.5 w-3.5" />
              Video
            </button>
            <button
              onClick={() => setActiveTab("COMIC")}
              className={cn(
                "flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition-all cursor-pointer",
                activeTab === "COMIC"
                  ? "bg-[#D4AF37] text-black shadow-md"
                  : "text-gray-400 hover:bg-white/5 hover:text-white"
              )}
            >
              <BookOpen className="h-3.5 w-3.5" />
              Truyện tranh
            </button>
          </div>
        </div>

        {/* LOADING BAN ĐẦU */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <Loader2 className="mb-4 h-10 w-10 animate-spin text-[#D4AF37]" />
            <p className="text-sm font-semibold text-gray-400 animate-pulse">
              Đang tải danh sách yêu thích...
            </p>
          </div>
        )}

        {/* LỖI TẢI TRANG */}
        {isError && (
          <div className="mx-auto max-w-lg rounded-3xl border border-red-500/20 bg-[#18181c]/80 p-8 text-center backdrop-blur-md">
            <p className="mb-3 text-sm font-bold text-red-400">Tải dữ liệu thất bại</p>
            <p className="mb-4 text-xs text-gray-500">Vui lòng tải lại trang web.</p>
            <button
              onClick={() => window.location.reload()}
              className="rounded-xl bg-white/10 px-5 py-2 text-xs font-bold text-white transition hover:bg-white/20"
            >
              Tải lại
            </button>
          </div>
        )}

        {/* DANH SÁCH RỖNG */}
        {!isLoading && !isError && filteredEpisodes.length === 0 && (
          <div className="mx-auto max-w-lg rounded-3xl border border-white/10 bg-[#18181c]/60 p-12 text-center backdrop-blur-md shadow-2xl">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5 text-gray-500 border border-white/5">
              <Heart className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-bold text-white">Chưa có nội dung yêu thích</h3>
            <p className="mx-auto mt-1.5 max-w-xs text-xs text-gray-400 leading-relaxed">
              Bạn chưa thích tập {activeTab === "VIDEO" ? "video" : activeTab === "COMIC" ? "truyện tranh" : "phim/truyện"} nào.
            </p>
            <Link
              href="/series"
              className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-[#D4AF37] hover:bg-[#E5C158] px-6 py-2.5 text-xs font-extrabold text-black transition-all shadow-[0_4px_20px_rgba(212,175,55,0.25)] hover:scale-105"
            >
              Khám phá nội dung
            </Link>
          </div>
        )}

        {/* DANH SÁCH ROW LAYOUT */}
        {!isLoading && !isError && filteredEpisodes.length > 0 && (
          <div className="space-y-4">
            <div className="flex flex-col gap-3">
              {filteredEpisodes.map((item, idx) => {
                const isRedirecting = redirectingId === item.episodeId;
                const isMenuOpen = activeMenuId === item.episodeId;
                const itemType = contentTypes[item.episodeId];

                return (
                  <div
                    key={`${item.episodeId}-${idx}`}
                    className="group relative flex gap-4 sm:gap-6 p-4 rounded-2xl bg-[#18181c]/70 hover:bg-[#18181c] border border-white/10 hover:border-[#D4AF37]/40 shadow-md backdrop-blur-sm transition-all duration-300 items-start select-none"
                  >
                    {/* 1. Thumbnail phía bên trái */}
                    <div
                      onClick={() => handleEpisodeClick(item.episodeId)}
                      className="relative aspect-video w-36 sm:w-48 flex-none rounded-xl overflow-hidden bg-black/60 border border-white/5 group-hover:border-[#D4AF37]/40 cursor-pointer shadow-md"
                    >
                      {/* Play/Read Overlay */}
                      <div className="absolute inset-0 bg-black/40 group-hover:bg-black/55 transition-colors z-10 flex items-center justify-center">
                        <div className="w-10 h-10 rounded-full bg-[#D4AF37] text-black shadow-lg transition duration-300 group-hover:scale-110 flex items-center justify-center">
                          {isRedirecting ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : itemType === "COMIC" ? (
                            <BookOpen className="w-5 h-5" />
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

                    {/* 2. Phần thông tin giữa */}
                    <div
                      onClick={() => handleEpisodeClick(item.episodeId)}
                      className="flex-1 min-w-0 py-1 space-y-1.5 cursor-pointer"
                    >
                      <h3 className="text-white font-bold text-sm sm:text-base leading-snug line-clamp-1 group-hover:text-[#D4AF37] transition-colors duration-200">
                        {item.episodeTitle}
                      </h3>
                      
                      <div className="space-y-1 text-xs text-gray-400 font-medium">
                        <p className="text-[#D4AF37] font-bold truncate">
                          {item.seriesTitle} {item.episodeNumber != null && `• Tập ${item.episodeNumber}`}
                        </p>
                        
                        <p className="flex items-center gap-1.5 text-gray-500 text-[11px]">
                          <Calendar className="w-3.5 h-3.5 text-gray-500" />
                          Đã thích: {new Date(item.likedAt).toLocaleString("vi-VN", {
                            hour: "2-digit",
                            minute: "2-digit",
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric"
                          })}
                        </p>
                      </div>
                    </div>

                    {/* 3. Nút 3 chấm hành động phía bên phải */}
                    <div className="relative flex-none">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMenuId(isMenuOpen ? null : item.episodeId);
                        }}
                        className="p-2 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors cursor-pointer"
                        title="Tùy chọn"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>

                      {/* Dropdown Menu hành động */}
                      {isMenuOpen && (
                        <div
                          ref={menuRef}
                          className="absolute right-0 top-10 z-30 w-44 bg-[#1e1e24] border border-white/15 rounded-2xl shadow-2xl p-1.5 flex flex-col space-y-1 backdrop-blur-xl"
                        >
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveMenuId(null);
                              void handleEpisodeClick(item.episodeId);
                            }}
                            className="flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-gray-200 hover:bg-white/10 rounded-xl text-left transition-colors cursor-pointer"
                          >
                            <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
                            Xem nội dung
                          </button>
                          
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveMenuId(null);
                              unlikeMutation.mutate(item.episodeId);
                            }}
                            className="flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-red-400 hover:bg-red-500/10 rounded-xl text-left transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-red-400" />
                            Bỏ yêu thích
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Vùng Trigger tải tiếp trang sau */}
            <div ref={observerRef} className="py-8 flex justify-center">
              {isFetchingNextPage ? (
                <div className="flex items-center gap-2 text-xs text-gray-400 font-bold">
                  <Loader2 className="w-4 h-4 animate-spin text-[#D4AF37]" />
                  Đang tải thêm...
                </div>
              ) : hasNextPage ? (
                <div className="h-4" />
              ) : (
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                  Đã tải hết nội dung yêu thích của bạn
                </p>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
