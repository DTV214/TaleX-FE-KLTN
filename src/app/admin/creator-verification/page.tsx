"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  adminVerificationKeys,
  getCreatorIdentities,
  getPaymentProfiles,
  updateIdentityVerification,
  updatePaymentVerification,
  type CreatorIdentityRecord,
  type IdentityVerificationStatus,
  type PaymentProfileRecord,
  type PaymentVerificationStatus,
} from "@/features/admin/api/admin-creator-verification-api";
import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { cn } from "@/shared/utils/utils";

const identityStatusLabels: Record<IdentityVerificationStatus, string> = {
  PENDING: "Chờ xử lý",
  IN_PROGRESS: "Đang xử lý",
  APPROVED: "Đã duyệt",
  REJECTED: "Từ chối",
};

const paymentStatusLabels: Record<PaymentVerificationStatus, string> = {
  PENDING: "Chờ duyệt",
  VERIFIED: "Đã duyệt",
  REJECTED: "Từ chối",
  CANCELLED: "Đã hủy",
};

const statusClassNames: Record<
  IdentityVerificationStatus | PaymentVerificationStatus,
  string
> = {
  PENDING: "border-amber-200 bg-amber-50 text-amber-700",
  IN_PROGRESS: "border-blue-200 bg-blue-50 text-blue-700",
  APPROVED: "border-emerald-200 bg-emerald-50 text-emerald-700",
  VERIFIED: "border-emerald-200 bg-emerald-50 text-emerald-700",
  REJECTED: "border-red-200 bg-red-50 text-red-700",
  CANCELLED: "border-gray-200 bg-gray-100 text-gray-600",
};

const ERROR_MESSAGE = "Đã có lỗi xảy ra. Vui lòng thử lại sau.";

type IdentitySubmitInput = {
  id: string;
  status: Extract<IdentityVerificationStatus, "APPROVED" | "REJECTED">;
  verifiedNote: string;
};

type PaymentSubmitInput = {
  id: string;
  status: Extract<PaymentVerificationStatus, "VERIFIED" | "REJECTED">;
  verifiedNote: string;
};

export default function AdminCreatorVerificationPage() {
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const requestedTab = searchParams.get("tab") || "tax";
  const tab: "tax" | "payment" =
    requestedTab === "payment" ? "payment" : "tax";
  const pageTitle =
    tab === "payment"
      ? "Kiểm duyệt Hồ sơ Thanh toán"
      : "Kiểm duyệt Hồ sơ Thuế";
  const [selectedIdentity, setSelectedIdentity] =
    useState<CreatorIdentityRecord | null>(null);
  const [selectedPaymentProfile, setSelectedPaymentProfile] =
    useState<PaymentProfileRecord | null>(null);
  const [identityVerifiedNote, setIdentityVerifiedNote] = useState("");
  const [paymentVerifiedNote, setPaymentVerifiedNote] = useState("");
  const [paymentResultStatus, setPaymentResultStatus] =
    useState<Extract<PaymentVerificationStatus, "VERIFIED" | "REJECTED">>(
      "VERIFIED",
    );

  const identitiesQuery = useQuery({
    queryKey: adminVerificationKeys.identities(),
    queryFn: () => getCreatorIdentities(),
  });

  const paymentProfilesQuery = useQuery({
    queryKey: adminVerificationKeys.paymentProfiles(),
    queryFn: () => getPaymentProfiles(),
  });

  const invalidateIdentities = () => {
    void queryClient.invalidateQueries({
      queryKey: adminVerificationKeys.identities(),
    });
  };

  const invalidatePaymentProfiles = () => {
    void queryClient.invalidateQueries({
      queryKey: adminVerificationKeys.paymentProfiles(),
    });
  };

  const lockIdentityMutation = useMutation({
    mutationFn: (record: CreatorIdentityRecord) =>
      updateIdentityVerification(record.id, {
        status: "IN_PROGRESS",
        verifiedNote: "",
      }),
    onSuccess: (_data, record) => {
      const lockedRecord: CreatorIdentityRecord = {
        ...record,
        status: "IN_PROGRESS",
      };

      setSelectedIdentity(lockedRecord);
      setIdentityVerifiedNote(record.verifiedNote ?? "");
      toast.success("Đã khóa hồ sơ thuế để xử lý.");
      invalidateIdentities();
    },
    onError: () => {
      toast.error(ERROR_MESSAGE);
    },
  });

  const submitIdentityMutation = useMutation({
    mutationFn: ({ id, status, verifiedNote }: IdentitySubmitInput) =>
      updateIdentityVerification(id, {
        status,
        verifiedNote,
      }),
    onSuccess: () => {
      setSelectedIdentity(null);
      setIdentityVerifiedNote("");
      toast.success("Đã cập nhật kết quả kiểm duyệt hồ sơ thuế.");
      invalidateIdentities();
    },
    onError: () => {
      toast.error(ERROR_MESSAGE);
    },
  });

  const submitPaymentMutation = useMutation({
    mutationFn: ({ id, status, verifiedNote }: PaymentSubmitInput) =>
      updatePaymentVerification(id, {
        status,
        verifiedNote,
      }),
    onSuccess: () => {
      setSelectedPaymentProfile(null);
      setPaymentVerifiedNote("");
      setPaymentResultStatus("VERIFIED");
      toast.success("Đã cập nhật kết quả kiểm duyệt hồ sơ thanh toán.");
      invalidatePaymentProfiles();
    },
    onError: () => {
      toast.error(ERROR_MESSAGE);
    },
  });

  const handleStartIdentityVerification = (record: CreatorIdentityRecord) => {
    if (lockIdentityMutation.isPending || submitIdentityMutation.isPending) {
      return;
    }

    lockIdentityMutation.mutate(record);
  };

  const handleSubmitIdentityVerification = (
    status: Extract<IdentityVerificationStatus, "APPROVED" | "REJECTED">,
  ) => {
    if (
      !selectedIdentity ||
      submitIdentityMutation.isPending ||
      !identityVerifiedNote.trim()
    ) {
      return;
    }

    submitIdentityMutation.mutate({
      id: selectedIdentity.id,
      status,
      verifiedNote: identityVerifiedNote.trim(),
    });
  };

  const handleOpenPaymentVerification = (record: PaymentProfileRecord) => {
    setSelectedPaymentProfile(record);
    setPaymentVerifiedNote(record.verifiedNote ?? "");
    setPaymentResultStatus("VERIFIED");
  };

  const handleSubmitPaymentVerification = () => {
    if (
      !selectedPaymentProfile ||
      submitPaymentMutation.isPending ||
      !paymentVerifiedNote.trim()
    ) {
      return;
    }

    submitPaymentMutation.mutate({
      id: selectedPaymentProfile.id,
      status: paymentResultStatus,
      verifiedNote: paymentVerifiedNote.trim(),
    });
  };

  const activeQuery = tab === "tax" ? identitiesQuery : paymentProfilesQuery;
  const isIdentitySubmitting =
    lockIdentityMutation.isPending || submitIdentityMutation.isPending;
  const isPaymentSubmitting = submitPaymentMutation.isPending;

  return (
    <section className="w-full rounded-xl border border-gray-200 bg-white p-6 text-gray-900 shadow-sm">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4 border-b border-gray-200 pb-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#7B42FF]">
              Admin Panel
            </p>
            <h1 className="mt-2 font-heading text-3xl font-black tracking-tight text-gray-900">
              {pageTitle}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-500">
              Xử lý hồ sơ thuế và tài khoản thanh toán trước khi Creator được
              bật kiếm tiền trên TaleX.
            </p>
          </div>
        </div>

        {activeQuery.isLoading ? (
          <div className="flex min-h-72 items-center justify-center rounded-xl border border-gray-200 bg-white">
            <div className="flex items-center gap-3 text-sm font-medium text-gray-500">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#7B42FF]/25 border-t-[#7B42FF]" />
              Đang tải dữ liệu kiểm duyệt...
            </div>
          </div>
        ) : null}

        {activeQuery.isError ? (
          <div className="flex min-h-72 items-center justify-center rounded-xl border border-red-200 bg-red-50 p-6 text-center">
            <div>
              <p className="text-sm font-semibold text-red-700">
                Không thể tải dữ liệu kiểm duyệt.
              </p>
              <Button
                type="button"
                onClick={() => void activeQuery.refetch()}
                className="mt-4 h-9 bg-[#7B42FF] px-4 font-semibold text-white hover:bg-[#6834E0]"
              >
                Thử lại
              </Button>
            </div>
          </div>
        ) : null}

        {!activeQuery.isLoading && !activeQuery.isError && tab === "tax" ? (
          <IdentityTable
            records={identitiesQuery.data ?? []}
            onStartVerification={handleStartIdentityVerification}
            isSubmitting={isIdentitySubmitting}
          />
        ) : null}

        {!activeQuery.isLoading &&
        !activeQuery.isError &&
        tab === "payment" ? (
          <PaymentProfileTable
            records={paymentProfilesQuery.data ?? []}
            onOpenVerification={handleOpenPaymentVerification}
            isSubmitting={isPaymentSubmitting}
          />
        ) : null}
      </div>

      <Dialog
        open={Boolean(selectedIdentity)}
        onOpenChange={(open) => {
          if (!open && !submitIdentityMutation.isPending) {
            setSelectedIdentity(null);
            setIdentityVerifiedNote("");
          }
        }}
      >
        <DialogContent className="gap-5 rounded-xl border border-gray-200 bg-white p-5 text-gray-900 shadow-xl sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="font-heading text-2xl font-bold tracking-tight text-gray-900">
              Xử lý hồ sơ thuế
            </DialogTitle>
            <DialogDescription className="text-sm leading-6 text-gray-500">
              Nhập ghi chú kiểm duyệt trước khi phê duyệt hoặc từ chối hồ sơ.
            </DialogDescription>
          </DialogHeader>

          <textarea
            value={identityVerifiedNote}
            onChange={(event) => setIdentityVerifiedNote(event.target.value)}
            placeholder="Ghi chú kiểm duyệt"
            className="min-h-32 resize-none rounded-lg border border-gray-300 bg-white p-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-[#7B42FF] focus:ring-2 focus:ring-[#7B42FF]/20"
          />

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button
              type="button"
              disabled={
                submitIdentityMutation.isPending || !identityVerifiedNote.trim()
              }
              onClick={() => handleSubmitIdentityVerification("REJECTED")}
              className="h-10 bg-red-500 px-5 font-semibold text-white hover:bg-red-500/85"
            >
              {submitIdentityMutation.isPending ? "Đang xử lý..." : "Từ chối"}
            </Button>
            <Button
              type="button"
              disabled={
                submitIdentityMutation.isPending || !identityVerifiedNote.trim()
              }
              onClick={() => handleSubmitIdentityVerification("APPROVED")}
              className="h-10 bg-emerald-500 px-5 font-semibold text-white hover:bg-emerald-500/85"
            >
              {submitIdentityMutation.isPending ? "Đang xử lý..." : "Phê duyệt"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(selectedPaymentProfile)}
        onOpenChange={(open) => {
          if (!open && !submitPaymentMutation.isPending) {
            setSelectedPaymentProfile(null);
            setPaymentVerifiedNote("");
            setPaymentResultStatus("VERIFIED");
          }
        }}
      >
        <DialogContent className="gap-5 rounded-xl border border-gray-200 bg-white p-5 text-gray-900 shadow-xl sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="font-heading text-2xl font-bold tracking-tight text-gray-900">
              Xử lý hồ sơ thanh toán
            </DialogTitle>
            <DialogDescription className="text-sm leading-6 text-gray-500">
              Chọn kết quả kiểm duyệt và ghi chú phản hồi cho Creator.
            </DialogDescription>
          </DialogHeader>

          <textarea
            value={paymentVerifiedNote}
            onChange={(event) => setPaymentVerifiedNote(event.target.value)}
            placeholder="Ghi chú kiểm duyệt"
            className="min-h-32 resize-none rounded-lg border border-gray-300 bg-white p-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-[#7B42FF] focus:ring-2 focus:ring-[#7B42FF]/20"
          />

          <div className="grid gap-3 rounded-lg border border-gray-200 bg-gray-50 p-4">
            <label className="flex cursor-pointer items-center gap-3 text-sm font-medium text-gray-700">
              <input
                type="radio"
                name="payment-result-status"
                checked={paymentResultStatus === "VERIFIED"}
                onChange={() => setPaymentResultStatus("VERIFIED")}
                className="h-4 w-4 accent-[#7B42FF]"
              />
              VERIFIED - Đã duyệt
            </label>
            <label className="flex cursor-pointer items-center gap-3 text-sm font-medium text-gray-700">
              <input
                type="radio"
                name="payment-result-status"
                checked={paymentResultStatus === "REJECTED"}
                onChange={() => setPaymentResultStatus("REJECTED")}
                className="h-4 w-4 accent-[#7B42FF]"
              />
              REJECTED - Từ chối
            </label>
          </div>

          <div className="flex justify-end">
            <Button
              type="button"
              disabled={
                submitPaymentMutation.isPending || !paymentVerifiedNote.trim()
              }
              onClick={handleSubmitPaymentVerification}
              className="h-10 bg-[#7B42FF] px-5 font-semibold text-white hover:bg-[#6834E0]"
            >
              {submitPaymentMutation.isPending
                ? "Đang cập nhật..."
                : "Cập nhật kết quả"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}

function IdentityTable({
  records,
  onStartVerification,
  isSubmitting,
}: {
  records: CreatorIdentityRecord[];
  onStartVerification: (record: CreatorIdentityRecord) => void;
  isSubmitting: boolean;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] border-collapse text-left text-sm">
          <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
            <tr>
              <th className="px-4 py-3 font-semibold">Tên Creator</th>
              <th className="px-4 py-3 font-semibold">Mã số thuế</th>
              <th className="px-4 py-3 font-semibold">Trạng thái</th>
              <th className="px-4 py-3 text-right font-semibold">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {records.length ? (
              records.map((record) => (
                <tr
                  key={record.id}
                  className="text-gray-700 transition hover:bg-gray-50/70"
                >
                  <td className="px-4 py-4 font-semibold text-gray-900">
                    {record.creatorName}
                  </td>
                  <td className="px-4 py-4 font-mono text-gray-700">
                    {record.taxId}
                  </td>
                  <td className="px-4 py-4">
                    <StatusBadge
                      label={identityStatusLabels[record.status]}
                      className={statusClassNames[record.status]}
                    />
                  </td>
                  <td className="px-4 py-4 text-right">
                    {record.status === "PENDING" ? (
                      <Button
                        type="button"
                        disabled={isSubmitting}
                        onClick={() => onStartVerification(record)}
                        className="h-9 bg-[#7B42FF] px-4 font-semibold text-white hover:bg-[#6834E0]"
                      >
                        {isSubmitting ? "Đang xử lý..." : "Tiến hành xử lý"}
                      </Button>
                    ) : (
                      <span className="text-xs font-medium text-gray-400">
                        Không có thao tác
                      </span>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={4}
                  className="px-4 py-10 text-center text-sm font-medium text-gray-400"
                >
                  Chưa có hồ sơ thuế cần hiển thị.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PaymentProfileTable({
  records,
  onOpenVerification,
  isSubmitting,
}: {
  records: PaymentProfileRecord[];
  onOpenVerification: (record: PaymentProfileRecord) => void;
  isSubmitting: boolean;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[920px] border-collapse text-left text-sm">
          <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
            <tr>
              <th className="px-4 py-3 font-semibold">Tên Creator</th>
              <th className="px-4 py-3 font-semibold">Ngân hàng</th>
              <th className="px-4 py-3 font-semibold">Số TK</th>
              <th className="px-4 py-3 font-semibold">Tên TK</th>
              <th className="px-4 py-3 font-semibold">Trạng thái</th>
              <th className="px-4 py-3 text-right font-semibold">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {records.length ? (
              records.map((record) => (
                <tr
                  key={record.id}
                  className="text-gray-700 transition hover:bg-gray-50/70"
                >
                  <td className="px-4 py-4 font-semibold text-gray-900">
                    {record.creatorName}
                  </td>
                  <td className="px-4 py-4 font-mono text-gray-700">
                    {record.bankCode}
                  </td>
                  <td className="px-4 py-4 font-mono text-gray-700">
                    {record.accountNumber}
                  </td>
                  <td className="px-4 py-4 text-gray-700">
                    {record.accountName}
                  </td>
                  <td className="px-4 py-4">
                    <StatusBadge
                      label={paymentStatusLabels[record.status]}
                      className={statusClassNames[record.status]}
                    />
                  </td>
                  <td className="px-4 py-4 text-right">
                    {record.status === "PENDING" ? (
                      <Button
                        type="button"
                        disabled={isSubmitting}
                        onClick={() => onOpenVerification(record)}
                        className="h-9 bg-[#7B42FF] px-4 font-semibold text-white hover:bg-[#6834E0]"
                      >
                        {isSubmitting ? "Đang xử lý..." : "Kiểm duyệt"}
                      </Button>
                    ) : (
                      <span className="text-xs font-medium text-gray-400">
                        Không có thao tác
                      </span>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-10 text-center text-sm font-medium text-gray-400"
                >
                  Chưa có hồ sơ thanh toán cần hiển thị.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatusBadge({
  label,
  className,
}: {
  label: string;
  className: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-3 py-1 text-xs font-semibold",
        className,
      )}
    >
      {label}
    </span>
  );
}

