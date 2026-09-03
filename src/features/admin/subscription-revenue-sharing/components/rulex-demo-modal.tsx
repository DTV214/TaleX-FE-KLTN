"use client";

import { useQueries } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  Calculator,
  ChevronRight,
  Database,
  Film,
  Layers,
  Loader2,
  RefreshCw,
  User,
  Users,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { getAccountByCreatorId, getAccountById } from "@/features/admin/api/account.api";
import { getEpisodeById } from "@/features/creator-dashboard/api/creator-content-api";
import { getApiErrorMessage } from "@/shared/api/http-client";
import { cn } from "@/shared/utils/utils";
import {
  useCalculateRuleX,
  useExportRequestData,
} from "../hooks/use-subscription-revenue-sharing";
import type {
  MonthYearParams,
  RuleXCalculationRequestDto,
  RuleXCalculationResponseDto,
} from "../types/subscription-revenue-sharing.types";

function formatVND(value?: number | null) {
  return new Intl.NumberFormat("vi-VN", {
    currency: "VND",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(value ?? 0);
}

function formatPercent(value?: number | null) {
  return `${new Intl.NumberFormat("vi-VN", {
    maximumFractionDigits: 4,
  }).format((value ?? 0) * 100)}%`;
}

function formatNumber(value?: number | null) {
  return new Intl.NumberFormat("vi-VN", {
    maximumFractionDigits: 6,
  }).format(value ?? 0);
}

type RuleXDemoModalProps = {
  isOpen: boolean;
  monthYear: string;
  onClose: () => void;
};

export function RuleXDemoModal({
  isOpen,
  monthYear,
  onClose,
}: RuleXDemoModalProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<"response" | "allocations" | "request">("response");

  const exportQuery = useExportRequestData(monthYear, isOpen);

  const requestList = useMemo<RuleXCalculationRequestDto[]>(() => {
    if (!exportQuery.data) return [];
    return Array.isArray(exportQuery.data)
      ? exportQuery.data
      : [exportQuery.data as RuleXCalculationRequestDto];
  }, [exportQuery.data]);

  const selectedRequest = requestList[selectedIndex] ?? null;

  const calculateRuleXMutation = useCalculateRuleX();
  const [calculationResult, setCalculationResult] =
    useState<RuleXCalculationResponseDto | null>(null);

  // Run calculation when selected request changes
  useEffect(() => {
    if (!selectedRequest) {
      setCalculationResult(null);
      return;
    }

    void calculateRuleXMutation
      .mutateAsync(selectedRequest)
      .then((data) => {
        setCalculationResult(data);
      })
      .catch((error) => {
        toast.error(getApiErrorMessage(error));
        setCalculationResult(null);
      });
  }, [selectedRequest]);

  // Extract all IDs from selected request & response to resolve names via API
  const { userIds, creatorIds, episodeIds } = useMemo(() => {
    const userSet = new Set<string>();
    const creatorSet = new Set<string>();
    const episodeSet = new Set<string>();

    if (selectedRequest) {
      for (const user of selectedRequest.users || []) {
        if (user.userId) userSet.add(user.userId);
        if (user.artistEpisodeStreams) {
          for (const [artistId, epStreams] of Object.entries(
            user.artistEpisodeStreams,
          )) {
            if (artistId) creatorSet.add(artistId);
            if (epStreams) {
              for (const epId of Object.keys(epStreams)) {
                if (epId) episodeSet.add(epId);
              }
            }
          }
        }
      }
    }

    if (calculationResult) {
      for (const artistId of Object.keys(calculationResult.artistPayouts || {})) {
        if (artistId) creatorSet.add(artistId);
      }
      for (const epId of Object.keys(calculationResult.episodePayouts || {})) {
        if (epId) episodeSet.add(epId);
      }
      for (const allocation of calculationResult.userAllocations || []) {
        if (allocation.userId) userSet.add(allocation.userId);
        for (const artistId of Object.keys(allocation.artistPayouts || {})) {
          if (artistId) creatorSet.add(artistId);
        }
        for (const [artistId, epPayouts] of Object.entries(
          allocation.episodePayouts || {},
        )) {
          if (artistId) creatorSet.add(artistId);
          if (epPayouts) {
            for (const epId of Object.keys(epPayouts)) {
              if (epId) episodeSet.add(epId);
            }
          }
        }
      }
    }

    return {
      userIds: Array.from(userSet),
      creatorIds: Array.from(creatorSet),
      episodeIds: Array.from(episodeSet),
    };
  }, [selectedRequest, calculationResult]);

  // Queries for User accounts (/api/v1/admin/accounts/{accountId})
  const userQueries = useQueries({
    queries: userIds.map((id) => ({
      queryKey: ["admin", "account-by-id", id],
      queryFn: () => getAccountById(id),
      enabled: Boolean(id) && isOpen,
      staleTime: 10 * 60 * 1000,
    })),
  });

  // Queries for Creator accounts (/api/v1/admin/accounts/creator/{creatorId})
  const creatorQueries = useQueries({
    queries: creatorIds.map((id) => ({
      queryKey: ["admin", "subscription-revenue-sharing", "creator", id],
      queryFn: () => getAccountByCreatorId(id),
      enabled: Boolean(id) && isOpen,
      staleTime: 10 * 60 * 1000,
    })),
  });

  // Queries for Episodes (/api/v1/episodes/{id})
  const episodeQueries = useQueries({
    queries: episodeIds.map((id) => ({
      queryKey: ["admin", "subscription-revenue-sharing", "episode", id],
      queryFn: () => getEpisodeById(id),
      enabled: Boolean(id) && isOpen,
      staleTime: 10 * 60 * 1000,
    })),
  });

  const userMap = useMemo(() => {
    return Object.fromEntries(
      userIds.flatMap((id, idx) => {
        const item = userQueries[idx]?.data;
        return item ? [[id, item]] : [];
      }),
    );
  }, [userIds, userQueries]);

  const creatorMap = useMemo(() => {
    return Object.fromEntries(
      creatorIds.flatMap((id, idx) => {
        const item = creatorQueries[idx]?.data;
        return item ? [[id, item]] : [];
      }),
    );
  }, [creatorIds, creatorQueries]);

  const episodeMap = useMemo(() => {
    return Object.fromEntries(
      episodeIds.flatMap((id, idx) => {
        const item = episodeQueries[idx]?.data;
        return item ? [[id, item]] : [];
      }),
    );
  }, [episodeIds, episodeQueries]);

  if (!isOpen) return null;

  function getUserName(id: string) {
    const acc = userMap[id];
    if (!acc) return id;
    return `${acc.fullName} (${acc.username || acc.email})`;
  }

  function getCreatorName(id: string) {
    const acc = creatorMap[id];
    if (!acc) return id;
    return `${acc.fullName} (${acc.email || acc.username})`;
  }

  function getEpisodeInfo(id: string) {
    const ep = episodeMap[id];
    if (!ep) return { title: id, seriesTitle: "" };
    return {
      title: ep.title || (ep.episodeNumber != null ? `Tập ${ep.episodeNumber}` : id),
      seriesTitle: ep.seriesTitle || "",
    };
  }

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="flex max-h-[94vh] w-full max-w-6xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl backoffice-dark:border-white/10 backoffice-dark:bg-[#111113]"
        onClick={(event) => event.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 bg-slate-50/70 p-5 backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-indigo-200 bg-indigo-50 text-indigo-600 backoffice-dark:border-indigo-400/25 backoffice-dark:bg-indigo-500/10 backoffice-dark:text-indigo-300">
              <Calculator className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-950 backoffice-dark:text-white">
                Chi Tiết Tính Toán
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 backoffice-dark:hover:bg-white/10 backoffice-dark:hover:text-white"
            aria-label="Đóng"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="min-h-0 flex-1 overflow-y-auto p-6 space-y-6">
          {/* Request Selection Bar */}
          {exportQuery.isLoading ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 py-8 text-center text-sm font-bold text-slate-500 backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.03]">
              <Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin text-indigo-500" />
              Đang xuất dữ liệu request từ hệ thống...
            </div>
          ) : exportQuery.isError ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm font-bold text-red-700 backoffice-dark:border-red-400/20 backoffice-dark:bg-red-400/10 backoffice-dark:text-red-200">
              Không thể xuất dữ liệu request cho tháng đã chọn.
            </div>
          ) : requestList.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center text-sm font-bold text-slate-400 backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.02]">
              Không có dữ liệu request nào được tìm thấy.
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-slate-400">
                  Chọn mẫu Dữ liệu ({requestList.length} nhóm):
                </span>
              </div>

              <div className="flex flex-wrap gap-3">
                {requestList.map((req, index) => {
                  const isSelected = index === selectedIndex;
                  return (
                    <button
                      key={`req-${index}`}
                      type="button"
                      onClick={() => setSelectedIndex(index)}
                      className={cn(
                        "flex items-center gap-3 rounded-2xl border px-4 py-3 text-left transition",
                        isSelected
                          ? "border-indigo-500 bg-indigo-50/80 shadow-sm backoffice-dark:border-indigo-400 backoffice-dark:bg-indigo-500/20"
                          : "border-slate-200 bg-white hover:bg-slate-50 backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.04] backoffice-dark:hover:bg-white/[0.08]",
                      )}
                    >
                      <span
                        className={cn(
                          "flex h-8 w-8 items-center justify-center rounded-xl text-xs font-black",
                          isSelected
                            ? "bg-indigo-600 text-white"
                            : "bg-slate-100 text-slate-600 backoffice-dark:bg-white/10 backoffice-dark:text-white/70",
                        )}
                      >
                        0{index + 1}
                      </span>
                      <div>
                        <p className="text-xs font-black uppercase tracking-wide text-slate-950 backoffice-dark:text-white">
                          request_0{index + 1}
                        </p>
                        <p className="mt-0.5 text-xs font-semibold text-slate-500 backoffice-dark:text-white/60">
                          Giá gói: {formatVND(req.subscriptionFee)} · {req.users?.length || 0} users
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Navigation Tabs */}
              <div className="flex border-b border-slate-200 backoffice-dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setActiveTab("response")}
                  className={cn(
                    "flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-black transition",
                    activeTab === "response"
                      ? "border-indigo-600 text-indigo-600 backoffice-dark:border-indigo-400 backoffice-dark:text-indigo-400"
                      : "border-transparent text-slate-500 hover:text-slate-700 backoffice-dark:text-white/45 backoffice-dark:hover:text-white/70",
                  )}
                >
                  <Activity className="h-4 w-4" />
                  Kết Quả Tính Toán Chung
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("allocations")}
                  className={cn(
                    "flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-black transition",
                    activeTab === "allocations"
                      ? "border-indigo-600 text-indigo-600 backoffice-dark:border-indigo-400 backoffice-dark:text-indigo-400"
                      : "border-transparent text-slate-500 hover:text-slate-700 backoffice-dark:text-white/45 backoffice-dark:hover:text-white/70",
                  )}
                >
                  <Users className="h-4 w-4" />
                  Phân Bổ Theo Nhà Sáng Tạo ({calculationResult?.userAllocations?.length || 0})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("request")}
                  className={cn(
                    "flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-black transition",
                    activeTab === "request"
                      ? "border-indigo-600 text-indigo-600 backoffice-dark:border-indigo-400 backoffice-dark:text-indigo-400"
                      : "border-transparent text-slate-500 hover:text-slate-700 backoffice-dark:text-white/45 backoffice-dark:hover:text-white/70",
                  )}
                >
                  <Database className="h-4 w-4" />
                  Phân Bổ Theo Người Mua
                </button>
              </div>

              {/* Tab 1: Response */}
              {activeTab === "response" && (
                <div className="space-y-6">
                  {calculateRuleXMutation.isPending ? (
                    <div className="rounded-2xl border border-slate-200 bg-white py-12 text-center text-sm font-bold text-slate-500 backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.03]">
                      <Loader2 className="mx-auto mb-2 h-6 w-6 animate-spin text-indigo-500" />
                      Đang tính toán RuleX với request_0{selectedIndex + 1}...
                    </div>
                  ) : calculationResult ? (
                    <>
                      {/* Metric Summary */}
                      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.04]">
                          <p className="text-xs font-black uppercase tracking-wider text-slate-400">
                            Tiền / Lượt Xem
                          </p>
                          <p className="mt-1 text-xl font-black text-slate-950 backoffice-dark:text-white">
                            {formatVND(calculationResult.gamma * selectedRequest.subscriptionFee)}
                          </p>
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.04]">
                          <p className="text-xs font-black uppercase tracking-wider text-slate-400">
                            Tổng ngân sách
                          </p>
                          <p className="mt-1 text-xl font-black text-slate-950 backoffice-dark:text-white">
                            {formatVND(calculationResult.totalBudget)}
                          </p>
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.04]">
                          <p className="text-xs font-black uppercase tracking-wider text-slate-400">
                            Ngân sách mục tiêu
                          </p>
                          <p className="mt-1 text-xl font-black text-slate-950 backoffice-dark:text-white">
                            {formatVND(calculationResult.targetBudget)}
                          </p>
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.04]">
                          <p className="text-xs font-black uppercase tracking-wider text-slate-400">
                            Ngân sách đã tính
                          </p>
                          <p className="mt-1 text-xl font-black text-indigo-600 backoffice-dark:text-indigo-300">
                            {formatVND(calculationResult.calculatedBudget)}
                          </p>
                        </div>
                      </div>

                      {/* Artist Payouts */}
                      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.04]">
                        <h3 className="mb-4 text-sm font-black uppercase tracking-wider text-slate-950 backoffice-dark:text-white">
                          Doanh thu chia cho Nhà Sáng Tạo
                        </h3>
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-sm">
                            <thead className="border-b border-slate-200 bg-slate-50 text-xs font-black uppercase tracking-wider text-slate-500 backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.04] backoffice-dark:text-white/45">
                              <tr>
                                <th className="px-4 py-3">Tên Nhà Sáng Tạo</th>
                                <th className="px-4 py-3 text-right">Doanh Thu Chia</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 backoffice-dark:divide-white/10">
                              {Object.entries(
                                calculationResult.artistPayouts || {},
                              ).map(([artistId, amount]) => (
                                <tr key={artistId}>
                                  <td className="px-4 py-3">
                                    <p className="font-bold text-slate-900 backoffice-dark:text-white">
                                      {getCreatorName(artistId)}
                                    </p>
                                    <p className="font-mono text-xs text-slate-400">
                                      {artistId}
                                    </p>
                                  </td>
                                  <td className="px-4 py-3 text-right font-black text-emerald-600">
                                    {formatVND(amount)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Episode Payouts */}
                      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.04]">
                        <h3 className="mb-4 text-sm font-black uppercase tracking-wider text-slate-950 backoffice-dark:text-white">
                          Doanh thu chia theo Tập
                        </h3>
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-sm">
                            <thead className="border-b border-slate-200 bg-slate-50 text-xs font-black uppercase tracking-wider text-slate-500 backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.04] backoffice-dark:text-white/45">
                              <tr>
                                <th className="px-4 py-3">Tập Truyện</th>
                                <th className="px-4 py-3 text-right">Doanh Thu Chia</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 backoffice-dark:divide-white/10">
                              {Object.entries(
                                calculationResult.episodePayouts || {},
                              ).map(([epId, amount]) => {
                                const epInfo = getEpisodeInfo(epId);
                                return (
                                  <tr key={epId}>
                                    <td className="px-4 py-3">
                                      <p className="font-bold text-slate-900 backoffice-dark:text-white">
                                        {epInfo.title}
                                      </p>
                                      {epInfo.seriesTitle && (
                                        <p className="text-xs text-slate-500 backoffice-dark:text-white/60">
                                          Series: {epInfo.seriesTitle}
                                        </p>
                                      )}
                                      <p className="font-mono text-xs text-slate-400">
                                        {epId}
                                      </p>
                                    </td>
                                    <td className="px-4 py-3 text-right font-black text-emerald-600">
                                      {formatVND(amount)}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </>
                  ) : null}
                </div>
              )}

              {/* Tab 2: Allocations */}
              {activeTab === "allocations" && calculationResult && (
                <div className="space-y-4">
                  {calculationResult.userAllocations?.map((allocation, index) => (
                    <div
                      key={allocation.userId || index}
                      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4 backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.04]"
                    >
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-3 backoffice-dark:border-white/10">
                        <div>
                          <p className="text-sm font-black text-slate-950 backoffice-dark:text-white">
                            {getUserName(allocation.userId)}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2 text-xs">
                          <span className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1 font-bold text-slate-700 backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.04] backoffice-dark:text-white/80">
                            Tổng lượt xem: {allocation.totalStreams}
                          </span>
                          <span className="rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-1 font-black text-indigo-700 backoffice-dark:border-indigo-400/20 backoffice-dark:bg-indigo-500/10 backoffice-dark:text-indigo-300">
                            Số tiền phân bổ: {formatVND(allocation.allocatedAmount)}
                          </span>
                        </div>
                      </div>

                      <div className="grid gap-3 text-xs sm:grid-cols-2">
                        <div>
                          <span className="text-slate-400 font-semibold">Số Tiền Chia Sẻ: </span>
                          <span className="font-mono font-bold text-slate-800 backoffice-dark:text-white">
                            {formatVND(allocation.effectiveWeight * selectedRequest.subscriptionFee)}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 font-semibold">Số Tiền Mỗi Lượt Xem Chung: </span>
                          <span className="font-mono font-bold text-slate-800 backoffice-dark:text-white">
                            {formatVND(allocation.perStreamWeight * selectedRequest.subscriptionFee)}
                          </span>
                        </div>
                      </div>

                      {/* User's Artist Payout Breakdown */}
                      {allocation.artistPayouts &&
                        Object.keys(allocation.artistPayouts).length > 0 && (
                          <div>
                            <p className="mb-2 text-xs font-black uppercase tracking-wider text-slate-400">
                              Phân bổ tiền theo Nhà Sáng Tạo
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {Object.entries(allocation.artistPayouts).map(
                                ([artistId, amount]) => (
                                  <div
                                    key={artistId}
                                    className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.03]"
                                  >
                                    <span className="font-bold text-slate-900 backoffice-dark:text-white">
                                      {getCreatorName(artistId)}:{" "}
                                    </span>
                                    <span className="font-black text-emerald-600">
                                      {formatVND(amount)}
                                    </span>
                                  </div>
                                ),
                              )}
                            </div>
                          </div>
                        )}

                      {/* User's Episode Payout Breakdown */}
                      {allocation.episodePayouts &&
                        Object.keys(allocation.episodePayouts).length > 0 && (
                          <div>
                            <p className="mb-2 text-xs font-black uppercase tracking-wider text-slate-400">
                              Phân bổ tiền theo Tập
                            </p>
                            <div className="space-y-2">
                              {Object.entries(allocation.episodePayouts).map(
                                ([artistId, epMap]) => (
                                  <div
                                    key={artistId}
                                    className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.02]"
                                  >
                                    <p className="mb-1 font-bold text-slate-700 backoffice-dark:text-white/80">
                                      Nhà Sáng Tạo: {getCreatorName(artistId)}
                                    </p>
                                    <div className="grid gap-1.5 sm:grid-cols-2">
                                      {Object.entries(epMap).map(
                                        ([epId, amount]) => {
                                          const epInfo = getEpisodeInfo(epId);
                                          return (
                                            <div
                                              key={epId}
                                              className="flex items-center justify-between gap-2 rounded-lg border border-slate-200/60 bg-white px-2.5 py-1.5 backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.04]"
                                            >
                                              <span className="truncate font-medium text-slate-900 backoffice-dark:text-white">
                                                {epInfo.title}
                                              </span>
                                              <span className="font-black text-emerald-600">
                                                {formatVND(amount)}
                                              </span>
                                            </div>
                                          );
                                        },
                                      )}
                                    </div>
                                  </div>
                                ),
                              )}
                            </div>
                          </div>
                        )}
                    </div>
                  ))}
                </div>
              )}

              {/* Tab 3: Request */}
              {activeTab === "request" && selectedRequest && (
                <div className="space-y-6">
                  {/* Request Parameters Card */}
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.04]">
                      <p className="text-xs font-black uppercase tracking-wider text-slate-400">
                        Phí Nền Tảng Cơ Bản
                      </p>
                      <p className="mt-1 text-xl font-black text-slate-950 backoffice-dark:text-white">
                        {formatPercent(selectedRequest.alpha)}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.04]">
                      <p className="text-xs font-black uppercase tracking-wider text-slate-400">
                        Giá mỗi gói
                      </p>
                      <p className="mt-1 text-xl font-black text-slate-950 backoffice-dark:text-white">
                        {formatVND(selectedRequest.subscriptionFee)}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.04]">
                      <p className="text-xs font-black uppercase tracking-wider text-slate-400">
                        Số lượng Người Mua
                      </p>
                      <p className="mt-1 text-xl font-black text-slate-950 backoffice-dark:text-white">
                        {selectedRequest.users?.length || 0}
                      </p>
                    </div>
                  </div>

                  {/* Users Streams List */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-black uppercase tracking-wider text-slate-950 backoffice-dark:text-white">
                      Danh sách Người Mua & Lượt xem Tập
                    </h3>
                    {selectedRequest.users?.map((user, uIndex) => (
                      <div
                        key={user.userId || uIndex}
                        className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4 backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.04]"
                      >
                        <div className="border-b border-slate-100 pb-3 backoffice-dark:border-white/10">
                          <p className="text-sm font-black text-slate-950 backoffice-dark:text-white">
                            Người Mua: {getUserName(user.userId)}
                          </p>
                        </div>

                        <div className="space-y-3">
                          {Object.entries(user.artistEpisodeStreams || {}).map(
                            ([artistId, epStreams]) => (
                              <div
                                key={artistId}
                                className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.03]"
                              >
                                <p className="mb-2 font-black text-slate-900 backoffice-dark:text-white">
                                  Nhà Sáng Tạo: {getCreatorName(artistId)}{" "}

                                </p>
                                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                                  {Object.entries(epStreams || {}).map(
                                    ([epId, count]) => {
                                      const epInfo = getEpisodeInfo(epId);
                                      return (
                                        <div
                                          key={epId}
                                          className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white p-2.5 shadow-2xs backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.04]"
                                        >
                                          <div className="min-w-0 flex-1">
                                            <p className="truncate font-bold text-slate-900 backoffice-dark:text-white">
                                              {epInfo.title}
                                            </p>
                                            <p className="truncate font-mono text-[10px] text-slate-400">
                                              {epInfo.seriesTitle}
                                            </p>
                                          </div>
                                          <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-black text-indigo-700 backoffice-dark:bg-indigo-500/10 backoffice-dark:text-indigo-300">
                                            {count} views
                                          </span>
                                        </div>
                                      );
                                    },
                                  )}
                                </div>
                              </div>
                            ),
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
