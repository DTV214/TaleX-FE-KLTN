import { parseBackendDate } from "@/shared/utils/backend-date";
import type { AccountSubscription } from "../types/payment.types";

type SubscriptionStackingWarningProps = {
  activeSubscription: AccountSubscription;
};

function formatDate(dateIso: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(parseBackendDate(dateIso));
}

export function SubscriptionStackingWarning({
  activeSubscription,
}: SubscriptionStackingWarningProps) {
  return (
    <div className="rounded-lg border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
      <p className="font-semibold">Bạn đang có gói Premium hoạt động</p>
      <p className="mt-1 text-amber-100/80">
        Gói mới sẽ không kích hoạt ngay mà tự động nối tiếp sau khi gói hiện tại hết hạn vào{" "}
        <span className="font-semibold">{formatDate(activeSubscription.endTime)}</span>.
      </p>
    </div>
  );
}
