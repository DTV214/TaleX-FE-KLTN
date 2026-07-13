"use client";

import { CircleDollarSign } from "lucide-react";

type CoinPaymentSelectorProps = {
  /** Số dư ví THẬT hiện tại — hiển thị cho user, phải khớp với số ở header. */
  walletBalance: number;
  /** walletBalance + số Coin đang áp cho đơn này — chỉ dùng để quyết định có ẩn nút gạt
   * hay không, tránh nút biến mất khi đã dùng hết Coin cho chính đơn đang xem. */
  maxUsableCoin: number;
  useCoin: boolean;
  onToggle: (useCoin: boolean) => void;
  coinAmountUsed: number;
  isLoading: boolean;
};

function formatNumber(value: number) {
  return new Intl.NumberFormat("vi-VN").format(value);
}

export function CoinPaymentSelector({
  walletBalance,
  maxUsableCoin,
  useCoin,
  onToggle,
  coinAmountUsed,
  isLoading,
}: CoinPaymentSelectorProps) {
  const hasWallet = maxUsableCoin > 0;

  return (
    <div className="rounded-2xl border border-white/8 bg-white/[0.025] p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <CircleDollarSign className="h-5 w-5 text-[#D4AF37]" />
          <p className="text-sm font-semibold text-white">Dùng Coin để giảm giá</p>
        </div>
        <p className="text-xs font-medium text-white/50">
          Số dư:{" "}
          <span className="font-bold text-[#D4AF37]">{formatNumber(walletBalance)}</span> Coin
        </p>
      </div>

      {hasWallet ? (
        <>
          <div className="mt-4 flex items-center justify-between gap-3">
            <p className="text-xs font-medium text-white/60">
              {isLoading
                ? "Đang tính toán..."
                : useCoin
                  ? `Đang dùng ${formatNumber(coinAmountUsed)} Coin cho đơn hàng này.`
                  : "Không dùng Coin cho đơn hàng này."}
            </p>

            <button
              type="button"
              role="switch"
              aria-checked={useCoin}
              onClick={() => onToggle(!useCoin)}
              className={`inline-flex h-6 w-11 shrink-0 items-center rounded-full p-0.5 transition-colors ${
                useCoin ? "bg-[#D4AF37]" : "bg-white/15"
              }`}
            >
              <span
                className={`h-5 w-5 rounded-full bg-white shadow transition-transform ${
                  useCoin ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </>
      ) : (
        <p className="mt-3 text-xs font-medium text-white/50">
          Bạn chưa có Coin nào. Điểm danh hằng ngày hoặc hoàn thành nhiệm vụ để nhận Coin.
        </p>
      )}
    </div>
  );
}
