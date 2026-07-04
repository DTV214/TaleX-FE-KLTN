"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { cn } from "@/shared/utils/utils";

type CopyableFieldProps = {
  label: string;
  value: string;
  isHighlight?: boolean;
};

export function CopyableField({
  label,
  value,
  isHighlight = false,
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
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-[#121214] px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
      <div className="min-w-0">
        <p className="mb-1 text-[11px] font-black uppercase tracking-[0.2em] text-white/38">
          {label}
        </p>
        <p
          className={cn(
            "truncate font-heading text-base font-black tracking-normal text-white sm:text-lg",
            isHighlight && "text-xl text-[#D4AF37] sm:text-2xl",
          )}
          title={value}
        >
          {value}
        </p>
      </div>

      <button
        type="button"
        onClick={handleCopy}
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#D4AF37]/28 bg-[#D4AF37]/10 text-[#D4AF37] transition hover:border-[#D4AF37]/55 hover:bg-[#D4AF37] hover:text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]/70 active:translate-y-px"
        aria-label={`Copy ${label}`}
      >
        {hasCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      </button>
    </div>
  );
}
