"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { AlertTriangle, Headphones, RotateCcw } from "lucide-react";

const backgroundImageUrl =
  "https://plus.unsplash.com/premium_photo-1724835454003-dbcc05637cf7?q=80&w=2012&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D";

const motionProps = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
} as const;

export default function CheckoutFailedPage() {
  return (
    <main className="relative min-h-screen w-full overflow-y-auto bg-[#0B0B0C] text-white">
      <div
        className="fixed inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url('${backgroundImageUrl}')` }}
      />
      <div className="fixed inset-0 bg-gradient-to-br from-[#0B0B0C]/90 via-[#0B0B0C]/95 to-[#121214]" />
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_18%,rgba(229,9,20,0.18),transparent_30%)]" />

      <section className="relative flex min-h-screen items-start justify-center px-4 py-24 md:py-32">
        <motion.div
          {...motionProps}
          className="w-full max-w-3xl rounded-[2rem] border border-white/5 bg-[#0B0B0C]/85 p-6 text-center shadow-[0_20px_60px_rgba(0,0,0,0.6)] backdrop-blur-3xl sm:p-8 lg:p-10"
        >
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full border border-[#E50914]/35 bg-[#E50914]/10 text-[#FF5A63] shadow-[0_0_60px_rgba(229,9,20,0.4)]">
            <AlertTriangle className="h-14 w-14" />
          </div>

          <p className="mt-8 text-xs font-bold uppercase tracking-[0.24em] text-[#FF5A63]">
            Thanh toán TaleX
          </p>
          <h1 className="mt-3 font-heading text-3xl font-bold tracking-tight text-white md:text-4xl">
            Giao dịch thất bại hoặc hết hạn
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm font-medium leading-relaxed text-white/64">
            Rất tiếc, mã thanh toán của bạn đã hết hạn hoặc có lỗi xảy ra trong
            quá trình đối soát.
          </p>

          <div className="mt-8 rounded-2xl border border-[#E50914]/20 bg-[#E50914]/[0.06] p-4 text-sm font-medium leading-relaxed text-red-100/78">
            Nếu bạn đã chuyển khoản, vui lòng liên hệ hỗ trợ và cung cấp nội
            dung chuyển khoản để TaleX kiểm tra giao dịch.
          </div>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/premium"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#E50914] px-6 text-sm font-bold text-white shadow-[0_0_30px_rgba(229,9,20,0.24)] transition hover:bg-[#F12B34] hover:shadow-[0_0_42px_rgba(229,9,20,0.36)] active:translate-y-px"
            >
              <RotateCcw className="h-4 w-4" />
              Thử thanh toán lại
            </Link>
            <Link
              href="/contact"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-white/12 bg-white/[0.04] px-6 text-sm font-semibold text-white/76 transition hover:border-white/22 hover:bg-white/[0.08] hover:text-white active:translate-y-px"
            >
              <Headphones className="h-4 w-4" />
              Liên hệ hỗ trợ
            </Link>
          </div>
        </motion.div>
      </section>
    </main>
  );
}
