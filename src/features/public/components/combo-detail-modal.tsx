"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ChevronRight, Sparkles, X, Film, ShoppingCart } from "lucide-react";
import { type PublicCombo } from "@/features/public/api/public-content.api";

interface ComboDetailModalProps {
  isOpen: boolean;
  combo: PublicCombo | null;
  onClose: () => void;
  onPurchase: () => void;
}

export function ComboDetailModal({
  isOpen,
  combo,
  onClose,
  onPurchase,
}: ComboDetailModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !combo || !mounted) return null;

  const originalPrice = combo.originalPriceVnd ?? combo.priceVnd;
  const discountPercentage =
    originalPrice > combo.priceVnd
      ? Math.round(((originalPrice - combo.priceVnd) / originalPrice) * 100)
      : 0;
  const episodeCount = combo.episodes?.length ?? 0;
  const isPurchasable = combo.priceVnd > 0;

  const seriesNames = Array.from(
    new Set(
      combo.episodes
        ?.map((episode) => episode.seriesTitle)
        .filter((value): value is string => Boolean(value))
    )
  );

  const features = [
    episodeCount > 0
      ? `Bao gồm trọn vẹn ${episodeCount} tập phim/truyện chọn lọc trong cùng một gói`
      : "Danh sách tập chọn lọc trong vũ trụ TaleX",
    combo.description || "Mở khóa combo nội dung với mức giá ưu đãi nhất.",
  ];

  if (seriesNames.length > 0) {
    features.push(`Thuộc bộ tác phẩm: ${seriesNames.join(", ")}`);
  }

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 overflow-hidden">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/85 backdrop-blur-md"
        />

        {/* Modal Box */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          transition={{ duration: 0.2 }}
          className="relative z-10 w-full max-w-xl max-h-[85vh] flex flex-col rounded-3xl border border-white/15 bg-[#141417] shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="shrink-0 flex items-start justify-between border-b border-white/10 p-5 sm:p-6 bg-gradient-to-r from-[#D4AF37]/10 via-transparent to-transparent">
            <div className="flex items-start gap-3.5">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-lg sm:text-xl font-black text-white">
                    {combo.title}
                  </h3>
                  {discountPercentage > 0 && (
                    <span className="rounded-full bg-red-500/15 border border-red-500/30 px-2 py-0.5 text-[10px] font-black text-red-400">
                      Tiết kiệm {discountPercentage}%
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-400 line-clamp-2">
                  {combo.description || "Gói ưu đãi mở khóa nội dung trọn gói trên TaleX."}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="rounded-xl p-2 text-gray-400 hover:bg-white/10 hover:text-white transition-colors cursor-pointer shrink-0 ml-2"
            >
              <X size={18} />
            </button>
          </div>

          {/* Scrollable Body */}
          <div className="flex-1 min-h-0 overflow-y-auto p-5 sm:p-6 space-y-6 [scrollbar-width:thin] [scrollbar-color:rgba(212,175,55,0.3)_transparent]">
            {/* 1. Feature Highlights */}
            <div className="space-y-2.5">
              <h4 className="text-xs font-black uppercase tracking-wider text-[#D4AF37]">
                Quyền lợi gói combo
              </h4>
              <ul className="space-y-2.5 text-xs sm:text-sm font-semibold text-gray-200 bg-white/[0.03] border border-white/5 rounded-2xl p-4">
                {features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-2.5">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#D4AF37]" />
                    <span className="leading-snug text-gray-300">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* 2. Episode List */}
            {combo.episodes && combo.episodes.length > 0 && (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase tracking-wider text-[#D4AF37] flex items-center gap-1.5">
                    <Film className="w-3.5 h-3.5" />
                    Danh sách tập bao gồm ({episodeCount} tập)
                  </h4>
                </div>

                <div className="max-h-48 overflow-y-auto rounded-2xl border border-white/10 bg-black/40 p-3 space-y-1.5">
                  {combo.episodes.map((ep, idx) => (
                    <div
                      key={ep.episodeId || idx}
                      className="flex items-center justify-between gap-3 px-3 py-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] transition-colors text-xs font-bold text-gray-300"
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#D4AF37]/20 text-[10px] font-black text-[#D4AF37]">
                          {idx + 1}
                        </span>
                        <span className="truncate">
                          {ep.episodeNumber != null ? `Tập ${ep.episodeNumber}: ` : ""}
                          {ep.title}
                        </span>
                      </div>
                      {ep.seriesTitle && (
                        <span className="text-[10px] text-gray-500 shrink-0 font-medium hidden sm:inline">
                          {ep.seriesTitle}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 3. Detailed Pricing Summary */}
            <div className="space-y-2.5">
              <h4 className="text-xs font-black uppercase tracking-wider text-[#D4AF37]">
                Chi tiết thanh toán
              </h4>
              <div className="rounded-2xl border border-white/10 bg-black/50 p-4 space-y-2.5 text-xs">
                <div className="flex justify-between items-center text-gray-300">
                  <span>Số lượng tập áp dụng:</span>
                  <span className="font-bold text-white">{episodeCount} tập</span>
                </div>

                {originalPrice > combo.priceVnd && (
                  <>
                    <div className="flex justify-between items-center text-gray-400">
                      <span>Tổng giá gốc từng tập:</span>
                      <span className="line-through">
                        {originalPrice.toLocaleString("vi-VN")} đ
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-emerald-400">
                      <span>Ưu đãi giảm giá combo ({discountPercentage}%):</span>
                      <span className="font-bold">
                        -{(originalPrice - combo.priceVnd).toLocaleString("vi-VN")} đ
                      </span>
                    </div>
                  </>
                )}

                <div className="flex justify-between items-center pt-3 border-t border-white/10">
                  <span className="text-sm font-bold text-white">Tổng tiền thanh toán:</span>
                  <span className="text-xl font-black text-[#D4AF37]">
                    {(combo.priceVnd || 0).toLocaleString("vi-VN")} đ
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="shrink-0 flex items-center justify-between gap-3 border-t border-white/10 p-5 sm:p-6 bg-[#141417]">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-3 text-xs font-bold text-gray-400 hover:text-white rounded-xl bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
            >
              Đóng
            </button>

            <button
              type="button"
              onClick={onPurchase}
              disabled={!isPurchasable}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 text-xs sm:text-sm font-black text-black bg-[#D4AF37] hover:bg-[#F3CE5E] rounded-xl shadow-lg shadow-[#D4AF37]/20 transition-all cursor-pointer hover:scale-[1.01] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ShoppingCart size={16} />
              <span>{isPurchasable ? "Mua Gói Ngay" : "Liên hệ để mua"}</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
}
