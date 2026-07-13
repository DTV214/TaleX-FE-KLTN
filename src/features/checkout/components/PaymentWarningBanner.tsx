import { Info } from "lucide-react";
import { cn } from "@/shared/utils/utils";

type PaymentWarningBannerProps = {
  message: string;
  type?: "warning" | "info";
};

export function PaymentWarningBanner({
  message,
  type = "warning",
}: PaymentWarningBannerProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-2.5 rounded-xl border px-3.5 py-2.5 shadow-[0_12px_30px_rgba(0,0,0,0.20)] backdrop-blur",
        type === "warning"
          ? "border-[#D4AF37]/25 bg-[#D4AF37]/[0.07] text-[#E8D9A0]"
          : "border-white/10 bg-white/[0.04] text-white/65",
      )}
    >
      <span
        className={cn(
          "flex h-6 w-6 shrink-0 items-center justify-center rounded-full",
          type === "warning" ? "text-[#D4AF37]" : "text-white/50",
        )}
      >
        <Info className="h-3.5 w-3.5" />
      </span>

      <p className="min-w-0 text-sm font-medium leading-5">{message}</p>
    </div>
  );
}
