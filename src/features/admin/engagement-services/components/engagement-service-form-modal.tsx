"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, X } from "lucide-react";
import { useEffect, useMemo } from "react";
import {
  Controller,
  useForm,
  type Resolver,
} from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/shared/ui/button";
import { getApiErrorMessage } from "@/shared/api/http-client";
import {
  useCreateEngagementService,
  useUpdateEngagementService,
} from "../hooks/use-engagement-services";
import {
  engagementServiceFormSchema,
  type EngagementServiceFormValues,
} from "../types/engagement-services.schema";
import type {
  EngagementService,
  EngagementServiceRequest,
} from "../types/engagement-services.types";

type EngagementServiceFormModalProps = {
  isOpen: boolean;
  onClose: () => void;
  initialData?: EngagementService | null;
};

const emptyFormValues: EngagementServiceFormValues = {
  name: "",
  description: "",
  engagementType: "BROAD",
  engagementTarget: "VIEW",
  price: 1000,
  targetValue: 1,
  isActive: true,
};

const fieldClassName =
  "h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#007A8A] focus:ring-4 focus:ring-[#007A8A]/10 aria-invalid:border-red-500 aria-invalid:ring-red-100";

function getInitialFormValues(
  initialData?: EngagementService | null,
): EngagementServiceFormValues {
  if (!initialData) {
    return emptyFormValues;
  }

  return {
    name: initialData.name,
    description: initialData.description,
    engagementType: initialData.engagementType,
    engagementTarget: initialData.engagementTarget,
    price: initialData.price,
    targetValue: initialData.targetValue,
    isActive: initialData.isActive,
  };
}

function toPayload(
  values: EngagementServiceFormValues,
): EngagementServiceRequest {
  return {
    name: values.name.trim(),
    description: values.description.trim(),
    engagementType: values.engagementType,
    engagementTarget: values.engagementTarget,
    price: values.price,
    targetValue: values.targetValue,
    isActive: values.isActive,
  };
}

export function EngagementServiceFormModal({
  isOpen,
  onClose,
  initialData = null,
}: EngagementServiceFormModalProps) {
  const createMutation = useCreateEngagementService();
  const updateMutation = useUpdateEngagementService();
  const mode = initialData ? "update" : "create";
  const isSubmitting = createMutation.isPending || updateMutation.isPending;
  const defaultValues = useMemo(
    () => getInitialFormValues(initialData),
    [initialData],
  );

  const form = useForm<EngagementServiceFormValues>({
    resolver: zodResolver(engagementServiceFormSchema) as Resolver<EngagementServiceFormValues>,
    defaultValues,
    mode: "onChange",
  });

  useEffect(() => {
    if (isOpen) {
      form.reset(defaultValues);
    }
  }, [defaultValues, form, isOpen]);

  if (!isOpen) {
    return null;
  }

  function handleClose() {
    if (!isSubmitting) {
      onClose();
    }
  }

  async function handleSubmit(values: EngagementServiceFormValues) {
    const payload = toPayload(values);

    try {
      if (mode === "create") {
        await createMutation.mutateAsync(payload);
        toast.success("Tạo dịch vụ tương tác thành công.");
      } else if (initialData) {
        await updateMutation.mutateAsync({
          engagementServiceId: initialData.engagementServiceId,
          payload,
        });
        toast.success("Cập nhật dịch vụ tương tác thành công.");
      }

      onClose();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/35 px-4 py-6 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-2xl"
      >
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-slate-100 bg-white px-6 py-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#007A8A]">
              Engagement Services
            </p>
            <h2 className="mt-1 text-2xl font-black text-slate-900">
              {mode === "create"
                ? "Tạo mới dịch vụ"
                : "Cập nhật dịch vụ"}
            </h2>
            <p className="mt-2 text-sm font-medium text-slate-500">
              Thiết lập loại tương tác, mục tiêu, giá tiền và giới hạn số lượng.
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Đóng modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="p-6">
          <div className="grid gap-5 md:grid-cols-2">
            <FormField
              label="Tên gói"
              error={form.formState.errors.name?.message}
            >
              <input
                {...form.register("name")}
                placeholder="Ví dụ: Gói tăng lượt xem"
                aria-invalid={Boolean(form.formState.errors.name)}
                className={fieldClassName}
              />
            </FormField>

            <FormField
              label="Trạng thái"
              error={form.formState.errors.isActive?.message}
            >
              <Controller
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <select
                    value={field.value ? "true" : "false"}
                    onChange={(event) =>
                      field.onChange(event.target.value === "true")
                    }
                    onBlur={field.onBlur}
                    aria-invalid={Boolean(form.formState.errors.isActive)}
                    className={fieldClassName}
                  >
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                )}
              />
            </FormField>

            <FormField
              label="Loại dịch vụ"
              error={form.formState.errors.engagementType?.message}
            >
              <select
                {...form.register("engagementType")}
                aria-invalid={Boolean(form.formState.errors.engagementType)}
                className={fieldClassName}
              >
                <option value="BROAD">BROAD</option>
                <option value="TARGETED">TARGETED</option>
              </select>
            </FormField>

            <FormField
              label="Mục tiêu tương tác"
              error={form.formState.errors.engagementTarget?.message}
            >
              <select
                {...form.register("engagementTarget")}
                aria-invalid={Boolean(form.formState.errors.engagementTarget)}
                className={fieldClassName}
              >
                <option value="VIEW">VIEW</option>
                <option value="FOLLOW">FOLLOW</option>
                <option value="LIKE">LIKE</option>
              </select>
            </FormField>

            <FormField
              label="Giá tiền"
              error={form.formState.errors.price?.message}
            >
              <div className="relative">
                <input
                  type="number"
                  min="1000"
                  max="1000000"
                  step="1000"
                  {...form.register("price")}
                  aria-invalid={Boolean(form.formState.errors.price)}
                  className={`${fieldClassName} pr-14`}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500">
                  VNĐ
                </span>
              </div>
            </FormField>

            <FormField
              label="Target Value"
              error={form.formState.errors.targetValue?.message}
            >
              <input
                type="number"
                min="1"
                max="1000"
                step="1"
                {...form.register("targetValue")}
                aria-invalid={Boolean(form.formState.errors.targetValue)}
                className={fieldClassName}
              />
            </FormField>

            <FormField
              label="Mô tả"
              error={form.formState.errors.description?.message}
              className="md:col-span-2"
            >
              <textarea
                rows={4}
                {...form.register("description")}
                placeholder="Mô tả cách dịch vụ này tạo tương tác cho nội dung."
                aria-invalid={Boolean(form.formState.errors.description)}
                className="w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm font-semibold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#007A8A] focus:ring-4 focus:ring-[#007A8A]/10 aria-invalid:border-red-500 aria-invalid:ring-red-100"
              />
            </FormField>
          </div>

          <div className="mt-7 flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
              className="h-11 border-slate-200 bg-white px-5 text-slate-700 hover:bg-slate-50"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="h-11 bg-[#007A8A] px-6 font-bold text-white hover:bg-[#006673]"
            >
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {mode === "create" ? "Tạo dịch vụ" : "Lưu thay đổi"}
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
  className = "",
  children,
}: {
  label: string;
  error?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={`space-y-2 ${className}`}>
      <span className="block text-sm font-bold text-slate-800">{label}</span>
      {children}
      {error && <span className="block text-xs font-bold text-red-600">{error}</span>}
    </label>
  );
}
