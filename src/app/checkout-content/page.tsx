"use client";

import { Suspense, useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  Loader2,
  ShieldCheck,
  Ticket,
  Trash2,
  X,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { CopyableField } from "@/features/checkout/components/CopyableField";
import { PaymentWarningBanner } from "@/features/checkout/components/PaymentWarningBanner";
import { QRCodeDisplay } from "@/features/checkout/components/QRCodeDisplay";
import { CoinPaymentSelector } from "@/features/checkout-content/components/coin-payment-selector";
import { useEnsureContentOrder } from "@/features/checkout-content/api/content-order.api";
import { useCoinWallet } from "@/features/coin/hooks/useCoinQueries";
import {
  useCancelOrder,
  useConfirmCoinPayment,
  useOrderStatus,
} from "@/features/payment/api/payment.api";
import type { ContentOrderItemType } from "@/features/payment/types/payment.types";
import { getApiErrorCode, getApiErrorMessage } from "@/shared/api/http-client";
import { parseBackendDate } from "@/shared/utils/backend-date";

const SEPAY_BANK_NAME = "Ngân Hàng VietinBank";
const SEPAY_BANK_LOGO_URL = "https://api.vietqr.io/img/ICB.png";
const SEPAY_ACCOUNT_NUMBER = "100881945065";
const SEPAY_ACCOUNT_HOLDER = "NGUYEN GIA KHANH";
const COIN_DEBOUNCE_MS = 400;
// Khớp PaymentErrorCode.CONTENT_ALREADY_OWNED ở BE
const CONTENT_ALREADY_OWNED_CODE = 4003;

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
  const returnTo = searchParams.get("returnTo") || "/";

  const [useCoin, setUseCoin] = useState(false);
  const [debouncedCoin, setDebouncedCoin] = useState(0);
  const [remainingSeconds, setRemainingSeconds] = useState(0);

  const walletQuery = useCoinWallet();
  const walletBalance = walletQuery.data?.balance ?? 0;
  const createOrderQuery = useEnsureContentOrder(itemId || undefined, itemType, debouncedCoin);
  const orderId = createOrderQuery.data?.orderId;
  const orderStatusQuery = useOrderStatus(orderId);
  const order = orderStatusQuery.data ?? createOrderQuery.data;
  const cancelOrderMutation = useCancelOrder();
  const confirmCoinPaymentMutation = useConfirmCoinPayment();

  // Số dư ví dao động lên/xuống theo chính đơn này (bị trừ khi áp Coin, hoàn khi bỏ chọn).
  // Cộng lại phần đã áp cho đơn hiện tại để có 1 giá trị ỔN ĐỊNH — nếu dùng thẳng
  // walletBalance đang biến động làm target thì effect bên dưới sẽ tự kích hoạt lại
  // liên tục theo mỗi lần trừ/hoàn Coin (vòng lặp vô hạn).
  const maxUsableCoin = walletBalance + (order?.coinAmountUsed ?? 0);

  useEffect(() => {
    if (!itemId) {
      router.replace("/");
    }
  }, [itemId, router]);

  useEffect(() => {
    const targetCoin = useCoin ? maxUsableCoin : 0;
    const timerId = window.setTimeout(() => setDebouncedCoin(targetCoin), COIN_DEBOUNCE_MS);
    return () => window.clearTimeout(timerId);
  }, [useCoin, maxUsableCoin]);

  useEffect(() => {
    if (order?.status !== "COMPLETED") {
      return;
    }
    const redirectTimerId = window.setTimeout(() => {
      router.push(returnTo);
    }, 1500);
    return () => window.clearTimeout(redirectTimerId);
  }, [order?.status, returnTo, router]);

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

  // Chỉ hiện spinner toàn khung lúc CHƯA có đơn nào (lần đầu vào trang). Từ lần sau, đổi
  // Coin chỉ cần cập nhật số liệu tại chỗ (nhờ keepPreviousData) — không che hết QR/giá.
  const isPreparing = !order;
  const isSyncingCoin = createOrderQuery.isFetching && Boolean(order);
  const isCompleted = order?.status === "COMPLETED";
  const isExpired = order?.status === "OUT_OF_TIME" || order?.status === "CANCELLED";
  const needsOnlinePayment = Boolean(order?.qrUrl) && !isCompleted && !isExpired;
  const canCancel = Boolean(order) && !isCompleted && !isExpired;
  const isContentAlreadyOwnedError =
    createOrderQuery.isError && getApiErrorCode(createOrderQuery.error) === CONTENT_ALREADY_OWNED_CODE;
  const isFullyCoveredByCoin =
    order != null && !isCompleted && !isExpired && order.fiatAmount === 0;

  function handleConfirmCoinPayment() {
    if (!orderId) {
      return;
    }
    confirmCoinPaymentMutation.mutate(orderId);
  }

  function handleCancelOrder() {
    if (!orderId) {
      return;
    }
    cancelOrderMutation.mutate(orderId);
  }

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
                  walletBalance={walletBalance}
                  maxUsableCoin={maxUsableCoin}
                  useCoin={useCoin}
                  onToggle={setUseCoin}
                  coinAmountUsed={order?.coinAmountUsed ?? 0}
                  isLoading={isSyncingCoin}
                />
              )}

              {order && (
                <div
                  className={`rounded-2xl border border-white/8 bg-[#121214]/88 p-5 shadow-[0_18px_46px_rgba(0,0,0,0.38)] transition-opacity sm:p-6 ${
                    isSyncingCoin ? "opacity-60" : "opacity-100"
                  }`}
                >
                  <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-white/40">
                    Số tiền cần thanh toán
                    {isSyncingCoin && (
                      <Loader2 className="h-3 w-3 animate-spin text-[#D4AF37]" />
                    )}
                  </p>

                  {(Boolean(order.comboOwnedEpisodeCount) || order.coinAmountUsed > 0) && (
                    <div className="mt-4 space-y-2 border-b border-white/8 pb-4 text-sm">
                      {Boolean(order.comboOwnedEpisodeCount) && (
                        <>
                          <div className="flex items-center justify-between">
                            <span className="text-white/55">
                              Giá combo ({order.comboTotalEpisodeCount} tập)
                            </span>
                            <span className="text-white/45">
                              {formatCurrency(order.comboOriginalPrice ?? 0)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-white/55">
                              Ưu đãi đã sở hữu {order.comboOwnedEpisodeCount}/
                              {order.comboTotalEpisodeCount} tập
                            </span>
                            <span className="font-semibold text-emerald-300">
                              −
                              {formatCurrency(
                                (order.comboOriginalPrice ?? 0) - order.totalAmount,
                              )}
                            </span>
                          </div>
                          <div className="flex items-center justify-between border-t border-white/5 pt-2">
                            <span className="text-white/70">Tạm tính</span>
                            <span className="font-semibold text-white">
                              {formatCurrency(order.totalAmount)}
                            </span>
                          </div>
                        </>
                      )}

                      {order.coinAmountUsed > 0 && (
                        <div className="flex items-center justify-between">
                          <span className="text-white/55">
                            Giảm giá Coin ({order.coinAmountUsed} Coin)
                          </span>
                          <span className="font-semibold text-emerald-300">
                            −{formatCurrency(order.totalAmount - order.fiatAmount)}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  <p className="font-heading mt-4 text-4xl font-bold tracking-tight text-[#D4AF37] md:text-5xl">
                    {formatCurrency(order.fiatAmount)}
                  </p>
                </div>
              )}

              {needsOnlinePayment && (
                <>
                  <PaymentWarningBanner message="Vui lòng chuyển khoản đúng nội dung để hệ thống tự động xử lý trong vài giây." />
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <CopyableField label="Tên tài khoản" value={SEPAY_ACCOUNT_HOLDER} />
                    <CopyableField
                      label="Tên ngân hàng"
                      value={SEPAY_BANK_NAME}
                      logoUrl={SEPAY_BANK_LOGO_URL}
                    />
                    <CopyableField label="Số tài khoản" value={SEPAY_ACCOUNT_NUMBER} />
                    <CopyableField
                      label="Nội dung"
                      value={order?.paymentCode ?? "—"}
                      isHighlight
                    />
                  </div>
                  <p className="text-[11px] font-medium text-red-300/80">
                    * Bắt buộc nhập đúng nội dung
                  </p>
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
                  isContentAlreadyOwnedError ? (
                    <div className="flex aspect-square w-full max-w-[280px] mx-auto flex-col items-center justify-center gap-3 rounded-[28px] bg-[#121214] p-4 text-center text-white/60">
                      <CheckCircle2 className="h-8 w-8 text-emerald-300" />
                      <span className="text-sm font-medium">
                        {getApiErrorMessage(createOrderQuery.error)}
                      </span>
                      <button
                        type="button"
                        onClick={() => router.push(returnTo)}
                        className="mt-2 rounded-lg bg-[#D4AF37] px-4 py-2 text-xs font-bold text-black transition hover:bg-[#E5C158]"
                      >
                        Xem ngay
                      </button>
                    </div>
                  ) : (
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
                  )
                ) : isCompleted ? (
                  <div className="flex aspect-square w-full max-w-[280px] mx-auto flex-col items-center justify-center gap-3 rounded-[28px] bg-emerald-950/40 p-4 text-center">
                    <CheckCircle2 className="h-12 w-12 text-emerald-300" />
                    <span className="text-sm font-bold text-emerald-100">
                      Mở khóa nội dung thành công!
                    </span>
                    <button
                      type="button"
                      onClick={() => router.push(returnTo)}
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
                ) : isFullyCoveredByCoin ? (
                  <div className="flex aspect-square w-full max-w-[280px] mx-auto flex-col items-center justify-center gap-5 rounded-[28px] border border-[#D4AF37]/20 bg-gradient-to-b from-[#D4AF37]/[0.07] to-transparent p-6 text-center">
                    <span className="flex h-16 w-16 items-center justify-center rounded-full border border-[#D4AF37]/40 bg-[#D4AF37]/10 text-[#D4AF37] shadow-[0_0_34px_rgba(212,175,55,0.3)]">
                      <CircleDollarSign className="h-8 w-8" />
                    </span>
                    <div className="space-y-1.5">
                      <p className="text-sm font-bold text-white">
                        Coin đã đủ trả hết đơn này
                      </p>
                      <p className="text-xs font-medium text-white/50">
                        Xác nhận để dùng Coin mở khóa ngay
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleConfirmCoinPayment}
                      disabled={confirmCoinPaymentMutation.isPending}
                      className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#D4AF37] px-4 text-sm font-bold text-black transition hover:bg-[#E5C158] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {confirmCoinPaymentMutation.isPending && (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      )}
                      Xác nhận &amp; mở khóa
                    </button>
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

                <div className="mt-7 space-y-3">
                  <button
                    type="button"
                    onClick={() => router.back()}
                    className="group inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-white/12 bg-white/[0.04] px-5 text-sm font-semibold text-white/80 transition hover:border-[#D4AF37]/40 hover:bg-white/[0.07] hover:text-white active:translate-y-px"
                  >
                    <Clock3 className="h-4 w-4 text-white/45 transition group-hover:text-[#D4AF37]" />
                    Thoát, thanh toán sau
                  </button>

                  {canCancel && (
                    <button
                      type="button"
                      onClick={handleCancelOrder}
                      disabled={cancelOrderMutation.isPending}
                      className="inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-lg text-xs font-semibold text-white/35 transition hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {cancelOrderMutation.isPending ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                      )}
                      Hủy đơn hàng này
                    </button>
                  )}
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
