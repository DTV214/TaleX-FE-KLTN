"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail,
  Calendar,
  Info,
  Globe,
  ChevronRight,
  BookOpen,
  Video,
  Eye,
  Sparkles,
  Play,
  ChevronDown,
  ChevronUp,
  User,
  Heart,
  Users,
  Film,
} from "lucide-react";
import { isFullProfile, useAuthStore } from "@/features/auth/store/auth.store";
import {
  getOwnCreator,
  creatorOnboardingKeys,
  shouldRetryOwnCreatorQuery,
  isCreatorNotFoundError,
} from "@/features/creator-dashboard/api/creator-onboarding-api";
import { listSeriesByCreator } from "@/features/creator-dashboard/api/creator-content-api";

type TabType = "home" | "comics" | "movies" | "about";

export default function CreatorChannelPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const profileUser = isFullProfile(user) ? user : null;

  const [activeTab, setActiveTab] = useState<TabType>("home");
  const [filterStatus, setFilterStatus] = useState<"ALL" | "PUBLIC" | "PRIVATE">("ALL");
  const [sortBy, setSortBy] = useState<"latest" | "popular" | "oldest">("latest");
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [isBioExpanded, setIsBioExpanded] = useState(false);

  // Authentication Guard
  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, router]);

  // 1. Fetch Creator Info
  const {
    data: creator,
    isLoading: isCreatorLoading,
    isError: isCreatorError,
    error: creatorError,
  } = useQuery({
    queryKey: creatorOnboardingKeys.ownCreator(),
    queryFn: getOwnCreator,
    retry: shouldRetryOwnCreatorQuery,
    enabled: isAuthenticated,
    staleTime: 30 * 1000,
  });

  // 2. Fetch Creator's Series
  const { data: seriesData, isLoading: isSeriesLoading } = useQuery({
    queryKey: ["creator-series"],
    queryFn: () => listSeriesByCreator(1, 100),
    enabled: isAuthenticated && !!creator,
    staleTime: 30 * 1000,
  });

  const series = seriesData?.content || [];

  const handleItemPress = (seriesId: string) => {
    router.push(`/series/${seriesId}`);
  };

  const getSortedAndFilteredList = (list: typeof series) => {
    let result = [...list];

    // 1. Filter by Status
    if (filterStatus === "PUBLIC") {
      result = result.filter((item) => item.status === "PUBLISHED");
    } else if (filterStatus === "PRIVATE") {
      result = result.filter((item) => item.status === "DRAFT");
    }

    // 2. Sort
    result.sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;

      if (sortBy === "latest") {
        return dateB - dateA;
      } else if (sortBy === "oldest") {
        return dateA - dateB;
      } else if (sortBy === "popular") {
        const viewsB = b.totalViews || 0;
        const viewsA = a.totalViews || 0;
        if (viewsB !== viewsA) {
          return viewsB - viewsA;
        }
        return a.title.localeCompare(b.title);
      }
      return 0;
    });

    return result;
  };

  const comicsList = getSortedAndFilteredList(
    series.filter((item) => item.contentType?.toUpperCase() === "COMIC")
  );
  const moviesList = getSortedAndFilteredList(
    series.filter((item) => item.contentType?.toUpperCase() === "VIDEO")
  );

  const isNotFound = isCreatorError && isCreatorNotFoundError(creatorError);

  // Home Spotlight Series
  const spotlightSeries = series.find((item) => item.status === "PUBLISHED") || series[0];

  if (!isAuthenticated) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="w-full flex-1 px-4 md:px-12 py-8 text-[#F5F5F5] min-h-screen bg-[#09090B] relative overflow-hidden"
    >
      {/* Background decorations */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-[#FACC15]/[0.02] rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[600px] h-[600px] bg-[#FFD54F]/[0.01] rounded-full blur-[150px] pointer-events-none" />

      <div className="flex flex-col gap-8 relative z-10">
        {isCreatorLoading ? (
          <div className="flex h-[500px] flex-col items-center justify-center gap-4 bg-[#111114] rounded-3xl border border-white/[0.06] shadow-2xl">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#FACC15] border-t-transparent" />
            <p className="text-sm font-semibold text-[#A1A1AA]">Đang tải thông tin kênh của bạn...</p>
          </div>
        ) : isNotFound ? (
          <div className="flex h-[450px] flex-col items-center justify-center p-8 text-center bg-[#111114] rounded-3xl border border-white/[0.06] shadow-2xl">
            <Info className="mb-4 h-16 w-16 text-[#FACC15] animate-pulse" />
            <h3 className="text-xl font-bold text-white">Bạn chưa đăng ký Creator</h3>
            <p className="mt-2 max-w-md text-sm text-[#A1A1AA] leading-relaxed">
              Bạn cần phải đăng ký tài khoản sáng tạo (Creator) để sở hữu kênh cá nhân. Hãy đi tới Creator Studio để bắt đầu quy trình đăng ký.
            </p>
            <button
              type="button"
              onClick={() => router.push("/creator-dashboard")}
              className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#FACC15] to-[#FFD54F] hover:from-[#FFD54F] hover:to-[#FFE082] px-6 text-sm font-black text-black transition-all shadow-lg shadow-yellow-500/10 hover:shadow-yellow-500/20 active:scale-95 duration-200 cursor-pointer"
            >
              Đi tới Creator Studio
            </button>
          </div>
        ) : isCreatorError ? (
          <div className="flex h-[400px] flex-col items-center justify-center p-8 text-center bg-[#111114] rounded-3xl border border-white/[0.06] shadow-2xl">
            <Info className="mb-4 h-16 w-16 text-red-500" />
            <h3 className="text-xl font-bold text-white">Đã xảy ra lỗi</h3>
            <p className="mt-2 text-sm text-[#A1A1AA]">
              Không thể tải thông tin Creator của bạn vào lúc này. Vui lòng thử lại sau.
            </p>
          </div>
        ) : (
          <>
            {/* Cover Banner */}
            <div className="relative h-[260px] md:h-[320px] w-full rounded-3xl overflow-hidden bg-zinc-950 border border-white/[0.06] shadow-xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={creator?.bannerUrl || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80"}
                alt="Banner"
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#09090B] via-black/35 to-transparent" />
            </div>

            {/* Premium Profile Section */}
            <div className="flex flex-col md:flex-row items-start gap-8 px-6 sm:px-10 py-2 relative z-10">
              {/* Avatar circle with negative top margin to overlap the banner */}
              <div className="-mt-14 md:-mt-[70px] shrink-0 w-28 h-28 md:w-[120px] md:h-[120px] rounded-full overflow-hidden border-4 border-[#09090B] bg-zinc-900 shadow-2xl relative">
                {(creator?.avatarUrl || profileUser?.avatarUrl) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={creator?.avatarUrl || profileUser?.avatarUrl}
                    alt="Avatar"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center bg-[#17171C] text-[#FACC15] font-black text-4xl">
                    {creator?.displayName?.charAt(0).toUpperCase() || "C"}
                  </div>
                )}
              </div>

              {/* Profile Details */}
              <div className="flex-1 flex flex-col min-w-0">
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-3xl md:text-[32px] font-black text-[#F5F5F5] tracking-tight leading-none">
                    {creator?.displayName || profileUser?.fullName || "Kênh sáng tạo"}
                  </h1>
                  <span className="flex items-center gap-1 px-3 py-1 rounded-full text-[9px] font-black tracking-wider uppercase border bg-yellow-400/10 border-yellow-400/20 text-[#FACC15] shadow-sm shrink-0">
                    <Sparkles className="h-3 w-3 text-[#FACC15]" /> Creator
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-semibold text-[#A1A1AA] mt-2.5">
                  <span>@{profileUser?.username || "creator"}</span>
                  <span className="text-zinc-700">&bull;</span>
                  <span className="text-[#F5F5F5] font-bold">12.4K</span> <span>Người theo dõi</span>
                  <span className="text-zinc-700">&bull;</span>
                  <span className="text-[#F5F5F5] font-bold">286</span> <span>Đang theo dõi</span>
                  <span className="text-zinc-700">&bull;</span>
                  <span className="text-[#F5F5F5] font-bold">{series.length}</span> <span>Tác phẩm</span>
                  <span className="text-zinc-700">&bull;</span>
                  <span className="text-[#F5F5F5] font-bold">1.8M</span> <span>Lượt thích</span>
                </div>

                {/* Collapsible Bio */}
                <div className="mt-3 max-w-2xl">
                  <p className={`text-xs text-[#A1A1AA] leading-relaxed ${isBioExpanded ? "" : "line-clamp-2"}`}>
                    {creator?.bio || "Chưa có tiểu sử giới thiệu. Hãy thêm tiểu sử trong Studio để giới thiệu về kênh của bạn."}
                  </p>
                  {creator?.bio && creator.bio.length > 100 && (
                    <button
                      type="button"
                      onClick={() => setIsBioExpanded(!isBioExpanded)}
                      className="text-xs text-zinc-400 hover:text-white font-bold flex items-center gap-0.5 mt-1.5 outline-none cursor-pointer"
                    >
                      <span>{isBioExpanded ? "Thu gọn" : "Xem thêm"}</span>
                      {isBioExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                    </button>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3 shrink-0 self-start md:self-center mt-4 md:mt-0">
                <button
                  type="button"
                  onClick={() => router.push("/creator-dashboard")}
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-[#FACC15] to-[#FFD54F] hover:from-[#FFD54F] hover:to-[#FFE082] text-stone-950 text-xs font-black rounded-full px-6 py-3 transition-all hover:shadow-[0_0_20px_rgba(250,204,21,0.35)] active:scale-95 duration-200 cursor-pointer shadow-lg"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  Tùy chỉnh kênh (Studio)
                </button>
                <button
                  type="button"
                  onClick={() => router.push("/profile")}
                  className="inline-flex items-center gap-2 bg-white/[0.03] hover:bg-white/[0.08] text-white border border-white/10 hover:border-yellow-400/30 text-xs font-black rounded-full px-6 py-3 transition-all hover:-translate-y-0.5 active:translate-y-0 active:scale-95 duration-200 cursor-pointer shadow-lg"
                >
                  <User className="h-3.5 w-3.5 text-zinc-400" />
                  Chỉnh sửa hồ sơ
                </button>
              </div>
            </div>

            {/* Statistics Cards Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 px-6 sm:px-10 py-2">
              {[
                { label: "Người theo dõi", value: "12.4K", icon: Users },
                { label: "Phim ảnh", value: moviesList.length.toString(), icon: Video },
                { label: "Truyện tranh", value: comicsList.length.toString(), icon: BookOpen },
                { label: "Lượt thích", value: "1.8M", icon: Heart },
              ].map((stat, i) => {
                const Icon = stat.icon;
                return (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1, duration: 0.4 }}
                    whileHover={{ y: -4, scale: 1.02 }}
                    className="bg-[#17171C] border border-white/[0.06] rounded-2xl p-5 flex items-center justify-between shadow-xl transition-all duration-300 hover:border-white/10"
                  >
                    <div>
                      <p className="text-[10px] font-black uppercase text-[#A1A1AA] tracking-wider">{stat.label}</p>
                      <p className="text-2xl font-black text-[#F5F5F5] mt-1">{stat.value}</p>
                    </div>
                    <div className="w-11 h-11 rounded-xl bg-white/[0.02] flex items-center justify-center border border-white/[0.04]">
                      <Icon className="h-5.5 w-5.5 text-[#FACC15]" />
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Navigation Tabs */}
            <div className="border-b border-white/[0.06] bg-transparent flex gap-4 overflow-x-auto scrollbar-none mt-4 px-6 sm:px-10">
              {([
                { id: "home", label: "Trang chủ" },
                { id: "comics", label: "Truyện tranh" },
                { id: "movies", label: "Phim ảnh" },
                { id: "about", label: "Giới thiệu" },
              ] as const).map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-3.5 px-2 text-sm font-black relative transition-colors cursor-pointer outline-none focus:outline-none ${
                      isActive ? "text-[#FACC15]" : "text-[#A1A1AA] hover:text-white"
                    }`}
                  >
                    {tab.label}
                    {isActive && (
                      <motion.span
                        layoutId="activeTabUnderline"
                        className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#FACC15] rounded-full"
                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Filters and Sorting for Specific Tab lists */}
            {(activeTab === "comics" || activeTab === "movies") && (
              <div className="flex flex-wrap items-center justify-between gap-4 py-2 bg-transparent px-6 sm:px-10">
                {/* Status Options */}
                <div className="flex items-center gap-2">
                  {(["ALL", "PUBLIC", "PRIVATE"] as const).map((status) => {
                    const label =
                      status === "ALL" ? "Tất cả" : status === "PUBLIC" ? "Công khai" : "Bản nháp";
                    const isActive = filterStatus === status;
                    return (
                      <button
                        key={status}
                        type="button"
                        onClick={() => setFilterStatus(status)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          isActive
                            ? "bg-white text-black"
                            : "bg-white/[0.04] text-zinc-400 hover:bg-white/[0.08]"
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>

                {/* Sorting Options */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowSortMenu(!showSortMenu)}
                    className="flex items-center gap-1.5 bg-white/[0.04] hover:bg-white/[0.08] border border-white/5 rounded-lg px-3 py-1.5 text-zinc-300 text-xs font-bold transition cursor-pointer"
                  >
                    <span>
                      {sortBy === "latest"
                        ? "Mới nhất"
                        : sortBy === "popular"
                        ? "Phổ biến nhất"
                        : "Cũ nhất"}
                    </span>
                    <ChevronDown className="h-4 w-4 text-zinc-400" />
                  </button>

                  {showSortMenu && (
                    <div className="absolute right-0 top-10 w-36 bg-[#17171C] border border-white/10 rounded-xl py-1.5 z-20 shadow-2xl animate-in fade-in slide-in-from-top-1">
                      {(["latest", "popular", "oldest"] as const).map((option) => {
                        const optionLabel =
                          option === "latest"
                            ? "Mới nhất"
                            : option === "popular"
                            ? "Phổ biến"
                            : "Cũ nhất";
                        const isOptionActive = sortBy === option;
                        return (
                          <button
                            key={option}
                            type="button"
                            onClick={() => {
                              setSortBy(option);
                              setShowSortMenu(false);
                            }}
                            className={`w-full text-left px-4 py-2 text-xs font-semibold hover:bg-white/5 transition-colors cursor-pointer ${
                              isOptionActive ? "text-[#FACC15] font-bold" : "text-zinc-400"
                            }`}
                          >
                            {optionLabel}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Tab Body Renderings */}
            <div className="py-4 px-6 sm:px-10">
              {activeTab === "home" && (
                <div className="space-y-12">
                  {/* Premium Featured Content Hero Card */}
                  {spotlightSeries && (
                    <div className="relative overflow-hidden rounded-3xl border border-[#FACC15]/20 bg-gradient-to-br from-[#17171C] via-[#111114] to-[#2B220F] shadow-[0_20px_50px_rgba(250,204,21,0.08)] flex flex-col lg:flex-row gap-8 p-6 md:p-8">
                      {/* Blurred cover backdrop */}
                      {spotlightSeries.coverUrl && (
                        <div
                          className="absolute inset-0 bg-cover bg-center opacity-[0.05] blur-3xl scale-110 pointer-events-none"
                          style={{ backgroundImage: `url(${spotlightSeries.coverUrl})` }}
                        />
                      )}
                      {/* Ambient background glows */}
                      <div className="absolute top-0 right-0 w-80 h-80 bg-[#FACC15]/[0.04] rounded-full blur-[80px] pointer-events-none" />
                      <div className="absolute bottom-0 left-0 w-80 h-80 bg-red-500/[0.015] rounded-full blur-[80px] pointer-events-none" />

                      {/* Left Poster */}
                      <div
                        onClick={() => handleItemPress(spotlightSeries.seriesId)}
                        className={`cursor-pointer overflow-hidden rounded-2xl bg-zinc-900 border border-white/5 shadow-xl shrink-0 w-full group relative ${
                          spotlightSeries.contentType === "VIDEO" 
                            ? "aspect-video lg:w-[420px]" 
                            : "aspect-[3/4] lg:w-[280px]"
                        }`}
                      >
                        {spotlightSeries.coverUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={spotlightSeries.coverUrl}
                            alt={spotlightSeries.title}
                            className="h-full w-full object-cover group-hover:scale-104 transition-transform duration-700"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-zinc-500 bg-zinc-800">
                            {spotlightSeries.contentType === "COMIC" ? (
                              <BookOpen className="h-12 w-12" />
                            ) : (
                              <Video className="h-12 w-12" />
                            )}
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-300">
                          <div className="h-14 w-14 rounded-full bg-white flex items-center justify-center text-black shadow-2xl transform scale-90 group-hover:scale-100 transition-transform duration-300">
                            <Play className="h-6 w-6 fill-black ml-0.5" />
                          </div>
                        </div>
                      </div>

                      {/* Right Details */}
                      <div className="flex-1 flex flex-col justify-between min-w-0 py-1 relative z-10">
                        <div className="space-y-4">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-[9px] font-black uppercase tracking-widest text-[#FACC15] bg-[#FACC15]/10 px-3 py-1 rounded-full border border-[#FACC15]/20">
                              Tác phẩm tiêu điểm
                            </span>
                            <span className="text-[9px] font-black uppercase tracking-widest text-zinc-300 bg-white/[0.04] px-3 py-1 rounded-full border border-white/[0.06]">
                              {spotlightSeries.contentType === "COMIC" ? "Truyện tranh" : "Phim ảnh"}
                            </span>
                            <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400 flex items-center gap-1">
                              <Eye size={12} className="text-[#FACC15]" /> {spotlightSeries.totalViews || 0} lượt xem
                            </span>
                          </div>

                          <h3
                            onClick={() => handleItemPress(spotlightSeries.seriesId)}
                            className="text-2xl sm:text-3xl font-black text-[#F5F5F5] hover:text-[#FACC15] cursor-pointer leading-tight transition-colors line-clamp-2"
                          >
                            {spotlightSeries.title}
                          </h3>

                          <p className="text-sm text-[#A1A1AA] leading-relaxed line-clamp-4 font-medium max-w-2xl">
                            {spotlightSeries.description || "Chưa có mô tả chi tiết cho tác phẩm tiêu điểm này."}
                          </p>
                        </div>

                        {/* Action buttons */}
                        <div className="flex flex-wrap items-center gap-3 mt-6">
                          <button
                            type="button"
                            onClick={() => handleItemPress(spotlightSeries.seriesId)}
                            className="inline-flex items-center gap-2 bg-gradient-to-r from-[#FACC15] to-[#FFD54F] hover:from-[#FFD54F] hover:to-[#FFE082] text-stone-950 text-xs font-black rounded-full px-6 py-3.5 transition-all hover:shadow-[0_0_20px_rgba(250,204,21,0.3)] active:scale-95 duration-200 cursor-pointer shadow-md"
                          >
                            <Play className="h-4 w-4 fill-black" />
                            {spotlightSeries.contentType === "VIDEO" ? "Xem Ngay" : "Đọc Ngay"}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleItemPress(spotlightSeries.seriesId)}
                            className="inline-flex items-center gap-2 bg-white/[0.03] hover:bg-white/[0.08] text-white border border-white/10 hover:border-yellow-400/30 text-xs font-black rounded-full px-6 py-3.5 transition-all active:scale-95 duration-200 cursor-pointer shadow-md"
                          >
                            Chi tiết
                          </button>
                          <button
                            type="button"
                            className="inline-flex items-center justify-center w-11 h-11 bg-white/[0.03] hover:bg-white/[0.08] text-white border border-white/10 hover:border-red-500/30 rounded-full transition-all active:scale-95 duration-200 cursor-pointer shadow-md"
                          >
                            <Heart className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Comics Shelf */}
                  {comicsList.length > 0 && (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between border-l-[3px] border-[#FACC15] pl-3">
                        <h3 className="text-xl md:text-2xl font-black text-[#F5F5F5] tracking-tight flex items-center gap-2.5">
                          <BookOpen className="h-5.5 w-5.5 text-[#FACC15]" />
                          Truyện tranh mới nhất
                        </h3>
                        <button
                          type="button"
                          onClick={() => setActiveTab("comics")}
                          className="text-xs font-black text-[#A1A1AA] hover:text-[#FACC15] flex items-center gap-0.5 transition-colors duration-200 cursor-pointer"
                        >
                          <span>Xem tất cả</span>
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </div>
                      <SeriesGrid
                        list={comicsList.slice(0, 6)}
                        loading={isSeriesLoading}
                        contentTypeLabel="truyện tranh"
                        onItemPress={handleItemPress}
                      />
                    </div>
                  )}

                  {/* Movies Shelf */}
                  {moviesList.length > 0 && (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between border-l-[3px] border-[#FACC15] pl-3">
                        <h3 className="text-xl md:text-2xl font-black text-[#F5F5F5] tracking-tight flex items-center gap-2.5">
                          <Video className="h-5.5 w-5.5 text-[#FACC15]" />
                          Phim ảnh mới nhất
                        </h3>
                        <button
                          type="button"
                          onClick={() => setActiveTab("movies")}
                          className="text-xs font-black text-[#A1A1AA] hover:text-[#FACC15] flex items-center gap-0.5 transition-colors duration-200 cursor-pointer"
                        >
                          <span>Xem tất cả</span>
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </div>
                      <SeriesGrid
                        list={moviesList.slice(0, 6)}
                        loading={isSeriesLoading}
                        contentTypeLabel="phim ảnh"
                        onItemPress={handleItemPress}
                      />
                    </div>
                  )}
                </div>
              )}

              {activeTab === "comics" && (
                <SeriesGrid
                  list={comicsList}
                  loading={isSeriesLoading}
                  contentTypeLabel="truyện tranh"
                  onItemPress={handleItemPress}
                />
              )}

              {activeTab === "movies" && (
                <SeriesGrid
                  list={moviesList}
                  loading={isSeriesLoading}
                  contentTypeLabel="phim ảnh"
                  onItemPress={handleItemPress}
                />
              )}

              {activeTab === "about" && (
                <div className="max-w-3xl space-y-8 bg-[#111114] border border-white/[0.06] p-6 rounded-2xl shadow-xl">
                  <div>
                    <h4 className="text-sm font-black text-[#FACC15] tracking-wider mb-2 uppercase">Tiểu sử kênh</h4>
                    <p className="text-sm font-semibold text-zinc-300 leading-relaxed">
                      {creator?.bio || "Kênh chưa cập nhật tiểu sử."}
                    </p>
                  </div>

                  <div className="border-t border-white/[0.06] pt-6">
                    <h4 className="text-sm font-black text-[#FACC15] tracking-wider mb-4 uppercase">
                      Thông tin thống kê
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                      <div className="flex items-center gap-3.5 p-4 rounded-xl bg-[#17171C] border border-white/[0.06]">
                        <Mail className="h-5 w-5 text-zinc-550" />
                        <div>
                          <p className="text-[9px] font-black uppercase text-zinc-550 tracking-wider">
                            Email liên hệ
                          </p>
                          <p className="text-xs font-bold text-zinc-200 mt-0.5">
                            {profileUser?.email || "Không có email công khai"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3.5 p-4 rounded-xl bg-[#17171C] border border-white/[0.06]">
                        <Calendar className="h-5 w-5 text-zinc-550" />
                        <div>
                          <p className="text-[9px] font-black uppercase text-zinc-550 tracking-wider">
                            Ngày hoạt động
                          </p>
                          <p className="text-xs font-bold text-zinc-200 mt-0.5">
                            {creator?.createdAt
                              ? new Date(creator.createdAt).toLocaleDateString("vi-VN")
                              : "không xác định"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3.5 p-4 rounded-xl bg-[#17171C] border border-white/[0.06]">
                        <Globe className="h-5 w-5 text-zinc-550" />
                        <div>
                          <p className="text-[9px] font-black uppercase text-zinc-550 tracking-wider">
                            Trạng thái Creator
                          </p>
                          <p className="text-xs font-bold mt-0.5">
                            <span
                              className={
                                creator?.status === "ACTIVE" ? "text-emerald-400" : "text-amber-400"
                              }
                            >
                              {creator?.status === "ACTIVE" ? "Hoạt động" : "Đang kiểm duyệt"}
                            </span>
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
}

interface SeriesGridProps {
  list: any[];
  loading: boolean;
  contentTypeLabel: string;
  onItemPress: (id: string) => void;
}

function SeriesGrid({ list, loading, contentTypeLabel, onItemPress }: SeriesGridProps) {
  if (loading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#FACC15] border-t-transparent" />
      </div>
    );
  }

  if (list.length === 0) {
    return (
      <div className="flex h-36 flex-col items-center justify-center p-8 text-center border border-dashed border-white/[0.06] rounded-2xl bg-[#111114] w-full">
        <BookOpen className="h-8 w-8 text-zinc-650 mb-2" />
        <p className="text-xs font-semibold text-zinc-500">
          Chưa có tác phẩm {contentTypeLabel} nào được tải lên hoặc khớp bộ lọc.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-5 gap-y-8">
      {list.map((item, idx) => {
        const isVideo = item.contentType?.toUpperCase() === "VIDEO";

        return (
          <motion.button
            key={item.seriesId}
            type="button"
            onClick={() => onItemPress(item.seriesId)}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05, duration: 0.4 }}
            whileHover={{ y: -6, scale: 1.04, filter: "brightness(1.05)" }}
            className="group flex flex-col text-left bg-transparent rounded-2xl overflow-hidden transition-all duration-300 outline-none focus:outline-none"
          >
            {/* Cover Image container */}
            <div
              className={`relative w-full bg-[#17171C] rounded-2xl overflow-hidden border border-white/[0.04] shadow-md group-hover:shadow-2xl transition-all duration-300 ${
                isVideo ? "aspect-video" : "aspect-[3/4]"
              }`}
            >
              {item.coverUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.coverUrl}
                  alt={item.title}
                  className="h-full w-full object-cover transition-transform duration-700"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-zinc-600 bg-zinc-800">
                  {isVideo ? (
                    <Video className="h-8 w-8" />
                  ) : (
                    <BookOpen className="h-8 w-8" />
                  )}
                </div>
              )}

              {/* Hover play overlay for video */}
              {isVideo && (
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-300">
                  <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center text-black shadow-xl transform scale-90 group-hover:scale-100 transition-transform duration-300">
                    <Play className="h-4.5 w-4.5 fill-black ml-0.5" />
                  </div>
                </div>
              )}

              <div className="absolute top-2 right-2 z-10 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded text-[8px] font-black uppercase text-zinc-300 tracking-wider border border-white/[0.06]">
                {isVideo ? "Video" : "Manga"}
              </div>
            </div>

            {/* Title & Metadata directly below card (YouTube style) */}
            <div className="pt-3 px-1 flex-1 flex flex-col justify-between">
              <div>
                <h4 className="text-sm font-bold leading-snug text-[#F5F5F5] group-hover:text-[#FACC15] line-clamp-2 transition-colors">
                  {item.title}
                </h4>
                <div className="flex items-center gap-1.5 mt-1 text-[10px] font-bold text-[#A1A1AA]">
                  <span className="flex items-center gap-0.5">
                    <Eye className="h-3 w-3 text-[#FACC15]" />
                    {item.totalViews || 0} lượt xem
                  </span>
                </div>
              </div>
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}
