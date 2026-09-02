"use client";

import { useState, type ReactNode } from "react";
import {
  HelpCircle,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  SlidersHorizontal,
  Percent,
  X,
} from "lucide-react";
import { toast } from "sonner";
import {
  useCreateTaxConfig,
  useTaxConfig,
  useUpdateTaxConfig,
} from "../hooks/use-tax-config";
import {
  useSettlementConfig,
  useUpdateSettlementConfig,
} from "@/features/admin/settlement-config/hooks/use-settlement-config";
import type { TaxConfig, TaxConfigRequest } from "../types/tax-config.types";
import type {
  SettlementConfig,
  SettlementConfigRequest,
} from "@/features/admin/settlement-config/types/settlement-config.types";

type ConfigField<T> = {
  key: Extract<keyof T, string>;
  label: string;
  help: string;
  defaultValue: number;
  min?: number;
  step?: number;
  suffix?: string;
  format?: (value: number) => ReactNode;
};

const SETTLEMENT_CONFIG_FIELDS: Array<ConfigField<SettlementConfig>> = [
  {
    key: "minBalanceThreshold",
    label: "Ngưỡng số dư tối thiểu",
    help: "Mức số dư tối thiểu của Creator để đủ điều kiện thực hiện quyết toán.",
    defaultValue: 2000,
    min: 0,
    step: 100,
    format: (value) => `${new Intl.NumberFormat("vi-VN").format(value)}đ`,
  },
  {
    key: "minPayoutThreshold",
    label: "Ngưỡng rút tiền tối thiểu",
    help: "Số tiền tối thiểu cho mỗi lần tạo yêu cầu rút tiền/quyết toán.",
    defaultValue: 2000,
    min: 0,
    step: 100,
    format: (value) => `${new Intl.NumberFormat("vi-VN").format(value)}đ`,
  },
];

const TAX_CONFIG_FIELDS: Array<ConfigField<TaxConfig>> = [
  {
    key: "vat",
    label: "VAT",
    help: "Tỷ lệ thuế giá trị gia tăng áp dụng trong các nghiệp vụ thanh toán liên quan.",
    defaultValue: 0.1,
    min: 0,
    step: 0.01,
    format: (value) => `${(value * 100).toLocaleString("vi-VN")}%`,
  },
  {
    key: "pit",
    label: "PIT",
    help: "Tỷ lệ thuế thu nhập cá nhân áp dụng cho khoản thu nhập của creator.",
    defaultValue: 0.1,
    min: 0,
    step: 0.01,
    format: (value) => `${(value * 100).toLocaleString("vi-VN")}%`,
  },
  {
    key: "minPitAmount",
    label: "Ngưỡng PIT tối thiểu",
    help: "Mức tiền tối thiểu bắt đầu áp dụng PIT. Dưới ngưỡng này hệ thống có thể không khấu trừ PIT.",
    defaultValue: 0,
    min: 0,
    step: 1000,
    format: (value) => `${new Intl.NumberFormat("vi-VN").format(value)}đ`,
  },
];

function toNumber(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function formatDate(value?: string | null) {
  if (!value) return "Chưa cập nhật";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

function FieldHelp({ children }: { children: ReactNode }) {
  return (
    <span className="group relative inline-flex">
      <HelpCircle className="h-4 w-4 cursor-help text-slate-400 transition group-hover:text-[var(--backoffice-primary)] backoffice-dark:text-white/45" />
      <span className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 w-72 -translate-x-1/2 rounded-xl border border-slate-200 bg-white p-3 text-xs font-medium leading-relaxed text-slate-600 opacity-0 shadow-xl transition-opacity group-hover:opacity-100 backoffice-dark:border-white/10 backoffice-dark:bg-[#111113] backoffice-dark:text-white/75">
        {children}
      </span>
    </span>
  );
}

function MetricCard({
  help,
  label,
  value,
}: {
  help: string;
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-sm transition hover:border-slate-300 hover:bg-white backoffice-dark:border-white/10 backoffice-dark:bg-black/25 backoffice-dark:hover:border-white/20 backoffice-dark:hover:bg-white/[0.06]">
      <div className="flex items-center gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500 backoffice-dark:text-white/45">
          {label}
        </p>
        <FieldHelp>{help}</FieldHelp>
      </div>
      <div className="mt-3 text-3xl font-bold tracking-tight text-slate-950 backoffice-dark:text-white">
        {value}
      </div>
    </div>
  );
}

function ConfigModal<T extends Record<string, any>>({
  config,
  fields,
  isSubmitting,
  onClose,
  onSubmit,
  title,
  description,
}: {
  config: T | null;
  fields: Array<ConfigField<T>>;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (payload: Record<string, number>) => Promise<boolean>;
  title: string;
  description: string;
}) {
  const [form, setForm] = useState<Record<string, number>>(() => {
    return fields.reduce<Record<string, number>>((values, field) => {
      values[field.key] = config
        ? toNumber(config[field.key], field.defaultValue)
        : field.defaultValue;
      return values;
    }, {});
  });

  function handleChange(field: string, value: string) {
    setForm((current) => ({ ...current, [field]: Number(value) }));
  }

  async function handleSubmit() {
    for (const field of fields) {
      const value = form[field.key];
      if (!Number.isFinite(value)) {
        toast.error(`${field.label} chưa hợp lệ.`);
        return;
      }
      if (field.min !== undefined && value < field.min) {
        toast.error(`${field.label} phải lớn hơn hoặc bằng ${field.min}.`);
        return;
      }
    }

    const didSave = await onSubmit(form);
    if (didSave) {
      onClose();
    }
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl backoffice-dark:border-white/10 backoffice-dark:bg-[#121213]">
        <div className="flex items-start justify-between border-b border-slate-200 p-6 backoffice-dark:border-white/10">
          <div>
            <h2 className="mt-2 text-2xl font-bold text-slate-950 backoffice-dark:text-white">
              {title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 backoffice-dark:hover:bg-white/10 backoffice-dark:hover:text-white cursor-pointer"
            aria-label="Đóng"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid gap-4 p-6 sm:grid-cols-2">
          {fields.map((field) => (
            <label key={field.key} className="space-y-2">
              <span className="flex items-center gap-2 text-sm font-semibold text-slate-700 backoffice-dark:text-white/80">
                {field.label}
                <FieldHelp>{field.help}</FieldHelp>
              </span>
              <input
                type="number"
                min={field.min}
                step={field.step ?? 0.01}
                value={form[field.key] ?? ""}
                onChange={(event) => handleChange(field.key, event.target.value)}
                className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-900 outline-none transition focus:border-[var(--backoffice-primary)] focus:ring-4 focus:ring-[rgba(212,175,55,0.14)] backoffice-dark:border-white/10 backoffice-dark:bg-black/30 backoffice-dark:text-white"
              />
            </label>
          ))}
        </div>

        <div className="flex justify-end gap-3 border-t border-slate-200 bg-slate-50 p-5 backoffice-dark:border-white/10 backoffice-dark:bg-black/25">
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-white backoffice-dark:border-white/10 backoffice-dark:text-white/70 backoffice-dark:hover:bg-white/10 cursor-pointer"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 rounded-2xl bg-[var(--backoffice-primary)] px-6 py-3 text-sm font-bold text-black shadow-lg shadow-amber-500/20 transition hover:bg-[var(--backoffice-primary-bright)] disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
          >
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            Lưu thay đổi
          </button>
        </div>
      </div>
    </div>
  );
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export function TaxConfigDashboard() {
  // Settlement Config Hooks
  const settlementQuery = useSettlementConfig();
  const updateSettlementMutation = useUpdateSettlementConfig();
  const settlementConfig = settlementQuery.data ?? null;
  const [isSettlementModalOpen, setIsSettlementModalOpen] = useState(false);

  // Tax Config Hooks
  const taxQuery = useTaxConfig();
  const createTaxMutation = useCreateTaxConfig();
  const updateTaxMutation = useUpdateTaxConfig();
  const taxConfig = taxQuery.data ?? null;
  const [isTaxModalOpen, setIsTaxModalOpen] = useState(false);

  const isFetchingAll = settlementQuery.isFetching || taxQuery.isFetching;

  async function handleRefreshAll() {
    await Promise.all([settlementQuery.refetch(), taxQuery.refetch()]);
  }

  // Handle Settlement Config Submit
  async function handleSettlementSubmit(payload: Record<string, number>) {
    const request: SettlementConfigRequest = {
      minBalanceThreshold: payload.minBalanceThreshold,
      minPayoutThreshold: payload.minPayoutThreshold,
    };

    try {
      await updateSettlementMutation.mutateAsync(request);
      toast.success("Đã cập nhật cấu hình quyết toán thành công.");
      return true;
    } catch (error) {
      toast.error(
        getErrorMessage(error, "Không thể cập nhật cấu hình quyết toán."),
      );
      return false;
    }
  }

  // Handle Tax Config Submit
  async function handleTaxSubmit(payload: Record<string, number>) {
    const request: TaxConfigRequest = {
      vat: payload.vat,
      pit: payload.pit,
      minPitAmount: payload.minPitAmount,
    };
    const mutation = taxConfig ? updateTaxMutation : createTaxMutation;

    try {
      await mutation.mutateAsync(request);
      toast.success(
        taxConfig ? "Đã cập nhật cấu hình thuế." : "Đã tạo mới cấu hình thuế.",
      );
      return true;
    } catch (error) {
      toast.error(getErrorMessage(error, "Không thể lưu cấu hình thuế."));
      return false;
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-950 backoffice-dark:text-white">
            Cấu Hình Thuế & Quyết Toán
          </h2>
        </div>

        <button
          type="button"
          onClick={handleRefreshAll}
          disabled={isFetchingAll}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60 backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.04] backoffice-dark:text-white/70 backoffice-dark:hover:bg-white/10 cursor-pointer"
        >
          <RefreshCw
            className={isFetchingAll ? "h-4 w-4 animate-spin" : "h-4 w-4"}
          />
          Làm mới tất cả
        </button>
      </div>

      {/* Section 1: Settlement Config */}
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm backoffice-dark:border-white/10 backoffice-dark:bg-[linear-gradient(135deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-slate-950 backoffice-dark:text-white">
              Cấu hình quyết toán
            </h2>
            <p className="text-sm font-medium text-slate-500 backoffice-dark:text-white/55">
              {settlementConfig
                ? `Cập nhật lần cuối: ${formatDate(settlementConfig.updatedAt)}`
                : "Chưa có dữ liệu cấu hình quyết toán."}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsSettlementModalOpen(true)}
            disabled={settlementQuery.isLoading}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60 backoffice-dark:bg-[var(--backoffice-primary)] backoffice-dark:text-black backoffice-dark:hover:bg-[var(--backoffice-primary-bright)] cursor-pointer"
          >
            {settlementConfig ? (
              <Pencil className="h-4 w-4" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            Cập nhật cấu hình quyết toán
          </button>
        </div>

        <div className="mt-6">
          {settlementQuery.isLoading ? (
            <div className="flex h-32 items-center justify-center rounded-3xl border border-dashed border-slate-200 text-slate-500 backoffice-dark:border-white/10 backoffice-dark:text-white/55">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Đang tải cấu hình quyết toán...
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {SETTLEMENT_CONFIG_FIELDS.map((field) => {
                const value = settlementConfig
                  ? toNumber(settlementConfig[field.key], field.defaultValue)
                  : field.defaultValue;

                return (
                  <MetricCard
                    key={field.key}
                    label={field.label}
                    help={field.help}
                    value={
                      field.format
                        ? field.format(value)
                        : `${new Intl.NumberFormat("vi-VN").format(value)}đ`
                    }
                  />
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Section 2: Tax Config */}
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm backoffice-dark:border-white/10 backoffice-dark:bg-[linear-gradient(135deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-slate-950 backoffice-dark:text-white">
              Cấu hình thuế VAT & PIT
            </h2>
            <p className="text-sm font-medium text-slate-500 backoffice-dark:text-white/55">
              {taxConfig
                ? `Cập nhật lần cuối: ${formatDate(taxConfig.updatedAt)}`
                : "Chưa có config thuế. Tạo config để thiết lập tham số mặc định."}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsTaxModalOpen(true)}
            disabled={taxQuery.isLoading}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60 backoffice-dark:bg-[var(--backoffice-primary)] backoffice-dark:text-black backoffice-dark:hover:bg-[var(--backoffice-primary-bright)] cursor-pointer"
          >
            {taxConfig ? (
              <Pencil className="h-4 w-4" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            {taxConfig ? "Cập nhật cấu hình thuế" : "Tạo mới cấu hình thuế"}
          </button>
        </div>

        <div className="mt-6">
          {taxQuery.isLoading ? (
            <div className="flex h-32 items-center justify-center rounded-3xl border border-dashed border-slate-200 text-slate-500 backoffice-dark:border-white/10 backoffice-dark:text-white/55">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Đang tải cấu hình thuế...
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-3">
              {TAX_CONFIG_FIELDS.map((field) => {
                const value = taxConfig
                  ? toNumber(taxConfig[field.key], field.defaultValue)
                  : field.defaultValue;

                return (
                  <MetricCard
                    key={field.key}
                    label={field.label}
                    help={field.help}
                    value={
                      field.format
                        ? field.format(value)
                        : `${new Intl.NumberFormat("vi-VN").format(value)}`
                    }
                  />
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Modal for Settlement Config */}
      {isSettlementModalOpen && (
        <ConfigModal
          config={settlementConfig}
          fields={SETTLEMENT_CONFIG_FIELDS}
          isSubmitting={updateSettlementMutation.isPending}
          onClose={() => setIsSettlementModalOpen(false)}
          onSubmit={handleSettlementSubmit}
          title="Cập nhật Cấu hình Quyết toán"
          description="Thiết lập ngưỡng số dư tối thiểu và hạn mức rút tiền tối thiểu cho Creator."
        />
      )}

      {/* Modal for Tax Config */}
      {isTaxModalOpen && (
        <ConfigModal
          config={taxConfig}
          fields={TAX_CONFIG_FIELDS}
          isSubmitting={
            createTaxMutation.isPending || updateTaxMutation.isPending
          }
          onClose={() => setIsTaxModalOpen(false)}
          onSubmit={handleTaxSubmit}
          title={taxConfig ? "Cập nhật Cấu hình Thuế" : "Tạo mới Cấu hình Thuế"}
          description="Điều chỉnh các tham số VAT, PIT và ngưỡng tối thiểu khấu trừ PIT."
        />
      )}
    </div>
  );
}
