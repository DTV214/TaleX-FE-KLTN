"use client";

import { toast } from "sonner";
import {
  SingletonConfigDashboard,
  type SingletonConfigField,
} from "@/features/admin/components/singleton-config-dashboard";
import {
  useSettlementConfig,
  useUpdateSettlementConfig,
} from "../hooks/use-settlement-config";
import type {
  SettlementConfig,
  SettlementConfigRequest,
} from "../types/settlement-config.types";

const SETTLEMENT_CONFIG_FIELDS: Array<SingletonConfigField<SettlementConfig>> = [
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

function getErrorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : "Không thể lưu cấu hình quyết toán.";
}

export function SettlementConfigDashboard() {
  const configQuery = useSettlementConfig();
  const updateMutation = useUpdateSettlementConfig();
  const config = configQuery.data ?? null;

  async function handleSubmit(payload: Record<string, number>) {
    const request: SettlementConfigRequest = {
      minBalanceThreshold: payload.minBalanceThreshold,
      minPayoutThreshold: payload.minPayoutThreshold,
    };

    try {
      await updateMutation.mutateAsync(request);
      toast.success("Đã cập nhật cấu hình quyết toán thành công.");
      return true;
    } catch (error) {
      toast.error(getErrorMessage(error));
      return false;
    }
  }

  return (
    <SingletonConfigDashboard
      badge="Quyết toán"
      title="Cấu Hình Quyết Toán"
      description="Quản lý ngưỡng số dư tối thiểu và hạn mức rút tiền tối thiểu áp dụng cho Creator khi quyết toán."
      sectionLabel="Cấu hình quyết toán"
      activeTitle="Config quyết toán đang hoạt động"
      emptyTitle="Chưa có config quyết toán"
      emptyDescription="Cập nhật cấu hình để hệ thống áp dụng các ngưỡng quyết toán."
      updatedAt={config?.updatedAt}
      config={config}
      fields={SETTLEMENT_CONFIG_FIELDS}
      isLoading={configQuery.isLoading}
      isFetching={configQuery.isFetching}
      isSubmitting={updateMutation.isPending}
      onRefresh={() => configQuery.refetch()}
      onSubmit={handleSubmit}
    />
  );
}
