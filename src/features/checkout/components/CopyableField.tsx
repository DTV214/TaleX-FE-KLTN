"use client";

import Image from "next/image";
import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { cn } from "@/shared/utils/utils";

type CopyableFieldProps = {
  label: string;
  value: string;
  isHighlight?: boolean;
  logoUrl?: string;
};

export function CopyableField({
  label,
  value,
  isHighlight = false,
  logoUrl,
}: CopyableFieldProps) {
  const [hasCopied, setHasCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value);
      setHasCopied(true);
      toast.success(`Đã copy ${label.toLowerCase()}`);
      window.setTimeout(() => setHasCopied(false), 1400);
    } catch {
      toast.error("Không thể copy. Vui lòng thử lại.");
    }
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-white/8 bg-[#121214] px-3.5 py-2.5">
      <div className="flex min-w-0 items-center gap-2.5">
        {logoUrl && (
          <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white p-1">
            <Image
              src={logoUrl}
              alt={value}
              width={28}
              height={28}
              unoptimized
              className="h-full w-full object-contain"
            />
          </span>
        )}
        <div className="min-w-0">
          <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/35">
            {label}
          </p>
          <p
            className={cn(
              "truncate text-sm font-semibold text-white/90",
              isHighlight && "text-base font-bold text-[#D4AF37]",
            )}
            title={value}
          >
            {value}
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={handleCopy}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 text-white/50 transition hover:border-[#D4AF37]/45 hover:text-[#D4AF37] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]/60 active:translate-y-px"
        aria-label={`Copy ${label}`}
      >
        {hasCopied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      </button>
    </div>
  );
}
