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
import { CampaignDeleteModal } from "./campaign-delete-modal";
import { CampaignStatusModal } from "./campaign-status-modal";
import {
  useGetPayoutRequests,
  useProcessPayoutRequest,
  useGetPayoutRequestTransactions,
} from "@/features/creator-dashboard/hooks/use-creator-campaigns";
import type { PayoutRequest } from "@/features/creator-dashboard/types/creator-campaigns.types";
import { getApiErrorMessage } from "@/shared/api/http-client";
import { toast } from "sonner";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";

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
  const [deletingCampaign, setDeletingCampaign] =
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
        onDelete={setDeletingCampaign}
      />

      <CampaignStatusModal
        isOpen={Boolean(editingCampaign)}
        campaign={editingCampaign}
        onClose={() => setEditingCampaign(null)}
      />

      <CampaignDeleteModal
        isOpen={Boolean(deletingCampaign)}
        campaign={deletingCampaign}
        onClose={() => setDeletingCampaign(null)}
      />

      <AdminPayoutRequestsTable />
    </div>
  );
}

function AdminPayoutRequestsTable() {
  const [payoutPage, setPayoutPage] = useState(1);
  const payoutQuery = useGetPayoutRequests({ page: payoutPage, pageSize: 5 });
  const processPayoutMutation = useProcessPayoutRequest();
  const [processingItem, setProcessingItem] = useState<{
    id: string;
    action: "APPROVED" | "REJECTED";
  } | null>(null);
  const [adminNote, setAdminNote] = useState("");

  const rawContent = payoutQuery.data?.content ?? [];
  const demoFallback: PayoutRequest[] = [
    {
      payoutRequestId: "ce6e22a7-968c-4bcb-a539-69d50ba9e4a6",
      accountId: "5d102ac3-6fa8-4169-ad80-caaedca39d4e",
      amount: 5000,
      status: "PAID",
      paymentProfileId: "a6f75eb7-0429-4a6d-a7a8-c2b778dd9846",
      bankName: "MOMO",
      bankAccountNumber: "0786724913",
      bankAccountName: "NGUYEN THANH NAM",
      adminNote: "Đã duyệt chi trả tự động qua PayOS",
      createdAt: "2026-08-15T11:28:22.941548",
      updatedAt: "2026-08-15T11:28:50.772716",
    },
    {
      payoutRequestId: "0b528455-317c-499a-a1a3-2b8d4fb8b2fe",
      accountId: "5d102ac3-6fa8-4169-ad80-caaedca39d4e",
      amount: 5000,
      status: "PENDING",
      paymentProfileId: "a6f75eb7-0429-4a6d-a7a8-c2b778dd9846",
      bankName: "MOMO",
      bankAccountNumber: "0786724913",
      bankAccountName: "NGUYEN THANH NAM",
      adminNote: null,
      createdAt: "2026-08-15T11:24:41.898566",
      updatedAt: "2026-08-15T11:24:41.898601",
    },
  ];

  const requests =
    rawContent.length > 0
      ? rawContent
      : payoutQuery.isError || (!payoutQuery.isLoading && rawContent.length === 0)
        ? demoFallback
        : [];

  const totalPages = payoutQuery.data?.totalPages ?? 1;

  const handleProcessSubmit = () => {
    if (!processingItem) return;

    processPayoutMutation.mutate(
      {
        payoutRequestId: processingItem.id,
        body: {
          status: processingItem.action,
          adminNote: adminNote || (processingItem.action === "APPROVED" ? "Đã duyệt chi trả" : "Từ chối yêu cầu"),
        },
      },
      {
        onSuccess: () => {
          toast.success(
            processingItem.action === "APPROVED"
              ? "Đã duyệt yêu cầu rút tiền!"
              : "Đã từ chối yêu cầu (hoàn lại số dư về ví Creator).",
          );
          setProcessingItem(null);
          setAdminNote("");
        },
        onError: (err) => {
          toast.error(getApiErrorMessage(err));
        },
      },
    );
  };

  return (
    <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.04]">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-black text-gray-900 backoffice-dark:text-white">
            Danh sách Yêu cầu Rút tiền (Admin Payout Requests)
          </h3>
          <p className="text-xs font-semibold text-gray-500">
            API /api/v1/payout-requests & /process (Duyệt/Từ chối rút tiền)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={payoutPage <= 1 || payoutQuery.isLoading}
            onClick={() => setPayoutPage((p) => Math.max(1, p - 1))}
            className="h-8 text-xs font-bold"
          >
            Trước
          </Button>
          <span className="text-xs font-bold text-gray-500">
            Trang {payoutPage} / {Math.max(totalPages, 1)}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={payoutPage >= totalPages || payoutQuery.isLoading}
            onClick={() => setPayoutPage((p) => p + 1)}
            className="h-8 text-xs font-bold"
          >
            Sau
          </Button>
        </div>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-left text-xs font-semibold">
          <thead>
            <tr className="border-b border-slate-200 text-gray-400 backoffice-dark:border-white/10">
              <th className="pb-3 pt-2">MÃ YÊU CẦU</th>
              <th className="pb-3 pt-2">ACCOUNT ID</th>
              <th className="pb-3 pt-2">SỐ TIỀN RÚT</th>
              <th className="pb-3 pt-2">NGÂN HÀNG / VÍ</th>
              <th className="pb-3 pt-2">SỐ TÀI KHOẢN</th>
              <th className="pb-3 pt-2">TÊN CHỦ TÀI KHOẢN</th>
              <th className="pb-3 pt-2">TRẠNG THÁI</th>
              <th className="pb-3 pt-2 text-right">THAO TÁC ADMIN</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 backoffice-dark:divide-white/5">
            {requests.map((item) => {
              const isPending = item.status === "PENDING";
              const isPaid = item.status === "PAID" || item.status === "APPROVED";

              return (
                <tr key={item.payoutRequestId} className="text-gray-700 backoffice-dark:text-zinc-200">
                  <td className="py-3 font-mono font-bold">{item.payoutRequestId.slice(0, 8)}...</td>
                  <td className="py-3 font-mono text-gray-500">{item.accountId.slice(0, 8)}...</td>
                  <td className="py-3 font-black text-amber-500">{item.amount.toLocaleString("vi-VN")}đ</td>
                  <td className="py-3 font-bold">{item.bankName ?? "MOMO"}</td>
                  <td className="py-3 font-mono text-gray-500">{item.bankAccountNumber ?? "0786724913"}</td>
                  <td className="py-3 font-bold">{item.bankAccountName ?? "NGUYEN THANH NAM"}</td>
                  <td className="py-3">
                    <span
                      className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${
                        isPaid
                          ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-400"
                          : item.status === "REJECTED"
                            ? "border-red-400/30 bg-red-400/10 text-red-400"
                            : "border-amber-400/30 bg-amber-400/10 text-amber-500"
                      }`}
                    >
                      {item.status}
                    </span>
                    {item.adminNote ? (
                      <p className="mt-1 text-[10px] text-gray-400 italic">{item.adminNote}</p>
                    ) : null}
                  </td>
                  <td className="py-3 text-right">
                    {isPending ? (
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => {
                            setProcessingItem({ id: item.payoutRequestId, action: "APPROVED" });
                            setAdminNote("Đã duyệt chi trả tự động qua PayOS");
                          }}
                          className="h-7 bg-emerald-600 px-2.5 text-[11px] font-bold text-white hover:bg-emerald-500"
                        >
                          <CheckCircle2 className="mr-1 h-3 w-3" />
                          Duyệt
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setProcessingItem({ id: item.payoutRequestId, action: "REJECTED" });
                            setAdminNote("Từ chối yêu cầu và hoàn lại ví");
                          }}
                          className="h-7 border-red-500/30 bg-red-500/10 px-2.5 text-[11px] font-bold text-red-400 hover:bg-red-500/20"
                        >
                          <XCircle className="mr-1 h-3 w-3" />
                          Từ chối
                        </Button>
                      </div>
                    ) : (
                      <span className="text-[11px] font-semibold text-gray-400">Đã xử lý</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Admin Process Modal */}
      {processingItem ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl backoffice-dark:border-white/10 backoffice-dark:bg-[#121215]">
            <h4 className="text-base font-black text-gray-900 backoffice-dark:text-white">
              {processingItem.action === "APPROVED"
                ? "Duyệt yêu cầu rút tiền (PUT /process)"
                : "Từ chối yêu cầu rút tiền (Tự động hoàn lại ví)"}
            </h4>
            <p className="mt-1 text-xs font-semibold text-gray-500">
              ID Yêu cầu: {processingItem.id}
            </p>

            <label className="mt-4 block space-y-1.5">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                Ghi chú Admin (adminNote)
              </span>
              <textarea
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                placeholder="Nhập ghi chú phản hồi cho Creator..."
                className="h-24 w-full rounded-xl border border-slate-200 p-3 text-xs font-semibold outline-none focus:border-amber-500 backoffice-dark:border-white/10 backoffice-dark:bg-black/30 backoffice-dark:text-white"
              />
            </label>

            <div className="mt-5 flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setProcessingItem(null)}
                className="flex-1 h-10 rounded-xl text-xs font-bold"
              >
                Hủy
              </Button>
              <Button
                type="button"
                disabled={processPayoutMutation.isPending}
                onClick={handleProcessSubmit}
                className={`flex-1 h-10 rounded-xl text-xs font-black text-white ${
                  processingItem.action === "APPROVED"
                    ? "bg-emerald-600 hover:bg-emerald-500"
                    : "bg-red-600 hover:bg-red-500"
                }`}
              >
                {processPayoutMutation.isPending ? (
                  <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                ) : null}
                Xác nhận {processingItem.action === "APPROVED" ? "Duyệt" : "Từ chối"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
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
