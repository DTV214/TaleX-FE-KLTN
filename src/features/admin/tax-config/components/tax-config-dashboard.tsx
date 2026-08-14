"use client";

import { toast } from "sonner";
import {
  SingletonConfigDashboard,
  type SingletonConfigField,
} from "@/features/admin/components/singleton-config-dashboard";
import {
  useCreateTaxConfig,
  useTaxConfig,
  useUpdateTaxConfig,
} from "../hooks/use-tax-config";
import type { TaxConfig, TaxConfigRequest } from "../types/tax-config.types";

const TAX_CONFIG_FIELDS: Array<SingletonConfigField<TaxConfig>> = [
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

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Không thể lưu cấu hình thuế.";
}

export function TaxConfigDashboard() {
  const configQuery = useTaxConfig();
  const createMutation = useCreateTaxConfig();
  const updateMutation = useUpdateTaxConfig();
  const config = configQuery.data ?? null;

  async function handleSubmit(payload: Record<string, number>) {
    const request: TaxConfigRequest = {
      vat: payload.vat,
      pit: payload.pit,
      minPitAmount: payload.minPitAmount,
    };
    const mutation = config ? updateMutation : createMutation;

    try {
      await mutation.mutateAsync(request);
      toast.success(
        config ? "Đã cập nhật cấu hình thuế." : "Đã tạo mới cấu hình thuế.",
      );
      return true;
    } catch (error) {
      toast.error(getErrorMessage(error));
      return false;
    }
  }

  return (
    <SingletonConfigDashboard
      badge="Thuế"
      title="Cấu Hình Thuế"
      description="Quản lý cấu hình VAT, PIT và ngưỡng tối thiểu áp dụng cho các nghiệp vụ thanh toán, đối soát."
      sectionLabel="Cấu hình thuế"
      activeTitle="Config thuế đang hoạt động"
      emptyTitle="Chưa có config thuế"
      emptyDescription="Tạo config đầu tiên để hệ thống có tham số VAT/PIT mặc định."
      updatedAt={config?.updatedAt}
      config={config}
      fields={TAX_CONFIG_FIELDS}
      isLoading={configQuery.isLoading}
      isFetching={configQuery.isFetching}
      isSubmitting={createMutation.isPending || updateMutation.isPending}
      onRefresh={() => configQuery.refetch()}
      onSubmit={handleSubmit}
    />
  );
}
