"use client";

import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Loader2, Save } from "lucide-react";
import { z } from "zod";
import type { CoinEconomyConfigRequest } from "../api/coin-admin.api";
import {
  useCoinEconomyConfig,
  useUpdateCoinEconomyConfig,
} from "../hooks/useCoinAdmin";

const coinEconomySchema = z
  .object({
    dailyCheckInBase: z
      .number()
      .positive("Thưởng điểm danh cơ bản phải lớn hơn 0"),
    milestone7Reward: z
      .number()
      .positive("Thưởng mốc 7 ngày phải lớn hơn 0"),
    milestone14Reward: z
      .number()
      .positive("Thưởng mốc 14 ngày phải lớn hơn 0"),
    milestone30Reward: z
      .number()
      .positive("Thưởng mốc 30 ngày phải lớn hơn 0"),
    vndPerCoin: z
      .number()
      .positive("Tỉ giá quy đổi (VNĐ/Coin) phải lớn hơn 0"),
  })
  .refine((values) => values.dailyCheckInBase < values.milestone7Reward, {
    path: ["milestone7Reward"],
    message: "Thưởng mốc 7 ngày phải lớn hơn mốc cơ bản",
  })
  .refine((values) => values.milestone7Reward < values.milestone14Reward, {
    path: ["milestone14Reward"],
    message: "Thưởng mốc 14 ngày phải lớn hơn mốc 7 ngày",
  })
  .refine((values) => values.milestone14Reward < values.milestone30Reward, {
    path: ["milestone30Reward"],
    message: "Thưởng mốc 30 ngày phải lớn hơn mốc 14 ngày",
  });

const DEFAULT_VALUES: CoinEconomyConfigRequest = {
  dailyCheckInBase: 1,
  milestone7Reward: 2,
  milestone14Reward: 3,
  milestone30Reward: 4,
  vndPerCoin: 100,
};

const FIELDS: Array<{
  name: keyof CoinEconomyConfigRequest;
  label: string;
  description: string;
}> = [
  {
    name: "dailyCheckInBase",
    label: "Thưởng điểm danh cơ bản",
    description: "Số coin người dùng nhận được khi điểm danh hằng ngày.",
  },
  {
    name: "milestone7Reward",
    label: "Thưởng mốc 7 ngày",
    description: "Phần thưởng bổ sung khi duy trì chuỗi điểm danh 7 ngày.",
  },
  {
    name: "milestone14Reward",
    label: "Thưởng mốc 14 ngày",
    description: "Phần thưởng bổ sung khi duy trì chuỗi điểm danh 14 ngày.",
  },
  {
    name: "milestone30Reward",
    label: "Thưởng mốc 30 ngày",
    description: "Phần thưởng cao nhất cho chuỗi điểm danh 30 ngày.",
  },
  {
    name: "vndPerCoin",
    label: "Tỉ giá quy đổi (VNĐ / 1 Coin)",
    description:
      "Số VNĐ tương ứng 1 Coin khi thanh toán nội dung, ví dụ 100 = 1 Coin ⇒ 100 VNĐ.",
  },
];

function formatDate(dateString: string) {
  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return dateString;
  }

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function FormSkeleton() {
  return (
    <div className="grid animate-pulse gap-6 md:grid-cols-2">
      {[0, 1, 2, 3].map((item) => (
        <div key={item} className="space-y-3">
          <div className="h-4 w-36 rounded bg-gray-200" />
          <div className="h-11 w-full rounded-lg bg-gray-100" />
          <div className="h-3 w-3/4 rounded bg-gray-100" />
        </div>
      ))}
    </div>
  );
}

export function CoinEconomyForm() {
  const configQuery = useCoinEconomyConfig();
  const updateMutation = useUpdateCoinEconomyConfig();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<CoinEconomyConfigRequest>({
    resolver: zodResolver(coinEconomySchema),
    defaultValues: DEFAULT_VALUES,
  });

  useEffect(() => {
    if (configQuery.data) {
      reset({
        dailyCheckInBase: configQuery.data.dailyCheckInBase,
        milestone7Reward: configQuery.data.milestone7Reward,
        milestone14Reward: configQuery.data.milestone14Reward,
        milestone30Reward: configQuery.data.milestone30Reward,
        vndPerCoin: configQuery.data.vndPerCoin ?? 100,
      });
    }
  }, [configQuery.data, reset]);

  function onSubmit(values: CoinEconomyConfigRequest) {
    updateMutation.mutate(values);
  }

  if (configQuery.isLoading) {
    return <FormSkeleton />;
  }

  if (configQuery.isError) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
        Không thể tải cấu hình nền kinh tế coin. Vui lòng thử lại sau.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      <div className="grid gap-6 md:grid-cols-2">
        {FIELDS.map((field) => (
          <div key={field.name} className="space-y-2">
            <label
              htmlFor={field.name}
              className="block text-sm font-semibold text-gray-800"
            >
              {field.label}
            </label>
            <input
              id={field.name}
              type="number"
              min="1"
              step="1"
              aria-invalid={Boolean(errors[field.name])}
              {...register(field.name, { valueAsNumber: true })}
              className="h-11 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm font-semibold text-gray-900 outline-none transition focus:border-[#007A8A] focus:ring-3 focus:ring-[#007A8A]/10 aria-invalid:border-red-400 aria-invalid:ring-red-100"
            />
            <p className="text-xs leading-5 text-gray-500">
              {field.description}
            </p>
            {errors[field.name]?.message && (
              <p className="text-xs font-semibold text-red-600">
                {errors[field.name]?.message}
              </p>
            )}
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-4 border-t border-gray-100 pt-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-gray-500">
          {configQuery.data?.createdAt
            ? `Cập nhật lần cuối vào: ${formatDate(configQuery.data.createdAt)}`
            : "Chưa có thông tin lần cập nhật gần nhất."}
        </p>

        <button
          type="submit"
          disabled={updateMutation.isPending || !isDirty}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#007A8A] px-5 text-sm font-bold text-white shadow-sm transition hover:bg-[#006673] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {updateMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Lưu Cấu Hình
        </button>
      </div>
    </form>
  );
}
