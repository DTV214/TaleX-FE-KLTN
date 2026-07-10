"use client";

import { CircleDollarSign } from "lucide-react";

type CoinPaymentSelectorProps = {
  walletBalance: number;
  value: number;
  onChange: (coinAmountToUse: number) => void;
  coinAmountUsed: number;
  isLoading: boolean;
};

function formatNumber(value: number) {
  return new Intl.NumberFormat("vi-VN").format(value);
}

export function CoinPaymentSelector({
  walletBalance,
  value,
  onChange,
  coinAmountUsed,
  isLoading,
}: CoinPaymentSelectorProps) {
  const hasWallet = walletBalance > 0;

  function clamp(raw: number) {
    if (Number.isNaN(raw)) {
      return 0;
    }
    return Math.max(0, Math.min(walletBalance, Math.floor(raw)));
  }

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
          <input
            type="range"
            min={0}
            max={walletBalance}
            step={1}
            value={value}
            onChange={(event) => onChange(clamp(Number(event.target.value)))}
            className="mt-4 w-full accent-[#D4AF37]"
          />

          <div className="mt-3 flex flex-wrap items-center gap-3">
            <input
              type="number"
              min={0}
              max={walletBalance}
              step={1}
              value={value}
              onChange={(event) => onChange(clamp(Number(event.target.value)))}
              className="h-10 w-32 rounded-lg border border-white/10 bg-[#121214] px-3 text-sm font-semibold text-white outline-none focus:border-[#D4AF37]/60"
            />
            <button
              type="button"
              onClick={() => onChange(walletBalance)}
              className="text-xs font-semibold text-[#D4AF37] hover:underline"
            >
              Dùng tối đa
            </button>
            <button
              type="button"
              onClick={() => onChange(0)}
              className="text-xs font-semibold text-white/50 transition hover:text-white"
            >
              Bỏ chọn
            </button>
          </div>

          <p className="mt-3 text-xs font-medium text-white/50">
            {isLoading
              ? "Đang tính toán..."
              : `Hệ thống áp dụng ${formatNumber(coinAmountUsed)} Coin cho đơn hàng này.`}
          </p>
        </>
      ) : (
        <p className="mt-3 text-xs font-medium text-white/50">
          Bạn chưa có Coin nào. Điểm danh hằng ngày hoặc hoàn thành nhiệm vụ để nhận Coin.
        </p>
      )}
    </div>
  );
}
