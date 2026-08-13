"use client";

import { useState } from "react";
import {
  useMongoUserFeatures,
  useMongoUserDynamicFeatures,
} from "../hooks/use-admin-channels";
import {
  Database,
  RefreshCw,
  AlertCircle,
  Clock,
  MousePointer,
  Heart,
  Bookmark,
  Share2,
  MessageSquare,
  Activity,
  Globe,
  User,
  Tag,
  FolderTree,
  BarChart3,
  FileCode,
  Copy,
  Check,
  Flame,
  Sparkles,
  Zap,
} from "lucide-react";

interface MongoUserFeaturesViewProps {
  accountId: string;
}

export function MongoUserFeaturesView({ accountId }: MongoUserFeaturesViewProps) {
  // Static mongo features query (GET /api/v1/mongo/features/user/{id})
  const {
    data: userFeatures,
    isLoading: isLoadingStatic,
    isError: isErrorStatic,
    error: staticError,
    refetch: refetchStatic,
    isRefetching: isRefetchingStatic,
  } = useMongoUserFeatures(accountId);

  // Dynamic mongo features query (GET /api/v1/mongo/features/user/{id}/dynamic)
  const {
    data: dynamicFeatures,
    isLoading: isLoadingDynamic,
    isError: isErrorDynamic,
    refetch: refetchDynamic,
  } = useMongoUserDynamicFeatures(accountId);

  const [copiedJson, setCopiedJson] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "genres" | "tags" | "raw">("overview");

  const handleCopyJson = () => {
    if (userFeatures) {
      navigator.clipboard.writeText(
        JSON.stringify(
          {
            staticProfile: userFeatures,
            dynamicTop5: dynamicFeatures,
          },
          null,
          2
        )
      );
      setCopiedJson(true);
      setTimeout(() => setCopiedJson(false), 2000);
    }
  };

  const formatSeconds = (sec: number = 0) => {
    if (sec <= 0) return "0s";
    const mins = Math.floor(sec / 60);
    const remainingSec = sec % 60;
    if (mins === 0) return `${remainingSec}s`;
    return `${mins}m ${remainingSec}s`;
  };

  const formatPercentage = (num: number = 0) => {
    return `${(num * 100).toFixed(1)}%`;
  };

  const handleRefreshAll = () => {
    refetchStatic();
    refetchDynamic();
  };

  return (
    <div className="rounded-2xl border-2 border-emerald-200 bg-gradient-to-b from-emerald-50/30 via-white to-white p-6 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-emerald-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white font-bold shadow-md shadow-emerald-200">
            <Database className="h-5 w-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-bold text-slate-900">
                Đặc Điểm Người Dùng (Mongo Features Profile)
              </h3>
              <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800 border border-emerald-200">
                GET /api/v1/mongo/features/user/{accountId}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Hồ sơ phân tích đặc điểm cố định & đặc điểm động (Top 5 danh mục/thẻ xem nhiều nhất)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleRefreshAll}
            disabled={isRefetchingStatic}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 shadow-sm"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-emerald-600 ${isRefetchingStatic ? "animate-spin" : ""}`} />
            <span>Tải lại MongoDB Data</span>
          </button>
        </div>
      </div>

      {/* Dynamic Top 5 Highlights Section (GET /api/v1/mongo/features/user/{id}/dynamic) */}
      <div className="rounded-xl border border-amber-200 bg-gradient-to-r from-amber-50/70 via-orange-50/50 to-amber-50/70 p-4 space-y-3">
        <div className="flex items-center justify-between border-b border-amber-200/60 pb-2">
          <div className="flex items-center gap-2">
            <Flame className="h-4 w-4 text-amber-600 fill-amber-500" />
            <h4 className="font-bold text-xs text-amber-950 uppercase tracking-wider">
              Top 5 Sở Thích Động AI (Dynamic User Features)
            </h4>
            <span className="rounded-full bg-amber-200/80 px-2 py-0.5 text-[10px] font-bold text-amber-900">
              GET /api/v1/mongo/features/user/{accountId}/dynamic
            </span>
          </div>

          <button
            type="button"
            onClick={() => refetchDynamic()}
            className="text-[11px] font-semibold text-amber-700 hover:text-amber-900 flex items-center gap-1"
          >
            <RefreshCw className={`h-3 w-3 ${isLoadingDynamic ? "animate-spin" : ""}`} />
            <span>Làm mới động</span>
          </button>
        </div>

        {/* Dynamic Categories & Tags Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Top 5 Categories */}
          <div className="space-y-1.5">
            <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
              <FolderTree className="h-3.5 w-3.5 text-amber-600" />
              Top 5 Danh Mục Xem Nhiều Nhất:
            </span>

            {isLoadingDynamic ? (
              <div className="h-8 w-full animate-pulse rounded-lg bg-amber-100/50" />
            ) : dynamicFeatures?.categories && dynamicFeatures.categories.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {dynamicFeatures.categories.map((catName, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 rounded-full bg-amber-500 px-2.5 py-1 text-xs font-bold text-white shadow-sm border border-amber-400"
                  >
                    <span className="rounded-full bg-amber-950/30 px-1.5 py-0.2 text-[10px] font-black">
                      #{idx + 1}
                    </span>
                    {catName}
                  </span>
                ))}
              </div>
            ) : (
              <span className="text-xs text-amber-700 italic">Chưa ghi nhận top danh mục động</span>
            )}
          </div>

          {/* Top 5 Tags */}
          <div className="space-y-1.5">
            <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
              <Tag className="h-3.5 w-3.5 text-orange-600" />
              Top 5 Thẻ Tag Xem Nhiều Nhất:
            </span>

            {isLoadingDynamic ? (
              <div className="h-8 w-full animate-pulse rounded-lg bg-amber-100/50" />
            ) : dynamicFeatures?.tags && dynamicFeatures.tags.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {dynamicFeatures.tags.map((tagName, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 rounded-full bg-orange-600 px-2.5 py-1 text-xs font-bold text-white shadow-sm border border-orange-500"
                  >
                    <span className="rounded-full bg-orange-950/30 px-1.5 py-0.2 text-[10px] font-black">
                      #{idx + 1}
                    </span>
                    {tagName}
                  </span>
                ))}
              </div>
            ) : (
              <span className="text-xs text-amber-700 italic">Chưa ghi nhận top thẻ tag động</span>
            )}
          </div>
        </div>
      </div>

      {/* Loading State for Static Features */}
      {isLoadingStatic && (
        <div className="animate-pulse space-y-4 py-6">
          <div className="h-20 w-full rounded-xl bg-slate-100" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="h-24 rounded-xl bg-slate-100" />
            <div className="h-24 rounded-xl bg-slate-100" />
            <div className="h-24 rounded-xl bg-slate-100" />
          </div>
        </div>
      )}

      {/* Error State */}
      {isErrorStatic && (
        <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700 text-xs">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>
            Không thể tải MongoDB Features của tài khoản này:{" "}
            {staticError instanceof Error ? staticError.message : "Đã có lỗi xảy ra."}
          </span>
        </div>
      )}

      {/* Empty State */}
      {!isLoadingStatic && !isErrorStatic && !userFeatures && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-emerald-200 bg-emerald-50/50 py-10 px-4 text-center">
          <Database className="h-9 w-9 text-emerald-300 stroke-[1.5]" />
          <p className="mt-2 text-sm font-semibold text-slate-700">
            Chưa có dữ liệu MongoDB Features cho tài khoản này
          </p>
        </div>
      )}

      {/* Main Content Area */}
      {!isLoadingStatic && !isErrorStatic && userFeatures && (
        <div className="space-y-6">
          {/* Sub Navigation Tabs */}
          <div className="flex items-center gap-2 border-b border-slate-200 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveTab("overview")}
              className={`flex items-center gap-1.5 border-b-2 px-4 py-2.5 transition-all ${
                activeTab === "overview"
                  ? "border-emerald-600 font-bold text-emerald-700"
                  : "border-transparent text-slate-500 hover:text-slate-900"
              }`}
            >
              <Activity className="h-4 w-4" />
              <span>Tổng Quan & Tương Tác</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("genres")}
              className={`flex items-center gap-1.5 border-b-2 px-4 py-2.5 transition-all ${
                activeTab === "genres"
                  ? "border-emerald-600 font-bold text-emerald-700"
                  : "border-transparent text-slate-500 hover:text-slate-900"
              }`}
            >
              <FolderTree className="h-4 w-4" />
              <span>Phân Tích Thể Loại ({Object.keys(userFeatures.preferences?.genresClicksRaw || {}).length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("tags")}
              className={`flex items-center gap-1.5 border-b-2 px-4 py-2.5 transition-all ${
                activeTab === "tags"
                  ? "border-emerald-600 font-bold text-emerald-700"
                  : "border-transparent text-slate-500 hover:text-slate-900"
              }`}
            >
              <Tag className="h-4 w-4" />
              <span>Phân Tích Thẻ Tag ({Object.keys(userFeatures.preferences?.tagsClicksRaw || {}).length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("raw")}
              className={`flex items-center gap-1.5 border-b-2 px-4 py-2.5 transition-all ml-auto ${
                activeTab === "raw"
                  ? "border-emerald-600 font-bold text-emerald-700"
                  : "border-transparent text-slate-500 hover:text-slate-900"
              }`}
            >
              <FileCode className="h-4 w-4" />
              <span>Raw JSON Data</span>
            </button>
          </div>

          {/* TAB 1: OVERVIEW & INTERACTIONS */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* Demographics & Onboarding Card */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Basic Demographics */}
                <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
                  <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
                    <User className="h-4 w-4 text-emerald-600" />
                    Thông Tin Nhân Khẩu Học
                  </h4>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[11px]">Account ID</span>
                      <span className="font-mono font-semibold text-slate-900 truncate block">
                        {accountId}
                      </span>
                      {userFeatures.accountId && userFeatures.accountId !== accountId && (
                        <span className="text-[10px] text-amber-600 font-mono block">
                          (Backend JSON: {userFeatures.accountId})
                        </span>
                      )}
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Ngôn ngữ (Language)</span>
                      <span className="font-semibold text-slate-900 flex items-center gap-1">
                        <Globe className="h-3 w-3 text-slate-400" />
                        {userFeatures.language || "en-US"}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Giới tính (Gender)</span>
                      <span className="font-semibold text-slate-900">
                        {userFeatures.gender || "MALE"}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Độ tuổi (Age)</span>
                      <span className="font-semibold text-slate-900">
                        {userFeatures.age || "MATURE"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Onboarding Preferences */}
                <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
                  <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
                    <FolderTree className="h-4 w-4 text-emerald-600" />
                    Sở Thích Khởi Tạo (Onboarding Preferences)
                  </h4>
                  <div className="space-y-2.5 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[11px] mb-1">
                        Thể loại đã chọn khi Onboarding (Genres):
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {userFeatures.onboardingGenres?.map((g, i) => (
                          <span
                            key={i}
                            className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 border border-emerald-200"
                          >
                            {g}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <span className="text-slate-400 block text-[11px] mb-1">
                        Thẻ Tag đã chọn khi Onboarding (Tags):
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {userFeatures.onboardingTags?.map((t, i) => (
                          <span
                            key={i}
                            className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-semibold text-indigo-800 border border-indigo-200"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Deep Engagement Watch Time Section */}
              <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
                <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
                  <Clock className="h-4 w-4 text-emerald-600" />
                  Chỉ Số Xem Sâu (Deep Engagement & Watch Time)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="rounded-xl bg-emerald-50/70 p-3.5 border border-emerald-100">
                    <span className="text-xs font-medium text-emerald-700 block">Total Watch Time</span>
                    <span className="text-xl font-black text-emerald-900 block mt-1">
                      {formatSeconds(userFeatures.deepEngagement?.totalWatchTime)}
                    </span>
                    <span className="text-[11px] text-emerald-600 font-mono">
                      ({userFeatures.deepEngagement?.totalWatchTime || 0}s)
                    </span>
                  </div>

                  <div className="rounded-xl bg-sky-50/70 p-3.5 border border-sky-100">
                    <span className="text-xs font-medium text-sky-700 block">Watch Time (7 Days)</span>
                    <span className="text-xl font-black text-sky-900 block mt-1">
                      {formatSeconds(userFeatures.deepEngagement?.watchTimeLast7d)}
                    </span>
                    <span className="text-[11px] text-sky-600 font-mono">
                      ({userFeatures.deepEngagement?.watchTimeLast7d || 0}s)
                    </span>
                  </div>

                  <div className="rounded-xl bg-violet-50/70 p-3.5 border border-violet-100">
                    <span className="text-xs font-medium text-violet-700 block">Watch Time (24 Hours)</span>
                    <span className="text-xl font-black text-violet-900 block mt-1">
                      {formatSeconds(userFeatures.deepEngagement?.watchTimeLast24h)}
                    </span>
                    <span className="text-[11px] text-violet-600 font-mono">
                      ({userFeatures.deepEngagement?.watchTimeLast24h || 0}s)
                    </span>
                  </div>
                </div>
              </div>

              {/* Interactions Breakdown & Ratios */}
              <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-4">
                <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
                  <BarChart3 className="h-4 w-4 text-emerald-600" />
                  Thống Kê Tương Tác & Tỷ Lệ Chuyển Đổi (Interactions & Ratios)
                </h4>

                {/* Grid of Total, 7d, 24h Interaction Counts */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
                  <div className="rounded-xl bg-slate-50 p-3 border border-slate-100">
                    <span className="flex items-center gap-1.5 text-slate-500 font-semibold mb-1">
                      <MousePointer className="h-3.5 w-3.5 text-sky-500" />
                      Lượt Clicks
                    </span>
                    <span className="text-lg font-bold text-slate-900 block">
                      {userFeatures.interactions?.totalClicks ?? 0}
                    </span>
                    <div className="mt-1 pt-1 border-t border-slate-200 text-[10px] text-slate-400 space-x-1">
                      <span>7d: <b>{userFeatures.interactions?.clicksLast7d ?? 0}</b></span>
                      <span>•</span>
                      <span>24h: <b>{userFeatures.interactions?.clicksLast24h ?? 0}</b></span>
                    </div>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-3 border border-slate-100">
                    <span className="flex items-center gap-1.5 text-slate-500 font-semibold mb-1">
                      <Heart className="h-3.5 w-3.5 text-rose-500" />
                      Lượt Likes
                    </span>
                    <span className="text-lg font-bold text-slate-900 block">
                      {userFeatures.interactions?.totalLikes ?? 0}
                    </span>
                    <div className="mt-1 pt-1 border-t border-slate-200 text-[10px] text-slate-400 space-x-1">
                      <span>7d: <b>{userFeatures.interactions?.likesLast7d ?? 0}</b></span>
                      <span>•</span>
                      <span>24h: <b>{userFeatures.interactions?.likesLast24h ?? 0}</b></span>
                    </div>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-3 border border-slate-100">
                    <span className="flex items-center gap-1.5 text-slate-500 font-semibold mb-1">
                      <Bookmark className="h-3.5 w-3.5 text-amber-500" />
                      Lượt Bookmarks
                    </span>
                    <span className="text-lg font-bold text-slate-900 block">
                      {userFeatures.interactions?.totalBookmarks ?? 0}
                    </span>
                    <div className="mt-1 pt-1 border-t border-slate-200 text-[10px] text-slate-400 space-x-1">
                      <span>7d: <b>{userFeatures.interactions?.bookmarksLast7d ?? 0}</b></span>
                      <span>•</span>
                      <span>24h: <b>{userFeatures.interactions?.bookmarksLast24h ?? 0}</b></span>
                    </div>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-3 border border-slate-100">
                    <span className="flex items-center gap-1.5 text-slate-500 font-semibold mb-1">
                      <Share2 className="h-3.5 w-3.5 text-indigo-500" />
                      Lượt Shares
                    </span>
                    <span className="text-lg font-bold text-slate-900 block">
                      {userFeatures.interactions?.totalShares ?? 0}
                    </span>
                    <div className="mt-1 pt-1 border-t border-slate-200 text-[10px] text-slate-400 space-x-1">
                      <span>7d: <b>{userFeatures.interactions?.sharesLast7d ?? 0}</b></span>
                      <span>•</span>
                      <span>24h: <b>{userFeatures.interactions?.sharesLast24h ?? 0}</b></span>
                    </div>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-3 border border-slate-100 col-span-2 sm:col-span-1">
                    <span className="flex items-center gap-1.5 text-slate-500 font-semibold mb-1">
                      <MessageSquare className="h-3.5 w-3.5 text-emerald-500" />
                      Lượt Comments
                    </span>
                    <span className="text-lg font-bold text-slate-900 block">
                      {userFeatures.interactions?.totalComments ?? 0}
                    </span>
                    <div className="mt-1 pt-1 border-t border-slate-200 text-[10px] text-slate-400 space-x-1">
                      <span>7d: <b>{userFeatures.interactions?.commentsLast7d ?? 0}</b></span>
                      <span>•</span>
                      <span>24h: <b>{userFeatures.interactions?.commentsLast24h ?? 0}</b></span>
                    </div>
                  </div>
                </div>

                {/* Conversion Ratios Breakdown */}
                <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200 bg-white">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 font-bold text-slate-700">
                        <th className="py-2.5 px-4">Tỷ lệ Chuyển Đổi (Interaction Ratio)</th>
                        <th className="py-2.5 px-4 text-center">Toàn thời gian (Total)</th>
                        <th className="py-2.5 px-4 text-center">7 Ngày Gần Đây (7d)</th>
                        <th className="py-2.5 px-4 text-center">24 Giờ Gần Đây (24h)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono">
                      <tr>
                        <td className="py-2.5 px-4 font-sans font-semibold text-slate-900">Like / Click Ratio</td>
                        <td className="py-2.5 px-4 text-center font-bold text-slate-800">{formatPercentage(userFeatures.interactions?.likeToClickRatio)}</td>
                        <td className="py-2.5 px-4 text-center font-bold text-slate-800">{formatPercentage(userFeatures.interactions?.likeToClickRatioLast7d)}</td>
                        <td className="py-2.5 px-4 text-center font-bold text-slate-800">{formatPercentage(userFeatures.interactions?.likeToClickRatioLast24h)}</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-4 font-sans font-semibold text-slate-900">Bookmark / Click Ratio</td>
                        <td className="py-2.5 px-4 text-center font-bold text-slate-800">{formatPercentage(userFeatures.interactions?.bookmarkToClickRatio)}</td>
                        <td className="py-2.5 px-4 text-center font-bold text-slate-800">{formatPercentage(userFeatures.interactions?.bookmarkToClickRatioLast7d)}</td>
                        <td className="py-2.5 px-4 text-center font-bold text-slate-800">{formatPercentage(userFeatures.interactions?.bookmarkToClickRatioLast24h)}</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-4 font-sans font-semibold text-slate-900">Share / Click Ratio</td>
                        <td className="py-2.5 px-4 text-center font-bold text-slate-800">{formatPercentage(userFeatures.interactions?.shareToClickRatio)}</td>
                        <td className="py-2.5 px-4 text-center font-bold text-slate-800">{formatPercentage(userFeatures.interactions?.shareToClickRatioLast7d)}</td>
                        <td className="py-2.5 px-4 text-center font-bold text-slate-800">{formatPercentage(userFeatures.interactions?.shareToClickRatioLast24h)}</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-4 font-sans font-semibold text-slate-900">Comment / Click Ratio</td>
                        <td className="py-2.5 px-4 text-center font-bold text-slate-800">{formatPercentage(userFeatures.interactions?.commentToClickRatio)}</td>
                        <td className="py-2.5 px-4 text-center font-bold text-slate-800">{formatPercentage(userFeatures.interactions?.commentToClickRatioLast7d)}</td>
                        <td className="py-2.5 px-4 text-center font-bold text-slate-800">{formatPercentage(userFeatures.interactions?.commentToClickRatioLast24h)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: GENRES PREFERENCES */}
          {activeTab === "genres" && (
            <div className="space-y-4">
              <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
                <FolderTree className="h-4 w-4 text-emerald-600" />
                Phân Tích Chi Tiết Trọng Số Thể Loại (Genres Preferences Breakdown)
              </h4>

              <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 font-bold text-slate-700">
                      <th className="py-2.5 px-4">Thể Loại (Genre)</th>
                      <th className="py-2.5 px-4 text-center">Raw Clicks</th>
                      <th className="py-2.5 px-4 text-center">Raw Watch Time</th>
                      <th className="py-2.5 px-4">Trọng Số Click (% Clicks)</th>
                      <th className="py-2.5 px-4">Trọng Số Watch Time (% Time)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {Object.keys(userFeatures.preferences?.genresClicksRaw || {})
                      .sort(
                        (a, b) =>
                          (userFeatures.preferences?.genresClicksRaw?.[b] || 0) -
                          (userFeatures.preferences?.genresClicksRaw?.[a] || 0)
                      )
                      .map((genreKey) => {
                        const rawClick = userFeatures.preferences?.genresClicksRaw?.[genreKey] ?? 0;
                        const rawTime = userFeatures.preferences?.genresWatchTimeRaw?.[genreKey] ?? 0;
                        const prefClick = userFeatures.preferences?.preferredGenresByClicks?.[genreKey] ?? 0;
                        const prefTime = userFeatures.preferences?.preferredGenresByWatchTime?.[genreKey] ?? 0;

                        return (
                          <tr key={genreKey} className="hover:bg-slate-50">
                            <td className="py-2.5 px-4 font-bold text-slate-900">
                              {genreKey}
                            </td>
                            <td className="py-2.5 px-4 text-center font-mono font-semibold text-slate-800">
                              {rawClick}
                            </td>
                            <td className="py-2.5 px-4 text-center font-mono font-semibold text-slate-800">
                              {formatSeconds(rawTime)} ({rawTime}s)
                            </td>
                            <td className="py-2.5 px-4">
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-violet-700 w-12 text-right">
                                  {formatPercentage(prefClick)}
                                </span>
                                <div className="h-2 flex-1 rounded-full bg-slate-100 overflow-hidden min-w-[60px]">
                                  <div
                                    className="h-full bg-violet-600 rounded-full"
                                    style={{ width: `${Math.min(prefClick * 100, 100)}%` }}
                                  />
                                </div>
                              </div>
                            </td>
                            <td className="py-2.5 px-4">
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-emerald-700 w-12 text-right">
                                  {formatPercentage(prefTime)}
                                </span>
                                <div className="h-2 flex-1 rounded-full bg-slate-100 overflow-hidden min-w-[60px]">
                                  <div
                                    className="h-full bg-emerald-600 rounded-full"
                                    style={{ width: `${Math.min(prefTime * 100, 100)}%` }}
                                  />
                                </div>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: TAGS PREFERENCES */}
          {activeTab === "tags" && (
            <div className="space-y-4">
              <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
                <Tag className="h-4 w-4 text-emerald-600" />
                Phân Tích Chi Tiết Trọng Số Thẻ Tag (Tags Preferences Breakdown)
              </h4>

              <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 font-bold text-slate-700">
                      <th className="py-2.5 px-4">Thẻ Tag (Tag)</th>
                      <th className="py-2.5 px-4 text-center">Raw Clicks</th>
                      <th className="py-2.5 px-4 text-center">Raw Watch Time</th>
                      <th className="py-2.5 px-4">Trọng Số Click (% Clicks)</th>
                      <th className="py-2.5 px-4">Trọng Số Watch Time (% Time)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {Object.keys(userFeatures.preferences?.tagsClicksRaw || {})
                      .sort(
                        (a, b) =>
                          (userFeatures.preferences?.tagsClicksRaw?.[b] || 0) -
                          (userFeatures.preferences?.tagsClicksRaw?.[a] || 0)
                      )
                      .map((tagKey) => {
                        const rawClick = userFeatures.preferences?.tagsClicksRaw?.[tagKey] ?? 0;
                        const rawTime = userFeatures.preferences?.tagsWatchTimeRaw?.[tagKey] ?? 0;
                        const prefClick = userFeatures.preferences?.preferredTagsByClicks?.[tagKey] ?? 0;
                        const prefTime = userFeatures.preferences?.preferredTagsByWatchTime?.[tagKey] ?? 0;

                        return (
                          <tr key={tagKey} className="hover:bg-slate-50">
                            <td className="py-2.5 px-4 font-bold text-slate-900">
                              {tagKey}
                            </td>
                            <td className="py-2.5 px-4 text-center font-mono font-semibold text-slate-800">
                              {rawClick}
                            </td>
                            <td className="py-2.5 px-4 text-center font-mono font-semibold text-slate-800">
                              {formatSeconds(rawTime)} ({rawTime}s)
                            </td>
                            <td className="py-2.5 px-4">
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-indigo-700 w-12 text-right">
                                  {formatPercentage(prefClick)}
                                </span>
                                <div className="h-2 flex-1 rounded-full bg-slate-100 overflow-hidden min-w-[60px]">
                                  <div
                                    className="h-full bg-indigo-600 rounded-full"
                                    style={{ width: `${Math.min(prefClick * 100, 100)}%` }}
                                  />
                                </div>
                              </div>
                            </td>
                            <td className="py-2.5 px-4">
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-teal-700 w-12 text-right">
                                  {formatPercentage(prefTime)}
                                </span>
                                <div className="h-2 flex-1 rounded-full bg-slate-100 overflow-hidden min-w-[60px]">
                                  <div
                                    className="h-full bg-teal-600 rounded-full"
                                    style={{ width: `${Math.min(prefTime * 100, 100)}%` }}
                                  />
                                </div>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: RAW JSON DATA */}
          {activeTab === "raw" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <FileCode className="h-4 w-4 text-emerald-600" />
                  MongoDB User Features Raw JSON (Static Profile & Dynamic Top 5)
                </h4>

                <button
                  type="button"
                  onClick={handleCopyJson}
                  className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  {copiedJson ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-600" />
                      <span className="text-emerald-700">Đã copy JSON</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5 text-slate-500" />
                      <span>Copy Full JSON</span>
                    </>
                  )}
                </button>
              </div>

              <pre className="max-h-96 w-full overflow-auto rounded-xl bg-slate-900 p-4 text-[11px] font-mono text-emerald-400 border border-slate-800 shadow-inner">
                {JSON.stringify(
                  {
                    staticProfile: userFeatures,
                    dynamicTop5: dynamicFeatures,
                  },
                  null,
                  2
                )}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
