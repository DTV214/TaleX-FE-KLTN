"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BadgeCheck,
  Building2,
  CheckCircle2,
  ChevronDown,
  CreditCard,
  Edit3,
  Landmark,
  Loader2,
  Plus,
  RefreshCw,
  ShieldCheck,
  Trash2,
  WalletCards,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

import {
  createPaymentProfile,
  creatorMonetizationKeys,
  deletePaymentProfile,
  getOwnPaymentProfiles,
  getPaymentBankBins,
  updatePaymentProfile,
  type CreatorPaymentProfileRecord,
  type CreatorPaymentStatus,
  type PaymentProfileRequestDto,
} from "@/features/creator-dashboard/api/creator-monetization-api";
import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { cn } from "@/shared/utils/utils";

type PaymentProfileFormState = {
  id?: string;
  bankCode: string;
  accountNumber: string;
  accountName: string;
  isPrimary: boolean;
};

type PaymentProfileModalMode = "create" | "edit";

const emptyFormState: PaymentProfileFormState = {
  bankCode: "",
  accountNumber: "",
  accountName: "",
  isPrimary: true,
};

const statusLabels: Record<string, string> = {
  PENDING: "Chờ duyệt",
  VERIFIED: "Đã duyệt",
  REJECTED: "Từ chối",
  CANCELLED: "Đã hủy",
};

const statusClassNames: Record<string, string> = {
  PENDING: "border-yellow-300/25 bg-yellow-300/10 text-yellow-200",
  VERIFIED: "border-emerald-300/25 bg-emerald-300/10 text-emerald-200",
  REJECTED: "border-red-300/25 bg-red-300/10 text-red-200",
  CANCELLED: "border-white/15 bg-white/8 text-white/55",
};

const ACCOUNT_NUMBER_PATTERN = /^\d{6,20}$/;
const ACCOUNT_NAME_PATTERN = /^[A-ZÀ-Ỹ\s'.-]{3,80}$/i;

function formatStatus(status?: CreatorPaymentStatus | null) {
  const normalized = String(status ?? "PENDING").toUpperCase();
  return {
    label: statusLabels[normalized] ?? normalized,
    className: statusClassNames[normalized] ?? statusClassNames.PENDING,
  };
}

function getValidationMessage(formState: PaymentProfileFormState) {
  const bankCode = formState.bankCode.trim().toUpperCase();
  const accountNumber = formState.accountNumber.trim();
  const accountName = formState.accountName.trim();

  if (!bankCode) {
    return "Vui lòng chọn ngân hàng nhận thanh toán.";
  }

  if (!ACCOUNT_NUMBER_PATTERN.test(accountNumber)) {
    return "Số tài khoản cần gồm 6-20 chữ số.";
  }

  if (!ACCOUNT_NAME_PATTERN.test(accountName)) {
    return "Tên tài khoản cần từ 3-80 ký tự và chỉ gồm chữ, khoảng trắng hoặc dấu . '-";
  }

  return "";
}

function toPaymentProfilePayload(
  formState: PaymentProfileFormState,
): PaymentProfileRequestDto {
  return {
    bankCode: formState.bankCode.trim().toUpperCase(),
    accountNumber: formState.accountNumber.trim(),
    accountName: formState.accountName.trim(),
    isPrimary: formState.isPrimary,
    status: "PENDING",
  };
}

function maskAccountNumber(accountNumber: string) {
  if (accountNumber.length <= 4) {
    return accountNumber;
  }

  return `${"•".repeat(Math.max(accountNumber.length - 4, 0))}${accountNumber.slice(-4)}`;
}

function createFormStateFromProfile(
  profile: CreatorPaymentProfileRecord,
): PaymentProfileFormState {
  return {
    id: profile.id,
    bankCode: profile.bankCode,
    accountNumber: profile.accountNumber,
    accountName: profile.accountName,
    isPrimary: profile.isPrimary,
  };
}

export function CreatorPaymentProfilesView() {
  const queryClient = useQueryClient();
  const [modalMode, setModalMode] =
    useState<PaymentProfileModalMode>("create");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formState, setFormState] =
    useState<PaymentProfileFormState>(emptyFormState);
  const [formError, setFormError] = useState("");
  const [deleteTarget, setDeleteTarget] =
    useState<CreatorPaymentProfileRecord | null>(null);

  const paymentProfilesQuery = useQuery({
    queryKey: creatorMonetizationKeys.paymentProfiles(),
    queryFn: getOwnPaymentProfiles,
  });

  const bankBinsQuery = useQuery({
    queryKey: creatorMonetizationKeys.bankBins(),
    queryFn: getPaymentBankBins,
    staleTime: 30 * 60 * 1000,
  });

  const profiles = useMemo(
    () => paymentProfilesQuery.data ?? [],
    [paymentProfilesQuery.data],
  );
  const bankCodes = useMemo(() => {
    const currentBankCodes = profiles.map((profile) => profile.bankCode);
    return Array.from(
      new Set([...(bankBinsQuery.data ?? []), ...currentBankCodes].filter(Boolean)),
    ).sort((a, b) => a.localeCompare(b));
  }, [bankBinsQuery.data, profiles]);

  const verifiedCount = profiles.filter(
    (profile) => String(profile.status).toUpperCase() === "VERIFIED",
  ).length;
  const pendingCount = profiles.filter(
    (profile) => String(profile.status).toUpperCase() === "PENDING",
  ).length;
  const primaryProfile = profiles.find((profile) => profile.isPrimary) ?? null;
  const validationMessage = getValidationMessage(formState);
  const canSubmit = !validationMessage;

  const invalidateProfiles = () => {
    void queryClient.invalidateQueries({
      queryKey: creatorMonetizationKeys.paymentProfiles(),
    });
  };

  const saveProfileMutation = useMutation({
    mutationFn: (payload: PaymentProfileRequestDto) => {
      if (modalMode === "edit" && formState.id) {
        return updatePaymentProfile(formState.id, payload);
      }

      return createPaymentProfile(payload);
    },
    onSuccess: () => {
      setIsFormOpen(false);
      setFormState(emptyFormState);
      setFormError("");
      invalidateProfiles();
      toast.success(
        modalMode === "edit"
          ? "Đã cập nhật hồ sơ thanh toán."
          : "Đã tạo hồ sơ thanh toán.",
      );
    },
    onError: (error) => {
      toast.error(
        error instanceof Error
          ? error.message
          : "Không thể lưu hồ sơ thanh toán.",
      );
    },
  });

  const deleteProfileMutation = useMutation({
    mutationFn: deletePaymentProfile,
    onSuccess: () => {
      setDeleteTarget(null);
      invalidateProfiles();
      toast.success("Đã xóa hồ sơ thanh toán.");
    },
    onError: (error) => {
      toast.error(
        error instanceof Error
          ? error.message
          : "Không thể xóa hồ sơ thanh toán.",
      );
    },
  });

  const handleOpenCreate = () => {
    setModalMode("create");
    setFormState(emptyFormState);
    setFormError("");
    setIsFormOpen(true);
  };

  const handleOpenEdit = (profile: CreatorPaymentProfileRecord) => {
    setModalMode("edit");
    setFormState(createFormStateFromProfile(profile));
    setFormError("");
    setIsFormOpen(true);
  };

  const handleSubmit = () => {
    const nextValidationMessage = getValidationMessage(formState);

    if (saveProfileMutation.isPending) {
      return;
    }

    if (nextValidationMessage) {
      setFormError(nextValidationMessage);
      return;
    }

    saveProfileMutation.mutate(toPaymentProfilePayload(formState));
  };

  const handleDelete = () => {
    if (!deleteTarget || deleteProfileMutation.isPending) {
      return;
    }

    deleteProfileMutation.mutate(deleteTarget.id);
  };

  return (
    <div className="space-y-7 text-creator-text">
      <div className="sm:flex-row sm:items-end justify-between gap-4 border-b border-creator-border pb-6">
        <div className="relative z-10 flex flex-col items-center gap-7 lg:flex-row lg:items-end lg:justify-between">
          <h2 className="text-2xl sm:text-3xl font-bold text-white">
            Tài Khoản Ngân Hàng
          </h2>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              type="button"
              variant="outline"
              onClick={() => paymentProfilesQuery.refetch()}
              className="h-12 rounded-2xl border-white/10 bg-white/[0.04] px-5 font-black text-white hover:border-creator-gold/45 hover:bg-creator-gold/10 hover:text-creator-gold"
            >
              <RefreshCw
                className={cn(
                  "h-4 w-4",
                  paymentProfilesQuery.isFetching && "animate-spin",
                )}
              />
              Làm mới
            </Button>
            <Button
              type="button"
              onClick={handleOpenCreate}
              className="h-12 rounded-2xl bg-creator-gold px-5 font-black text-black shadow-[0_0_34px_rgba(226,177,60,0.22)] hover:bg-creator-gold-hover"
            >
              <Plus className="h-5 w-5" />
              Thêm tài khoản
            </Button>
          </div>
        </div>
      </div>

      {paymentProfilesQuery.isLoading ? (
        <div className="flex min-h-72 items-center justify-center">
          <div className="flex items-center gap-3 text-sm font-black text-white/65">
            <Loader2 className="h-5 w-5 animate-spin text-creator-gold" />
            Đang tải hồ sơ thanh toán...
          </div>
        </div>
      ) : paymentProfilesQuery.isError ? (
        <div className="m-5 rounded-2xl border border-red-400/20 bg-red-400/10 p-5 text-sm font-bold text-red-100">
          Không thể tải danh sách hồ sơ thanh toán. Vui lòng thử lại.
        </div>
      ) : profiles.length === 0 ? (
        <div className="m-5 flex min-h-72 flex-col items-center justify-center rounded-3xl border border-dashed border-white/12 bg-white/[0.025] p-8 text-center">
          <Landmark className="h-12 w-12 text-creator-gold" />
          <h3 className="mt-4 font-heading text-2xl font-black text-white">
            Chưa có hồ sơ thanh toán
          </h3>
          <p className="mt-2 max-w-md text-sm font-semibold leading-6 text-white/55">
            Tạo tài khoản ngân hàng đầu tiên để TaleX có thể kiểm duyệt và
            dùng cho thanh toán doanh thu.
          </p>
          <Button
            type="button"
            onClick={handleOpenCreate}
            className="mt-5 h-11 rounded-2xl bg-creator-gold px-5 font-black text-black hover:bg-creator-gold-hover"
          >
            <Plus className="h-5 w-5" />
            Tạo hồ sơ
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 p-5 lg:grid-cols-2 2xl:grid-cols-3">
          {profiles.map((profile) => (
            <PaymentProfileRow
              key={profile.id}
              profile={profile}
              onEdit={() => handleOpenEdit(profile)}
              onDelete={() => setDeleteTarget(profile)}
            />
          ))}
        </div>
      )}

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-h-[calc(100vh-2rem)] gap-5 overflow-y-auto rounded-3xl border border-creator-gold/25 bg-[#101012]/95 p-5 text-white shadow-[0_28px_90px_rgba(0,0,0,0.72),0_0_36px_rgba(226,177,60,0.1)] sm:max-w-2xl">
          <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-creator-gold/80 to-transparent" />
          <div className="pointer-events-none absolute -right-20 -top-24 h-56 w-56 rounded-full bg-creator-gold/10 blur-3xl" />
          <DialogHeader>

            <DialogTitle className="font-heading text-2xl font-black tracking-tight text-white">
              {modalMode === "edit"
                ? "Cập nhập tài khoản thanh toán"
                : "Thêm tài khoản thanh toán"}
            </DialogTitle>

          </DialogHeader>

          <div className="grid gap-4">
            <label className="grid gap-2 rounded-2xl border border-white/10 bg-black/30 p-4 text-sm font-medium text-white/82">
              <span className="font-black text-white">Ngân hàng</span>
              <div className="relative">
                <select
                  value={formState.bankCode}
                  onChange={(event) => {
                    setFormError("");
                    setFormState((current) => ({
                      ...current,
                      bankCode: event.target.value,
                    }));
                  }}
                  className="creator-format-select h-12 w-full appearance-none rounded-xl border border-white/12 bg-black/35 px-4 pr-11 text-sm font-black uppercase text-white outline-none transition focus:border-creator-gold/70 focus:ring-2 focus:ring-creator-gold/20 disabled:cursor-not-allowed disabled:opacity-55"
                  disabled={bankBinsQuery.isLoading || bankBinsQuery.isError}
                >
                  <option value="">
                    {bankBinsQuery.isLoading
                      ? "Đang tải danh sách ngân hàng..."
                      : "Chọn ngân hàng"}
                  </option>
                  {bankCodes.map((bankCode) => (
                    <option key={bankCode} value={bankCode}>
                      {bankCode}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/45" />
              </div>
              {bankBinsQuery.isError ? (
                <p className="text-xs font-bold text-red-300">
                  Không thể tải danh sách ngân hàng. Hãy thử làm mới lại trang.
                </p>
              ) : null}
            </label>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="grid gap-2 rounded-2xl border border-white/10 bg-black/30 p-4 text-sm font-medium text-white/82">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-black text-white">Số tài khoản</span>
                  <span className="text-xs font-bold text-white/40">
                    {formState.accountNumber.trim().length}/20
                  </span>
                </div>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={20}
                  value={formState.accountNumber}
                  onChange={(event) => {
                    setFormError("");
                    setFormState((current) => ({
                      ...current,
                      accountNumber: event.target.value.replace(/\D/g, ""),
                    }));
                  }}
                  placeholder="Ví dụ: 1023456789"
                  className="h-12 rounded-xl border border-white/12 bg-black/35 px-4 text-sm font-black text-white outline-none transition placeholder:text-white/32 focus:border-creator-gold/70 focus:ring-2 focus:ring-creator-gold/20"
                />
              </label>

              <label className="grid gap-2 rounded-2xl border border-white/10 bg-black/30 p-4 text-sm font-medium text-white/82">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-black text-white">Tên tài khoản</span>
                  <span className="text-xs font-bold text-white/40">
                    {formState.accountName.trim().length}/80
                  </span>
                </div>
                <input
                  type="text"
                  maxLength={80}
                  value={formState.accountName}
                  onChange={(event) => {
                    setFormError("");
                    setFormState((current) => ({
                      ...current,
                      accountName: event.target.value,
                    }));
                  }}
                  placeholder="Ví dụ: NGUYEN VAN A"
                  className="h-12 rounded-xl border border-white/12 bg-black/35 px-4 text-sm font-black text-white outline-none transition placeholder:text-white/32 focus:border-creator-gold/70 focus:ring-2 focus:ring-creator-gold/20"
                />
              </label>
            </div>

            <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-creator-gold/18 bg-creator-gold/8 p-4 text-sm font-bold leading-6 text-white/82 transition hover:border-creator-gold/35 hover:bg-creator-gold/12">
              <input
                type="checkbox"
                checked={formState.isPrimary}
                onChange={(event) => {
                  setFormError("");
                  setFormState((current) => ({
                    ...current,
                    isPrimary: event.target.checked,
                  }));
                }}
                className="mt-1 h-4 w-4 shrink-0 rounded border-white/25 bg-background accent-primary"
              />
              <span>Tài khoản chính</span>
            </label>

            {(formError || (!canSubmit && formState.accountNumber)) && (
              <div className="rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-xs font-bold leading-5 text-red-200">
                {formError || validationMessage}
              </div>
            )}
          </div>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsFormOpen(false)}
              disabled={saveProfileMutation.isPending}
              className="h-11 rounded-xl border-white/12 bg-white/[0.035] px-5 font-black text-white hover:border-white/25 hover:bg-white/[0.06]"
            >
              Hủy
            </Button>
            <Button
              type="button"
              disabled={
                saveProfileMutation.isPending ||
                !canSubmit ||
                bankBinsQuery.isLoading ||
                bankBinsQuery.isError
              }
              onClick={handleSubmit}
              className="h-11 rounded-xl bg-creator-gold px-6 font-black text-black shadow-[0_0_24px_rgba(226,177,60,0.18)] hover:bg-creator-gold-hover disabled:opacity-45"
            >
              {saveProfileMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Đang lưu
                </>
              ) : modalMode === "edit" ? (
                "Lưu thay đổi"
              ) : (
                "Tạo hồ sơ"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open && !deleteProfileMutation.isPending) {
            setDeleteTarget(null);
          }
        }}
      >
        <DialogContent className="rounded-3xl border border-red-400/20 bg-[#101012]/95 p-5 text-white shadow-[0_28px_90px_rgba(0,0,0,0.72)] sm:max-w-lg">
          <DialogHeader>
            <div className="mb-1 inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-red-300/25 bg-red-400/10 text-red-200">
              <XCircle className="h-6 w-6" />
            </div>
            <DialogTitle className="font-heading text-2xl font-black text-white">
              Xóa hồ sơ thanh toán?
            </DialogTitle>
            <DialogDescription className="text-sm font-semibold leading-6 text-white/58">
              Hồ sơ của ngân hàng {deleteTarget?.bankCode} sẽ bị xóa khỏi danh
              sách tài khoản thanh toán của bạn.
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm font-bold text-white/70">
            {deleteTarget?.accountName} ·{" "}
            {deleteTarget?.accountNumber
              ? maskAccountNumber(deleteTarget.accountNumber)
              : "-"}
          </div>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              disabled={deleteProfileMutation.isPending}
              className="h-11 rounded-xl border-white/12 bg-white/[0.035] px-5 font-black text-white hover:border-white/25 hover:bg-white/[0.06]"
            >
              Giữ lại
            </Button>
            <Button
              type="button"
              onClick={handleDelete}
              disabled={deleteProfileMutation.isPending}
              className="h-11 rounded-xl bg-red-500 px-6 font-black text-white hover:bg-red-400"
            >
              {deleteProfileMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Đang xóa
                </>
              ) : (
                "Xóa hồ sơ"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  caption,
  tone,
}: {
  icon: typeof CreditCard;
  label: string;
  value: number;
  caption: string;
  tone: "gold" | "blue" | "green";
}) {
  const toneClassName = {
    gold: "border-creator-gold/20 bg-creator-gold/10 text-creator-gold",
    blue: "border-sky-300/20 bg-sky-300/10 text-sky-200",
    green: "border-emerald-300/20 bg-emerald-300/10 text-emerald-200",
  }[tone];

  return (
    <div className="creator-shine-card rounded-[1.5rem] border border-white/10 bg-white/[0.045] p-5 shadow-[0_18px_50px_rgba(0,0,0,0.24)] backdrop-blur-xl">
      <div className={cn("mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border", toneClassName)}>
        <Icon className="h-6 w-6" />
      </div>
      <p className="text-xs font-black uppercase tracking-[0.2em] text-white/40">
        {label}
      </p>
      <p className="mt-2 font-heading text-4xl font-black text-white">
        {value}
      </p>
      <p className="mt-1 text-sm font-bold text-white/48">{caption}</p>
    </div>
  );
}

function PaymentProfileRow({
  profile,
  onEdit,
  onDelete,
}: {
  profile: CreatorPaymentProfileRecord;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const status = formatStatus(profile.status);

  return (
    <article className="group flex h-full flex-col justify-between rounded-[1.6rem] border border-white/10 bg-white/[0.04] p-5 shadow-[0_18px_50px_rgba(0,0,0,0.24)] transition hover:border-creator-gold/30 hover:bg-white/[0.055]">
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">

            <h3 className="font-heading text-xl font-black text-white">
              {profile.bankCode || "Ngân hàng"}
            </h3>

            <div className="flex flex-wrap items-center gap-2">
              {profile.isPrimary ? (
                <span className="rounded-full border border-creator-gold/25 bg-creator-gold/10 px-2.5 py-1 text-xs font-black text-creator-gold">
                  Tài khoản chính
                </span>
              ) : null}
            </div>
          </div>
          <span
            className={cn(
              "rounded-full border px-2.5 py-1 text-xs font-black",
              status.className,
            )}
          >
            {status.label}
          </span>
        </div>

        <div className="rounded-[1.2rem] border border-white/10 bg-black/25 p-4">
          <p className="truncate text-sm font-black text-white/80">
            {profile.accountName || "Chưa có tên tài khoản"}
          </p>
          <p className="mt-2 text-sm font-semibold text-white/48">
            {profile.accountNumber
              ? maskAccountNumber(profile.accountNumber)
              : "Chưa có số tài khoản"}
          </p>
        </div>

        {profile.verifiedNote ? (
          <p className="rounded-xl border border-white/10 bg-white/[0.035] px-3 py-2 text-xs font-semibold leading-5 text-white/55">
            Ghi chú duyệt: {profile.verifiedNote}
          </p>
        ) : null}
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={onEdit}
          className="h-10 flex-1 rounded-xl border-white/10 bg-white/[0.035] px-4 font-black text-white hover:border-creator-gold/45 hover:bg-creator-gold/10 hover:text-creator-gold"
        >
          <Edit3 className="h-4 w-4" />
          Sửa
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onDelete}
          className="h-10 flex-1 rounded-xl border-red-300/20 bg-red-400/8 px-4 font-black text-red-200 hover:border-red-300/45 hover:bg-red-400/14 hover:text-red-100"
        >
          <Trash2 className="h-4 w-4" />
          Xóa
        </Button>
      </div>
    </article>
  );
}
