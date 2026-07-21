"use client";

import { useEffect, useRef, useState } from "react";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getMyBookmarkedEpisodes, unbookmarkEpisode } from "@/features/series/api/episode-bookmarks-api";
import { getPublicEpisodeDetail } from "@/features/series/api/series-api";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Bookmark, Loader2, Play, BookOpen, Calendar, MoreVertical, Trash2, ExternalLink } from "lucide-react";
import { cn } from "@/shared/utils/utils";
import Link from "next/link";

type TabType = "ALL" | "VIDEO" | "COMIC";

export default function BookmarksPage() {
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

  // 1. Fetch danh sách tập đã bookmark
  const {
    data,
    isLoading,
    isError,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["myBookmarkedEpisodesInfinite"],
    queryFn: ({ pageParam = 0 }) => getMyBookmarkedEpisodes(pageParam, 15),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => {
      return lastPage.last ? undefined : lastPage.number + 1;
    },
    enabled: !!authUser,
  });

  const bookmarkedEpisodes = data?.pages.flatMap((page) => page.content) || [];

  // 2. Tự động truy vấn chi tiết của các tập hiển thị để lấy contentType (Video hoặc Comic) phục vụ việc lọc Tab
  useEffect(() => {
    bookmarkedEpisodes.forEach(async (item) => {
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
  }, [bookmarkedEpisodes, contentTypes]);

  // Lọc tập phim dựa theo tab đang chọn
  const filteredEpisodes = bookmarkedEpisodes.filter((item) => {
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

  // 4. Mutation Hủy Bookmark tập phim trực tiếp từ trang danh sách
  const unbookmarkMutation = useMutation({
    mutationFn: (episodeId: string) => unbookmarkEpisode(episodeId),
    onMutate: async (episodeId) => {
      await queryClient.cancelQueries({ queryKey: ["myBookmarkedEpisodesInfinite"] });
      const previousData = queryClient.getQueryData(["myBookmarkedEpisodesInfinite"]);

      // Cập nhật Optimistic xóa tập khỏi danh sách
      queryClient.setQueryData(["myBookmarkedEpisodesInfinite"], (old: any) => {
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
        queryClient.setQueryData(["myBookmarkedEpisodesInfinite"], context.previousData);
      }
      toast.error("Không thể hủy bookmark. Vui lòng thử lại!");
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["myBookmarkedEpisodesInfinite"] });
      queryClient.invalidateQueries({ queryKey: ["myBookmarkedEpisodes"] });
      const type = contentTypes[variables];
      const label = type === "COMIC" ? "truyện" : "phim";
      toast.success(`Đã xóa tập ${label} khỏi danh sách bookmark.`);
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
      <div className="relative min-h-screen bg-[#080808] text-white flex flex-col items-center justify-center px-6">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(212,175,55,0.1),transparent_50%)]" />
        <div className="relative z-10 text-center max-w-sm">
          <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-6 text-slate-400">
            <Bookmark className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold mb-3">Danh sách Bookmark</h1>
          <p className="text-sm text-gray-400 mb-8">
            Vui lòng đăng nhập tài khoản TaleX để quản lý và xem lại danh sách các tập phim, truyện bạn đã lưu bookmark.
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
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_10%,rgba(212,175,55,0.08),transparent_35%),radial-gradient(circle_at_85%_15%,rgba(125,211,252,0.04),transparent_30%),linear-gradient(180deg,#080808_0%,#0e0e11_60%,#080808_100%)]" />

      <div className="relative z-10 mx-auto w-full max-w-[1600px] px-4 py-8 md:px-8">
        
        {/* Banner tiêu đề */}
        <div className="mb-6 pb-6 border-b border-white/5 flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-extrabold tracking-wide text-white flex items-center gap-2">
              <Bookmark className="w-6 h-6 fill-[#D4AF37] text-[#D4AF37] stroke-[1.5]" />
              Video & Truyện đã lưu (Bookmarks)
            </h1>
            <p className="text-xs text-gray-500 font-semibold">
              Tổng số lượng: {bookmarkedEpisodes.length} tập phim/truyện
            </p>
          </div>
        </div>

        {/* Cụm Tabs dạng Pill (Tất cả, Video, Truyện tranh) */}
        <div className="flex items-center gap-2 mb-6">
          <button
            onClick={() => setActiveTab("ALL")}
            className={cn(
              "px-4 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer",
              activeTab === "ALL"
                ? "bg-white text-black font-black"
                : "bg-white/5 text-gray-300 hover:bg-white/10"
            )}
          >
            Tất cả
          </button>
          <button
            onClick={() => setActiveTab("VIDEO")}
            className={cn(
              "px-4 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer",
              activeTab === "VIDEO"
                ? "bg-white text-black font-black"
                : "bg-white/5 text-gray-300 hover:bg-white/10"
            )}
          >
            Video
          </button>
          <button
            onClick={() => setActiveTab("COMIC")}
            className={cn(
              "px-4 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer",
              activeTab === "COMIC"
                ? "bg-white text-black font-black"
                : "bg-white/5 text-gray-300 hover:bg-white/10"
            )}
          >
            Truyện tranh
          </button>
        </div>

        {/* LOADING BAN ĐẦU */}
        {isLoading && (
          <div className="min-h-[300px] flex flex-col items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-[#D4AF37] mb-3" />
            <p className="text-xs text-gray-500 animate-pulse font-bold">
              Đang tải danh sách...
            </p>
          </div>
        )}

        {/* LỖI TẢI TRANG */}
        {isError && (
          <div className="min-h-[300px] flex flex-col items-center justify-center text-center">
            <h2 className="text-sm font-bold text-red-400 mb-1">Tải dữ liệu thất bại</h2>
            <p className="text-xs text-gray-500 mb-4">Vui lòng tải lại trang web.</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs font-bold"
            >
              Tải lại
            </button>
          </div>
        )}

        {/* DANH SÁCH RỖNG */}
        {!isLoading && !isError && filteredEpisodes.length === 0 && (
          <div className="min-h-[300px] rounded-2xl border border-dashed border-white/5 bg-white/[0.01] flex flex-col items-center justify-center text-center p-8">
            <Bookmark className="w-8 h-8 text-gray-600 mb-3 stroke-[1.5]" />
            <h2 className="text-sm font-bold text-gray-400">Không tìm thấy nội dung nào</h2>
            <p className="text-xs text-gray-600 mt-1 max-w-xs">
              Bạn chưa bookmark tập {activeTab === "VIDEO" ? "video" : activeTab === "COMIC" ? "truyện tranh" : "phim/truyện"} nào.
            </p>
          </div>
        )}

        {/* DANH SÁCH ROW LAYOUT */}
        {!isLoading && !isError && filteredEpisodes.length > 0 && (
          <div className="space-y-4">
            <div className="flex flex-col gap-1">
              {filteredEpisodes.map((item, idx) => {
                const isRedirecting = redirectingId === item.episodeId;
                const isMenuOpen = activeMenuId === item.episodeId;
                const itemType = contentTypes[item.episodeId];

                return (
                  <div
                    key={`${item.episodeId}-${idx}`}
                    className="group relative flex gap-4 p-3.5 rounded-xl hover:bg-white/[0.02] border border-transparent hover:border-white/5 transition-all duration-300 items-start select-none"
                  >
                    {/* 1. Thumbnail phía bên trái */}
                    <div
                      onClick={() => handleEpisodeClick(item.episodeId)}
                      className="relative aspect-video w-36 sm:w-44 flex-none rounded-lg overflow-hidden bg-white/[0.02] border border-white/5 group-hover:border-[#D4AF37]/30 cursor-pointer shadow-md"
                    >
                      {/* Play/Read Overlay */}
                      <div className="absolute inset-0 bg-black/40 group-hover:bg-black/55 transition-colors z-10 flex items-center justify-center">
                        <div className="w-8 h-8 rounded-full bg-[#D4AF37]/80 group-hover:bg-[#D4AF37] group-hover:scale-110 flex items-center justify-center text-black shadow-md transition duration-300">
                          {isRedirecting ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : itemType === "COMIC" ? (
                            <BookOpen className="w-4 h-4" />
                          ) : (
                            <Play className="w-4 h-4 fill-current ml-0.5" />
                          )}
                        </div>
                      </div>

                      {/* Image */}
                      <div
                        className="w-full h-full bg-cover bg-center transition-transform duration-500 group-hover:scale-103"
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
                      className="flex-1 min-w-0 py-0.5 space-y-1.5 cursor-pointer"
                    >
                      <h3 className="text-gray-100 font-bold text-sm sm:text-base leading-snug line-clamp-2 group-hover:text-[#D4AF37] transition-colors duration-200">
                        {item.episodeTitle}
                      </h3>
                      
                      <div className="space-y-0.5 text-xs text-gray-500 font-semibold">
                        <p className="text-[#D4AF37]/80 font-bold truncate">
                          {item.seriesTitle} {item.episodeNumber != null && `• Tập ${item.episodeNumber}`}
                        </p>
                        
                        <p className="flex items-center gap-1 mt-1 text-[10px]">
                          <Calendar className="w-3.5 h-3.5 text-gray-600" />
                          Đã bookmark: {new Date(item.bookmarkedAt).toLocaleString("vi-VN", {
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
                        className="p-1.5 hover:bg-white/5 rounded-full text-slate-400 hover:text-white transition-colors cursor-pointer"
                        title="Tùy chọn"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>

                      {/* Dropdown Menu hành động */}
                      {isMenuOpen && (
                        <div
                          ref={menuRef}
                          className="absolute right-0 top-8 z-30 w-44 bg-[#1b1b1f] border border-white/5 rounded-xl shadow-2xl p-1.5 flex flex-col space-y-0.5"
                        >
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveMenuId(null);
                              void handleEpisodeClick(item.episodeId);
                            }}
                            className="flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-slate-200 hover:bg-white/5 rounded-lg text-left transition-colors cursor-pointer"
                          >
                            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                            Xem nội dung
                          </button>
                          
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveMenuId(null);
                              unbookmarkMutation.mutate(item.episodeId);
                            }}
                            className="flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-red-400 hover:bg-red-500/10 rounded-lg text-left transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-red-500" />
                            Xóa bookmark
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
                <div className="flex items-center gap-2 text-xs text-gray-500 font-bold">
                  <Loader2 className="w-4 h-4 animate-spin text-[#D4AF37]" />
                  Đang tải thêm...
                </div>
              ) : hasNextPage ? (
                <div className="h-4" />
              ) : (
                <p className="text-[10px] text-gray-600 font-bold uppercase tracking-wider">
                  Đã tải hết danh sách bookmark của bạn
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
