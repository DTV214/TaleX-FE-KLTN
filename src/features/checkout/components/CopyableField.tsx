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
    <div className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-[#121214] px-3 py-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
      <div className="min-w-0">
        <p className="mb-1 text-xs font-medium text-slate-500">
          {label}
        </p>
        <p
          className={cn(
            "truncate text-sm font-semibold tracking-normal text-slate-100 sm:text-base",
            isHighlight && "text-base text-[#D4AF37] sm:text-lg",
          )}
          title={value}
        >
          {value}
        </p>
      </div>

      <button
        type="button"
        onClick={handleCopy}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#D4AF37]/28 bg-[#D4AF37]/10 text-[#D4AF37] transition hover:border-[#D4AF37]/55 hover:bg-[#D4AF37] hover:text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]/70 active:translate-y-px"
        aria-label={`Copy ${label}`}
      >
        {hasCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      </button>
    </div>
  );
}
