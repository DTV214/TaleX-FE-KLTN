"use client";

import {
  ArrowUpDown,
  BarChart3,
  Megaphone,
  RefreshCw,
  ShieldCheck,
  Target,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/shared/ui/button";
import { CampaignManagementTable } from "@/features/admin/components/campaign-management-table";
import { useGetAdminCampaigns } from "../hooks/use-admin-campaigns";
import type {
  AdminCampaign,
  AdminCampaignFilterParams,
  AdminCampaignSortBy,
  AdminCampaignStatus,
} from "../types/campaigns.types";
import { adminCampaignStatusOptions } from "./campaign-status";
import { CampaignStatusModal } from "./campaign-status-modal";

const DEFAULT_PAGE_SIZE = 10;
const EMPTY_CAMPAIGNS: AdminCampaign[] = [];

const sortOptions: Array<{ value: AdminCampaignSortBy; label: string }> = [
  { value: "createdAt", label: "Ngày tạo" },
  { value: "updatedAt", label: "Ngày cập nhật" },
  { value: "startAt", label: "Ngày bắt đầu" },
  { value: "endAt", label: "Ngày kết thúc" },
  { value: "currentImpression", label: "Đã đạt" },
  { value: "targetImpression", label: "Mục tiêu" },
];

function formatNumber(value?: number | null) {
  return new Intl.NumberFormat("vi-VN").format(value ?? 0);
}

function getProgress(current?: number | null, target?: number | null) {
  if (!target || target <= 0) {
    return 0;
  }

  return Math.min(100, Math.round(((current ?? 0) / target) * 100));
}

export function CampaignsDashboard() {
  const [page, setPage] = useState(1);
  const [selectedStatus, setSelectedStatus] = useState<
    AdminCampaignStatus | "ALL"
  >("ALL");
  const [sortBy, setSortBy] = useState<AdminCampaignSortBy>("createdAt");
  const [sortDirection, setSortDirection] = useState<"ASC" | "DESC">("DESC");
  const [editingCampaign, setEditingCampaign] =
    useState<AdminCampaign | null>(null);

  const filters = useMemo<AdminCampaignFilterParams>(
    () => ({
      page,
      pageSize: DEFAULT_PAGE_SIZE,
      sortBy,
      sortDirection,
      statuses: selectedStatus === "ALL" ? undefined : [selectedStatus],
    }),
    [page, selectedStatus, sortBy, sortDirection],
  );

  const campaignsQuery = useGetAdminCampaigns(filters);
  const campaigns = campaignsQuery.data?.content ?? EMPTY_CAMPAIGNS;
  const totalPages = campaignsQuery.data?.totalPages ?? 1;
  const totalElements = campaignsQuery.data?.totalElements ?? 0;
  const currentPage = campaignsQuery.data?.pageNumber ?? page;
  const pageSize = campaignsQuery.data?.pageSize ?? DEFAULT_PAGE_SIZE;

  const stats = useMemo(() => {
    const activeCampaigns = campaigns.filter((campaign) =>
      ["ACTIVE", "RUNNING"].includes(campaign.status ?? ""),
    ).length;
    const completedCampaigns = campaigns.filter(
      (campaign) => campaign.status === "COMPLETED",
    ).length;
    const currentImpressions = campaigns.reduce(
      (sum, campaign) => sum + (campaign.currentImpression ?? 0),
      0,
    );
    const averageProgress =
      campaigns.length === 0
        ? 0
        : Math.round(
            campaigns.reduce(
              (sum, campaign) =>
                sum +
                getProgress(
                  campaign.currentImpression,
                  campaign.targetImpression,
                ),
              0,
            ) / campaigns.length,
          );

    return {
      activeCampaigns,
      completedCampaigns,
      currentImpressions,
      averageProgress,
    };
  }, [campaigns]);

  function updateStatusFilter(value: string) {
    setSelectedStatus(value as AdminCampaignStatus | "ALL");
    setPage(1);
  }

  function updateSortBy(value: string) {
    setSortBy(value as AdminCampaignSortBy);
    setPage(1);
  }

  function updateSortDirection(value: string) {
    setSortDirection(value as "ASC" | "DESC");
    setPage(1);
  }

  function resetFilters() {
    setSelectedStatus("ALL");
    setSortBy("createdAt");
    setSortDirection("DESC");
    setPage(1);
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
      <header className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div className="flex gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600 backoffice-dark:bg-[var(--backoffice-primary-soft)] backoffice-dark:text-[var(--backoffice-primary)]">
            <Megaphone className="h-6 w-6" />
          </div>
          <div>
            <p className="mb-1 text-sm font-medium text-gray-500 backoffice-dark:text-white/55">
              Admin / Chiến dịch tương tác
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 backoffice-dark:text-white">
              Quản lý Chiến dịch
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500 backoffice-dark:text-white/55">
              Theo dõi các chiến dịch đẩy tương tác cho phim/truyện, cập nhật
              trạng thái vận hành và hủy chiến dịch khi cần.
            </p>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          size="lg"
          onClick={() => campaignsQuery.refetch()}
          disabled={campaignsQuery.isFetching}
          className="border-gray-200 bg-white text-gray-700 shadow-sm hover:bg-gray-50 backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.04] backoffice-dark:text-white/70 backoffice-dark:hover:bg-white/10"
        >
          <RefreshCw
            className={
              campaignsQuery.isFetching
                ? "h-4 w-4 animate-spin"
                : "h-4 w-4"
            }
          />
          Làm mới
        </Button>
      </header>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={Target}
          label="Tổng chiến dịch"
          value={formatNumber(totalElements)}
          detail="Theo dữ liệu backend"
        />
        <StatCard
          icon={TrendingUp}
          label="Đang chạy"
          value={formatNumber(stats.activeCampaigns)}
          detail="Trong trang hiện tại"
        />
        <StatCard
          icon={ShieldCheck}
          label="Hoàn tất"
          value={formatNumber(stats.completedCampaigns)}
          detail="Trong trang hiện tại"
        />
        <StatCard
          icon={BarChart3}
          label="Tiến độ TB"
          value={`${stats.averageProgress}%`}
          detail={`${formatNumber(stats.currentImpressions)} lượt đã đạt`}
        />
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.04]">
        <div className="grid gap-4 lg:grid-cols-[220px_220px_180px_auto] lg:items-end">
          <FilterSelect
            label="Trạng thái"
            value={selectedStatus}
            onChange={updateStatusFilter}
            options={[
              { value: "ALL", label: "Tất cả trạng thái" },
              ...adminCampaignStatusOptions,
            ]}
          />
          <FilterSelect
            label="Sắp xếp theo"
            value={sortBy}
            onChange={updateSortBy}
            options={sortOptions}
          />
          <FilterSelect
            label="Thứ tự"
            value={sortDirection}
            onChange={updateSortDirection}
            options={[
              { value: "DESC", label: "Mới nhất" },
              { value: "ASC", label: "Cũ nhất" },
            ]}
          />
          <Button
            type="button"
            variant="outline"
            onClick={resetFilters}
            className="h-11 border-gray-200 bg-white px-4 text-gray-700 shadow-sm hover:bg-gray-50 backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.04] backoffice-dark:text-white/70 backoffice-dark:hover:bg-white/10"
          >
            <ArrowUpDown className="h-4 w-4 text-violet-600 backoffice-dark:text-[var(--backoffice-primary)]" />
            Đặt lại
          </Button>
        </div>
      </section>

      <CampaignManagementTable
        campaigns={campaigns}
        page={currentPage}
        pageSize={pageSize}
        totalPages={totalPages}
        totalElements={totalElements}
        isLoading={campaignsQuery.isLoading}
        isError={campaignsQuery.isError}
        onPageChange={setPage}
        onEdit={setEditingCampaign}
      />

      <CampaignStatusModal
        isOpen={Boolean(editingCampaign)}
        campaign={editingCampaign}
        onClose={() => setEditingCampaign(null)}
      />
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.04]">
      <div className="flex items-center gap-2 text-gray-500">
        <Icon className="h-5 w-5 text-violet-600 backoffice-dark:text-[var(--backoffice-primary)]" />
        <p className="text-xs font-bold uppercase tracking-wider">{label}</p>
      </div>
      <p className="mt-4 text-3xl font-black text-gray-900">{value}</p>
      <p className="mt-2 text-sm font-semibold text-gray-500">{detail}</p>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ label: string; value: string }>;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-gray-500">
        {label}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-100 backoffice-dark:border-white/10 backoffice-dark:bg-black/30 backoffice-dark:text-white backoffice-dark:focus:ring-[rgba(212,175,55,0.16)]"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
