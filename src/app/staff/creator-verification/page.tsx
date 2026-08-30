"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CreditCard, Eye, FileText, RefreshCw, Search, UserCheck } from "lucide-react";
import { toast } from "sonner";

import {
  adminVerificationKeys,
  getCreatorIdentities,
  getCreatorIdentityById,
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

export default function StaffCreatorVerificationPage() {
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const requestedTab = searchParams.get("tab") || "tax";
  const tab: "tax" | "payment" =
    requestedTab === "payment" ? "payment" : "tax";

  const pageTitle =
    tab === "payment"
      ? "Hồ sơ Thanh toán"
      : "Hồ sơ Thuế";

  const [selectedIdentity, setSelectedIdentity] =
    useState<CreatorIdentityRecord | null>(null);
  const [viewingIdentityId, setViewingIdentityId] = useState<string | null>(null);
  const [selectedPaymentProfile, setSelectedPaymentProfile] =
    useState<PaymentProfileRecord | null>(null);
  const [identityVerifiedNote, setIdentityVerifiedNote] = useState("");
  const [paymentVerifiedNote, setPaymentVerifiedNote] = useState("");
  const [paymentResultStatus, setPaymentResultStatus] =
    useState<Extract<PaymentVerificationStatus, "VERIFIED" | "REJECTED">>(
      "VERIFIED",
    );

  // Pagination & Filter state for tax profiles
  const [taxPage, setTaxPage] = useState(1);
  const taxPageSize = 10;
  const [searchDraft, setSearchDraft] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const queryParams = useMemo(() => {
    const params: Record<string, unknown> = {
      page: taxPage,
      pageSize: taxPageSize,
    };
    if (statusFilter !== "ALL") {
      params.statuses = statusFilter;
    }
    if (searchTerm.trim()) {
      params["criteria[taxId]"] = searchTerm.trim();
    }
    return params;
  }, [taxPage, taxPageSize, statusFilter, searchTerm]);

  const identitiesQuery = useQuery({
    queryKey: adminVerificationKeys.identities(queryParams),
    queryFn: () => getCreatorIdentities(queryParams),
  });

  const identityDetailQuery = useQuery({
    queryKey: adminVerificationKeys.identityDetail(viewingIdentityId ?? ""),
    queryFn: () => getCreatorIdentityById(viewingIdentityId!),
    enabled: Boolean(viewingIdentityId),
  });

  const paymentProfilesQuery = useQuery({
    queryKey: adminVerificationKeys.paymentProfiles(),
    queryFn: () => getPaymentProfiles(),
  });

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchTerm(searchDraft);
    setTaxPage(1);
  };

  const handleStatusFilterChange = (newStatus: string) => {
    setStatusFilter(newStatus);
    setTaxPage(1);
  };

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

  const handleContinueIdentityVerification = (
    record: CreatorIdentityRecord,
  ) => {
    setSelectedIdentity(record);
    setIdentityVerifiedNote(record.verifiedNote ?? "");
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

function removeVietnameseTones(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "d")
    .toLowerCase()
    .trim();
}

  const taxPageData = identitiesQuery.data;
  const displayTaxRecords = useMemo(() => {
    if (!taxPageData) return [];
    if (!searchTerm.trim()) return taxPageData.content;
    const rawTerm = searchTerm.toLowerCase().trim();
    const normTerm = removeVietnameseTones(searchTerm);

    return taxPageData.content.filter((r) => {
      const nameRaw = (r.accountName || "").toLowerCase();
      const nameNorm = removeVietnameseTones(r.accountName || "");
      const taxIdRaw = (r.taxId || "").toLowerCase();
      const idRaw = (r.id || "").toLowerCase();

      return (
        nameRaw.includes(rawTerm) ||
        nameNorm.includes(normTerm) ||
        taxIdRaw.includes(rawTerm) ||
        idRaw.includes(rawTerm)
      );
    });
  }, [taxPageData, searchTerm]);

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4 border-b border-gray-100 pb-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-900">
              Kiểm Duyệt Hồ Sơ
            </h1>
          </div>

          {/* Sub-tab navigation */}
          <div className="flex items-center gap-2 rounded-xl bg-gray-50 p-1.5 border border-gray-100 shrink-0">
            <Link
              href="/staff/creator-verification?tab=tax"
              className={cn(
                "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold transition-all",
                tab === "tax"
                  ? "bg-white text-[#10B981] shadow-sm"
                  : "text-gray-500 hover:text-gray-900",
              )}
            >
              <UserCheck className="h-4 w-4" />
              Hồ sơ thuế
            </Link>
            <Link
              href="/staff/creator-verification?tab=payment"
              className={cn(
                "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold transition-all",
                tab === "payment"
                  ? "bg-white text-[#10B981] shadow-sm"
                  : "text-gray-500 hover:text-gray-900",
              )}
            >
              <CreditCard className="h-4 w-4" />
              Hồ sơ thanh toán
            </Link>
          </div>
        </div>

        {tab === "tax" && (
          <section className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <form
              onSubmit={handleSearchSubmit}
              className="grid gap-3 sm:grid-cols-[minmax(240px,1fr)_200px_auto] sm:items-end"
            >
              <label className="relative block">
                <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-500">
                  Tìm kiếm
                </span>
                <Search className="absolute bottom-3 left-3 h-4 w-4 text-gray-400" />
                <input
                  type="search"
                  value={searchDraft}
                  onChange={(e) => setSearchDraft(e.target.value)}
                  placeholder="Mã số thuế, tên Creator, id..."
                  className="h-10 w-full rounded-lg border border-gray-200 bg-gray-50 pl-9 pr-3 text-sm font-medium text-gray-900 outline-none transition placeholder:text-gray-400 focus:bg-white focus:border-[#10B981] focus:ring-2 focus:ring-[#10B981]/15"
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-500">
                  Trạng thái
                </span>
                <select
                  value={statusFilter}
                  onChange={(e) => handleStatusFilterChange(e.target.value)}
                  className="h-10 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm font-semibold text-gray-700 outline-none transition focus:bg-white focus:border-[#10B981] focus:ring-2 focus:ring-[#10B981]/15"
                >
                  <option value="ALL">Tất cả trạng thái</option>
                  <option value="PENDING">Chờ xử lý</option>
                  <option value="IN_PROGRESS">Đang xử lý</option>
                  <option value="APPROVED">Đã duyệt</option>
                  <option value="REJECTED">Từ chối</option>
                </select>
              </label>

              <div className="flex gap-2">
                <Button
                  type="submit"
                  className="h-10 bg-[#10B981] px-4 font-semibold text-white hover:bg-[#0D9668] rounded-lg"
                >
                  Tìm kiếm
                </Button>
                {searchTerm || statusFilter !== "ALL" ? (
                  <Button
                    type="button"
                    onClick={() => {
                      setSearchDraft("");
                      setSearchTerm("");
                      setStatusFilter("ALL");
                      setTaxPage(1);
                    }}
                    className="h-10 border border-gray-200 bg-white text-gray-700 shadow-sm hover:bg-gray-50 hover:text-gray-900 rounded-lg"
                  >
                    Xóa lọc
                  </Button>
                ) : null}
              </div>
            </form>
          </section>
        )}

        {activeQuery.isLoading ? (
          <div className="flex min-h-72 items-center justify-center rounded-xl border border-gray-100 bg-gray-50/50">
            <div className="flex items-center gap-3 text-sm font-medium text-gray-500">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#10B981]/25 border-t-[#10B981]" />
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
                className="mt-4 h-9 bg-[#10B981] px-4 font-semibold text-white hover:bg-[#0D9668]"
              >
                Thử lại
              </Button>
            </div>
          </div>
        ) : null}

        {!activeQuery.isLoading && !activeQuery.isError && tab === "tax" ? (
          <IdentityTable
            records={displayTaxRecords}
            page={taxPageData?.pageNumber ?? taxPage}
            pageSize={taxPageData?.pageSize ?? taxPageSize}
            totalPages={taxPageData?.totalPages ?? 1}
            totalElements={taxPageData?.totalElements ?? displayTaxRecords.length}
            onPageChange={setTaxPage}
            onViewDetail={(record) => setViewingIdentityId(record.id)}
            onStartVerification={handleStartIdentityVerification}
            onContinueVerification={handleContinueIdentityVerification}
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

      {/* Modal xem chi tiết Hồ sơ Thuế */}
      <Dialog
        open={Boolean(viewingIdentityId)}
        onOpenChange={(open) => {
          if (!open) {
            setViewingIdentityId(null);
          }
        }}
      >
        <DialogContent className="gap-5 rounded-2xl border border-gray-100 bg-white p-6 text-gray-900 shadow-xl sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-heading text-2xl font-bold tracking-tight text-gray-900">
              <FileText className="h-6 w-6 text-[#10B981]" />
              Chi tiết hồ sơ thuế
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-500">
              Thông tin chi tiết định danh và thuế của Creator.
            </DialogDescription>
          </DialogHeader>

          {identityDetailQuery.isLoading ? (
            <div className="flex min-h-52 items-center justify-center">
              <div className="flex items-center gap-3 text-sm font-medium text-gray-500">
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-[#10B981]/25 border-t-[#10B981]" />
                Đang tải chi tiết hồ sơ...
              </div>
            </div>
          ) : identityDetailQuery.data ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                <div className="rounded-xl border border-gray-100 bg-gray-50/80 p-3.5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Tên Creator</p>
                  <p className="mt-1 text-sm font-bold text-gray-900">
                    {identityDetailQuery.data.accountName || "-"}
                  </p>
                </div>
                <div className="rounded-xl border border-gray-100 bg-gray-50/80 p-3.5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Họ và tên</p>
                  <p className="mt-1 text-sm font-bold text-gray-900">
                    {identityDetailQuery.data.fullName || "-"}
                  </p>
                </div>
                <div className="rounded-xl border border-gray-100 bg-gray-50/80 p-3.5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Mã số thuế</p>
                  <p className="mt-1 font-mono text-sm font-bold text-[#10B981]">
                    {identityDetailQuery.data.taxId || "-"}
                  </p>
                </div>
                <div className="rounded-xl border border-gray-100 bg-gray-50/80 p-3.5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Số CCCD / CMND</p>
                  <p className="mt-1 font-mono text-sm font-bold text-gray-900">
                    {identityDetailQuery.data.idNumber || "-"}
                  </p>
                </div>
                <div className="rounded-xl border border-gray-100 bg-gray-50/80 p-3.5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Ngày sinh</p>
                  <p className="mt-1 text-sm font-medium text-gray-900">
                    {identityDetailQuery.data.dob || "-"}
                  </p>
                </div>
                <div className="rounded-xl border border-gray-100 bg-gray-50/80 p-3.5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Giới tính</p>
                  <p className="mt-1 text-sm font-medium text-gray-900">
                    {identityDetailQuery.data.sex || "-"}
                  </p>
                </div>
                <div className="rounded-xl border border-gray-100 bg-gray-50/80 p-3.5 sm:col-span-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Địa chỉ thường trú</p>
                  <p className="mt-1 text-sm font-medium text-gray-900">
                    {identityDetailQuery.data.address || "-"}
                  </p>
                </div>
                <div className="rounded-xl border border-gray-100 bg-gray-50/80 p-3.5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Ngày hết hạn CCCD</p>
                  <p className="mt-1 text-sm font-medium text-gray-900">
                    {identityDetailQuery.data.doe || "-"}
                  </p>
                </div>
                <div className="rounded-xl border border-gray-100 bg-gray-50/80 p-3.5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Trạng thái</p>
                  <div className="mt-1">
                    {identityDetailQuery.data.status ? (
                      <StatusBadge
                        label={identityStatusLabels[identityDetailQuery.data.status]}
                        className={statusClassNames[identityDetailQuery.data.status]}
                      />
                    ) : (
                      "-"
                    )}
                  </div>
                </div>
                {identityDetailQuery.data.verifiedNote ? (
                  <div className="rounded-xl border border-amber-200/60 bg-amber-50/60 p-3.5 sm:col-span-2">
                    <p className="text-xs font-semibold uppercase tracking-wider text-amber-700">Ghi chú kiểm duyệt</p>
                    <p className="mt-1 text-sm text-gray-800">
                      {identityDetailQuery.data.verifiedNote}
                    </p>
                  </div>
                ) : null}
              </div>
            </div>
          ) : (
            <p className="text-center text-sm text-gray-400">Không có dữ liệu chi tiết.</p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              onClick={() => setViewingIdentityId(null)}
              className="h-9 border border-gray-200 bg-gray-100 px-4 font-semibold text-gray-700 hover:bg-gray-200 rounded-xl"
            >
              Đóng
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal xử lý Hồ sơ Thuế */}
      <Dialog
        open={Boolean(selectedIdentity)}
        onOpenChange={(open) => {
          if (!open && !submitIdentityMutation.isPending) {
            setSelectedIdentity(null);
            setIdentityVerifiedNote("");
          }
        }}
      >
        <DialogContent className="gap-5 rounded-2xl border border-gray-100 bg-white p-6 text-gray-900 shadow-xl sm:max-w-xl">
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
            className="min-h-32 resize-none rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:bg-white focus:border-[#10B981] focus:ring-4 focus:ring-[#10B981]/15"
          />

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button
              type="button"
              disabled={
                submitIdentityMutation.isPending || !identityVerifiedNote.trim()
              }
              onClick={() => handleSubmitIdentityVerification("REJECTED")}
              className="h-10 bg-red-500 px-5 font-semibold text-white hover:bg-red-600 rounded-xl"
            >
              {submitIdentityMutation.isPending ? "Đang xử lý..." : "Từ chối"}
            </Button>
            <Button
              type="button"
              disabled={
                submitIdentityMutation.isPending || !identityVerifiedNote.trim()
              }
              onClick={() => handleSubmitIdentityVerification("APPROVED")}
              className="h-10 bg-[#10B981] px-5 font-semibold text-white hover:bg-[#0D9668] rounded-xl"
            >
              {submitIdentityMutation.isPending ? "Đang xử lý..." : "Phê duyệt"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal xử lý Hồ sơ Thanh toán */}
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
        <DialogContent className="gap-5 rounded-2xl border border-gray-100 bg-white p-6 text-gray-900 shadow-xl sm:max-w-xl">
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
            className="min-h-32 resize-none rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:bg-white focus:border-[#10B981] focus:ring-4 focus:ring-[#10B981]/15"
          />

          <div className="grid gap-3 rounded-xl border border-gray-100 bg-gray-50 p-4">
            <label className="flex cursor-pointer items-center gap-3 text-sm font-medium text-gray-700">
              <input
                type="radio"
                name="payment-result-status"
                checked={paymentResultStatus === "VERIFIED"}
                onChange={() => setPaymentResultStatus("VERIFIED")}
                className="h-4 w-4 accent-[#10B981]"
              />
              VERIFIED - Đã duyệt
            </label>
            <label className="flex cursor-pointer items-center gap-3 text-sm font-medium text-gray-700">
              <input
                type="radio"
                name="payment-result-status"
                checked={paymentResultStatus === "REJECTED"}
                onChange={() => setPaymentResultStatus("REJECTED")}
                className="h-4 w-4 accent-[#10B981]"
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
              className="h-10 bg-[#10B981] px-5 font-semibold text-white hover:bg-[#0D9668] rounded-xl"
            >
              {submitPaymentMutation.isPending
                ? "Đang cập nhật..."
                : "Cập nhật kết quả"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function IdentityTable({
  records,
  page,
  pageSize,
  totalPages,
  totalElements,
  onPageChange,
  onViewDetail,
  onStartVerification,
  onContinueVerification,
  isSubmitting,
}: {
  records: CreatorIdentityRecord[];
  page: number;
  pageSize: number;
  totalPages: number;
  totalElements: number;
  onPageChange: (page: number) => void;
  onViewDetail: (record: CreatorIdentityRecord) => void;
  onStartVerification: (record: CreatorIdentityRecord) => void;
  onContinueVerification: (record: CreatorIdentityRecord) => void;
  isSubmitting: boolean;
}) {
  const firstItem = totalElements === 0 ? 0 : (page - 1) * pageSize + 1;
  const lastItem = Math.min(page * pageSize, totalElements);

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] border-collapse text-left text-sm">
          <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
            <tr>
              <th className="px-6 py-4 font-semibold">Tên Creator</th>
              <th className="px-6 py-4 font-semibold">Mã số thuế</th>
              <th className="px-6 py-4 font-semibold">Trạng thái</th>
              <th className="px-6 py-4 text-right font-semibold">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {records.length ? (
              records.map((record) => (
                <tr
                  key={record.id}
                  className="text-gray-700 transition hover:bg-gray-50/50"
                >
                  <td className="px-6 py-4 font-bold text-gray-900">
                    {record.accountName}
                  </td>
                  <td className="px-6 py-4 font-mono text-gray-700">
                    {record.taxId}
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge
                      label={identityStatusLabels[record.status]}
                      className={statusClassNames[record.status]}
                    />
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        type="button"
                        onClick={() => onViewDetail(record)}
                        className="h-9 border border-gray-200 bg-gray-50 px-3 text-xs font-bold text-gray-700 hover:bg-gray-100 hover:text-gray-900 rounded-lg"
                      >
                        <Eye className="mr-1.5 h-3.5 w-3.5" />
                        Chi tiết
                      </Button>
                      {record.status === "PENDING" ? (
                        <Button
                          type="button"
                          disabled={isSubmitting}
                          onClick={() => onStartVerification(record)}
                          className="h-9 bg-[#10B981] px-4 font-bold text-white hover:bg-[#0D9668] rounded-lg text-xs"
                        >
                          {isSubmitting ? "Đang xử lý..." : "Tiến hành xử lý"}
                        </Button>
                      ) : record.status === "IN_PROGRESS" ? (
                        <Button
                          type="button"
                          disabled={isSubmitting}
                          onClick={() => onContinueVerification(record)}
                          className="h-9 bg-blue-600 px-4 font-bold text-white hover:bg-blue-700 rounded-lg text-xs"
                        >
                          Tiếp tục xử lý
                        </Button>
                      ) : (
                        <span className="text-xs font-medium text-gray-400">
                          Không có thao tác
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={4}
                  className="px-6 py-12 text-center text-sm font-medium text-gray-400"
                >
                  Chưa có hồ sơ thuế cần hiển thị.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalElements > 0 && (
        <div className="flex flex-col gap-3 border-t border-gray-100 bg-gray-50/50 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-semibold text-gray-500">
            Hiển thị {firstItem} - {lastItem} / {totalElements} hồ sơ
          </p>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              className="border-gray-200 bg-white text-gray-700 shadow-sm hover:bg-gray-50 hover:text-gray-900 rounded-lg"
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
            >
              Trước
            </Button>
            <span className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-black text-gray-700 shadow-sm">
              {page} / {Math.max(totalPages, 1)}
            </span>
            <Button
              type="button"
              variant="outline"
              className="border-gray-200 bg-white text-gray-700 shadow-sm hover:bg-gray-50 hover:text-gray-900 rounded-lg"
              disabled={page >= totalPages}
              onClick={() => onPageChange(page + 1)}
            >
              Sau
            </Button>
          </div>
        </div>
      )}
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
    <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[920px] border-collapse text-left text-sm">
          <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
            <tr>
              <th className="px-6 py-4 font-semibold">Tên Creator</th>
              <th className="px-6 py-4 font-semibold">Ngân hàng</th>
              <th className="px-6 py-4 font-semibold">Số TK</th>
              <th className="px-6 py-4 font-semibold">Trạng thái</th>
              <th className="px-6 py-4 text-right font-semibold">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {records.length ? (
              records.map((record) => (
                <tr
                  key={record.id}
                  className="text-gray-700 transition hover:bg-gray-50/50"
                >
                  <td className="px-6 py-4 font-bold text-gray-900">
                    {record.accountName}
                  </td>
                  <td className="px-6 py-4 font-mono text-gray-700">
                    {record.bankCode}
                  </td>
                  <td className="px-6 py-4 font-mono text-gray-700">
                    {record.accountNumber}
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge
                      label={paymentStatusLabels[record.status]}
                      className={statusClassNames[record.status]}
                    />
                  </td>
                  <td className="px-6 py-4 text-right">
                    {record.status === "PENDING" ? (
                      <Button
                        type="button"
                        disabled={isSubmitting}
                        onClick={() => onOpenVerification(record)}
                        className="h-9 bg-[#10B981] px-4 font-bold text-white hover:bg-[#0D9668] rounded-lg text-xs"
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
                  colSpan={5}
                  className="px-6 py-12 text-center text-sm font-medium text-gray-400"
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
        "inline-flex rounded-full border px-3 py-1 text-xs font-bold",
        className,
      )}
    >
      {label}
    </span>
  );
}
