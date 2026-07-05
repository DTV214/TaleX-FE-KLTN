"use client";

import { Suspense } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { CheckCircle, Compass } from "lucide-react";
import { useSearchParams } from "next/navigation";

const backgroundImageUrl =
  "https://plus.unsplash.com/premium_photo-1674718013659-6930c469e641?q=80&w=2532&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D";

const motionProps = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
} as const;

function formatCurrency(amount: string | null) {
  const parsed = amount ? Number(amount) : NaN;
  if (Number.isNaN(parsed)) {
    return "—";
  }
  return `${new Intl.NumberFormat("vi-VN").format(parsed)} VNĐ`;
}

function CheckoutSuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  const amount = searchParams.get("amount");

  const summaryItems = [
    { label: "Mã đơn hàng", value: orderId ?? "—" },
    { label: "Số tiền", value: formatCurrency(amount) },
    { label: "Phương thức", value: "Chuyển khoản SePay" },
    { label: "Gói truy cập", value: "TaleX Premium" },
  ];

  return (
    <main className="relative min-h-screen w-full overflow-y-auto bg-[#0B0B0C] text-white">
      <div
        className="fixed inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url('${backgroundImageUrl}')` }}
      />
      <div className="fixed inset-0 bg-gradient-to-br from-[#0B0B0C]/90 via-[#0B0B0C]/95 to-[#121214]" />
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_18%,rgba(212,175,55,0.18),transparent_30%)]" />

      <section className="relative flex min-h-screen items-start justify-center px-4 py-24 md:py-32">
        <motion.div
          {...motionProps}
          className="w-full max-w-3xl rounded-[2rem] border border-white/5 bg-[#0B0B0C]/85 p-6 text-center shadow-[0_20px_60px_rgba(0,0,0,0.6)] backdrop-blur-3xl sm:p-8 lg:p-10"
        >
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 text-[#D4AF37] shadow-[0_0_60px_rgba(212,175,55,0.4)]">
            <CheckCircle className="h-14 w-14" />
          </div>

          <p className="mt-8 text-xs font-bold uppercase tracking-[0.24em] text-[#D4AF37]">
            TaleX Premium
          </p>
          <h1 className="mt-3 font-heading text-3xl font-bold tracking-tight text-white md:text-4xl">
            Giao dịch thành công
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm font-medium leading-relaxed text-white/64">
            Chào mừng đến với vũ trụ TaleX. Quyền truy cập Premium của bạn đã
            được kích hoạt.
          </p>

          <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-left">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {summaryItems.map((item) => (
                <div
                  key={item.label}
                  className="rounded-2xl border border-white/8 bg-[#121214]/80 p-4"
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/40">
                    {item.label}
                  </p>
                  <p className="mt-2 truncate text-sm font-semibold text-white" title={item.value}>
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <Link
            href="/"
            className="mt-8 inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#D4AF37] px-6 text-sm font-bold text-black shadow-[0_0_30px_rgba(212,175,55,0.22)] transition hover:bg-[#E7C75D] hover:shadow-[0_0_42px_rgba(212,175,55,0.36)] active:translate-y-px"
          >
            <Compass className="h-4 w-4" />
            Bắt đầu khám phá
          </Link>
        </motion.div>
      </section>
    </main>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={null}>
      <CheckoutSuccessContent />
    </Suspense>
  );
}
