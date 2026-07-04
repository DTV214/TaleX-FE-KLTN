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
      <div className="relative aspect-square w-full max-w-[280px] rounded-[28px] bg-[#121214] p-4 shadow-[0_26px_70px_rgba(0,0,0,0.42)]">
        <span className="absolute left-0 top-0 h-12 w-12 rounded-tl-[28px] border-l-2 border-t-2 border-[#D4AF37]" />
        <span className="absolute right-0 top-0 h-12 w-12 rounded-tr-[28px] border-r-2 border-t-2 border-[#D4AF37]" />
        <span className="absolute bottom-0 left-0 h-12 w-12 rounded-bl-[28px] border-b-2 border-l-2 border-[#D4AF37]" />
        <span className="absolute bottom-0 right-0 h-12 w-12 rounded-br-[28px] border-b-2 border-r-2 border-[#D4AF37]" />

        <div className="relative h-full w-full overflow-hidden rounded-2xl bg-white p-3">
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
                  <span className="flex h-14 w-14 items-center justify-center rounded-full border border-emerald-300/40 bg-emerald-400/18 text-emerald-200 shadow-[0_0_34px_rgba(52,211,153,0.35)]">
                    <CheckCircle2 className="h-8 w-8" />
                  </span>
                  <span className="font-heading text-sm font-black uppercase tracking-[0.18em]">
                    Thanh toán thành công
                  </span>
                </>
              ) : (
                <>
                  <span className="flex h-14 w-14 items-center justify-center rounded-full border border-[#D4AF37]/40 bg-[#D4AF37]/14 text-[#D4AF37] shadow-[0_0_34px_rgba(212,175,55,0.32)]">
                    <Clock3 className="h-8 w-8" />
                  </span>
                  <span className="font-heading text-sm font-black uppercase tracking-[0.18em]">
                    MÃ ĐÃ HẾT HẠN
                  </span>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="mt-5 flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-5 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
        <Clock3
          className={cn(
            "h-4 w-4",
            isUrgent ? "text-red-400" : "text-[#D4AF37]",
          )}
        />
        <span className="text-xs font-bold uppercase tracking-[0.18em] text-white/42">
          Còn lại
        </span>
        <span
          className={cn(
            "font-heading text-lg font-black tabular-nums text-white",
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
