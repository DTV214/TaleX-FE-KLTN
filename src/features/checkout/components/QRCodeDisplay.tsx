import Image from "next/image";
import { CheckCircle2, Clock3 } from "lucide-react";
import { cn } from "@/shared/utils/utils";

type PaymentStatus = "PENDING" | "SUCCESS" | "OUT_OF_TIME";

type QRCodeDisplayProps = {
  qrUrl: string;
  timeLeft: number;
  status: PaymentStatus;
};

function formatTime(totalSeconds: number) {
  const safeSeconds = Math.max(0, totalSeconds);
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function QRCodeDisplay({
  qrUrl,
  timeLeft,
  status,
}: QRCodeDisplayProps) {
  const isUrgent = timeLeft < 60 && status === "PENDING";
  const showOverlay = status === "OUT_OF_TIME" || status === "SUCCESS";

  return (
    <div className="flex w-full flex-col items-center">
      <div className="relative aspect-square w-full max-w-[200px] rounded-2xl bg-[#121214] p-3 shadow-[0_16px_38px_rgba(0,0,0,0.3)]">
        <span className="absolute left-0 top-0 h-9 w-9 rounded-tl-2xl border-l-2 border-t-2 border-[#D4AF37]" />
        <span className="absolute right-0 top-0 h-9 w-9 rounded-tr-2xl border-r-2 border-t-2 border-[#D4AF37]" />
        <span className="absolute bottom-0 left-0 h-9 w-9 rounded-bl-2xl border-b-2 border-l-2 border-[#D4AF37]" />
        <span className="absolute bottom-0 right-0 h-9 w-9 rounded-br-2xl border-b-2 border-r-2 border-[#D4AF37]" />

        <div className="relative h-full w-full overflow-hidden rounded-xl bg-white p-2.5">
          <Image
            src={qrUrl}
            alt="Mã QR thanh toán"
            width={240}
            height={240}
            unoptimized
            className="h-full w-full object-contain"
          />

          {showOverlay && (
            <div
              className={cn(
                "absolute inset-0 flex flex-col items-center justify-center gap-3 px-5 text-center backdrop-blur-md",
                status === "OUT_OF_TIME"
                  ? "bg-black/58 text-white"
                  : "bg-emerald-950/62 text-emerald-50",
              )}
            >
              {status === "SUCCESS" ? (
                <>
                  <span className="flex h-11 w-11 items-center justify-center rounded-full border border-emerald-300/40 bg-emerald-400/18 text-emerald-200 shadow-[0_0_28px_rgba(52,211,153,0.3)]">
                    <CheckCircle2 className="h-6 w-6" />
                  </span>
                  <span className="text-sm font-semibold">
                    Thanh toán thành công
                  </span>
                </>
              ) : (
                <>
                  <span className="flex h-11 w-11 items-center justify-center rounded-full border border-[#D4AF37]/40 bg-[#D4AF37]/14 text-[#D4AF37] shadow-[0_0_28px_rgba(212,175,55,0.28)]">
                    <Clock3 className="h-6 w-6" />
                  </span>
                  <span className="text-sm font-semibold">
                    MÃ ĐÃ HẾT HẠN
                  </span>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-4 py-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
        <Clock3
          className={cn(
            "h-4 w-4",
            isUrgent ? "text-red-400" : "text-[#D4AF37]",
          )}
        />
        <span className="text-xs font-medium text-slate-500">
          Còn lại
        </span>
        <span
          className={cn(
            "text-base font-semibold tabular-nums text-slate-100",
            isUrgent && "text-red-400",
            status === "OUT_OF_TIME" && "text-red-400",
            status === "SUCCESS" && "text-emerald-300",
          )}
        >
          {formatTime(timeLeft)}
        </span>
      </div>
    </div>
  );
}
