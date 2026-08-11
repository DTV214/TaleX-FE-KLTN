"use client";

import { toast } from "sonner";
import {
  SingletonConfigDashboard,
  type SingletonConfigField,
} from "@/features/admin/components/singleton-config-dashboard";
import {
  useCreateCreatorConfig,
  useCreatorConfig,
  useUpdateCreatorConfig,
} from "../hooks/use-creator-config";
import type {
  CreatorConfig,
  CreatorConfigRequest,
} from "../types/creator-config.types";

const CREATOR_CONFIG_FIELDS: Array<SingletonConfigField<CreatorConfig>> = [
  {
    key: "basePremiumShare",
    label: "Chia sẻ Premium",
    help: "Tỷ lệ doanh thu cơ bản creator nhận từ nguồn Premium. Ví dụ 0.7 tương ứng 70%.",
    defaultValue: 0.7,
    min: 0,
    step: 0.01,
    format: (value) => `${(value * 100).toLocaleString("vi-VN")}%`,
  },
  {
    key: "baseUnlockShare",
    label: "Chia sẻ mở khóa",
    help: "Tỷ lệ doanh thu cơ bản creator nhận từ giao dịch mở khóa nội dung riêng lẻ.",
    defaultValue: 0.7,
    min: 0,
    step: 0.01,
    format: (value) => `${(value * 100).toLocaleString("vi-VN")}%`,
  },
];

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Không thể lưu Creator Config.";
}

export function CreatorConfigDashboard() {
  const configQuery = useCreatorConfig();
  const createMutation = useCreateCreatorConfig();
  const updateMutation = useUpdateCreatorConfig();
  const config = configQuery.data ?? null;

  async function handleSubmit(payload: Record<string, number>) {
    const request: CreatorConfigRequest = {
      basePremiumShare: payload.basePremiumShare,
      baseUnlockShare: payload.baseUnlockShare,
    };
    const mutation = config ? updateMutation : createMutation;

    try {
      await mutation.mutateAsync(request);
      toast.success(
        config ? "Đã cập nhật Creator Config." : "Đã tạo mới Creator Config.",
      );
      return true;
    } catch (error) {
      toast.error(getErrorMessage(error));
      return false;
    }
  }

  return (
    <SingletonConfigDashboard
      badge="Creator Config"
      title="Creator Config"
      description="Quản lý tỷ lệ chia sẻ doanh thu cơ bản cho creator từ Premium và giao dịch mở khóa nội dung."
      sectionLabel="Cấu hình doanh thu"
      activeTitle="Config đang hoạt động"
      emptyTitle="Chưa có Creator Config"
      emptyDescription="Tạo config đầu tiên để hệ thống có tỷ lệ chia sẻ doanh thu mặc định cho creator."
      updatedAt={config?.updatedAt}
      config={config}
      fields={CREATOR_CONFIG_FIELDS}
      isLoading={configQuery.isLoading}
      isFetching={configQuery.isFetching}
      isSubmitting={createMutation.isPending || updateMutation.isPending}
      onRefresh={() => configQuery.refetch()}
      onSubmit={handleSubmit}
    />
  );
}
