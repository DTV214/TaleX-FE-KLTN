"use client";

import { useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  CalendarClock,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Filter,
  Hash,
  Megaphone,
  RefreshCw,
  Search,
  Sparkles,
  Target,
  TrendingUp,
  WalletCards,
  type LucideIcon,
} from "lucide-react";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Progress } from "@/shared/ui/progress";
import { cn } from "@/shared/utils/utils";
import { parseBackendDate } from "@/shared/utils/backend-date";
import { getApiErrorMessage } from "@/shared/api/http-client";
import { useGetCreatorOwnCampaigns } from "@/features/creator-dashboard/hooks/use-creator-campaigns";
import type {
  CreatorCampaign,
  CreatorCampaignSortBy,
  CreatorCampaignStatus,
} from "@/features/creator-dashboard/types/creator-campaigns.types";

const PAGE_SIZE = 8;

const campaignStatuses: Array<{ value: CreatorCampaignStatus; label: string }> = [
  { value: "PENDING", label: "Đang chờ" },
  { value: "ACTIVE", label: "Đang chạy" },
  { value: "RUNNING", label: "Đang phân phối" },
  { value: "COMPLETED", label: "Hoàn tất" },
  { value: "PAUSED", label: "Tạm dừng" },
  { value: "CANCELLED", label: "Đã hủy" },
  { value: "FAILED", label: "Thất bại" },
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
  selected,
  onSelect,
}: {
  campaign: CreatorCampaign;
  selected: boolean;
  onSelect: () => void;
}) {
  const progress = getProgress(campaign);

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "group relative w-full cursor-pointer overflow-hidden rounded-2xl border p-5 text-left transition-colors duration-200",
        selected
          ? "border-[#D4AF37]/45 bg-[#D4AF37]/10"
          : "border-white/10 bg-white/[0.04] hover:border-[#D4AF37]/25 hover:bg-white/[0.07]",
      )}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#D4AF37]/45 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <Badge className={getStatusClass(campaign.status)} variant="outline">
            {getStatusLabel(campaign.status)}
          </Badge>
          <h3 className="mt-4 truncate text-xl font-black text-white">
            Chiến dịch {shortenId(campaign.campaignId)}
          </h3>
          <p className="mt-2 flex items-center gap-2 text-sm font-semibold text-zinc-500">
            <WalletCards className="h-4 w-4 text-[#D4AF37]" />
            Order {shortenId(campaign.orderId)}
          </p>
        </div>
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[#D4AF37]/20 bg-[#D4AF37]/10 text-[#D4AF37]">
          <Megaphone className="h-5 w-5" />
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-white/[0.08] bg-black/20 p-4">
        <div className="mb-2 flex items-center justify-between text-sm font-bold">
          <span className="text-zinc-400">Tiến độ hiển thị</span>
          <span className="text-[#F5D46E]">{progress}%</span>
        </div>
        <Progress value={progress} />
        <div className="mt-3 flex items-center justify-between gap-3 text-xs font-semibold text-zinc-500">
          <span>{formatNumber(campaign.currentImpression)} đã đạt</span>
          <span>{formatNumber(campaign.targetImpression)} mục tiêu</span>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-3">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-zinc-500">
            Bắt đầu
          </p>
          <p className="mt-1 font-bold text-zinc-200">
            {formatDateTime(campaign.startAt)}
          </p>
        </div>
        <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-3">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-zinc-500">
            Kết thúc
          </p>
          <p className="mt-1 font-bold text-zinc-200">
            {formatDateTime(campaign.endAt)}
          </p>
        </div>
      </div>
    </button>
  );
}

function CampaignDetail({
  campaign,
  onBack,
}: {
  campaign?: CreatorCampaign;
  onBack: () => void;
}) {
  const progress = getProgress(campaign);
  const analyticEntries = Object.entries(campaign?.analyticData ?? {}).filter(
    ([, value]) => value !== undefined && value !== null,
  );

  if (!campaign) {
    return (
      <div className="flex min-h-[420px] flex-col items-center justify-center rounded-[28px] border border-white/10 bg-white/[0.035] p-8 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-3xl border border-[#D4AF37]/25 bg-[#D4AF37]/10 text-[#D4AF37]">
          <Search className="h-7 w-7" />
        </div>
        <h3 className="mt-5 text-2xl font-black text-white">
          Chọn một chiến dịch
        </h3>
        <p className="mt-2 max-w-md text-sm font-semibold leading-6 text-zinc-500">
          Bấm vào một mục trong danh sách để xem tiến độ, thời gian và các chỉ
          số phân tích mà hệ thống trả về.
        </p>
      </div>
    );
  }

  return (
    <article className="relative overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.045] p-6 shadow-[0_30px_90px_rgba(0,0,0,0.28)]">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_22%_0%,rgba(212,175,55,0.16),transparent_32%),radial-gradient(circle_at_92%_24%,rgba(96,165,250,0.12),transparent_36%)]" />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
            className="mb-5 cursor-pointer border-[#D4AF37]/25 bg-[#D4AF37]/10 px-4 text-[#F5D46E] hover:bg-[#D4AF37]/15"
          >
            <ArrowLeft className="h-4 w-4" />
            Danh sách
          </Button>
          <Badge variant="premium" className="mb-4">
            Campaign Detail
          </Badge>
          <h2 className="text-4xl font-black text-white">Chi tiết chiến dịch</h2>
          <p className="mt-2 text-sm font-semibold text-zinc-500">
            Campaign ID: {campaign.campaignId}
          </p>
        </div>
        <div className={cn("rounded-2xl border px-5 py-4", getStatusClass(campaign.status))}>
          <p className="text-xs font-bold uppercase tracking-[0.18em] opacity-70">
            Trạng thái
          </p>
          <p className="mt-1 flex items-center gap-2 text-xl font-black">
            <CheckCircle2 className="h-5 w-5" />
            {getStatusLabel(campaign.status)}
          </p>
        </div>
      </div>

      <div className="mt-7 rounded-2xl border border-white/10 bg-black/20 p-5">
        <div className="mb-3 flex items-center justify-between text-sm font-bold">
          <span className="text-zinc-400">Tiến độ chiến dịch</span>
          <span className="text-[#F5D46E]">{progress}%</span>
        </div>
        <Progress value={progress} />
        <div className="mt-4 grid gap-3 text-sm font-semibold text-zinc-400 sm:grid-cols-3">
          <span>{formatNumber(campaign.currentImpression)} lượt đã đạt</span>
          <span>{formatNumber(campaign.targetImpression)} lượt mục tiêu</span>
          <span>{formatNumber(getRemaining(campaign))} lượt còn lại</span>
        </div>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
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
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <DetailMetric
          icon={Hash}
          label="Mã đơn hàng"
          value={campaign.orderId ?? "Chưa có"}
        />
        <DetailMetric
          icon={Target}
          label="Gói tăng tương tác"
          value={campaign.engagementServiceId ?? "Chưa có"}
        />
      </div>

      <section className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-5">
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
  const [targetInput, setTargetInput] = useState("");
  const [sortBy, setSortBy] = useState<CreatorCampaignSortBy>("createdAt");
  const [sortDirection, setSortDirection] = useState<"ASC" | "DESC">("DESC");
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);

  const queryParams = useMemo(
    () => ({
      page,
      pageSize: PAGE_SIZE,
      sortBy,
      sortDirection,
      statuses: selectedStatus ? [selectedStatus] : undefined,
      targets: targetInput.trim() ? [targetInput.trim()] : undefined,
    }),
    [page, selectedStatus, sortBy, sortDirection, targetInput],
  );

  const campaignsQuery = useGetCreatorOwnCampaigns(queryParams);

  const campaigns = useMemo(
    () => campaignsQuery.data?.content ?? [],
    [campaignsQuery.data?.content],
  );
  const selectedCampaign = campaigns.find(
    (campaign) => campaign.campaignId === selectedCampaignId,
  );

  const stats = useMemo(() => {
    const activeCount = campaigns.filter((campaign) =>
      ["ACTIVE", "RUNNING"].includes(campaign.status ?? ""),
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
  const totalElements = campaignsQuery.data?.totalElements ?? 0;

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
        <div className="mb-4 flex items-center gap-3">
          <Filter className="h-5 w-5 text-[#D4AF37]" />
          <h2 className="text-xl font-black text-white">Bộ lọc chiến dịch</h2>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[1.1fr_1fr_1fr_1fr_auto]">
          <label className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-[0.16em] text-zinc-500">
              Target
            </span>
            <input
              value={targetInput}
              onChange={(event) => {
                setTargetInput(event.target.value);
                setPage(1);
              }}
              placeholder="Ví dụ: IMPRESSION"
              className="h-12 w-full rounded-2xl border border-white/10 bg-black/25 px-4 text-sm font-semibold text-zinc-100 outline-none transition focus:border-[#D4AF37]/45"
            />
          </label>

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

          <Button
            type="button"
            variant="outline"
            className="mt-6 h-12 cursor-pointer rounded-2xl border-white/10 bg-white/[0.05] px-4 text-zinc-200 hover:bg-white/[0.08]"
            onClick={() => {
              setTargetInput("");
              setSelectedStatus("");
              setSortBy("createdAt");
              setSortDirection("DESC");
              setPage(1);
            }}
          >
            <RefreshCw className="h-4 w-4" />
            Đặt lại
          </Button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[460px_1fr]">
        <aside className="rounded-[28px] border border-white/10 bg-white/[0.035] p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-black text-white">Danh sách</h2>
              <p className="mt-1 text-sm font-semibold text-zinc-500">
                {formatNumber(totalElements)} chiến dịch
              </p>
            </div>
            {campaignsQuery.isFetching ? (
              <RefreshCw className="h-5 w-5 animate-spin text-[#D4AF37]" />
            ) : null}
          </div>

          <div className="mt-5 space-y-4">
            {campaignsQuery.isLoading ? (
              Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={index}
                  className="h-56 animate-pulse rounded-2xl border border-white/10 bg-white/[0.05]"
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
                  selected={campaign.campaignId === selectedCampaignId}
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
                  Khi bạn mua gói tăng tương tác, chiến dịch sẽ xuất hiện tại
                  đây để theo dõi.
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
        </aside>

        <CampaignDetail
          campaign={selectedCampaign}
          onBack={() => setSelectedCampaignId(null)}
        />
      </div>
    </section>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
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
          className="h-12 w-full cursor-pointer appearance-none rounded-2xl border border-white/10 bg-black/25 px-4 pr-10 text-sm font-semibold text-zinc-100 outline-none transition focus:border-[#D4AF37]/45"
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
