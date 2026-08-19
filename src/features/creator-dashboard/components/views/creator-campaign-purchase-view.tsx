"use client";

import { useState } from "react";
import { BarChart3, Eye, Zap, type LucideIcon } from "lucide-react";
import { CreatorCampaignPlanList } from "./creator-campaign-plan-list";
import { CreatorCampaignCheckoutModal } from "./creator-campaign-checkout-modal";
import type { CreatorCampaignService } from "@/features/creator-dashboard/types/creator-campaigns.types";

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

const campaignBenefits: Array<{
  title: string;
  description: string;
  icon: LucideIcon;
}> = [
    {
      title: "Khán giả thực",
      description:
        "Tăng tiếp cận tới người dùng đang hoạt động trong hệ sinh thái TaleX.",
      icon: Eye,
    },
    {
      title: "Đảm bảo phân phối",
      description:
        "Phân phối nội dung cho đến khi đạt mục tiêu đã đặt ra.",
      icon: Zap,
    },
    {
      title: "Thống kê thời gian thực",
      description:
        "Theo dõi lượt xem, lượt thích và hiệu quả từng gói ngay trong dashboard.",
      icon: BarChart3,
    },
  ];

export function CreatorCampaignPurchaseView() {
  const [selectedPlan, setSelectedPlan] =
    useState<CreatorCampaignService | null>(null);

  return (
    <div className="space-y-8">
      <section className="creator-shine-card relative overflow-hidden rounded-[32px] border border-white/10 bg-white/[0.035] p-6 shadow-[0_24px_70px_rgba(0,0,0,0.24)] md:p-8">
        <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-creator-gold/10 blur-3xl" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(212,175,55,0.08),transparent_34%)]" />
        <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-center">
          <div className="max-w-3xl">
            <h1 className="font-heading text-3xl font-black tracking-tight text-white md:text-5xl">
              Dịch vụ tăng tương tác
            </h1>
          </div>
        </div>
      </section>

      <CreatorCampaignPlanList onSelectPlan={setSelectedPlan} />

      <section className="grid gap-4 md:grid-cols-3">
        {campaignBenefits.map((benefit) => {
          const Icon = benefit.icon;

          return (
            <div
              key={benefit.title}
              className="creator-shine-card group rounded-[26px] border border-white/10 bg-white/[0.035] p-5 shadow-[0_18px_60px_rgba(0,0,0,0.20)] transition-all duration-300 hover:-translate-y-1 hover:border-yellow-400/40 hover:bg-white/[0.055]"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-yellow-400/10 text-yellow-400">
                <Icon className="h-5 w-5 transition-transform group-hover:scale-110" />
              </div>
              <h3 className="mt-4 text-lg font-black text-zinc-50">
                {benefit.title}
              </h3>
              <p className="mt-2 text-sm font-semibold leading-6 text-zinc-400">
                {benefit.description}
              </p>
            </div>
          );
        })}
      </section>
      <CreatorCampaignCheckoutModal
        open={Boolean(selectedPlan)}
        plan={selectedPlan}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedPlan(null);
          }
        }}
      />
    </div>
  );
}
