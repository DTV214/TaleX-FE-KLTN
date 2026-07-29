"use client";

import { AlertCircle, Loader2, Rocket, Zap, Crown } from "lucide-react";
import { useGetCreatorCampaignPlans } from "@/features/creator-dashboard/hooks/use-creator-campaigns";
import { CreatorCampaignPlanCard } from "./creator-campaign-plan-card";
import type { CreatorCampaignService } from "@/features/creator-dashboard/types/creator-campaigns.types";

const planIconMap = {
    default: Zap,
    premium: Crown,
    trending: Rocket,
};

function selectPlanIcon(plan: CreatorCampaignService) {
    if (plan.price >= 50000) {
        return planIconMap.premium;
    }

    if (plan.price >= 15000) {
        return planIconMap.trending;
    }

    return planIconMap.default;
}

export function CreatorCampaignPlanList() {
    const { data, isLoading, isError, error, isFetching } =
        useGetCreatorCampaignPlans({ page: 1, pageSize: 20 });

    if (isLoading) {
        return (
            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
                {[1, 2, 3].map((index) => (
                    <div
                        key={index}
                        className="rounded-2xl border border-white/10 bg-[#121212] p-6 shadow-[0_4px_20px_rgba(0,0,0,0.4)]"
                    >
                        <div className="flex h-12 w-12 animate-pulse rounded-full bg-white/10" />
                        <div className="mt-6 h-6 w-3/4 animate-pulse rounded bg-white/10" />
                        <div className="mt-4 h-4 w-1/2 animate-pulse rounded bg-white/10" />
                        <div className="mt-8 space-y-3">
                            <div className="h-3 w-full animate-pulse rounded bg-white/10" />
                            <div className="h-3 w-5/6 animate-pulse rounded bg-white/10" />
                            <div className="h-3 w-3/4 animate-pulse rounded bg-white/10" />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (isError) {
        return (
            <div className="rounded-2xl border border-red-400/20 bg-[#1f1f1f] p-6 text-red-200">
                <div className="flex items-center gap-3 text-sm font-semibold">
                    <AlertCircle className="h-5 w-5" />
                    Không thể tải gói chiến dịch.
                </div>
                <p className="mt-3 text-sm text-zinc-400">
                    {(error as Error)?.message || "Vui lòng thử lại sau."}
                </p>
            </div>
        );
    }

    const plans: CreatorCampaignService[] = data?.content ?? [];

    if (plans.length === 0) {
        return (
            <div className="rounded-2xl border border-white/10 bg-[#121212] p-10 text-center text-zinc-300">
                <p className="text-lg font-semibold">Hiện chưa có gói dịch vụ nào.</p>
                <p className="mt-2 text-sm text-zinc-500">
                    Vui lòng quay lại sau hoặc liên hệ bộ phận hỗ trợ.
                </p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {plans.map((plan) => (
                <CreatorCampaignPlanCard
                    key={plan.engagementServiceId}
                    plan={plan}
                    icon={selectPlanIcon(plan)}
                    iconClass={plan.isActive ? "text-yellow-400" : "text-zinc-400"}
                    isPopular={plan.price >= 150000}
                />
            ))}
            {isFetching && (
                <div className="col-span-full rounded-2xl border border-white/10 bg-[#121212] p-6 text-sm text-zinc-400">
                    <Loader2 className="mr-2 inline h-4 w-4 animate-spin" />
                    Đang cập nhật dữ liệu...
                </div>
            )}
        </div>
    );
}
