"use client";

import axios from "axios";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, Loader2, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  useForm,
  useWatch,
  type Resolver,
  type UseFormRegisterReturn,
} from "react-hook-form";
import { Button } from "@/shared/ui/button";
import type { BaseResponse } from "@/shared/api/http-client";
import type {
  CreatorTier,
  CreatorTierRequest,
} from "../types/creator-tiers.types";
import {
  creatorTierFormSchema,
  type CreatorTierFormValues,
} from "../types/creator-tiers.schema";
import { useCreateTier, useUpdateTier } from "../hooks/use-creator-tiers";

type CreatorTierFormModalProps = {
  isOpen: boolean;
  onClose: () => void;
  initialData?: CreatorTier | null;
};

const emptyFormValues: CreatorTierFormValues = {
  tierName: "",
  tierLevel: 1,
  minFollowerRequired: 0,
  minViewsRequired: 0,
  minWatchTimeRequired: 0,
  premiumFundShareRatio: 0,
  directPurchaseShareRatio: 0,
  isDefault: false,
};

function toPercentValue(value: number) {
  return Number((value * 100).toFixed(2));
}

function toRatioValue(value: number) {
  return Number((value / 100).toFixed(4));
}

function getInitialFormValues(
  initialData?: CreatorTier | null,
): CreatorTierFormValues {
  if (!initialData) {
    return emptyFormValues;
  }

  return {
    tierName: initialData.tierName,
    tierLevel: initialData.tierLevel,
    minFollowerRequired: initialData.minFollowerRequired,
    minViewsRequired: initialData.minViewsRequired,
    minWatchTimeRequired: initialData.minWatchTimeRequired,
    premiumFundShareRatio: toPercentValue(initialData.premiumFundShareRatio),
    directPurchaseShareRatio: toPercentValue(
      initialData.directPurchaseShareRatio,
    ),
    isDefault: initialData.isDefault,
  };
}

function getApiErrorMessage(error: unknown) {
  if (axios.isAxiosError<BaseResponse<unknown>>(error)) {
    const code = error.response?.data?.code;
    const message = error.response?.data?.message;

    if (code === 4061) {
      return message || "Cấp tier đã tồn tại. Vui lòng chọn cấp khác.";
    }

    if (code === 4062) {
      return (
        message ||
        "Logic điều kiện tier không hợp lệ. Cấp cao hơn phải có ngưỡng cao hơn."
      );
    }

    return message || error.message;
  }

  return error instanceof Error ? error.message : "Không thể lưu cấp Creator.";
}

function toPayload(values: CreatorTierFormValues): CreatorTierRequest {
  return {
    tierName: values.tierName.trim(),
    tierLevel: values.tierLevel,
    minFollowerRequired: values.minFollowerRequired,
    minViewsRequired: values.minViewsRequired,
    minWatchTimeRequired: values.minWatchTimeRequired,
    premiumFundShareRatio: toRatioValue(values.premiumFundShareRatio),
    directPurchaseShareRatio: toRatioValue(values.directPurchaseShareRatio),
    isDefault: values.isDefault,
  };
}

export function CreatorTierFormModal({
  isOpen,
  onClose,
  initialData = null,
}: CreatorTierFormModalProps) {
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const mode = initialData ? "update" : "create";
  const createMutation = useCreateTier();
  const updateMutation = useUpdateTier();
  const isSubmitting = createMutation.isPending || updateMutation.isPending;
  const defaultValues = useMemo(
    () => getInitialFormValues(initialData),
    [initialData],
  );

  const form = useForm<CreatorTierFormValues>({
    resolver: zodResolver(creatorTierFormSchema) as Resolver<CreatorTierFormValues>,
    defaultValues,
    mode: "onChange",
  });

  const isDefault = useWatch({
    control: form.control,
    name: "isDefault",
  });

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    form.reset(defaultValues);
  }, [defaultValues, form, isOpen]);

  useEffect(() => {
    if (!isDefault) {
      return;
    }

    form.setValue("tierLevel", 0, { shouldDirty: true, shouldValidate: true });
    form.setValue("minFollowerRequired", 0, {
      shouldDirty: true,
      shouldValidate: true,
    });
    form.setValue("minViewsRequired", 0, {
      shouldDirty: true,
      shouldValidate: true,
    });
    form.setValue("minWatchTimeRequired", 0, {
      shouldDirty: true,
      shouldValidate: true,
    });
  }, [form, isDefault]);

  if (!isOpen) {
    return null;
  }

  function handleClose() {
    setToastMessage(null);
    onClose();
  }

  async function handleSubmit(values: CreatorTierFormValues) {
    setToastMessage(null);
    const payload = toPayload(values);

    try {
      if (mode === "create") {
        await createMutation.mutateAsync(payload);
      } else if (initialData) {
        await updateMutation.mutateAsync({
          creatorTierId: initialData.creatorTierId,
          payload,
        });
      }

      handleClose();
    } catch (error) {
      setToastMessage(getApiErrorMessage(error));
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 px-4 py-6 backdrop-blur-sm">
      {toastMessage && (
        <div className="fixed right-6 top-6 z-[60] flex max-w-md items-start gap-3 rounded-xl border border-red-200 bg-white px-4 py-3 text-sm font-semibold text-red-700 shadow-2xl">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div
        role="dialog"
        aria-modal="true"
        className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl"
      >
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-slate-100 bg-white px-6 py-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#007A8A]">
              Cấp Creator
            </p>
            <h2 className="mt-1 text-2xl font-black text-slate-950">
              {mode === "create" ? "Tạo mới cấp" : "Cập nhật cấp"}
            </h2>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-950"
            aria-label="Đóng modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="p-6">
          <div className="grid gap-5 md:grid-cols-2">
            <FormField
              label="Tên cấp"
              error={form.formState.errors.tierName?.message}
            >
              <input
                {...form.register("tierName")}
                className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-[#007A8A] focus:ring-4 focus:ring-[#007A8A]/10 aria-invalid:border-red-500 aria-invalid:ring-red-100"
                aria-invalid={Boolean(form.formState.errors.tierName)}
                placeholder="Ví dụ: Rank Đồng"
              />
            </FormField>

            <FormField
              label="Cấp mặc định"
              error={form.formState.errors.isDefault?.message}
            >
              <label className="flex h-11 items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm font-bold text-slate-700">
                <span>Áp dụng làm cấp mặc định</span>
                <input
                  type="checkbox"
                  {...form.register("isDefault")}
                  className="h-5 w-5 rounded border-slate-300 accent-[#007A8A]"
                />
              </label>
            </FormField>

            <FormField
              label="Cấp"
              error={form.formState.errors.tierLevel?.message}
            >
              <input
                type="number"
                {...form.register("tierLevel")}
                disabled={isDefault}
                className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-[#007A8A] focus:ring-4 focus:ring-[#007A8A]/10 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 aria-invalid:border-red-500 aria-invalid:ring-red-100"
                aria-invalid={Boolean(form.formState.errors.tierLevel)}
              />
            </FormField>

            <FormField
              label="Follower tối thiểu"
              error={form.formState.errors.minFollowerRequired?.message}
            >
              <input
                type="number"
                {...form.register("minFollowerRequired")}
                disabled={isDefault}
                className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-[#007A8A] focus:ring-4 focus:ring-[#007A8A]/10 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 aria-invalid:border-red-500 aria-invalid:ring-red-100"
                aria-invalid={Boolean(
                  form.formState.errors.minFollowerRequired,
                )}
              />
            </FormField>

            <FormField
              label="Lượt xem tối thiểu"
              error={form.formState.errors.minViewsRequired?.message}
            >
              <input
                type="number"
                {...form.register("minViewsRequired")}
                disabled={isDefault}
                className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-[#007A8A] focus:ring-4 focus:ring-[#007A8A]/10 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 aria-invalid:border-red-500 aria-invalid:ring-red-100"
                aria-invalid={Boolean(form.formState.errors.minViewsRequired)}
              />
            </FormField>

            <FormField
              label="Thời lượng xem tối thiểu (giờ)"
              error={form.formState.errors.minWatchTimeRequired?.message}
            >
              <input
                type="number"
                step="0.01"
                {...form.register("minWatchTimeRequired")}
                disabled={isDefault}
                className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-[#007A8A] focus:ring-4 focus:ring-[#007A8A]/10 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 aria-invalid:border-red-500 aria-invalid:ring-red-100"
                aria-invalid={Boolean(
                  form.formState.errors.minWatchTimeRequired,
                )}
              />
            </FormField>

            <FormField
              label="Tỷ lệ chia quỹ Premium"
              error={form.formState.errors.premiumFundShareRatio?.message}
              hint="Nhập phần trăm từ 0% đến 100%. Ví dụ: 30 nghĩa là 30%."
            >
              <PercentInput
                registration={form.register("premiumFundShareRatio")}
                invalid={Boolean(
                  form.formState.errors.premiumFundShareRatio,
                )}
              />
            </FormField>

            <FormField
              label="Tỷ lệ mua trực tiếp"
              error={form.formState.errors.directPurchaseShareRatio?.message}
              hint="Nhập phần trăm từ 0% đến 100%. Ví dụ: 50 nghĩa là 50%."
            >
              <PercentInput
                registration={form.register("directPurchaseShareRatio")}
                invalid={Boolean(
                  form.formState.errors.directPurchaseShareRatio,
                )}
              />
            </FormField>
          </div>

          <div className="mt-7 flex justify-end gap-3 border-t border-slate-100 pt-5">
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              size="lg"
              disabled={isSubmitting}
              className="bg-[#007A8A] text-white hover:bg-[#006673]"
            >
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {mode === "create" ? "Tạo cấp" : "Lưu thay đổi"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function PercentInput({
  registration,
  invalid,
}: {
  registration: UseFormRegisterReturn;
  invalid: boolean;
}) {
  return (
    <div className="relative">
      <input
        type="number"
        step="1"
        min="0"
        max="100"
        {...registration}
        className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 pr-10 text-sm font-semibold text-slate-900 outline-none transition focus:border-[#007A8A] focus:ring-4 focus:ring-[#007A8A]/10 aria-invalid:border-red-500 aria-invalid:ring-red-100"
        aria-invalid={invalid}
      />
      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm font-black text-slate-400">
        %
      </span>
    </div>
  );
}

function FormField({
  label,
  error,
  hint,
  children,
}: {
  label: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-600">
        {label}
      </span>
      {children}
      {error ? (
        <span className="mt-1.5 block text-xs font-bold text-red-600">
          {error}
        </span>
      ) : hint ? (
        <span className="mt-1.5 block text-xs font-semibold text-slate-400">
          {hint}
        </span>
      ) : null}
    </label>
  );
}
