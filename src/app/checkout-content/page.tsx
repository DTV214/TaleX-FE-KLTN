"use client";

import { Suspense, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Loader2, ShieldCheck, Ticket, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { CopyableField } from "@/features/checkout/components/CopyableField";
import { PaymentWarningBanner } from "@/features/checkout/components/PaymentWarningBanner";
import { QRCodeDisplay } from "@/features/checkout/components/QRCodeDisplay";
import { CoinPaymentSelector } from "@/features/checkout-content/components/coin-payment-selector";
import { useEnsureContentOrder } from "@/features/checkout-content/api/content-order.api";
import { useCoinWallet } from "@/features/coin/hooks/useCoinQueries";
import { useOrderStatus } from "@/features/payment/api/payment.api";
import type { ContentOrderItemType } from "@/features/payment/types/payment.types";
import { getApiErrorMessage } from "@/shared/api/http-client";
import { parseBackendDate } from "@/shared/utils/backend-date";

const SEPAY_BANK_NAME = "Ngân Hàng VietinBank";
const SEPAY_ACCOUNT_NUMBER = "100881945065";
const SEPAY_ACCOUNT_HOLDER = "NGUYEN GIA KHANH";
const COIN_DEBOUNCE_MS = 400;

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

function isValidItemType(value: string | null): value is ContentOrderItemType {
  return value === "EPISODE" || value === "COMBO";
}

function CheckoutContentPageBody() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const itemId = searchParams.get("itemId") ?? "";
  const rawItemType = searchParams.get("itemType");
  const itemType: ContentOrderItemType = isValidItemType(rawItemType) ? rawItemType : "EPISODE";
  const title = searchParams.get("title") ?? "Nội dung TaleX";

  const [coinInput, setCoinInput] = useState(0);
  const [debouncedCoin, setDebouncedCoin] = useState(0);
  const [remainingSeconds, setRemainingSeconds] = useState(0);

  const walletQuery = useCoinWallet();
  const createOrderQuery = useEnsureContentOrder(itemId || undefined, itemType, debouncedCoin);
  const orderId = createOrderQuery.data?.orderId;
  const orderStatusQuery = useOrderStatus(orderId);
  const order = orderStatusQuery.data ?? createOrderQuery.data;

  useEffect(() => {
    if (!itemId) {
      router.replace("/");
    }
  }, [itemId, router]);

  useEffect(() => {
    const timerId = window.setTimeout(() => setDebouncedCoin(coinInput), COIN_DEBOUNCE_MS);
    return () => window.clearTimeout(timerId);
  }, [coinInput]);

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

  const isPreparing = !order || createOrderQuery.isFetching;
  const isCompleted = order?.status === "COMPLETED";
  const isExpired = order?.status === "OUT_OF_TIME" || order?.status === "CANCELLED";
  const needsOnlinePayment = Boolean(order?.qrUrl) && !isCompleted && !isExpired;

  const displayStatus: "PENDING" | "SUCCESS" | "OUT_OF_TIME" = isCompleted
    ? "SUCCESS"
    : isExpired
      ? "OUT_OF_TIME"
      : "PENDING";

  return (
    <main className="relative min-h-screen w-full overflow-y-auto bg-[#0B0B0C] text-white">
      <div
        className="fixed inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url('${backgroundImageUrl}')` }}
      />
      <div className="fixed inset-0 bg-gradient-to-br from-[#0B0B0C]/90 via-[#0B0B0C]/95 to-[#121214]" />
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_18%_10%,rgba(212,175,55,0.14),transparent_28%),radial-gradient(circle_at_82%_18%,rgba(255,255,255,0.07),transparent_24%)]" />

      <div className="relative flex min-h-screen flex-col items-center justify-start px-4 py-24 md:py-32">
        <section className="mx-auto w-full max-w-6xl rounded-[2rem] border border-white/5 bg-[#0B0B0C]/85 shadow-[0_20px_60px_rgba(0,0,0,0.6)] backdrop-blur-3xl">
          <div className="grid grid-cols-1 gap-8 p-6 lg:grid-cols-12 lg:gap-12 lg:p-10">
            <motion.div {...motionProps} className="space-y-6 lg:col-span-7">
              <header>
                <p className="mb-3 text-xs font-bold uppercase tracking-[0.24em] text-[#D4AF37]">
                  Cổng thanh toán TaleX
                </p>
                <h1 className="font-heading text-3xl font-bold tracking-tight text-white md:text-4xl">
                  Mở Khóa Nội Dung
                </h1>
              </header>

              <div className="rounded-2xl border border-white/8 bg-white/[0.025] p-4">
                <div className="flex items-center gap-4">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[#D4AF37]/30 bg-[#D4AF37]/10 text-[#D4AF37]">
                    <Ticket className="h-6 w-6" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/40">
                      Tóm tắt đơn hàng
                    </p>
                    <p className="mt-1 truncate text-sm font-semibold text-white sm:text-base">
                      {title}
                    </p>
                  </div>
                </div>
              </div>

              {createOrderQuery.isError && (
                <PaymentWarningBanner
                  type="info"
                  message={getApiErrorMessage(createOrderQuery.error)}
                />
              )}

              {!walletQuery.isLoading && !createOrderQuery.isError && (
                <CoinPaymentSelector
                  walletBalance={walletQuery.data?.balance ?? 0}
                  value={coinInput}
                  onChange={setCoinInput}
                  coinAmountUsed={order?.coinAmountUsed ?? 0}
                  isLoading={createOrderQuery.isFetching}
                />
              )}

              {order && (
                <div className="rounded-2xl border border-white/8 bg-[#121214]/88 p-5 shadow-[0_18px_46px_rgba(0,0,0,0.38)] sm:p-6">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/40">
                    Số tiền cần thanh toán
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-3">
                    <p className="font-heading text-4xl font-bold tracking-tight text-[#D4AF37] md:text-5xl">
                      {formatCurrency(order.fiatAmount)}
                    </p>
                    {order.coinAmountUsed > 0 && (
                      <span className="text-xs font-medium text-white/45">
                        (đã giảm {order.coinAmountUsed} Coin, tổng gốc{" "}
                        {formatCurrency(order.totalAmount)})
                      </span>
                    )}
                  </div>
                </div>
              )}

              {needsOnlinePayment && (
                <>
                  <PaymentWarningBanner message="Vui lòng chuyển khoản đúng nội dung để hệ thống tự động xử lý trong vài giây." />
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
                </>
              )}
            </motion.div>

            <motion.aside
              {...motionProps}
              transition={{ ...motionProps.transition, delay: 0.18 }}
              className="lg:col-span-5"
            >
              <div className="sticky top-24 rounded-[28px] border border-white/8 bg-[#121214]/92 p-5 shadow-[0_20px_60px_rgba(0,0,0,0.48)] sm:p-7">
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
                ) : isCompleted ? (
                  <div className="flex aspect-square w-full max-w-[280px] mx-auto flex-col items-center justify-center gap-3 rounded-[28px] bg-emerald-950/40 p-4 text-center">
                    <CheckCircle2 className="h-12 w-12 text-emerald-300" />
                    <span className="text-sm font-bold text-emerald-100">
                      Mở khóa nội dung thành công!
                    </span>
                    <button
                      type="button"
                      onClick={() => router.push("/")}
                      className="mt-2 rounded-lg bg-[#D4AF37] px-4 py-2 text-xs font-bold text-black transition hover:bg-[#E5C158]"
                    >
                      Xem ngay
                    </button>
                  </div>
                ) : isPreparing ? (
                  <div className="flex aspect-square w-full max-w-[280px] mx-auto flex-col items-center justify-center gap-3 rounded-[28px] bg-[#121214] p-4 text-white/60">
                    <Loader2 className="h-8 w-8 animate-spin text-[#D4AF37]" />
                    <span className="text-sm font-medium">Đang tạo đơn hàng...</span>
                  </div>
                ) : order?.qrUrl ? (
                  <QRCodeDisplay
                    qrUrl={order.qrUrl}
                    timeLeft={remainingSeconds}
                    status={displayStatus}
                  />
                ) : (
                  <div className="flex aspect-square w-full max-w-[280px] mx-auto flex-col items-center justify-center gap-3 rounded-[28px] bg-[#121214] p-4 text-center text-white/60">
                    <X className="h-8 w-8 text-red-400" />
                    <span className="text-sm font-medium">
                      Đơn hàng đã hết hạn thanh toán.
                    </span>
                  </div>
                )}

                <div className="mt-6 flex items-center justify-center gap-2 rounded-2xl border border-white/8 bg-white/[0.04] px-3 py-3 text-xs font-semibold text-white/68">
                  <ShieldCheck className="h-4 w-4 text-[#D4AF37]" />
                  Thanh toán an toàn qua SePay & Ví Coin TaleX
                </div>

                <div className="mt-7 grid grid-cols-1 gap-3">
                  <button
                    type="button"
                    onClick={() => router.back()}
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-white/12 bg-white/[0.04] px-5 text-sm font-semibold text-white/72 transition hover:border-white/22 hover:bg-white/[0.08] hover:text-white active:translate-y-px"
                  >
                    <X className="h-4 w-4" />
                    Quay lại
                  </button>
                </div>
              </div>
            </motion.aside>
          </div>
        </section>
      </div>
    </main>
  );
}

export default function CheckoutContentPage() {
  return (
    <Suspense fallback={null}>
      <CheckoutContentPageBody />
    </Suspense>
  );
}
