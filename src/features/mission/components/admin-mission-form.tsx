"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import type { Mission } from "../api/mission.dto";
import {
  useCreateMissionMutation,
  useUpdateMissionMutation,
} from "../hooks/useMissionMutations";

const missionSchema = z.object({
  code: z.string(),
  title: z.string().trim().min(1, "Tên nhiệm vụ không được để trống"),
  description: z.string().trim().min(1, "Mô tả không được để trống"),
  rewardAmount: z.number().positive("Phần thưởng phải lớn hơn 0"),
  targetValue: z.number().positive("Mục tiêu phải lớn hơn 0"),
  isActive: z.boolean(),
});

type MissionFormValues = z.infer<typeof missionSchema>;

type AdminMissionFormProps = {
  initialData?: Mission | null;
  onSuccess: () => void;
  onCancel: () => void;
};

const fieldClassName =
  "h-11 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm font-semibold text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-violet-500 focus:ring-3 focus:ring-violet-100 aria-invalid:border-red-400 aria-invalid:ring-red-100 backoffice-dark:border-white/10 backoffice-dark:bg-black/30 backoffice-dark:text-white backoffice-dark:focus:border-[var(--backoffice-primary)] backoffice-dark:focus:ring-[rgba(212,175,55,0.16)]";

export function AdminMissionForm({
  initialData,
  onSuccess,
  onCancel,
}: AdminMissionFormProps) {
  const [questType, setQuestType] = useState<string>("ONLINE");
  const [duration, setDuration] = useState<string>("1");
  const [adSuffix, setAdSuffix] = useState("");
  const createMutation = useCreateMissionMutation();
  const updateMutation = useUpdateMissionMutation();
  const isEditing = Boolean(initialData);
  const isPending = createMutation.isPending || updateMutation.isPending;
  const normalizedAdSuffix = adSuffix.trim().toUpperCase();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<MissionFormValues>({
    resolver: zodResolver(missionSchema),
    defaultValues: initialData
      ? {
        code: initialData.code,
        title: initialData.title,
        description: initialData.description,
        rewardAmount: initialData.rewardAmount,
        targetValue: initialData.targetValue,
        isActive: initialData.isActive,
      }
      : {
        code: "",
        title: "",
        description: "",
        rewardAmount: undefined,
        targetValue: 1,
        isActive: true,
      },
  });

  // Keep both controlled selects in sync when the form switches records.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!initialData) {
      setQuestType("ONLINE");
      setDuration("1");
      setAdSuffix("");
      return;
    }

    if (initialData.code.startsWith("ONLINE_")) {
      const durationMatch = initialData.code.match(/^ONLINE_(\d+)M$/);
      setQuestType("ONLINE");
      setDuration(durationMatch?.[1] ?? "1");
      setAdSuffix("");
      return;
    }

    if (initialData.code.startsWith("WATCH_AD_")) {
      setQuestType("WATCH_AD");
      setAdSuffix(initialData.code.replace(/^WATCH_AD_/, ""));
      return;
    }

    setQuestType(initialData.code);
    setAdSuffix("");
  }, [initialData]);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    if (questType !== "ONLINE") return;

    setValue("targetValue", Number(duration), {
      shouldDirty: true,
      shouldValidate: true,
    });
  }, [duration, questType, setValue]);

  function onSubmit(data: MissionFormValues) {
    if (questType === "WATCH_AD" && !normalizedAdSuffix) {
      window.alert("Vui lòng nhập hậu tố mã cho nhiệm vụ quảng cáo.");
      return;
    }

    const finalCode =
      questType === "ONLINE"
        ? `ONLINE_${duration}M`
        : questType === "WATCH_AD"
          ? `WATCH_AD_${normalizedAdSuffix}`
          : questType;
    const payload = {
      ...data,
      code: finalCode,
      targetValue: questType === "ONLINE" ? Number(duration) : data.targetValue,
    };

    if (initialData) {
      updateMutation.mutate(
        { id: initialData.missionId, data: payload },
        { onSuccess },
      );
      return;
    }

    createMutation.mutate(payload, { onSuccess });
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.04] sm:p-8">
      <div className="border-b border-gray-100 pb-5 backoffice-dark:border-white/10">
        <h2 className="mt-2 font-heading text-2xl font-bold text-gray-900 backoffice-dark:text-white">
          {isEditing ? "Chỉnh Sửa Nhiệm Vụ" : "Thêm Nhiệm Vụ Mới"}
        </h2>
      </div>

      <form
        className="mt-7 space-y-7"
        noValidate
        onSubmit={handleSubmit(onSubmit)}
      >
        <div
          className={`grid gap-6 ${questType === "ONLINE" || questType === "WATCH_AD"
            ? "md:grid-cols-2"
            : ""
            }`}
        >
          <div className="space-y-2">
            <label
              htmlFor="questType"
              className="text-sm font-semibold text-gray-800 backoffice-dark:text-white/80"
            >
              Loại nhiệm vụ
            </label>
            <select
              id="questType"
              value={questType}
              onChange={(event) => setQuestType(event.target.value)}
              className={fieldClassName}
            >
              <option value="ONLINE">Nhiệm vụ Online</option>
              <option value="WATCH_AD">Xem Quảng Cáo</option>
              <option value="COMPLETE_PROFILE">Hoàn thiện hồ sơ</option>
            </select>
          </div>

          {questType === "ONLINE" && (
            <div className="space-y-2">
              <label
                htmlFor="duration"
                className="text-sm font-semibold text-gray-800 backoffice-dark:text-white/80"
              >
                Thời gian (Phút)
              </label>
              <select
                id="duration"
                value={duration}
                onChange={(event) => setDuration(event.target.value)}
                className={fieldClassName}
              >
                {[1, 3, 5, 10, 15, 30, 60].map((minutes) => (
                  <option key={minutes} value={minutes}>
                    {minutes} phút
                  </option>
                ))}
              </select>
            </div>
          )}

          {questType === "WATCH_AD" && (
            <div className="space-y-2">
              <label
                htmlFor="adSuffix"
                className="text-sm font-semibold text-gray-800 backoffice-dark:text-white/80"
              >
                Hậu tố mã
              </label>
              <input
                id="adSuffix"
                type="text"
                value={adSuffix}
                onChange={(event) => setAdSuffix(event.target.value)}
                placeholder="VD: 1, DAILY, VIP"
                className={fieldClassName}
              />
              <p className="mt-1 text-xs text-gray-500 backoffice-dark:text-white/50">
                Mã cuối cùng sẽ là:{" "}
                <span className="font-mono font-bold text-violet-600 backoffice-dark:text-[var(--backoffice-primary)]">
                  WATCH_AD_{normalizedAdSuffix || "{hậu_tố}"}
                </span>
              </p>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <label htmlFor="title" className="text-sm font-semibold text-gray-800 backoffice-dark:text-white/80">
            Tên nhiệm vụ
          </label>
          <input
            id="title"
            type="text"
            placeholder="VD: Xem quảng cáo mỗi ngày"
            aria-invalid={Boolean(errors.title)}
            {...register("title")}
            className={fieldClassName}
          />
          {errors.title?.message && (
            <p className="text-xs font-semibold text-red-600 dark:text-red-400">
              {errors.title.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <label
            htmlFor="description"
            className="text-sm font-semibold text-gray-800 backoffice-dark:text-white/80"
          >
            Mô tả
          </label>
          <textarea
            id="description"
            rows={4}
            placeholder="Mô tả rõ cách người dùng hoàn thành nhiệm vụ..."
            aria-invalid={Boolean(errors.description)}
            {...register("description")}
            className="w-full resize-y rounded-lg border border-gray-200 bg-white px-3 py-3 text-sm font-medium text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-violet-500 focus:ring-3 focus:ring-violet-100 aria-invalid:border-red-400 aria-invalid:ring-red-100 backoffice-dark:border-white/10 backoffice-dark:bg-black/30 backoffice-dark:text-white backoffice-dark:focus:border-[var(--backoffice-primary)] backoffice-dark:focus:ring-[rgba(212,175,55,0.16)]"
          />
          {errors.description?.message && (
            <p className="text-xs font-semibold text-red-600 dark:text-red-400">
              {errors.description.message}
            </p>
          )}
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <label
              htmlFor="rewardAmount"
              className="text-sm font-semibold text-gray-800 backoffice-dark:text-white/80"
            >
              Phần thưởng Coin
            </label>
            <input
              id="rewardAmount"
              type="number"
              min="0.0001"
              step="0.0001"
              placeholder="0"
              aria-invalid={Boolean(errors.rewardAmount)}
              {...register("rewardAmount", { valueAsNumber: true })}
              className={fieldClassName}
            />
            {errors.rewardAmount?.message && (
              <p className="text-xs font-semibold text-red-600 dark:text-red-400">
                {errors.rewardAmount.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label
              htmlFor="targetValue"
              className="text-sm font-semibold text-gray-800 backoffice-dark:text-white/80"
            >
              Chỉ tiêu hoàn thành
            </label>
            <input
              id="targetValue"
              type="number"
              min="1"
              step="1"
              placeholder="0"
              readOnly={questType === "ONLINE"}
              aria-invalid={Boolean(errors.targetValue)}
              {...register("targetValue", { valueAsNumber: true })}
              className={`${fieldClassName} ${questType === "ONLINE"
                ? "cursor-not-allowed bg-gray-100 text-gray-500 backoffice-dark:bg-white/5 backoffice-dark:text-white/40"
                : ""
                }`}
            />
            {questType === "ONLINE" && (
              <p className="text-xs font-medium text-gray-500 backoffice-dark:text-white/50">
                Nhiệm vụ online bắn heartbeat mỗi 60 giây, nên chỉ tiêu được tự
                động quy đổi theo số phút đã chọn.
              </p>
            )}
            {errors.targetValue?.message && (
              <p className="text-xs font-semibold text-red-600 dark:text-red-400">
                {errors.targetValue.message}
              </p>
            )}
          </div>
        </div>

        <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-gray-200 bg-gray-50 p-4 transition hover:border-violet-500/40 backoffice-dark:border-white/10 backoffice-dark:bg-black/25">
          <input
            type="checkbox"
            {...register("isActive")}
            className="mt-0.5 h-4 w-4 rounded border-gray-300 accent-violet-600 backoffice-dark:accent-[var(--backoffice-primary)]"
          />
          <span>
            <span className="block text-sm font-semibold text-gray-800 backoffice-dark:text-white">
              Kích hoạt nhiệm vụ
            </span>
            <span className="mt-1 block text-xs leading-5 text-gray-500 backoffice-dark:text-white/50">
              Nhiệm vụ được bật sẽ xuất hiện trong trung tâm nhiệm vụ của người dùng.
            </span>
          </span>
        </label>

        <div className="flex flex-col-reverse gap-3 border-t border-gray-100 pt-6 sm:flex-row sm:justify-end backoffice-dark:border-white/10">
          <button
            type="button"
            disabled={isPending}
            onClick={onCancel}
            className="inline-flex h-11 items-center justify-center rounded-lg border border-gray-200 bg-white px-5 text-sm font-bold text-gray-600 transition hover:bg-gray-50 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-50 backoffice-dark:border-white/10 backoffice-dark:bg-white/5 backoffice-dark:text-white/70 backoffice-dark:hover:bg-white/10 backoffice-dark:hover:text-white"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-violet-600 px-6 text-sm font-bold text-white shadow-sm transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60 backoffice-dark:bg-[var(--backoffice-primary)] backoffice-dark:text-black backoffice-dark:hover:bg-[var(--backoffice-primary-bright)]"
          >
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {isEditing ? "Lưu Thay Đổi" : "Tạo Nhiệm Vụ"}
          </button>
        </div>
      </form>
    </section>
  );
}
