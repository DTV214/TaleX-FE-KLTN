"use client";

import {
  BarChart3,
  CheckCircle2,
  Crown,
  Eye,
  Rocket,
  Zap,
  type LucideIcon,
} from "lucide-react";

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

const campaignPlans = [
  {
    name: "Gói Khởi Động",
    price: "50.000 VNĐ",
    description: "Thử sức đẩy tương tác cho series mới ra mắt.",
    benefits: ["5.000 Lượt xem", "100 Lượt thích", "Ưu tiên hiển thị 24 giờ"],
    icon: Zap,
    iconClass: "text-zinc-400",
  },
  {
    name: "Gói Xu Hướng",
    price: "150.000 VNĐ",
    description: "Tăng tốc để tác phẩm lọt vào dòng đề xuất nổi bật.",
    popular: true,
    benefits: [
      "20.000 Lượt xem",
      "1.000 Lượt thích",
      "Đề xuất trang chủ",
      "Tối ưu tệp khán giả bằng AI",
    ],
    icon: Rocket,
    iconClass: "text-yellow-400 group-hover:animate-bounce",
  },
  {
    name: "Gói Toàn Cầu",
    price: "500.000 VNĐ",
    description: "Phủ sóng mạnh cho chiến dịch ra mắt hoặc mùa mới.",
    benefits: [
      "100.000 Lượt xem",
      "5.000 Lượt thích",
      "Thông báo Push toàn hệ thống",
      "Báo cáo hiệu suất nâng cao",
    ],
    icon: Crown,
    iconClass: "text-zinc-400 group-hover:animate-pulse",
  },
];

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
    title: "AI Target chuẩn xác",
    description:
      "Phân phối nội dung theo thể loại, hành vi đọc/xem và lịch sử tương tác.",
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
  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-[28px] border border-white/10 bg-[#121212] p-6 shadow-[0_4px_20px_rgba(0,0,0,0.4)] md:p-8">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-center">
          <div>
            <h2 className="mt-4 text-4xl font-black tracking-tight text-zinc-50 md:text-5xl">
              Dịch Vụ Tăng Tương Tác
            </h2>
            <p className="mt-4 max-w-2xl text-base font-semibold leading-7 text-zinc-400">
              Đẩy tác phẩm của bạn tới nhiều độc giả và khán giả, tăng tốc lượt
              xem, lượt thích và cơ hội xuất hiện trên các khu vực đề xuất.
            </p>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-8 md:grid-cols-3">
        {campaignPlans.map((plan) => {
          const Icon = plan.icon;
          const content = (
            <div className="relative flex h-full w-full flex-col overflow-hidden rounded-2xl bg-[#121212] p-6">
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-yellow-400/[0.03] to-transparent" />
              {plan.popular && (
                <div className="absolute left-1/2 top-3 z-10 -translate-x-1/2 rounded-full bg-yellow-400 px-4 py-1.5 text-xs font-black uppercase tracking-[0.12em] text-black shadow-[0_0_24px_rgba(250,204,21,0.25)]">
                  Phổ biến nhất
                </div>
              )}

              <div className="relative z-10">
                <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/[0.04]">
                  <Icon
                    className={cx("h-6 w-6 transition-transform", plan.iconClass)}
                  />
                </div>
                <h3
                  className={cx(
                    "text-xl font-black text-zinc-50",
                    plan.popular ? "mt-8" : "mt-5",
                  )}
                >
                  {plan.name}
                </h3>
                <p className="mt-3 min-h-12 text-sm font-semibold leading-6 text-zinc-400">
                  {plan.description}
                </p>
                <div className="mt-6 flex items-end gap-2">
                  <span className="text-3xl font-black tracking-tight text-zinc-50">
                    {plan.price}
                  </span>
                </div>
              </div>

              <ul className="relative z-10 mt-7 flex-1 space-y-4">
                {plan.benefits.map((benefit) => (
                  <li
                    key={benefit}
                    className="flex items-start gap-3 text-sm font-bold leading-6 text-zinc-300"
                  >
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-yellow-400" />
                    {benefit}
                  </li>
                ))}
              </ul>

              <button
                type="button"
                className={cx(
                  "relative z-10 mt-8 h-12 rounded-xl text-sm font-black transition",
                  plan.popular
                    ? "bg-yellow-400 text-black shadow-[0_4px_20px_rgba(250,204,21,0.18)] hover:bg-yellow-300 hover:shadow-[0_0_20px_rgba(250,204,21,0.4)]"
                    : "border border-yellow-400/30 bg-yellow-400/5 text-yellow-400 hover:bg-yellow-400 hover:text-black",
                )}
              >
                Mua Gói Này
              </button>
            </div>
          );

          if (plan.popular) {
            return (
              <div
                key={plan.name}
                className="group relative overflow-hidden rounded-2xl p-[2px] shadow-[0_0_30px_rgba(250,204,21,0.15)] transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_0_40px_rgba(250,204,21,0.15)] md:scale-105"
              >
                <div className="absolute inset-[-100%] animate-[spin_8s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#121212_0%,#FACC15_50%,#121212_100%)] opacity-50 transition-opacity duration-500 group-hover:opacity-100" />
                {content}
              </div>
            );
          }

          return (
            <div
              key={plan.name}
              className="group relative overflow-hidden rounded-2xl border border-white/10 shadow-[0_4px_20px_rgba(0,0,0,0.4)] transition-all duration-500 hover:-translate-y-2 hover:border-yellow-400/40 hover:shadow-[0_0_40px_rgba(250,204,21,0.15)]"
            >
              {content}
            </div>
          );
        })}
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {campaignBenefits.map((benefit) => {
          const Icon = benefit.icon;

          return (
            <div
              key={benefit.title}
              className="group rounded-2xl border border-white/10 bg-[#121212] p-5 shadow-[0_4px_20px_rgba(0,0,0,0.4)] transition-all duration-300 hover:-translate-y-1 hover:border-yellow-400/40"
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
    </div>
  );
}
