"use client";

import { HelpCircle, Loader2, Pencil, Plus, RefreshCw, X } from "lucide-react";
import { useState, type ReactNode } from "react";
import { toast } from "sonner";

type NumericConfig = Record<string, number | string | null | undefined>;

export type SingletonConfigField<TConfig extends NumericConfig> = {
  key: Extract<keyof TConfig, string>;
  label: string;
  help: string;
  defaultValue: number;
  min?: number;
  step?: number;
  suffix?: string;
  format?: (value: number) => ReactNode;
};

type SingletonConfigDashboardProps<TConfig extends NumericConfig> = {
  badge: string;
  title: string;
  description: string;
  sectionLabel: string;
  emptyTitle: string;
  activeTitle: string;
  emptyDescription: string;
  updatedAt?: string | null;
  config: TConfig | null;
  fields: Array<SingletonConfigField<TConfig>>;
  isLoading: boolean;
  isFetching?: boolean;
  isSubmitting: boolean;
  onRefresh: () => void;
  onSubmit: (payload: Record<string, number>) => boolean | Promise<boolean>;
};

function toNumber(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("vi-VN").format(value);
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

function ConfigModal<TConfig extends NumericConfig>({
  config,
  fields,
  isSubmitting,
  onClose,
  onSubmit,
  title,
}: {
  config: TConfig | null;
  fields: Array<SingletonConfigField<TConfig>>;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (payload: Record<string, number>) => boolean | Promise<boolean>;
  title: string;
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
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--backoffice-primary)]">
              Settings
            </p>
            <h2 className="mt-2 text-2xl font-bold text-slate-950 backoffice-dark:text-white">
              {title}
            </h2>
            <p className="mt-1 text-sm font-medium text-slate-500 backoffice-dark:text-white/55">
              Điều chỉnh các tham số cấu hình đang được hệ thống sử dụng.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 backoffice-dark:hover:bg-white/10 backoffice-dark:hover:text-white"
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
            className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-white backoffice-dark:border-white/10 backoffice-dark:text-white/70 backoffice-dark:hover:bg-white/10"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 rounded-2xl bg-[var(--backoffice-primary)] px-6 py-3 text-sm font-bold text-black shadow-lg shadow-amber-500/20 transition hover:bg-[var(--backoffice-primary-bright)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            Lưu thay đổi
          </button>
        </div>
      </div>
    </div>
  );
}

export function SingletonConfigDashboard<TConfig extends NumericConfig>({
  activeTitle,
  badge,
  config,
  description,
  emptyDescription,
  emptyTitle,
  fields,
  isFetching,
  isLoading,
  isSubmitting,
  onRefresh,
  onSubmit,
  sectionLabel,
  title,
  updatedAt,
}: SingletonConfigDashboardProps<TConfig>) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.04]">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-amber-600 backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.06] backoffice-dark:text-[var(--backoffice-primary)]">
              {badge}
            </div>
            <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-950 backoffice-dark:text-white">
              {title}
            </h1>
            <p className="mt-2 max-w-2xl text-sm font-medium leading-relaxed text-slate-500 backoffice-dark:text-white/55">
              {description}
            </p>
          </div>
          <button
            type="button"
            onClick={onRefresh}
            disabled={isFetching}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60 backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.04] backoffice-dark:text-white/70 backoffice-dark:hover:bg-white/10"
          >
            <RefreshCw
              className={isFetching ? "h-4 w-4 animate-spin" : "h-4 w-4"}
            />
            Làm mới
          </button>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm backoffice-dark:border-white/10 backoffice-dark:bg-[linear-gradient(135deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--backoffice-primary)]">
              {sectionLabel}
            </p>
            <h2 className="mt-1 text-xl font-bold text-slate-950 backoffice-dark:text-white">
              {config ? activeTitle : emptyTitle}
            </h2>
            <p className="mt-1 text-sm font-medium text-slate-500 backoffice-dark:text-white/55">
              {config
                ? `Cập nhật lần cuối: ${formatDate(updatedAt)}`
                : emptyDescription}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            disabled={isLoading}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60 backoffice-dark:bg-[var(--backoffice-primary)] backoffice-dark:text-black backoffice-dark:hover:bg-[var(--backoffice-primary-bright)]"
          >
            {config ? <Pencil className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {config ? "Cập nhật config" : "Tạo mới config"}
          </button>
        </div>

        <div className="mt-6">
          {isLoading ? (
            <div className="flex h-32 items-center justify-center rounded-3xl border border-dashed border-slate-200 text-slate-500 backoffice-dark:border-white/10 backoffice-dark:text-white/55">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Đang tải cấu hình...
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {fields.map((field) => {
                const value = config
                  ? toNumber(config[field.key], field.defaultValue)
                  : field.defaultValue;

                return (
                  <MetricCard
                    key={field.key}
                    label={field.label}
                    help={field.help}
                    value={
                      field.format
                        ? field.format(value)
                        : `${formatNumber(value)}${field.suffix ?? ""}`
                    }
                  />
                );
              })}
            </div>
          )}
        </div>
      </section>

      {isModalOpen && (
        <ConfigModal
          config={config}
          fields={fields}
          isSubmitting={isSubmitting}
          onClose={() => setIsModalOpen(false)}
          onSubmit={onSubmit}
          title={config ? `Cập nhật ${title}` : `Tạo mới ${title}`}
        />
      )}
    </div>
  );
}
