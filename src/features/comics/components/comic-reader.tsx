"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  BookOpen,
  AlignJustify,
  Columns2,
  X,
  Loader2,
  AlertTriangle,
  List,
  ZoomIn,
  ZoomOut,
  RotateCcw,
} from "lucide-react";
import { getPublicEpisodeMedia, getPublicEpisodes, getPublicSeasons, getPublicEpisodeDetail } from "@/features/series/api/series-api";
import { ContentPaywallGate } from "@/features/checkout-content/components/content-paywall-gate";
import { isNotEntitledError } from "@/features/checkout-content/utils/is-not-entitled-error";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { cn } from "@/shared/utils/utils";
import { LikeButton } from "@/features/series/components/like-button";
import { LikedUsersModal } from "@/features/series/components/liked-users-modal";
import { useEpisodeLikes } from "@/features/series/hooks/use-episode-likes";

interface ComicReaderProps {
  episodeId: string;
}

type ReadingMode = "vertical" | "horizontal";

export function ComicReader({ episodeId }: ComicReaderProps) {
  const router = useRouter();
  const [readingMode, setReadingMode] = useState<ReadingMode>("vertical");
  const [currentPage, setCurrentPage] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [showChapterMenu, setShowChapterMenu] = useState(false);
  const [zoom, setZoom] = useState(100);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Falls back to the logged-in viewer's own accountId so the BE entitlement
  // check (purchase/subscription/ownership) has someone to check against —
  // without this every viewer looks anonymous and paid content 403s for everyone.
  const authUser = useAuthStore((state) => state.user);
  const viewerId = authUser?.accountId;

  // Fetch thông tin chi tiết tập truyện
  const { data: episodeDetail } = useQuery({
    queryKey: ["publicEpisodeDetail", episodeId],
    queryFn: () => getPublicEpisodeDetail(episodeId),
    enabled: !!episodeId,
  });

  // Tải trạng thái và lượt thích tập truyện
  const {
    totalLikes,
    isLiked,
    toggleLike,
    isMutating,
    likedUsers,
  } = useEpisodeLikes(episodeId);

  // Fetch danh sách trang truyện (media pages) từ API
  const {
    data: mediaPages,
    isLoading: isPagesLoading,
    isError: isPagesError,
    error: pagesError,
  } = useQuery({
    queryKey: ["publicEpisodeMedia", episodeId, viewerId ?? "anonymous"],
    queryFn: () => getPublicEpisodeMedia(episodeId, viewerId),
    // Entitlement can change externally (just purchased) — never serve a stale 403 from cache.
    staleTime: 0,
    refetchOnMount: "always",
    retry: false,
  });

  // Sắp xếp các trang theo displayOrder
  const sortedPages = [...(mediaPages ?? [])].sort(
    (a, b) => a.displayOrder - b.displayOrder,
  );

  const totalPages = sortedPages.length;

  // Auto-hide controls sau 3 giây
  const resetHideTimer = useCallback(() => {
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    setShowControls(true);
    hideTimerRef.current = setTimeout(() => {
      setShowControls(false);
    }, 3000);
  }, []);

  useEffect(() => {
    resetHideTimer();
    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, [resetHideTimer]);

  const handlePageInteraction = () => {
    resetHideTimer();
  };

  // Chuyển trang ngang
  const goToPage = useCallback(
    (index: number) => {
      const clamped = Math.max(0, Math.min(index, totalPages - 1));
      setCurrentPage(clamped);
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [totalPages],
  );

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        goToPage(currentPage + 1);
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        goToPage(currentPage - 1);
      } else if (e.key === "Escape") {
        setShowChapterMenu(false);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [currentPage, goToPage]);

  // Zoom controls
  const handleZoomIn = () => setZoom((z) => Math.min(z + 20, 200));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 20, 60));
  const handleZoomReset = () => setZoom(100);

  // ─── Loading State ───
  if (isPagesLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#0B0B0C] text-white">
        <Loader2 className="h-10 w-10 animate-spin text-[#D4AF37] mb-4" />
        <p className="text-sm text-gray-400 animate-pulse">Đang tải các trang truyện...</p>
      </div>
    );
  }

  // ─── Not Entitled (Paywall) State ───
  if (isNotEntitledError(pagesError instanceof Error ? pagesError.message : null)) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#0B0B0C] px-6">
        <ContentPaywallGate episodeId={episodeId} contentKind="COMIC" />
      </div>
    );
  }

  // ─── Error State ───
  if (isPagesError || !mediaPages) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#0B0B0C] text-white px-6 text-center">
        <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-6">
          <AlertTriangle className="w-8 h-8 text-red-400" />
        </div>
        <h3 className="text-xl font-bold mb-2">Không thể tải trang truyện</h3>
        <p className="text-gray-400 text-sm mb-6">
          Tập truyện này chưa có nội dung hoặc đã gặp lỗi khi tải.
        </p>
        <button
          onClick={() => router.back()}
          className="px-6 py-2.5 bg-white text-black font-semibold rounded-xl hover:bg-gray-200 transition-colors"
        >
          Quay lại
        </button>
      </div>
    );
  }

  // ─── Empty Pages State ───
  if (sortedPages.length === 0) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#0B0B0C] text-white px-6 text-center">
        <div className="w-16 h-16 rounded-full bg-[#D4AF37]/10 flex items-center justify-center mb-6">
          <BookOpen className="w-8 h-8 text-[#D4AF37]" />
        </div>
        <h3 className="text-xl font-bold mb-2">Chưa có trang truyện</h3>
        <p className="text-gray-400 text-sm mb-6">
          Tập truyện này chưa có trang nào được tải lên.
        </p>
        <button
          onClick={() => router.back()}
          className="px-6 py-2.5 bg-[#D4AF37] text-black font-bold rounded-xl hover:bg-[#E5C158] transition-colors"
        >
          Quay lại
        </button>
      </div>
    );
  }

  return (
    <div
      className="relative min-h-screen bg-[#0B0B0C] select-none"
      onMouseMove={handlePageInteraction}
      onTouchStart={handlePageInteraction}
      ref={containerRef}
    >
      {/* ─── TOP BAR ─── */}
      <div
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
          showControls ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-full pointer-events-none",
        )}
      >
        <div className="bg-gradient-to-b from-black/90 to-transparent backdrop-blur-sm border-b border-white/5 px-4 py-3 flex items-center justify-between gap-3">
          {/* Nút quay lại */}
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-sm font-bold text-gray-300 hover:text-white transition-colors group"
          >
            <ChevronLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
            <span className="hidden sm:inline">Quay lại</span>
          </button>

          {/* Tiêu đề & chỉ số trang */}
          <div className="flex-1 text-center">
            <p className="text-white font-bold text-sm line-clamp-1">
              {episodeDetail
                ? `Tập ${episodeDetail.episodeNumber}: ${episodeDetail.title}`
                : `Tập ${episodeId}`}
            </p>
            <p className="text-[#D4AF37] text-xs font-semibold mt-0.5">
              Trang {currentPage + 1} / {totalPages}
            </p>
          </div>

          {/* Controls phải */}
          <div className="flex items-center gap-2">
            {/* Zoom controls (chỉ hiển thị ở vertical mode) */}
            {readingMode === "vertical" && (
              <div className="hidden sm:flex items-center gap-1 bg-white/5 rounded-lg px-2 py-1 border border-white/10">
                <button
                  onClick={handleZoomOut}
                  className="p-1 text-gray-400 hover:text-white transition-colors"
                  title="Thu nhỏ"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="text-xs text-gray-300 w-9 text-center font-bold">{zoom}%</span>
                <button
                  onClick={handleZoomIn}
                  className="p-1 text-gray-400 hover:text-white transition-colors"
                  title="Phóng to"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={handleZoomReset}
                  className="p-1 text-gray-400 hover:text-white transition-colors"
                  title="Đặt lại"
                >
                  <RotateCcw className="w-3 h-3" />
                </button>
              </div>
            )}

            {/* Chế độ đọc toggle */}
            <button
              onClick={() => {
                setReadingMode((m) => (m === "vertical" ? "horizontal" : "vertical"));
                setCurrentPage(0);
              }}
              className="flex items-center gap-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg px-3 py-1.5 text-xs font-bold text-gray-300 hover:text-white transition-all"
              title="Chuyển chế độ đọc"
            >
              {readingMode === "vertical" ? (
                <><Columns2 className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Từng trang</span></>
              ) : (
                <><AlignJustify className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Cuộn dọc</span></>
              )}
            </button>

            {/* Menu chapter */}
            <button
              onClick={() => setShowChapterMenu((v) => !v)}
              className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-gray-300 hover:text-white transition-all"
              title="Danh sách trang"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ─── CHAPTER MENU PANEL ─── */}
      {showChapterMenu && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowChapterMenu(false)}
          />
          <div className="fixed right-0 top-0 bottom-0 z-50 w-72 bg-[#141416] border-l border-white/5 flex flex-col shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
              <h3 className="text-white font-bold text-sm">Danh Sách Trang</h3>
              <button
                onClick={() => setShowChapterMenu(false)}
                className="text-gray-500 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-3 space-y-1 px-3">
              {sortedPages.map((page, idx) => (
                <button
                  key={page.mediaId}
                  onClick={() => {
                    if (readingMode === "horizontal") {
                      goToPage(idx);
                    } else {
                      // Cuộn dọc: scroll đến phần tử tương ứng
                      const el = document.getElementById(`page-${idx}`);
                      el?.scrollIntoView({ behavior: "smooth", block: "start" });
                    }
                    setShowChapterMenu(false);
                  }}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all text-sm",
                    idx === currentPage && readingMode === "horizontal"
                      ? "bg-[#D4AF37]/15 border border-[#D4AF37]/30 text-[#D4AF37]"
                      : "text-gray-400 hover:bg-white/5 hover:text-white",
                  )}
                >
                  <span className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center text-xs font-bold shrink-0">
                    {idx + 1}
                  </span>
                  <span className="font-medium">Trang {idx + 1}</span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ─── READING AREA ─── */}
      <div className="pt-[60px]">
        {readingMode === "vertical" ? (
          /* ═══ VERTICAL / WEBTOON MODE ═══ */
          <div className="flex flex-col items-center pb-24 gap-0">
            {sortedPages.map((page, idx) => (
              <div
                key={page.mediaId}
                id={`page-${idx}`}
                className="w-full flex justify-center bg-[#0B0B0C]"
                style={{ maxWidth: `${zoom}%` }}
              >
                <img
                  src={page.fileUrl}
                  alt={`Trang ${idx + 1}`}
                  className="w-full h-auto object-contain block"
                  loading={idx < 3 ? "eager" : "lazy"}
                  onLoad={() => {
                    if (idx === 0) setCurrentPage(0);
                  }}
                />
              </div>
            ))}

            {/* End of chapter message */}
            <div className="w-full max-w-lg mx-auto px-6 py-12 text-center bg-[#121214]/60 border border-white/5 rounded-3xl p-8 backdrop-blur-md shadow-2xl relative mt-10">
              <div className="w-12 h-12 rounded-full bg-[#D4AF37]/10 flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-6 h-6 text-[#D4AF37]" />
              </div>
              <p className="text-gray-300 text-sm font-bold mb-6">Bạn đã đọc xong tập này!</p>

              {/* Nút Thích & Thống kê */}
              <div className="flex flex-col items-center gap-3 w-full mb-8 pb-6 border-b border-white/5">
                <LikeButton
                  isLiked={isLiked}
                  likeCount={totalLikes}
                  onLikeToggle={toggleLike}
                  isLoading={isMutating}
                />

                {likedUsers.length > 0 && (
                  <LikedUsersModal
                    episodeId={episodeId}
                    trigger={
                      <button className="text-xs text-gray-500 hover:text-white cursor-pointer transition-colors mt-2 flex items-center gap-1 font-semibold">
                        Xem danh sách người thích
                      </button>
                    }
                  />
                )}
              </div>

              <button
                onClick={() => router.back()}
                className="w-full max-w-xs py-3 bg-[#D4AF37] hover:bg-[#E5C158] text-black font-extrabold rounded-xl transition-all active:scale-[0.98] text-sm"
              >
                Quay lại trang Series
              </button>
            </div>
          </div>
        ) : (
          /* ═══ HORIZONTAL / MANGA MODE ═══ */
          <div className="relative min-h-screen flex items-center justify-center bg-black">
            {/* Page Image */}
            <div
              className="relative w-full h-screen flex items-center justify-center overflow-hidden cursor-pointer"
              onClick={handlePageInteraction}
            >
              {sortedPages[currentPage] && (
                <img
                  key={sortedPages[currentPage].mediaId}
                  src={sortedPages[currentPage].fileUrl}
                  alt={`Trang ${currentPage + 1}`}
                  className="max-h-screen max-w-full object-contain"
                  style={{ userSelect: "none" }}
                />
              )}
            </div>

            {/* Left/Right Click Areas */}
            <button
              className="absolute left-0 top-0 bottom-0 w-1/3 opacity-0 z-10"
              onClick={() => goToPage(currentPage - 1)}
              aria-label="Trang trước"
            />
            <button
              className="absolute right-0 top-0 bottom-0 w-1/3 opacity-0 z-10"
              onClick={() => goToPage(currentPage + 1)}
              aria-label="Trang kế tiếp"
            />

            {/* Left Arrow */}
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 0}
              className={cn(
                "absolute left-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-black/60 border border-white/10 flex items-center justify-center text-white transition-all hover:bg-[#D4AF37]/20 hover:border-[#D4AF37]/40",
                currentPage === 0 && "opacity-30 cursor-not-allowed",
                showControls ? "opacity-100" : "opacity-0 pointer-events-none",
              )}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            {/* Right Arrow */}
            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages - 1}
              className={cn(
                "absolute right-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-black/60 border border-white/10 flex items-center justify-center text-white transition-all hover:bg-[#D4AF37]/20 hover:border-[#D4AF37]/40",
                currentPage === totalPages - 1 && "opacity-30 cursor-not-allowed",
                showControls ? "opacity-100" : "opacity-0 pointer-events-none",
              )}
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>

      {/* ─── BOTTOM BAR (chỉ hiển thị ở horizontal mode) ─── */}
      {readingMode === "horizontal" && (
        <div
          className={cn(
            "fixed bottom-0 left-0 right-0 z-50 transition-all duration-300",
            showControls ? "opacity-100 translate-y-0" : "opacity-0 translate-y-full pointer-events-none",
          )}
        >
          <div className="bg-gradient-to-t from-black/95 to-transparent backdrop-blur-sm border-t border-white/5 px-6 py-5">
            {/* Progress bar */}
            <div className="flex items-center gap-4 mb-4">
              <span className="text-xs font-bold text-gray-500 w-8 text-right">1</span>
              <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#D4AF37] to-[#E5C158] rounded-full transition-all duration-300"
                  style={{ width: `${((currentPage + 1) / totalPages) * 100}%` }}
                />
              </div>
              <span className="text-xs font-bold text-gray-500 w-8">{totalPages}</span>
            </div>

            {/* Page dots (hiển thị tối đa 15 trang) */}
            {totalPages <= 15 && (
              <div className="flex items-center justify-center gap-1.5 mb-4">
                {sortedPages.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => goToPage(idx)}
                    className={cn(
                      "rounded-full transition-all duration-200",
                      idx === currentPage
                        ? "w-4 h-2 bg-[#D4AF37]"
                        : "w-1.5 h-1.5 bg-white/25 hover:bg-white/50",
                    )}
                  />
                ))}
              </div>
            )}

            {/* Navigation buttons */}
            <div className="flex items-center justify-between">
              <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 0}
                className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
                Trang trước
              </button>

              <span className="text-[#D4AF37] font-extrabold text-sm">
                {currentPage + 1} / {totalPages}
              </span>

              <button
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages - 1}
                className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Trang sau
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
