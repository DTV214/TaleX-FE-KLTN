"use client";

import { motion } from "framer-motion";
import { CreditCard, Landmark } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/shared/utils/utils";

export type PaymentMethod = "SEPAY" | "PAYOS";

type PaymentMethodTabsProps = {
  activeMethod: PaymentMethod;
  onChange: (method: PaymentMethod) => void;
};

const methods: Array<{
  value: PaymentMethod;
  label: string;
  icon: LucideIcon;
}> = [
  {
    value: "SEPAY",
    label: "Chuyển khoản SePay",
    icon: Landmark,
  },
  {
    value: "PAYOS",
    label: "Cổng PayOS",
    icon: CreditCard,
  },
];

export function PaymentMethodTabs({
  activeMethod,
  onChange,
}: PaymentMethodTabsProps) {
  return (
    <div className="grid grid-cols-2 gap-1 rounded-2xl border border-white/10 bg-[#121214] p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_18px_48px_rgba(0,0,0,0.32)]">
      {methods.map((method) => {
        const Icon = method.icon;
        const isActive = activeMethod === method.value;

        return (
          <button
            key={method.value}
            type="button"
            onClick={() => onChange(method.value)}
            aria-pressed={isActive}
            className={cn(
              "relative flex min-h-12 items-center justify-center gap-2 overflow-hidden rounded-xl px-3 text-sm font-black transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]/60",
              isActive
                ? "border border-white/12 text-white shadow-[0_12px_26px_rgba(0,0,0,0.34)]"
                : "border border-transparent bg-transparent text-[#7C766B] hover:bg-white/[0.04] hover:text-white/70",
            )}
          >
            {isActive && (
              <motion.span
                layoutId="payment-method-active-pill"
                className="absolute inset-0 rounded-xl bg-[#252830]"
                transition={{ type: "spring", stiffness: 360, damping: 32 }}
              />
            )}
            <Icon className="relative z-10 h-4 w-4 shrink-0" />
            <span className="relative z-10 truncate">{method.label}</span>
          </button>
        );
      })}
    </div>
  );
}
