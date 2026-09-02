"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BadgeCheck,
  CalendarDays,
  ChevronDown,
  CheckCircle2,
  FileText,
  IdCard,
  Loader2,
  MapPin,
  RefreshCw,
  Save,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";
import {
  creatorIdentityProfileKeys,
  getOwnCreatorIdentityProfile,
  updateCreatorIdentityProfile,
  type CreatorIdentityProfile,
  type CreatorIdentityStatus,
  type UpdateCreatorIdentityProfilePayload,
} from "@/features/creator-dashboard/api/creator-profile-api";
import { creatorMonetizationKeys } from "@/features/creator-dashboard/api/creator-monetization-api";
import { Button } from "@/shared/ui/button";
import { cn } from "@/shared/utils/utils";

type ProfileFormState = UpdateCreatorIdentityProfilePayload;

const emptyFormState: ProfileFormState = {
  idNumber: "",
  fullName: "",
  dob: "",
  sex: "",
  address: "",
  doe: "",
  taxId: "",
};

const sexOptions = ["Nam", "Nữ", "Khác"];

const statusLabels: Record<string, string> = {
  AWAITING_FILL: "Chưa cung cấp",
  PENDING: "Chờ duyệt",
  IN_PROGRESS: "Đang xử lý",
  APPROVED: "Đã duyệt",
  REJECTED: "Bị từ chối",
};

const statusClassNames: Record<string, string> = {
  AWAITING_FILL: "border-white/15 bg-white/[0.055] text-white/60",
  PENDING: "border-yellow-300/25 bg-yellow-300/10 text-yellow-200",
  IN_PROGRESS: "border-sky-300/25 bg-sky-300/10 text-sky-200",
  APPROVED: "border-emerald-300/25 bg-emerald-300/10 text-emerald-200",
  REJECTED: "border-red-300/25 bg-red-300/10 text-red-200",
};

function normalizeDateForInput(value?: string | null) {
  return value ? value.slice(0, 10) : "";
}

function mapProfileToFormState(
  profile?: CreatorIdentityProfile | null,
): ProfileFormState {
  if (!profile) return emptyFormState;

  return {
    idNumber: profile.idNumber ?? "",
    fullName: profile.fullName ?? "",
    dob: normalizeDateForInput(profile.dob),
    sex: profile.sex ?? "",
    address: profile.address ?? "",
    doe: normalizeDateForInput(profile.doe),
    taxId: profile.taxId ?? "",
  };
}

function trimFormState(formState: ProfileFormState): ProfileFormState {
  return {
    idNumber: formState.idNumber.trim(),
    fullName: formState.fullName.trim(),
    dob: formState.dob.trim(),
    sex: formState.sex.trim(),
    address: formState.address.trim(),
    doe: formState.doe.trim(),
    taxId: formState.taxId.trim(),
  };
}

function formatDateTime(value?: string | null) {
  if (!value) return "-";

  try {
    return new Intl.DateTimeFormat("vi-VN", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function getStatusMeta(status?: CreatorIdentityStatus | null) {
  const normalized = String(status ?? "AWAITING_FILL").toUpperCase();

  return {
    label: statusLabels[normalized] ?? normalized,
    className:
      statusClassNames[normalized] ?? statusClassNames.AWAITING_FILL,
  };
}

function getValidationMessage(formState: ProfileFormState) {
  const payload = trimFormState(formState);

  if (!payload.fullName) {
    return "Vui lòng nhập họ và tên trên giấy tờ.";
  }

  if (payload.fullName.length < 3 || payload.fullName.length > 120) {
    return "Họ và tên cần từ 3 đến 120 ký tự.";
  }

  if (!payload.idNumber) {
    return "Vui lòng nhập số CCCD/CMND/hộ chiếu.";
  }

  if (!/^[A-Z0-9]{6,20}$/i.test(payload.idNumber)) {
    return "Số định danh cần gồm 6-20 ký tự chữ hoặc số.";
  }

  if (!payload.dob) {
    return "Vui lòng chọn ngày sinh.";
  }

  if (!payload.sex) {
    return "Vui lòng nhập giới tính.";
  }

  if (!payload.address) {
    return "Vui lòng nhập địa chỉ thường trú.";
  }

  if (!payload.doe) {
    return "Vui lòng chọn ngày hết hạn giấy tờ.";
  }

  if (!/^\d{10}(\d{2})?$/.test(payload.taxId)) {
    return "Mã số thuế cần gồm 10 hoặc 12 chữ số.";
  }

  return "";
}

function InfoPill({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof UserRound;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-4 shadow-[0_18px_50px_rgba(0,0,0,0.18)]">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl border border-creator-gold/20 bg-creator-gold/10 text-creator-gold">
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-xs font-black uppercase tracking-[0.18em] text-white/38">
        {label}
      </p>
      <p className="mt-2 break-words text-sm font-black text-white/82">
        {value || "-"}
      </p>
    </div>
  );
}

function FormField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  inputMode,
  maxLength,
  helper,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: "text" | "date";
  inputMode?: "numeric";
  maxLength?: number;
  helper?: string;
}) {
  return (
    <label className="grid gap-2 rounded-2xl border border-white/10 bg-black/30 p-4 text-sm font-medium text-white/82 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
      <div className="flex items-center justify-between gap-3">
        <span className="font-black text-white">{label}</span>
        {maxLength ? (
          <span className="text-xs font-bold text-white/40">
            {value.trim().length}/{maxLength}
          </span>
        ) : null}
      </div>
      <input
        type={type}
        inputMode={inputMode}
        maxLength={maxLength}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-12 rounded-xl border border-white/12 bg-black/35 px-4 text-sm font-bold text-white outline-none transition placeholder:text-white/32 focus:border-creator-gold/70 focus:ring-2 focus:ring-creator-gold/20"
      />
      {helper ? (
        <p className="text-xs font-semibold leading-5 text-white/45">
          {helper}
        </p>
      ) : null}
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
  placeholder = "Chọn một giá trị",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
}) {
  const hasUnknownValue = Boolean(value) && !options.includes(value);

  return (
    <label className="grid gap-2 rounded-2xl border border-white/10 bg-black/30 p-4 text-sm font-medium text-white/82 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
      <span className="font-black text-white">{label}</span>
      <div className="relative">
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-12 w-full appearance-none rounded-xl border border-white/12 bg-black/35 px-4 pr-11 text-sm font-bold text-white outline-none transition focus:border-creator-gold/70 focus:ring-2 focus:ring-creator-gold/20"
        >
          <option value="">{placeholder}</option>
          {hasUnknownValue ? <option value={value}>{value}</option> : null}
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/45" />
      </div>
    </label>
  );
}

export function CreatorProfileView() {
  const queryClient = useQueryClient();
  const [draftState, setDraftState] = useState<{
    profileKey: string;
    values: ProfileFormState;
  } | null>(null);
  const [formError, setFormError] = useState("");

  const profileQuery = useQuery({
    queryKey: creatorIdentityProfileKeys.own(),
    queryFn: getOwnCreatorIdentityProfile,
    staleTime: 60 * 1000,
  });

  const profile = profileQuery.data ?? null;
  const statusMeta = getStatusMeta(profile?.status);
  const savedState = useMemo(() => mapProfileToFormState(profile), [profile]);
  const profileKey = profile
    ? `${profile.creatorIdentityId}:${profile.updatedAt}`
    : "";
  const formState =
    draftState?.profileKey === profileKey ? draftState.values : savedState;
  const isDirty =
    JSON.stringify(trimFormState(formState)) !==
    JSON.stringify(trimFormState(savedState));
  const validationMessage = getValidationMessage(formState);
  const canSubmit = !validationMessage && Boolean(profile?.creatorIdentityId);

  const updateMutation = useMutation({
    mutationFn: (payload: ProfileFormState) => {
      if (!profile?.creatorIdentityId) {
        throw new Error("Không tìm thấy mã hồ sơ định danh.");
      }

      return updateCreatorIdentityProfile(
        profile.creatorIdentityId,
        trimFormState(payload),
      );
    },
    onSuccess: async () => {
      setFormError("");
      setDraftState(null);
      toast.success("Đã cập nhật hồ sơ creator.");
      await queryClient.invalidateQueries({
        queryKey: creatorIdentityProfileKeys.own(),
      });
      await queryClient.invalidateQueries({
        queryKey: creatorMonetizationKeys.verificationStatus(),
      });
    },
    onError: (error) => {
      toast.error(
        error instanceof Error
          ? error.message
          : "Không thể cập nhật hồ sơ creator.",
      );
    },
  });

  function updateField<FieldName extends keyof ProfileFormState>(
    fieldName: FieldName,
    value: ProfileFormState[FieldName],
  ) {
    setFormError("");
    setDraftState((current) => ({
      profileKey,
      values: {
        ...(current?.profileKey === profileKey ? current.values : savedState),
        [fieldName]: value,
      },
    }));
  }

  function handleSubmit() {
    const nextValidationMessage = getValidationMessage(formState);

    if (updateMutation.isPending) return;

    if (nextValidationMessage) {
      setFormError(nextValidationMessage);
      return;
    }

    updateMutation.mutate(formState);
  }

  if (profileQuery.isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex items-center gap-3 text-sm font-black text-white/65">
          <Loader2 className="h-5 w-5 animate-spin text-creator-gold" />
          Đang tải hồ sơ creator...
        </div>
      </div>
    );
  }

  if (profileQuery.isError) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <div className="max-w-lg rounded-3xl border border-red-400/20 bg-red-400/10 p-6 text-center text-sm font-bold text-red-100">
          <p>Không thể tải hồ sơ creator. Vui lòng thử lại.</p>
          <Button
            type="button"
            onClick={() => void profileQuery.refetch()}
            className="mt-5 h-11 rounded-2xl bg-creator-gold px-5 font-black text-black hover:bg-creator-gold-hover"
          >
            <RefreshCw className="h-4 w-4" />
            Thử lại
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-creator-text">
      <div className="lg:flex-row lg:items-end justify-between gap-4 border-b border-creator-border pb-6">
        <div className="relative z-10 flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-2xl sm:text-3xl font-bold text-white">
                Hồ Sơ
              </h2>
              <span
                className={cn(
                  "inline-flex items-center rounded-full border px-3 py-1 text-xs font-black",
                  statusMeta.className,
                )}
              >
                {statusMeta.label}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              type="button"
              variant="outline"
              onClick={() => void profileQuery.refetch()}
              className="h-12 rounded-2xl border-white/10 bg-white/[0.04] px-5 font-black text-white hover:border-creator-gold/45 hover:bg-creator-gold/10 hover:text-creator-gold"
            >
              <RefreshCw
                className={cn(
                  "h-4 w-4",
                  profileQuery.isFetching && "animate-spin",
                )}
              />
              Làm mới
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={!canSubmit || !isDirty || updateMutation.isPending}
              className="h-12 rounded-2xl bg-creator-gold px-5 font-black text-black shadow-[0_0_34px_rgba(226,177,60,0.22)] hover:bg-creator-gold-hover disabled:opacity-45"
            >
              {updateMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Lưu hồ sơ
            </Button>
          </div>
        </div>
      </div>

      <section className="creator-shine-card rounded-[2rem] border border-white/10 bg-white/[0.04] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.28)] backdrop-blur-xl md:p-6">
        <div className="mb-6 flex flex-col gap-2 border-b border-white/10 pb-5">
          <h2 className="font-heading text-2xl font-black text-white">
            Thông tin định danh
          </h2>
          <p className="max-w-2xl text-sm font-semibold leading-6 text-white/50">
            Cập nhật đúng theo giấy tờ định danh hợp lệ để tránh lỗi khi xác
            thực và thanh toán.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <FormField
            label="Họ và tên"
            value={formState.fullName}
            onChange={(value) => updateField("fullName", value)}
            placeholder="Ví dụ: NGUYEN VAN A"
            maxLength={120}
          />
          <FormField
            label="Số CCCD/CMND/Hộ chiếu"
            value={formState.idNumber}
            onChange={(value) =>
              updateField(
                "idNumber",
                value.toUpperCase().replace(/[^A-Z0-9]/g, ""),
              )
            }
            placeholder="Ví dụ: 079284755590"
            maxLength={20}
          />
          <FormField
            label="Ngày sinh"
            type="date"
            value={formState.dob}
            onChange={(value) => updateField("dob", value)}
          />
          <SelectField
            label="Giới tính"
            value={formState.sex}
            onChange={(value) => updateField("sex", value)}
            options={sexOptions}
            placeholder="Chọn giới tính"
          />
          <div className="lg:col-span-2">
            <FormField
              label="Địa chỉ thường trú"
              value={formState.address}
              onChange={(value) => updateField("address", value)}
              placeholder="Nhập địa chỉ trên giấy tờ định danh"
              maxLength={255}
            />
          </div>
          <FormField
            label="Ngày hết hạn giấy tờ"
            type="date"
            value={formState.doe}
            onChange={(value) => updateField("doe", value)}
          />
          <FormField
            label="Mã số thuế"
            value={formState.taxId}
            inputMode="numeric"
            onChange={(value) =>
              updateField("taxId", value.replace(/\D/g, ""))
            }
            placeholder="Ví dụ: 0312345678"
            maxLength={13}
            helper="Mã số thuế cá nhân/doanh nghiệp thường gồm 10 số; đơn vị phụ thuộc có thể gồm 13 số."
          />
        </div>

        {(formError || (isDirty && validationMessage)) && (
          <div className="mt-5 rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-xs font-bold leading-5 text-red-200">
            {formError || validationMessage}
          </div>
        )}

        {!isDirty && (
          <div className="mt-5 flex items-center gap-2 rounded-2xl border border-emerald-300/20 bg-emerald-300/10 px-4 py-3 text-xs font-bold text-emerald-200">
            <CheckCircle2 className="h-4 w-4" />
            Hồ sơ đang đồng bộ với dữ liệu mới nhất.
          </div>
        )}
      </section>
    </div>
  );
}
