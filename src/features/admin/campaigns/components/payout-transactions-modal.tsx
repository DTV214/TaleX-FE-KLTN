"use client";

import { useEffect } from "react";
import {
  X,
  CreditCard,
  CheckCircle2,
  Clock,
  AlertCircle,
  Building2,
  User,
  Hash,
  RefreshCw,
  Receipt,
  FileText,
  Copy,
} from "lucide-react";
import { useGetPayoutRequestTransactions } from "@/features/creator-dashboard/hooks/use-creator-campaigns";
import type {
  PayoutRequest,
  WalletPayoutTransaction,
} from "@/features/creator-dashboard/types/creator-campaigns.types";
import { toast } from "sonner";
import { cn } from "@/shared/utils/utils";

interface PayoutTransactionsModalProps {
  payoutRequest: PayoutRequest | null;
  isOpen: boolean;
  onClose: () => void;
  variant?: "admin" | "creator";
}

function formatCurrency(amount?: number | null) {
  if (amount == null || isNaN(amount)) return "0đ";
  return new Intl.NumberFormat("vi-VN").format(amount) + "đ";
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
      second: "2-digit",
    });
  } catch {
    return dateStr;
  }
}

function shortenId(value?: string | null) {
  if (!value) return "—";
  return value.length > 18 ? `${value.slice(0, 8)}...${value.slice(-6)}` : value;
}

export function PayoutTransactionsModal({
  payoutRequest,
  isOpen,
  onClose,
  variant = "creator",
}: PayoutTransactionsModalProps) {
  const isCreator = variant === "creator";

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [isOpen, onClose]);

  const {
    data: transactions = [],
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useGetPayoutRequestTransactions(
    payoutRequest?.payoutRequestId,
    Boolean(isOpen && payoutRequest?.payoutRequestId),
  );

  if (!isOpen || !payoutRequest) return null;

  const isPaid = payoutRequest.status === "PAID";
  const isApproved = payoutRequest.status === "APPROVED";
  const isRejected = payoutRequest.status === "REJECTED";

  const handleCopy = (text?: string | null, label?: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast.success(`Đã sao chép ${label || "mã"}`);
  };

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 backdrop-blur-xl animate-in fade-in duration-200",
        isCreator ? "bg-black/80" : "bg-slate-950/70",
      )}
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          "relative max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-3xl p-5 sm:p-6 shadow-[0_30px_100px_rgba(0,0,0,0.55)] border flex flex-col",
          isCreator
            ? "bg-[#0d0d0f] text-white border-white/10"
            : "bg-white text-slate-900 border-slate-200/80 backoffice-dark:bg-slate-900 backoffice-dark:text-white backoffice-dark:border-white/10",
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Row */}
        <div
          className={cn(
            "flex items-center justify-between border-b pb-4 shrink-0",
            isCreator ? "border-white/10" : "border-slate-100 backoffice-dark:border-white/10",
          )}
        >
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border",
                isCreator
                  ? "bg-yellow-400/10 text-yellow-300 border-yellow-400/25"
                  : "bg-blue-50 text-blue-600 border-blue-200/60 backoffice-dark:bg-blue-950/50 backoffice-dark:text-blue-400 backoffice-dark:border-blue-800/40",
              )}
            >
              <Receipt className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3
                  className={cn(
                    "text-base sm:text-lg font-black",
                    isCreator ? "text-white" : "text-slate-950 backoffice-dark:text-white",
                  )}
                >
                  Chi Tiết Giao Dịch
                </h3>
                <span
                  className={cn(
                    "rounded-full px-2.5 py-0.5 text-[10px] font-bold border",
                    isCreator
                      ? "bg-yellow-400/10 text-yellow-300 border-yellow-400/25"
                      : "bg-blue-100 text-blue-700 border-blue-200 backoffice-dark:bg-blue-950/60 backoffice-dark:text-blue-300 backoffice-dark:border-blue-800/40",
                  )}
                >
                  Chuyển khoản tự động
                </span>
              </div>
              <p
                className={cn(
                  "text-xs mt-0.5",
                  isCreator ? "text-zinc-400" : "text-slate-500 backoffice-dark:text-white/60",
                )}
              >
                Mã yêu cầu:{" "}
                <span
                  className={cn(
                    "font-bold",
                    isCreator ? "text-zinc-200" : "text-slate-700 backoffice-dark:text-white/90",
                  )}
                >
                  {payoutRequest.payoutRequestId}
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => refetch()}
              disabled={isFetching}
              className={cn(
                "rounded-full p-2 transition-all cursor-pointer",
                isCreator
                  ? "bg-white/[0.06] text-zinc-300 hover:bg-white/10 hover:text-white"
                  : "bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-900 backoffice-dark:bg-white/10 backoffice-dark:text-white/70 backoffice-dark:hover:bg-white/20",
              )}
              title="Làm mới dữ liệu"
            >
              <RefreshCw className={cn("h-4 w-4", isFetching && "animate-spin text-yellow-400")} />
            </button>
            <button
              type="button"
              onClick={onClose}
              className={cn(
                "rounded-full p-2 transition-all cursor-pointer",
                isCreator
                  ? "bg-white/[0.06] text-zinc-300 hover:bg-white/10 hover:text-white"
                  : "bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-900 backoffice-dark:bg-white/10 backoffice-dark:text-white/70 backoffice-dark:hover:bg-white/20",
              )}
              title="Đóng"
              aria-label="Đóng"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Payout Request Info Card */}
        <div
          className={cn(
            "mt-4 rounded-2xl border p-4 sm:p-5 space-y-3.5",
            isCreator
              ? "bg-white/[0.04] border-white/10"
              : "bg-slate-50/70 border-slate-200/80 backoffice-dark:bg-white/5 backoffice-dark:border-white/10",
          )}
        >
          <div
            className={cn(
              "flex flex-wrap items-center justify-between gap-3 border-b pb-3",
              isCreator ? "border-white/10" : "border-slate-200/60 backoffice-dark:border-white/10",
            )}
          >
            <div>
              <span
                className={cn(
                  "text-[11px] font-bold block",
                  isCreator ? "text-zinc-400" : "text-slate-500 backoffice-dark:text-white/60",
                )}
              >
                Số tiền yêu cầu rút
              </span>
              <span
                className={cn(
                  "text-2xl font-black mt-0.5 block",
                  isCreator ? "text-[#F5D46E]" : "text-amber-500",
                )}
              >
                {formatCurrency(payoutRequest.amount)}
              </span>
            </div>

            <div className="flex flex-col items-end">
              <span
                className={cn(
                  "text-[11px] font-bold block mb-1",
                  isCreator ? "text-zinc-400" : "text-slate-500 backoffice-dark:text-white/60",
                )}
              >
                Trạng thái yêu cầu
              </span>
              <span
                className={cn(
                  "rounded-full border px-3 py-0.5 text-xs font-bold",
                  isPaid
                    ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
                    : isApproved
                    ? "border-cyan-400/30 bg-cyan-400/10 text-cyan-300"
                    : isRejected
                    ? "border-red-400/30 bg-red-400/10 text-red-300"
                    : "border-yellow-400/30 bg-yellow-400/10 text-yellow-300",
                )}
              >
                {isPaid
                  ? "Đã chi trả"
                  : isApproved
                  ? "Đã duyệt"
                  : isRejected
                  ? "Đã từ chối"
                  : "Chờ duyệt"}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <Building2
                className={cn(
                  "h-4 w-4 shrink-0",
                  isCreator ? "text-zinc-400" : "text-slate-400",
                )}
              />
              <div>
                <span
                  className={cn(
                    "text-[11px] block",
                    isCreator ? "text-zinc-400" : "text-slate-500 backoffice-dark:text-white/50",
                  )}
                >
                  Ngân hàng / Kênh
                </span>
                <span
                  className={cn(
                    "font-bold",
                    isCreator ? "text-white" : "text-slate-800 backoffice-dark:text-white/90",
                  )}
                >
                  {payoutRequest.bankName || "—"}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <Hash
                className={cn(
                  "h-4 w-4 shrink-0",
                  isCreator ? "text-zinc-400" : "text-slate-400",
                )}
              />
              <div>
                <span
                  className={cn(
                    "text-[11px] block",
                    isCreator ? "text-zinc-400" : "text-slate-500 backoffice-dark:text-white/50",
                  )}
                >
                  Số tài khoản nhận
                </span>
                <span
                  className={cn(
                    "font-bold",
                    isCreator ? "text-white" : "text-slate-800 backoffice-dark:text-white/90",
                  )}
                >
                  {payoutRequest.bankAccountNumber || "—"}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <User
                className={cn(
                  "h-4 w-4 shrink-0",
                  isCreator ? "text-zinc-400" : "text-slate-400",
                )}
              />
              <div>
                <span
                  className={cn(
                    "text-[11px] block",
                    isCreator ? "text-zinc-400" : "text-slate-500 backoffice-dark:text-white/50",
                  )}
                >
                  Tên người nhận
                </span>
                <span
                  className={cn(
                    "font-bold",
                    isCreator ? "text-white" : "text-slate-800 backoffice-dark:text-white/90",
                  )}
                >
                  {payoutRequest.bankAccountName || "—"}
                </span>
              </div>
            </div>
          </div>

          {payoutRequest.adminNote && (
            <div
              className={cn(
                "pt-2.5 border-t text-xs",
                isCreator
                  ? "border-white/10 text-zinc-300"
                  : "border-slate-200/40 text-slate-600 backoffice-dark:border-white/10 backoffice-dark:text-white/70",
              )}
            >
              <span className="font-bold">Ghi chú Admin: </span>
              <span>{payoutRequest.adminNote}</span>
            </div>
          )}
        </div>

        {/* PayOS Transactions List Section */}
        <div className="mt-5 space-y-3">
          <div className="flex items-center gap-2">
            <CreditCard
              className={cn(
                "h-4 w-4",
                isCreator ? "text-yellow-400" : "text-blue-600 backoffice-dark:text-blue-400",
              )}
            />
            <h4
              className={cn(
                "text-xs font-bold uppercase tracking-wider",
                isCreator ? "text-zinc-300" : "text-slate-700 backoffice-dark:text-white/80",
              )}
            >
              Lịch Sử Giao Dịch Chuyển Khoản ({transactions.length})
            </h4>
          </div>

          {/* Loading state */}
          {isLoading && (
            <div className="space-y-2.5 py-4">
              {Array.from({ length: 2 }).map((_, idx) => (
                <div
                  key={idx}
                  className={cn(
                    "h-20 animate-pulse rounded-2xl border",
                    isCreator
                      ? "border-white/10 bg-white/[0.03]"
                      : "border-slate-100 bg-slate-50 backoffice-dark:border-white/5 backoffice-dark:bg-white/5",
                  )}
                />
              ))}
            </div>
          )}

          {/* Error state */}
          {isError && !isLoading && (
            <div
              className={cn(
                "rounded-2xl border p-4 text-center text-xs",
                isCreator
                  ? "border-red-400/30 bg-red-400/10 text-red-300"
                  : "border-red-200 bg-red-50 text-red-700 backoffice-dark:border-red-900/40 backoffice-dark:bg-red-950/30 backoffice-dark:text-red-300",
              )}
            >
              <AlertCircle className="mx-auto mb-1.5 h-6 w-6 text-red-400" />
              <p className="font-bold">Không thể tải danh sách giao dịch chi trả</p>
              <p className="mt-1 text-[11px] opacity-80">
                {error instanceof Error ? error.message : "Đã có lỗi xảy ra khi kết nối máy chủ."}
              </p>
            </div>
          )}

          {/* Empty state */}
          {!isLoading && !isError && transactions.length === 0 && (
            <div
              className={cn(
                "rounded-2xl border border-dashed p-8 text-center text-xs",
                isCreator
                  ? "border-white/10 bg-black/20 text-zinc-400"
                  : "border-slate-200 bg-slate-50/50 text-slate-500 backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.02] backoffice-dark:text-white/50",
              )}
            >
              <FileText
                className={cn(
                  "mx-auto mb-2 h-8 w-8",
                  isCreator ? "text-zinc-600" : "text-slate-300 backoffice-dark:text-white/20",
                )}
              />
              <p
                className={cn(
                  "font-bold",
                  isCreator ? "text-zinc-300" : "text-slate-700 backoffice-dark:text-white/80",
                )}
              >
                Chưa có giao dịch chuyển khoản nào
              </p>
              <p className="mt-1 text-[11px] text-zinc-500">
                {isApproved
                  ? "Yêu cầu đã được duyệt nhưng chưa thực thi lệnh chuyển tiền qua tài khoản ngân hàng."
                  : "Giao dịch chuyển tiền thực tế sẽ xuất hiện tại đây sau khi hệ thống thực thi lệnh chi trả."}
              </p>
            </div>
          )}

          {/* Transactions Cards */}
          {!isLoading && !isError && transactions.length > 0 && (
            <div className="space-y-3">
              {transactions.map((tx: WalletPayoutTransaction, index: number) => {
                const txStatus = String(tx.status || "PENDING").toUpperCase();
                const isTxSuccess = txStatus === "SUCCESS" || txStatus === "PAID" || txStatus === "COMPLETED";
                const isTxFailed = txStatus === "FAILED" || txStatus === "REJECTED" || txStatus === "CANCELLED";

                return (
                  <div
                    key={tx.walletPayoutTransactionId || `tx-${index}`}
                    className={cn(
                      "rounded-2xl border p-4 shadow-sm space-y-3 transition-all",
                      isCreator
                        ? "bg-black/30 border-white/[0.08] hover:border-white/20"
                        : "bg-white border-slate-200/80 backoffice-dark:border-white/10 backoffice-dark:bg-white/5",
                    )}
                  >
                    {/* Row 1: Status badge, Amount, Paid time */}
                    <div
                      className={cn(
                        "flex flex-wrap items-center justify-between gap-2 border-b pb-2.5",
                        isCreator ? "border-white/10" : "border-slate-100 backoffice-dark:border-white/10",
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold border",
                            isTxSuccess
                              ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
                              : isTxFailed
                              ? "border-red-400/30 bg-red-400/10 text-red-300"
                              : "border-yellow-400/30 bg-yellow-400/10 text-yellow-300",
                          )}
                        >
                          {isTxSuccess ? (
                            <CheckCircle2 className="h-3.5 w-3.5" />
                          ) : isTxFailed ? (
                            <AlertCircle className="h-3.5 w-3.5" />
                          ) : (
                            <Clock className="h-3.5 w-3.5" />
                          )}
                          {isTxSuccess
                            ? "Thành công"
                            : isTxFailed
                            ? "Thất bại"
                            : "Đang xử lý"}
                        </span>

                        <span
                          className={cn(
                            "text-xs font-bold",
                            isCreator ? "text-zinc-400" : "text-slate-500 backoffice-dark:text-white/60",
                          )}
                        >
                          Kênh nhận:{" "}
                          <strong
                            className={cn(
                              isCreator ? "text-zinc-200" : "text-slate-800 backoffice-dark:text-white",
                            )}
                          >
                            {tx.toBin || "Ngân hàng"}
                          </strong>
                        </span>
                      </div>

                      <div className="text-right">
                        <span
                          className={cn(
                            "text-base font-black",
                            isCreator ? "text-[#F5D46E]" : "text-amber-600 backoffice-dark:text-amber-400",
                          )}
                        >
                          {formatCurrency(tx.amount)}
                        </span>
                      </div>
                    </div>

                    {/* Row 2: Destination Account Details */}
                    <div
                      className={cn(
                        "grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs p-3 rounded-xl border",
                        isCreator
                          ? "bg-white/[0.03] border-white/5"
                          : "bg-slate-50 border-slate-100 backoffice-dark:bg-white/[0.02] backoffice-dark:border-white/5",
                      )}
                    >
                      <div>
                        <span
                          className={cn(
                            "text-[10px] uppercase font-bold block",
                            isCreator ? "text-zinc-400" : "text-slate-400",
                          )}
                        >
                          Tài khoản nhận
                        </span>
                        <span
                          className={cn(
                            "font-bold",
                            isCreator ? "text-white" : "text-slate-800 backoffice-dark:text-white",
                          )}
                        >
                          {tx.toAccountNumber || "—"}
                        </span>
                      </div>
                      <div>
                        <span
                          className={cn(
                            "text-[10px] uppercase font-bold block",
                            isCreator ? "text-zinc-400" : "text-slate-400",
                          )}
                        >
                          Tên người nhận
                        </span>
                        <span
                          className={cn(
                            "font-bold",
                            isCreator ? "text-white" : "text-slate-800 backoffice-dark:text-white",
                          )}
                        >
                          {tx.toAccountName || "—"}
                        </span>
                      </div>
                      <div>
                        <span
                          className={cn(
                            "text-[10px] uppercase font-bold block",
                            isCreator ? "text-zinc-400" : "text-slate-400",
                          )}
                        >
                          Thời gian chi trả
                        </span>
                        <span
                          className={cn(
                            "font-semibold",
                            isCreator ? "text-zinc-300" : "text-slate-700 backoffice-dark:text-white/80",
                          )}
                        >
                          {formatDateTime(tx.paidAt || tx.createdAt)}
                        </span>
                      </div>
                    </div>

                    {/* Row 3: References & IDs */}
                    <div
                      className={cn(
                        "grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-1",
                        isCreator ? "text-zinc-400" : "text-slate-500 backoffice-dark:text-white/60",
                      )}
                    >
                      {tx.walletPayoutTransactionId && (
                        <div
                          className={cn(
                            "flex items-center justify-between gap-1 rounded-xl px-2.5 py-1.5 border",
                            isCreator
                              ? "bg-white/[0.02] border-white/5"
                              : "bg-slate-50/70 border-slate-100 backoffice-dark:bg-white/5 backoffice-dark:border-white/5",
                          )}
                        >
                          <span className="truncate">
                            <strong
                              className={cn(
                                isCreator ? "text-zinc-300" : "text-slate-700 backoffice-dark:text-white/80",
                              )}
                            >
                              Mã giao dịch:
                            </strong>{" "}
                            <span>{shortenId(tx.walletPayoutTransactionId)}</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopy(tx.walletPayoutTransactionId, "Mã giao dịch")}
                            className={cn(
                              "p-0.5 transition cursor-pointer",
                              isCreator
                                ? "text-zinc-500 hover:text-white"
                                : "text-slate-400 hover:text-slate-700 backoffice-dark:hover:text-white",
                            )}
                            title="Sao chép Mã giao dịch"
                          >
                            <Copy className="h-3 w-3" />
                          </button>
                        </div>
                      )}

                      {tx.payoutReference && (
                        <div
                          className={cn(
                            "flex items-center justify-between gap-1 rounded-xl px-2.5 py-1.5 border",
                            isCreator
                              ? "bg-white/[0.02] border-white/5"
                              : "bg-slate-50/70 border-slate-100 backoffice-dark:bg-white/5 backoffice-dark:border-white/5",
                          )}
                        >
                          <span className="truncate">
                            <strong
                              className={cn(
                                isCreator ? "text-zinc-300" : "text-slate-700 backoffice-dark:text-white/80",
                              )}
                            >
                              Mã tham chiếu:
                            </strong>{" "}
                            <span>{shortenId(tx.payoutReference)}</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopy(tx.payoutReference, "Mã tham chiếu")}
                            className={cn(
                              "p-0.5 transition cursor-pointer",
                              isCreator
                                ? "text-zinc-500 hover:text-white"
                                : "text-slate-400 hover:text-slate-700 backoffice-dark:hover:text-white",
                            )}
                            title="Sao chép Mã tham chiếu"
                          >
                            <Copy className="h-3 w-3" />
                          </button>
                        </div>
                      )}

                      {tx.gatewayBatchId && (
                        <div
                          className={cn(
                            "flex items-center justify-between gap-1 rounded-xl px-2.5 py-1.5 border",
                            isCreator
                              ? "bg-white/[0.02] border-white/5"
                              : "bg-slate-50/70 border-slate-100 backoffice-dark:bg-white/5 backoffice-dark:border-white/5",
                          )}
                        >
                          <span className="truncate">
                            <strong
                              className={cn(
                                isCreator ? "text-zinc-300" : "text-slate-700 backoffice-dark:text-white/80",
                              )}
                            >
                              Mã lô (Batch):
                            </strong>{" "}
                            <span>{shortenId(tx.gatewayBatchId)}</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopy(tx.gatewayBatchId, "Mã lô")}
                            className={cn(
                              "p-0.5 transition cursor-pointer",
                              isCreator
                                ? "text-zinc-500 hover:text-white"
                                : "text-slate-400 hover:text-slate-700 backoffice-dark:hover:text-white",
                            )}
                            title="Sao chép Mã lô"
                          >
                            <Copy className="h-3 w-3" />
                          </button>
                        </div>
                      )}

                      {tx.batchReferenceId && (
                        <div
                          className={cn(
                            "flex items-center justify-between gap-1 rounded-xl px-2.5 py-1.5 border",
                            isCreator
                              ? "bg-white/[0.02] border-white/5"
                              : "bg-slate-50/70 border-slate-100 backoffice-dark:bg-white/5 backoffice-dark:border-white/5",
                          )}
                        >
                          <span className="truncate">
                            <strong
                              className={cn(
                                isCreator ? "text-zinc-300" : "text-slate-700 backoffice-dark:text-white/80",
                              )}
                            >
                              Mã tham chiếu lô:
                            </strong>{" "}
                            <span>{shortenId(tx.batchReferenceId)}</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopy(tx.batchReferenceId, "Mã tham chiếu lô")}
                            className={cn(
                              "p-0.5 transition cursor-pointer",
                              isCreator
                                ? "text-zinc-500 hover:text-white"
                                : "text-slate-400 hover:text-slate-700 backoffice-dark:hover:text-white",
                            )}
                            title="Sao chép Mã tham chiếu lô"
                          >
                            <Copy className="h-3 w-3" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Failure reason if any */}
                    {tx.failureReason && (
                      <div className="rounded-xl bg-red-400/10 border border-red-400/30 p-2.5 text-xs text-red-300">
                        <span className="font-bold">Lý do thất bại: </span>
                        <span>{tx.failureReason}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
