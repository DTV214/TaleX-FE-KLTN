"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

import {
  acceptCreatorMonetizationTerms,
  createPaymentProfile,
  creatorMonetizationKeys,
  deletePaymentProfile,
  getActiveCreatorMonetizationTerm,
  getCreatorVerificationStatus,
  submitCreatorVerification,
  updateCreatorTaxIdentity,
  updatePaymentProfile,
  type CreatorIdentityStatus,
  type CreatorPaymentStatus,
  type PaymentProfileRequestDto,
  type TermVersionDto,
} from "@/features/creator-dashboard/api/creator-monetization-api";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { cn } from "@/shared/utils/utils";

type IdentityStatus = "AWAITING_FILL" | "PENDING" | "APPROVED" | "REJECTED";
type PaymentStatus = "PENDING" | "VERIFIED" | "REJECTED" | "CANCELLED";
type PaymentFormData = PaymentProfileRequestDto;

const identityStatusLabels: Record<IdentityStatus, string> = {
  AWAITING_FILL: "Chưa cung cấp",
  PENDING: "Chờ duyệt",
  APPROVED: "Đã duyệt",
  REJECTED: "Bị từ chối",
};

const identityStatusClassNames: Record<IdentityStatus, string> = {
  AWAITING_FILL: "border-white/20 bg-white/10 text-white/70",
  PENDING: "border-primary/35 bg-primary/10 text-primary",
  APPROVED: "border-emerald-400/35 bg-emerald-400/10 text-emerald-300",
  REJECTED: "border-red-400/35 bg-red-400/10 text-red-300",
};

const paymentStatusLabels: Record<PaymentStatus, string> = {
  PENDING: "Đang chờ duyệt",
  VERIFIED: "Đã duyệt",
  REJECTED: "Bị từ chối",
  CANCELLED: "Đã hủy",
};

const paymentStatusClassNames: Record<PaymentStatus, string> = {
  PENDING: "border-primary/35 bg-primary/10 text-primary",
  VERIFIED: "border-emerald-400/35 bg-emerald-400/10 text-emerald-300",
  REJECTED: "border-red-400/35 bg-red-400/10 text-red-300",
  CANCELLED: "border-white/20 bg-white/10 text-white/62",
};

const identityStatusByCode: Record<number, IdentityStatus> = {
  0: "AWAITING_FILL",
  1: "PENDING",
  2: "APPROVED",
  3: "REJECTED",
};

const paymentStatusByCode: Record<number, PaymentStatus> = {
  0: "PENDING",
  1: "VERIFIED",
  2: "REJECTED",
  3: "CANCELLED",
};

const emptyPaymentFormData: PaymentFormData = {
  bankCode: "",
  accountNumber: "",
  accountName: "",
  isPrimary: true,
};

function normalizeIdentityStatus(
  status: CreatorIdentityStatus | null | undefined,
): IdentityStatus | null {
  if (status === null || status === undefined || status === "") {
    return null;
  }

  if (typeof status === "number") {
    return identityStatusByCode[status] ?? null;
  }

  const normalized = String(status).toUpperCase();
  return normalized in identityStatusLabels
    ? (normalized as IdentityStatus)
    : null;
}

function normalizePaymentStatus(
  status: CreatorPaymentStatus | null | undefined,
): PaymentStatus | null {
  if (status === null || status === undefined || status === "") {
    return null;
  }

  if (typeof status === "number") {
    return paymentStatusByCode[status] ?? null;
  }

  const normalized = String(status).toUpperCase();
  return normalized in paymentStatusLabels
    ? (normalized as PaymentStatus)
    : null;
}

function getTermVersionId(term?: TermVersionDto | null) {
  return term?.versionId ?? term?.id ?? "";
}

function toPaymentProfileRequest(
  formData: PaymentFormData,
): PaymentProfileRequestDto {
  return {
    bankCode: formData.bankCode.trim(),
    accountNumber: formData.accountNumber.trim(),
    accountName: formData.accountName.trim(),
    isPrimary: formData.isPrimary,
  };
}

const ERROR_MESSAGE = "Đã có lỗi xảy ra. Vui lòng thử lại sau.";

export function CreatorMonetizationView() {
  const queryClient = useQueryClient();
  const authUser = useAuthStore((state) => state.user);
  const [isAgreed, setIsAgreed] = useState(false);
  const [isStep1ModalOpen, setIsStep1ModalOpen] = useState(false);
  const [isStep1Agreed, setIsStep1Agreed] = useState(false);
  const [isStep2ModalOpen, setIsStep2ModalOpen] = useState(false);
  const [step2InputTaxId, setStep2InputTaxId] = useState("");
  const [isStep3ModalOpen, setIsStep3ModalOpen] = useState(false);
  const [step3FormData, setStep3FormData] = useState<PaymentFormData>(
    emptyPaymentFormData,
  );

  const verificationStatusQuery = useQuery({
    queryKey: creatorMonetizationKeys.verificationStatus(),
    queryFn: async () => {
      const data = await getCreatorVerificationStatus();
      console.log("[CreatorMonetization] GET verification-status response", data);
      return data;
    },
    retry: false,
  });

  const verificationStatus = verificationStatusQuery.data;
  const isCreatorVerified = Boolean(verificationStatus?.isCreatorVerified);
  const isTermsAccepted = Boolean(verificationStatus?.isTermsAccepted);
  const identityStatus = normalizeIdentityStatus(
    verificationStatus?.identityStatus,
  );
  const paymentStatus = normalizePaymentStatus(
    verificationStatus?.paymentStatus,
  );
  const taxId = verificationStatus?.taxId ?? "";
  const identityVerifiedAt = verificationStatus?.identityVerifiedAt ?? null;
  const paymentVerifiedAt = verificationStatus?.paymentVerifiedAt ?? null;
  const paymentProfileId = verificationStatus?.paymentProfileId ?? "";

  const gatewayTermQuery = useQuery({
    queryKey: creatorMonetizationKeys.activeTerm("CREATOR_VERIFYING_PROCESS"),
    queryFn: async () => {
      const data = await getActiveCreatorMonetizationTerm(
        "CREATOR_VERIFYING_PROCESS",
      );
      console.log("[CreatorMonetization] GET gateway term response", data);
      return data;
    },
    enabled: Boolean(verificationStatus && !isCreatorVerified),
  });

  const step1TermQuery = useQuery({
    queryKey: creatorMonetizationKeys.activeTerm(
      "CREATOR_ENABLE_MONETIZATION",
    ),
    queryFn: async () => {
      const data = await getActiveCreatorMonetizationTerm(
        "CREATOR_ENABLE_MONETIZATION",
      );
      console.log("[CreatorMonetization] GET step1 term response", data);
      return data;
    },
    enabled: isStep1ModalOpen && isCreatorVerified && !isTermsAccepted,
  });

  const invalidateVerificationStatus = () => {
    void queryClient.invalidateQueries({
      queryKey: creatorMonetizationKeys.verificationStatus(),
    });
  };

  const gatewayTermId = getTermVersionId(gatewayTermQuery.data);
  const step1TermId = getTermVersionId(step1TermQuery.data);

  const submitGatewayMutation = useMutation({
    mutationFn: submitCreatorVerification,
    onSuccess: () => {
      setIsAgreed(false);
      invalidateVerificationStatus();
    },
    onError: () => {
      toast.error(ERROR_MESSAGE);
    },
  });

  const acceptTermsMutation = useMutation({
    mutationFn: acceptCreatorMonetizationTerms,
    onSuccess: () => {
      setIsStep1Agreed(false);
      setIsStep1ModalOpen(false);
      invalidateVerificationStatus();
    },
    onError: () => {
      toast.error(ERROR_MESSAGE);
    },
  });

  const updateTaxMutation = useMutation({
    mutationFn: updateCreatorTaxIdentity,
    onSuccess: () => {
      setIsStep2ModalOpen(false);
      invalidateVerificationStatus();
    },
    onError: () => {
      toast.error(ERROR_MESSAGE);
    },
  });

  const savePaymentProfileMutation = useMutation({
    mutationFn: (payload: PaymentProfileRequestDto) => {
      if (paymentProfileId && paymentStatus !== "CANCELLED") {
        return updatePaymentProfile(paymentProfileId, payload);
      }

      return createPaymentProfile(payload);
    },
    onSuccess: () => {
      setIsStep3ModalOpen(false);
      invalidateVerificationStatus();
    },
    onError: () => {
      toast.error(ERROR_MESSAGE);
    },
  });

  const cancelPaymentProfileMutation = useMutation({
    mutationFn: deletePaymentProfile,
    onSuccess: () => {
      invalidateVerificationStatus();
    },
    onError: () => {
      toast.error(ERROR_MESSAGE);
    },
  });

  const handleSubmitVerification = () => {
    if (!isAgreed || submitGatewayMutation.isPending || !gatewayTermId) {
      return;
    }

    submitGatewayMutation.mutate(gatewayTermId);
  };

  const handleOpenStep1Modal = () => {
    setIsStep1Agreed(false);
    setIsStep1ModalOpen(true);
  };

  const handleStep1OpenChange = (open: boolean) => {
    if (!open && acceptTermsMutation.isPending) {
      return;
    }

    setIsStep1ModalOpen(open);

    if (!open) {
      setIsStep1Agreed(false);
    }
  };

  const handleSubmitStep1Terms = () => {
    if (
      !isStep1Agreed ||
      acceptTermsMutation.isPending ||
      !step1TermId
    ) {
      return;
    }

    acceptTermsMutation.mutate(step1TermId);
  };

  const handleOpenStep2Modal = () => {
    if (!isTermsAccepted) {
      return;
    }

    setStep2InputTaxId(taxId);
    setIsStep2ModalOpen(true);
  };

  const handleStep2OpenChange = (open: boolean) => {
    if (!open && updateTaxMutation.isPending) {
      return;
    }

    setIsStep2ModalOpen(open);

    if (!open) {
      setStep2InputTaxId(taxId);
    }
  };

  const handleSubmitStep2TaxProfile = () => {
    const nextTaxId = step2InputTaxId.trim();

    if (updateTaxMutation.isPending || !nextTaxId) {
      return;
    }

    updateTaxMutation.mutate(nextTaxId);
  };

  const handleOpenStep3Modal = () => {
    if (!identityStatus || identityStatus === "AWAITING_FILL") {
      return;
    }

    setIsStep3ModalOpen(true);
  };

  const handleStep3OpenChange = (open: boolean) => {
    if (!open && savePaymentProfileMutation.isPending) {
      return;
    }

    setIsStep3ModalOpen(open);
  };

  const updateStep3FormData = <FieldName extends keyof PaymentFormData>(
    fieldName: FieldName,
    value: PaymentFormData[FieldName],
  ) => {
    setStep3FormData((currentFormData) => ({
      ...currentFormData,
      [fieldName]: value,
    }));
  };

  const handleSubmitStep3PaymentProfile = () => {
    const payload = toPaymentProfileRequest(step3FormData);
    const isMissingRequiredField =
      !payload.bankCode || !payload.accountNumber || !payload.accountName;

    if (savePaymentProfileMutation.isPending || isMissingRequiredField) {
      return;
    }

    savePaymentProfileMutation.mutate(payload);
  };

  const handleCancelPaymentProfile = () => {
    if (cancelPaymentProfileMutation.isPending || !paymentProfileId) {
      return;
    }

    cancelPaymentProfileMutation.mutate(paymentProfileId);
  };

  const isCheckingStatus = verificationStatusQuery.isLoading;
  const isStatusRefreshing =
    verificationStatusQuery.isFetching && !verificationStatusQuery.isLoading;
  const hasVerificationStatus =
    verificationStatusQuery.isSuccess && Boolean(verificationStatus);
  const shouldShowGateway = hasVerificationStatus && !isCreatorVerified;
  const shouldShowDashboard = hasVerificationStatus && isCreatorVerified;
  const isStep2Enabled = isTermsAccepted;
  const isStep3Enabled =
    identityStatus !== null && identityStatus !== "AWAITING_FILL";
  const canSubmitStep3 =
    step3FormData.bankCode.trim() &&
    step3FormData.accountNumber.trim() &&
    step3FormData.accountName.trim();

  useEffect(() => {
    console.log("[CreatorMonetization] view mounted", {
      accountId: authUser?.accountId,
      roleName: authUser?.roleName,
      isAuthenticated: Boolean(authUser),
      location:
        typeof window !== "undefined"
          ? `${window.location.pathname}${window.location.search}`
          : "",
      clientCookieNames:
        typeof document !== "undefined" && document.cookie
          ? document.cookie
              .split(";")
              .map((cookie) => cookie.trim().split("=")[0])
          : [],
    });
  }, [authUser]);

  useEffect(() => {
    console.log("[CreatorMonetization] render state", {
      verificationStatus,
      accountId: authUser?.accountId,
      roleName: authUser?.roleName,
      isLoading: verificationStatusQuery.isLoading,
      isFetching: verificationStatusQuery.isFetching,
      isError: verificationStatusQuery.isError,
      isCreatorVerified,
      isTermsAccepted,
      hasVerificationStatus,
      identityStatus,
      paymentStatus,
      shouldShowGateway,
      shouldShowDashboard,
    });
  }, [
    verificationStatus,
    authUser?.accountId,
    authUser?.roleName,
    verificationStatusQuery.isLoading,
    verificationStatusQuery.isFetching,
    verificationStatusQuery.isError,
    isCreatorVerified,
    isTermsAccepted,
    hasVerificationStatus,
    identityStatus,
    paymentStatus,
    shouldShowGateway,
    shouldShowDashboard,
  ]);

  useEffect(() => {
    console.log("[CreatorMonetization] gateway term query state", {
      enabled: Boolean(verificationStatus && !isCreatorVerified),
      isLoading: gatewayTermQuery.isLoading,
      isFetching: gatewayTermQuery.isFetching,
      isError: gatewayTermQuery.isError,
      data: gatewayTermQuery.data,
      termId: gatewayTermId,
      hasContent: Boolean(gatewayTermQuery.data?.content?.trim()),
    });
  }, [
    verificationStatus,
    isCreatorVerified,
    gatewayTermQuery.isLoading,
    gatewayTermQuery.isFetching,
    gatewayTermQuery.isError,
    gatewayTermQuery.data,
    gatewayTermId,
  ]);

  useEffect(() => {
    console.log("[CreatorMonetization] step1 term query state", {
      enabled: isStep1ModalOpen && isCreatorVerified && !isTermsAccepted,
      isLoading: step1TermQuery.isLoading,
      isFetching: step1TermQuery.isFetching,
      isError: step1TermQuery.isError,
      data: step1TermQuery.data,
      termId: step1TermId,
      hasContent: Boolean(step1TermQuery.data?.content?.trim()),
    });
  }, [
    isStep1ModalOpen,
    isCreatorVerified,
    isTermsAccepted,
    step1TermQuery.isLoading,
    step1TermQuery.isFetching,
    step1TermQuery.isError,
    step1TermQuery.data,
    step1TermId,
  ]);

  return (
    <div className="min-h-full bg-background text-foreground">
      <section className="mx-auto flex min-h-[calc(100vh-8rem)] w-full max-w-6xl flex-col px-4 py-8 sm:px-6 lg:px-8">
        {isCheckingStatus ? (
          <div className="flex flex-1 items-center justify-center">
            <div className="flex items-center gap-3 text-sm font-medium text-white/75">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
              Đang kiểm tra trạng thái...
            </div>
          </div>
        ) : null}

        {verificationStatusQuery.isError ? (
          <div className="flex flex-1 items-center justify-center">
            <div className="rounded-lg border border-red-400/20 bg-red-400/10 p-5 text-center text-sm text-red-200">
              <p>Không thể tải trạng thái kiếm tiền.</p>
              <Button
                type="button"
                onClick={() => verificationStatusQuery.refetch()}
                className="mt-4 bg-primary text-black hover:bg-primary/90"
              >
                Thử lại
              </Button>
            </div>
          </div>
        ) : null}

        {shouldShowDashboard ? (
          <div className="flex flex-1 flex-col gap-8">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="font-heading text-3xl font-bold tracking-tight text-white sm:text-4xl">
                  Kiếm tiền trên TaleX
                </h1>
                {isStatusRefreshing ? (
                  <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-semibold text-white/55">
                    Đang đồng bộ...
                  </span>
                ) : null}
              </div>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-white/60">
                Hoàn thành từng bước bên dưới để bật tính năng kiếm tiền cho
                tài khoản Creator của bạn.
              </p>
            </div>

            <div className="flex flex-col gap-6">
              <article
                className={cn(
                  "flex flex-col gap-5 rounded-lg border p-5 transition sm:flex-row sm:items-center sm:justify-between",
                  isTermsAccepted
                    ? "border-emerald-400/30 bg-emerald-400/[0.05]"
                    : "border-primary/35 bg-card",
                )}
              >
                <div className="max-w-3xl">
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="font-heading text-xl font-bold leading-7 text-white">
                      Bước 1: Xem xét Điều khoản cơ sở
                    </h2>

                    {isTermsAccepted ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/35 bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-300">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Đã hoàn thành
                      </span>
                    ) : null}
                  </div>

                  <p className="mt-3 text-sm leading-6 text-white/66">
                    Vui lòng đọc kỹ những điều khoản này vì đây là những điều
                    khoản áp dụng khi bạn tham gia Chương trình Đối tác TaleX.
                  </p>
                </div>

                {!isTermsAccepted ? (
                  <Button
                    type="button"
                    onClick={handleOpenStep1Modal}
                    className="h-10 w-fit shrink-0 bg-primary px-5 font-semibold text-black hover:bg-primary/90"
                  >
                    Bắt đầu
                  </Button>
                ) : null}
              </article>

              <article
                className={cn(
                  "flex flex-col gap-5 rounded-lg border border-white/10 bg-card p-5 transition sm:flex-row sm:items-center sm:justify-between",
                  !isStep2Enabled && "pointer-events-none opacity-50",
                )}
              >
                <div className="max-w-3xl">
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="font-heading text-xl font-bold leading-7 text-white">
                      Bước 2: Cung cấp hồ sơ thuế
                    </h2>

                    {identityStatus ? (
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold",
                          identityStatusClassNames[identityStatus],
                        )}
                      >
                        {identityStatusLabels[identityStatus]}
                      </span>
                    ) : null}
                  </div>

                  <p className="mt-3 text-sm leading-6 text-white/66">
                    Nhập mã số thuế thu nhập cá nhân của bạn để TaleX có thể
                    thực hiện các nghĩa vụ liên quan đến thanh toán doanh thu.
                  </p>

                  {identityVerifiedAt ? (
                    <p className="mt-3 text-xs font-medium text-white/45">
                      Thời gian xác thực: {identityVerifiedAt}
                    </p>
                  ) : null}
                </div>

                <div className="flex shrink-0 items-center gap-3">
                  {!identityStatus || identityStatus === "AWAITING_FILL" ? (
                    <Button
                      type="button"
                      disabled={!isStep2Enabled}
                      onClick={handleOpenStep2Modal}
                      className="h-10 bg-primary px-5 font-semibold text-black hover:bg-primary/90"
                    >
                      Bắt đầu
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleOpenStep2Modal}
                      className="h-10 border-white/18 bg-white/[0.03] px-5 text-white hover:bg-white/10"
                    >
                      Cập nhật
                    </Button>
                  )}
                </div>
              </article>

              <article
                className={cn(
                  "flex flex-col gap-5 rounded-lg border border-white/10 bg-card p-5 transition sm:flex-row sm:items-center sm:justify-between",
                  !isStep3Enabled && "pointer-events-none opacity-50",
                )}
              >
                <div className="max-w-3xl">
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="font-heading text-xl font-bold leading-7 text-white">
                      Bước 3: Tài khoản thanh toán
                    </h2>

                    {paymentStatus ? (
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold",
                          paymentStatusClassNames[paymentStatus],
                        )}
                      >
                        {paymentStatusLabels[paymentStatus]}
                      </span>
                    ) : null}
                  </div>

                  <p className="mt-3 text-sm leading-6 text-white/66">
                    Tạo một tài khoản thanh toán mới hoặc kết nối tài khoản hiện
                    có để nhận các khoản thanh toán doanh thu từ TaleX.
                  </p>

                  {paymentVerifiedAt ? (
                    <p className="mt-3 text-xs font-medium text-white/45">
                      Thời gian xác thực: {paymentVerifiedAt}
                    </p>
                  ) : null}
                </div>

                <div className="flex shrink-0 flex-wrap items-center gap-3">
                  {paymentStatus === null ? (
                    <Button
                      type="button"
                      disabled={!isStep3Enabled}
                      onClick={handleOpenStep3Modal}
                      className="h-10 bg-primary px-5 font-semibold text-black hover:bg-primary/90"
                    >
                      Thiết lập
                    </Button>
                  ) : null}

                  {paymentStatus === "PENDING" ? (
                    <>
                      <Button
                        type="button"
                        disabled={cancelPaymentProfileMutation.isPending}
                        onClick={handleCancelPaymentProfile}
                        className="h-10 bg-secondary px-5 font-semibold text-white hover:bg-secondary/85"
                      >
                        {cancelPaymentProfileMutation.isPending
                          ? "Đang hủy..."
                          : "Hủy"}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        disabled={savePaymentProfileMutation.isPending}
                        onClick={handleOpenStep3Modal}
                        className="h-10 border-white/18 bg-white/[0.03] px-5 text-white hover:bg-white/10"
                      >
                        Cập nhật
                      </Button>
                    </>
                  ) : null}

                  {paymentStatus === "VERIFIED" ||
                  paymentStatus === "REJECTED" ? (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleOpenStep3Modal}
                      className="h-10 border-white/18 bg-white/[0.03] px-5 text-white hover:bg-white/10"
                    >
                      Cập nhật
                    </Button>
                  ) : null}

                  {paymentStatus === "CANCELLED" ? (
                    <Button
                      type="button"
                      onClick={handleOpenStep3Modal}
                      className="h-10 bg-primary px-5 font-semibold text-black hover:bg-primary/90"
                    >
                      Thiết lập lại
                    </Button>
                  ) : null}
                </div>
              </article>
            </div>
          </div>
        ) : null}

        {!isCheckingStatus &&
        !verificationStatusQuery.isError &&
        !shouldShowGateway &&
        !shouldShowDashboard ? (
          <div className="flex flex-1 items-center justify-center">
            <div className="w-full max-w-3xl rounded-lg border border-primary/25 bg-card p-5 text-sm text-white/75">
              <h2 className="font-heading text-xl font-bold text-white">
                Không tìm thấy dữ liệu Dashboard
              </h2>
              <p className="mt-2 leading-6 text-white/60">
                Query đã kết thúc nhưng nhánh 3 banner không được render. Kiểm
                tra payload và các cờ debug bên dưới.
              </p>
              <pre className="mt-4 max-h-80 overflow-auto rounded-lg border border-white/10 bg-black/30 p-4 text-xs leading-5 text-white/70">
                {JSON.stringify(
                  {
                    verificationStatus,
                    isLoading: verificationStatusQuery.isLoading,
                    isFetching: verificationStatusQuery.isFetching,
                    isCreatorVerified,
                    isTermsAccepted,
                    hasVerificationStatus,
                    identityStatus,
                    paymentStatus,
                    shouldShowGateway,
                    shouldShowDashboard,
                  },
                  null,
                  2,
                )}
              </pre>
            </div>
          </div>
        ) : null}
      </section>

      <Dialog open={shouldShowGateway} onOpenChange={() => undefined}>
        <DialogContent
          showCloseButton={false}
          onEscapeKeyDown={(event) => event.preventDefault()}
          onInteractOutside={(event) => event.preventDefault()}
          className="max-h-[calc(100vh-2rem)] gap-5 rounded-lg border border-white/10 bg-card p-5 text-card-foreground shadow-2xl sm:max-w-xl"
        >
          <DialogHeader>
            <DialogTitle className="font-heading text-2xl font-bold tracking-tight text-white">
              Xác thực danh tính Creator
            </DialogTitle>
            <DialogDescription className="text-sm leading-6 text-muted-foreground">
              Vui lòng đọc kỹ điều khoản trước khi bắt đầu quá trình xác thực.
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-64 overflow-y-auto rounded-lg border border-white/10 bg-white/[0.04] p-4 text-sm leading-7 text-white/78">
            {gatewayTermQuery.isLoading ? (
              <span>Đang tải điều khoản...</span>
            ) : gatewayTermQuery.isError ? (
              <span className="text-red-200">
                Không thể tải điều khoản xác thực.
              </span>
            ) : gatewayTermQuery.data?.content?.trim() ? (
              gatewayTermQuery.data.content
            ) : (
              <span className="text-primary">
                API tráº£ vá» Ä‘iá»u khoáº£n xÃ¡c thá»±c rá»—ng.
              </span>
            )}
          </div>

          <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-white/10 bg-black/20 p-4 text-sm leading-6 text-white/82">
            <input
              type="checkbox"
              checked={isAgreed}
              onChange={(event) => setIsAgreed(event.target.checked)}
              className="mt-1 h-4 w-4 shrink-0 rounded border-white/25 bg-background accent-primary"
            />
            <span>
              Tôi đã đọc và đồng ý với điều khoản quá trình xác thực.
            </span>
          </label>

          <div className="flex justify-end">
            <Button
              type="button"
              disabled={
                !isAgreed ||
                submitGatewayMutation.isPending ||
                gatewayTermQuery.isLoading ||
                !gatewayTermId
              }
              onClick={handleSubmitVerification}
              className="h-10 min-w-32 bg-primary px-5 font-semibold text-black hover:bg-primary/90"
            >
              {submitGatewayMutation.isPending ? "Đang gửi..." : "Xác nhận"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isStep1ModalOpen} onOpenChange={handleStep1OpenChange}>
        <DialogContent className="max-h-[calc(100vh-2rem)] gap-5 rounded-lg border border-white/10 bg-card p-5 text-card-foreground shadow-2xl sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="font-heading text-2xl font-bold tracking-tight text-white">
              Điều khoản bật kiếm tiền
            </DialogTitle>
            <DialogDescription className="text-sm leading-6 text-muted-foreground">
              Xác nhận điều khoản cơ sở để tiếp tục thiết lập kiếm tiền.
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-64 overflow-y-auto rounded-lg border border-white/10 bg-white/[0.04] p-4 text-sm leading-7 text-white/78">
            {step1TermQuery.isLoading ? (
              <span>Đang tải điều khoản...</span>
            ) : step1TermQuery.isError ? (
              <span className="text-red-200">
                Không thể tải điều khoản bật kiếm tiền.
              </span>
            ) : step1TermQuery.data?.content?.trim() ? (
              step1TermQuery.data.content
            ) : (
              <span className="text-primary">
                API tráº£ vá» Ä‘iá»u khoáº£n báº­t kiáº¿m tiá»n rá»—ng.
              </span>
            )}
          </div>

          <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-white/10 bg-black/20 p-4 text-sm leading-6 text-white/82">
            <input
              type="checkbox"
              checked={isStep1Agreed}
              onChange={(event) => setIsStep1Agreed(event.target.checked)}
              className="mt-1 h-4 w-4 shrink-0 rounded border-white/25 bg-background accent-primary"
            />
            <span>Tôi đã đọc và đồng ý với điều khoản bật kiếm tiền.</span>
          </label>

          <div className="flex justify-end">
            <Button
              type="button"
              disabled={
                !isStep1Agreed ||
                acceptTermsMutation.isPending ||
                step1TermQuery.isLoading ||
                !step1TermId
              }
              onClick={handleSubmitStep1Terms}
              className="h-10 min-w-32 bg-primary px-5 font-semibold text-black hover:bg-primary/90"
            >
              {acceptTermsMutation.isPending ? "Đang gửi..." : "Xác nhận"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isStep2ModalOpen} onOpenChange={handleStep2OpenChange}>
        <DialogContent className="max-h-[calc(100vh-2rem)] gap-5 rounded-lg border border-white/10 bg-card p-5 text-card-foreground shadow-2xl sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="font-heading text-2xl font-bold tracking-tight text-white">
              Hồ sơ thuế
            </DialogTitle>
            <DialogDescription className="text-sm leading-6 text-muted-foreground">
              Cập nhật mã số thuế để TaleX xử lý nghĩa vụ thanh toán doanh thu.
            </DialogDescription>
          </DialogHeader>

          <label className="grid gap-2 text-sm font-medium text-white/82">
            <span>Mã số thuế</span>
            <input
              type="text"
              value={step2InputTaxId}
              onChange={(event) => setStep2InputTaxId(event.target.value)}
              placeholder="Nhập mã số thuế của bạn"
              className="h-11 rounded-lg border border-white/12 bg-black/25 px-3 text-sm text-white outline-none transition placeholder:text-white/32 focus:border-primary/60 focus:ring-2 focus:ring-primary/20"
            />
          </label>

          <div className="flex justify-end">
            <Button
              type="button"
              disabled={updateTaxMutation.isPending || !step2InputTaxId.trim()}
              onClick={handleSubmitStep2TaxProfile}
              className="h-10 min-w-32 bg-primary px-5 font-semibold text-black hover:bg-primary/90"
            >
              {updateTaxMutation.isPending ? "Đang gửi..." : "Xác nhận"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isStep3ModalOpen} onOpenChange={handleStep3OpenChange}>
        <DialogContent className="max-h-[calc(100vh-2rem)] gap-5 overflow-y-auto rounded-lg border border-white/10 bg-card p-5 text-card-foreground shadow-2xl sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="font-heading text-2xl font-bold tracking-tight text-white">
              Hồ sơ thanh toán
            </DialogTitle>
            <DialogDescription className="text-sm leading-6 text-muted-foreground">
              Nhập thông tin tài khoản ngân hàng để nhận doanh thu từ TaleX.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4">
            <label className="grid gap-2 text-sm font-medium text-white/82">
              <span>Ngân hàng</span>
              <input
                type="text"
                value={step3FormData.bankCode}
                onChange={(event) =>
                  updateStep3FormData("bankCode", event.target.value)
                }
                placeholder="Nhập mã ngân hàng"
                className="h-11 rounded-lg border border-white/12 bg-black/25 px-3 text-sm text-white outline-none transition placeholder:text-white/32 focus:border-primary/60 focus:ring-2 focus:ring-primary/20"
              />
            </label>

            <label className="grid gap-2 text-sm font-medium text-white/82">
              <span>Số tài khoản</span>
              <input
                type="text"
                value={step3FormData.accountNumber}
                onChange={(event) =>
                  updateStep3FormData("accountNumber", event.target.value)
                }
                placeholder="Nhập số tài khoản"
                className="h-11 rounded-lg border border-white/12 bg-black/25 px-3 text-sm text-white outline-none transition placeholder:text-white/32 focus:border-primary/60 focus:ring-2 focus:ring-primary/20"
              />
            </label>

            <label className="grid gap-2 text-sm font-medium text-white/82">
              <span>Tên tài khoản</span>
              <input
                type="text"
                value={step3FormData.accountName}
                onChange={(event) =>
                  updateStep3FormData("accountName", event.target.value)
                }
                placeholder="Nhập tên chủ tài khoản"
                className="h-11 rounded-lg border border-white/12 bg-black/25 px-3 text-sm text-white outline-none transition placeholder:text-white/32 focus:border-primary/60 focus:ring-2 focus:ring-primary/20"
              />
            </label>

            <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-white/10 bg-black/20 p-4 text-sm leading-6 text-white/82">
              <input
                type="checkbox"
                checked={step3FormData.isPrimary}
                onChange={(event) =>
                  updateStep3FormData("isPrimary", event.target.checked)
                }
                className="mt-1 h-4 w-4 shrink-0 rounded border-white/25 bg-background accent-primary"
              />
              <span>Đặt làm tài khoản chính</span>
            </label>
          </div>

          <div className="flex justify-end">
            <Button
              type="button"
              disabled={savePaymentProfileMutation.isPending || !canSubmitStep3}
              onClick={handleSubmitStep3PaymentProfile}
              className="h-10 min-w-32 bg-primary px-5 font-semibold text-black hover:bg-primary/90"
            >
              {savePaymentProfileMutation.isPending
                ? "Đang gửi..."
                : "Xác nhận"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
