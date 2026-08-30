import { CheckCircle2, type LucideIcon } from "lucide-react";
import type { CreatorCampaignService } from "@/features/creator-dashboard/types/creator-campaigns.types";

type CreatorCampaignPlanCardProps = {
    plan: CreatorCampaignService;
    icon: LucideIcon;
    iconClass: string;
    isPopular: boolean;
    onSelect?: (plan: CreatorCampaignService) => void;
};

const formatPrice = (price: number) =>
    new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
        maximumFractionDigits: 0,
    }).format(price);

export function CreatorCampaignPlanCard({
    plan,
    icon: Icon,
    iconClass,
    isPopular,
    onSelect,
}: CreatorCampaignPlanCardProps) {
    return (
        <div
            className={
                isPopular
                    ? "creator-shine-card group relative overflow-hidden rounded-[26px] p-0.5 shadow-[0_0_30px_rgba(250,204,21,0.15)] transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_0_40px_rgba(250,204,21,0.15)] md:scale-105"
                    : "creator-shine-card group relative overflow-hidden rounded-[26px] border border-white/10 shadow-[0_18px_60px_rgba(0,0,0,0.22)] transition-all duration-500 hover:-translate-y-2 hover:border-yellow-400/40 hover:shadow-[0_0_40px_rgba(250,204,21,0.15)]"
            }
        >
            {isPopular && (
                <div className="absolute -inset-full animate-[spin_8s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#121212_0%,#FACC15_50%,#121212_100%)] opacity-50 transition-opacity duration-500 group-hover:opacity-100" />
            )}
            <div className="relative flex h-full w-full flex-col overflow-hidden rounded-[26px] bg-white/[0.035] p-6">
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-yellow-400/[0.03] to-transparent" />
                {plan.isActive ? null : (
                    <div className="absolute right-4 top-4 rounded-full border border-yellow-400/30 bg-black/70 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-yellow-400">
                        Tạm dừng
                    </div>
                )}

                <div className="relative z-10">
                    <h3 className={`text-xl font-black text-zinc-50 mt-2`}>
                        {plan.name}
                    </h3>
                    <p className="mt-3 min-h-12 text-sm font-semibold leading-6 text-zinc-400">
                        {plan.description}
                    </p>
                    <div className="flex items-end gap-2">
                        <span className="text-3xl font-black tracking-tight text-zinc-50">
                            {formatPrice(plan.price)}
                        </span>
                    </div>
                </div>

                <ul className="relative z-10 mt-5 flex-1 space-y-4 text-sx font-bold leading-6 text-zinc-300">
                    <li className="flex items-start gap-3">
                        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-yellow-400" />
                        Mục tiêu hiển thị: {plan.targetValue} lượt
                    </li>
                </ul>

                <button
                    type="button"
                    disabled={!plan.isActive}
                    onClick={() => onSelect?.(plan)}
                    className={`creator-shine-card relative z-10 mt-8 h-12 rounded-2xl text-sm font-black transition disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-white/[0.04] disabled:text-zinc-500 disabled:shadow-none ${isPopular
                        ? "bg-yellow-400 text-black shadow-[0_4px_20px_rgba(250,204,21,0.18)] hover:bg-yellow-300 hover:shadow-[0_0_20px_rgba(250,204,21,0.4)]"
                        : "border border-yellow-400/30 bg-yellow-400/5 text-yellow-400 hover:bg-yellow-400 hover:text-black"
                        }`}
                >
                    Chọn gói
                </button>
            </div>
        </div>
    );
}
