"use client";

import axios from "axios";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, Loader2, X } from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useForm, type Resolver } from "react-hook-form";
import type { BaseResponse } from "@/shared/api/http-client";
import { Button } from "@/shared/ui/button";
import type {
  Subscription,
  SubscriptionDurationUnit,
  SubscriptionRequest,
} from "../types/subscriptions.types";
import {
  subscriptionFormSchema,
  type SubscriptionFormValues,
} from "../types/subscriptions.schema";
import {
  useCreateSubscription,
  useUpdateSubscription,
} from "../hooks/use-subscriptions";

type SubscriptionFormModalProps = {
  isOpen: boolean;
  onClose: () => void;
  initialData?: Subscription | null;
};

const emptyFormValues: SubscriptionFormValues = {
  tier: "",
  description: "",
  price: 0,
  duration: 1,
  durationUnit: "Months",
};

const defaultBenefits = [
  "Chặn quảng cáo",
  "Mở khóa phim VIP",
  "Mở khóa truyện VIP",
];

function normalizeDurationUnit(value: string): SubscriptionDurationUnit {
  if (value === "Days" || value === "Months" || value === "Years") {
    return value;
  }

  return "Months";
}

function getInitialFormValues(
  initialData?: Subscription | null,
): SubscriptionFormValues {
  if (!initialData) {
    return emptyFormValues;
  }

  return {
    tier: initialData.tier,
    description: initialData.description,
    price: initialData.price,
    duration: initialData.duration,
    durationUnit: normalizeDurationUnit(initialData.durationUnit),
  };
}

function toPayload(values: SubscriptionFormValues): SubscriptionRequest {
  return {
    tier: values.tier.trim(),
    description: values.description.trim(),
    price: values.price,
    duration: values.duration,
    durationUnit: values.durationUnit,
  };
}

function getApiErrorMessage(error: unknown) {
  if (axios.isAxiosError<BaseResponse<unknown>>(error)) {
    return error.response?.data?.message || error.message;
  }

  return error instanceof Error ? error.message : "Không thể lưu gói Premium.";
}

export function SubscriptionFormModal({
  isOpen,
  onClose,
  initialData = null,
}: SubscriptionFormModalProps) {
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const createMutation = useCreateSubscription();
  const updateMutation = useUpdateSubscription();
  const mode = initialData ? "update" : "create";
  const isSubmitting = createMutation.isPending || updateMutation.isPending;
  const defaultValues = useMemo(
    () => getInitialFormValues(initialData),
    [initialData],
  );

  const form = useForm<SubscriptionFormValues>({
    resolver: zodResolver(subscriptionFormSchema) as Resolver<SubscriptionFormValues>,
    defaultValues,
    mode: "onChange",
  });

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    form.reset(defaultValues);
  }, [defaultValues, form, isOpen]);

  if (!isOpen) {
    return null;
  }

  function handleClose() {
    setToastMessage(null);
    onClose();
  }

  async function handleSubmit(values: SubscriptionFormValues) {
    setToastMessage(null);
    const payload = toPayload(values);

    try {
      if (mode === "create") {
        await createMutation.mutateAsync(payload);
      } else if (initialData) {
        await updateMutation.mutateAsync({
          subscriptionId: initialData.subscriptionId,
          payload,
        });
      }

      handleClose();
    } catch (error) {
      setToastMessage(getApiErrorMessage(error));
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 px-4 py-6 backdrop-blur-sm">
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
              Gói Premium
            </p>
            <h2 className="mt-1 text-2xl font-black text-slate-950">
              {mode === "create" ? "Tạo mới gói" : "Cập nhật gói"}
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
              label="Tên gói"
              error={form.formState.errors.tier?.message}
            >
              <input
                {...form.register("tier")}
                placeholder="Ví dụ: Premium Tháng"
                className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-[#007A8A] focus:ring-4 focus:ring-[#007A8A]/10 aria-invalid:border-red-500 aria-invalid:ring-red-100"
                aria-invalid={Boolean(form.formState.errors.tier)}
              />
            </FormField>

            <FormField
              label="Giá"
              error={form.formState.errors.price?.message}
            >
              <div className="relative">
                <input
                  type="number"
                  step="1000"
                  min="0"
                  {...form.register("price")}
                  className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 pr-12 text-sm font-semibold text-slate-900 outline-none transition focus:border-[#007A8A] focus:ring-4 focus:ring-[#007A8A]/10 aria-invalid:border-red-500 aria-invalid:ring-red-100"
                  aria-invalid={Boolean(form.formState.errors.price)}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-500">
                  VNĐ
                </span>
              </div>
            </FormField>

            <FormField
              label="Thời hạn"
              error={form.formState.errors.duration?.message}
            >
              <input
                type="number"
                step="1"
                min="0"
                {...form.register("duration")}
                className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-[#007A8A] focus:ring-4 focus:ring-[#007A8A]/10 aria-invalid:border-red-500 aria-invalid:ring-red-100"
                aria-invalid={Boolean(form.formState.errors.duration)}
              />
            </FormField>

            <FormField
              label="Đơn vị thời hạn"
              error={form.formState.errors.durationUnit?.message}
            >
              <select
                {...form.register("durationUnit")}
                className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-[#007A8A] focus:ring-4 focus:ring-[#007A8A]/10 aria-invalid:border-red-500 aria-invalid:ring-red-100"
                aria-invalid={Boolean(form.formState.errors.durationUnit)}
              >
                <option value="Days">Ngày</option>
                <option value="Months">Tháng</option>
                <option value="Years">Năm</option>
              </select>
            </FormField>

            <FormField
              label="Mô tả"
              error={form.formState.errors.description?.message}
              className="md:col-span-2"
            >
              <textarea
                rows={4}
                {...form.register("description")}
                placeholder="Mô tả ngắn về gói Premium..."
                className="w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-[#007A8A] focus:ring-4 focus:ring-[#007A8A]/10 aria-invalid:border-red-500 aria-invalid:ring-red-100"
                aria-invalid={Boolean(form.formState.errors.description)}
              />
            </FormField>
          </div>

          <section className="mt-6 rounded-xl border border-slate-100 bg-slate-50 p-4">
            <div className="mb-4">
              <p className="text-xs font-black uppercase tracking-wide text-slate-600">
                Quyền lợi gói (Mặc định được cấp)
              </p>
              <p className="mt-1 text-xs font-semibold text-slate-500">
                Quyền lợi mặc định, chỉ hiển thị để admin kiểm tra.
              </p>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              {defaultBenefits.map((benefit) => (
                <div
                  key={benefit}
                  className="rounded-xl border border-slate-200 bg-white p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-black text-slate-900">
                        {benefit}
                      </p>
                      <p className="mt-1 text-xs font-semibold text-slate-500">
                        Quyền lợi mặc định
                      </p>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked="true"
                      disabled
                      className="relative h-6 w-11 shrink-0 cursor-not-allowed rounded-full bg-[#007A8A] opacity-70"
                    >
                      <span className="absolute left-6 top-1 h-4 w-4 rounded-full bg-white shadow" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

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
              {mode === "create" ? "Tạo gói" : "Lưu thay đổi"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function FormField({
  label,
  error,
  className,
  children,
}: {
  label: string;
  error?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <label className={className}>
      <span className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-600">
        {label}
      </span>
      {children}
      {error && (
        <span className="mt-1.5 block text-xs font-bold text-red-600">
          {error}
        </span>
      )}
    </label>
  );
}
