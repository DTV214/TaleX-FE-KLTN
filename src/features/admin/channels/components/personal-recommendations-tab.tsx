"use client";

import { useState, useEffect } from "react";
import {
  useAdminAccountsList,
  useRecentSeriesByAccount,
  useSimilarSeries,
  useRecommendationPoolByAccount,
  useAlreadyWatchedPoolByAccount,
} from "../hooks/use-admin-channels";
import type { ChannelSeriesCard } from "../types/channels.types";
import { ChannelCardItem } from "./channel-card-item";
import {
  User,
  Sparkles,
  ChevronDown,
  Clock,
  AlertCircle,
  X,
  Mail,
  Cpu,
  LayoutGrid,
  ListFilter,
  Film,
  BookOpen,
  Star,
  BarChart2,
  CheckCircle2,
  Eye,
} from "lucide-react";
import Image from "next/image";

import { MongoUserFeaturesView } from "./mongo-user-features-view";

interface PersonalRecommendationsTabProps {
  onSelectCard?: (card: ChannelSeriesCard) => void;
}

export function PersonalRecommendationsTab({
  onSelectCard,
}: PersonalRecommendationsTabProps) {
  // Accounts List query
  const {
    data: accounts,
    isLoading: isLoadingAccounts,
    refetch: refetchAccounts,
  } = useAdminAccountsList();

  // Selected Account State
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");

  // Target Series for Similar Recommendations query
  const [targetSimilarSeries, setTargetSimilarSeries] =
    useState<ChannelSeriesCard | null>(null);

  // View Mode for Recommendation Pool Demo: "grid" vs "table"
  const [poolViewMode, setPoolViewMode] = useState<"grid" | "table">("grid");

  // Auto select first account once accounts load
  useEffect(() => {
    if (accounts && accounts.length > 0 && !selectedAccountId) {
      setSelectedAccountId(accounts[0].accountId);
    }
  }, [accounts, selectedAccountId]);

  // Selected Account details
  const currentAccount = accounts?.find(
    (acc) => acc.accountId === selectedAccountId
  );

  // 1. Fetch 5 Recent Series for selected AccountId
  const {
    data: recentSeries,
    isLoading: isLoadingRecent,
    isError: isErrorRecent,
    error: recentError,
    refetch: refetchRecent,
  } = useRecentSeriesByAccount(selectedAccountId);

  // 2. Fetch Similar Series for targetSimilarSeries.seriesId
  const {
    data: similarSeries,
    isLoading: isLoadingSimilar,
    isError: isErrorSimilar,
    error: similarError,
    refetch: refetchSimilar,
  } = useSimilarSeries(targetSimilarSeries?.seriesId || "");

  // 3. Fetch Recommendation Pool with AI Scores for selected AccountId
  const {
    data: poolItems,
    isLoading: isLoadingPool,
    isError: isErrorPool,
    error: poolError,
    refetch: refetchPool,
  } = useRecommendationPoolByAccount(selectedAccountId);

  // 4. Fetch Already Watched Pool for selected AccountId
  const {
    data: watchedPoolSeries,
    isLoading: isLoadingWatchedPool,
    isError: isErrorWatchedPool,
    error: watchedPoolError,
    refetch: refetchWatchedPool,
  } = useAlreadyWatchedPoolByAccount(selectedAccountId);

  // Format Score value helper
  const formatScore = (rawScore: string | number) => {
    if (typeof rawScore === "string" && rawScore.toLowerCase() === "another_channel") {
      return "Kênh Khác";
    }
    const num = typeof rawScore === "number" ? rawScore : parseFloat(rawScore || "0");
    if (isNaN(num)) return rawScore ? String(rawScore) : "0.0000";
    return num.toFixed(4);
  };

  const getScorePercentage = (rawScore: string | number) => {
    if (typeof rawScore === "string" && rawScore.toLowerCase() === "another_channel") {
      return 100;
    }
    const num = typeof rawScore === "number" ? rawScore : parseFloat(rawScore || "0");
    if (isNaN(num)) return 0;
    return Math.min(Math.max(Math.round(num > 1 ? num : num * 100), 0), 100);
  };

  return (
    <div className="space-y-6">
      {/* 1. Account Selector Bar */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-start gap-4 sm:gap-6">
          <div className="flex items-center gap-3 shrink-0">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-700 font-bold border border-violet-200">
              <User className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Chọn Tài Khoản Người Dùng
              </h3>
              <p className="text-xs text-slate-500">
                Chọn tài khoản để xem chi tiết
              </p>
            </div>
          </div>

          {/* Account Dropdown Inline (Same Row, Left Side) */}
          <div className="relative min-w-[280px] sm:w-96">
            {isLoadingAccounts ? (
              <div className="h-10 w-full animate-pulse rounded-xl bg-slate-100" />
            ) : (
              <div className="relative">
                <select
                  id="account-dropdown"
                  value={selectedAccountId}
                  onChange={(e) => {
                    setSelectedAccountId(e.target.value);
                    setTargetSimilarSeries(null); // reset similar view when account changes
                  }}
                  className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-3.5 pr-10 text-xs font-bold text-slate-800 transition-all focus:border-violet-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-violet-500 cursor-pointer"
                >
                  {accounts?.map((acc) => (
                    <option key={acc.accountId} value={acc.accountId}>
                      {acc.email} — {acc.fullName || acc.username} ({acc.roleName})
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              </div>
            )}
          </div>
        </div>

        {/* Selected Account Info Summary Card */}
        {currentAccount && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-violet-50/60 p-3.5 border border-violet-100/80">
            <div className="flex items-center gap-3">
              <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-violet-200 border border-violet-300">
                {currentAccount.avatarUrl ? (
                  <Image
                    src={currentAccount.avatarUrl}
                    alt={currentAccount.fullName || "User"}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center font-bold text-violet-700 text-sm">
                    {(currentAccount.fullName || currentAccount.email).charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-slate-900">
                    {currentAccount.fullName || currentAccount.username}
                  </span>
                  <span className="rounded bg-violet-200 px-1.5 py-0.5 text-[10px] font-bold text-violet-800">
                    {currentAccount.roleName}
                  </span>
                  <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800">
                    {currentAccount.status}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-600 mt-0.5">
                  <span className="flex items-center gap-1">
                    <Mail className="h-3 w-3 text-slate-400" />
                    {currentAccount.email}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    ID: {currentAccount.accountId}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MongoDB User Features Profile View */}
      {selectedAccountId && (
        <MongoUserFeaturesView key={selectedAccountId} accountId={selectedAccountId} />
      )}

      {/* 2. Top 5 Recent Series Section */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-sky-700 font-bold border border-sky-200">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">
                  5 Series Đã Xem Gần Đây
                </h3>
                <span className="rounded-full bg-sky-100 px-2.5 py-0.5 text-xs font-bold text-sky-700">
                  {recentSeries?.length ?? 0} series
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Danh sách series người dùng xem gần nhất
              </p>
            </div>
          </div>

        </div>

        {/* Recent Series Content Grid */}
        <div className="mt-5">
          {/* Loading */}
          {isLoadingRecent && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {Array.from({ length: 5 }).map((_, idx) => (
                <div
                  key={idx}
                  className="animate-pulse rounded-xl border border-slate-100 bg-slate-50 p-4 space-y-3"
                >
                  <div className="aspect-[16/9] w-full rounded-lg bg-slate-200" />
                  <div className="h-4 w-3/4 rounded bg-slate-200" />
                  <div className="h-3 w-1/2 rounded bg-slate-200" />
                </div>
              ))}
            </div>
          )}

          {/* Error */}
          {isErrorRecent && (
            <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700 text-xs">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <span>
                Không thể tải danh sách series đã xem gần đây:{" "}
                {recentError instanceof Error ? recentError.message : "Đã có lỗi xảy ra."}
              </span>
            </div>
          )}

          {/* Empty */}
          {!isLoadingRecent && !isErrorRecent && (!recentSeries || recentSeries.length === 0) && (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 py-10 px-4 text-center">
              <Clock className="h-9 w-9 text-slate-300 stroke-[1.5]" />
              <p className="mt-2 text-sm font-semibold text-slate-700">
                Tài khoản này chưa có lịch sử xem series gần đây
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Vui lòng chọn tài khoản khác từ danh sách dropdown ở trên.
              </p>
            </div>
          )}

          {/* Cards List */}
          {!isLoadingRecent && !isErrorRecent && recentSeries && recentSeries.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {recentSeries.map((card, idx) => {
                const isSelectedForSimilar = targetSimilarSeries?.seriesId === card.seriesId;

                return (
                  <div key={card.seriesId || idx} className="flex flex-col space-y-2">
                    <ChannelCardItem card={card} onSelect={onSelectCard} />

                    {/* Action Button: Gợi ý tương tự */}
                    <button
                      type="button"
                      onClick={() => setTargetSimilarSeries(card)}
                      className={`flex w-full items-center justify-center gap-1.5 rounded-xl py-2 px-3 text-xs font-bold transition-all ${
                        isSelectedForSimilar
                          ? "bg-amber-500 text-white shadow-md shadow-amber-200 ring-2 ring-amber-400"
                          : "bg-violet-50 text-violet-700 border border-violet-200 hover:bg-violet-600 hover:text-white"
                      }`}
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      <span>{isSelectedForSimilar ? "Đang xem tương tự" : "Xem series tương tự"}</span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 3. Similar Series Recommendation Section (Triggered by clicking "Xem series tương tự") */}
      {targetSimilarSeries && (
        <div className="rounded-2xl border-2 border-amber-300 bg-gradient-to-b from-amber-50/40 to-white p-6 shadow-md animate-in fade-in">
          <div className="flex items-center justify-between border-b border-amber-200/80 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white font-bold shadow-md shadow-amber-200">
                <Sparkles className="h-5 w-5 fill-current" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900">
                    Danh Sách Series Tương Tự
                  </h3>
                  <span className="rounded-full bg-amber-100 px-3 py-0.5 text-xs font-bold text-amber-800 border border-amber-300">
                    Tương tự với: &quot;{targetSimilarSeries.title}&quot;
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setTargetSimilarSeries(null)}
                className="flex items-center gap-1 rounded-lg bg-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-300"
              >
                <X className="h-4 w-4" />
                <span>Đóng</span>
              </button>
            </div>
          </div>

          {/* Similar Series Content */}
          <div className="mt-5">
            {/* Loading */}
            {isLoadingSimilar && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, idx) => (
                  <div
                    key={idx}
                    className="animate-pulse rounded-xl border border-slate-100 bg-slate-50 p-4 space-y-3"
                  >
                    <div className="aspect-[16/9] w-full rounded-lg bg-slate-200" />
                    <div className="h-4 w-3/4 rounded bg-slate-200" />
                    <div className="h-3 w-1/2 rounded bg-slate-200" />
                  </div>
                ))}
              </div>
            )}

            {/* Error */}
            {isErrorSimilar && (
              <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700 text-xs">
                <AlertCircle className="h-5 w-5 shrink-0" />
                <span>
                  Không thể tải gợi ý series tương tự:{" "}
                  {similarError instanceof Error ? similarError.message : "Đã có lỗi xảy ra."}
                </span>
              </div>
            )}

            {/* Empty */}
            {!isLoadingSimilar && !isErrorSimilar && (!similarSeries || similarSeries.length === 0) && (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-amber-200 bg-amber-50/50 py-10 px-4 text-center">
                <Sparkles className="h-9 w-9 text-amber-400 stroke-[1.5]" />
                <p className="mt-2 text-sm font-semibold text-slate-700">
                  Không tìm thấy series tương tự nào cho nội dung này
                </p>
              </div>
            )}

            {/* Cards List */}
            {!isLoadingSimilar && !isErrorSimilar && similarSeries && similarSeries.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {similarSeries.map((card, idx) => (
                  <ChannelCardItem
                    key={card.seriesId || idx}
                    card={card}
                    onSelect={onSelectCard}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. Already Watched Pool Section (GET /api/v1/recommendations/pools/already-watched) */}
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50/30 p-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-emerald-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white font-bold shadow-md shadow-emerald-200">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">
                  Already Watched Pool (Danh Sách Series Đã Xem Trong Pool)
                </h3>
                <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800 border border-emerald-200">
                  {watchedPoolSeries?.length ?? 0} series
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Danh sách toàn bộ các Series thuộc Already Watched Pool của người dùng
              </p>
            </div>
          </div>

        </div>

        {/* Already Watched Pool Grid */}
        <div className="mt-5">
          {/* Loading */}
          {isLoadingWatchedPool && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, idx) => (
                <div
                  key={idx}
                  className="animate-pulse rounded-xl border border-slate-100 bg-slate-50 p-4 space-y-3"
                >
                  <div className="aspect-[16/9] w-full rounded-lg bg-slate-200" />
                  <div className="h-4 w-3/4 rounded bg-slate-200" />
                  <div className="h-3 w-1/2 rounded bg-slate-200" />
                </div>
              ))}
            </div>
          )}

          {/* Error */}
          {isErrorWatchedPool && (
            <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700 text-xs">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <span>
                Không thể tải Already Watched Pool:{" "}
                {watchedPoolError instanceof Error ? watchedPoolError.message : "Đã có lỗi xảy ra."}
              </span>
            </div>
          )}

          {/* Empty */}
          {!isLoadingWatchedPool && !isErrorWatchedPool && (!watchedPoolSeries || watchedPoolSeries.length === 0) && (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-emerald-200 bg-emerald-50/50 py-10 px-4 text-center">
              <Eye className="h-9 w-9 text-emerald-300 stroke-[1.5]" />
              <p className="mt-2 text-sm font-semibold text-slate-700">
                Tài khoản này chưa có dữ liệu trong Already Watched Pool
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Vui lòng chọn tài khoản khác hoặc kiểm tra lại tiến trình ghi nhận lượt xem.
              </p>
            </div>
          )}

          {/* Cards List */}
          {!isLoadingWatchedPool && !isErrorWatchedPool && watchedPoolSeries && watchedPoolSeries.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {watchedPoolSeries.map((card, idx) => (
                <ChannelCardItem
                  key={card.seriesId || idx}
                  card={card}
                  onSelect={onSelectCard}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 5. Recommendation Pool & AI Score Ranking Section (GET /api/v1/recommendations/pools/recommendation) */}
      <div className="rounded-2xl border-2 border-indigo-200 bg-gradient-to-b from-indigo-50/40 via-white to-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-indigo-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white font-bold shadow-md shadow-indigo-200">
              <Cpu className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">
                  Recommendation Pool Demo (AI Score Ranking)
                </h3>
                <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-bold text-indigo-700 border border-indigo-200">
                  {poolItems?.length ?? 0} series
                </span>
                <span className="rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-bold text-violet-700">
                  Demo AI Engine
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Danh sách Series kèm Điểm số AI Score trong Recommendation Pool
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* View Mode Toggle: Grid vs Table */}
            <div className="flex items-center rounded-xl bg-slate-100 p-1 border border-slate-200 text-xs font-medium">
              <button
                type="button"
                onClick={() => setPoolViewMode("grid")}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition-all ${
                  poolViewMode === "grid"
                    ? "bg-white font-bold text-indigo-600 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <LayoutGrid className="h-3.5 w-3.5" />
                <span>Thẻ Cards</span>
              </button>
              <button
                type="button"
                onClick={() => setPoolViewMode("table")}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition-all ${
                  poolViewMode === "table"
                    ? "bg-white font-bold text-indigo-600 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <ListFilter className="h-3.5 w-3.5" />
                <span>Bảng Leaderboard</span>
              </button>
            </div>
          </div>
        </div>

        {/* Content Area for Recommendation Pool */}
        <div className="mt-5">
          {/* Loading */}
          {isLoadingPool && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, idx) => (
                <div
                  key={idx}
                  className="animate-pulse rounded-xl border border-slate-100 bg-slate-50 p-4 space-y-3"
                >
                  <div className="aspect-[16/9] w-full rounded-lg bg-slate-200" />
                  <div className="h-4 w-3/4 rounded bg-slate-200" />
                  <div className="h-3 w-1/2 rounded bg-slate-200" />
                </div>
              ))}
            </div>
          )}

          {/* Error */}
          {isErrorPool && (
            <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700 text-xs">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <span>
                Không thể tải Recommendation Pool:{" "}
                {poolError instanceof Error ? poolError.message : "Đã có lỗi xảy ra."}
              </span>
            </div>
          )}

          {/* Empty */}
          {!isLoadingPool && !isErrorPool && (!poolItems || poolItems.length === 0) && (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-indigo-200 bg-indigo-50/50 py-10 px-4 text-center">
              <Cpu className="h-9 w-9 text-indigo-300 stroke-[1.5]" />
              <p className="mt-2 text-sm font-semibold text-slate-700">
                Chưa có dữ liệu Recommendation Pool cho tài khoản này
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Vui lòng kiểm tra lại tiến trình tạo Pool hoặc chọn tài khoản người dùng khác.
              </p>
            </div>
          )}

          {/* 5A. GRID VIEW MODE WITH AI SCORE BADGES */}
          {!isLoadingPool && !isErrorPool && poolItems && poolItems.length > 0 && poolViewMode === "grid" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {poolItems.map((item, idx) => {
                const card = item.seriesCard || (item as unknown as ChannelSeriesCard);
                const scoreVal = item.score ?? "0";
                const rankNum = idx + 1;

                return (
                  <ChannelCardItem
                    key={card.seriesId || idx}
                    card={card}
                    score={scoreVal}
                    rank={rankNum}
                    onSelect={onSelectCard}
                  />
                );
              })}
            </div>
          )}

          {/* 5B. LEADERBOARD TABLE VIEW MODE */}
          {!isLoadingPool && !isErrorPool && poolItems && poolItems.length > 0 && poolViewMode === "table" && (
            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 font-bold text-slate-700">
                    <th className="py-3 px-4 w-16 text-center">Hạng</th>
                    <th className="py-3 px-4 min-w-[240px]">Series & Creator</th>
                    <th className="py-3 px-4 w-28">Loại</th>
                    <th className="py-3 px-4 w-44">Điểm AI (Score)</th>
                    <th className="py-3 px-4 w-28 text-right">Lượt xem</th>
                    <th className="py-3 px-4 w-28 text-right">Đánh giá</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {poolItems.map((item, idx) => {
                    const card = item.seriesCard || (item as unknown as ChannelSeriesCard);
                    const scoreVal = item.score ?? "0";
                    const percentage = getScorePercentage(scoreVal);
                    const isVideo = card.contentType?.toUpperCase() === "VIDEO";

                    return (
                      <tr
                        key={card.seriesId || idx}
                        onClick={() => onSelectCard?.(card)}
                        className="hover:bg-violet-50/50 transition-colors cursor-pointer"
                      >
                        {/* Rank */}
                        <td className="py-3.5 px-4 text-center">
                          <span
                            className={`inline-flex h-6 w-6 items-center justify-center rounded-full font-black text-xs ${
                              idx === 0
                                ? "bg-amber-400 text-amber-950"
                                : idx === 1
                                ? "bg-slate-300 text-slate-800"
                                : idx === 2
                                ? "bg-amber-700 text-amber-50"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {idx + 1}
                          </span>
                        </td>

                        {/* Series & Creator */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="relative h-10 w-16 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                              {card.coverUrl || card.bannerUrl ? (
                                <Image
                                  src={card.coverUrl || card.bannerUrl}
                                  alt={card.title}
                                  fill
                                  className="object-cover"
                                  unoptimized
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center bg-slate-200 text-slate-400">
                                  <Film className="h-5 w-5" />
                                </div>
                              )}
                            </div>
                            <div>
                              <span className="font-bold text-slate-900 block line-clamp-1">
                                {card.title}
                              </span>
                              <span className="text-[11px] text-slate-500 block">
                                By {card.creatorName}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Type */}
                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-700">
                            {isVideo ? <Film className="h-3 w-3 text-sky-500" /> : <BookOpen className="h-3 w-3 text-amber-500" />}
                            {card.contentType}
                          </span>
                        </td>

                        {/* AI Score Bar */}
                        <td className="py-3.5 px-4">
                          {formatScore(scoreVal) === "Kênh Khác" ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-800 border border-emerald-200">
                              Kênh Khác
                            </span>
                          ) : (
                            <div className="space-y-1">
                              <div className="flex items-center justify-between text-xs font-bold text-indigo-700">
                                <span>{formatScore(scoreVal)}</span>
                                <span className="text-[10px] text-slate-400 font-medium">
                                  ({percentage}%)
                                </span>
                              </div>
                              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                                <div
                                  className="h-full bg-gradient-to-r from-violet-500 to-indigo-600 rounded-full transition-all duration-500"
                                  style={{ width: `${Math.max(percentage, 5)}%` }}
                                />
                              </div>
                            </div>
                          )}
                        </td>

                        {/* Total Views */}
                        <td className="py-3.5 px-4 text-right font-medium text-slate-700">
                          {(card.totalViews ?? 0).toLocaleString()}
                        </td>

                        {/* Rating */}
                        <td className="py-3.5 px-4 text-right">
                          <span className="inline-flex items-center gap-1 font-bold text-amber-600">
                            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                            {card.averageRating != null ? Number(card.averageRating).toFixed(1) : "0.0"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
