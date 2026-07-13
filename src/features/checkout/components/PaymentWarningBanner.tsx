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
        "flex items-start gap-3 rounded-xl border px-3 py-2.5 shadow-[0_12px_30px_rgba(0,0,0,0.24)] backdrop-blur",
        type === "warning"
          ? "border-[#D4AF37]/30 bg-[#D4AF37]/10 text-[#F4E7B7]"
          : "border-white/12 bg-white/[0.06] text-white/78",
      )}
    >
      <span
        className={cn(
          "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border",
          type === "warning"
            ? "border-[#D4AF37]/35 bg-[#D4AF37]/15 text-[#D4AF37]"
            : "border-white/12 bg-white/[0.08] text-white/70",
        )}
      >
        <Info className="h-4 w-4" />
      </span>

      <p className="min-w-0 text-sm font-medium leading-5">{message}</p>
    </div>
  );
}
