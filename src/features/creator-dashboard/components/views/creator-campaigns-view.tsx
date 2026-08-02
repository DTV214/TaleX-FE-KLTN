"use client";

import { useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Calendar,
  CalendarClock,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Filter,
  Hash,
  Megaphone,
  RefreshCw,
  Sparkles,
  Target,
  TrendingUp,
  WalletCards,
  type LucideIcon,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Progress } from "@/shared/ui/progress";
import { cn } from "@/shared/utils/utils";
import { parseBackendDate } from "@/shared/utils/backend-date";
import { getApiErrorMessage } from "@/shared/api/http-client";
import {
  useGetCreatorCampaignPlans,
  useGetCreatorOwnCampaigns,
} from "@/features/creator-dashboard/hooks/use-creator-campaigns";
import type {
  CreatorCampaign,
  CreatorCampaignFilterFields,
  CreatorCampaignSortBy,
  CreatorCampaignStatus,
} from "@/features/creator-dashboard/types/creator-campaigns.types";

const PAGE_SIZE = 8;

const campaignStatuses: Array<{ value: CreatorCampaignStatus; label: string }> = [
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
  return campaignStatuses.find((item) => item.value === status)?.label ?? status;
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
      return "border-orange-300/35 bg-orange-300/10 text-orange-100";
    case "CANCELLED":
    case "FAILED":
    case "UNAVAILABLE":
      return "border-red-300/35 bg-red-300/10 text-red-100";
    default:
      return "border-white/15 bg-white/[0.06] text-zinc-300";
  }
}

function shortenId(value?: string | null) {
  if (!value) return "Chưa có";
  return value.length > 14 ? `${value.slice(0, 8)}...${value.slice(-6)}` : value;
}

function formatAnalyticLabel(value: string) {
  return value
    .replace(/([A-Z])/g, " $1")
    .replace(/[_-]/g, " ")
    .trim()
    .replace(/^./, (char) => char.toUpperCase());
}

function formatAnalyticValue(value: unknown) {
  if (value === null || value === undefined || value === "") return "Chưa có";
  if (typeof value === "number") return formatNumber(value);
  if (typeof value === "boolean") return value ? "Có" : "Không";
  if (typeof value === "string") return value;
  return JSON.stringify(value);
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
    .filter((item): item is { key: string; label: string; value: number } =>
      item.value !== null,
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
        "rounded-2xl border bg-white/[0.045] p-5 shadow-[0_18px_50px_rgba(0,0,0,0.16)]",
        tone === "gold" && "border-[#D4AF37]/25 bg-[#D4AF37]/10",
        tone === "green" && "border-emerald-400/20 bg-emerald-400/[0.08]",
        tone === "neutral" && "border-white/10",
      )}
    >
      <Icon
        className={cn(
          "h-5 w-5",
          tone === "green" ? "text-emerald-300" : "text-[#D4AF37]",
        )}
      />
      <p className="mt-4 text-sm font-semibold text-zinc-400">{label}</p>
      <p className="mt-2 text-2xl font-black text-white">{value}</p>
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
            <Badge className={getStatusClass(campaign.status)} variant="outline">
              {getStatusLabel(campaign.status)}
            </Badge>
            <span className="text-xs font-bold uppercase tracking-[0.14em] text-zinc-600">
              {shortenId(campaign.campaignId)}
            </span>
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
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[#D4AF37]/20 bg-[#D4AF37]/10 text-[#D4AF37]">
            <Megaphone className="h-5 w-5" />
          </div>
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

function CampaignDetailDashboard({
  campaign,
  campaigns,
  getServiceName,
  onBack,
  onSelectCampaign,
}: {
  campaign: CreatorCampaign;
  campaigns: CreatorCampaign[];
  getServiceName: (engagementServiceId?: string | null) => string;
  onBack: () => void;
  onSelectCampaign: (campaignId: string) => void;
}) {
  const progress = getProgress(campaign);
  const remaining = getRemaining(campaign);
  const numericAnalytics = getNumericAnalytics(campaign);
  const analyticEntries = Object.entries(campaign.analyticData ?? {}).filter(
    ([, value]) => value !== undefined && value !== null,
  );
  const chartMetrics = numericAnalytics.length
    ? numericAnalytics.slice(0, 6)
    : [
        { key: "likes", label: "Likes", value: getAnalyticNumber(campaign, "likes") },
        { key: "views", label: "Views", value: getAnalyticNumber(campaign, "views") },
        { key: "comments", label: "Comments", value: getAnalyticNumber(campaign, "comments") },
        { key: "shares", label: "Shares", value: getAnalyticNumber(campaign, "shares") },
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

  return (
    <article className="relative overflow-hidden rounded-[32px] border border-white/10 bg-white/[0.045] p-6 shadow-[0_30px_90px_rgba(0,0,0,0.28)]">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_18%_0%,rgba(212,175,55,0.17),transparent_30%),radial-gradient(circle_at_92%_20%,rgba(96,165,250,0.14),transparent_34%)]" />

      <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0">
          <div className="mb-6 flex flex-wrap items-center gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onBack}
              className="h-11 cursor-pointer rounded-2xl border-[#D4AF37]/25 bg-[#D4AF37]/10 px-4 text-[#F5D46E] hover:bg-[#D4AF37]/15"
            >
              <ArrowLeft className="h-4 w-4" />
              Danh sách
            </Button>
            <Badge variant="premium" className="px-4 py-2">
              Campaign Detail
            </Badge>
          </div>

          <h2 className="text-4xl font-black tracking-tight text-white">
            Chi tiết chiến dịch
          </h2>
          <p className="mt-2 break-all text-sm font-semibold text-zinc-500">
            Campaign ID: {campaign.campaignId}
          </p>
          <p className="mt-3 text-sm font-bold text-[#F5D46E]">
            {getServiceName(campaign.engagementServiceId)}
          </p>
        </div>

        <div className={cn("rounded-3xl border px-6 py-5", getStatusClass(campaign.status))}>
          <p className="text-xs font-bold uppercase tracking-[0.18em] opacity-70">
            Trạng thái
          </p>
          <p className="mt-2 flex items-center gap-2 text-2xl font-black">
            <CheckCircle2 className="h-5 w-5" />
            {getStatusLabel(campaign.status)}
          </p>
        </div>
      </div>

      <section className="mt-7 rounded-3xl border border-white/10 bg-black/20 p-4">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-black text-white">Chuyển chiến dịch</h3>
            <p className="text-xs font-semibold text-zinc-500">
              Chọn nhanh một chiến dịch khác trong danh sách hiện tại.
            </p>
          </div>
          <Megaphone className="h-5 w-5 text-[#D4AF37]" />
        </div>
        <div className="flex gap-3 overflow-x-auto pb-1">
          {selectorCampaigns.map((item) => {
            const itemProgress = getProgress(item);
            const isSelected = item.campaignId === campaign.campaignId;

            return (
              <button
                key={item.campaignId}
                type="button"
                onClick={() => onSelectCampaign(item.campaignId)}
                className={cn(
                  "min-w-[250px] rounded-2xl border p-4 text-left transition-colors",
                  isSelected
                    ? "border-[#D4AF37]/45 bg-[#D4AF37]/12"
                    : "border-white/10 bg-white/[0.035] hover:border-[#D4AF37]/25 hover:bg-white/[0.06]",
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-black text-white">
                    {shortenId(item.campaignId)}
                  </span>
                  <Badge className={getStatusClass(item.status)} variant="outline">
                    {getStatusLabel(item.status)}
                  </Badge>
                </div>
                <Progress className="mt-3" value={itemProgress} />
                <p className="mt-2 text-xs font-bold text-[#F5D46E]">
                  {itemProgress}% hoàn thành
                </p>
              </button>
            );
          })}
        </div>
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <DetailMetric
          icon={TrendingUp}
          label="Tiến độ"
          value={`${progress}%`}
        />
        <DetailMetric
          icon={Target}
          label="Mục tiêu"
          value={formatNumber(campaign.targetImpression)}
        />
        <DetailMetric
          icon={CheckCircle2}
          label="Đã đạt"
          value={formatNumber(campaign.currentImpression)}
        />
        <DetailMetric
          icon={Sparkles}
          label="Còn lại"
          value={formatNumber(remaining)}
        />
      </section>

      <section className="mt-6 grid gap-5 xl:grid-cols-[0.9fr_1.4fr]">
        <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-xl font-black text-white">Tỷ trọng tiến độ</h3>
              <p className="text-sm font-semibold text-zinc-500">
                So sánh lượt đã đạt và phần còn lại.
              </p>
            </div>
            <BarChart3 className="h-5 w-5 text-[#D4AF37]" />
          </div>
          <div className="mt-4 h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieProgressData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={68}
                  outerRadius={96}
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
          <div className="grid grid-cols-2 gap-3">
            {progressData.map((item) => (
              <div
                key={item.name}
                className="rounded-2xl border border-white/[0.08] bg-white/[0.035] p-4"
              >
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-zinc-500">
                  {item.name}
                </p>
                <p className="mt-1 text-xl font-black text-white">
                  {formatNumber(item.value)}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-xl font-black text-white">Chỉ số tương tác</h3>
              <p className="text-sm font-semibold text-zinc-500">
                Biểu đồ dựa trên các field số trong `analyticData`.
              </p>
            </div>
            <TrendingUp className="h-5 w-5 text-[#D4AF37]" />
          </div>
          <div className="mt-5 h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartMetrics}>
                <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fill: "#a1a1aa", fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fill: "#71717a", fontSize: 12 }}
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
                <Bar dataKey="value" radius={[10, 10, 0, 0]} fill="#D4AF37" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-2">
        <DetailMetric
          icon={CalendarClock}
          label="Ngày bắt đầu"
          value={formatDateTime(campaign.startAt)}
        />
        <DetailMetric
          icon={Clock3}
          label="Ngày kết thúc"
          value={formatDateTime(campaign.endAt)}
        />
        <DetailMetric
          icon={RefreshCw}
          label="Ngày cập nhật"
          value={formatDateTime(campaign.updatedAt)}
        />
        <DetailMetric
          icon={CalendarClock}
          label="Ngày tạo"
          value={formatDateTime(campaign.createdAt)}
        />
        <DetailMetric
          icon={Hash}
          label="Mã đơn hàng"
          value={campaign.orderId ?? "Chưa có"}
        />
        <DetailMetric
          icon={WalletCards}
          label="Gói tăng tương tác"
          value={getServiceName(campaign.engagementServiceId)}
        />
      </section>

      <section className="mt-6 rounded-3xl border border-white/10 bg-black/20 p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[#D4AF37]/20 bg-[#D4AF37]/10 text-[#D4AF37]">
            <BarChart3 className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-xl font-black text-white">Dữ liệu phân tích</h3>
            <p className="text-sm font-semibold text-zinc-500">
              Hiển thị linh hoạt theo response `analyticData` từ backend.
            </p>
          </div>
        </div>

        {analyticEntries.length > 0 ? (
          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {analyticEntries.map(([key, value]) => (
              <div
                key={key}
                className="rounded-2xl border border-white/[0.08] bg-white/[0.035] p-4"
              >
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-zinc-500">
                  {formatAnalyticLabel(key)}
                </p>
                <p className="mt-2 break-words text-lg font-black text-zinc-100">
                  {formatAnalyticValue(value)}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-5 rounded-2xl border border-dashed border-white/12 bg-white/[0.025] p-6 text-sm font-semibold text-zinc-500">
            Chưa có dữ liệu phân tích cho chiến dịch này.
          </div>
        )}
      </section>
    </article>
  );
}

function DetailMetric({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-5">
      <Icon className="h-5 w-5 text-[#D4AF37]" />
      <p className="mt-4 text-sm font-semibold text-zinc-500">{label}</p>
      <p className="mt-2 break-words text-lg font-black text-zinc-100">{value}</p>
    </div>
  );
}

export function CreatorCampaignsView() {
  const [page, setPage] = useState(1);
  const [selectedStatus, setSelectedStatus] = useState<CreatorCampaignStatus | "">("");
  const [sortBy, setSortBy] = useState<CreatorCampaignSortBy>("createdAt");
  const [sortDirection, setSortDirection] = useState<"ASC" | "DESC">("DESC");
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
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

  const queryParams = useMemo(
    () => {
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
    },
    [page, sortBy, sortDirection, campaignFilters],
  );

  const campaignsQuery = useGetCreatorOwnCampaigns(queryParams);
  const servicesQuery = useGetCreatorCampaignPlans({ page: 1, pageSize: 100 });

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
    const activeCount = campaigns.filter((campaign) =>
      campaign.status === "RUNNING",
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
    : campaignsQuery.data?.totalElements ?? 0;
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

  return (
    <section className="space-y-8">
      <div className="relative overflow-hidden rounded-[32px] border border-white/10 bg-white/[0.045] p-8 shadow-[0_24px_70px_rgba(0,0,0,0.24)]">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_18%_0%,rgba(212,175,55,0.18),transparent_30%),radial-gradient(circle_at_86%_18%,rgba(59,130,246,0.14),transparent_34%)]" />
        <div className="pointer-events-none absolute inset-x-10 top-12 -z-10 h-px bg-gradient-to-r from-transparent via-[#D4AF37]/30 to-transparent" />

        <div className="grid gap-8 xl:grid-cols-[1fr_520px] xl:items-end">
          <div>
            <Badge variant="premium" className="mb-5">
              TaleX Campaigns
            </Badge>
            <h1 className="text-5xl font-black tracking-tight text-white">
              Chiến dịch tăng tương tác
            </h1>
            <p className="mt-4 max-w-2xl text-base font-semibold leading-7 text-zinc-400">
              Theo dõi các chiến dịch đã mua, tiến độ phân phối và dữ liệu phân
              tích từ hệ thống đề xuất TaleX.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <CampaignStatCard
              icon={Megaphone}
              label="Tổng chiến dịch"
              value={formatNumber(totalElements)}
              tone="gold"
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
            onChange={(value) => updateCriteriaFilter("targetValueFrom", value)}
            placeholder="0"
          />

          <FilterInput
            label="Mục tiêu đến"
            type="number"
            min={0}
            value={campaignFilters.targetValueTo ?? ""}
            onChange={(value) => updateCriteriaFilter("targetValueTo", value)}
            placeholder="1000"
          />

          <FilterInput
            label="Đã đạt từ"
            type="number"
            min={0}
            value={campaignFilters.currentValueFrom ?? ""}
            onChange={(value) => updateCriteriaFilter("currentValueFrom", value)}
            placeholder="0"
          />

          <FilterInput
            label="Đã đạt đến"
            type="number"
            min={0}
            value={campaignFilters.currentValueTo ?? ""}
            onChange={(value) => updateCriteriaFilter("currentValueTo", value)}
            placeholder="1000"
          />

          <FilterInput
            label="Bắt đầu từ"
            type="datetime-local"
            value={campaignFilters.startAtFrom ?? ""}
            onChange={(value) => updateCriteriaFilter("startAtFrom", value)}
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
            onChange={(value) => updateCriteriaFilter("createdAtFrom", value)}
          />

          <FilterInput
            label="Ngày tạo đến"
            type="datetime-local"
            value={campaignFilters.createdAtTo ?? ""}
            onChange={(value) => updateCriteriaFilter("createdAtTo", value)}
          />

          <FilterInput
            label="Cập nhật từ"
            type="datetime-local"
            value={campaignFilters.updatedAtFrom ?? ""}
            onChange={(value) => updateCriteriaFilter("updatedAtFrom", value)}
          />

          <FilterInput
            label="Cập nhật đến"
            type="datetime-local"
            value={campaignFilters.updatedAtTo ?? ""}
            onChange={(value) => updateCriteriaFilter("updatedAtTo", value)}
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

      {selectedCampaign ? (
        <CampaignDetailDashboard
          campaign={selectedCampaign}
          campaigns={campaigns}
          getServiceName={getServiceName}
          onBack={() => setSelectedCampaignId(null)}
          onSelectCampaign={setSelectedCampaignId}
        />
      ) : (
        <section className="rounded-[28px] border border-white/10 bg-white/[0.035] p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-black text-white">Danh sách chiến dịch</h2>
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
                  Chưa có chiến dịch
                </p>
                <p className="mt-2 text-sm font-semibold leading-6 text-zinc-500">
                  Khi bạn mua gói tăng tương tác, chiến dịch sẽ xuất hiện tại đây để theo dõi.
                </p>
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
        </section>
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
            <option key={option.value} value={option.value} className="bg-[#111] text-zinc-100">
              {option.label}
            </option>
          ))}
        </select>
        <ArrowRight className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 rotate-90 text-zinc-500" />
      </div>
    </label>
  );
}

