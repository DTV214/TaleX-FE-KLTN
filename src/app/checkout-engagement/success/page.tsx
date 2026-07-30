"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowRight, BadgeCheck, Megaphone, ReceiptText } from "lucide-react";
import { Button } from "@/shared/ui/button";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);
}

function EngagementCheckoutSuccessContent() {
  const searchParams = useSearchParams();
  const amount = Number(searchParams.get("amount") ?? 0);
  const orderId = searchParams.get("orderId");

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#070708] px-6 py-10 text-white">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_20%,rgba(212,175,55,0.18),transparent_28%),radial-gradient(circle_at_80%_10%,rgba(82,113,255,0.14),transparent_30%),linear-gradient(135deg,#090909,#111317_55%,#050505)]" />
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-4xl items-center justify-center">
        <section className="w-full rounded-[34px] border border-white/10 bg-[#101011]/90 p-8 text-center shadow-[0_28px_90px_rgba(0,0,0,0.42)] backdrop-blur-xl md:p-12">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-emerald-300/30 bg-emerald-400/10 text-emerald-200">
            <BadgeCheck className="h-10 w-10" />
          </div>
          <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/25 bg-[#D4AF37]/10 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-[#D4AF37]">
            <Megaphone className="h-4 w-4" />
            TaleX Campaign
          </div>
          <h1 className="mt-5 text-4xl font-black tracking-tight md:text-6xl">
            Thanh toán thành công
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base font-semibold leading-7 text-zinc-400 md:text-lg">
            Chiến dịch tăng tương tác của bạn đã được ghi nhận. Bạn có thể quay lại
            Creator Studio để theo dõi trạng thái chiến dịch.
          </p>

          <div className="mx-auto mt-8 grid max-w-2xl gap-4 text-left md:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
              <ReceiptText className="h-5 w-5 text-[#D4AF37]" />
              <p className="mt-4 text-sm font-bold text-zinc-500">Mã đơn hàng</p>
              <p className="mt-1 break-all text-lg font-black text-white">
                {orderId || "--"}
              </p>
            </div>
            <div className="rounded-2xl border border-[#D4AF37]/20 bg-[#D4AF37]/10 p-5">
              <p className="text-sm font-bold text-zinc-400">Tổng thanh toán</p>
              <p className="mt-3 text-3xl font-black text-[#f1dc7a]">
                {formatCurrency(amount)}
              </p>
            </div>
          </div>

          <Button
            asChild
            className="mt-9 h-12 rounded-2xl bg-[#D4AF37] px-8 font-black text-black hover:bg-[#f1d65f]"
          >
            <Link href="/creator-dashboard?view=campaigns">
              Về trang Chiến dịch
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </section>
      </div>
    </main>
  );
}

export default function EngagementCheckoutSuccessPage() {
  return (
    <Suspense fallback={null}>
      <EngagementCheckoutSuccessContent />
    </Suspense>
  );
}
