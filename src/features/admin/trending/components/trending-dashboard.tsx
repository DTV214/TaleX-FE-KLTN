"use client";

import {
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  RotateCcw,
  X,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { toast } from "sonner";
import {
  useAdminTrendingCandidates,
  useAdminTrendingCards,
  useAdminTrendingConfig,
  useAdminTrendingEvaluatedSeries,
  useAdminTrendingPool,
  useCreateAdminTrendingConfig,
  useForceTrendingThreshold,
  useTriggerTrendingChannelsPool,
  useUpdateAdminTrendingConfig,
} from "../hooks/use-admin-trending";
import type {
  TrendingConfig,
  TrendingConfigRequest,
  TrendingEvaluationStatus,
  TrendingSeries,
} from "../types/trending.types";

const DEFAULT_CONFIG_FORM: TrendingConfigRequest = {
  minBatch: 1,
  percentile: 1,
  minImpression: 50,
  maxImpression: 100,
  gravity: 0.1,
};

const POOL_PAGE_SIZE = 5;

const EVALUATED_STATUS_OPTIONS: Array<{
  label: string;
  value: TrendingEvaluationStatus | "SUCCESS";
}> = [
    { label: "Thành công", value: "SUCCESS" },
    { label: "Thất bại", value: "FAILED" },
  ];

const CONFIG_FIELD_HELP: Record<keyof TrendingConfigRequest, string> = {
  minBatch:
    "Số lượng series tối thiểu đã thực hiện xong vòng 1 để hệ thống tự động kích hoạt tính toán điểm mốc xu hướng trên toàn hệ thống.",
  percentile:
    "Ngưỡng phân vị dùng để suy ra điểm mốc xu hướng trong tập dữ liệu hiện tại. Ví dụ phân vị là 60 thì điểm mốc xu hướng tại vị trí phân vị 60 sẽ đảm bảo có 40% series có số điểm lớn hơn mốc này và 60% còn lại thì nhỏ hơn.",
  minImpression:
    "Số lượt hiển thị tối thiểu cần đạt để series được chấm điểm và so sánh với điểm mốc xu hướng.",
  maxImpression:
    "Số lượt hiển thị tối đa của series trong vòng phân phối.",
  gravity:
    "Hệ số điều chỉnh tốc độ suy giảm điểm số của series theo thời gian. Giá trị càng lớn thì điểm số series giảm cực kì nhanh theo thời gian, ngược lại điểm số càng nhỏ thì các series có hạng cao sẽ được giữ lâu hơn.",
};

const CONFIG_EXTRA_HELP = {
  impressionRange:
    "Khoảng lượt hiển thị tối thiểu và tối đa mà hệ thống dùng cho vòng phân phối.",
  totalBatch: "Tổng số series đã chấm điểm xong vòng 1.",
  currentBatch: "Số series hiện tại cho đến khi đạt số lượng lô tối thiểu để tính lại điểm mốc xu hướng.",
  threshold: "Điểm mốc xu hướng hệ thống đang áp dụng sau khi tính toán cấu hình.",
};

function toNumber(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function formatNumber(value: unknown) {
  return new Intl.NumberFormat("vi-VN").format(toNumber(value));
}

function formatScore(value: unknown) {
  return toNumber(value).toLocaleString("vi-VN", {
    maximumFractionDigits: 4,
  });
}

function formatDate(value?: string | null) {
  if (!value) return "Chưa cập nhật";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

function getStatusLabel(status?: string | null) {
  switch (status) {
    case "ON_GOING":
      return "Đang phân phối";
    case "COMPLETED":
      return "Hoàn tất";
    case "PENDING":
      return "Đang chờ";
    case "FAILED":
      return "Lỗi";
    default:
      return status || "Chưa rõ";
  }
}

function getStatusClassName(status?: string | null) {
  switch (status) {
    case "ON_GOING":
      return "border-emerald-200 bg-emerald-50 text-emerald-700 backoffice-dark:border-emerald-400/30 backoffice-dark:bg-emerald-400/10 backoffice-dark:text-emerald-200";
    case "COMPLETED":
      return "border-sky-200 bg-sky-50 text-sky-700 backoffice-dark:border-sky-400/30 backoffice-dark:bg-sky-400/10 backoffice-dark:text-sky-200";
    case "FAILED":
      return "border-red-200 bg-red-50 text-red-700 backoffice-dark:border-red-400/30 backoffice-dark:bg-red-400/10 backoffice-dark:text-red-200";
    default:
      return "border-slate-200 bg-slate-100 text-slate-600 backoffice-dark:border-white/10 backoffice-dark:bg-white/8 backoffice-dark:text-white/70";
  }
}

function FieldHelp({ children }: { children: ReactNode }) {
  return (
    <span className="group relative inline-flex">
      <HelpCircle className="h-4 w-4 cursor-help text-slate-400 transition-colors group-hover:text-amber-500 backoffice-dark:text-white/50 backoffice-dark:group-hover:text-[var(--backoffice-primary)]" />
      <span className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 w-72 -translate-x-1/2 rounded-xl border border-slate-200 bg-white p-3 text-xs font-medium leading-relaxed text-slate-600 opacity-0 shadow-xl transition-opacity group-hover:opacity-100 backoffice-dark:border-white/10 backoffice-dark:bg-[#111113] backoffice-dark:text-white/75">
        {children}
      </span>
    </span>
  );
}

function PageShell({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      {children}
    </div>
  );
}

function Panel({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-3xl border border-slate-200 bg-white shadow-sm backoffice-dark:border-white/10 backoffice-dark:bg-[linear-gradient(135deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] backoffice-dark:shadow-[0_24px_70px_rgba(0,0,0,0.35)] ${className}`}
    >
      {children}
    </section>
  );
}

function MetricCard({
  helper,
  label,
  tooltip,
  value,
}: {
  helper?: ReactNode;
  label: string;
  tooltip?: ReactNode;
  value: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-sm transition hover:border-slate-300 hover:bg-white backoffice-dark:border-white/10 backoffice-dark:bg-black/25 backoffice-dark:hover:border-white/20 backoffice-dark:hover:bg-white/[0.06]">
      <div className="flex min-h-4 items-center gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500 backoffice-dark:text-white/45">
          {label}
        </p>
        {tooltip ? <FieldHelp>{tooltip}</FieldHelp> : null}
      </div>
      <p className="mt-2 whitespace-nowrap text-2xl font-semibold tracking-tight text-slate-950 backoffice-dark:text-white">
        {value}
      </p>
      {helper && (
        <p className="mt-1 text-xs font-medium text-slate-400 backoffice-dark:text-white/45">
          {helper}
        </p>
      )}
    </div>
  );
}

function ConfigSummary({ config }: { config: TrendingConfig | null }) {
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      <MetricCard
        label="Lô tối thiểu"
        tooltip={CONFIG_FIELD_HELP.minBatch}
        value={config ? formatNumber(config.minBatch) : "-"}
      />
      <MetricCard
        label="Ngưỡng phân vị"
        tooltip={CONFIG_FIELD_HELP.percentile}
        value={config ? `${formatScore(config.percentile)}%` : "-"}
      />
      <MetricCard
        label="Lượt hiển thị"
        tooltip={CONFIG_EXTRA_HELP.impressionRange}
        value={
          config
            ? `${formatNumber(config.minImpression)} - ${formatNumber(
              config.maxImpression,
            )}`
            : "-"
        }
      />
      <MetricCard
        label="Hệ số trọng lực"
        tooltip={CONFIG_FIELD_HELP.gravity}
        value={config ? formatScore(config.gravity) : "-"}
      />
    </div>
  );
}

function ConfigFormModal({
  config,
  isSubmitting,
  onClose,
  onSubmit,
}: {
  config: TrendingConfig | null;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (payload: TrendingConfigRequest) => void;
}) {
  const [form, setForm] = useState<TrendingConfigRequest>(
    config
      ? {
        minBatch: config.minBatch,
        percentile: config.percentile,
        minImpression: config.minImpression,
        maxImpression: config.maxImpression,
        gravity: config.gravity,
      }
      : DEFAULT_CONFIG_FORM,
  );

  const handleChange = (field: keyof TrendingConfigRequest, value: string) => {
    setForm((current) => ({ ...current, [field]: Number(value) }));
  };

  const handleSubmit = () => {
    if (form.minBatch < 1) {
      toast.error("Min batch phải lớn hơn hoặc bằng 1.");
      return;
    }
    if (form.percentile <= 0 || form.percentile > 100) {
      toast.error("Percentile phải nằm trong khoảng 1 - 100.");
      return;
    }
    if (form.minImpression < 0 || form.maxImpression < form.minImpression) {
      toast.error("Khoảng impression chưa hợp lệ.");
      return;
    }
    if (form.gravity <= 0) {
      toast.error("Gravity phải lớn hơn 0.");
      return;
    }
    onSubmit(form);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl backoffice-dark:border-white/10 backoffice-dark:bg-[#121213]">
        <div className="flex items-start justify-between border-b border-slate-200 p-6 backoffice-dark:border-white/10">
          <div>
            <h2 className="mt-2 text-2xl font-bold text-slate-950 backoffice-dark:text-white">
              {config ? "Cập nhật cấu hình xu hướng" : "Tạo cấu hình xu hướng"}
            </h2>

          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 backoffice-dark:hover:bg-white/10 backoffice-dark:hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid gap-4 p-6 sm:grid-cols-2">
          {(
            [
              ["minBatch", "Lô tối thiểu", "1"],
              ["percentile", "Ngưỡng phân vị", "40"],
              ["minImpression", "Hiển thị tối thiểu", "100"],
              ["maxImpression", "Hiển thị tối đa", "200"],
              ["gravity", "Hệ số trọng lực", "1.8"],
            ] as const
          ).map(([field, label, placeholder]) => (
            <label key={field} className="space-y-2">
              <span className="flex items-center gap-2 text-sm font-semibold text-slate-700 backoffice-dark:text-white/80">
                {label}
                <FieldHelp>{CONFIG_FIELD_HELP[field]}</FieldHelp>
              </span>
              <input
                type="number"
                step={field === "gravity" ? "0.1" : "1"}
                value={form[field]}
                placeholder={placeholder}
                onChange={(event) => handleChange(field, event.target.value)}
                className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-900 outline-none transition focus:border-amber-400 focus:ring-4 focus:ring-amber-100 backoffice-dark:border-white/10 backoffice-dark:bg-black/30 backoffice-dark:text-white backoffice-dark:focus:border-[var(--backoffice-primary)] backoffice-dark:focus:ring-[var(--backoffice-primary-soft)]"
              />
            </label>
          ))}
        </div>

        <div className="flex justify-end gap-3 border-t border-slate-200 bg-slate-50 p-5 backoffice-dark:border-white/10 backoffice-dark:bg-black/25">
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-white backoffice-dark:border-white/10 backoffice-dark:text-white/70 backoffice-dark:hover:bg-white/10"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 rounded-2xl bg-amber-400 px-6 py-3 text-sm font-bold text-slate-950 shadow-lg shadow-amber-500/20 transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {config ? "Lưu thay đổi" : "Tạo cấu hình"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ConfirmForceModal({
  isOpen,
  isSubmitting,
  onClose,
  onConfirm,
}: {
  isOpen: boolean;
  isSubmitting: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl backoffice-dark:border-white/10 backoffice-dark:bg-[#121213]">
        <h2 className="text-xl font-bold text-slate-950 backoffice-dark:text-white">
          Cập nhập điểm mốc?
        </h2>
        <p className="mt-2 text-sm font-medium leading-relaxed text-slate-500 backoffice-dark:text-white/55">
          Hành động này gọi API force-threshold để hệ thống áp dụng lại cấu hình
          trending đang có cho dữ liệu phân phối.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 backoffice-dark:border-white/10 backoffice-dark:text-white/70 backoffice-dark:hover:bg-white/10"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 rounded-2xl bg-amber-400 px-5 py-3 text-sm font-bold text-slate-950 shadow-lg shadow-amber-500/20 transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            Áp dụng
          </button>
        </div>
      </div>
    </div>
  );
}

function SeriesThumb({ series }: { series: TrendingSeries }) {
  const imageUrl = series.coverUrl || series.bannerUrl;

  return (
    <div className="h-16 w-24 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 backoffice-dark:border-white/10 backoffice-dark:bg-white/5">
      {imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- Admin preview uses backend-provided remote URLs that may not be listed in next/image config.
        <img
          src={imageUrl}
          alt={series.title}
          className="h-full w-full object-cover"
          loading="lazy"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-slate-400">
          No image
        </div>
      )}
    </div>
  );
}

function SeriesTable({
  emptyText,
  isLoading,
  items,
  variant = "metrics",
}: {
  emptyText: string;
  isLoading: boolean;
  items: TrendingSeries[];
  variant?: "metrics" | "cards";
}) {
  if (isLoading) {
    return (
      <div className="flex min-h-[260px] items-center justify-center rounded-3xl border border-dashed border-slate-200 text-slate-500 backoffice-dark:border-white/10 backoffice-dark:text-white/55">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Đang tải dữ liệu xu hướng...
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="flex min-h-[220px] flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-slate-50/50 text-center backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.03]">
        <p className="text-base font-bold text-slate-800 backoffice-dark:text-white">
          Chưa có dữ liệu
        </p>
        <p className="mt-1 text-sm font-medium text-slate-500 backoffice-dark:text-white/55">
          {emptyText}
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 backoffice-dark:border-white/10">
      <div className="overflow-x-auto">
        <table className="min-w-[1100px] w-full border-collapse">
          <thead className="bg-slate-50 text-left backoffice-dark:bg-white/5">
            <tr className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500 backoffice-dark:text-white/45">
              <th className="px-5 py-4">Series</th>
              {variant === "cards" ? (
                <>
                  <th className="px-5 py-4">Lượt hiển thị</th>
                  <th className="px-5 py-4">Lượt xem</th>
                  <th className="px-5 py-4">Lượt tương tác</th>
                  <th className="px-5 py-4">Lượt đánh giá</th>
                  <th className="px-5 py-4">Điểm xếp hạng</th>
                </>
              ) : (
                <>
                  <th className="px-5 py-4">Lượt hiển thị</th>
                  <th className="px-5 py-4">Lượt xem</th>
                  <th className="px-5 py-4">Tỷ lệ xem</th>
                  <th className="px-5 py-4">Điểm Wilson</th>
                </>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 backoffice-dark:divide-white/10">
            {items.map((series) => {
              const trending = series.trendingAnalyticData ?? {};

              return (
                <tr
                  key={series.seriesId}
                  className="bg-white transition hover:bg-slate-50/80 backoffice-dark:bg-transparent backoffice-dark:hover:bg-white/[0.05]"
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-4">
                      <SeriesThumb series={series} />
                      <div className="min-w-0">
                        <p className="max-w-[150px] truncate text-sm font-bold text-slate-950 backoffice-dark:text-white">
                          {series.title || "Chưa có tiêu đề"}
                        </p>

                      </div>
                    </div>
                  </td>
                  {variant === "cards" ? (
                    <>
                      <td className="px-5 py-4 text-sm font-semibold text-slate-800 backoffice-dark:text-white/85">
                        {formatNumber(series.trendingAnalyticData?.totalImpression)}
                      </td>
                      <td className="px-5 py-4 text-sm font-semibold text-slate-800 backoffice-dark:text-white/85">
                        {formatNumber(series.trendingAnalyticData?.engageClick)}
                      </td>
                      <td className="px-5 py-4 text-sm font-semibold text-slate-600 backoffice-dark:text-white/65">
                        {formatNumber(series.trendingAnalyticData?.interactionClick)}
                      </td>
                      <td className="px-5 py-4 text-sm font-semibold text-slate-600  backoffice-dark:text-[var(--backoffice-primary)]">
                        {formatNumber(series.ratingCount)}
                      </td>
                      <td className="px-5 py-4 text-sm font-semibold text-amber-600 backoffice-dark:text-white/65">
                        {formatScore(series.rankingScore)}
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-5 py-4 text-sm font-semibold text-slate-800 backoffice-dark:text-white/85">
                        {formatNumber(trending.totalImpression)}
                      </td>
                      <td className="px-5 py-4 text-sm font-semibold text-slate-600 backoffice-dark:text-white/65">
                        {formatNumber(trending.engageClick)}
                      </td>
                      <td className="px-5 py-4 text-sm font-semibold text-slate-800 backoffice-dark:text-white/85">
                        {formatScore(trending.sampleRatio)}
                      </td>
                      <td className="px-5 py-4 text-sm font-semibold  text-amber-600 backoffice-dark:text-white/65">
                        {formatScore(series.wilsonScore)}
                      </td>
                    </>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function AdminTrendingDashboard() {
  const [isConfigFormOpen, setIsConfigFormOpen] = useState(false);
  const [isForceConfirmOpen, setIsForceConfirmOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"candidates" | "evaluated" | "pool">(
    "candidates",
  );
  const [poolRound, setPoolRound] = useState<"round1" | "round2">("round1");
  const [poolPage, setPoolPage] = useState(1);
  const [candidatePage, setCandidatePage] = useState(0);
  const [candidateSize, setCandidateSize] = useState(5);
  const [evaluatedPage, setEvaluatedPage] = useState(0);
  const [evaluatedSize, setEvaluatedSize] = useState(5);
  const [evaluatedStatus, setEvaluatedStatus] = useState<
    TrendingEvaluationStatus | "SUCCESS"
  >("SUCCESS");

  const configQuery = useAdminTrendingConfig();
  const createConfigMutation = useCreateAdminTrendingConfig();
  const updateConfigMutation = useUpdateAdminTrendingConfig();
  const forceThresholdMutation = useForceTrendingThreshold();
  const triggerChannelsPoolMutation = useTriggerTrendingChannelsPool();
  const candidatesQuery = useAdminTrendingCandidates({
    page: candidatePage,
    size: candidateSize,
  });
  const evaluatedQuery = useAdminTrendingEvaluatedSeries({
    page: evaluatedPage,
    size: evaluatedSize,
    statuses: evaluatedStatus === "ALL" ? undefined : [evaluatedStatus],
  });
  const poolQuery = useAdminTrendingPool();
  const trendingCardsQuery = useAdminTrendingCards();

  const config = configQuery.data ?? null;
  const candidates = candidatesQuery.data ?? [];
  const evaluatedPageData = evaluatedQuery.data;
  const evaluatedSeries = evaluatedPageData?.content ?? [];
  const pool = poolQuery.data ?? [];
  const trendingCards = trendingCardsQuery.data ?? [];
  const isRoundOne = poolRound === "round1";
  const distributionTitle = isRoundOne
    ? "Kênh phân phối thử"
    : "Kênh xu hướng";
  const poolItems = poolRound === "round1" ? pool : trendingCards;
  const poolTotalPages = Math.max(1, Math.ceil(poolItems.length / POOL_PAGE_SIZE));
  const safePoolPage = Math.min(poolPage, poolTotalPages);
  const evaluatedTotalPages = Math.max(1, evaluatedPageData?.totalPages ?? 1);
  const evaluatedPageNumber = evaluatedPageData?.pageNumber ?? evaluatedPage;
  const isEvaluatedFirst = Boolean(evaluatedPageData?.isFirst) || evaluatedPageNumber <= 0;
  const isEvaluatedLast =
    Boolean(evaluatedPageData?.isLast) ||
    evaluatedPageNumber >= evaluatedTotalPages - 1 ||
    evaluatedSeries.length < evaluatedSize;
  const paginatedPoolItems = poolItems.slice(
    (safePoolPage - 1) * POOL_PAGE_SIZE,
    safePoolPage * POOL_PAGE_SIZE,
  );
  const activeItems =
    activeTab === "candidates" && isRoundOne
      ? candidates
      : activeTab === "evaluated" && isRoundOne
        ? evaluatedSeries
        : paginatedPoolItems;
  const isActiveLoading =
    activeTab === "candidates" && isRoundOne
      ? candidatesQuery.isLoading
      : activeTab === "evaluated" && isRoundOne
        ? evaluatedQuery.isLoading
        : poolRound === "round1"
          ? poolQuery.isLoading
          : trendingCardsQuery.isLoading;

  const handleSubmitConfig = (payload: TrendingConfigRequest) => {
    const mutation = config ? updateConfigMutation : createConfigMutation;

    mutation.mutate(payload, {
      onSuccess: () => {
        toast.success(
          config
            ? "Đã cập nhật cấu hình xu hướng."
            : "Đã tạo cấu hình xu hướng.",
        );
        setIsConfigFormOpen(false);
      },
      onError: (error) => {
        toast.error(
          error instanceof Error
            ? error.message
            : "Không thể lưu cấu hình xu hướng.",
        );
      },
    });
  };

  const handleForceThreshold = () => {
    forceThresholdMutation.mutate(undefined, {
      onSuccess: () => {
        toast.success("Đã áp dụng lại ngưỡng trending hiện tại.");
        setIsForceConfirmOpen(false);
      },
      onError: (error) => {
        toast.error(
          error instanceof Error
            ? error.message
            : "Không thể áp dụng ngưỡng trending.",
        );
      },
    });
  };

  const handleTriggerChannelsPool = () => {
    triggerChannelsPoolMutation.mutate(undefined, {
      onSuccess: () => {
        toast.success("Đã kích hoạt cập nhật lại kênh phân phối.");
        setPoolPage(1);
      },
      onError: (error) => {
        toast.error(
          error instanceof Error
            ? error.message
            : "Không thể cập nhật lại kênh phân phối.",
        );
      },
    });
  };

  const handleSelectRound = (round: "round1" | "round2") => {
    setPoolRound(round);
    setPoolPage(1);
    setActiveTab(round === "round1" ? "candidates" : "pool");
  };

  return (
    <PageShell>
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-950 backoffice-dark:text-white">
          Quản lý Xu hướng
        </h1>
        <p className="mt-2 max-w-3xl text-sm font-medium leading-6 text-slate-500 backoffice-dark:text-white/55">
          Theo dõi cấu hình phân phối, ứng viên chờ vào kênh và danh sách
          series đang được hệ thống đẩy xu hướng.
        </p>
      </div>
      {/* <section className="flex flex-col gap-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.04] lg:flex-row lg:items-end lg:justify-between">

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:w-[520px]">
          <MetricCard
            label="Ứng viên"
            value={formatNumber(candidates.length)}
          />
          <MetricCard
            label="Trong pool"
            value={formatNumber(pool.length)}
          />
          <MetricCard
            label="Impression"
            value={formatNumber(currentTotals.impression)}
          />
          <MetricCard
            label="Click"
            value={formatNumber(
              currentTotals.engageClick + currentTotals.interactionClick,
            )}
          />
        </div>
      </section> */}

      <Panel className="p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="mt-1 text-2xl font-bold text-amber-500 backoffice-dark:text-white">
              Cấu hình phân phối
            </h2>
            <h2 className="mt-1 text-xl font-bold text-slate-950 backoffice-dark:text-white">
              {config ? null : "Chưa có config trending"}
            </h2>
            <p className="mt-1 text-sm font-medium text-slate-500 backoffice-dark:text-white/55">
              {config
                ? `Cập nhật lần cuối: ${formatDate(config.updatedAt)}`
                : "Tạo config đầu tiên để hệ thống có tham số phân phối xu hướng."}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            {config && (
              <button
                type="button"
                onClick={() => setIsForceConfirmOpen(true)}
                disabled={forceThresholdMutation.isPending}
                className="inline-flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm font-semibold text-amber-700 transition hover:bg-amber-100 disabled:opacity-60 backoffice-dark:border-[var(--backoffice-primary-soft)] backoffice-dark:bg-[var(--backoffice-primary-soft)] backoffice-dark:text-[var(--backoffice-primary)] backoffice-dark:hover:bg-[rgba(214,184,79,0.18)]"
              >
                <RotateCcw className="h-4 w-4" />
                Cập nhập điểm mốc
              </button>
            )}
            <button
              type="button"
              onClick={() => setIsConfigFormOpen(true)}
              disabled={configQuery.isLoading}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60 backoffice-dark:bg-[var(--backoffice-primary)] backoffice-dark:text-black backoffice-dark:hover:bg-[var(--backoffice-primary-bright)]"
            >
              {config ? <Pencil className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              {config ? "Sửa cấu hình" : "Tạo cấu hình"}
            </button>
          </div>
        </div>

        <div className="mt-6">
          {configQuery.isLoading ? (
            <div className="flex h-32 items-center justify-center rounded-3xl border border-dashed border-slate-200 text-slate-500 backoffice-dark:border-white/10 backoffice-dark:text-white/55">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Đang tải cấu hình...
            </div>
          ) : (
            <ConfigSummary config={config} />
          )}
        </div>

        {config && (
          <div className="mt-4 grid gap-3 rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm font-semibold text-slate-500 backoffice-dark:border-white/10 backoffice-dark:bg-black/20 backoffice-dark:text-white/55 md:grid-cols-3">
            <div className="flex items-center justify-between gap-3 rounded-2xl bg-white px-4 py-3 backoffice-dark:bg-white/[0.04]">
              <span className="flex items-center gap-2">
                Tổng lô ghi nhận
                <FieldHelp>{CONFIG_EXTRA_HELP.totalBatch}</FieldHelp>
              </span>
              <span className="whitespace-nowrap text-slate-950 backoffice-dark:text-white">
                {formatNumber(config.totalBatch)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3 rounded-2xl bg-white px-4 py-3 backoffice-dark:bg-white/[0.04]">
              <span className="flex items-center gap-2">
                Lô hiện tại
                <FieldHelp>{CONFIG_EXTRA_HELP.currentBatch}</FieldHelp>
              </span>
              <span className="whitespace-nowrap text-slate-950 backoffice-dark:text-white">
                {formatNumber(config.currentBatch)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3 rounded-2xl bg-white px-4 py-3 backoffice-dark:bg-white/[0.04]">
              <span className="flex items-center gap-2">
                Điểm mốc xu hướng
                <FieldHelp>{CONFIG_EXTRA_HELP.threshold}</FieldHelp>
              </span>
              <span className="whitespace-nowrap text-slate-950 backoffice-dark:text-white">
                {formatScore(config.threshold)}
              </span>
            </div>
          </div>
        )}
      </Panel>

      <div className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white p-3 shadow-sm backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.04] sm:flex-row sm:items-center sm:justify-between">

        <div className="inline-flex rounded-2xl border border-slate-200 bg-slate-100 p-1 backoffice-dark:border-white/10 backoffice-dark:bg-black/25">
          {[
            { label: "Vòng 1", value: "round1" as const },
            { label: "Vòng 2", value: "round2" as const },
          ].map((round) => (
            <button
              key={round.value}
              type="button"
              onClick={() => handleSelectRound(round.value)}
              className={`rounded-xl px-5 py-2.5 text-sm font-bold transition ${poolRound === round.value
                ? "bg-slate-950 text-white shadow-sm backoffice-dark:bg-[var(--backoffice-primary)] backoffice-dark:text-black"
                : "text-slate-500 hover:text-slate-900 backoffice-dark:text-white/55 backoffice-dark:hover:text-white"
                }`}
            >
              {round.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={handleTriggerChannelsPool}
          disabled={triggerChannelsPoolMutation.isPending}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 backoffice-dark:bg-[var(--backoffice-primary)] backoffice-dark:text-black backoffice-dark:hover:bg-[var(--backoffice-primary-bright)]"
        >
          {triggerChannelsPoolMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RotateCcw className="h-4 w-4" />
          )}
          Cập nhật lại kênh
        </button>
      </div>

      <Panel className="p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h2 className="mt-1 text-2xl font-bold text-amber-500 backoffice-dark:text-white">
              {distributionTitle}
            </h2>

          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            {isRoundOne && (
              <div className="inline-flex rounded-2xl border border-slate-200 bg-slate-100 p-1 backoffice-dark:border-white/10 backoffice-dark:bg-black/25">
                <button
                  type="button"
                  onClick={() => setActiveTab("candidates")}
                  className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${activeTab === "candidates"
                    ? "bg-white text-slate-950 shadow-sm backoffice-dark:bg-[var(--backoffice-primary)] backoffice-dark:text-black"
                    : "text-slate-500 hover:text-slate-900 backoffice-dark:text-white/55 backoffice-dark:hover:text-white"
                    }`}
                >
                  Ứng viên
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("pool")}
                  className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${activeTab === "pool"
                    ? "bg-white text-slate-950 shadow-sm backoffice-dark:bg-[var(--backoffice-primary)] backoffice-dark:text-black"
                    : "text-slate-500 hover:text-slate-900 backoffice-dark:text-white/55 backoffice-dark:hover:text-white"
                    }`}
                >
                  Đang phân phối
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("evaluated")}
                  className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${activeTab === "evaluated"
                    ? "bg-white text-slate-950 shadow-sm backoffice-dark:bg-[var(--backoffice-primary)] backoffice-dark:text-black"
                    : "text-slate-500 hover:text-slate-900 backoffice-dark:text-white/55 backoffice-dark:hover:text-white"
                    }`}
                >
                  Đã đánh giá
                </button>
              </div>
            )}
            <button
              type="button"
              onClick={() => {
                candidatesQuery.refetch();
                evaluatedQuery.refetch();
                poolQuery.refetch();
                trendingCardsQuery.refetch();
              }}
              disabled={
                candidatesQuery.isFetching ||
                evaluatedQuery.isFetching ||
                poolQuery.isFetching ||
                trendingCardsQuery.isFetching
              }
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 backoffice-dark:border-white/10 backoffice-dark:text-white/70 backoffice-dark:hover:bg-white/10"
            >
              <RefreshCw
                className={`h-4 w-4 ${candidatesQuery.isFetching ||
                  evaluatedQuery.isFetching ||
                  poolQuery.isFetching ||
                  trendingCardsQuery.isFetching
                  ? "animate-spin"
                  : ""
                  }`}
              />
            </button>
          </div>
        </div>

        {activeTab === "evaluated" && isRoundOne && (
          <div className="mt-5 flex flex-col gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-4 backoffice-dark:border-white/10 backoffice-dark:bg-black/20 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400 backoffice-dark:text-white/40">
                Bộ lọc
              </p>
              <p className="mt-1 text-sm font-bold text-slate-700 backoffice-dark:text-white/75">
                Trạng thái đánh giá vòng 1
              </p>
            </div>
            <select
              value={evaluatedStatus}
              onChange={(event) => {
                setEvaluatedStatus(
                  event.target.value as TrendingEvaluationStatus | "SUCCESS",
                );
                setEvaluatedPage(0);
              }}
              className="h-11 min-w-56 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 outline-none transition hover:border-slate-300 backoffice-dark:border-white/10 backoffice-dark:bg-black/30 backoffice-dark:text-white backoffice-dark:hover:border-white/20"
            >
              {EVALUATED_STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="mt-5">
          <SeriesTable
            emptyText={
              activeTab === "candidates" && isRoundOne
                ? "Không có ứng viên chờ phân phối trong trang hiện tại."
                : activeTab === "evaluated" && isRoundOne
                  ? "Chưa có series nào hoàn tất đánh giá vòng 1 theo bộ lọc hiện tại."
                  : poolRound === "round1"
                    ? "Pool New Releases hiện chưa có series đang phân phối."
                    : "Kênh Trending vòng 2 hiện chưa có series cards."
            }
            isLoading={isActiveLoading}
            items={activeItems}
            variant={activeTab === "pool" && poolRound === "round2" ? "cards" : "metrics"}
          />
        </div>

        {activeTab === "candidates" && isRoundOne && (
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 ">
            <div className="text-sm font-bold text-slate-500 backoffice-dark:text-white/55">
              Trang {candidatePage + 1}
            </div>
            <div className="flex items-center gap-2">
              <select
                value={candidateSize}
                onChange={(event) => {
                  setCandidateSize(Number(event.target.value));
                  setCandidatePage(0);
                }}
                className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 outline-none backoffice-dark:border-white/10 backoffice-dark:bg-black/30 backoffice-dark:text-white"
              >
                <option value={5}>5 / trang</option>
                <option value={10}>10 / trang</option>
                <option value={20}>20 / trang</option>
              </select>
              <button
                type="button"
                onClick={() => setCandidatePage((page) => Math.max(0, page - 1))}
                disabled={candidatePage === 0 || candidatesQuery.isFetching}
                className="rounded-xl border border-slate-200 p-2 text-slate-500 transition hover:bg-white hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-40 backoffice-dark:border-white/10 backoffice-dark:hover:bg-white/10 backoffice-dark:hover:text-white"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => setCandidatePage((page) => page + 1)}
                disabled={
                  candidatesQuery.isFetching || candidates.length < candidateSize
                }
                className="rounded-xl border border-slate-200 p-2 text-slate-500 transition hover:bg-white hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-40 backoffice-dark:border-white/10 backoffice-dark:hover:bg-white/10 backoffice-dark:hover:text-white"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}

        {activeTab === "evaluated" && isRoundOne && (
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm font-bold text-slate-500 backoffice-dark:text-white/55">
              {evaluatedPageData
                ? `Trang ${evaluatedPageNumber + 1} / ${evaluatedTotalPages} · ${formatNumber(
                  evaluatedPageData.totalElements,
                )} series`
                : "Đang tải danh sách đã đánh giá"}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={evaluatedSize}
                onChange={(event) => {
                  setEvaluatedSize(Number(event.target.value));
                  setEvaluatedPage(0);
                }}
                className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 outline-none backoffice-dark:border-white/10 backoffice-dark:bg-black/30 backoffice-dark:text-white"
              >
                <option value={5}>5 / trang</option>
                <option value={10}>10 / trang</option>
                <option value={20}>20 / trang</option>
              </select>
              <button
                type="button"
                onClick={() => setEvaluatedPage((page) => Math.max(0, page - 1))}
                disabled={isEvaluatedFirst || evaluatedQuery.isFetching}
                className="rounded-xl border border-slate-200 p-2 text-slate-500 transition hover:bg-white hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-40 backoffice-dark:border-white/10 backoffice-dark:hover:bg-white/10 backoffice-dark:hover:text-white"
                aria-label="Trang trước của danh sách đã đánh giá"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() =>
                  setEvaluatedPage((page) =>
                    Math.min(evaluatedTotalPages - 1, page + 1),
                  )
                }
                disabled={isEvaluatedLast || evaluatedQuery.isFetching}
                className="rounded-xl border border-slate-200 p-2 text-slate-500 transition hover:bg-white hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-40 backoffice-dark:border-white/10 backoffice-dark:hover:bg-white/10 backoffice-dark:hover:text-white"
                aria-label="Trang sau của danh sách đã đánh giá"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}

        {activeTab === "pool" && (
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm font-bold text-slate-500 backoffice-dark:text-white/55">
              {poolItems.length === 0
                ? "Chưa có series"
                : `Hiển thị ${(safePoolPage - 1) * POOL_PAGE_SIZE + 1
                }-${Math.min(safePoolPage * POOL_PAGE_SIZE, poolItems.length)} / ${poolItems.length
                } series`}
            </div>
            <div className="flex items-center gap-2">
              <span className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-500 backoffice-dark:border-white/10 backoffice-dark:bg-black/30 backoffice-dark:text-white/55">
                5 / trang
              </span>
              <button
                type="button"
                onClick={() => setPoolPage((page) => Math.max(1, page - 1))}
                disabled={safePoolPage <= 1 || isActiveLoading}
                className="rounded-xl border border-slate-200 p-2 text-slate-500 transition hover:bg-white hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-40 backoffice-dark:border-white/10 backoffice-dark:hover:bg-white/10 backoffice-dark:hover:text-white"
                aria-label="Trang trước của kênh phân phối"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <span className="min-w-20 text-center text-sm font-bold text-slate-500 backoffice-dark:text-white/55">
                Trang {safePoolPage}/{poolTotalPages}
              </span>
              <button
                type="button"
                onClick={() =>
                  setPoolPage((page) => Math.min(poolTotalPages, page + 1))
                }
                disabled={safePoolPage >= poolTotalPages || isActiveLoading}
                className="rounded-xl border border-slate-200 p-2 text-slate-500 transition hover:bg-white hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-40 backoffice-dark:border-white/10 backoffice-dark:hover:bg-white/10 backoffice-dark:hover:text-white"
                aria-label="Trang sau của kênh phân phối"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}
      </Panel>

      {isConfigFormOpen && (
        <ConfigFormModal
          config={config}
          isSubmitting={
            createConfigMutation.isPending || updateConfigMutation.isPending
          }
          onClose={() => setIsConfigFormOpen(false)}
          onSubmit={handleSubmitConfig}
        />
      )}
      <ConfirmForceModal
        isOpen={isForceConfirmOpen}
        isSubmitting={forceThresholdMutation.isPending}
        onClose={() => setIsForceConfirmOpen(false)}
        onConfirm={handleForceThreshold}
      />
    </PageShell>
  );
}
