"use client";

type AdFormat = "auto" | "horizontal" | "rectangle";

export type AdSlotProps = {
  slotId?: string;
  adData?: any;
  format?: AdFormat;
  className?: string;
  objectFit?: "cover" | "contain";
};

export function AdSlot(_props: AdSlotProps) {
  return null;
}
