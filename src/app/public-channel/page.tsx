"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Calendar,
  Info,
  BookOpen,
  Video,
  Eye,
  Sparkles,
  Play,
  ChevronDown,
  ChevronUp,
  Film,
  Flame,
  ChevronRight,
} from "lucide-react";
import { isFullProfile, useAuthStore } from "@/features/auth/store/auth.store";
import {
  getOwnCreator,
  creatorOnboardingKeys,
} from "@/features/creator-dashboard/api/creator-onboarding-api";
import { ComboCard } from "@/features/public/components/combo-packages";
import { useGetPublicCombos } from "@/features/public/hooks/use-public-combos";
import { getCreatorDetail } from "@/features/series/api/creator-follows-api";
import { getPublicSeriesList } from "@/features/series/api/series-api";
import { FollowButton } from "@/features/series/components/follow-button";
import { useCreatorFollow } from "@/features/series/hooks/use-creator-follow";

type TabType = "home" | "comics" | "movies" | "about" | "combo";

function toUsernameSlug(name?: string | null): string {
  if (!name) return "creator";
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .replace(/[^a-zA-Z0-9]/g, "")
    .toLowerCase();
}

function PublicChannelContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const paramCreatorId =
    searchParams.get("creatorId") ||
    searchParams.get("id") ||
    searchParams.get("accountId");

  const { user, isAuthenticated } = useAuthStore();
  const profileUser = isFullProfile(user) ? user : null;

  const [activeTab, setActiveTab] = useState<TabType>("home");
  const [sortBy, setSortBy] = useState<"latest" | "popular" | "oldest">("latest");
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [isBioExpanded, setIsBioExpanded] = useState(false);
  const [localFollowState, setLocalFollowState] = useState<boolean | null>(null);

  // Authentication Guard
  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, router]);

  // Fetch Own Creator Info to detect if logged-in user is viewing their own channel
  const { data: ownCreator } = useQuery({
    queryKey: creatorOnboardingKeys.ownCreator(),
    queryFn: getOwnCreator,
    enabled: isAuthenticated,
    staleTime: 30 * 1000,
  });

  // 1. Fetch Public Series List
  const { data: publicSeriesData, isLoading: isPublicSeriesLoading } = useQuery({
    queryKey: ["public-series-all"],
    queryFn: () => getPublicSeriesList(1, 100),
    enabled: isAuthenticated && !!paramCreatorId,
    staleTime: 30 * 1000,
  });

  const effectiveCreatorId =
    paramCreatorId ||
    publicSeriesData?.content?.find(
      (s) => s.creatorId || s.accountId || s.seriesId === paramCreatorId
    )?.creatorId ||
    paramCreatorId;

  // 2. Fetch Public Creator Detail
  const {
    data: publicCreator,
    isLoading: isPublicCreatorLoading,
    isError: isPublicCreatorError,
  } = useQuery({
    queryKey: ["creatorDetail", effectiveCreatorId],
    queryFn: () => getCreatorDetail(effectiveCreatorId!),
    enabled: isAuthenticated && !!effectiveCreatorId,
    staleTime: 30 * 1000,
  });

  // Filter public series belonging to this creator
  const series = useMemo(() => {
    const allPublic = publicSeriesData?.content || [];
    if (!paramCreatorId) return allPublic.filter((s) => s.status === "PUBLISHED");
    const target = paramCreatorId.toLowerCase();

    return allPublic.filter((item) => {
      if (item.status !== "PUBLISHED") return false;

      const matchCreatorId =
        item.creatorId && item.creatorId.toLowerCase() === target;
      const matchAccountId =
        item.accountId && item.accountId.toLowerCase() === target;
      const matchCreatorName =
        item.creatorName && item.creatorName.toLowerCase() === target;
      const matchSeriesId =
        item.seriesId && item.seriesId.toLowerCase() === target;
      const matchPublicDisplayName =
        publicCreator?.displayName &&
        item.creatorName?.toLowerCase() === publicCreator.displayName.toLowerCase();
      const matchPublicUsername =
        publicCreator?.username &&
        item.creatorName?.toLowerCase() === publicCreator.username.toLowerCase();

      return (
        matchCreatorId ||
        matchAccountId ||
        matchCreatorName ||
        matchSeriesId ||
        matchPublicDisplayName ||
        matchPublicUsername
      );
    });
  }, [publicSeriesData, paramCreatorId, publicCreator]);

  // Fallback creator info extracted directly from matching series if getCreatorDetail returns 404
  const seriesCreator = useMemo(() => {
    if (!series || series.length === 0) return null;
    const first = series[0];
    return {
      creatorId: first.creatorId,
      accountId: first.accountId,
      displayName: first.creatorName,
      username: first.username || first.creatorName,
      avatarUrl: first.creatorAvatar || undefined,
      followerCount: first.totalCreatorFollowers || 0,
      bio: "Nhà sáng tạo nội dung độc quyền trên TaleX.",
    };
  }, [series]);

  const isTargetOwnCreator = useMemo(() => {
    if (!isAuthenticated) return false;
    const myAccountId = user?.accountId || profileUser?.accountId;
    const myCreatorId = ownCreator?.creatorId;

    if (!paramCreatorId) return false;

    const target = paramCreatorId.toLowerCase();

    const isMatchMyAccountId = Boolean(
      myAccountId && myAccountId.toLowerCase() === target
    );
    const isMatchMyCreatorId = Boolean(
      myCreatorId && myCreatorId.toLowerCase() === target
    );
    const isMatchMySeries = Boolean(
      series[0] &&
        ((series[0].accountId &&
          series[0].accountId.toLowerCase() === myAccountId?.toLowerCase()) ||
          (series[0].creatorId &&
            series[0].creatorId.toLowerCase() === myCreatorId?.toLowerCase()))
    );

    return isMatchMyAccountId || isMatchMyCreatorId || isMatchMySeries;
  }, [isAuthenticated, user, profileUser, ownCreator, paramCreatorId, series]);

  useEffect(() => {
    if (isTargetOwnCreator) {
      router.replace("/creator-channel");
    }
  }, [isTargetOwnCreator, router]);

  const creator = publicCreator || seriesCreator;
  const isCreatorLoading = isPublicCreatorLoading && !seriesCreator;
  const isCreatorError = isPublicCreatorError && !seriesCreator;

  const displayCreatorName =
    creator?.displayName ||
    creator?.username ||
    series[0]?.creatorName ||
    "Tác giả TaleX";

  const displayCreatorAvatar =
    creator?.avatarUrl ||
    series[0]?.creatorAvatar ||
    undefined;

  const targetAccountId =
    series[0]?.accountId ||
    publicCreator?.accountId ||
    creator?.accountId ||
    (paramCreatorId && !paramCreatorId.startsWith("CR-") ? paramCreatorId : undefined);

  const candidateIds = useMemo(() => {
    return [
      targetAccountId,
      series[0]?.accountId,
      series[0]?.creatorId,
      publicCreator?.accountId,
      publicCreator?.creatorId,
      creator?.creatorId,
      creator?.accountId,
      series[0]?.creatorName,
      paramCreatorId,
    ];
  }, [targetAccountId, publicCreator, creator, series, paramCreatorId]);

  const {
    isFollowing: queryIsFollowing,
    followedItem,
    toggleFollow,
    isMutating: isFollowMutating,
  } = useCreatorFollow(targetAccountId, candidateIds);

  const displayCreatorUsername =
    publicCreator?.username ||
    followedItem?.username ||
    creator?.username ||
    series[0]?.username ||
    creator?.displayName ||
    series[0]?.creatorName ||
    "creator";

  const isFollowing =
    localFollowState !== null ? localFollowState : queryIsFollowing;

  const handleToggleFollow = async () => {
    const nextState = !isFollowing;
    setLocalFollowState(nextState);
    try {
      await toggleFollow();
    } catch {
      setLocalFollowState(!nextState);
    }
  };

  const baseFollowerCount =
    creator?.followerCount ||
    series[0]?.totalCreatorFollowers ||
    0;

  const followerCount = Math.max(
    baseFollowerCount,
    isFollowing ? 1 : 0
  );

  // Public Combos
  const combosQuery = useGetPublicCombos();
  const creatorCombos = (combosQuery.data ?? []).filter(
    (combo) =>
      combo.creatorId === creator?.creatorId ||
      combo.creatorId === targetAccountId ||
      combo.creatorId === paramCreatorId
  );

  const totalViews = series.reduce(
    (acc, item) => acc + (item.totalViews || 0),
    0
  );

  const handleItemPress = (seriesId: string) => {
    router.push(`/series/${seriesId}`);
  };

  const getSortedList = (list: typeof series) => {
    let result = [...list];
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

  const comicsList = getSortedList(
    series.filter((item) => item.contentType?.toUpperCase() === "COMIC")
  );
  const moviesList = getSortedList(
    series.filter((item) => item.contentType?.toUpperCase() === "VIDEO")
  );

  const spotlightSeries = series[0];

  if (!isAuthenticated || isTargetOwnCreator) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#09090B]">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#FACC15] border-t-transparent" />
      </div>
    );
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
            <p className="text-sm font-semibold text-[#A1A1AA]">
              Đang tải thông tin kênh tác giả...
            </p>
          </div>
        ) : isCreatorError ? (
          <div className="flex h-[400px] flex-col items-center justify-center p-8 text-center bg-[#111114] rounded-3xl border border-white/[0.06] shadow-2xl">
            <Info className="mb-4 h-16 w-16 text-red-500" />
            <h3 className="text-xl font-bold text-white">Đã xảy ra lỗi</h3>
            <p className="mt-2 text-sm text-[#A1A1AA]">
              Không thể tải thông tin Tác giả vào lúc này. Vui lòng thử lại sau.
            </p>
          </div>
        ) : (
          <>
            {/* 1. Header Banner & Public Profile Header */}
            <div className="relative rounded-3xl overflow-hidden bg-[#121215] border border-white/[0.06] shadow-2xl">
              {/* Cover Banner */}
              <div className="h-44 sm:h-56 md:h-64 w-full relative overflow-hidden bg-gradient-to-r from-zinc-900 via-neutral-900 to-stone-900">
                {displayCreatorAvatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={displayCreatorAvatar}
                    alt="Channel Banner"
                    className="w-full h-full object-cover blur-md opacity-40 scale-105"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-r from-[#FACC15]/10 via-amber-500/5 to-transparent relative">
                    <div className="absolute inset-0 bg-[radial-[#FACC15]_1px,transparent_1px] [background-size:16px_16px] opacity-10" />
                    <Sparkles className="h-16 w-16 text-[#FACC15]/20 animate-pulse" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[#121215] via-transparent to-black/30" />
              </div>

              {/* Profile Bar */}
              <div className="flex flex-col md:flex-row items-start gap-8 px-6 sm:px-10 py-2 relative z-10">
                {/* Avatar circle */}
                <div className="-mt-14 md:-mt-[70px] shrink-0 w-28 h-28 md:w-[120px] md:h-[120px] rounded-full overflow-hidden border-4 border-[#09090B] bg-zinc-900 shadow-2xl relative">
                  {displayCreatorAvatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={displayCreatorAvatar}
                      alt={displayCreatorName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-[#17171C] text-[#FACC15] font-black text-4xl">
                      {displayCreatorName.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>

                {/* Profile Text Info */}
                <div className="flex-1 flex flex-col min-w-0">
                  <div className="flex flex-wrap items-center gap-3">
                    <h1 className="text-3xl md:text-[32px] font-black text-[#F5F5F5] tracking-tight leading-none">
                      {displayCreatorName}
                    </h1>
                    <span className="flex items-center gap-1 px-3 py-1 rounded-full text-[9px] font-black tracking-wider uppercase border bg-yellow-400/10 border-yellow-400/20 text-[#FACC15] shadow-sm shrink-0">
                      <Sparkles className="h-3 w-3 text-[#FACC15]" /> Creator
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-semibold text-[#A1A1AA] mt-2.5">
                    <span>@{displayCreatorUsername}</span>
                    <span className="text-zinc-700">&bull;</span>
                    <span className="text-[#F5F5F5] font-bold">
                      {followerCount.toLocaleString("vi-VN")}
                    </span>{" "}
                    <span>Người theo dõi</span>
                    <span className="text-zinc-700">&bull;</span>
                    <span className="text-[#F5F5F5] font-bold">
                      {series.length.toLocaleString("vi-VN")}
                    </span>{" "}
                    <span>Tác phẩm</span>
                    <span className="text-zinc-700">&bull;</span>
                    <span className="text-[#F5F5F5] font-bold">
                      {totalViews.toLocaleString("vi-VN")}
                    </span>{" "}
                    <span>Lượt xem</span>
                  </div>

                  <div className="mt-3 max-w-2xl">
                    <p
                      className={`text-xs text-[#A1A1AA] leading-relaxed ${isBioExpanded ? "" : "line-clamp-2"}`}
                    >
                      {creator?.bio || "Nhà sáng tạo nội dung độc quyền trên TaleX."}
                    </p>
                    {creator?.bio && creator.bio.length > 100 && (
                      <button
                        type="button"
                        onClick={() => setIsBioExpanded(!isBioExpanded)}
                        className="text-xs text-zinc-400 hover:text-white font-bold flex items-center gap-0.5 mt-1.5 outline-none cursor-pointer"
                      >
                        <span>{isBioExpanded ? "Thu gọn" : "Xem thêm"}</span>
                        {isBioExpanded ? (
                          <ChevronUp className="h-3 w-3" />
                        ) : (
                          <ChevronDown className="h-3 w-3" />
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {/* Follow Button for Viewers */}
                <div className="shrink-0 flex items-center gap-3">
                  <FollowButton
                    isFollowing={isFollowing}
                    onFollowToggle={handleToggleFollow}
                    isMutating={isFollowMutating}
                  />
                </div>
              </div>

              {/* Navigation Tabs */}
              <div className="border-b border-white/[0.06] bg-transparent flex gap-4 overflow-x-auto scrollbar-none mt-4 px-6 sm:px-10">
                {(
                  [
                    { id: "home", label: "Trang chủ" },
                    { id: "comics", label: "Truyện tranh" },
                    { id: "movies", label: "Phim ảnh" },
                    { id: "about", label: "Giới thiệu" },
                    { id: "combo", label: "Combo" },
                  ] as const
                ).map((tab) => {
                  const isActive = activeTab === tab.id;
                  const isCombo = tab.id === "combo";

                  if (isCombo) {
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setActiveTab(tab.id)}
                        className={`py-3.5 px-2 text-sm font-black relative transition-colors cursor-pointer outline-none focus:outline-none flex items-center gap-1.5 ${
                          isActive
                            ? "text-red-500"
                            : "text-red-500/70 hover:text-red-400"
                        }`}
                      >
                        <Flame className="h-4 w-4 fill-red-500 text-red-500 animate-pulse" />
                        <span>{tab.label}</span>
                        {isActive && (
                          <motion.span
                            layoutId="activeTabUnderline"
                            className="absolute bottom-0 left-0 right-0 h-[2px] bg-red-500 rounded-full shadow-[0_0_8px_rgba(239,68,68,0.7)]"
                            transition={{
                              type: "spring",
                              stiffness: 380,
                              damping: 30,
                            }}
                          />
                        )}
                      </button>
                    );
                  }

                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                      className={`py-3.5 px-2 text-sm font-black relative transition-colors cursor-pointer outline-none focus:outline-none ${
                        isActive
                          ? "text-[#FACC15]"
                          : "text-[#A1A1AA] hover:text-white"
                      }`}
                    >
                      {tab.label}
                      {isActive && (
                        <motion.span
                          layoutId="activeTabUnderline"
                          className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#FACC15] rounded-full"
                          transition={{
                            type: "spring",
                            stiffness: 380,
                            damping: 30,
                          }}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Controls Bar (Sorting) */}
            {activeTab !== "about" && (
              <div className="flex flex-wrap items-center justify-end gap-4 py-1">
                {/* Dropdown Menu Sort */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowSortMenu(!showSortMenu)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#121215] border border-white/[0.06] text-xs font-bold text-[#A1A1AA] hover:text-white hover:border-white/10 transition-all cursor-pointer"
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
                      {(["latest", "popular", "oldest"] as const).map(
                        (option) => {
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
                                isOptionActive
                                  ? "text-[#FACC15] font-bold"
                                  : "text-zinc-400"
                              }`}
                            >
                              {optionLabel}
                            </button>
                          );
                        }
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 3. Main Content Tab Views */}
            <div className="w-full">
              {/* Tab: Trang chủ (Home) */}
              {activeTab === "home" && (
                <div className="flex flex-col gap-10">
                  {/* Spotlight Item */}
                  {spotlightSeries && (
                    <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-zinc-950 via-[#121215] to-zinc-950 border border-white/[0.08] p-6 sm:p-8 shadow-2xl">
                      {spotlightSeries.coverUrl && (
                        <div
                          className="absolute inset-0 bg-cover bg-center opacity-[0.05] blur-3xl scale-110 pointer-events-none"
                          style={{
                            backgroundImage: `url(${spotlightSeries.coverUrl})`,
                          }}
                        />
                      )}
                      <div className="flex flex-col lg:flex-row items-center gap-8 relative z-10">
                        {/* Left Poster */}
                        <div
                          onClick={() =>
                            handleItemPress(spotlightSeries.seriesId)
                          }
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
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-zinc-600">
                              {spotlightSeries.contentType === "VIDEO" ? (
                                <Film size={48} />
                              ) : (
                                <BookOpen size={48} />
                              )}
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <div className="w-14 h-14 rounded-full bg-[#FACC15] flex items-center justify-center text-black shadow-xl scale-90 group-hover:scale-100 transition-transform">
                              <Play className="h-6 w-6 fill-black ml-0.5" />
                            </div>
                          </div>
                        </div>

                        {/* Right Spotlight Details */}
                        <div className="flex-1 flex flex-col items-start min-w-0">
                          <div className="flex items-center gap-2 mb-3">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-yellow-400/10 text-[#FACC15] border border-yellow-400/20">
                              <Sparkles size={12} />
                              Tác phẩm tiêu điểm
                            </span>
                            <span className="text-[9px] font-black uppercase tracking-widest text-zinc-300 bg-white/[0.04] px-3 py-1 rounded-full border border-white/[0.06]">
                              {spotlightSeries.contentType === "COMIC"
                                ? "Truyện tranh"
                                : "Phim ảnh"}
                            </span>
                            <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400 flex items-center gap-1">
                              <Eye size={12} className="text-[#FACC15]" />{" "}
                              {spotlightSeries.totalViews || 0} lượt xem
                            </span>
                          </div>

                          <h2
                            onClick={() =>
                              handleItemPress(spotlightSeries.seriesId)
                            }
                            className="text-2xl sm:text-3xl font-black text-[#F5F5F5] hover:text-[#FACC15] cursor-pointer leading-tight transition-colors line-clamp-2"
                          >
                            {spotlightSeries.title}
                          </h2>

                          <p className="text-sm text-[#A1A1AA] leading-relaxed line-clamp-4 font-medium max-w-2xl mt-3">
                            {spotlightSeries.description ||
                              "Chưa có mô tả chi tiết cho tác phẩm tiêu điểm này."}
                          </p>

                          <div className="flex flex-wrap items-center gap-3 mt-6">
                            <button
                              type="button"
                              onClick={() =>
                                handleItemPress(spotlightSeries.seriesId)
                              }
                              className="inline-flex items-center gap-2 bg-gradient-to-r from-[#FACC15] to-[#FFD54F] hover:from-[#FFD54F] hover:to-[#FFE082] text-stone-950 text-xs font-black rounded-full px-6 py-3.5 transition-all hover:shadow-[0_0_20px_rgba(250,204,21,0.3)] active:scale-95 duration-200 cursor-pointer shadow-md"
                            >
                              <Play className="h-4 w-4 fill-black" />
                              {spotlightSeries.contentType === "VIDEO"
                                ? "Xem Ngay"
                                : "Đọc Ngay"}
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                handleItemPress(spotlightSeries.seriesId)
                              }
                              className="inline-flex items-center gap-2 bg-white/[0.03] hover:bg-white/[0.08] text-white border border-white/10 hover:border-yellow-400/30 text-xs font-black rounded-full px-6 py-3.5 transition-all active:scale-95 duration-200 cursor-pointer shadow-md"
                            >
                              Chi tiết
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Section Comics */}
                  {comicsList.length > 0 && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
                        <h3 className="text-lg font-extrabold text-[#F5F5F5] flex items-center gap-2">
                          <BookOpen className="h-5 w-5 text-[#FACC15]" />
                          Truyện tranh nổi bật ({comicsList.length})
                        </h3>
                        {comicsList.length > 4 && (
                          <button
                            type="button"
                            onClick={() => setActiveTab("comics")}
                            className="text-xs font-bold text-[#FACC15] hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            Xem tất cả <ChevronRight className="h-4 w-4" />
                          </button>
                        )}
                      </div>

                      <PublicSeriesGrid
                        list={comicsList.slice(0, 4)}
                        loading={isPublicSeriesLoading}
                        contentTypeLabel="Truyện"
                        onItemPress={handleItemPress}
                      />
                    </div>
                  )}

                  {/* Section Movies */}
                  {moviesList.length > 0 && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
                        <h3 className="text-lg font-extrabold text-[#F5F5F5] flex items-center gap-2">
                          <Video className="h-5 w-5 text-[#FACC15]" />
                          Phim ảnh nổi bật ({moviesList.length})
                        </h3>
                        {moviesList.length > 4 && (
                          <button
                            type="button"
                            onClick={() => setActiveTab("movies")}
                            className="text-xs font-bold text-[#FACC15] hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            Xem tất cả <ChevronRight className="h-4 w-4" />
                          </button>
                        )}
                      </div>

                      <PublicSeriesGrid
                        list={moviesList.slice(0, 4)}
                        loading={isPublicSeriesLoading}
                        contentTypeLabel="Phim"
                        onItemPress={handleItemPress}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Tab: Truyện tranh */}
              {activeTab === "comics" && (
                <div className="space-y-6">
                  <h3 className="text-lg font-extrabold text-[#F5F5F5] flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-[#FACC15]" />
                    Danh sách Truyện tranh ({comicsList.length})
                  </h3>
                  <PublicSeriesGrid
                    list={comicsList}
                    loading={isPublicSeriesLoading}
                    contentTypeLabel="Truyện"
                    onItemPress={handleItemPress}
                  />
                </div>
              )}

              {/* Tab: Phim ảnh */}
              {activeTab === "movies" && (
                <div className="space-y-6">
                  <h3 className="text-lg font-extrabold text-[#F5F5F5] flex items-center gap-2">
                    <Video className="h-5 w-5 text-[#FACC15]" />
                    Danh sách Phim ảnh ({moviesList.length})
                  </h3>
                  <PublicSeriesGrid
                    list={moviesList}
                    loading={isPublicSeriesLoading}
                    contentTypeLabel="Phim"
                    onItemPress={handleItemPress}
                  />
                </div>
              )}

              {/* Tab: Giới thiệu */}
              {activeTab === "about" && (
                <div className="max-w-3xl space-y-8 bg-[#111114] border border-white/[0.06] p-6 rounded-2xl shadow-xl">
                  <div>
                    <h4 className="text-sm font-black text-[#FACC15] tracking-wider mb-2 uppercase">
                      Tiểu sử tác giả
                    </h4>
                    <p className="text-sm font-semibold text-zinc-300 leading-relaxed">
                      {creator?.bio || "Tác giả chưa cập nhật tiểu sử."}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-6 border-t border-white/[0.06]">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white/[0.04] flex items-center justify-center text-[#FACC15]">
                        <Calendar className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-zinc-500 uppercase">
                          Tham gia TaleX
                        </p>
                        <p className="text-xs font-bold text-zinc-200 mt-0.5">
                          Tác giả chính thức
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab: Combo Packages */}
              {activeTab === "combo" && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
                    <h3 className="text-lg font-extrabold text-[#F5F5F5] flex items-center gap-2">
                      <Flame className="h-5 w-5 text-red-500" />
                      Gói Combo Ưu Đãi Của Tác Giả ({creatorCombos.length})
                    </h3>
                  </div>

                  {creatorCombos.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {creatorCombos.map((combo, idx) => (
                        <ComboCard
                          key={combo.comboId}
                          combo={combo}
                          isPopular={idx === 0}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-16 text-center bg-[#111114] rounded-2xl border border-white/[0.06]">
                      <Flame className="h-12 w-12 text-zinc-600 mb-3" />
                      <p className="text-sm font-bold text-zinc-400">
                        Chưa có gói Combo ưu đãi nào từ tác giả này.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
}

interface PublicSeriesGridProps {
  list: any[];
  loading: boolean;
  contentTypeLabel: string;
  onItemPress: (id: string) => void;
}

function PublicSeriesGrid({
  list,
  loading,
  contentTypeLabel,
  onItemPress,
}: PublicSeriesGridProps) {
  if (loading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#FACC15] border-t-transparent" />
      </div>
    );
  }

  if (!list || list.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center bg-[#111114] rounded-2xl border border-white/[0.06]">
        <p className="text-sm font-bold text-zinc-500">
          Chưa có tác phẩm {contentTypeLabel.toLowerCase()} nào.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-6">
      {list.map((item) => (
        <div
          key={item.seriesId}
          onClick={() => onItemPress(item.seriesId)}
          className="group cursor-pointer flex flex-col bg-[#111114] border border-white/[0.06] rounded-2xl overflow-hidden hover:border-yellow-400/30 transition-all duration-300 shadow-lg hover:shadow-yellow-500/5 hover:-translate-y-1"
        >
          <div
            className={`relative w-full overflow-hidden bg-zinc-900 ${
              item.contentType === "VIDEO" ? "aspect-video" : "aspect-[3/4]"
            }`}
          >
            {item.coverUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={item.coverUrl}
                alt={item.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-zinc-600">
                {item.contentType === "VIDEO" ? (
                  <Film size={36} />
                ) : (
                  <BookOpen size={36} />
                )}
              </div>
            )}
          </div>

          <div className="p-3.5 flex flex-col flex-1">
            <h4 className="text-sm font-bold text-[#F5F5F5] group-hover:text-[#FACC15] line-clamp-1 transition-colors">
              {item.title}
            </h4>
            <p className="text-[11px] text-[#A1A1AA] line-clamp-2 mt-1 flex-1 font-medium">
              {item.description || "Chưa có mô tả"}
            </p>
            <div className="flex items-center justify-between text-[10px] font-bold text-zinc-500 mt-3 pt-2 border-t border-white/[0.04]">
              <span className="flex items-center gap-1">
                <Eye size={12} className="text-[#FACC15]" />{" "}
                {(item.totalViews || 0).toLocaleString("vi-VN")}
              </span>
              <span>{item.contentType === "VIDEO" ? "Phim" : "Truyện"}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function PublicChannelPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center bg-[#09090B] text-[#FACC15]">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#FACC15] border-t-transparent" />
        </div>
      }
    >
      <PublicChannelContent />
    </Suspense>
  );
}
