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
  ChevronLeft,
  ChevronRight,
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
  Activity,
} from "lucide-react";
import Image from "next/image";

import { MongoUserFeaturesView } from "./mongo-user-features-view";
import { SeriesFeatureModal } from "./series-feature-modal";

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

  // Selected Series ID for Series Feature Modal (GET /api/v1/series-features/{seriesId})
  const [selectedFeatureSeriesId, setSelectedFeatureSeriesId] =
    useState<string | null>(null);

  // View Mode for Recommendation Pool Demo: "grid" vs "table"
  const [poolViewMode, setPoolViewMode] = useState<"grid" | "table">("grid");

  // Pagination State for Already Watched Pool (4 series per page)
  const [watchedPoolPage, setWatchedPoolPage] = useState<number>(1);

  // Pagination State for Recommendation Pool Grid Cards (8 series per page)
  const [poolGridPage, setPoolGridPage] = useState<number>(1);

  // Auto select first account once accounts load & reset pagination
  useEffect(() => {
    if (accounts && accounts.length > 0 && !selectedAccountId) {
      setSelectedAccountId(accounts[0].accountId);
    }
  }, [accounts, selectedAccountId]);

  useEffect(() => {
    setWatchedPoolPage(1);
    setPoolGridPage(1);
  }, [selectedAccountId]);

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
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.04]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-start gap-4 sm:gap-6">
          <div className="flex items-center gap-3 shrink-0">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-700 font-bold border border-violet-200 backoffice-dark:border-violet-800/40 backoffice-dark:bg-violet-950/40 backoffice-dark:text-violet-300">
              <User className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 backoffice-dark:text-white">
                Chọn Tài Khoản Người Dùng
              </h3>
            </div>
          </div>

          {/* Account Dropdown Inline (Same Row, Left Side) */}
          <div className="relative min-w-[280px] sm:w-96">
            {isLoadingAccounts ? (
              <div className="h-10 w-full animate-pulse rounded-xl bg-slate-100 backoffice-dark:bg-white/10" />
            ) : (
              <div className="relative">
                <select
                  id="account-dropdown"
                  value={selectedAccountId}
                  onChange={(e) => {
                    setSelectedAccountId(e.target.value);
                    setTargetSimilarSeries(null); // reset similar view when account changes
                  }}
                  className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-3.5 pr-10 text-xs font-bold text-slate-800 transition-all focus:border-violet-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-violet-500 cursor-pointer backoffice-dark:border-white/10 backoffice-dark:bg-slate-900 backoffice-dark:text-white"
                >
                  {accounts?.map((acc) => (
                    <option key={acc.accountId} value={acc.accountId}>
                      {acc.email} — {acc.fullName || acc.username}
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
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-violet-50/60 p-3.5 border border-violet-100/80 backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.03]">
            <div className="flex items-center gap-3">
              <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-violet-200 border border-violet-300 backoffice-dark:border-violet-800 backoffice-dark:bg-violet-900/50">
                {currentAccount.avatarUrl ? (
                  <Image
                    src={currentAccount.avatarUrl}
                    alt={currentAccount.fullName || "User"}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center font-bold text-violet-700 text-sm backoffice-dark:text-violet-300">
                    {(currentAccount.fullName || currentAccount.email).charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-slate-900 backoffice-dark:text-white">
                    {currentAccount.fullName || currentAccount.username}
                  </span>
                  <span className="rounded bg-violet-200 px-1.5 py-0.5 text-[10px] font-bold text-violet-800 backoffice-dark:bg-violet-900/50 backoffice-dark:text-violet-300">
                    {currentAccount.roleName}
                  </span>
                  <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800 backoffice-dark:bg-emerald-950/50 backoffice-dark:text-emerald-300">
                    {currentAccount.status}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-600 backoffice-dark:text-white/70 mt-0.5">
                  <span className="flex items-center gap-1">
                    <Mail className="h-3 w-3 text-slate-400" />
                    {currentAccount.email}
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
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.04]">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 backoffice-dark:border-white/10">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-sky-700 font-bold border border-sky-200 backoffice-dark:border-sky-800/40 backoffice-dark:bg-sky-950/40 backoffice-dark:text-sky-300">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 backoffice-dark:text-white">
                  Series Đã Xem Gần Đây
                </h3>
                <span className="rounded-full bg-sky-100 px-2.5 py-0.5 text-xs font-bold text-sky-700 backoffice-dark:bg-sky-950/50 backoffice-dark:text-sky-300">
                  {recentSeries?.length ?? 0} series
                </span>
              </div>
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
                  className="animate-pulse rounded-xl border border-slate-100 bg-slate-50 p-4 space-y-3 backoffice-dark:border-white/10 backoffice-dark:bg-white/5"
                >
                  <div className="aspect-[16/9] w-full rounded-lg bg-slate-200 backoffice-dark:bg-white/10" />
                  <div className="h-4 w-3/4 rounded bg-slate-200 backoffice-dark:bg-white/10" />
                  <div className="h-3 w-1/2 rounded bg-slate-200 backoffice-dark:bg-white/10" />
                </div>
              ))}
            </div>
          )}

          {/* Error */}
          {isErrorRecent && (
            <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700 text-xs backoffice-dark:border-red-900/40 backoffice-dark:bg-red-950/40 backoffice-dark:text-red-300">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <span>
                Không thể tải danh sách series đã xem gần đây:{" "}
                {recentError instanceof Error ? recentError.message : "Đã có lỗi xảy ra."}
              </span>
            </div>
          )}

          {/* Empty */}
          {!isLoadingRecent && !isErrorRecent && (!recentSeries || recentSeries.length === 0) && (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 py-10 px-4 text-center backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.02]">
              <Clock className="h-9 w-9 text-slate-300 stroke-[1.5] backoffice-dark:text-white/20" />
              <p className="mt-2 text-sm font-semibold text-slate-700 backoffice-dark:text-white">
                Tài khoản này chưa có lịch sử xem series gần đây
              </p>
              <p className="mt-1 text-xs text-slate-500 backoffice-dark:text-white/60">
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
                    <ChannelCardItem card={card} onSelect={(c) => setSelectedFeatureSeriesId(c.seriesId)} />

                    {/* Action Buttons: Gợi ý tương tự & Xem Đặc Trưng AI */}
                    <div className="grid grid-cols-2 gap-1.5 pt-1">
                      <button
                        type="button"
                        onClick={() => setTargetSimilarSeries(card)}
                        className={`flex items-center justify-center gap-1 rounded-xl py-2 px-2 text-[11px] font-bold transition-all cursor-pointer ${isSelectedForSimilar
                          ? "bg-amber-500 text-white shadow-sm"
                          : "bg-violet-50 text-violet-700 border border-violet-200 hover:bg-violet-600 hover:text-white backoffice-dark:border-violet-800/40 backoffice-dark:bg-violet-950/40 backoffice-dark:text-violet-300 backoffice-dark:hover:bg-violet-600 backoffice-dark:hover:text-white"
                          }`}
                        title="Xem các series tương tự nội dung này"
                      >
                        <Sparkles className="h-3 w-3 shrink-0" />
                        <span className="truncate">{isSelectedForSimilar ? "Đang xem" : "Tương tự"}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedFeatureSeriesId(card.seriesId)}
                        className="flex items-center justify-center gap-1 rounded-xl py-2 px-2 text-[11px] font-bold bg-sky-50 text-sky-700 border border-sky-200 hover:bg-sky-600 hover:text-white transition-all cursor-pointer backoffice-dark:border-sky-800/40 backoffice-dark:bg-sky-950/40 backoffice-dark:text-sky-300 backoffice-dark:hover:bg-sky-600 backoffice-dark:hover:text-white"
                        title="Xem toàn bộ vector đặc trưng và chỉ số tương tác (Series Feature)"
                      >
                        <Activity className="h-3 w-3 shrink-0" />
                        <span className="truncate">Xem chi tiết</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 3. Similar Series Recommendation Section (Triggered by clicking "Xem series tương tự") */}
      {targetSimilarSeries && (
        <div className="rounded-2xl border-2 border-amber-300 bg-gradient-to-b from-amber-50/40 to-white p-6 shadow-md animate-in fade-in backoffice-dark:border-amber-500/30 backoffice-dark:bg-white/[0.03] backoffice-dark:from-transparent backoffice-dark:to-transparent">
          <div className="flex items-center justify-between border-b border-amber-200/80 pb-4 backoffice-dark:border-white/10">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white font-bold shadow-md shadow-amber-200">
                <Sparkles className="h-5 w-5 fill-current" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900 backoffice-dark:text-white">
                    Danh Sách Series Tương Tự
                  </h3>
                  <span className="rounded-full bg-amber-100 px-3 py-0.5 text-xs font-bold text-amber-800 border border-amber-300 backoffice-dark:bg-amber-950/50 backoffice-dark:text-amber-300 backoffice-dark:border-amber-800">
                    &quot;{targetSimilarSeries.title}&quot;
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setTargetSimilarSeries(null)}
                className="flex items-center gap-1 rounded-lg bg-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-300 backoffice-dark:bg-white/10 backoffice-dark:text-white/80 backoffice-dark:hover:bg-white/20"
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
                    className="animate-pulse rounded-xl border border-slate-100 bg-slate-50 p-4 space-y-3 backoffice-dark:border-white/10 backoffice-dark:bg-white/5"
                  >
                    <div className="aspect-[16/9] w-full rounded-lg bg-slate-200 backoffice-dark:bg-white/10" />
                    <div className="h-4 w-3/4 rounded bg-slate-200 backoffice-dark:bg-white/10" />
                    <div className="h-3 w-1/2 rounded bg-slate-200 backoffice-dark:bg-white/10" />
                  </div>
                ))}
              </div>
            )}

            {/* Error */}
            {isErrorSimilar && (
              <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700 text-xs backoffice-dark:border-red-900/40 backoffice-dark:bg-red-950/40 backoffice-dark:text-red-300">
                <AlertCircle className="h-5 w-5 shrink-0" />
                <span>
                  Không thể tải gợi ý series tương tự:{" "}
                  {similarError instanceof Error ? similarError.message : "Đã có lỗi xảy ra."}
                </span>
              </div>
            )}

            {/* Empty */}
            {!isLoadingSimilar && !isErrorSimilar && (!similarSeries || similarSeries.length === 0) && (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-amber-200 bg-amber-50/50 py-10 px-4 text-center backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.02]">
                <Sparkles className="h-9 w-9 text-amber-400 stroke-[1.5]" />
                <p className="mt-2 text-sm font-semibold text-slate-700 backoffice-dark:text-white">
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
                    onSelect={(c) => setSelectedFeatureSeriesId(c.seriesId)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. Already Watched Pool Section (GET /api/v1/recommendations/pools/already-watched) */}
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50/30 p-6 shadow-sm backoffice-dark:border-emerald-500/20 backoffice-dark:bg-white/[0.03]">
        <div className="flex items-center justify-between border-b border-emerald-100 pb-4 backoffice-dark:border-white/10">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white font-bold shadow-md shadow-emerald-200">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 backoffice-dark:text-white">
                  Danh Sách Series Đã Xem Hôm Nay
                </h3>
                <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800 border border-emerald-200 backoffice-dark:bg-emerald-950/50 backoffice-dark:text-emerald-300 backoffice-dark:border-emerald-800">
                  {watchedPoolSeries?.length ?? 0} series
                </span>
              </div>
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
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-emerald-200 bg-emerald-50/50 py-10 px-4 text-center backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.02]">
              <Eye className="h-9 w-9 text-emerald-300 stroke-[1.5] backoffice-dark:text-white/20" />
              <p className="mt-2 text-sm font-semibold text-slate-700 backoffice-dark:text-white">
                Tài khoản này chưa có dữ liệu trong Already Watched Pool
              </p>
              <p className="mt-1 text-xs text-slate-500 backoffice-dark:text-white/60">
                Vui lòng chọn tài khoản khác hoặc kiểm tra lại tiến trình ghi nhận lượt xem.
              </p>
            </div>
          )}

          {/* Cards List with Pagination */}
          {!isLoadingWatchedPool && !isErrorWatchedPool && watchedPoolSeries && watchedPoolSeries.length > 0 && (() => {
            const WATCHED_POOL_PAGE_SIZE = 4;
            const totalWatchedPoolPages = Math.ceil(watchedPoolSeries.length / WATCHED_POOL_PAGE_SIZE) || 1;
            const paginatedWatchedPoolSeries = watchedPoolSeries.slice(
              (watchedPoolPage - 1) * WATCHED_POOL_PAGE_SIZE,
              watchedPoolPage * WATCHED_POOL_PAGE_SIZE
            );

            return (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {paginatedWatchedPoolSeries.map((card, idx) => (
                    <ChannelCardItem
                      key={card.seriesId || idx}
                      card={card}
                      onSelect={(c) => setSelectedFeatureSeriesId(c.seriesId)}
                    />
                  ))}
                </div>

                {/* Pagination Controls */}
                {totalWatchedPoolPages > 1 && (
                  <div className="flex items-center justify-between border-t border-emerald-100 pt-3 text-xs backoffice-dark:border-white/10">
                    <span className="text-slate-500 font-medium backoffice-dark:text-white/60">
                      Hiển thị {((watchedPoolPage - 1) * WATCHED_POOL_PAGE_SIZE) + 1} - {Math.min(watchedPoolPage * WATCHED_POOL_PAGE_SIZE, watchedPoolSeries.length)} trên {watchedPoolSeries.length} series
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        disabled={watchedPoolPage <= 1}
                        onClick={() => setWatchedPoolPage((prev) => Math.max(1, prev - 1))}
                        className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer backoffice-dark:border-white/10 backoffice-dark:bg-slate-800 backoffice-dark:text-white backoffice-dark:hover:bg-slate-700"
                      >
                        <ChevronLeft className="h-4 w-4" />
                        <span>Trước</span>
                      </button>

                      <span className="px-2 font-bold text-slate-800 backoffice-dark:text-white">
                        {watchedPoolPage} / {totalWatchedPoolPages}
                      </span>

                      <button
                        type="button"
                        disabled={watchedPoolPage >= totalWatchedPoolPages}
                        onClick={() => setWatchedPoolPage((prev) => Math.min(totalWatchedPoolPages, prev + 1))}
                        className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer backoffice-dark:border-white/10 backoffice-dark:bg-slate-800 backoffice-dark:text-white backoffice-dark:hover:bg-slate-700"
                      >
                        <span>Sau</span>
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      </div>

      {/* 5. Recommendation Pool & AI Score Ranking Section (GET /api/v1/recommendations/pools/recommendation) */}
      <div className="rounded-2xl border-2 border-indigo-200 bg-gradient-to-b from-indigo-50/40 via-white to-white p-6 shadow-sm backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.03] backoffice-dark:from-transparent backoffice-dark:via-transparent backoffice-dark:to-transparent">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-indigo-100 pb-4 backoffice-dark:border-white/10">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white font-bold shadow-md shadow-indigo-200">
              <Cpu className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 backoffice-dark:text-white">
                  Kênh Đề Xuất
                </h3>
                <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-bold text-indigo-700 border border-indigo-200 backoffice-dark:bg-indigo-950/50 backoffice-dark:text-indigo-300 backoffice-dark:border-indigo-800">
                  {poolItems?.length ?? 0} series
                </span>
              </div>
            </div>
          </div>

          {/* <div className="flex items-center gap-3">
            <div className="flex items-center rounded-xl bg-slate-100 p-1 border border-slate-200 text-xs font-medium backoffice-dark:border-white/10 backoffice-dark:bg-white/5">
              <button
                type="button"
                onClick={() => setPoolViewMode("grid")}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition-all cursor-pointer ${poolViewMode === "grid"
                  ? "bg-white font-bold text-indigo-600 shadow-sm backoffice-dark:bg-white/10 backoffice-dark:text-indigo-300"
                  : "text-slate-600 hover:text-slate-900 backoffice-dark:text-white/60 backoffice-dark:hover:text-white"
                  }`}
              >
                <LayoutGrid className="h-3.5 w-3.5" />
                <span>Thẻ Cards</span>
              </button>
              <button
                type="button"
                onClick={() => setPoolViewMode("table")}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition-all cursor-pointer ${poolViewMode === "table"
                  ? "bg-white font-bold text-indigo-600 shadow-sm backoffice-dark:bg-white/10 backoffice-dark:text-indigo-300"
                  : "text-slate-600 hover:text-slate-900 backoffice-dark:text-white/60 backoffice-dark:hover:text-white"
                  }`}
              >
                <ListFilter className="h-3.5 w-3.5" />
                <span>Bảng Leaderboard</span>
              </button>
            </div>
          </div> */}
        </div>

        {/* Content Area for Recommendation Pool */}
        <div className="mt-5">
          {/* Loading */}
          {isLoadingPool && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, idx) => (
                <div
                  key={idx}
                  className="animate-pulse rounded-xl border border-slate-100 bg-slate-50 p-4 space-y-3 backoffice-dark:border-white/10 backoffice-dark:bg-white/5"
                >
                  <div className="aspect-[16/9] w-full rounded-lg bg-slate-200 backoffice-dark:bg-white/10" />
                  <div className="h-4 w-3/4 rounded bg-slate-200 backoffice-dark:bg-white/10" />
                  <div className="h-3 w-1/2 rounded bg-slate-200 backoffice-dark:bg-white/10" />
                </div>
              ))}
            </div>
          )}

          {/* Error */}
          {isErrorPool && (
            <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700 text-xs backoffice-dark:border-red-900/40 backoffice-dark:bg-red-950/40 backoffice-dark:text-red-300">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <span>
                Không thể tải Kênh Đề Xuất:{" "}
                {poolError instanceof Error ? poolError.message : "Đã có lỗi xảy ra."}
              </span>
            </div>
          )}

          {/* Empty */}
          {!isLoadingPool && !isErrorPool && (!poolItems || poolItems.length === 0) && (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-indigo-200 bg-indigo-50/50 py-10 px-4 text-center backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.02]">
              <Cpu className="h-9 w-9 text-indigo-300 stroke-[1.5] backoffice-dark:text-white/20" />
              <p className="mt-2 text-sm font-semibold text-slate-700 backoffice-dark:text-white">
                Chưa có dữ liệu Kênh Đề Xuất cho tài khoản này
              </p>
              <p className="mt-1 text-xs text-slate-500 backoffice-dark:text-white/60">
                Vui lòng kiểm tra lại tiến trình tạo Kênh Đề Xuất hoặc chọn tài khoản người dùng khác.
              </p>
            </div>
          )}

          {/* 5A. GRID VIEW MODE WITH AI SCORE BADGES */}
          {!isLoadingPool && !isErrorPool && poolItems && poolItems.length > 0 && poolViewMode === "grid" && (() => {
            const POOL_GRID_PAGE_SIZE = 8;
            const totalPoolGridPages = Math.ceil(poolItems.length / POOL_GRID_PAGE_SIZE) || 1;
            const paginatedPoolGridItems = poolItems.slice(
              (poolGridPage - 1) * POOL_GRID_PAGE_SIZE,
              poolGridPage * POOL_GRID_PAGE_SIZE
            );

            return (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {paginatedPoolGridItems.map((item, idx) => {
                    const card = item.seriesCard || (item as unknown as ChannelSeriesCard);
                    const scoreVal = item.score ?? "0";
                    const rankNum = (poolGridPage - 1) * POOL_GRID_PAGE_SIZE + idx + 1;

                    return (
                      <ChannelCardItem
                        key={card.seriesId || idx}
                        card={card}
                        score={scoreVal}
                        rank={rankNum}
                        onSelect={(c) => setSelectedFeatureSeriesId(c.seriesId)}
                      />
                    );
                  })}
                </div>

                {/* Pagination Controls for Pool Grid Cards */}
                {totalPoolGridPages > 1 && (
                  <div className="flex items-center justify-between border-t border-indigo-100 pt-3 text-xs backoffice-dark:border-white/10">
                    <span className="text-slate-500 font-medium backoffice-dark:text-white/60">
                      Hiển thị {((poolGridPage - 1) * POOL_GRID_PAGE_SIZE) + 1} - {Math.min(poolGridPage * POOL_GRID_PAGE_SIZE, poolItems.length)} trên {poolItems.length} series
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        disabled={poolGridPage <= 1}
                        onClick={() => setPoolGridPage((prev) => Math.max(1, prev - 1))}
                        className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer backoffice-dark:border-white/10 backoffice-dark:bg-slate-800 backoffice-dark:text-white backoffice-dark:hover:bg-slate-700"
                      >
                        <ChevronLeft className="h-4 w-4" />
                        <span>Trước</span>
                      </button>

                      <span className="px-2 font-bold text-slate-800 backoffice-dark:text-white">
                        {poolGridPage} / {totalPoolGridPages}
                      </span>

                      <button
                        type="button"
                        disabled={poolGridPage >= totalPoolGridPages}
                        onClick={() => setPoolGridPage((prev) => Math.min(totalPoolGridPages, prev + 1))}
                        className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer backoffice-dark:border-white/10 backoffice-dark:bg-slate-800 backoffice-dark:text-white backoffice-dark:hover:bg-slate-700"
                      >
                        <span>Sau</span>
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

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
                        onClick={() => setSelectedFeatureSeriesId(card.seriesId)}
                        className="hover:bg-violet-50/50 transition-colors cursor-pointer"
                      >
                        {/* Rank */}
                        <td className="py-3.5 px-4 text-center">
                          <span
                            className={`inline-flex h-6 w-6 items-center justify-center rounded-full font-black text-xs ${idx === 0
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

      {/* Series Feature Modal (GET /api/v1/series-features/{seriesId}) */}
      {selectedFeatureSeriesId && (
        <SeriesFeatureModal
          seriesId={selectedFeatureSeriesId}
          onClose={() => setSelectedFeatureSeriesId(null)}
        />
      )}
    </div>
  );
}
