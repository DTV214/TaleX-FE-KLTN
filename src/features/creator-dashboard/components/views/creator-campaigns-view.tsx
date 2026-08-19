"use client";

import { useMemo, useState } from "react";
import {
  Activity,
  ArrowDownLeft,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  BookOpen,
  Bookmark,
  Calendar,
  CalendarClock,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Coins,
  Copy,
  Eye,
  Film,
  Filter,
  Hash,
  ImageIcon,
  Loader2,
  Megaphone,
  MoreHorizontal,
  Pause,
  Play,
  Plus,
  Receipt,
  RefreshCw,
  Rocket,
  Search,
  Sparkles,
  Target,
  ThumbsUp,
  TrendingUp,
  WalletCards,
  Building2,
  Landmark,
  Trash2,
  X,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { CreatorCampaignPlanList } from "./creator-campaign-plan-list";
import { CreatorCampaignCheckoutModal } from "./creator-campaign-checkout-modal";
import type { CreatorCampaignService } from "@/features/creator-dashboard/types/creator-campaigns.types";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useQueries } from "@tanstack/react-query";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Progress } from "@/shared/ui/progress";
import { cn } from "@/shared/utils/utils";
import { parseBackendDate } from "@/shared/utils/backend-date";
import { getApiErrorMessage } from "@/shared/api/http-client";
import { toast } from "sonner";
import { useOrderStatus } from "@/features/payment/api/payment.api";
import {
  useGetCreatorCampaignPlans,
  useGetCreatorCampaignSeriesByCampaignId,
  useGetCreatorCampaignSeriesLogs,
  useGetCreatorOwnCampaigns,
  useUpdateCampaignSeriesStatus,
  useGetCampaignWalletBalance,
  useGetCampaignWalletHistory,
  useGetTransactionsByReference,
  useGetOrderWalletTransactions,
  useCreatePayoutRequest,
  useGetPayoutRequests,
  useGetOwnPayoutRequests,
  useGetPayoutRequestTransactions,
  useCancelCreatorCampaign,
} from "@/features/creator-dashboard/hooks/use-creator-campaigns";
import type {
  CampaignWalletTransaction,
  ReferenceTransaction,
  PayoutRequest,
} from "@/features/creator-dashboard/types/creator-campaigns.types";
import type {
  CreatorCampaign,
  CreatorCampaignFilterFields,
  CreatorCampaignSeries,
  CreatorCampaignSeriesLog,
  CreatorCampaignSeriesLogParams,
  CreatorCampaignSortBy,
  CreatorCampaignStatus,
} from "@/features/creator-dashboard/types/creator-campaigns.types";
import {
  getPublicSeriesDetail,
  type PublicSeriesItem,
} from "@/features/series/api/series-api";

const PAGE_SIZE = 8;

const campaignStatuses: Array<{ value: CreatorCampaignStatus; label: string }> =
  [
    { value: "RUNNING", label: "Đang phân phối" },
    { value: "COMPLETED", label: "Hoàn tất" },
    { value: "PAUSED", label: "Tạm dừng" },
    { value: "CANCELLED", label: "Đã hủy" },
    { value: "UNAVAILABLE", label: "Không khả dụng" },
  ];

const sortOptions: Array<{ value: CreatorCampaignSortBy; label: string }> = [
  { value: "createdAt", label: "Ngày tạo" },
  { value: "startAt", label: "Ngày bắt đầu" },
  { value: "endAt", label: "Ngày kết thúc" },
  { value: "currentImpression", label: "Đã đạt" },
  { value: "targetImpression", label: "Mục tiêu" },
  { value: "updatedAt", label: "Cập nhật" },
];

function formatNumber(value?: number | null) {
  return new Intl.NumberFormat("vi-VN").format(value ?? 0);
}

function formatDateTime(value?: string | null) {
  if (!value) return "Chưa có";

  const parsed = parseBackendDate(value);
  if (Number.isNaN(parsed.getTime())) return "Chưa có";

  return new Intl.DateTimeFormat("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(parsed);
}

function getProgress(campaign?: CreatorCampaign | null) {
  const current = campaign?.currentImpression ?? 0;
  const target = campaign?.targetImpression ?? 0;

  if (target <= 0) return 0;
  return Math.min(100, Math.round((current / target) * 100));
}

function getRemaining(campaign?: CreatorCampaign | null) {
  const current = campaign?.currentImpression ?? 0;
  const target = campaign?.targetImpression ?? 0;

  return Math.max(target - current, 0);
}

function getStatusLabel(status?: string | null) {
  if (!status) return "Chưa rõ";
  if (status === "PAUSE" || status === "PAUSED") return "Tạm dừng";
  return (
    campaignStatuses.find((item) => item.value === status)?.label ?? status
  );
}

function getStatusClass(status?: string | null) {
  switch (status) {
    case "ACTIVE":
    case "RUNNING":
      return "border-emerald-400/35 bg-emerald-400/10 text-emerald-200";
    case "COMPLETED":
      return "border-cyan-300/35 bg-cyan-300/10 text-cyan-100";
    case "PENDING":
      return "border-[#D4AF37]/40 bg-[#D4AF37]/12 text-[#F5D46E]";
    case "PAUSED":
    case "PAUSE":
      return "border-orange-300/35 bg-orange-300/10 text-orange-100";
    case "CANCELLED":
    case "FAILED":
    case "UNAVAILABLE":
      return "border-red-300/35 bg-red-300/10 text-red-100";
    default:
      return "border-white/15 bg-white/[0.06] text-zinc-300";
  }
}

const getStatusBadge = getStatusClass;

function shortenId(value?: string | null) {
  if (!value) return "Chưa có";
  return value.length > 14
    ? `${value.slice(0, 8)}...${value.slice(-6)}`
    : value;
}

function formatAnalyticLabel(value: string) {
  return value
    .replace(/([A-Z])/g, " $1")
    .replace(/[_-]/g, " ")
    .trim()
    .replace(/^./, (char) => char.toUpperCase());
}

function getAnalyticNumber(campaign: CreatorCampaign | undefined, key: string) {
  const value = campaign?.analyticData?.[key];

  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
}

function getNumericAnalytics(campaign: CreatorCampaign | undefined) {
  return Object.entries(campaign?.analyticData ?? {})
    .map(([key, value]) => ({
      key,
      label: formatAnalyticLabel(key),
      value:
        typeof value === "number"
          ? value
          : typeof value === "string" && Number.isFinite(Number(value))
            ? Number(value)
            : null,
    }))
    .filter(
      (item): item is { key: string; label: string; value: number } =>
        item.value !== null,
    );
}

function getContentTypeLabel(contentType?: string | null) {
  return contentType?.toUpperCase() === "VIDEO" ? "Phim bộ" : "Truyện tranh";
}

function getSeriesArtwork(series?: PublicSeriesItem) {
  return series?.bannerUrl || series?.coverUrl || "";
}

function getCampaignSeriesMetric(item: CreatorCampaignSeries, key: string) {
  const value = item.analyticData?.[key];

  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
}

function toApiDateTime(value: Date) {
  const pad = (input: number) => String(input).padStart(2, "0");

  return (
    [value.getFullYear(), pad(value.getMonth() + 1), pad(value.getDate())].join(
      "-",
    ) + `T${pad(value.getHours())}:${pad(value.getMinutes())}:00`
  );
}

function startOfDay(value: Date) {
  const next = new Date(value);
  next.setHours(0, 0, 0, 0);
  return next;
}

function endOfDay(value: Date) {
  const next = new Date(value);
  next.setHours(23, 59, 59, 999);
  return next;
}

function isValidDate(value: Date) {
  return !Number.isNaN(value.getTime());
}

function toDateTimeInputValue(value?: string | null) {
  return value ? value.slice(0, 16) : "";
}

function fromDateTimeInputValue(value: string) {
  return value ? `${value}:00` : "";
}

function isValidLogRange(range: CreatorCampaignSeriesLogParams) {
  const start = parseBackendDate(range.startTime);
  const end = parseBackendDate(range.endTime);

  return isValidDate(start) && isValidDate(end) && start <= end;
}

function getCampaignSeriesLogRange(campaign: CreatorCampaign) {
  const now = new Date();
  const fallbackStart = new Date(now);
  fallbackStart.setDate(fallbackStart.getDate() - 30);

  const start = campaign.startAt
    ? parseBackendDate(campaign.startAt)
    : campaign.createdAt
      ? parseBackendDate(campaign.createdAt)
      : fallbackStart;
  const end = campaign.endAt ? parseBackendDate(campaign.endAt) : now;
  const normalizedStart = isValidDate(start)
    ? startOfDay(start)
    : startOfDay(fallbackStart);
  const normalizedEnd = campaign.endAt
    ? isValidDate(end)
      ? endOfDay(end)
      : endOfDay(now)
    : now;

  return {
    startTime: toApiDateTime(normalizedStart),
    endTime: toApiDateTime(isValidDate(normalizedEnd) ? normalizedEnd : now),
  };
}

function formatHourBucket(value?: string | null) {
  if (!value) return "";

  const parsed = parseBackendDate(value);
  if (Number.isNaN(parsed.getTime())) return value;

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(parsed);
}

function getCampaignSeriesLogMetric(
  log: CreatorCampaignSeriesLog,
  key: string,
) {
  const value = log.analyticData?.[key];

  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
}

function sumLogMetric(logs: CreatorCampaignSeriesLog[], key: string) {
  return logs.reduce(
    (sum, log) => sum + getCampaignSeriesLogMetric(log, key),
    0,
  );
}

function buildCampaignSeriesLogChartData(logs: CreatorCampaignSeriesLog[]) {
  return logs.map((log) => ({
    hour: formatHourBucket(log.hourBucket),
    impression: log.totalImpression ?? 0,
    views: getCampaignSeriesLogMetric(log, "views"),
    likes: getCampaignSeriesLogMetric(log, "likes"),
    comments: getCampaignSeriesLogMetric(log, "comments"),
    shares: getCampaignSeriesLogMetric(log, "shares"),
    bookmarks: getCampaignSeriesLogMetric(log, "bookmarks"),
    watchTime: getCampaignSeriesLogMetric(log, "watchTime"),
  }));
}

type CampaignSeriesDashboardRow = {
  campaignSeries: CreatorCampaignSeries;
  series?: PublicSeriesItem;
  isSeriesLoading: boolean;
  isSeriesError: boolean;
};

function CampaignSeriesStatusToggleButton({
  campaignSeriesId,
  currentStatus = "RUNNING",
  size = "default",
}: {
  campaignSeriesId: string;
  currentStatus?: string | null;
  size?: "default" | "sm";
}) {
  const updateStatusMutation = useUpdateCampaignSeriesStatus();
  const isRunning = currentStatus === "RUNNING";
  const isPaused = currentStatus === "PAUSED" || currentStatus === "PAUSE";
  const isUnavailable = currentStatus === "UNAVAILABLE";
  const isTerminal = currentStatus === "COMPLETED" || currentStatus === "CANCELLED" || currentStatus === "FAILED";

  const targetStatus: "RUNNING" | "PAUSED" = isRunning ? "PAUSED" : "RUNNING";

  const handleToggleStatus = (e: React.MouseEvent) => {
    e.stopPropagation();

    const actionText = targetStatus === "PAUSED" ? "tạm dừng" : "tiếp tục";
    updateStatusMutation.mutate(
      {
        campaignSeriesId,
        status: targetStatus,
      },
      {
        onSuccess: (data) => {
          toast.success(
            `Đã ${actionText} series trong chiến dịch! (Trạng thái mới: ${getStatusLabel(data.status ?? targetStatus)})`,
          );
        },
        onError: (err) => {
          toast.error(getApiErrorMessage(err));
        },
      },
    );
  };

  if (isUnavailable) {
    return (
      <Badge
        className={cn(
          "font-bold border-red-500/35 bg-red-500/10 text-red-200",
          size === "sm" ? "px-2.5 py-1 text-xs" : "px-3.5 py-1.5 text-xs"
        )}
      >
        Không khả dụng
      </Badge>
    );
  }

  if (isTerminal) {
    return (
      <Badge
        className={cn(
          "font-bold",
          getStatusClass(currentStatus),
          size === "sm" ? "px-2.5 py-1 text-xs" : "px-3.5 py-1.5 text-xs"
        )}
      >
        {getStatusLabel(currentStatus)}
      </Badge>
    );
  }

  return (
    <Button
      type="button"
      variant="outline"
      disabled={updateStatusMutation.isPending}
      onClick={handleToggleStatus}
      className={cn(
        "cursor-pointer font-bold transition-all duration-200 backdrop-blur",
        size === "sm"
          ? "h-8 rounded-xl px-3 text-xs"
          : "h-11 rounded-2xl px-4 text-sm",
        isRunning
          ? "border-orange-500/40 bg-orange-500/15 text-orange-200 hover:border-orange-400 hover:bg-orange-500/25"
          : "border-emerald-500/40 bg-emerald-500/15 text-emerald-200 hover:border-emerald-400 hover:bg-emerald-500/25",
      )}
    >
      {updateStatusMutation.isPending ? (
        <>
          <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
          Đang xử lý...
        </>
      ) : isRunning ? (
        <>
          <Pause className="mr-1.5 h-4 w-4 text-orange-300" />
          Tạm dừng series #{campaignSeriesId.slice(0, 8)}
        </>
      ) : (
        <>
          <Play className="mr-1.5 h-4 w-4 text-emerald-300" />
          Tiếp tục series #{campaignSeriesId.slice(0, 8)}
        </>
      )}
    </Button>
  );
}

function CreatorCampaignCancelModal({
  isOpen,
  campaignId,
  onClose,
}: {
  isOpen: boolean;
  campaignId: string | null;
  onClose: () => void;
}) {
  const cancelMutation = useCancelCreatorCampaign();

  if (!isOpen || !campaignId) return null;

  const handleConfirmCancel = () => {
    cancelMutation.mutate(campaignId, {
      onSuccess: () => {
        toast.success(
          "Đã hủy chiến dịch thành công. Tiền hoàn lại (nếu có) sẽ được cập nhật vào Ví Campaign!",
        );
        onClose();
      },
      onError: (err) => {
        toast.error(getApiErrorMessage(err));
      },
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl border border-red-500/30 bg-[#121215] p-6 shadow-2xl">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-red-500/30 bg-red-500/10 text-red-400">
          <Trash2 className="h-6 w-6" />
        </div>

        <h3 className="mt-4 text-xl font-black text-white">
          Xác nhận hủy chiến dịch
        </h3>
        <p className="mt-2 text-xs font-semibold leading-relaxed text-zinc-400">
          Bạn có chắc chắn muốn hủy chiến dịch{" "}
          <span className="font-mono text-white">{campaignId}</span> không?
          Chiến dịch sẽ ngừng phân phối và số tiền hoàn lại (nếu có) sẽ được
          hoàn tự động về Ví Campaign của bạn.
        </p>

        <div className="mt-6 flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="flex-1 h-11 rounded-2xl border-white/10 bg-white/[0.04] text-xs font-bold text-zinc-300 hover:bg-white/10"
          >
            Bỏ qua
          </Button>
          <Button
            type="button"
            disabled={cancelMutation.isPending}
            onClick={handleConfirmCancel}
            className="flex-1 h-11 rounded-2xl bg-red-600 font-black text-xs text-white hover:bg-red-500"
          >
            {cancelMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="mr-2 h-4 w-4" />
            )}
            Xác nhận Hủy
          </Button>
        </div>
      </div>
    </div>
  );
}

function CampaignWalletHistorySection() {
  const [historyPage, setHistoryPage] = useState(1);
  const historyQuery = useGetCampaignWalletHistory({
    page: historyPage,
    pageSize: 5,
  });

  const transactions = historyQuery.data?.content ?? [];
  const totalPages = historyQuery.data?.totalPages ?? 1;

  function getTransactionBadge(type?: string | null) {
    switch (type) {
      case "REFUND":
        return "border-emerald-400/35 bg-emerald-400/10 text-emerald-300";
      case "DEPOSIT":
        return "border-cyan-400/35 bg-cyan-400/10 text-cyan-300";
      case "PAYMENT":
      case "WITHDRAW":
        return "border-orange-400/35 bg-orange-400/10 text-orange-300";
      default:
        return "border-white/15 bg-white/[0.06] text-zinc-300";
    }
  }

  function getTransactionLabel(type?: string | null) {
    switch (type) {
      case "REFUND":
        return "HOÀN TIỀN";
      case "DEPOSIT":
        return "NẠP TIỀN";
      case "PAYMENT":
        return "THANH TOÁN";
      case "WITHDRAW":
        return "RÚT TIỀN";
      default:
        return type ?? "GIAO DỊCH";
    }
  }

  return (
    <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5 md:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#D4AF37]/25 bg-[#D4AF37]/10 text-[#D4AF37]">
            <Receipt className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white">
              Lịch sử giao dịch ví
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={historyPage <= 1 || historyQuery.isLoading}
            onClick={() => setHistoryPage((p) => Math.max(1, p - 1))}
            className="h-9 border-white/10 bg-white/[0.04] px-3 text-xs font-bold text-zinc-200 hover:bg-white/10"
          >
            Trước
          </Button>
          <span className="text-xs font-bold text-zinc-400">
            Trang {historyPage} / {Math.max(totalPages, 1)}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={historyPage >= totalPages || historyQuery.isLoading}
            onClick={() => setHistoryPage((p) => p + 1)}
            className="h-9 border-white/10 bg-white/[0.04] px-3 text-xs font-bold text-zinc-200 hover:bg-white/10"
          >
            Sau
          </Button>
        </div>
      </div>

      <div className="mt-5">
        {historyQuery.isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 2 }).map((_, i) => (
              <div
                key={i}
                className="h-16 animate-pulse rounded-2xl border border-white/10 bg-white/[0.03]"
              />
            ))}
          </div>
        ) : transactions.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 bg-black/20 p-6 text-center text-xs font-semibold text-zinc-500">
            Chưa có lịch sử biến động số dư ví Campaign.
          </div>
        ) : (
          <div className="space-y-3">
            {transactions.map((tx) => {
              const isPositive = (tx.amount ?? 0) >= 0;

              return (
                <div
                  key={tx.transactionId}
                  className="flex flex-col gap-3 rounded-2xl border border-white/[0.08] bg-black/20 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div
                      className={cn(
                        "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border",
                        getTransactionBadge(tx.transactionType),
                      )}
                    >
                      {isPositive ? (
                        <ArrowDownLeft className="h-5 w-5" />
                      ) : (
                        <ArrowUpRight className="h-5 w-5" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge
                          variant="outline"
                          className={cn(
                            "px-2 py-0.5 text-[10px] font-bold",
                            getTransactionBadge(tx.transactionType),
                          )}
                        >
                          {getTransactionLabel(tx.transactionType)}
                        </Badge>
                        <span className="text-[11px] font-bold text-zinc-500">
                          {formatDateTime(tx.createdAt)}
                        </span>
                      </div>
                      <p className="mt-1 line-clamp-2 text-sm font-bold text-white">
                        {tx.description || "Giao dịch ví Campaign"}
                      </p>
                      {tx.referenceId ? (
                        <p className="mt-1 font-mono text-xs font-semibold text-zinc-500">
                          Ref ID: {shortenId(tx.referenceId)}
                        </p>
                      ) : null}
                    </div>
                  </div>

                  <div className="flex items-center justify-between shrink-0 sm:flex-col sm:items-end sm:justify-center">
                    <p
                      className={cn(
                        "text-lg font-black",
                        isPositive ? "text-emerald-400" : "text-orange-400",
                      )}
                    >
                      {isPositive ? "+" : ""}
                      {formatNumber(tx.amount)}đ
                    </p>
                    <p className="text-xs font-semibold text-zinc-400">
                      Số dư: {formatNumber(tx.balanceBefore)}đ ➔{" "}
                      <span className="font-bold text-white">
                        {formatNumber(tx.balanceAfter)}đ
                      </span>
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function CampaignOrderPollingCard({ orderId }: { orderId: string }) {
  const orderQuery = useOrderStatus(orderId);
  const refTxQuery = useGetTransactionsByReference("ORDER", orderId);
  const walletTxQuery = useGetOrderWalletTransactions(orderId);

  const order = orderQuery.data;
  const refTransactions = refTxQuery.data ?? [];
  const walletTransactions = walletTxQuery.data ?? [];

  function getOrderStatusBadge(status?: string | null) {
    switch (status) {
      case "COMPLETED":
        return "border-emerald-400/35 bg-emerald-400/10 text-emerald-300";
      case "AWAITING_PAYMENT":
        return "border-yellow-400/35 bg-yellow-400/10 text-yellow-300 animate-pulse";
      case "CANCELLED":
      case "OUT_OF_TIME":
        return "border-red-400/35 bg-red-400/10 text-red-300";
      default:
        return "border-white/15 bg-white/[0.06] text-zinc-300";
    }
  }

  function getOrderStatusLabel(status?: string | null) {
    switch (status) {
      case "COMPLETED":
        return "ĐÃ HOÀN TẤT";
      case "AWAITING_PAYMENT":
        return "ĐANG CHỜ THANH TOÁN (LIVE POLLING)";
      case "CANCELLED":
        return "ĐÃ HỦY";
      case "OUT_OF_TIME":
        return "HẾT GIỜ THANH TOÁN";
      default:
        return status ?? "CHƯA RÕ";
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-white/10 bg-white/[0.035] p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#D4AF37]/25 bg-[#D4AF37]/10 text-[#D4AF37]">
            <Hash className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-base font-black text-white">
                Trạng thái thanh toán
              </h4>
              {orderQuery.isFetching ? (
                <span className="flex items-center text-[10px] font-bold text-yellow-400">
                  <Loader2 className="mr-1 h-3 w-3 animate-spin" /> Đang cập
                  nhật...
                </span>
              ) : null}
            </div>
            <p className="text-xs font-mono font-semibold text-zinc-400">
              Mã đơn hàng: {orderId}
            </p>
          </div>
        </div>

        {order ? (
          <Badge
            variant="outline"
            className={cn(
              "px-3.5 py-1 text-xs font-black",
              getOrderStatusBadge(order.status),
            )}
          >
            {getOrderStatusLabel(order.status)}
          </Badge>
        ) : null}
      </div>

      {orderQuery.isLoading ? (
        <div className="mt-4 flex items-center gap-2 text-xs font-bold text-zinc-400">
          <Loader2 className="h-4 w-4 animate-spin text-[#D4AF37]" />
          Đang tải thông tin đơn hàng...
        </div>
      ) : order ? (
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 rounded-xl border border-white/[0.08] bg-black/30 p-4 text-xs font-semibold">
          <div>
            <p className="text-zinc-500 font-bold uppercase tracking-wider">
              Mã thanh toán
            </p>
            <p className="mt-1 font-mono text-sm font-black text-white">
              {order.paymentCode}
            </p>
          </div>
          <div>
            <p className="text-zinc-500 font-bold uppercase tracking-wider">
              Tổng tiền
            </p>
            <p className="mt-1 text-sm font-black text-[#F5D46E]">
              {formatNumber(order.totalAmount)}đ
            </p>
          </div>
          <div>
            <p className="text-zinc-500 font-bold uppercase tracking-wider">
              Khấu trừ Ví Campaign
            </p>
            <p className="mt-1 text-sm font-black text-emerald-400">
              {order.walletAmount
                ? `${formatNumber(order.walletAmount)}đ`
                : "0đ"}
            </p>
          </div>
          <div>
            <p className="text-zinc-500 font-bold uppercase tracking-wider">
              Hạn thanh toán
            </p>
            <p className="mt-1 text-xs font-bold text-zinc-300">
              {formatDateTime(order.expiresAt)}
            </p>
          </div>
        </div>
      ) : null}

      {/* Giao dịch trực tiếp & Ví Campaign */}
      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        {/* Giao dịch thanh toán SePay / Ngân hàng */}
        <div className="rounded-xl border border-white/10 bg-black/20 p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-zinc-300">
              Thanh toán trực tiếp qua ngân hàng / QR
            </p>
          </div>

          <div className="mt-3 space-y-2">
            {refTxQuery.isLoading ? (
              <div className="h-12 animate-pulse rounded-lg bg-white/5" />
            ) : refTransactions.length === 0 ? (
              <p className="text-xs text-zinc-500 font-semibold">
                Chưa có giao dịch thanh toán trực tiếp nào.
              </p>
            ) : (
              refTransactions.map((tx) => (
                <div
                  key={tx.transactionId}
                  className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-white/[0.03] p-2.5 text-xs font-semibold"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge className="border-emerald-400/30 bg-emerald-400/10 text-[10px] text-emerald-300">
                        {tx.status}
                      </Badge>
                      <span className="font-mono text-zinc-300">
                        {tx.paymentMethod}
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] text-zinc-500">
                      {formatDateTime(tx.createdAt)}
                    </p>
                  </div>
                  <p className="text-sm font-black text-emerald-400">
                    +{formatNumber(tx.paidAmount)}đ
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Giao dịch dùng ví Campaign của order */}
        <div className="rounded-xl border border-white/10 bg-black/20 p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-zinc-300">
              Khấu trừ từ Ví Campaign
            </p>
          </div>

          <div className="mt-3 space-y-2">
            {walletTxQuery.isLoading ? (
              <div className="h-12 animate-pulse rounded-lg bg-white/5" />
            ) : walletTransactions.length === 0 ? (
              <p className="text-xs text-zinc-500 font-semibold">
                Không có khấu trừ/hoàn tiền từ ví cho đơn hàng này.
              </p>
            ) : (
              walletTransactions.map((tx) => (
                <div
                  key={tx.transactionId}
                  className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-white/[0.03] p-2.5 text-xs font-semibold"
                >
                  <div className="min-w-0 pr-2">
                    <div className="flex items-center gap-2">
                      <Badge className="border-yellow-400/30 bg-yellow-400/10 text-[10px] text-yellow-300">
                        {tx.transactionType}
                      </Badge>
                      <span className="text-[11px] text-zinc-500">
                        {formatDateTime(tx.createdAt)}
                      </span>
                    </div>
                    <p className="mt-1 line-clamp-1 text-[11px] text-zinc-300">
                      {tx.description}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-black text-yellow-300">
                      -{formatNumber(tx.amount)}đ
                    </p>
                    <p className="text-[10px] text-zinc-500">
                      Ví: {formatNumber(tx.balanceBefore)}đ ➔{" "}
                      {formatNumber(tx.balanceAfter)}đ
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function CampaignPayoutModal({
  open,
  balance,
  onOpenChange,
}: {
  open: boolean;
  balance: number;
  onOpenChange: (open: boolean) => void;
}) {
  const createPayoutMutation = useCreatePayoutRequest();
  const [createdPayout, setCreatedPayout] = useState<PayoutRequest | null>(
    null,
  );

  if (!open) return null;

  const canRequest = balance >= 2000;

  const handleSubmit = () => {
    if (!canRequest) return;

    createPayoutMutation.mutate(undefined, {
      onSuccess: (data) => {
        setCreatedPayout(data);
        toast.success("Gửi yêu cầu rút tiền thành công!");
      },
      onError: (err) => {
        toast.error(getApiErrorMessage(err));
      },
    });
  };

  const handleClose = () => {
    setCreatedPayout(null);
    onOpenChange(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md">
      <div className="relative w-full max-w-md overflow-hidden rounded-[28px] border border-white/10 bg-[#0d0d0f] p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#D4AF37]/30 bg-[#D4AF37]/10 text-[#D4AF37]">
              <Landmark className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white">
                Yêu cầu rút tiền Ví Campaign
              </h3>
              <p className="text-xs font-semibold text-zinc-500">
                API /api/v1/payout-requests
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-full p-1 text-zinc-400 hover:bg-white/10 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {createdPayout ? (
          <div className="mt-5 space-y-4">
            <div className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-4 text-center">
              <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-400" />
              <p className="mt-2 text-base font-black text-white">
                Đã gửi yêu cầu thành công!
              </p>
              <p className="mt-1 text-xs text-zinc-400">
                Yêu cầu rút toàn bộ số dư đang được Admin xử lý.
              </p>
            </div>

            <div className="space-y-2 rounded-2xl border border-white/10 bg-black/30 p-4 text-xs font-semibold">
              <div className="flex justify-between">
                <span className="text-zinc-500">Mã yêu cầu</span>
                <span className="font-mono font-bold text-white">
                  {shortenId(createdPayout.payoutRequestId)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Số tiền rút</span>
                <span className="font-black text-[#F5D46E]">
                  {formatNumber(createdPayout.amount)}đ
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Trạng thái</span>
                <Badge
                  variant="outline"
                  className="border-yellow-400/30 bg-yellow-400/10 text-[10px] text-yellow-300"
                >
                  {createdPayout.status}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Ngân hàng / Ví</span>
                <span className="font-bold text-white">
                  {createdPayout.bankName || "—"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Số tài khoản</span>
                <span className="font-mono text-zinc-300">
                  {createdPayout.bankAccountNumber || "—"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Tên chủ tài khoản</span>
                <span className="font-bold text-zinc-200">
                  {createdPayout.bankAccountName || "—"}
                </span>
              </div>
            </div>

            <Button
              type="button"
              className="w-full h-11 rounded-2xl bg-[#D4AF37] font-black text-black hover:bg-[#e6c75b]"
              onClick={handleClose}
            >
              Hoàn tất
            </Button>
          </div>
        ) : (
          <div className="mt-5 space-y-4">
            <div className="rounded-2xl border border-white/10 bg-black/30 p-4 text-center">
              <p className="text-xs font-bold text-zinc-400">
                Số dư khả dụng trong Ví Campaign
              </p>
              <p className="mt-2 text-3xl font-black text-[#F5D46E]">
                {formatNumber(balance)}đ
              </p>
              <p className="mt-2 text-[11px] font-semibold text-zinc-500">
                Yêu cầu rút tiền áp dụng cho toàn bộ số dư (tối thiểu 2.000đ) về
                Payment Profile chính đã đăng ký.
              </p>
            </div>

            {!canRequest ? (
              <div className="rounded-2xl border border-orange-400/30 bg-orange-500/10 p-3 text-center text-xs font-bold text-orange-300">
                Số dư chưa đạt điều kiện rút tối thiểu (Cần ít nhất 2.000đ).
              </div>
            ) : null}

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                className="flex-1 h-11 rounded-2xl border-white/10 bg-white/[0.04] font-bold text-zinc-300 hover:bg-white/10"
                onClick={handleClose}
              >
                Hủy
              </Button>
              <Button
                type="button"
                disabled={!canRequest || createPayoutMutation.isPending}
                className="flex-1 h-11 rounded-2xl bg-[#D4AF37] font-black text-black hover:bg-[#e6c75b] disabled:opacity-50"
                onClick={handleSubmit}
              >
                {createPayoutMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Landmark className="mr-2 h-4 w-4" />
                )}
                Gửi yêu cầu
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function PayoutRequestsListSection() {
  const [payoutPage, setPayoutPage] = useState(1);
  const payoutQuery = useGetOwnPayoutRequests({
    page: payoutPage,
    pageSize: 5,
  });

  const requests = payoutQuery.data?.content ?? [];
  const totalPages = payoutQuery.data?.totalPages ?? 1;

  return (
    <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5 md:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-yellow-400/25 bg-yellow-400/10 text-yellow-300">
            <Landmark className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white">
              Lịch sử Yêu cầu Rút tiền
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={payoutPage <= 1 || payoutQuery.isLoading}
            onClick={() => setPayoutPage((p) => Math.max(1, p - 1))}
            className="h-9 border-white/10 bg-white/[0.04] px-3 text-xs font-bold text-zinc-200 hover:bg-white/10"
          >
            Trước
          </Button>
          <span className="text-xs font-bold text-zinc-400">
            Trang {payoutPage} / {Math.max(totalPages, 1)}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={payoutPage >= totalPages || payoutQuery.isLoading}
            onClick={() => setPayoutPage((p) => p + 1)}
            className="h-9 border-white/10 bg-white/[0.04] px-3 text-xs font-bold text-zinc-200 hover:bg-white/10"
          >
            Sau
          </Button>
        </div>
      </div>

      <div className="mt-5">
        {payoutQuery.isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 2 }).map((_, i) => (
              <div
                key={i}
                className="h-16 animate-pulse rounded-2xl border border-white/10 bg-white/[0.03]"
              />
            ))}
          </div>
        ) : requests.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 bg-black/20 p-6 text-center text-xs font-semibold text-zinc-500">
            Bạn chưa gửi yêu cầu rút tiền nào.
          </div>
        ) : (
          <div className="space-y-3">
            {requests.map((item: PayoutRequest) => {
              const isPaid =
                item.status === "PAID" || item.status === "APPROVED";
              const isRejected = item.status === "REJECTED";

              return (
                <div
                  key={item.payoutRequestId}
                  className="flex flex-col gap-3 rounded-2xl border border-white/[0.08] bg-black/20 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge
                        variant="outline"
                        className={`px-2 py-0.5 text-[10px] font-bold ${
                          isPaid
                            ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
                            : isRejected
                              ? "border-red-400/30 bg-red-400/10 text-red-300"
                              : "border-yellow-400/30 bg-yellow-400/10 text-yellow-300"
                        }`}
                      >
                        {item.status}
                      </Badge>
                      <span className="font-mono text-[11px] font-bold text-zinc-400">
                        ID: {shortenId(item.payoutRequestId)}
                      </span>
                      {item.createdAt ? (
                        <span className="text-[11px] font-bold text-zinc-500">
                          {formatDateTime(item.createdAt)}
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 text-sm font-bold text-white">
                      {item.bankName || "—"} - {item.bankAccountNumber || "—"} (
                      {item.bankAccountName || "—"})
                    </p>
                    {item.adminNote ? (
                      <p className="mt-1 text-xs font-semibold text-zinc-400">
                        Ghi chú Admin:{" "}
                        <span className="text-zinc-200">{item.adminNote}</span>
                      </p>
                    ) : null}
                  </div>

                  <div className="text-right shrink-0">
                    <p className="text-lg font-black text-[#F5D46E]">
                      {formatNumber(item.amount)}đ
                    </p>
                    <p className="text-xs font-bold text-zinc-400">
                      Toàn bộ số dư ví
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function CampaignStatCard({
  icon: Icon,
  label,
  value,
  tone = "neutral",
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  tone?: "neutral" | "gold" | "green";
}) {
  return (
    <div
      className={cn(
        "rounded-xl border px-3.5 py-2 text-center transition-all min-w-[90px] sm:min-w-[100px]",
        tone === "gold" && "border-[#D4AF37]/30 bg-[#D4AF37]/10",
        tone === "green" && "border-emerald-500/25 bg-emerald-500/10",
        tone === "neutral" && "border-white/10 bg-white/[0.035]",
      )}
    >
      <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">{label}</p>
      <p
        className={cn(
          "mt-0.5 text-base sm:text-lg font-black",
          tone === "gold" ? "text-[#F5D46E]" : tone === "green" ? "text-emerald-400" : "text-white"
        )}
      >
        {value}
      </p>
    </div>
  );
}

function CampaignCard({
  campaign,
  serviceName,
  onSelect,
}: {
  campaign: CreatorCampaign;
  serviceName: string;
  onSelect: () => void;
}) {
  const progress = getProgress(campaign);

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.035] p-4 transition-colors duration-200 hover:border-[#D4AF37]/25 hover:bg-white/[0.06]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#D4AF37]/40 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />

      <div className="grid gap-4 lg:grid-cols-[minmax(260px,1.25fr)_minmax(190px,0.9fr)_minmax(220px,1fr)_auto] lg:items-center">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              className={getStatusClass(campaign.status)}
              variant="outline"
            >
              {getStatusLabel(campaign.status)}
            </Badge>
          </div>
          <h3 className="mt-3 truncate text-lg font-black text-white">
            Chiến dịch {shortenId(campaign.campaignId)}
          </h3>
          <p className="mt-2 flex min-w-0 items-center gap-2 text-sm font-semibold text-zinc-500">
            <WalletCards className="h-4 w-4 shrink-0 text-[#D4AF37]" />
            <span className="truncate">{serviceName}</span>
          </p>
        </div>

        <div className="rounded-2xl border border-white/[0.08] bg-black/20 p-4">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-zinc-500">
            Mục tiêu
          </p>
          <p className="mt-1 text-lg font-black text-zinc-100">
            {formatNumber(campaign.targetImpression)}
          </p>
          <p className="mt-1 text-xs font-semibold text-zinc-600">
            Đã đạt {formatNumber(campaign.currentImpression)}
          </p>
        </div>

        <div className="rounded-2xl border border-white/[0.08] bg-black/20 p-4">
          <div className="mb-2 flex items-center justify-between text-xs font-bold uppercase tracking-[0.14em]">
            <span className="text-zinc-500">Tiến độ</span>
            <span className="text-[#F5D46E]">{progress}%</span>
          </div>
          <Progress value={progress} />
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs font-semibold text-zinc-500">
            <span>Bắt đầu: {formatDateTime(campaign.startAt)}</span>
            <span>Kết thúc: {formatDateTime(campaign.endAt)}</span>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row lg:flex-col xl:flex-row xl:items-center">
          <Button
            type="button"
            variant="outline"
            onClick={onSelect}
            className="h-11 cursor-pointer rounded-2xl border-[#D4AF37]/25 bg-[#D4AF37]/10 px-4 text-[#F5D46E] hover:bg-[#D4AF37]/15"
          >
            Xem chi tiết
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function CampaignSeriesInsights({
  campaign,
  rows,
  isLoading,
  isError,
  error,
}: {
  campaign: CreatorCampaign;
  rows: CampaignSeriesDashboardRow[];
  isLoading: boolean;
  isError: boolean;
  error: unknown;
}) {
  const [selectedCampaignSeriesId, setSelectedCampaignSeriesId] = useState("");
  const isShowingAllSeries = selectedCampaignSeriesId === "__all";
  const selectedRow = isShowingAllSeries
    ? null
    : (rows.find(
        (row) =>
          row.campaignSeries.campaignSeriesId === selectedCampaignSeriesId,
      ) ?? rows[0]);
  const defaultLogRange = useMemo(
    () => getCampaignSeriesLogRange(campaign),
    [campaign],
  );
  const [logRange, setLogRange] =
    useState<CreatorCampaignSeriesLogParams>(defaultLogRange);
  const canLoadLogs = isValidLogRange(logRange);

  const logsQuery = useGetCreatorCampaignSeriesLogs(
    selectedRow?.campaignSeries.campaignSeriesId,
    logRange,
    Boolean(selectedRow) && !isShowingAllSeries && canLoadLogs,
  );

  return (
    <section className="mt-7 rounded-[30px] border border-white/10 bg-black/20 p-5 md:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[#D4AF37]/20 bg-[#D4AF37]/10 text-[#D4AF37]">
            <BookOpen className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-2xl font-black text-white">
              Series trong chiến dịch
            </h3>
            <p className="mt-1 max-w-2xl text-sm font-semibold leading-6 text-zinc-500">
              Chọn một series để xem tổng quan phân phối trước khi mở dashboard
              chi tiết theo thời gian.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.035] px-4 py-3">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-zinc-500">
              Tổng series
            </p>
            <p className="mt-1 text-lg font-black text-white">
              {formatNumber(rows.length)}
            </p>
          </div>
          <div className="rounded-2xl border border-[#D4AF37]/20 bg-[#D4AF37]/10 px-4 py-3">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-zinc-500">
              Hiển thị
            </p>
            <p className="mt-1 text-lg font-black text-[#F5D46E]">
              {formatNumber(
                rows.reduce(
                  (sum, row) => sum + (row.campaignSeries.totalImpression ?? 0),
                  0,
                ),
              )}
            </p>
          </div>
          <div className="col-span-2 rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.08] px-4 py-3 sm:col-span-1">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-zinc-500">
              Hoàn tất
            </p>
            <p className="mt-1 text-lg font-black text-emerald-200">
              {formatNumber(
                rows.filter((row) => row.campaignSeries.status === "COMPLETED")
                  .length,
              )}
            </p>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          {Array.from({ length: 2 }).map((_, index) => (
            <div
              key={index}
              className="min-h-[260px] animate-pulse rounded-[26px] border border-white/[0.08] bg-white/[0.035]"
            />
          ))}
        </div>
      ) : isError ? (
        <div className="mt-6 rounded-2xl border border-red-300/20 bg-red-500/10 p-5 text-sm font-semibold text-red-100">
          {getApiErrorMessage(error)}
        </div>
      ) : rows.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-white/12 bg-white/[0.025] p-6 text-sm font-semibold text-zinc-500">
          Chưa có series nào được gắn với chiến dịch này.
        </div>
      ) : (
        <>
          <div className="mt-6 rounded-[26px] border border-white/10 bg-white/[0.035] p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#D4AF37]">
                  Danh sách series
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => setSelectedCampaignSeriesId("__all")}
                className="h-10 border-white/10 bg-white/[0.05] px-4 text-sm font-bold text-zinc-200 hover:bg-white/[0.08] hover:text-white"
              >
                Xem tất cả
              </Button>
            </div>
            <div className="mt-4 flex gap-3 overflow-x-auto pb-1">
              {rows.map((row) => {
                const isSelected =
                  row.campaignSeries.campaignSeriesId ===
                  selectedRow?.campaignSeries.campaignSeriesId;

                return (
                  <CampaignSeriesPickerItem
                    key={row.campaignSeries.campaignSeriesId}
                    row={row}
                    isSelected={isSelected}
                    onClick={() =>
                      setSelectedCampaignSeriesId(
                        row.campaignSeries.campaignSeriesId,
                      )
                    }
                  />
                );
              })}
            </div>
          </div>

          {isShowingAllSeries ? (
            <div className="mt-6 grid gap-5 xl:grid-cols-2">
              {rows.map((row) => (
                <CampaignSeriesCard
                  key={row.campaignSeries.campaignSeriesId}
                  row={row}
                />
              ))}
            </div>
          ) : selectedRow ? (
            <CampaignSeriesOverviewPanelV2
              row={selectedRow}
              rows={rows}
              logs={canLoadLogs ? (logsQuery.data ?? []) : []}
              isLogsLoading={canLoadLogs && logsQuery.isLoading}
              isLogsError={canLoadLogs && logsQuery.isError}
              logsError={logsQuery.error}
              range={logRange}
              isRangeValid={canLoadLogs}
              onRangeChange={setLogRange}
            />
          ) : null}
        </>
      )}
    </section>
  );
}

function CampaignSeriesPickerItem({
  row,
  isSelected,
  onClick,
}: {
  row: CampaignSeriesDashboardRow;
  isSelected: boolean;
  onClick: () => void;
}) {
  const { campaignSeries, series, isSeriesLoading, isSeriesError } = row;
  const artwork = getSeriesArtwork(series);
  const isVideo = series?.contentType?.toUpperCase() === "VIDEO";
  const title = isSeriesLoading
    ? "Đang tải series..."
    : (series?.title ?? shortenId(campaignSeries.seriesId));

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group flex min-w-[260px] items-center gap-3 rounded-2xl border p-3 text-left transition-colors",
        isSelected
          ? "border-[#D4AF37]/45 bg-[#D4AF37]/12"
          : "border-white/10 bg-black/20 hover:border-[#D4AF37]/25 hover:bg-white/[0.055]",
      )}
    >
      <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-xl bg-white/[0.04]">
        {artwork ? (
          <div
            className="h-full w-full bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
            style={{ backgroundImage: `url(${artwork})` }}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <ImageIcon className="h-5 w-5 text-[#D4AF37]" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="line-clamp-1 text-sm font-black text-white">{title}</p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <Badge
            className={cn(
              "px-2 py-0.5 text-[10px]",
              getStatusClass(campaignSeries.status),
            )}
            variant="outline"
          >
            {getStatusLabel(campaignSeries.status)}
          </Badge>
          <span className="text-xs font-bold text-zinc-500">
            {formatNumber(campaignSeries.totalImpression)} impression
          </span>
        </div>
        <p className="mt-1 text-xs font-semibold text-zinc-600">
          {isSeriesError
            ? "Không tải được thông tin"
            : getContentTypeLabel(series?.contentType)}
        </p>
      </div>
      {isVideo ? (
        <Film className="h-4 w-4 shrink-0 text-sky-200" />
      ) : (
        <BookOpen className="h-4 w-4 shrink-0 text-[#D4AF37]" />
      )}
    </button>
  );
}

function SeriesMiniMetric({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  tone: "gold" | "blue" | "green" | "pink";
}) {
  const toneClass = {
    gold: "border-[#D4AF37]/20 bg-[#D4AF37]/10 text-[#F5D46E]",
    blue: "border-sky-300/20 bg-sky-400/10 text-sky-100",
    green: "border-emerald-300/20 bg-emerald-400/10 text-emerald-100",
    pink: "border-fuchsia-300/20 bg-fuchsia-400/10 text-fuchsia-100",
  }[tone];

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-black/20 p-4">
      <div
        className={cn(
          "flex h-10 w-10 items-center justify-center rounded-xl",
          toneClass,
        )}
      >
        <Icon className="h-4 w-4" />
      </div>
      <p className="mt-3 text-[11px] font-bold uppercase tracking-[0.16em] text-zinc-500">
        {label}
      </p>
      <p className="mt-1 text-xl font-black text-white">{value}</p>
    </div>
  );
}

function CampaignSeriesOverviewPanelV2({
  row,
  rows,
  logs,
  isLogsLoading,
  isLogsError,
  logsError,
  range,
  isRangeValid,
  onRangeChange,
}: {
  row: CampaignSeriesDashboardRow;
  rows: CampaignSeriesDashboardRow[];
  logs: CreatorCampaignSeriesLog[];
  isLogsLoading: boolean;
  isLogsError: boolean;
  logsError: unknown;
  range: CreatorCampaignSeriesLogParams;
  isRangeValid: boolean;
  onRangeChange: (range: CreatorCampaignSeriesLogParams) => void;
}) {
  const { campaignSeries, series, isSeriesLoading, isSeriesError } = row;
  const artwork = getSeriesArtwork(series);
  const isVideo = series?.contentType?.toUpperCase() === "VIDEO";
  const chartData = useMemo(
    () => buildCampaignSeriesLogChartData(logs),
    [logs],
  );
  const categories = series?.categories?.slice(0, 2) ?? [];
  const tags = series?.tags?.slice(0, 3) ?? [];
  const totalSeriesImpression = rows.reduce(
    (sum, item) => sum + (item.campaignSeries.totalImpression ?? 0),
    0,
  );
  const sharePercent =
    totalSeriesImpression > 0
      ? Math.round(
          ((campaignSeries.totalImpression ?? 0) / totalSeriesImpression) * 100,
        )
      : 0;
  const snapshotMetrics = [
    {
      key: "views",
      label: "Views",
      value: getCampaignSeriesMetric(campaignSeries, "views"),
      color: "#60A5FA",
    },
    {
      key: "likes",
      label: "Likes",
      value: getCampaignSeriesMetric(campaignSeries, "likes"),
      color: "#D4AF37",
    },
    {
      key: "comments",
      label: "Comments",
      value: getCampaignSeriesMetric(campaignSeries, "comments"),
      color: "#34D399",
    },
    {
      key: "shares",
      label: "Shares",
      value: getCampaignSeriesMetric(campaignSeries, "shares"),
      color: "#F472B6",
    },
  ];
  const logMetrics = [
    {
      key: "views",
      label: "Views",
      value: sumLogMetric(logs, "views"),
      color: "#60A5FA",
    },
    {
      key: "likes",
      label: "Likes",
      value: sumLogMetric(logs, "likes"),
      color: "#D4AF37",
    },
    {
      key: "comments",
      label: "Comments",
      value: sumLogMetric(logs, "comments"),
      color: "#34D399",
    },
    {
      key: "shares",
      label: "Shares",
      value: sumLogMetric(logs, "shares"),
      color: "#F472B6",
    },
  ];
  const logImpression = logs.reduce(
    (sum, log) => sum + (log.totalImpression ?? 0),
    0,
  );
  const maxLogMetric = Math.max(...logMetrics.map((metric) => metric.value), 1);

  return (
    <div className="mt-6 space-y-5">
      <div className="group relative min-h-[360px] cursor-pointer overflow-hidden rounded-[30px] border border-white/10 bg-white/[0.04] shadow-[0_24px_70px_rgba(0,0,0,0.24)] transition-colors duration-300 hover:border-[#D4AF37]/30">
        <div className="pointer-events-none absolute inset-x-8 top-0 z-20 h-px bg-gradient-to-r from-transparent via-[#F5D46E]/70 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        <div className="pointer-events-none absolute -right-24 top-0 z-20 h-full w-32 rotate-12 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 blur-sm transition-all duration-700 group-hover:right-[115%] group-hover:opacity-100" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_12%,rgba(212,175,55,0.22),transparent_30%),radial-gradient(circle_at_86%_16%,rgba(96,165,250,0.15),transparent_32%)]" />
        {artwork ? (
          <div
            className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
            role="img"
            aria-label={series?.title ?? campaignSeries.seriesId}
            style={{ backgroundImage: `url(${artwork})` }}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-[linear-gradient(135deg,rgba(39,39,42,0.9),rgba(9,9,11,0.95))]">
            <ImageIcon className="h-10 w-10 text-[#D4AF37]" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/62 to-black/20" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/88 via-transparent to-black/20" />
        <div className="relative z-10 flex min-h-[360px] max-w-4xl flex-col justify-end p-6 md:p-8">
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              className="border-white/10 bg-black/45 text-white backdrop-blur"
              variant="outline"
            >
              {isVideo ? (
                <Film className="h-3.5 w-3.5" />
              ) : (
                <BookOpen className="h-3.5 w-3.5" />
              )}
              {getContentTypeLabel(series?.contentType)}
            </Badge>
            {series?.ageRating ? (
              <Badge
                className="border-[#D4AF37]/25 bg-[#D4AF37]/15 text-[#F5D46E]"
                variant="outline"
              >
                {series.ageRating}
              </Badge>
            ) : null}
          </div>
          <h4 className="mt-4 line-clamp-2 text-4xl font-black tracking-tight text-white md:text-6xl">
            {isSeriesLoading
              ? "Đang tải thông tin series..."
              : (series?.title ?? shortenId(campaignSeries.seriesId))}
          </h4>
          <p className="mt-4 text-base font-bold text-zinc-300">
            {isSeriesError
              ? "Không tải được thông tin public series"
              : series?.creatorName
                ? `Creator: ${series.creatorName}`
                : `Series ID: ${shortenId(campaignSeries.seriesId)}`}
          </p>
          {series?.description ? (
            <p className="mt-4 line-clamp-3 max-w-3xl text-sm font-semibold leading-7 text-zinc-300 md:text-base">
              {series.description}
            </p>
          ) : null}
          <div className="mt-5 flex flex-wrap gap-2">
            {categories.map((category) => (
              <Badge
                key={category.categoryId}
                className="border-white/10 bg-white/[0.10] text-zinc-100"
                variant="outline"
              >
                {category.categoryName}
              </Badge>
            ))}
            {tags.map((tag) => (
              <Badge
                key={tag.tagId}
                className="border-sky-300/20 bg-sky-400/10 text-sky-100"
                variant="outline"
              >
                #{tag.tagName}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[0.8fr_1.2fr]">
        <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5 md:p-6">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#D4AF37]">
            Tổng quan phân phối
          </p>
          <h4 className="mt-2 text-2xl font-black text-white">
            Hiệu suất series đang chọn
          </h4>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <SeriesMiniMetric
              icon={Megaphone}
              label="Impression"
              value={formatNumber(campaignSeries.totalImpression)}
              tone="gold"
            />
            <SeriesMiniMetric
              icon={Eye}
              label="Total views"
              value={formatNumber(series?.totalViews)}
              tone="blue"
            />
            <SeriesMiniMetric
              icon={Bookmark}
              label="Subscriptions"
              value={formatNumber(series?.totalSubscriptions)}
              tone="green"
            />
            <SeriesMiniMetric
              icon={Activity}
              label="Tỷ trọng"
              value={`${sharePercent}%`}
              tone="pink"
            />
          </div>

          <div className="mt-5 rounded-2xl border border-white/[0.08] bg-black/20 p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-black text-white">Tỷ trọng series</p>
              <span className="text-sm font-black text-[#F5D46E]">
                {sharePercent}%
              </span>
            </div>
            <Progress value={sharePercent} />
          </div>

          <div className="mt-5 rounded-2xl border border-white/[0.08] bg-black/20 p-4">
            <p className="text-sm font-black text-white">Tổng Quan Tương tác</p>
            <div className="mt-3 h-[230px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={snapshotMetrics}>
                  <CartesianGrid
                    stroke="rgba(255,255,255,0.08)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="label"
                    tick={{ fill: "#a1a1aa", fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tick={{ fill: "#71717a", fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "rgba(15, 15, 18, 0.95)",
                      border: "1px solid rgba(255,255,255,0.12)",
                      borderRadius: 12,
                      color: "#fff",
                    }}
                    formatter={(value) => formatNumber(Number(value))}
                  />
                  <Bar dataKey="value" radius={[10, 10, 0, 0]}>
                    {snapshotMetrics.map((item) => (
                      <Cell key={item.key} fill={item.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5 md:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#D4AF37]">
                Chi tiết theo thời gian
              </p>
              <h4 className="mt-2 text-2xl font-black text-white">
                Biểu đồ phân phối
              </h4>
            </div>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <label className="block cursor-pointer">
              <span className="mb-2 block text-[11px] font-bold uppercase tracking-[0.16em] text-zinc-500">
                Bắt đầu
              </span>
              <div className="relative">
                <input
                  type="datetime-local"
                  value={toDateTimeInputValue(range.startTime)}
                  onChange={(event) =>
                    onRangeChange({
                      ...range,
                      startTime: fromDateTimeInputValue(event.target.value),
                    })
                  }
                  className="campaign-log-date-input h-12 w-full cursor-pointer rounded-2xl border border-white/10 bg-black/30 px-4 pr-12 text-sm font-bold text-zinc-100 outline-none transition placeholder:text-zinc-600 focus:border-[#D4AF37]/45 focus:ring-4 focus:ring-[#D4AF37]/10"
                />
                <Calendar className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/90" />
              </div>
            </label>
            <label className="block cursor-pointer">
              <span className="mb-2 block text-[11px] font-bold uppercase tracking-[0.16em] text-zinc-500">
                Kết thúc
              </span>
              <div className="relative">
                <input
                  type="datetime-local"
                  value={toDateTimeInputValue(range.endTime)}
                  onChange={(event) =>
                    onRangeChange({
                      ...range,
                      endTime: fromDateTimeInputValue(event.target.value),
                    })
                  }
                  className="campaign-log-date-input h-12 w-full cursor-pointer rounded-2xl border border-white/10 bg-black/30 px-4 pr-12 text-sm font-bold text-zinc-100 outline-none transition placeholder:text-zinc-600 focus:border-[#D4AF37]/45 focus:ring-4 focus:ring-[#D4AF37]/10"
                />
                <Calendar className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/90" />
              </div>
            </label>
          </div>

          {!isRangeValid ? (
            <div className="mt-3 rounded-2xl border border-red-300/20 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-100">
              Khoảng thời gian chưa hợp lệ. Vui lòng chọn thời gian bắt đầu nhỏ
              hơn thời gian kết thúc.
            </div>
          ) : null}

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <SeriesMiniMetric
              icon={Megaphone}
              label="Hiển thị"
              value={formatNumber(logImpression)}
              tone="gold"
            />
            <SeriesMiniMetric
              icon={Eye}
              label="Lượt xem"
              value={formatNumber(sumLogMetric(logs, "views"))}
              tone="blue"
            />
            <SeriesMiniMetric
              icon={ThumbsUp}
              label="Lượt Thích"
              value={formatNumber(sumLogMetric(logs, "likes"))}
              tone="green"
            />
            <SeriesMiniMetric
              icon={Clock3}
              label="Thời gian xem"
              value={formatNumber(sumLogMetric(logs, "watchTime"))}
              tone="pink"
            />
          </div>

          {isLogsLoading ? (
            <div className="mt-5 h-[520px] animate-pulse rounded-[24px] border border-white/10 bg-white/[0.035]" />
          ) : isLogsError ? (
            <div className="mt-5 rounded-2xl border border-red-300/20 bg-red-500/10 p-5 text-sm font-semibold text-red-100">
              {getApiErrorMessage(logsError)}
            </div>
          ) : logs.length === 0 ? (
            <div className="mt-5 rounded-2xl border border-dashed border-white/12 bg-white/[0.025] p-6 text-sm font-semibold text-zinc-500">
              Chưa có log theo thời gian cho series này trong khoảng đã chọn.
            </div>
          ) : (
            <div className="mt-5 grid gap-5">
              <div className="rounded-2xl border border-white/[0.08] bg-black/20 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-black text-white">
                    Hiển thị theo giờ
                  </p>
                  <Activity className="h-4 w-4 text-[#D4AF37]" />
                </div>
                <div className="mt-4 h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient
                          id="overviewImpressionGradient"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="#D4AF37"
                            stopOpacity={0.5}
                          />
                          <stop
                            offset="95%"
                            stopColor="#D4AF37"
                            stopOpacity={0.02}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        stroke="rgba(255,255,255,0.08)"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="hour"
                        tick={{ fill: "#a1a1aa", fontSize: 11 }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        tick={{ fill: "#71717a", fontSize: 11 }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip
                        contentStyle={{
                          background: "rgba(15, 15, 18, 0.95)",
                          border: "1px solid rgba(255,255,255,0.12)",
                          borderRadius: 12,
                          color: "#fff",
                        }}
                        formatter={(value) => formatNumber(Number(value))}
                      />
                      <Area
                        type="monotone"
                        dataKey="impression"
                        stroke="#D4AF37"
                        strokeWidth={3}
                        fill="url(#overviewImpressionGradient)"
                        name="Hiển thị"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="rounded-2xl border border-white/[0.08] bg-black/20 p-4">
                <p className="text-sm font-black text-white">
                  Tương tác theo thời gian
                </p>
                <div className="mt-4 h-[260px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid
                        stroke="rgba(255,255,255,0.08)"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="hour"
                        tick={{ fill: "#a1a1aa", fontSize: 11 }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        tick={{ fill: "#71717a", fontSize: 11 }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip
                        contentStyle={{
                          background: "rgba(15, 15, 18, 0.95)",
                          border: "1px solid rgba(255,255,255,0.12)",
                          borderRadius: 12,
                          color: "#fff",
                        }}
                        formatter={(value) => formatNumber(Number(value))}
                      />
                      <Legend
                        wrapperStyle={{ color: "#d4d4d8", fontSize: 12 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="views"
                        stroke="#60A5FA"
                        strokeWidth={3}
                        dot={false}
                        name="Xem"
                      />
                      <Line
                        type="monotone"
                        dataKey="likes"
                        stroke="#D4AF37"
                        strokeWidth={3}
                        dot={false}
                        name="Thích"
                      />
                      <Line
                        type="monotone"
                        dataKey="comments"
                        stroke="#34D399"
                        strokeWidth={3}
                        dot={false}
                        name="Bình Luận"
                      />
                      <Line
                        type="monotone"
                        dataKey="shares"
                        stroke="#F472B6"
                        strokeWidth={3}
                        dot={false}
                        name="Chia Sẻ"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="rounded-2xl border border-white/[0.08] bg-black/20 p-4">
                <p className="text-sm font-black text-white">Tổng log</p>
                <div className="mt-4 space-y-3">
                  {logMetrics.map((metric) => (
                    <div key={metric.key}>
                      <div className="mb-1 flex items-center justify-between text-xs font-bold">
                        <span className="text-zinc-500">{metric.label}</span>
                        <span className="text-white">
                          {formatNumber(metric.value)}
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-white/[0.08]">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${Math.min(100, (metric.value / maxLogMetric) * 100)}%`,
                            backgroundColor: metric.color,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function CampaignSeriesOverviewPanel({
  row,
  rows,
  onOpenDetail,
}: {
  row: CampaignSeriesDashboardRow;
  rows: CampaignSeriesDashboardRow[];
  onOpenDetail: () => void;
}) {
  const { campaignSeries, series, isSeriesLoading, isSeriesError } = row;
  const artwork = getSeriesArtwork(series);
  const isVideo = series?.contentType?.toUpperCase() === "VIDEO";
  const analytics = [
    {
      key: "views",
      label: "Views",
      value: getCampaignSeriesMetric(campaignSeries, "views"),
      color: "#60A5FA",
    },
    {
      key: "likes",
      label: "Likes",
      value: getCampaignSeriesMetric(campaignSeries, "likes"),
      color: "#D4AF37",
    },
    {
      key: "comments",
      label: "Comments",
      value: getCampaignSeriesMetric(campaignSeries, "comments"),
      color: "#34D399",
    },
    {
      key: "shares",
      label: "Shares",
      value: getCampaignSeriesMetric(campaignSeries, "shares"),
      color: "#F472B6",
    },
  ];
  const categories = series?.categories?.slice(0, 2) ?? [];
  const totalSeriesImpression = rows.reduce(
    (sum, item) => sum + (item.campaignSeries.totalImpression ?? 0),
    0,
  );
  const sharePercent =
    totalSeriesImpression > 0
      ? Math.round(
          ((campaignSeries.totalImpression ?? 0) / totalSeriesImpression) * 100,
        )
      : 0;
  const overviewChartData = analytics.map((item) => ({
    name: item.label,
    value: item.value,
  }));

  return (
    <div className="mt-6 grid gap-5 xl:grid-cols-[1fr_1.05fr]">
      <div className="overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.04]">
        <div className="relative min-h-[320px] overflow-hidden bg-white/[0.035]">
          {artwork ? (
            <div
              className="absolute inset-0 bg-cover bg-center"
              role="img"
              aria-label={series?.title ?? campaignSeries.seriesId}
              style={{ backgroundImage: `url(${artwork})` }}
            />
          ) : (
            <div className="flex h-full min-h-[320px] items-center justify-center bg-[radial-gradient(circle_at_30%_15%,rgba(212,175,55,0.24),transparent_30%),linear-gradient(135deg,rgba(39,39,42,0.9),rgba(9,9,11,0.95))]">
              <ImageIcon className="h-10 w-10 text-[#D4AF37]" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/10" />
          <div className="relative flex min-h-[320px] flex-col justify-end p-6">
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                className="border-white/10 bg-black/45 text-white backdrop-blur"
                variant="outline"
              >
                {isVideo ? (
                  <Film className="h-3.5 w-3.5" />
                ) : (
                  <BookOpen className="h-3.5 w-3.5" />
                )}
                {getContentTypeLabel(series?.contentType)}
              </Badge>
              <Badge
                className={getStatusClass(campaignSeries.status)}
                variant="outline"
              >
                {getStatusLabel(campaignSeries.status)}
              </Badge>
            </div>
            <h4 className="mt-4 line-clamp-2 text-3xl font-black text-white md:text-4xl">
              {isSeriesLoading
                ? "Đang tải thông tin series..."
                : (series?.title ?? shortenId(campaignSeries.seriesId))}
            </h4>
            <p className="mt-3 text-sm font-semibold text-zinc-400">
              {isSeriesError
                ? "Không tải được thông tin public series"
                : series?.creatorName
                  ? `Creator: ${series.creatorName}`
                  : `Series ID: ${shortenId(campaignSeries.seriesId)}`}
            </p>
            {series?.description ? (
              <p className="mt-4 line-clamp-2 max-w-2xl text-sm font-semibold leading-6 text-zinc-300">
                {series.description}
              </p>
            ) : null}
            <div className="mt-5 flex flex-wrap gap-2">
              {categories.map((category) => (
                <Badge
                  key={category.categoryId}
                  className="border-white/10 bg-white/[0.10] text-zinc-100"
                  variant="outline"
                >
                  {category.categoryName}
                </Badge>
              ))}
              {series?.ageRating ? (
                <Badge
                  className="border-[#D4AF37]/25 bg-[#D4AF37]/15 text-[#F5D46E]"
                  variant="outline"
                >
                  {series.ageRating}
                </Badge>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5 md:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#D4AF37]">
              Tổng quan phân phối
            </p>
            <h4 className="mt-2 text-2xl font-black text-white">
              Hiệu suất series đang chọn
            </h4>
            <p className="mt-1 text-sm font-semibold text-zinc-500">
              Dữ liệu snapshot từ Campaign Series hiện tại.
            </p>
          </div>
          <Button
            type="button"
            onClick={onOpenDetail}
            className="h-11 rounded-2xl bg-[#D4AF37] px-5 font-black text-black hover:bg-[#F5D46E]"
          >
            Xem chi tiết
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <SeriesMiniMetric
            icon={Megaphone}
            label="Impression"
            value={formatNumber(campaignSeries.totalImpression)}
            tone="gold"
          />
          <SeriesMiniMetric
            icon={Eye}
            label="Total views"
            value={formatNumber(series?.totalViews)}
            tone="blue"
          />
          <SeriesMiniMetric
            icon={Bookmark}
            label="Subscriptions"
            value={formatNumber(series?.totalSubscriptions)}
            tone="green"
          />
          <SeriesMiniMetric
            icon={Activity}
            label="Tỷ trọng"
            value={`${sharePercent}%`}
            tone="pink"
          />
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-[0.8fr_1fr]">
          <div className="rounded-2xl border border-white/[0.08] bg-black/20 p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-black text-white">Tỷ trọng series</p>
              <span className="text-sm font-black text-[#F5D46E]">
                {sharePercent}%
              </span>
            </div>
            <Progress value={sharePercent} />
            <p className="mt-3 text-xs font-semibold leading-5 text-zinc-500">
              So với tổng impression của các series trong chiến dịch này.
            </p>
          </div>

          <div className="rounded-2xl border border-white/[0.08] bg-black/20 p-4">
            <p className="text-sm font-black text-white">Tổng Quan Tương tác</p>
            <div className="mt-3 h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={overviewChartData}>
                  <CartesianGrid
                    stroke="rgba(255,255,255,0.08)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: "#a1a1aa", fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tick={{ fill: "#71717a", fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "rgba(15, 15, 18, 0.95)",
                      border: "1px solid rgba(255,255,255,0.12)",
                      borderRadius: 12,
                      color: "#fff",
                    }}
                    formatter={(value) => formatNumber(Number(value))}
                  />
                  <Bar dataKey="value" radius={[10, 10, 0, 0]}>
                    {analytics.map((item) => (
                      <Cell key={item.key} fill={item.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function CampaignSeriesDetailDashboard({
  rows,
  activeRow,
  logs,
  isLoading,
  isError,
  error,
  range,
  onBack,
  onSelectSeries,
}: {
  rows: CampaignSeriesDashboardRow[];
  activeRow: CampaignSeriesDashboardRow;
  logs: CreatorCampaignSeriesLog[];
  isLoading: boolean;
  isError: boolean;
  error: unknown;
  range: { startTime: string; endTime: string };
  onBack: () => void;
  onSelectSeries: (campaignSeriesId: string) => void;
}) {
  const { campaignSeries, series } = activeRow;
  const chartData = useMemo(
    () => buildCampaignSeriesLogChartData(logs),
    [logs],
  );
  const totalImpression = logs.reduce(
    (sum, log) => sum + (log.totalImpression ?? 0),
    0,
  );
  const metricTotals = [
    {
      key: "views",
      label: "Views",
      value: sumLogMetric(logs, "views"),
      color: "#60A5FA",
    },
    {
      key: "likes",
      label: "Likes",
      value: sumLogMetric(logs, "likes"),
      color: "#D4AF37",
    },
    {
      key: "comments",
      label: "Comments",
      value: sumLogMetric(logs, "comments"),
      color: "#34D399",
    },
    {
      key: "shares",
      label: "Shares",
      value: sumLogMetric(logs, "shares"),
      color: "#F472B6",
    },
    {
      key: "bookmarks",
      label: "Bookmarks",
      value: sumLogMetric(logs, "bookmarks"),
      color: "#A78BFA",
    },
    {
      key: "watchTime",
      label: "Watch time",
      value: sumLogMetric(logs, "watchTime"),
      color: "#FB923C",
    },
  ];
  const detailPieData = metricTotals.filter((item) => item.value > 0);
  const safePieData = detailPieData.length
    ? detailPieData
    : [{ key: "empty", label: "Chưa có dữ liệu", value: 1, color: "#334155" }];

  return (
    <section className="mt-7 rounded-[30px] border border-white/10 bg-black/20 p-5 md:p-6">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
            className="h-10 border-[#D4AF37]/25 bg-[#D4AF37]/10 px-4 text-sm font-bold text-[#F5D46E] hover:bg-[#D4AF37]/15"
          >
            <ArrowLeft className="h-4 w-4" />
            Tổng quan series
          </Button>
          <p className="mt-5 text-xs font-bold uppercase tracking-[0.18em] text-[#D4AF37]">
            Series dashboard
          </p>
          <h3 className="mt-2 text-3xl font-black text-white md:text-5xl">
            {series?.title ?? shortenId(campaignSeries.seriesId)}
          </h3>
          <p className="mt-3 text-sm font-semibold text-zinc-500">
            Dữ liệu log theo giờ từ {range.startTime} đến {range.endTime}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge
            className={getStatusClass(campaignSeries.status)}
            variant="outline"
          >
            {getStatusLabel(campaignSeries.status)}
          </Badge>
          <CampaignSeriesStatusToggleButton
            campaignSeriesId={campaignSeries.campaignSeriesId}
            currentStatus={campaignSeries.status}
          />
        </div>
      </div>

      <div className="mt-6 rounded-[26px] border border-white/10 bg-white/[0.035] p-4">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#D4AF37]">
          Chuyển series nhanh
        </p>
        <div className="mt-4 flex gap-3 overflow-x-auto pb-1">
          {rows.map((row) => (
            <CampaignSeriesPickerItem
              key={row.campaignSeries.campaignSeriesId}
              row={row}
              isSelected={
                row.campaignSeries.campaignSeriesId ===
                campaignSeries.campaignSeriesId
              }
              onClick={() =>
                onSelectSeries(row.campaignSeries.campaignSeriesId)
              }
            />
          ))}
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SeriesMiniMetric
          icon={Megaphone}
          label="Log impression"
          value={formatNumber(totalImpression)}
          tone="gold"
        />
        <SeriesMiniMetric
          icon={Eye}
          label="Views"
          value={formatNumber(sumLogMetric(logs, "views"))}
          tone="blue"
        />
        <SeriesMiniMetric
          icon={ThumbsUp}
          label="Likes"
          value={formatNumber(sumLogMetric(logs, "likes"))}
          tone="green"
        />
        <SeriesMiniMetric
          icon={Clock3}
          label="Điểm dữ liệu"
          value={formatNumber(logs.length)}
          tone="pink"
        />
      </div>

      {isLoading ? (
        <div className="mt-6 h-[520px] animate-pulse rounded-[28px] border border-white/10 bg-white/[0.035]" />
      ) : isError ? (
        <div className="mt-6 rounded-2xl border border-red-300/20 bg-red-500/10 p-5 text-sm font-semibold text-red-100">
          {getApiErrorMessage(error)}
        </div>
      ) : logs.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-white/12 bg-white/[0.025] p-6 text-sm font-semibold text-zinc-500">
          Chưa có log theo thời gian cho series này trong khoảng đã chọn.
        </div>
      ) : (
        <div className="mt-6 grid gap-5 xl:grid-cols-[1.35fr_0.85fr]">
          <div className="rounded-[28px] border border-white/10 bg-white/[0.035] p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h4 className="text-xl font-black text-white">
                  Impression theo giờ
                </h4>
                <p className="text-sm font-semibold text-zinc-500">
                  Đường phân phối impression theo `hourBucket`.
                </p>
              </div>
              <Activity className="h-5 w-5 text-[#D4AF37]" />
            </div>
            <div className="mt-5 h-[340px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient
                      id="impressionGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.5} />
                      <stop
                        offset="95%"
                        stopColor="#D4AF37"
                        stopOpacity={0.02}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    stroke="rgba(255,255,255,0.08)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="hour"
                    tick={{ fill: "#a1a1aa", fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tick={{ fill: "#71717a", fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "rgba(15, 15, 18, 0.95)",
                      border: "1px solid rgba(255,255,255,0.12)",
                      borderRadius: 12,
                      color: "#fff",
                    }}
                    formatter={(value) => formatNumber(Number(value))}
                  />
                  <Area
                    type="monotone"
                    dataKey="impression"
                    stroke="#D4AF37"
                    strokeWidth={3}
                    fill="url(#impressionGradient)"
                    name="Impression"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-white/[0.035] p-5">
            <h4 className="text-xl font-black text-white">
              Tỷ trọng tương tác
            </h4>
            <p className="text-sm font-semibold text-zinc-500">
              Tổng các field trong `analyticData`.
            </p>
            <div className="mt-5 h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={safePieData}
                    dataKey="value"
                    nameKey="label"
                    innerRadius={58}
                    outerRadius={92}
                    paddingAngle={4}
                  >
                    {safePieData.map((item) => (
                      <Cell key={item.key} fill={item.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "rgba(15, 15, 18, 0.95)",
                      border: "1px solid rgba(255,255,255,0.12)",
                      borderRadius: 12,
                      color: "#fff",
                    }}
                    formatter={(value) => formatNumber(Number(value))}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {metricTotals.slice(0, 4).map((metric) => (
                <div
                  key={metric.key}
                  className="rounded-2xl border border-white/[0.08] bg-black/20 p-3"
                >
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-500">
                    {metric.label}
                  </p>
                  <p className="mt-1 text-base font-black text-white">
                    {formatNumber(metric.value)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-white/[0.035] p-5 xl:col-span-2">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h4 className="text-xl font-black text-white">
                  Tương tác theo thời gian
                </h4>
                <p className="text-sm font-semibold text-zinc-500">
                  So sánh views, likes, comments và shares theo từng giờ.
                </p>
              </div>
              <TrendingUp className="h-5 w-5 text-[#D4AF37]" />
            </div>
            <div className="mt-5 h-[360px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid
                    stroke="rgba(255,255,255,0.08)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="hour"
                    tick={{ fill: "#a1a1aa", fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tick={{ fill: "#71717a", fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "rgba(15, 15, 18, 0.95)",
                      border: "1px solid rgba(255,255,255,0.12)",
                      borderRadius: 12,
                      color: "#fff",
                    }}
                    formatter={(value) => formatNumber(Number(value))}
                  />
                  <Legend wrapperStyle={{ color: "#d4d4d8", fontSize: 12 }} />
                  <Line
                    type="monotone"
                    dataKey="views"
                    stroke="#60A5FA"
                    strokeWidth={3}
                    dot={false}
                    name="Views"
                  />
                  <Line
                    type="monotone"
                    dataKey="likes"
                    stroke="#D4AF37"
                    strokeWidth={3}
                    dot={false}
                    name="Likes"
                  />
                  <Line
                    type="monotone"
                    dataKey="comments"
                    stroke="#34D399"
                    strokeWidth={3}
                    dot={false}
                    name="Comments"
                  />
                  <Line
                    type="monotone"
                    dataKey="shares"
                    stroke="#F472B6"
                    strokeWidth={3}
                    dot={false}
                    name="Shares"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function CampaignSeriesCard({ row }: { row: CampaignSeriesDashboardRow }) {
  const { campaignSeries, series, isSeriesLoading, isSeriesError } = row;
  const artwork = getSeriesArtwork(series);
  const isVideo = series?.contentType?.toUpperCase() === "VIDEO";
  const analytics = [
    { label: "Views", value: getCampaignSeriesMetric(campaignSeries, "views") },
    { label: "Likes", value: getCampaignSeriesMetric(campaignSeries, "likes") },
    {
      label: "Comments",
      value: getCampaignSeriesMetric(campaignSeries, "comments"),
    },
    {
      label: "Shares",
      value: getCampaignSeriesMetric(campaignSeries, "shares"),
    },
  ];
  const categories = series?.categories?.slice(0, 2) ?? [];

  return (
    <div className="group overflow-hidden rounded-[26px] border border-white/10 bg-white/[0.04] shadow-[0_20px_60px_rgba(0,0,0,0.22)] transition-colors hover:border-[#D4AF37]/25">
      <div className="grid min-h-[280px] md:grid-cols-[220px_1fr]">
        <div className="relative min-h-[260px] overflow-hidden bg-white/[0.035] md:min-h-full">
          {artwork ? (
            <div
              className="h-full w-full bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
              role="img"
              aria-label={series?.title ?? campaignSeries.seriesId}
              style={{ backgroundImage: `url(${artwork})` }}
            />
          ) : (
            <div className="flex h-full min-h-[260px] items-center justify-center bg-[radial-gradient(circle_at_30%_15%,rgba(212,175,55,0.24),transparent_30%),linear-gradient(135deg,rgba(39,39,42,0.9),rgba(9,9,11,0.95))]">
              <ImageIcon className="h-10 w-10 text-[#D4AF37]" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
          <Badge
            className={cn(
              "absolute left-4 top-4 border-white/10 bg-black/45 text-white backdrop-blur",
              isVideo && "bg-sky-400/15 text-sky-100",
            )}
            variant="outline"
          >
            {isVideo ? (
              <Film className="h-3.5 w-3.5" />
            ) : (
              <BookOpen className="h-3.5 w-3.5" />
            )}
            {getContentTypeLabel(series?.contentType)}
          </Badge>
          <Badge
            className={cn(
              "absolute bottom-4 left-4",
              getStatusClass(campaignSeries.status),
            )}
            variant="outline"
          >
            {getStatusLabel(campaignSeries.status)}
          </Badge>
        </div>

        <div className="flex min-w-0 flex-col p-5 md:p-6">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#D4AF37]">
                Campaign Series
              </p>
              <h4 className="mt-2 line-clamp-2 text-2xl font-black text-white">
                {isSeriesLoading
                  ? "Đang tải thông tin series..."
                  : (series?.title ?? shortenId(campaignSeries.seriesId))}
              </h4>
              <p className="mt-2 text-sm font-semibold text-zinc-500">
                {isSeriesError
                  ? "Không tải được thông tin public series"
                  : series?.creatorName
                    ? `Creator: ${series.creatorName}`
                    : `Series ID: ${shortenId(campaignSeries.seriesId)}`}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <CampaignSeriesStatusToggleButton
                campaignSeriesId={campaignSeries.campaignSeriesId}
                currentStatus={campaignSeries.status}
                size="sm"
              />
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[#D4AF37]/20 bg-[#D4AF37]/10 text-[#D4AF37]">
                <Megaphone className="h-5 w-5" />
              </div>
            </div>
          </div>

          {series?.description ? (
            <p className="mt-4 line-clamp-2 text-sm font-semibold leading-6 text-zinc-400">
              {series.description}
            </p>
          ) : null}

          <div className="mt-4 flex flex-wrap gap-2">
            {categories.map((category) => (
              <Badge
                key={category.categoryId}
                className="border-white/10 bg-white/[0.06] text-zinc-200"
                variant="outline"
              >
                {category.categoryName}
              </Badge>
            ))}
            {series?.ageRating ? (
              <Badge
                className="border-[#D4AF37]/25 bg-[#D4AF37]/10 text-[#F5D46E]"
                variant="outline"
              >
                {series.ageRating}
              </Badge>
            ) : null}
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-[#D4AF37]/20 bg-[#D4AF37]/10 p-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-zinc-500">
                Impression
              </p>
              <p className="mt-1 text-xl font-black text-[#F5D46E]">
                {formatNumber(campaignSeries.totalImpression)}
              </p>
            </div>
            <div className="rounded-2xl border border-white/[0.08] bg-black/20 p-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-zinc-500">
                Tổng view
              </p>
              <p className="mt-1 flex items-center gap-2 text-xl font-black text-white">
                <Eye className="h-4 w-4 text-[#D4AF37]" />
                {formatNumber(series?.totalViews)}
              </p>
            </div>
            <div className="rounded-2xl border border-white/[0.08] bg-black/20 p-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-zinc-500">
                Theo dõi
              </p>
              <p className="mt-1 text-xl font-black text-white">
                {formatNumber(series?.totalSubscriptions)}
              </p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {analytics.map((item) => (
              <div
                key={item.label}
                className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-3"
              >
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-500">
                  {item.label}
                </p>
                <p className="mt-1 text-base font-black text-zinc-100">
                  {formatNumber(item.value)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function CampaignDetailDashboard({
  campaign,
  campaigns,
  getServiceName,
  onBack,
  onSelectCampaign,
  onCancelCampaign,
}: {
  campaign: CreatorCampaign;
  campaigns: CreatorCampaign[];
  getServiceName: (engagementServiceId?: string | null) => string;
  onBack: () => void;
  onSelectCampaign: (campaignId: string) => void;
  onCancelCampaign?: (campaignId: string) => void;
}) {
  const [activeSubTab, setActiveSubTab] = useState<"performance" | "series">("performance");
  const [isOrderStatusModalOpen, setIsOrderStatusModalOpen] = useState(false);
  const [isCopiedId, setIsCopiedId] = useState(false);
  const progress = getProgress(campaign);
  const remaining = getRemaining(campaign);
  const numericAnalytics = getNumericAnalytics(campaign);
  const chartMetrics = numericAnalytics.length
    ? numericAnalytics.slice(0, 6)
    : [
        {
          key: "likes",
          label: "Lượt thích",
          value: getAnalyticNumber(campaign, "likes"),
        },
        {
          key: "views",
          label: "Lượt xem",
          value: getAnalyticNumber(campaign, "views"),
        },
        {
          key: "comments",
          label: "Bình luận",
          value: getAnalyticNumber(campaign, "comments"),
        },
        {
          key: "shares",
          label: "Chia sẻ",
          value: getAnalyticNumber(campaign, "shares"),
        },
      ];
  const chartPalette = [
    "#D4AF37",
    "#60A5FA",
    "#34D399",
    "#F472B6",
    "#A78BFA",
    "#FB923C",
  ];
  const progressData = [
    { name: "Đã đạt", value: campaign.currentImpression ?? 0 },
    { name: "Còn lại", value: remaining },
  ];
  const pieProgressData = progressData.some((item) => item.value > 0)
    ? progressData
    : [
        { name: "Đã đạt", value: 0 },
        { name: "Còn lại", value: 1 },
      ];
  const selectorCampaigns = campaigns.length ? campaigns : [campaign];
  const campaignSeriesQuery = useGetCreatorCampaignSeriesByCampaignId(
    campaign.campaignId,
  );
  const campaignSeriesItems = useMemo(
    () => campaignSeriesQuery.data ?? [],
    [campaignSeriesQuery.data],
  );
  const seriesDetailQueries = useQueries({
    queries: campaignSeriesItems.map((item) => ({
      queryKey: [
        "creator-dashboard",
        "campaign-series-public-detail",
        item.seriesId,
      ],
      queryFn: () => getPublicSeriesDetail(item.seriesId),
      enabled: Boolean(item.seriesId),
      staleTime: 5 * 60 * 1000,
    })),
  });
  const campaignSeriesRows = useMemo<CampaignSeriesDashboardRow[]>(
    () =>
      campaignSeriesItems.map((item, index) => ({
        campaignSeries: item,
        series: seriesDetailQueries[index]?.data,
        isSeriesLoading: Boolean(seriesDetailQueries[index]?.isLoading),
        isSeriesError: Boolean(seriesDetailQueries[index]?.isError),
      })),
    [campaignSeriesItems, seriesDetailQueries],
  );

  const handleCopyId = () => {
    if (campaign.campaignId) {
      navigator.clipboard.writeText(campaign.campaignId);
      setIsCopiedId(true);
      setTimeout(() => setIsCopiedId(false), 2000);
      toast.success("Đã sao chép mã chiến dịch!");
    }
  };

  const canCancel =
    Boolean(onCancelCampaign) &&
    progress === 0 &&
    (campaign.status === "RUNNING" ||
      campaign.status === "PAUSED" ||
      campaign.status === "PAUSE" ||
      campaign.status === "PENDING");

  return (
    <article className="space-y-6 animate-in fade-in duration-300">
      {/* Top Action Bar & Status */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
            className="h-10 cursor-pointer rounded-xl border-[#D4AF37]/35 bg-[#D4AF37]/10 px-4 text-xs font-bold text-[#F5D46E] hover:bg-[#D4AF37]/20 transition shadow-sm"
          >
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            Danh sách
          </Button>

          {canCancel ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => onCancelCampaign!(campaign.campaignId)}
              className="h-10 cursor-pointer rounded-xl border-red-500/35 bg-red-500/10 px-4 text-xs font-bold text-red-300 hover:border-red-400 hover:bg-red-500/20 transition shadow-sm"
            >
              <Trash2 className="mr-1.5 h-4 w-4" />
              Hủy chiến dịch
            </Button>
          ) : null}

          {campaign.orderId ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOrderStatusModalOpen(true)}
              className="h-10 cursor-pointer rounded-xl border-white/10 bg-white/5 px-4 text-xs font-bold text-zinc-300 hover:border-[#D4AF37]/40 hover:bg-[#D4AF37]/10 hover:text-[#F5D46E] transition shadow-sm"
            >
              <Receipt className="mr-1.5 h-4 w-4" />
              Chi tiết đơn hàng
            </Button>
          ) : null}
        </div>

        {/* TRẠNG THÁI Card */}
        <div
          className={cn(
            "rounded-2xl border px-4 py-2 text-center sm:text-right min-w-[120px] shadow-sm backdrop-blur-md",
            campaign.status === "RUNNING" && "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
            (campaign.status === "PAUSED" || campaign.status === "PAUSE") && "border-orange-500/30 bg-orange-500/10 text-orange-300",
            campaign.status === "COMPLETED" && "border-cyan-500/30 bg-cyan-500/10 text-cyan-300",
            campaign.status === "CANCELLED" && "border-red-500/30 bg-red-500/10 text-red-300",
            campaign.status === "UNAVAILABLE" && "border-rose-500/30 bg-rose-500/10 text-rose-300",
            !["RUNNING", "PAUSED", "PAUSE", "COMPLETED", "CANCELLED", "UNAVAILABLE"].includes(campaign.status ?? "") && "border-white/10 bg-white/5 text-zinc-300",
          )}
        >
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-400">TRẠNG THÁI</p>
          <div className="mt-0.5 flex items-center justify-center sm:justify-end gap-1.5 font-black text-sm md:text-base">
            {campaign.status === "RUNNING" && (
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
            )}
            {campaign.status === "COMPLETED" && <CheckCircle2 className="h-4 w-4 text-cyan-400" />}
            {campaign.status === "PAUSED" && <Pause className="h-4 w-4 text-orange-400" />}
            {campaign.status === "CANCELLED" && <CheckCircle2 className="h-4 w-4 text-red-400" />}
            {campaign.status === "UNAVAILABLE" && <X className="h-4 w-4 text-rose-400" />}
            <span>{getStatusLabel(campaign.status)}</span>
          </div>
        </div>
      </div>

      {/* Main Title Heading */}
      <div className="space-y-1">
        <h1 className="font-heading text-3xl font-black tracking-tight text-white md:text-5xl">
          Chi Tiết Chiến Dịch
        </h1>
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-zinc-400">
          <span className="text-zinc-200 font-bold text-sm">{getServiceName(campaign.engagementServiceId)}</span>
          <span>•</span>
          <button
            type="button"
            onClick={handleCopyId}
            className="flex items-center gap-1 font-mono text-zinc-400 hover:text-white transition cursor-pointer"
            title="Nhấn để sao chép mã chiến dịch"
          >
            <span>#{campaign.campaignId}</span>
            {isCopiedId ? (
              <Check className="h-3 w-3 text-emerald-400" />
            ) : (
              <Copy className="h-3 w-3" />
            )}
          </button>
        </div>
      </div>

      {/* Hero Overview Banner */}
      <div className="relative overflow-hidden rounded-[32px] border border-white/10 bg-gradient-to-br from-white/[0.06] via-white/[0.03] to-black/60 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl md:p-8">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_15%_10%,rgba(212,175,55,0.22),transparent_35%),radial-gradient(circle_at_85%_25%,rgba(96,165,250,0.12),transparent_40%)]" />
        <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-[#D4AF37]/50 to-transparent" />

        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <h2 className="font-heading text-xl font-black text-white md:text-3xl tracking-tight">
              {getServiceName(campaign.engagementServiceId)}
            </h2>
            <p className="text-xs font-semibold text-zinc-400 md:text-sm max-w-xl">
              Chiến dịch phân phối nội dung tự động đạt mục tiêu hiển thị trong hệ sinh thái TaleX.
            </p>
          </div>

          {/* 4 Quick KPI Cards */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-3.5">
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.035] p-3.5 text-center min-w-[110px]">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-500 flex items-center justify-center gap-1">
                <Target className="h-3 w-3 text-[#D4AF37]" /> Mục tiêu
              </p>
              <p className="mt-1.5 text-xl font-black text-white">
                {formatNumber(campaign.targetImpression)}
              </p>
            </div>

            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.06] p-3.5 text-center min-w-[110px]">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-400 flex items-center justify-center gap-1">
                <CheckCircle2 className="h-3 w-3" /> Đã đạt
              </p>
              <p className="mt-1.5 text-xl font-black text-emerald-300">
                {formatNumber(campaign.currentImpression)}
              </p>
            </div>

            <div className="rounded-2xl border border-[#D4AF37]/30 bg-[#D4AF37]/10 p-3.5 text-center min-w-[110px]">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#F5D46E] flex items-center justify-center gap-1">
                <TrendingUp className="h-3 w-3" /> Tiến độ
              </p>
              <p className="mt-1.5 text-xl font-black text-[#F5D46E]">{progress}%</p>
            </div>

            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.035] p-3.5 text-center min-w-[110px]">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-500 flex items-center justify-center gap-1">
                <Clock3 className="h-3 w-3 text-sky-400" /> Còn lại
              </p>
              <p className="mt-1.5 text-xl font-black text-zinc-200">
                {formatNumber(remaining)}
              </p>
            </div>
          </div>
        </div>

        {/* Dynamic Studio Progress Bar */}
        <div className="mt-7 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="text-zinc-400">Tiến trình phân phối hiển thị</span>
            <span className="text-[#D4AF37] font-mono">
              {formatNumber(campaign.currentImpression)} /{" "}
              {formatNumber(campaign.targetImpression)} lượt ({progress}%)
            </span>
          </div>
          <div className="h-3 w-full overflow-hidden rounded-full bg-black/40 p-0.5 border border-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#D4AF37] via-[#F5D46E] to-emerald-400 transition-all duration-700 shadow-[0_0_12px_rgba(212,175,55,0.4)]"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Sub-tab Navigation: 2 Clean Tabs */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-4 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveSubTab("performance")}
          className={cn(
            "flex items-center gap-2 rounded-2xl px-5 py-2.5 text-sm font-black transition-all cursor-pointer",
            activeSubTab === "performance"
              ? "border border-[#D4AF37]/35 bg-[#D4AF37]/15 text-[#F5D46E] shadow-[0_8px_24px_rgba(212,175,55,0.15)]"
              : "border border-white/10 bg-white/[0.035] text-zinc-400 hover:border-white/20 hover:text-white",
          )}
        >
          <TrendingUp className="h-4 w-4" />
          <span>Hiệu suất & Tổng quan</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab("series")}
          className={cn(
            "flex items-center gap-2 rounded-2xl px-5 py-2.5 text-sm font-black transition-all cursor-pointer",
            activeSubTab === "series"
              ? "border border-[#D4AF37]/35 bg-[#D4AF37]/15 text-[#F5D46E] shadow-[0_8px_24px_rgba(212,175,55,0.15)]"
              : "border border-white/10 bg-white/[0.035] text-zinc-400 hover:border-white/20 hover:text-white",
          )}
        >
          <Film className="h-4 w-4" />
          <span>Tác phẩm trong chiến dịch</span>
          <Badge className="ml-1 border-white/10 bg-white/10 text-[11px] text-white">
            {campaignSeriesRows.length}
          </Badge>
        </button>
      </div>

      {/* SUB-TAB 1: HIỆU SUẤT & TỔNG QUAN */}
      {activeSubTab === "performance" && (
        <div className="grid gap-6 lg:grid-cols-12 animate-in fade-in duration-300">
          {/* Left Column: Analytics & Distribution Charts (7 Cols) */}
          <div className="space-y-6 lg:col-span-7">
            {/* Card: Chỉ số tương tác */}
            <div className="rounded-[28px] border border-white/10 bg-white/[0.035] p-5 md:p-6 shadow-xl">
              <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#D4AF37]/25 bg-[#D4AF37]/10 text-[#D4AF37]">
                    <TrendingUp className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-white">
                      Chỉ số tương tác đạt được
                    </h3>
                    <p className="text-xs font-semibold text-zinc-500">
                      Tương tác thu về từ người dùng xem nội dung
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-5 h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartMetrics}>
                    <CartesianGrid
                      stroke="rgba(255,255,255,0.06)"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="label"
                      tick={{ fill: "#a1a1aa", fontSize: 12, fontWeight: "bold" }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      tick={{ fill: "#71717a", fontSize: 11 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "rgba(15, 15, 18, 0.95)",
                        border: "1px solid rgba(255,255,255,0.12)",
                        borderRadius: 14,
                        color: "#fff",
                        fontWeight: "bold",
                      }}
                      formatter={(value) => formatNumber(Number(value))}
                    />
                    <Bar dataKey="value" radius={[10, 10, 0, 0]}>
                      {chartMetrics.map((entry, index) => (
                        <Cell
                          key={entry.key}
                          fill={chartPalette[index % chartPalette.length]}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4 pt-4 border-t border-white/[0.08]">
                {chartMetrics.map((metric, idx) => (
                  <div
                    key={metric.key}
                    className="rounded-xl border border-white/[0.06] bg-black/20 p-2.5 text-center"
                  >
                    <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                      {metric.label}
                    </p>
                    <p
                      className="mt-1 text-sm font-black"
                      style={{ color: chartPalette[idx % chartPalette.length] }}
                    >
                      {formatNumber(metric.value)}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Card: Tỷ trọng phân bổ hiển thị */}
            <div className="rounded-[28px] border border-white/10 bg-white/[0.035] p-5 md:p-6 shadow-xl">
              <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-blue-400/25 bg-blue-400/10 text-blue-400">
                    <BarChart3 className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-white">
                      Tỷ trọng tiến độ hiển thị
                    </h3>
                    <p className="text-xs font-semibold text-zinc-500">
                      So sánh lượt đã hoàn thành và mục tiêu còn lại
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-5 grid items-center gap-5 sm:grid-cols-[1fr_1.2fr]">
                <div className="h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieProgressData}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={55}
                        outerRadius={80}
                        paddingAngle={4}
                      >
                        <Cell fill="#D4AF37" />
                        <Cell fill="#334155" />
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          background: "rgba(15, 15, 18, 0.95)",
                          border: "1px solid rgba(255,255,255,0.12)",
                          borderRadius: 12,
                          color: "#fff",
                        }}
                        formatter={(value) => formatNumber(Number(value))}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="space-y-3">
                  {progressData.map((item, idx) => (
                    <div
                      key={item.name}
                      className="flex items-center justify-between rounded-2xl border border-white/[0.08] bg-black/25 p-3.5"
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className={cn(
                            "h-3 w-3 rounded-full",
                            idx === 0 ? "bg-[#D4AF37]" : "bg-slate-700",
                          )}
                        />
                        <span className="text-xs font-bold text-zinc-300">
                          {item.name}
                        </span>
                      </div>
                      <span className="text-sm font-black text-white">
                        {formatNumber(item.value)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Campaign Information & Specifications (5 Cols) */}
          <div className="space-y-6 lg:col-span-5">
            <div className="rounded-[28px] border border-white/10 bg-white/[0.035] p-5 md:p-6 shadow-xl">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#D4AF37]/25 bg-[#D4AF37]/10 text-[#D4AF37]">
                    <WalletCards className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-white">
                      Thông tin chiến dịch
                    </h3>
                    <p className="text-xs font-semibold text-zinc-500">
                      Chi tiết dịch vụ và lịch trình thực thi
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-5 space-y-3.5">
                {/* Gói dịch vụ */}
                <div className="rounded-2xl border border-white/[0.08] bg-black/25 p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/5 text-[#D4AF37]">
                      <Rocket className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                        Gói tăng tương tác
                      </p>
                      <p className="truncate text-sm font-black text-white mt-0.5">
                        {getServiceName(campaign.engagementServiceId)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Mã đơn hàng */}
                <div className="rounded-2xl border border-white/[0.08] bg-black/25 p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/5 text-[#D4AF37]">
                      <Hash className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                        Mã đơn hàng
                      </p>
                      <p className="truncate font-mono text-xs font-bold text-zinc-200 mt-0.5">
                        {campaign.orderId ?? "Chưa liên kết"}
                      </p>
                    </div>
                  </div>

                  {campaign.orderId ? (
                    <button
                      type="button"
                      onClick={() => setIsOrderStatusModalOpen(true)}
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-zinc-400 transition hover:border-[#D4AF37]/50 hover:bg-[#D4AF37]/10 hover:text-[#D4AF37] cursor-pointer shadow-sm"
                      title="Tra cứu trạng thái đơn hàng"
                      aria-label="Tra cứu trạng thái đơn hàng"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                  ) : null}
                </div>

                {/* Ngày bắt đầu */}
                <div className="rounded-2xl border border-white/[0.08] bg-black/25 p-4 flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/5 text-emerald-400">
                    <CalendarClock className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                      Ngày bắt đầu
                    </p>
                    <p className="text-xs font-bold text-zinc-200 mt-0.5">
                      {formatDateTime(campaign.startAt)}
                    </p>
                  </div>
                </div>

                {/* Ngày kết thúc */}
                <div className="rounded-2xl border border-white/[0.08] bg-black/25 p-4 flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/5 text-orange-400">
                    <Clock3 className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                      Ngày kết thúc
                    </p>
                    <p className="text-xs font-bold text-zinc-200 mt-0.5">
                      {formatDateTime(campaign.endAt)}
                    </p>
                  </div>
                </div>

                {/* Ngày khởi tạo & Cập nhật */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="rounded-2xl border border-white/[0.06] bg-black/20 p-3 text-center">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                      Khởi tạo
                    </p>
                    <p className="text-[11px] font-bold text-zinc-300 mt-1">
                      {formatDateTime(campaign.createdAt)}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/[0.06] bg-black/20 p-3 text-center">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                      Cập nhật
                    </p>
                    <p className="text-[11px] font-bold text-zinc-300 mt-1">
                      {formatDateTime(campaign.updatedAt)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: TÁC PHẨM TRONG CHIẾN DỊCH */}
      {activeSubTab === "series" && (
        <div className="animate-in fade-in duration-300">
          <CampaignSeriesInsights
            key={campaign.campaignId}
            campaign={campaign}
            rows={campaignSeriesRows}
            isLoading={campaignSeriesQuery.isLoading}
            isError={campaignSeriesQuery.isError}
            error={campaignSeriesQuery.error}
          />
        </div>
      )}

      {/* Modal Tra Cứu Trạng Thái Đơn Hàng */}
      <CampaignOrderStatusModal
        isOpen={isOrderStatusModalOpen}
        orderId={campaign.orderId ?? null}
        onClose={() => setIsOrderStatusModalOpen(false)}
      />
    </article>
  );
}

function CampaignOrderStatusModal({
  isOpen,
  orderId,
  onClose,
}: {
  isOpen: boolean;
  orderId: string | null;
  onClose: () => void;
}) {
  if (!isOpen || !orderId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl border border-white/15 bg-[#121215] p-6 shadow-2xl creator-soft-scrollbar">
        <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#D4AF37]/25 bg-[#D4AF37]/10 text-[#D4AF37]">
              <Receipt className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white">
                Chi tiết thanh toán đơn hàng
              </h3>
              <p className="text-xs font-mono text-zinc-400">
                Mã đơn hàng: {orderId}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-zinc-400 transition hover:bg-white/10 hover:text-white cursor-pointer"
            aria-label="Đóng"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <CampaignOrderPollingCard orderId={orderId} />
      </div>
    </div>
  );
}

const campaignBenefits: Array<{
  title: string;
  description: string;
  icon: LucideIcon;
}> = [
  {
    title: "Khán giả thực",
    description:
      "Tăng tiếp cận tới người dùng đang hoạt động trong hệ sinh thái TaleX.",
    icon: Eye,
  },
  {
    title: "Đảm bảo phân phối",
    description: "Phân phối nội dung cho đến khi đạt mục tiêu đã đặt ra.",
    icon: Zap,
  },
  {
    title: "Thống kê thời gian thực",
    description:
      "Theo dõi lượt xem, lượt thích và hiệu quả từng gói ngay trong dashboard.",
    icon: BarChart3,
  },
];

export function CreatorCampaignsView() {
  const [activeTab, setActiveTab] = useState<
    "campaigns" | "packages" | "wallet"
  >("campaigns");
  const [selectedPlan, setSelectedPlan] =
    useState<CreatorCampaignService | null>(null);
  const [page, setPage] = useState(1);
  const [selectedStatus, setSelectedStatus] = useState<
    CreatorCampaignStatus | ""
  >("");
  const [sortBy, setSortBy] = useState<CreatorCampaignSortBy>("createdAt");
  const [sortDirection, setSortDirection] = useState<"ASC" | "DESC">("DESC");
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(
    null,
  );
  const [campaignFilters, setCampaignFilters] =
    useState<CreatorCampaignFilterFields>({});

  const updateCriteriaFilter = (
    key: keyof CreatorCampaignFilterFields,
    value: string,
  ) => {
    setCampaignFilters((current) => ({
      ...current,
      [key]: value,
    }));
    setPage(1);
  };

  const queryParams = useMemo(() => {
    const filters = Object.fromEntries(
      Object.entries(campaignFilters).filter(([, value]) =>
        String(value ?? "").trim(),
      ),
    ) as CreatorCampaignFilterFields;

    return {
      page,
      pageSize: PAGE_SIZE,
      sortBy,
      sortDirection,
      filters: Object.keys(filters).length > 0 ? filters : undefined,
    };
  }, [page, sortBy, sortDirection, campaignFilters]);

  const campaignsQuery = useGetCreatorOwnCampaigns(queryParams);
  const servicesQuery = useGetCreatorCampaignPlans({ page: 1, pageSize: 100 });
  const campaignWalletQuery = useGetCampaignWalletBalance();

  const rawCampaigns = useMemo(
    () => campaignsQuery.data?.content ?? [],
    [campaignsQuery.data?.content],
  );
  const campaigns = useMemo(
    () =>
      selectedStatus
        ? rawCampaigns.filter((campaign) => campaign.status === selectedStatus)
        : rawCampaigns,
    [rawCampaigns, selectedStatus],
  );
  const selectedCampaign = campaigns.find(
    (campaign) => campaign.campaignId === selectedCampaignId,
  );
  const stats = useMemo(() => {
    const activeCount = campaigns.filter(
      (campaign) => campaign.status === "RUNNING",
    ).length;
    const completedCount = campaigns.filter(
      (campaign) => campaign.status === "COMPLETED",
    ).length;
    const totalCurrent = campaigns.reduce(
      (sum, campaign) => sum + (campaign.currentImpression ?? 0),
      0,
    );

    return { activeCount, completedCount, totalCurrent };
  }, [campaigns]);

  const totalPages = campaignsQuery.data?.totalPages ?? 1;
  const totalElements = selectedStatus
    ? campaigns.length
    : (campaignsQuery.data?.totalElements ?? 0);
  const activeCriteriaCount = Object.values(campaignFilters).filter((value) =>
    String(value ?? "").trim(),
  ).length;
  const activeFilterCount = activeCriteriaCount + (selectedStatus ? 1 : 0);
  const serviceOptions = useMemo(
    () => [
      { value: "", label: "Tất cả gói tương tác" },
      ...(servicesQuery.data?.content ?? []).map((service) => ({
        value: service.engagementServiceId,
        label: `${service.name} · ${formatNumber(service.targetValue)} lượt`,
      })),
    ],
    [servicesQuery.data?.content],
  );
  const serviceNameById = useMemo(
    () =>
      new Map(
        (servicesQuery.data?.content ?? []).map((service) => [
          service.engagementServiceId,
          service.name,
        ]),
      ),
    [servicesQuery.data?.content],
  );
  const getServiceName = (engagementServiceId?: string | null) => {
    if (!engagementServiceId) return "Chưa có gói";
    return serviceNameById.get(engagementServiceId) ?? "Gói tăng tương tác";
  };

  const resetFilters = () => {
    setCampaignFilters({});
    setSelectedStatus("");
    setSortBy("createdAt");
    setSortDirection("DESC");
    setPage(1);
  };

  const [isPayoutModalOpen, setIsPayoutModalOpen] = useState(false);
  const [cancellingCampaignId, setCancellingCampaignId] = useState<
    string | null
  >(null);

  if (selectedCampaign) {
    return (
      <section className="mx-auto w-full max-w-[1500px] space-y-6 px-0 pb-8">
        <CampaignDetailDashboard
          campaign={selectedCampaign}
          campaigns={campaigns}
          getServiceName={getServiceName}
          onBack={() => setSelectedCampaignId(null)}
          onSelectCampaign={setSelectedCampaignId}
          onCancelCampaign={(id) => setCancellingCampaignId(id)}
        />
        <CreatorCampaignCancelModal
          isOpen={Boolean(cancellingCampaignId)}
          campaignId={cancellingCampaignId}
          onClose={() => {
            setCancellingCampaignId(null);
            setSelectedCampaignId(null);
          }}
        />
      </section>
    );
  }

  return (
    <section className="space-y-8">
      <div className="relative overflow-hidden rounded-[24px] border border-white/10 bg-gradient-to-r from-white/[0.05] via-white/[0.025] to-black/50 p-5 md:p-6 shadow-xl backdrop-blur-xl">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_15%_10%,rgba(212,175,55,0.16),transparent_35%),radial-gradient(circle_at_85%_25%,rgba(59,130,246,0.1),transparent_40%)]" />

        <div className="relative z-10 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="font-heading text-2xl font-black tracking-tight text-white md:text-3xl">
              Tăng tương tác & Chiến dịch
            </h1>
            <p className="mt-1 text-xs font-semibold text-zinc-400 md:text-sm max-w-xl">
              Khám phá gói dịch vụ tăng trưởng và theo dõi hiệu suất các chiến dịch quảng bá tác phẩm.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative flex flex-col items-center">
              <CampaignStatCard
                icon={Coins}
                label="Số Dư Ví"
                value={
                  campaignWalletQuery.isLoading
                    ? "Đang tải..."
                    : campaignWalletQuery.data === null
                      ? "Chưa tạo ví"
                      : `${formatNumber(campaignWalletQuery.data?.balance)}đ`
                }
                tone="gold"
              />
              {campaignWalletQuery.data &&
              campaignWalletQuery.data.balance > 0 ? (
                <button
                  type="button"
                  onClick={() => setIsPayoutModalOpen(true)}
                  className="mt-1 flex items-center gap-1 text-[11px] font-bold text-[#F5D46E] hover:underline cursor-pointer"
                >
                  <Landmark className="h-3 w-3" />
                  Rút tiền
                </button>
              ) : null}
            </div>
            <CampaignStatCard
              icon={Megaphone}
              label="Chiến dịch"
              value={formatNumber(totalElements)}
            />
            <CampaignStatCard
              icon={TrendingUp}
              label="Đang chạy"
              value={formatNumber(stats.activeCount)}
              tone="green"
            />
            <CampaignStatCard
              icon={CheckCircle2}
              label="Hoàn tất"
              value={formatNumber(stats.completedCount)}
            />
          </div>
        </div>
      </div>

      {/* Tabs Navigation Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div className="inline-flex rounded-2xl border border-white/10 bg-white/[0.04] p-1.5 backdrop-blur-md">
          <button
            type="button"
            onClick={() => setActiveTab("campaigns")}
            className={cn(
              "flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-black transition-all cursor-pointer",
              activeTab === "campaigns"
                ? "bg-[#D4AF37] text-zinc-950 shadow-lg shadow-[#D4AF37]/20"
                : "text-zinc-400 hover:text-white hover:bg-white/5",
            )}
          >
            <Megaphone className="h-4 w-4" />
            Chiến dịch của tôi
            <span
              className={cn(
                "ml-1 rounded-full px-2 py-0.5 text-[10px] font-black",
                activeTab === "campaigns"
                  ? "bg-zinc-950/20 text-zinc-950"
                  : "bg-white/10 text-zinc-300",
              )}
            >
              {totalElements}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("packages")}
            className={cn(
              "flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-black transition-all cursor-pointer",
              activeTab === "packages"
                ? "bg-[#D4AF37] text-zinc-950 shadow-lg shadow-[#D4AF37]/20"
                : "text-zinc-400 hover:text-white hover:bg-white/5",
            )}
          >
            <Rocket className="h-4 w-4" />
            Gói tăng tương tác
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("wallet")}
            className={cn(
              "flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-black transition-all cursor-pointer",
              activeTab === "wallet"
                ? "bg-[#D4AF37] text-zinc-950 shadow-lg shadow-[#D4AF37]/20"
                : "text-zinc-400 hover:text-white hover:bg-white/5",
            )}
          >
            <WalletCards className="h-4 w-4" />
            Ví & Rút tiền
          </button>
        </div>

        {activeTab === "campaigns" && (
          <Button
            type="button"
            onClick={() => setActiveTab("packages")}
            className="h-11 rounded-2xl bg-[#D4AF37] px-5 text-xs font-black text-black shadow-lg shadow-[#D4AF37]/25 hover:bg-[#e6c75b] cursor-pointer"
          >
            <Plus className="mr-1.5 h-4 w-4" />
            Tạo chiến dịch mới
          </Button>
        )}
      </div>

      <CampaignPayoutModal
        open={isPayoutModalOpen}
        balance={campaignWalletQuery.data?.balance ?? 0}
        onOpenChange={setIsPayoutModalOpen}
      />

      {/* TAB 1: CHIẾN DỊCH CỦA TÔI */}
      {activeTab === "campaigns" && (
        <div className="space-y-8">
          <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-start gap-3">
                <Filter className="mt-1 h-5 w-5 text-[#D4AF37]" />
                <div>
                  <h2 className="text-xl font-black text-white">
                    Bộ lọc chiến dịch
                  </h2>
                  {activeFilterCount > 0 ? (
                    <p className="mt-1 text-xs font-bold text-[#F5D46E]">
                      {activeFilterCount} bộ lọc đang áp dụng
                    </p>
                  ) : null}
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                className="h-11 cursor-pointer rounded-2xl border-white/10 bg-white/[0.05] px-4 text-zinc-200 hover:bg-white/[0.08]"
                onClick={() => setIsFiltersOpen((open) => !open)}
              >
                <ChevronRight
                  className={cn(
                    "h-4 w-4 transition-transform",
                    isFiltersOpen && "rotate-90",
                  )}
                />
                {isFiltersOpen ? "Thu gọn" : "Mở bộ lọc"}
              </Button>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <SelectField
                label="Trạng thái"
                value={selectedStatus}
                onChange={(value) => {
                  setSelectedStatus(value as CreatorCampaignStatus | "");
                  setPage(1);
                }}
                options={[
                  { value: "", label: "Tất cả trạng thái" },
                  ...campaignStatuses,
                ]}
              />

              <SelectField
                label="Gói tương tác"
                value={campaignFilters.engagementServiceId ?? ""}
                onChange={(value) =>
                  updateCriteriaFilter("engagementServiceId", value)
                }
                options={serviceOptions}
                disabled={servicesQuery.isLoading}
              />

              <SelectField
                label="Sắp xếp"
                value={sortBy}
                onChange={(value) => {
                  setSortBy(value as CreatorCampaignSortBy);
                  setPage(1);
                }}
                options={sortOptions}
              />

              <SelectField
                label="Thứ tự"
                value={sortDirection}
                onChange={(value) => {
                  setSortDirection(value as "ASC" | "DESC");
                  setPage(1);
                }}
                options={[
                  { value: "DESC", label: "Mới nhất" },
                  { value: "ASC", label: "Cũ nhất" },
                ]}
              />
            </div>

            {isFiltersOpen ? (
              <div className="mt-5 grid gap-3 border-t border-white/10 pt-5 md:grid-cols-2 xl:grid-cols-4">
                <FilterInput
                  label="Mục tiêu từ"
                  type="number"
                  min={0}
                  value={campaignFilters.targetValueFrom ?? ""}
                  onChange={(value) =>
                    updateCriteriaFilter("targetValueFrom", value)
                  }
                  placeholder="0"
                />

                <FilterInput
                  label="Mục tiêu đến"
                  type="number"
                  min={0}
                  value={campaignFilters.targetValueTo ?? ""}
                  onChange={(value) =>
                    updateCriteriaFilter("targetValueTo", value)
                  }
                  placeholder="1000"
                />

                <FilterInput
                  label="Đã đạt từ"
                  type="number"
                  min={0}
                  value={campaignFilters.currentValueFrom ?? ""}
                  onChange={(value) =>
                    updateCriteriaFilter("currentValueFrom", value)
                  }
                  placeholder="0"
                />

                <FilterInput
                  label="Đã đạt đến"
                  type="number"
                  min={0}
                  value={campaignFilters.currentValueTo ?? ""}
                  onChange={(value) =>
                    updateCriteriaFilter("currentValueTo", value)
                  }
                  placeholder="1000"
                />

                <FilterInput
                  label="Bắt đầu từ"
                  type="datetime-local"
                  value={campaignFilters.startAtFrom ?? ""}
                  onChange={(value) =>
                    updateCriteriaFilter("startAtFrom", value)
                  }
                />

                <FilterInput
                  label="Bắt đầu đến"
                  type="datetime-local"
                  value={campaignFilters.startAtTo ?? ""}
                  onChange={(value) => updateCriteriaFilter("startAtTo", value)}
                />

                <FilterInput
                  label="Kết thúc từ"
                  type="datetime-local"
                  value={campaignFilters.endAtFrom ?? ""}
                  onChange={(value) => updateCriteriaFilter("endAtFrom", value)}
                />

                <FilterInput
                  label="Kết thúc đến"
                  type="datetime-local"
                  value={campaignFilters.endAtTo ?? ""}
                  onChange={(value) => updateCriteriaFilter("endAtTo", value)}
                />

                <FilterInput
                  label="Ngày tạo từ"
                  type="datetime-local"
                  value={campaignFilters.createdAtFrom ?? ""}
                  onChange={(value) =>
                    updateCriteriaFilter("createdAtFrom", value)
                  }
                />

                <FilterInput
                  label="Ngày tạo đến"
                  type="datetime-local"
                  value={campaignFilters.createdAtTo ?? ""}
                  onChange={(value) =>
                    updateCriteriaFilter("createdAtTo", value)
                  }
                />

                <FilterInput
                  label="Cập nhật từ"
                  type="datetime-local"
                  value={campaignFilters.updatedAtFrom ?? ""}
                  onChange={(value) =>
                    updateCriteriaFilter("updatedAtFrom", value)
                  }
                />

                <FilterInput
                  label="Cập nhật đến"
                  type="datetime-local"
                  value={campaignFilters.updatedAtTo ?? ""}
                  onChange={(value) =>
                    updateCriteriaFilter("updatedAtTo", value)
                  }
                />

                <Button
                  type="button"
                  variant="outline"
                  className="h-12 cursor-pointer self-end rounded-2xl border-white/10 bg-white/[0.05] px-4 text-zinc-200 hover:bg-white/[0.08]"
                  onClick={resetFilters}
                >
                  <RefreshCw className="h-4 w-4" />
                  Đặt lại
                </Button>
              </div>
            ) : null}
          </div>

          <section className="rounded-[28px] border border-white/10 bg-white/[0.035] p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-2xl font-black text-white">
                  Danh sách chiến dịch
                </h2>
                <p className="mt-1 text-sm font-semibold text-zinc-500">
                  {formatNumber(totalElements)} chiến dịch
                </p>
              </div>
              {campaignsQuery.isFetching ? (
                <div className="flex items-center gap-2 rounded-2xl border border-[#D4AF37]/20 bg-[#D4AF37]/10 px-4 py-2 text-sm font-bold text-[#F5D46E]">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Đang cập nhật
                </div>
              ) : null}
            </div>

            <div className="mt-5 space-y-3">
              {campaignsQuery.isLoading ? (
                Array.from({ length: 4 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-32 animate-pulse rounded-2xl border border-white/10 bg-white/[0.05]"
                  />
                ))
              ) : campaignsQuery.error ? (
                <div className="rounded-2xl border border-red-300/20 bg-red-300/[0.08] p-5 text-sm font-semibold text-red-100/80">
                  {getApiErrorMessage(campaignsQuery.error)}
                </div>
              ) : campaigns.length > 0 ? (
                campaigns.map((campaign) => (
                  <CampaignCard
                    key={campaign.campaignId}
                    campaign={campaign}
                    serviceName={getServiceName(campaign.engagementServiceId)}
                    onSelect={() => setSelectedCampaignId(campaign.campaignId)}
                  />
                ))
              ) : (
                <div className="flex min-h-[260px] flex-col items-center justify-center rounded-2xl border border-dashed border-white/12 bg-white/[0.025] p-6 text-center">
                  <Sparkles className="h-8 w-8 text-[#D4AF37]" />
                  <p className="mt-4 text-lg font-black text-white">
                    Chưa có chiến dịch nào
                  </p>
                  <p className="mt-2 text-sm font-semibold leading-6 text-zinc-500 max-w-md">
                    Khi bạn mua gói tăng tương tác, chiến dịch sẽ xuất hiện tại
                    đây để theo dõi và tối ưu hiệu quả.
                  </p>
                  <Button
                    type="button"
                    onClick={() => setActiveTab("packages")}
                    className="mt-5 h-10 rounded-xl bg-[#D4AF37] px-5 text-xs font-black text-black shadow-lg hover:bg-[#e6c75b] cursor-pointer"
                  >
                    <Rocket className="mr-1.5 h-4 w-4" />
                    Khám phá gói tăng tương tác
                  </Button>
                </div>
              )}
            </div>

            <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-5">
              <p className="text-sm font-bold text-zinc-500">
                Trang {page}/{Math.max(totalPages, 1)}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="icon-lg"
                  className="cursor-pointer rounded-2xl border-white/10 bg-white/[0.04] text-zinc-300 hover:bg-white/[0.08]"
                  disabled={page <= 1 || campaignsQuery.data?.isFirst}
                  onClick={() => setPage((current) => Math.max(current - 1, 1))}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon-lg"
                  className="cursor-pointer rounded-2xl border-white/10 bg-white/[0.04] text-zinc-300 hover:bg-white/[0.08]"
                  disabled={campaignsQuery.data?.isLast || page >= totalPages}
                  onClick={() => setPage((current) => current + 1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <CreatorCampaignCancelModal
              isOpen={Boolean(cancellingCampaignId)}
              campaignId={cancellingCampaignId}
              onClose={() => setCancellingCampaignId(null)}
            />
          </section>
        </div>
      )}

      {/* TAB 2: GÓI TĂNG TƯƠNG TÁC */}
      {activeTab === "packages" && (
        <div className="space-y-8">
          <CreatorCampaignPlanList onSelectPlan={setSelectedPlan} />

          <section className="grid gap-4 md:grid-cols-3">
            {campaignBenefits.map((benefit) => {
              const Icon = benefit.icon;

              return (
                <div
                  key={benefit.title}
                  className="creator-shine-card group rounded-[26px] border border-white/10 bg-white/[0.035] p-5 shadow-[0_18px_60px_rgba(0,0,0,0.20)] transition-all duration-300 hover:-translate-y-1 hover:border-yellow-400/40 hover:bg-white/[0.055]"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-yellow-400/10 text-yellow-400">
                    <Icon className="h-5 w-5 transition-transform group-hover:scale-110" />
                  </div>
                  <h3 className="mt-4 text-lg font-black text-zinc-50">
                    {benefit.title}
                  </h3>
                  <p className="mt-2 text-sm font-semibold leading-6 text-zinc-400">
                    {benefit.description}
                  </p>
                </div>
              );
            })}
          </section>

          <CreatorCampaignCheckoutModal
            open={Boolean(selectedPlan)}
            plan={selectedPlan}
            onOpenChange={(open) => {
              if (!open) {
                setSelectedPlan(null);
              }
            }}
          />
        </div>
      )}

      {/* TAB 3: VÍ & RÚT TIỀN */}
      {activeTab === "wallet" && (
        <div className="space-y-8">
          <CampaignWalletHistorySection />
          <PayoutRequestsListSection />
        </div>
      )}
    </section>
  );
}

function FilterInput({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  min,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: "text" | "number" | "datetime-local";
  min?: number;
}) {
  return (
    <label className="space-y-2">
      <span className="text-xs font-bold uppercase tracking-[0.16em] text-zinc-500">
        {label}
      </span>
      <div className="relative">
        <input
          type={type}
          min={min}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className={cn(
            "h-12 w-full rounded-2xl border border-white/10 bg-black/25 px-4 text-sm font-semibold text-zinc-100 outline-none transition placeholder:text-zinc-600 focus:border-[#D4AF37]/45",
            type === "datetime-local" && "creator-date-input pr-12",
          )}
        />
        {type === "datetime-local" ? (
          <Calendar className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/90" />
        ) : null}
      </div>
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  disabled?: boolean;
}) {
  return (
    <label className="space-y-2">
      <span className="text-xs font-bold uppercase tracking-[0.16em] text-zinc-500">
        {label}
      </span>
      <div className="relative">
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          disabled={disabled}
          className="h-12 w-full cursor-pointer appearance-none rounded-2xl border border-white/10 bg-black/25 px-4 pr-10 text-sm font-semibold text-zinc-100 outline-none transition focus:border-[#D4AF37]/45 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {options.map((option) => (
            <option
              key={option.value}
              value={option.value}
              className="bg-[#111] text-zinc-100"
            >
              {option.label}
            </option>
          ))}
        </select>
        <ArrowRight className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 rotate-90 text-zinc-500" />
      </div>
    </label>
  );
}
