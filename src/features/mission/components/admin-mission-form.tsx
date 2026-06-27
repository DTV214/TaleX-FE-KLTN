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
  "h-11 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm font-semibold text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-[#007A8A] focus:ring-3 focus:ring-[#007A8A]/10 aria-invalid:border-red-400 aria-invalid:ring-red-100";

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
          targetValue: undefined,
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
    const payload = { ...data, code: finalCode };

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
    <section className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm sm:p-8">
      <div className="border-b border-gray-100 pb-5">
        <p className="text-xs font-bold uppercase tracking-widest text-[#007A8A]">
          Mission System
        </p>
        <h2 className="mt-2 font-heading text-2xl font-bold text-gray-900">
          {isEditing ? "Chỉnh Sửa Nhiệm Vụ" : "Thêm Nhiệm Vụ Mới"}
        </h2>
        <p className="mt-2 text-sm text-gray-500">
          Thiết lập nội dung, chỉ tiêu và phần thưởng Coin cho nhiệm vụ.
        </p>
      </div>

      <form
        className="mt-7 space-y-7"
        noValidate
        onSubmit={handleSubmit(onSubmit)}
      >
        <div
          className={`grid gap-6 ${
            questType === "ONLINE" || questType === "WATCH_AD"
              ? "md:grid-cols-2"
              : ""
          }`}
        >
          <div className="space-y-2">
            <label
              htmlFor="questType"
              className="text-sm font-semibold text-gray-800"
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
            <p className="mt-1 text-xs text-gray-500">
              Mã nhiệm vụ sẽ được hệ thống tạo tự động theo lựa chọn của bạn.
            </p>
          </div>

          {questType === "ONLINE" && (
            <div className="space-y-2">
              <label
                htmlFor="duration"
                className="text-sm font-semibold text-gray-800"
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
              <p className="mt-1 text-xs text-gray-500">
                Code được tạo khi lưu: ONLINE_{duration}M
              </p>
            </div>
          )}

          {questType === "WATCH_AD" && (
            <div className="space-y-2">
              <label
                htmlFor="adSuffix"
                className="text-sm font-semibold text-gray-800"
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
              <p className="mt-1 text-xs text-gray-500">
                Mã cuối cùng sẽ là:{" "}
                <span className="font-mono font-bold text-[#007A8A]">
                  WATCH_AD_{normalizedAdSuffix || "{hậu_tố}"}
                </span>
              </p>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <label htmlFor="title" className="text-sm font-semibold text-gray-800">
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
            <p className="text-xs font-semibold text-red-600">
              {errors.title.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <label
            htmlFor="description"
            className="text-sm font-semibold text-gray-800"
          >
            Mô tả
          </label>
          <textarea
            id="description"
            rows={4}
            placeholder="Mô tả rõ cách người dùng hoàn thành nhiệm vụ..."
            aria-invalid={Boolean(errors.description)}
            {...register("description")}
            className="w-full resize-y rounded-lg border border-gray-200 bg-white px-3 py-3 text-sm font-medium text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-[#007A8A] focus:ring-3 focus:ring-[#007A8A]/10 aria-invalid:border-red-400 aria-invalid:ring-red-100"
          />
          {errors.description?.message && (
            <p className="text-xs font-semibold text-red-600">
              {errors.description.message}
            </p>
          )}
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <label
              htmlFor="rewardAmount"
              className="text-sm font-semibold text-gray-800"
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
              <p className="text-xs font-semibold text-red-600">
                {errors.rewardAmount.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label
              htmlFor="targetValue"
              className="text-sm font-semibold text-gray-800"
            >
              Chỉ tiêu hoàn thành
            </label>
            <input
              id="targetValue"
              type="number"
              min="1"
              step="1"
              placeholder="0"
              aria-invalid={Boolean(errors.targetValue)}
              {...register("targetValue", { valueAsNumber: true })}
              className={fieldClassName}
            />
            {errors.targetValue?.message && (
              <p className="text-xs font-semibold text-red-600">
                {errors.targetValue.message}
              </p>
            )}
          </div>
        </div>

        <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-gray-200 bg-gray-50 p-4 transition hover:border-[#007A8A]/40">
          <input
            type="checkbox"
            {...register("isActive")}
            className="mt-0.5 h-4 w-4 rounded border-gray-300 accent-[#007A8A]"
          />
          <span>
            <span className="block text-sm font-semibold text-gray-800">
              Kích hoạt nhiệm vụ
            </span>
            <span className="mt-1 block text-xs leading-5 text-gray-500">
              Nhiệm vụ được bật sẽ xuất hiện trong trung tâm nhiệm vụ của người dùng.
            </span>
          </span>
        </label>

        <div className="flex flex-col-reverse gap-3 border-t border-gray-100 pt-6 sm:flex-row sm:justify-end">
          <button
            type="button"
            disabled={isPending}
            onClick={onCancel}
            className="inline-flex h-11 items-center justify-center rounded-lg border border-gray-200 bg-white px-5 text-sm font-bold text-gray-600 transition hover:bg-gray-50 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#007A8A] px-6 text-sm font-bold text-white shadow-sm transition hover:bg-[#006673] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {isEditing ? "Lưu Thay Đổi" : "Tạo Nhiệm Vụ"}
          </button>
        </div>
      </form>
    </section>
  );
}
