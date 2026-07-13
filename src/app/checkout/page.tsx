"use client";

import { Suspense, useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Building2,
  Check,
  CreditCard,
  Landmark,
  Loader2,
  ReceiptText,
  ShieldCheck,
  Sparkles,
  Ticket,
  WalletCards,
  X,
} from "lucide-react";
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
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Progress } from "@/shared/ui/progress";
import { getApiErrorMessage } from "@/shared/api/http-client";
import { parseBackendDate } from "@/shared/utils/backend-date";

const SEPAY_BANK_NAME = "Ngân Hàng VietinBank";
const SEPAY_ACCOUNT_NUMBER = "100881945065";
const SEPAY_ACCOUNT_HOLDER = "NGUYEN GIA KHANH";

const motionProps = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
} as const;

function formatCurrency(amount: number) {
  return `${new Intl.NumberFormat("vi-VN").format(amount)} VNĐ`;
}

function PaymentFrame({
  children,
  className,
  isHighlighted = false,
}: {
  children: React.ReactNode;
  className?: string;
  isHighlighted?: boolean;
}) {
  return (
    <div
      className={`group relative overflow-hidden rounded-2xl border ${
        isHighlighted ? "border-[#D4AF37]/28" : "border-white/10"
      } bg-[#111114]/88 shadow-[0_14px_36px_rgba(0,0,0,0.28)] ${className ?? ""}`}
    >
      <div
        className={`pointer-events-none absolute -inset-24 bg-[conic-gradient(from_0deg,transparent_0deg,rgba(212,175,55,0.34)_48deg,transparent_108deg,transparent_360deg)] opacity-0 blur-sm transition-opacity duration-500 group-hover:opacity-25 ${
          isHighlighted ? "opacity-15" : ""
        }`}
        style={{ animation: "spin 22s linear infinite" }}
      />
      <div className="pointer-events-none absolute inset-px rounded-[15px] bg-[#111114]/95" />
      <div className="relative z-10">{children}</div>
    </div>
  );
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
    <main className="relative min-h-screen overflow-hidden bg-[#09090A] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_14%_8%,rgba(212,175,55,0.14),transparent_30%),radial-gradient(circle_at_88%_16%,rgba(151,176,255,0.09),transparent_28%),linear-gradient(135deg,#09090A_0%,#111114_48%,#080808_100%)]" />
      <div className="pointer-events-none fixed inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#D4AF37]/45 to-transparent" />

      <div className="relative z-10 mx-auto w-full max-w-6xl px-4 py-4 sm:px-6 lg:px-8">
        <div className="mx-auto flex w-full flex-col gap-3">
          <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
            <motion.div {...motionProps} className="space-y-3">
              <PaymentFrame>
                <div className="grid gap-3 p-4 md:grid-cols-[1fr_auto] md:items-center">
                  <div className="flex items-start gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#D4AF37]/25 bg-[#D4AF37]/10 text-[#D4AF37]">
                      <Ticket className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[#D4AF37]">
                        Tóm tắt đơn hàng
                      </p>
                      <p className="mt-1 text-base font-semibold leading-6 text-slate-100">
                        {subscription
                          ? `Gói Dịch Vụ: TaleX Premium ${subscription.tier} (${subscription.duration} ${subscription.durationUnit})`
                          : "Đang tải thông tin gói..."}
                      </p>
                      <p className="mt-1 text-sm font-normal leading-6 text-slate-400">
                        Đơn hàng Premium sẽ được kích hoạt sau khi hệ thống xác nhận giao dịch thành công.
                      </p>
                    </div>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-black/25 p-3 md:min-w-[190px]">
                    <p className="text-xs font-medium text-slate-500">
                      Trạng thái
                    </p>
                    <p className="mt-1 text-sm font-semibold text-[#F4E7B7]">
                      {displayStatus === "OUT_OF_TIME"
                        ? "Đã hết hạn"
                        : displayStatus === "SUCCESS"
                          ? "Đã thanh toán"
                          : "Đang chờ thanh toán"}
                    </p>
                  </div>
                </div>
              </PaymentFrame>

              {activeSubscriptionQuery.data && (
                <motion.div {...motionProps} transition={{ ...motionProps.transition, delay: 0.08 }}>
                  <SubscriptionStackingWarning activeSubscription={activeSubscriptionQuery.data} />
                </motion.div>
              )}

              <motion.div
                {...motionProps}
                transition={{ ...motionProps.transition, delay: 0.1 }}
              >
                <PaymentWarningBanner message="Vui lòng chuyển khoản đúng nội dung để hệ thống tự động xử lý trong vài giây." />
              </motion.div>

              {createOrderQuery.isError && (
                <PaymentWarningBanner
                  type="info"
                  message={getApiErrorMessage(createOrderQuery.error)}
                />
              )}

              <PaymentFrame isHighlighted>
                <div className="grid gap-4 p-4 md:grid-cols-[1fr_auto] md:items-center">
                  <div>
                    <p className="text-sm font-medium text-slate-500">
                      Số tiền thanh toán
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-3">
                      <p className="text-2xl font-semibold tracking-tight text-[#F5D46E] sm:text-3xl">
                        {order ? formatCurrency(order.totalAmount) : "—"}
                      </p>
                      <Badge variant="premium" className="h-8 px-3 text-xs font-medium">
                        <ShieldCheck className="mr-1.5 h-3.5 w-3.5" />
                        SePay bảo vệ
                      </Badge>
                    </div>
                  </div>

                  <div className="w-full rounded-xl border border-white/10 bg-black/25 p-3 md:w-[220px]">
                    <div className="mb-2 flex items-center justify-between text-xs font-medium text-slate-500">
                      <span>Tiến trình</span>
                      <span className="text-[#F5D46E]">
                        {displayStatus === "SUCCESS" ? "100%" : "62%"}
                      </span>
                    </div>
                    <Progress value={displayStatus === "SUCCESS" ? 100 : 62} />
                    <div className="mt-2 flex items-center gap-2 text-xs font-normal text-slate-400">
                      <Sparkles className="h-3.5 w-3.5 text-[#D4AF37]" />
                      Chờ ngân hàng xác nhận
                    </div>
                  </div>
                </div>
              </PaymentFrame>

              <PaymentFrame>
                <div className="p-4">
                  <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                    <div>
                      <p className="text-sm font-medium text-[#D4AF37]">
                        Thông tin chuyển khoản
                      </p>
                      <h2 className="mt-1 text-lg font-medium text-slate-100">
                        Copy chính xác từng trường
                      </h2>
                      <p className="mt-1 text-sm font-normal leading-6 text-slate-400">
                        Nội dung chuyển khoản là khóa đối soát tự động, vui lòng không sửa.
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {[
                        { label: "VietinBank", icon: Landmark },
                        { label: "VietQR", icon: CreditCard },
                        { label: "SePay", icon: WalletCards },
                      ].map((item) => {
                        const Icon = item.icon;

                        return (
                          <span
                            key={item.label}
                            className="inline-flex h-8 items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 text-xs font-medium text-slate-300"
                          >
                            <Icon className="h-3.5 w-3.5 text-[#D4AF37]" />
                            {item.label}
                          </span>
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <CopyableField label="Tên tài khoản" value={SEPAY_ACCOUNT_HOLDER} />
                    <CopyableField label="Tên ngân hàng" value={SEPAY_BANK_NAME} />
                    <CopyableField label="Số tài khoản" value={SEPAY_ACCOUNT_NUMBER} />
                    <div>
                      <CopyableField
                        label="Nội dung"
                        value={order?.paymentCode ?? "—"}
                        isHighlight
                      />
                      <p className="mt-1 flex items-center gap-2 text-xs font-medium text-red-300">
                        <ReceiptText className="h-3.5 w-3.5" />
                        Bắt buộc nhập đúng nội dung
                      </p>
                    </div>
                  </div>
                </div>
              </PaymentFrame>

              <motion.button
                {...motionProps}
                transition={{ ...motionProps.transition, delay: 0.2 }}
                type="button"
                onClick={() => setIsAgreed((current) => !current)}
                className="flex w-full items-start gap-3 rounded-xl border border-white/10 bg-white/[0.035] p-3 text-left transition hover:border-[#D4AF37]/30 hover:bg-[#D4AF37]/[0.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]/50"
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
                <span className="text-sm font-normal leading-6 text-slate-300">
                  Tôi đồng ý với Điều khoản dịch vụ và Chính sách bảo mật của TaleX.
                </span>
              </motion.button>
            </motion.div>

            <motion.aside
              {...motionProps}
              transition={{ ...motionProps.transition, delay: 0.12 }}
              className="lg:sticky lg:top-4"
            >
              <PaymentFrame isHighlighted>
                <div className="p-4">
                  <div className="mb-4 flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-[#D4AF37]">
                      <Ticket className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-slate-500">
                        TaleX Order
                      </p>
                      <p className="mt-1 truncate text-sm font-semibold text-white/86">
                        {subscription ? `Premium ${subscription.tier}` : "Đang tải gói..."}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2.5 border-y border-white/10 py-3">
                    <div className="flex items-center justify-between gap-4 text-sm">
                      <span className="text-slate-400">Gói dịch vụ</span>
                      <span className="max-w-[150px] truncate font-semibold text-white/82">
                        {subscription?.tier ?? "—"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-4 text-sm">
                      <span className="text-slate-400">Thời hạn</span>
                      <span className="font-semibold text-white/82">
                        {subscription
                          ? `${subscription.duration} ${subscription.durationUnit}`
                          : "—"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-4 text-sm">
                      <span className="text-slate-400">Phương thức</span>
                      <span className="font-semibold text-white/82">VietQR</span>
                    </div>
                  </div>

                  <div className="flex items-end justify-between gap-4 border-b border-white/10 py-4">
                    <span className="text-base font-semibold text-white/82">Total</span>
                    <div className="text-right">
                      <p className="text-xs font-medium text-slate-500">
                        VND
                      </p>
                      <p className="text-xl font-semibold text-[#F5D46E]">
                        {order ? formatCurrency(order.totalAmount) : "—"}
                      </p>
                    </div>
                  </div>

                  <div className="my-4 text-center">
                    <Badge variant="premium" className="mb-2 px-3 py-1 text-xs font-medium">
                      SePay VietQR
                    </Badge>
                    <h2 className="text-base font-medium tracking-normal text-white/88">
                      Quét mã để thanh toán
                    </h2>
                  </div>

                  {createOrderQuery.isError ? (
                    <div className="mx-auto flex aspect-square w-full max-w-[200px] flex-col items-center justify-center gap-3 rounded-2xl border border-white/10 bg-black/25 p-4 text-center text-slate-400">
                      <X className="h-8 w-8 text-red-400" />
                      <span className="text-sm font-medium">
                        {getApiErrorMessage(createOrderQuery.error)}
                      </span>
                      <Button
                        type="button"
                        onClick={() => createOrderQuery.refetch()}
                        className="mt-2 rounded-xl bg-[#D4AF37] px-4 text-xs font-bold text-black hover:bg-[#F3CE5E]"
                      >
                        Thử tạo lại đơn hàng
                      </Button>
                    </div>
                  ) : isPreparing || !order.qrUrl ? (
                    <div className="mx-auto flex aspect-square w-full max-w-[200px] flex-col items-center justify-center gap-3 rounded-2xl border border-white/10 bg-black/25 p-4 text-slate-400">
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

                  <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
                    <div className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-xs font-medium text-slate-300">
                      <ShieldCheck className="h-4 w-4 text-[#D4AF37]" />
                      SSL 256-bit
                    </div>
                    <div className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-xs font-medium text-slate-300">
                      <Building2 className="h-4 w-4 text-[#D4AF37]" />
                      VietinBank
                    </div>
                  </div>

                  <div className="mt-4 grid gap-2.5">
                    <Button
                      type="button"
                      onClick={() => router.push("/premium")}
                      variant="outline"
                      className="h-10 rounded-xl border-white/12 bg-white/[0.04] px-5 text-sm font-medium text-slate-300 hover:border-white/22 hover:bg-white/[0.08] hover:text-white"
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Quay lại
                    </Button>

                    <div className="inline-flex h-10 items-center justify-center rounded-xl border border-[#D4AF37]/25 bg-[#D4AF37]/10 px-4 text-sm font-medium text-[#F4E7B7]">
                      {displayStatus === "OUT_OF_TIME"
                        ? "Đã hết hạn"
                        : displayStatus === "SUCCESS"
                          ? "Đã thanh toán"
                          : "Đang chờ"}
                    </div>
                  </div>
                </div>
              </PaymentFrame>
            </motion.aside>
          </section>
        </div>
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
