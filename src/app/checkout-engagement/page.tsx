"use client";

import { Suspense, useEffect, useState, type ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  BadgeCheck,
  Building2,
  Clock3,
  Loader2,
  ReceiptText,
  ShieldCheck,
  Sparkles,
  WalletCards,
} from "lucide-react";
import { CopyableField } from "@/features/checkout/components/CopyableField";
import { PaymentWarningBanner } from "@/features/checkout/components/PaymentWarningBanner";
import { QRCodeDisplay } from "@/features/checkout/components/QRCodeDisplay";
import { useCancelOrder, useOrderStatus } from "@/features/payment/api/payment.api";
import { Button } from "@/shared/ui/button";
import { Progress } from "@/shared/ui/progress";
import { getApiErrorMessage } from "@/shared/api/http-client";
import { parseBackendDate } from "@/shared/utils/backend-date";
import {
  SEPAY_ACCOUNT_HOLDER,
  SEPAY_ACCOUNT_NUMBER,
  SEPAY_BANK_LOGO_URL,
  SEPAY_BANK_NAME,
} from "@/features/checkout/config/sepay-bank-info";

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount);
}

function getTimeLeftSeconds(expiresAt?: string) {
  if (!expiresAt) return 0;
  return Math.max(
    0,
    Math.floor((parseBackendDate(expiresAt).getTime() - Date.now()) / 1000),
  );
}

function PaymentFrame({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-[28px] border border-white/10 bg-[#0f0f11]/90 p-5 shadow-[0_24px_80px_rgba(0,0,0,0.36)] backdrop-blur-xl ${className}`}
    >
      {children}
    </section>
  );
}

function CheckoutEngagementContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId") ?? undefined;
  const orderQuery = useOrderStatus(orderId);
  const cancelOrder = useCancelOrder();
  const order = orderQuery.data;
  const [timeLeft, setTimeLeft] = useState(() => getTimeLeftSeconds(order?.expiresAt));
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId) {
      router.replace("/creator-dashboard?view=campaign");
    }
  }, [orderId, router]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setTimeLeft(getTimeLeftSeconds(order?.expiresAt));
    }, 0);
    const intervalId = window.setInterval(() => {
      setTimeLeft(getTimeLeftSeconds(order?.expiresAt));
    }, 1000);

    return () => {
      window.clearTimeout(timeoutId);
      window.clearInterval(intervalId);
    };
  }, [order?.expiresAt]);

  useEffect(() => {
    if (!order) return;

    if (order.status === "COMPLETED") {
      const timeoutId = window.setTimeout(() => {
        router.replace(
          `/checkout-engagement/success?orderId=${order.orderId}&amount=${order.totalAmount}`,
        );
      }, 900);
      return () => window.clearTimeout(timeoutId);
    }

    if (order.status === "OUT_OF_TIME" || order.status === "CANCELLED") {
      router.replace("/creator-dashboard?view=campaign");
    }
  }, [order, router]);

  const handleCancel = async () => {
    if (!orderId) return;

    try {
      setErrorMessage(null);
      await cancelOrder.mutateAsync(orderId);
      router.replace("/creator-dashboard?view=campaign");
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error));
    }
  };

  if (!orderId || orderQuery.isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#070708] text-white">
        <div className="flex items-center gap-3 text-sm font-semibold text-zinc-400">
          <Loader2 className="h-5 w-5 animate-spin text-[#D4AF37]" />
          Đang chuẩn bị cổng thanh toán...
        </div>
      </main>
    );
  }

  if (orderQuery.isError || !order) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#070708] px-4 text-white">
        <PaymentFrame className="max-w-lg text-center">
          <ReceiptText className="mx-auto h-10 w-10 text-red-300" />
          <h1 className="mt-4 text-2xl font-black">Không thể tải đơn hàng</h1>
          <p className="mt-2 text-sm font-semibold text-zinc-400">
            Vui lòng quay lại Studio và thử tạo đơn thanh toán mới.
          </p>
          <Button
            type="button"
            className="mt-6 rounded-2xl bg-[#D4AF37] px-5 font-black text-black hover:bg-[#e6c75b]"
            onClick={() => router.replace("/creator-dashboard?view=campaign")}
          >
            Quay lại tăng tương tác
          </Button>
        </PaymentFrame>
      </main>
    );
  }

  const qrStatus =
    order.status === "COMPLETED"
      ? "SUCCESS"
      : order.status === "OUT_OF_TIME"
        ? "OUT_OF_TIME"
        : "PENDING";
  const progress = order.status === "COMPLETED" ? 100 : Math.max(12, Math.min(88, 100 - Math.floor((timeLeft / (30 * 60)) * 100)));

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#070708] px-4 py-8 text-white md:px-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_8%,rgba(212,175,55,0.15),transparent_34%),radial-gradient(circle_at_82%_12%,rgba(59,130,246,0.12),transparent_36%),linear-gradient(180deg,rgba(255,255,255,0.03),transparent_30%)]" />
      <div className="relative mx-auto max-w-7xl">
        <button
          type="button"
          onClick={handleCancel}
          disabled={cancelOrder.isPending}
          className="mb-4 inline-flex h-11 cursor-pointer items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-4 text-sm font-bold text-white/78 shadow-[0_0_24px_rgba(212,175,55,0.08)] transition hover:border-[#D4AF37]/45 hover:bg-[#D4AF37]/12 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {cancelOrder.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ArrowLeft className="h-4 w-4" />
          )}
          Quay lại / Hủy thanh toán
        </button>
      </div>
      <div className="relative mx-auto grid max-w-7xl gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-5">
          <PaymentFrame>
            <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[#D4AF37]/25 bg-[#D4AF37]/10 text-[#D4AF37]">
                  <Sparkles className="h-7 w-7" />
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.3em] text-[#D4AF37]">
                    TaleX Engagement
                  </p>
                  <h1 className="mt-3 text-3xl font-black md:text-5xl">
                    Thanh toán gói tăng tương tác
                  </h1>
                  <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-zinc-400">
                    Đơn hàng sẽ được kích hoạt sau khi hệ thống xác nhận giao dịch.
                  </p>
                </div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/30 px-5 py-4">
                <p className="text-xs font-bold text-zinc-500">Trạng thái</p>
                <p className="mt-2 text-lg font-black text-[#E8D37A]">
                  Đang chờ thanh toán
                </p>
              </div>
            </div>
          </PaymentFrame>

          <PaymentWarningBanner message="Vui lòng chuyển khoản đúng nội dung để hệ thống tự động xử lý trong vài giây." />

          <PaymentFrame className="border-[#D4AF37]/20">
            <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_320px] md:items-center">
              <div>
                <p className="text-sm font-bold text-zinc-500">Số tiền thanh toán</p>
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <span className="text-4xl font-black text-[#F3DF85] md:text-5xl">
                    {formatCurrency(order.totalAmount)}
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-4 py-2 text-sm font-bold text-[#E8D37A]">
                    <ShieldCheck className="h-4 w-4" />
                    SePay bảo vệ
                  </span>
                </div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                <div className="flex items-center justify-between text-sm font-bold">
                  <span className="text-zinc-500">Tiến trình</span>
                  <span className="text-[#F3DF85]">{progress}%</span>
                </div>
                <Progress value={progress} className="mt-3 h-2 bg-white/10" />
                <p className="mt-3 flex items-center gap-2 text-sm font-semibold text-zinc-400">
                  <Sparkles className="h-4 w-4 text-[#D4AF37]" />
                  Chờ ngân hàng xác nhận
                </p>
              </div>
            </div>
          </PaymentFrame>

          <PaymentFrame>
            <div className="mb-5">
              <p className="text-sm font-black text-[#D4AF37]">
                Thông tin chuyển khoản
              </p>
              <h2 className="mt-2 text-2xl font-black">
                Copy chính xác từng trường
              </h2>
              <p className="mt-2 text-sm font-semibold leading-6 text-zinc-400">
                Nội dung chuyển khoản là khóa đối soát tự động, vui lòng không sửa.
              </p>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <CopyableField label="Tên tài khoản" value={SEPAY_ACCOUNT_HOLDER} />
              <CopyableField
                label="Tên ngân hàng"
                value={SEPAY_BANK_NAME}
                logoUrl={SEPAY_BANK_LOGO_URL}
              />
              <CopyableField label="Số tài khoản" value={SEPAY_ACCOUNT_NUMBER} />
              <CopyableField label="Nội dung" value={order.paymentCode} isHighlight />
            </div>
          </PaymentFrame>
        </div>

        <PaymentFrame className="h-fit border-[#D4AF37]/25">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#D4AF37]/25 bg-[#D4AF37]/10 text-[#D4AF37]">
              <ReceiptText className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-zinc-500">TaleX Order</p>
              <h2 className="text-lg font-black">Gói tăng tương tác</h2>
            </div>
          </div>

          <div className="my-5 h-px bg-white/10" />
          <div className="space-y-3 text-sm font-semibold">
            <div className="flex justify-between">
              <span className="text-zinc-500">Phương thức</span>
              <span>VietQR</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Nội dung</span>
              <span className="text-[#F3DF85]">{order.paymentCode}</span>
            </div>
            <div className="flex justify-between text-lg font-black">
              <span>Total</span>
              <span className="text-[#F3DF85]">{formatCurrency(order.totalAmount)}</span>
            </div>
          </div>

          <div className="mt-6">
            {order.qrUrl ? (
              <QRCodeDisplay
                qrUrl={order.qrUrl}
                timeLeft={timeLeft}
                status={qrStatus}
              />
            ) : (
              <div className="rounded-2xl border border-white/10 bg-black/30 p-6 text-center text-sm font-semibold text-zinc-400">
                QR chưa sẵn sàng. Vui lòng thử lại sau.
              </div>
            )}
          </div>

          <div className="mt-6 grid gap-3">
            <div className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] py-3 text-sm font-bold text-zinc-300">
              <Building2 className="h-4 w-4 text-[#D4AF37]" />
              {SEPAY_BANK_NAME}
            </div>
            <div className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] py-3 text-sm font-bold text-zinc-300">
              <WalletCards className="h-4 w-4 text-[#D4AF37]" />
              SePay VietQR
            </div>
            <Button
              type="button"
              variant="outline"
              className="h-12 rounded-2xl border-red-400/25 bg-red-500/10 font-black text-red-200 hover:bg-red-500/20 hover:text-red-100"
              disabled={cancelOrder.isPending}
              onClick={handleCancel}
            >
              {cancelOrder.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Clock3 className="mr-2 h-4 w-4" />
              )}
              Hủy thanh toán
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-12 rounded-2xl border-white/10 bg-white/[0.04] font-black text-zinc-200 hover:bg-white/10 hover:text-white"
              onClick={() => router.replace("/creator-dashboard?view=campaign")}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Quay lại
            </Button>
          </div>

          {errorMessage ? (
            <div className="mt-4 rounded-2xl border border-red-400/20 bg-red-500/10 p-3 text-sm font-semibold text-red-200">
              {errorMessage}
            </div>
          ) : null}

          <div className="mt-5 flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] py-3 text-sm font-bold text-zinc-300">
            <BadgeCheck className="h-4 w-4 text-[#D4AF37]" />
            SSL 256-bit
          </div>
        </PaymentFrame>
      </div>
    </main>
  );
}

export default function CheckoutEngagementPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-[#070708] text-white">
          <Loader2 className="h-6 w-6 animate-spin text-[#D4AF37]" />
        </main>
      }
    >
      <CheckoutEngagementContent />
    </Suspense>
  );
}
