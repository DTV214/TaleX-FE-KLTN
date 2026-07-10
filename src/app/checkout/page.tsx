"use client";

import { Suspense, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Check, Loader2, ShieldCheck, Ticket, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { CopyableField } from "@/features/checkout/components/CopyableField";
import { PaymentWarningBanner } from "@/features/checkout/components/PaymentWarningBanner";
import { QRCodeDisplay } from "@/features/checkout/components/QRCodeDisplay";
import { useGetSubscription } from "@/features/admin/subscriptions/hooks/use-subscriptions";
import {
  useActiveSubscription,
  useEnsureOrder,
  useOrderStatus,
} from "@/features/payment/api/payment.api";
import { SubscriptionStackingWarning } from "@/features/payment/components/subscription-stacking-warning";
import { getApiErrorMessage } from "@/shared/api/http-client";
import { parseBackendDate } from "@/shared/utils/backend-date";

const SEPAY_BANK_NAME = "Ngân Hàng VietinBank";
const SEPAY_ACCOUNT_NUMBER = "100881945065";
const SEPAY_ACCOUNT_HOLDER = "NGUYEN GIA KHANH";

const backgroundImageUrl =
  "https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=2025&auto=format&fit=crop";

const motionProps = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
} as const;

function formatCurrency(amount: number) {
  return `${new Intl.NumberFormat("vi-VN").format(amount)} VNĐ`;
}

function CheckoutPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const subscriptionId = searchParams.get("subscriptionId") ?? "";

  const [isAgreed, setIsAgreed] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(0);

  const subscriptionQuery = useGetSubscription(subscriptionId);
  const subscription = subscriptionQuery.data?.data;

  const activeSubscriptionQuery = useActiveSubscription();
  const createOrderQuery = useEnsureOrder(subscriptionId || undefined);
  const orderId = createOrderQuery.data?.orderId;
  const orderStatusQuery = useOrderStatus(orderId);
  const order = orderStatusQuery.data ?? createOrderQuery.data;

  useEffect(() => {
    if (!subscriptionId) {
      router.replace("/premium");
    }
  }, [subscriptionId, router]);

  useEffect(() => {
    if (!order?.expiresAt) {
      return;
    }
    const tick = () => {
      const diffMs = parseBackendDate(order.expiresAt).getTime() - Date.now();
      setRemainingSeconds(Math.max(0, Math.floor(diffMs / 1000)));
    };
    tick();
    const intervalId = window.setInterval(tick, 1000);
    return () => window.clearInterval(intervalId);
  }, [order?.expiresAt]);

  useEffect(() => {
    if (order?.status === "COMPLETED") {
      const redirectTimerId = window.setTimeout(() => {
        router.push(
          `/checkout/success?orderId=${order.orderId}&amount=${order.totalAmount}`,
        );
      }, 1200);
      return () => window.clearTimeout(redirectTimerId);
    }

    if (order?.status === "OUT_OF_TIME" || order?.status === "CANCELLED") {
      const redirectTimerId = window.setTimeout(() => {
        router.push("/checkout/failed");
      }, 1200);
      return () => window.clearTimeout(redirectTimerId);
    }
  }, [order?.status, order?.orderId, order?.totalAmount, router]);

  const displayStatus: "PENDING" | "SUCCESS" | "OUT_OF_TIME" =
    order?.status === "COMPLETED"
      ? "SUCCESS"
      : order?.status === "OUT_OF_TIME" || order?.status === "CANCELLED"
        ? "OUT_OF_TIME"
        : "PENDING";

  const isPreparing = !order || subscriptionQuery.isLoading;

  return (
    <main className="relative min-h-screen w-full overflow-y-auto bg-[#0B0B0C] text-white">
      <div
        className="fixed inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url('${backgroundImageUrl}')` }}
      />
      <div className="fixed inset-0 bg-gradient-to-br from-[#0B0B0C]/90 via-[#0B0B0C]/95 to-[#121214]" />
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_18%_10%,rgba(212,175,55,0.14),transparent_28%),radial-gradient(circle_at_82%_18%,rgba(255,255,255,0.07),transparent_24%)]" />
      <div className="fixed inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#D4AF37]/45 to-transparent" />

      <div className="relative flex min-h-screen flex-col items-center justify-start px-4 py-24 md:py-32">
        <section className="mx-auto w-full max-w-6xl rounded-[2rem] border border-white/5 bg-[#0B0B0C]/85 shadow-[0_20px_60px_rgba(0,0,0,0.6)] backdrop-blur-3xl">
          <div className="grid grid-cols-1 gap-8 p-6 lg:grid-cols-12 lg:gap-12 lg:p-10">
            <motion.div {...motionProps} className="space-y-8 lg:col-span-7">
              <header>
                <p className="mb-3 text-xs font-bold uppercase tracking-[0.24em] text-[#D4AF37]">
                  Cổng thanh toán TaleX
                </p>
                <h1 className="font-heading text-3xl font-bold tracking-tight text-white md:text-4xl">
                  Thanh Toán An Toàn
                </h1>
                <p className="mt-4 max-w-2xl text-sm font-medium leading-relaxed text-white/60">
                  Hoàn tất thanh toán để mở khóa trải nghiệm điện ảnh vô tận.
                </p>
              </header>

              <motion.div
                {...motionProps}
                transition={{ ...motionProps.transition, delay: 0.08 }}
                className="rounded-2xl border border-white/8 bg-white/[0.025] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.035)]"
              >
                <div className="flex items-center gap-4">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[#D4AF37]/30 bg-[#D4AF37]/10 text-[#D4AF37]">
                    <Ticket className="h-6 w-6" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/40">
                      Tóm tắt đơn hàng
                    </p>
                    <p className="mt-1 truncate text-sm font-semibold text-white sm:text-base">
                      {subscription
                        ? `Gói Dịch Vụ: TaleX Premium ${subscription.tier} (${subscription.duration} ${subscription.durationUnit})`
                        : "Đang tải thông tin gói..."}
                    </p>
                  </div>
                </div>
              </motion.div>

              {activeSubscriptionQuery.data && (
                <motion.div {...motionProps} transition={{ ...motionProps.transition, delay: 0.1 }}>
                  <SubscriptionStackingWarning activeSubscription={activeSubscriptionQuery.data} />
                </motion.div>
              )}

              <motion.div
                {...motionProps}
                transition={{ ...motionProps.transition, delay: 0.14 }}
              >
                <PaymentWarningBanner message="Vui lòng chuyển khoản đúng nội dung để hệ thống tự động xử lý trong vài giây." />
              </motion.div>

              {createOrderQuery.isError && (
                <PaymentWarningBanner
                  type="info"
                  message={getApiErrorMessage(createOrderQuery.error)}
                />
              )}

              <motion.section
                {...motionProps}
                transition={{ ...motionProps.transition, delay: 0.2 }}
                className="rounded-2xl border border-white/8 bg-[#121214]/88 p-5 shadow-[0_18px_46px_rgba(0,0,0,0.38)] sm:p-6"
              >
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/40">
                    Số tiền thanh toán
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-3">
                    <p className="font-heading text-4xl font-bold tracking-tight text-[#D4AF37] md:text-5xl">
                      {order ? formatCurrency(order.totalAmount) : "—"}
                    </p>
                    <span className="inline-flex h-9 items-center gap-2 rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-3 text-xs font-semibold uppercase tracking-[0.12em] text-[#F4E7B7]">
                      <ShieldCheck className="h-4 w-4 text-[#D4AF37]" />
                      Bảo vệ bởi SePay
                    </span>
                  </div>
                </div>
              </motion.section>

              <motion.section
                {...motionProps}
                transition={{ ...motionProps.transition, delay: 0.26 }}
              >
                <div className="mb-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#D4AF37]">
                    Thông tin chuyển khoản
                  </p>
                  <p className="mt-1 text-sm font-medium leading-relaxed text-white/60">
                    Copy chính xác từng trường trước khi xác nhận thanh toán.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <CopyableField label="Tên tài khoản" value={SEPAY_ACCOUNT_HOLDER} />
                  <CopyableField label="Tên ngân hàng" value={SEPAY_BANK_NAME} />
                  <CopyableField label="Số tài khoản" value={SEPAY_ACCOUNT_NUMBER} />
                  <div>
                    <CopyableField
                      label="Nội dung"
                      value={order?.paymentCode ?? "—"}
                      isHighlight
                    />
                    <p className="mt-2 text-xs font-bold text-red-300">
                      * Bắt buộc nhập đúng nội dung
                    </p>
                  </div>
                </div>
              </motion.section>

              <motion.button
                {...motionProps}
                transition={{ ...motionProps.transition, delay: 0.32 }}
                type="button"
                onClick={() => setIsAgreed((current) => !current)}
                className="flex w-full items-start gap-3 rounded-2xl border border-white/8 bg-white/[0.03] p-4 text-left transition hover:border-[#D4AF37]/30 hover:bg-[#D4AF37]/[0.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]/60"
                aria-pressed={isAgreed}
              >
                <span
                  className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border transition ${
                    isAgreed
                      ? "border-[#D4AF37] bg-[#D4AF37] text-black"
                      : "border-white/20 bg-white/[0.04] text-transparent"
                  }`}
                >
                  <Check className="h-4 w-4" />
                </span>
                <span className="text-sm font-medium leading-relaxed text-white/68">
                  Tôi đồng ý với Điều khoản dịch vụ và Chính sách bảo mật của
                  TaleX.
                </span>
              </motion.button>
            </motion.div>

            <motion.aside
              {...motionProps}
              transition={{ ...motionProps.transition, delay: 0.18 }}
              className="lg:col-span-5"
            >
              <div className="sticky top-24 rounded-[28px] border border-white/8 bg-[#121214]/92 p-5 shadow-[0_20px_60px_rgba(0,0,0,0.48)] sm:p-7">
                <div className="mb-6 text-center">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#D4AF37]">
                    SePay VietQR
                  </p>
                  <h2 className="mt-2 font-heading text-2xl font-bold tracking-tight text-white">
                    Quét mã để thanh toán ngay
                  </h2>
                </div>

                {createOrderQuery.isError ? (
                  <div className="flex aspect-square w-full max-w-[280px] mx-auto flex-col items-center justify-center gap-3 rounded-[28px] bg-[#121214] p-4 text-center text-white/60">
                    <X className="h-8 w-8 text-red-400" />
                    <span className="text-sm font-medium">
                      {getApiErrorMessage(createOrderQuery.error)}
                    </span>
                    <button
                      type="button"
                      onClick={() => createOrderQuery.refetch()}
                      className="mt-2 rounded-lg border border-[#D4AF37]/40 bg-[#D4AF37]/10 px-4 py-2 text-xs font-semibold text-[#D4AF37] transition hover:bg-[#D4AF37]/20"
                    >
                      Thử tạo lại đơn hàng
                    </button>
                  </div>
                ) : isPreparing || !order.qrUrl ? (
                  <div className="flex aspect-square w-full max-w-[280px] mx-auto flex-col items-center justify-center gap-3 rounded-[28px] bg-[#121214] p-4 text-white/60">
                    <Loader2 className="h-8 w-8 animate-spin text-[#D4AF37]" />
                    <span className="text-sm font-medium">Đang tạo đơn hàng...</span>
                  </div>
                ) : (
                  <QRCodeDisplay
                    qrUrl={order.qrUrl}
                    timeLeft={remainingSeconds}
                    status={displayStatus}
                  />
                )}

                <div className="mx-auto mt-6 max-w-sm text-center">
                  <p className="text-sm font-semibold text-white">
                    Quét mã để thanh toán ngay
                  </p>
                  <p className="mt-2 text-sm font-medium leading-relaxed text-white/60">
                    Mở ứng dụng ngân hàng và quét mã QR để tự động điền thông
                    tin.
                  </p>
                </div>

                <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="flex items-center justify-center gap-2 rounded-2xl border border-white/8 bg-white/[0.04] px-3 py-3 text-xs font-semibold text-white/68">
                    <ShieldCheck className="h-4 w-4 text-[#D4AF37]" />
                    Mã hóa SSL 256-bit
                  </div>
                  <div className="flex items-center justify-center gap-2 rounded-2xl border border-white/8 bg-white/[0.04] px-3 py-3 text-xs font-semibold text-white/68">
                    <ShieldCheck className="h-4 w-4 text-[#D4AF37]" />
                    Thanh toán an toàn 100%
                  </div>
                </div>

                <div className="mt-7 grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
                  <button
                    type="button"
                    onClick={() => router.push("/premium")}
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-white/12 bg-white/[0.04] px-5 text-sm font-semibold text-white/72 transition hover:border-white/22 hover:bg-white/[0.08] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/25 active:translate-y-px"
                  >
                    <X className="h-4 w-4" />
                    Hủy giao dịch
                  </button>

                  <div className="inline-flex h-12 items-center justify-center rounded-xl border border-[#D4AF37]/25 bg-[#D4AF37]/10 px-4 text-xs font-semibold uppercase tracking-[0.14em] text-[#F4E7B7]">
                    {displayStatus === "OUT_OF_TIME"
                      ? "Đã hết hạn"
                      : displayStatus === "SUCCESS"
                        ? "Đã thanh toán"
                        : "Đang chờ thanh toán"}
                  </div>
                </div>
              </div>
            </motion.aside>
          </div>
        </section>
      </div>
    </main>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={null}>
      <CheckoutPageContent />
    </Suspense>
  );
}
