"use client";

import { useRouter } from "next/navigation";
import { Ban, BookOpen, Check, Film, HelpCircle, Loader2, Smartphone } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useGetPremiumPackages } from "@/features/premium/api/premium.api";
import type { Subscription } from "@/features/admin/subscriptions/types/subscriptions.types";

type FeatureItem = {
  title: string;
  description: string;
  icon: LucideIcon;
};

const staticFeatures: FeatureItem[] = [
  {
    title: "Kho nội dung vô tận",
    description:
      "Từ những tác phẩm kinh điển đến bom tấn tương lai, TaleX Premium mở ra một thư viện giải trí luôn được làm mới.",
    icon: Film,
  },
  {
    title: "Đắm chìm không quảng cáo",
    description:
      "Trải nghiệm kể chuyện thuần túy không bị gián đoạn, để mỗi khoảnh khắc cao trào được giữ trọn nhịp cảm xúc.",
    icon: Ban,
  },
  {
    title: "Truyện tranh kỹ thuật số",
    description:
      "Truy cập các tiểu thuyết đồ họa độc quyền, những vũ trụ truyện tranh được tuyển chọn cho người đọc hiện đại.",
    icon: BookOpen,
  },
  {
    title: "Mọi lúc, mọi nơi",
    description:
      "Đồng bộ liền mạch tiến trình của bạn trên mọi thiết bị, tiếp tục câu chuyện đúng nơi bạn đã dừng lại.",
    icon: Smartphone,
  },
];

function formatCurrency(price: number) {
  return `${new Intl.NumberFormat("vi-VN").format(price)} VNĐ`;
}

function formatDuration(subscription: Subscription) {
  const unitMap: Record<string, string> = {
    Days: "ngày",
    Day: "ngày",
    DAYS: "ngày",
    DAY: "ngày",
    Months: "tháng",
    Month: "tháng",
    MONTHS: "tháng",
    MONTH: "tháng",
    Years: "năm",
    Year: "năm",
    YEARS: "năm",
    YEAR: "năm",
  };

  return `${subscription.duration} ${
    unitMap[subscription.durationUnit] ?? subscription.durationUnit
  }`;
}

function getBenefits(subscription: Subscription) {
  const benefits: string[] = [];

  if (subscription.isAdBlocked) {
    benefits.push("Trải nghiệm xem không quảng cáo");
  }

  if (subscription.isStoryUnlocked) {
    benefits.push("Đọc truyện tranh kỹ thuật số không giới hạn");
  }

  if (subscription.isMovieUnlocked) {
    benefits.push("Mở khóa toàn bộ kho phim & series");
  }

  benefits.push("Hỗ trợ chất lượng 4K HDR & Âm thanh vòm");

  return benefits;
}

function PricingCard({
  subscription,
  isPopular,
  onSelect,
}: {
  subscription: Subscription;
  isPopular: boolean;
  onSelect: (subscription: Subscription) => void;
}) {
  const benefits = getBenefits(subscription);

  return (
    <article
      className={`relative flex h-full flex-col rounded-2xl border bg-[#121214] p-6 shadow-2xl transition-all duration-300 hover:-translate-y-1 sm:p-7 ${
        isPopular
          ? "border-[#D4AF37] shadow-[0_0_38px_rgba(212,175,55,0.22)]"
          : "border-white/10 hover:border-white/20"
      }`}
    >
      {isPopular && (
        <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-full border border-[#D4AF37]/50 bg-[#D4AF37] px-4 py-1.5 text-[11px] font-black uppercase tracking-[0.18em] text-black shadow-[0_0_22px_rgba(212,175,55,0.45)]">
          PHỔ BIẾN NHẤT
        </div>
      )}

      <div className="flex flex-1 flex-col">
        <p className="font-heading text-2xl font-black tracking-tight text-white">
          {subscription.tier}
        </p>
        <p className="mt-3 min-h-12 text-sm font-medium leading-6 text-white/55">
          {subscription.description || "Gói Premium dành cho trải nghiệm TaleX trọn vẹn hơn."}
        </p>

        <div className="mt-7">
          <div className="flex items-end gap-2">
            <span className="font-heading text-3xl font-black tracking-tight text-[#D4AF37] sm:text-4xl">
              {formatCurrency(subscription.price)}
            </span>
          </div>
          <p className="mt-2 text-sm font-bold text-white/45">
            Hiệu lực {formatDuration(subscription)}
          </p>
        </div>

        <ul className="mt-7 flex flex-1 flex-col gap-3">
          {benefits.map((benefit) => (
            <li key={benefit} className="flex gap-3 text-sm font-semibold leading-6 text-white/78">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#D4AF37]/15 text-[#D4AF37]">
                <Check className="h-3.5 w-3.5" />
              </span>
              <span>{benefit}</span>
            </li>
          ))}
        </ul>

        <button
          type="button"
          onClick={() => onSelect(subscription)}
          className="mt-8 flex h-12 w-full items-center justify-center rounded-xl bg-[#D4AF37] px-5 text-sm font-black text-black shadow-[0_0_20px_rgba(212,175,55,0.28)] transition hover:bg-[#E5C158] hover:shadow-[0_0_28px_rgba(212,175,55,0.42)] active:translate-y-px"
        >
          Chọn Gói Này
        </button>
      </div>
    </article>
  );
}

function PricingSkeleton() {
  return (
    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 3 }).map((_, index) => (
        <div
          key={index}
          className="min-h-[420px] animate-pulse rounded-2xl border border-white/10 bg-[#121214] p-6"
        >
          <div className="h-7 w-36 rounded-full bg-white/10" />
          <div className="mt-5 h-4 w-full rounded-full bg-white/10" />
          <div className="mt-3 h-4 w-4/5 rounded-full bg-white/10" />
          <div className="mt-10 h-10 w-48 rounded-full bg-[#D4AF37]/20" />
          <div className="mt-8 space-y-4">
            <div className="h-4 w-full rounded-full bg-white/10" />
            <div className="h-4 w-5/6 rounded-full bg-white/10" />
            <div className="h-4 w-4/6 rounded-full bg-white/10" />
          </div>
          <div className="mt-10 h-12 rounded-xl bg-[#D4AF37]/20" />
        </div>
      ))}
    </div>
  );
}

export default function PremiumPage() {
  const router = useRouter();
  const packagesQuery = useGetPremiumPackages();
  const packages = packagesQuery.data?.data.content ?? [];
  const highestPrice = packages.reduce(
    (highest, subscription) => Math.max(highest, subscription.price),
    0,
  );

  const handleSelectSubscription = (subscription: Subscription) => {
    router.push(`/checkout?subscriptionId=${subscription.subscriptionId}`);
  };

  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="relative overflow-hidden border-b border-white/10 bg-neutral-950">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_10%,rgba(212,175,55,0.16),transparent_34%),radial-gradient(circle_at_10%_20%,rgba(151,176,255,0.10),transparent_28%)]" />
        <div className="relative mx-auto flex min-h-[440px] w-full max-w-7xl flex-col items-center justify-center px-4 py-24 text-center sm:px-6 lg:px-8">
          <span className="rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-[#D4AF37]">
            TaleX Universe
          </span>
          <h1 className="mt-7 font-heading text-5xl font-black tracking-tight text-white sm:text-6xl lg:text-7xl">
            TaleX Premium
          </h1>
          <p className="mt-6 max-w-3xl font-sans text-base font-medium leading-8 text-white/68 sm:text-lg">
            Nâng tầm trải nghiệm với quyền truy cập độc quyền vào kho tàng điện ảnh,
            series và truyện tranh kỹ thuật số.
          </p>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.22em] text-[#D4AF37]">
              Gói thành viên
            </p>
            <h2 className="mt-3 font-heading text-3xl font-black tracking-tight text-white sm:text-4xl">
              Chọn trải nghiệm dành cho bạn
            </h2>
          </div>
          <p className="max-w-xl text-sm font-medium leading-6 text-white/55">
            Dữ liệu gói được đồng bộ trực tiếp từ hệ thống TaleX, sẵn sàng kết nối
            thanh toán khi backend mở cổng mua gói.
          </p>
        </div>

        {packagesQuery.isLoading && <PricingSkeleton />}

        {packagesQuery.isError && (
          <div className="flex min-h-[260px] flex-col items-center justify-center rounded-2xl border border-red-400/20 bg-red-400/[0.06] px-6 text-center">
            <Loader2 className="mb-4 h-7 w-7 text-red-200" />
            <h3 className="font-heading text-xl font-bold text-white">
              Không thể tải danh sách gói Premium
            </h3>
            <p className="mt-2 max-w-md text-sm font-medium leading-6 text-red-100/70">
              Vui lòng kiểm tra kết nối API `/api/v1/subscriptions` hoặc thử lại sau.
            </p>
          </div>
        )}

        {!packagesQuery.isLoading && !packagesQuery.isError && packages.length === 0 && (
          <div className="flex min-h-[260px] flex-col items-center justify-center rounded-2xl border border-dashed border-white/15 bg-white/[0.03] px-6 text-center">
            <HelpCircle className="mb-4 h-8 w-8 text-[#D4AF37]" />
            <h3 className="font-heading text-xl font-bold text-white">
              Chưa có gói Premium nào
            </h3>
            <p className="mt-2 max-w-md text-sm font-medium leading-6 text-white/50">
              Khi admin cấu hình gói Premium, danh sách sẽ tự động xuất hiện tại đây.
            </p>
          </div>
        )}

        {!packagesQuery.isLoading && !packagesQuery.isError && packages.length > 0 && (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {packages.map((subscription) => {
              const isPopular =
                subscription.tier.toLowerCase().includes("premium") ||
                subscription.price === highestPrice;

              return (
                <PricingCard
                  key={subscription.subscriptionId}
                  subscription={subscription}
                  isPopular={isPopular}
                  onSelect={handleSelectSubscription}
                />
              );
            })}
          </div>
        )}
      </section>

      <section className="border-y border-white/10 bg-white/[0.03]">
        <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="mb-10 max-w-2xl">
            <p className="text-sm font-black uppercase tracking-[0.22em] text-[#D4AF37]">
              Quyền lợi nổi bật
            </p>
            <h2 className="mt-3 font-heading text-3xl font-black tracking-tight text-white sm:text-4xl">
              Một tài khoản, toàn bộ vũ trụ TaleX
            </h2>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            {staticFeatures.map((feature) => {
              const Icon = feature.icon;

              return (
                <article
                  key={feature.title}
                  className="rounded-2xl border border-white/10 bg-neutral-950/72 p-6 transition hover:border-[#D4AF37]/35 hover:bg-neutral-950 sm:p-7"
                >
                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl border border-[#D4AF37]/25 bg-[#D4AF37]/10 text-[#D4AF37]">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="font-heading text-xl font-black text-white">
                    {feature.title}
                  </h3>
                  <p className="mt-3 text-sm font-medium leading-7 text-white/58">
                    {feature.description}
                  </p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-white/10 bg-[#121214] px-6 py-10 text-center shadow-2xl sm:px-10">
          <h2 className="font-heading text-3xl font-black tracking-tight text-white">
            Bạn vẫn còn câu hỏi?
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm font-medium leading-7 text-white/55">
            Đội ngũ TaleX luôn sẵn sàng hỗ trợ về gói Premium, thanh toán và quyền lợi tài khoản.
          </p>
          <a
            href="/faq"
            className="mt-6 inline-flex items-center justify-center text-sm font-black text-[#D4AF37] transition hover:text-[#E5C158]"
          >
            Truy cập Trung tâm hỗ trợ -&gt;
          </a>
        </div>
      </section>
    </main>
  );
}
