import { parseBackendDate } from "@/shared/utils/backend-date";
import type { AccountSubscription } from "../types/payment.types";

type SubscriptionStackingWarningProps = {
  activeSubscription: AccountSubscription;
  /** Duration của gói MỚI đang chọn — optional, chỉ hiện ngày kết thúc dự kiến khi có đủ 2 field. */
  newDuration?: number;
  newDurationUnit?: string;
};

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

/** Cộng duration theo unit (chấp nhận "Days"/"DAY"/"Months"/"YEAR"... không phân biệt hoa/thường). Trả null nếu unit không nhận diện được. */
function addDuration(date: Date, amount: number, unit: string): Date | null {
  const normalized = unit.toLowerCase();
  const result = new Date(date);
  if (normalized.includes("day")) {
    result.setDate(result.getDate() + amount);
  } else if (normalized.includes("month")) {
    result.setMonth(result.getMonth() + amount);
  } else if (normalized.includes("year")) {
    result.setFullYear(result.getFullYear() + amount);
  } else {
    return null;
  }
  return result;
}

export function SubscriptionStackingWarning({
  activeSubscription,
  newDuration,
  newDurationUnit,
}: SubscriptionStackingWarningProps) {
  const currentEnd = parseBackendDate(activeSubscription.endTime);
  const projectedEnd =
    newDuration != null && newDurationUnit
      ? addDuration(currentEnd, newDuration, newDurationUnit)
      : null;

  return (
    <div className="rounded-lg border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
      <p className="font-semibold">Bạn đang có gói Premium hoạt động</p>
      <p className="mt-1 text-amber-100/80">
        Gói mới sẽ không kích hoạt ngay mà tự động nối tiếp sau khi gói hiện tại hết hạn vào{" "}
        <span className="font-semibold">{formatDate(currentEnd)}</span>.
      </p>
      {projectedEnd && (
        <p className="mt-1 text-amber-100/80">
          Gói mới dự kiến hết hạn vào{" "}
          <span className="font-semibold">{formatDate(projectedEnd)}</span>.
        </p>
      )}
    </div>
  );
}
