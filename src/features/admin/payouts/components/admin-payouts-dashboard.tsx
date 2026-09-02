"use client";

import { useMemo, useState } from "react";
import {
  Banknote,
  CheckCircle2,
  Clock,
  Filter,
  Loader2,
  Receipt,
  RefreshCw,
  Search,
  Send,
  XCircle,
  AlertCircle,
  Check,
  X,
  CreditCard,
  Building2,
  User,
  ArrowDownToLine,
  Layers,
} from "lucide-react";
import { toast } from "sonner";
import {
  useGetPayoutRequests,
  useProcessPayoutRequest,
  useExecutePayoutRequest,
} from "@/features/creator-dashboard/hooks/use-creator-campaigns";
import type { PayoutRequest } from "@/features/creator-dashboard/types/creator-campaigns.types";
import { PayoutTransactionsModal } from "@/features/admin/campaigns/components/payout-transactions-modal";
import { PayoutBalanceBadge } from "@/features/admin/components/payout-balance-badge";
import { getApiErrorMessage } from "@/shared/api/http-client";
import { Button } from "@/shared/ui/button";

const PAGE_SIZE = 10;

type PayoutStatusFilter = "ALL" | "PENDING" | "APPROVED" | "PAID" | "REJECTED";

function formatCurrency(amount?: number | null) {
  if (amount == null || isNaN(amount)) return "0 ₫";
  return new Intl.NumberFormat("vi-VN").format(amount) + " ₫";
}

function formatDateTime(dateStr?: string | null) {
  if (!dateStr) return "—";
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateStr;
  }
}

export function AdminPayoutsDashboard() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<PayoutStatusFilter>("ALL");
  const [searchKey, setSearchKey] = useState("");
  const [adminNote, setAdminNote] = useState("");
  const [processingItem, setProcessingItem] = useState<{
    id: string;
    action: "APPROVED" | "REJECTED";
  } | null>(null);
  const [selectedTransactionsPayout, setSelectedTransactionsPayout] =
    useState<PayoutRequest | null>(null);

  const payoutQuery = useGetPayoutRequests({
    page,
    pageSize: PAGE_SIZE,
  });

  const processPayoutMutation = useProcessPayoutRequest();
  const executePayoutMutation = useExecutePayoutRequest();

  const allRequests = payoutQuery.data?.content ?? [];
  const totalPages = payoutQuery.data?.totalPages ?? 1;
  const totalElements = payoutQuery.data?.totalElements ?? 0;

  // Filter requests locally if needed for status and search
  const filteredRequests = useMemo(() => {
    return allRequests.filter((item) => {
      const matchStatus =
        statusFilter === "ALL" ? true : item.status === statusFilter;
      const matchSearch =
        !searchKey.trim() ||
        item.payoutRequestId.toLowerCase().includes(searchKey.toLowerCase()) ||
        item.accountId.toLowerCase().includes(searchKey.toLowerCase()) ||
        (item.bankAccountNumber &&
          item.bankAccountNumber.toLowerCase().includes(searchKey.toLowerCase())) ||
        (item.bankAccountName &&
          item.bankAccountName.toLowerCase().includes(searchKey.toLowerCase())) ||
        (item.bankName &&
          item.bankName.toLowerCase().includes(searchKey.toLowerCase()));

      return matchStatus && matchSearch;
    });
  }, [allRequests, statusFilter, searchKey]);

  // Status Stats
  const stats = useMemo(() => {
    const pending = allRequests.filter((r) => r.status === "PENDING").length;
    const approved = allRequests.filter((r) => r.status === "APPROVED").length;
    const paid = allRequests.filter((r) => r.status === "PAID").length;
    const rejected = allRequests.filter((r) => r.status === "REJECTED").length;
    const totalAmount = allRequests.reduce((sum, r) => sum + (r.amount || 0), 0);

    return { pending, approved, paid, rejected, totalAmount };
  }, [allRequests]);

  const handleProcessSubmit = () => {
    if (!processingItem) return;

    processPayoutMutation.mutate(
      {
        payoutRequestId: processingItem.id,
        body: {
          status: processingItem.action,
          adminNote:
            adminNote ||
            (processingItem.action === "APPROVED"
              ? "Đã duyệt chi trả tự động"
              : "Từ chối yêu cầu"),
        },
      },
      {
        onSuccess: () => {
          toast.success(
            processingItem.action === "APPROVED"
              ? "Đã duyệt yêu cầu rút tiền. Vui lòng bấm 'Thực thi chi trả' để hoàn tất chuyển khoản PayOS!"
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

  const handleExecute = (payoutRequestId: string) => {
    if (!confirm("Bạn có chắc muốn thực thi lệnh chi trả PayOS ngay bây giờ?")) {
      return;
    }

    executePayoutMutation.mutate(payoutRequestId, {
      onSuccess: () => {
        toast.success("Đã gửi lệnh chi trả qua PayOS thành công!");
      },
      onError: (err) => {
        toast.error(getApiErrorMessage(err));
      },
    });
  };

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
      {/* 1. Header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between  border-gray-100 backoffice-dark:border-white/10">
        <div>
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 backoffice-dark:text-white">
                Quản Lý Yêu Cầu Rút Tiền
              </h1>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <PayoutBalanceBadge />

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void payoutQuery.refetch()}
            disabled={payoutQuery.isFetching}
            className="border-gray-200 bg-white text-gray-700 shadow-sm hover:bg-gray-50 backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.04] backoffice-dark:text-zinc-200 backoffice-dark:hover:bg-white/10"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${payoutQuery.isFetching ? "animate-spin" : ""}`}
            />
            <span>Làm mới</span>
          </Button>
        </div>
      </header>

      {/* 2. KPI Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Pending Card */}
        <div
          onClick={() => setStatusFilter("PENDING")}
          className={`cursor-pointer rounded-2xl border p-5 transition-all ${statusFilter === "PENDING"
            ? "border-amber-500 bg-amber-50/50 shadow-md backoffice-dark:bg-amber-500/10 backoffice-dark:border-amber-500"
            : "border-gray-100 bg-white shadow-sm hover:border-gray-200 backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.04]"
            }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-600 backoffice-dark:text-amber-400 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              Chờ Duyệt
            </span>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 backoffice-dark:bg-amber-900/40 backoffice-dark:text-amber-300">
              {stats.pending}
            </span>
          </div>
          <p className="text-2xl font-black text-gray-900 backoffice-dark:text-white">
            {stats.pending} <span className="text-xs font-normal text-gray-500">yêu cầu</span>
          </p>
        </div>

        {/* Approved Card */}
        <div
          onClick={() => setStatusFilter("APPROVED")}
          className={`cursor-pointer rounded-2xl border p-5 transition-all ${statusFilter === "APPROVED"
            ? "border-blue-500 bg-blue-50/50 shadow-md backoffice-dark:bg-blue-500/10 backoffice-dark:border-blue-500"
            : "border-gray-100 bg-white shadow-sm hover:border-gray-200 backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.04]"
            }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600 backoffice-dark:text-blue-400 flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5" />
              Đã Duyệt (Chờ Chi)
            </span>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 backoffice-dark:bg-blue-900/40 backoffice-dark:text-blue-300">
              {stats.approved}
            </span>
          </div>
          <p className="text-2xl font-black text-gray-900 backoffice-dark:text-white">
            {stats.approved} <span className="text-xs font-normal text-gray-500">cần chi trả</span>
          </p>
        </div>

        {/* Paid Card */}
        <div
          onClick={() => setStatusFilter("PAID")}
          className={`cursor-pointer rounded-2xl border p-5 transition-all ${statusFilter === "PAID"
            ? "border-emerald-500 bg-emerald-50/50 shadow-md backoffice-dark:bg-emerald-500/10 backoffice-dark:border-emerald-500"
            : "border-gray-100 bg-white shadow-sm hover:border-gray-200 backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.04]"
            }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 backoffice-dark:text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Đã Chi Trả
            </span>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 backoffice-dark:bg-emerald-900/40 backoffice-dark:text-emerald-300">
              {stats.paid}
            </span>
          </div>
          <p className="text-2xl font-black text-emerald-600 backoffice-dark:text-emerald-400">
            {stats.paid} <span className="text-xs font-normal text-gray-500">thành công</span>
          </p>
        </div>

        {/* Rejected Card */}
        <div
          onClick={() => setStatusFilter("REJECTED")}
          className={`cursor-pointer rounded-2xl border p-5 transition-all ${statusFilter === "REJECTED"
            ? "border-red-500 bg-red-50/50 shadow-md backoffice-dark:bg-red-500/10 backoffice-dark:border-red-500"
            : "border-gray-100 bg-white shadow-sm hover:border-gray-200 backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.04]"
            }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-red-600 backoffice-dark:text-red-400 flex items-center gap-1.5">
              <XCircle className="w-3.5 h-3.5" />
              Đã Từ Chối
            </span>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-800 backoffice-dark:bg-red-900/40 backoffice-dark:text-red-300">
              {stats.rejected}
            </span>
          </div>
          <p className="text-2xl font-black text-gray-900 backoffice-dark:text-white">
            {stats.rejected} <span className="text-xs font-normal text-gray-500">lệnh hủy</span>
          </p>
        </div>
      </div>

      {/* 3. Filter & Search Controls */}
      <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.04]">
        <div className="grid gap-4 md:grid-cols-[1fr_200px_auto] md:items-end">
          {/* Search */}
          <label className="block">
            <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-gray-500 backoffice-dark:text-zinc-400">
              Tìm kiếm
            </span>
            <div className="relative">
              <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-gray-400" />
              <input
                type="search"
                value={searchKey}
                onChange={(e) => setSearchKey(e.target.value)}
                placeholder="Tìm theo Mã yêu cầu, Account ID, Số TK, Tên chủ TK..."
                className="h-11 w-full rounded-xl border border-gray-200 bg-white pl-10 pr-3 text-xs font-medium text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-violet-500 backoffice-dark:border-white/10 backoffice-dark:bg-black/30 backoffice-dark:text-white"
              />
            </div>
          </label>

          {/* Status Filter */}
          <label className="block">
            <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-gray-500 backoffice-dark:text-zinc-400">
              Trạng thái
            </span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as PayoutStatusFilter)}
              className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-xs font-bold text-gray-700 outline-none transition focus:border-violet-500 backoffice-dark:border-white/10 backoffice-dark:bg-black/30 backoffice-dark:text-white"
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="PENDING">Chờ duyệt (PENDING)</option>
              <option value="APPROVED">Đã duyệt (APPROVED)</option>
              <option value="PAID">Đã chi trả (PAID)</option>
              <option value="REJECTED">Đã từ chối (REJECTED)</option>
            </select>
          </label>

          {/* Reset Filter Button */}
          {(statusFilter !== "ALL" || searchKey) && (
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setStatusFilter("ALL");
                setSearchKey("");
              }}
              className="h-11 rounded-xl text-xs font-bold border-gray-200 bg-white text-gray-700 hover:bg-gray-50 backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.04] backoffice-dark:text-zinc-200"
            >
              Đặt lại
            </Button>
          )}
        </div>
      </section>

      {/* 4. Payout Requests Table */}
      <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.04]">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-medium">
            <thead className="border-b border-gray-100 bg-gray-50/80 text-[11px] font-bold uppercase tracking-wider text-gray-500 backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.02] backoffice-dark:text-zinc-400">
              <tr>
                <th className="px-5 py-4 whitespace-nowrap">Tài Khoản</th>
                <th className="px-5 py-4 whitespace-nowrap">Số Tiền Rút</th>
                <th className="px-5 py-4 whitespace-nowrap">Ngân Hàng</th>
                <th className="px-5 py-4 whitespace-nowrap">Số Tài Khoản</th>
                <th className="px-5 py-4 whitespace-nowrap">Chủ Tài Khoản</th>
                <th className="px-5 py-4 whitespace-nowrap">Trạng Thái</th>
                <th className="px-5 py-4 text-center whitespace-nowrap">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 backoffice-dark:divide-white/5">
              {payoutQuery.isLoading ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-gray-400">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin text-violet-600" />
                      <span>Đang tải danh sách yêu cầu rút tiền...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-gray-400">
                    Không có yêu cầu rút tiền nào phù hợp với bộ lọc.
                  </td>
                </tr>
              ) : (
                filteredRequests.map((item) => {
                  const isPending = item.status === "PENDING";
                  const isApproved = item.status === "APPROVED";
                  const isPaid = item.status === "PAID";
                  const isRejected = item.status === "REJECTED";

                  return (
                    <tr
                      key={item.payoutRequestId}
                      className="text-gray-700 transition hover:bg-gray-50/60 backoffice-dark:text-zinc-200 backoffice-dark:hover:bg-white/[0.02]"
                    >
                      {/* Account ID */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="font-semibold text-gray-800 backoffice-dark:text-zinc-200">
                            {item.username || item.accountId}
                          </span>
                          <span className="text-[10px] text-gray-400">
                            {formatDateTime(item.createdAt)}
                          </span>
                        </div>
                      </td>

                      {/* Amount */}
                      <td className="px-5 py-4 font-black text-sm text-violet-600 backoffice-dark:text-violet-400 whitespace-nowrap">
                        {formatCurrency(item.amount)}
                      </td>

                      {/* Bank Name */}
                      <td className="px-5 py-4 font-semibold text-gray-800 backoffice-dark:text-zinc-200 whitespace-nowrap">
                        {item.bankName || "—"}
                      </td>

                      {/* Account Number */}
                      <td className="px-5 py-4 font-mono text-gray-600 backoffice-dark:text-zinc-300 whitespace-nowrap">
                        {item.bankAccountNumber || "—"}
                      </td>

                      {/* Account Holder Name */}
                      <td className="px-5 py-4 font-semibold uppercase text-gray-800 backoffice-dark:text-zinc-200 whitespace-nowrap">
                        {item.bankAccountName || "—"}
                      </td>

                      {/* Status Badge */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        {isPending && (
                          <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-50 px-2.5 py-1 text-[10px] font-bold text-amber-700 whitespace-nowrap backoffice-dark:bg-amber-500/10 backoffice-dark:text-amber-400">
                            <Clock className="h-3 w-3 shrink-0" />
                            CHỜ DUYỆT
                          </span>
                        )}
                        {isApproved && (
                          <span className="inline-flex items-center gap-1 rounded-full border border-blue-500/30 bg-blue-50 px-2.5 py-1 text-[10px] font-bold text-blue-700 whitespace-nowrap backoffice-dark:bg-blue-500/10 backoffice-dark:text-blue-400">
                            <Check className="h-3 w-3 shrink-0" />
                            ĐÃ DUYỆT
                          </span>
                        )}
                        {isPaid && (
                          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700 whitespace-nowrap backoffice-dark:bg-emerald-500/10 backoffice-dark:text-emerald-400">
                            <CheckCircle2 className="h-3 w-3 shrink-0" />
                            ĐÃ CHI TRẢ
                          </span>
                        )}
                        {isRejected && (
                          <span className="inline-flex items-center gap-1 rounded-full border border-red-500/30 bg-red-50 px-2.5 py-1 text-[10px] font-bold text-red-700 whitespace-nowrap backoffice-dark:bg-red-500/10 backoffice-dark:text-red-400">
                            <XCircle className="h-3 w-3 shrink-0" />
                            TỪ CHỐI
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-2">
                          {/* PayOS Details Modal Trigger */}
                          <button
                            type="button"
                            onClick={() => setSelectedTransactionsPayout(item)}
                            className="inline-flex h-8 items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 text-[11px] font-semibold text-gray-700 hover:bg-gray-50 transition cursor-pointer backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.04] backoffice-dark:text-zinc-200 backoffice-dark:hover:bg-white/10"
                            title="Xem chi tiết giao dịch PayOS"
                          >
                            <Receipt className="h-3.5 w-3.5 text-blue-600 backoffice-dark:text-blue-400" />
                            <span>Chi Tiết</span>
                          </button>

                          {/* PENDING: Approve / Reject buttons */}
                          {isPending && (
                            <>
                              <Button
                                type="button"
                                size="sm"
                                onClick={() =>
                                  setProcessingItem({
                                    id: item.payoutRequestId,
                                    action: "APPROVED",
                                  })
                                }
                                className="h-8 bg-emerald-600 px-3 text-[11px] font-bold text-white hover:bg-emerald-500 shadow-sm"
                              >
                                <CheckCircle2 className="mr-1 h-3 w-3" />
                                Duyệt
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant="destructive"
                                onClick={() =>
                                  setProcessingItem({
                                    id: item.payoutRequestId,
                                    action: "REJECTED",
                                  })
                                }
                                className="h-8 px-2.5 text-[11px] font-bold shadow-sm"
                              >
                                <XCircle className="mr-1 h-3 w-3" />
                                Từ chối
                              </Button>
                            </>
                          )}

                          {/* APPROVED: Execute Payout button */}
                          {isApproved && (
                            <Button
                              type="button"
                              size="sm"
                              disabled={executePayoutMutation.isPending}
                              onClick={() => handleExecute(item.payoutRequestId)}
                              className="h-8 bg-blue-600 px-3 text-[11px] font-bold text-white hover:bg-blue-500 shadow-md"
                            >
                              {executePayoutMutation.isPending ? (
                                <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                              ) : (
                                <Send className="mr-1 h-3 w-3" />
                              )}
                              Thực thi chi trả
                            </Button>
                          )}

                          {/* PAID / REJECTED */}
                          {!isPending && !isApproved && (
                            <span className="inline-flex items-center rounded-md bg-gray-100 px-2 py-1 text-[11px] font-semibold text-gray-500 backoffice-dark:bg-white/5 backoffice-dark:text-zinc-400">
                              Đã xử lý
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="flex flex-col gap-3 border-t border-gray-100 bg-gray-50/50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between backoffice-dark:border-white/10 backoffice-dark:bg-transparent">
          <p className="text-xs font-semibold text-gray-500 backoffice-dark:text-zinc-400">
            Hiển thị {filteredRequests.length} / {totalElements} yêu cầu rút tiền
          </p>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page <= 1 || payoutQuery.isLoading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="h-8 text-xs font-bold border-gray-200 bg-white text-gray-700 backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.04] backoffice-dark:text-zinc-200"
            >
              Trước
            </Button>
            <span className="rounded-lg border border-gray-200 bg-white px-3 py-1 text-xs font-bold text-gray-700 shadow-sm backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.04] backoffice-dark:text-zinc-200">
              Trang {page} / {Math.max(totalPages, 1)}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page >= totalPages || payoutQuery.isLoading}
              onClick={() => setPage((p) => p + 1)}
              className="h-8 text-xs font-bold border-gray-200 bg-white text-gray-700 backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.04] backoffice-dark:text-zinc-200"
            >
              Sau
            </Button>
          </div>
        </div>
      </section>

      {/* PayOS Transactions Detail Modal */}
      <PayoutTransactionsModal
        payoutRequest={selectedTransactionsPayout}
        isOpen={Boolean(selectedTransactionsPayout)}
        onClose={() => setSelectedTransactionsPayout(null)}
        variant="admin"
      />

      {/* Admin Process Modal */}
      {processingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-xl backoffice-dark:border-white/10 backoffice-dark:bg-[#121215]">
            <h4 className="text-base font-black text-gray-900 backoffice-dark:text-white">
              {processingItem.action === "APPROVED"
                ? "Duyệt yêu cầu rút tiền"
                : "Từ chối yêu cầu rút tiền (Tự động hoàn lại ví)"}
            </h4>

            <label className="mt-4 block space-y-1.5">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider backoffice-dark:text-zinc-400">
                Ghi chú
              </span>
              <textarea
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                placeholder="Nhập ghi chú phản hồi cho Creator..."
                className="h-24 w-full rounded-xl border border-gray-200 p-3 text-xs font-semibold outline-none focus:border-violet-500 backoffice-dark:border-white/10 backoffice-dark:bg-black/30 backoffice-dark:text-white"
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
                className={`flex-1 h-10 rounded-xl text-xs font-black text-white ${processingItem.action === "APPROVED"
                  ? "bg-emerald-600 hover:bg-emerald-500"
                  : "bg-red-600 hover:bg-red-500"
                  }`}
              >
                {processPayoutMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : processingItem.action === "APPROVED" ? (
                  "Xác nhận duyệt"
                ) : (
                  "Xác nhận từ chối"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
