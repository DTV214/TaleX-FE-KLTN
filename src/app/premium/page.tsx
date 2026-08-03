"use client";

import * as React from "react";
import Autoplay from "embla-carousel-autoplay";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  BookOpen,
  Crown,
  Gem,
  HelpCircle,
  Loader2,
  PlayCircle,
  ShieldCheck,
  TrendingUp,
  Users,
  type LucideIcon,
} from "lucide-react";

import { useGetPremiumPackages } from "@/features/premium/api/premium.api";
import { useAuthStore } from "@/features/auth/store/auth.store";
import type { Subscription } from "@/features/admin/subscriptions/types/subscriptions.types";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/shared/ui/carousel";
import { Progress } from "@/shared/ui/progress";
import { cn } from "@/shared/utils/utils";

type BenefitItem = {
  label: string;
  icon: LucideIcon;
};

const heroSlides = [
  {
    eyebrow: "TaleX Premium",
    title: "Mở khóa thế giới TaleX",
    description: "Xem phim, đọc truyện và giữ mạch trải nghiệm liền lạc hơn.",
    badge: "Không quảng cáo",
    gradient: "from-[#1A1309] via-[#0B0B0E] to-[#090A12]",
    image:
      "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=1600&auto=format&fit=crop",
  },
  {
    eyebrow: "Original Worlds",
    title: "Tiếp tục câu chuyện của bạn",
    description: "Đọc và xem đúng nơi bạn dừng lại, trên mọi thiết bị.",
    badge: "4K HDR ready",
    gradient: "from-[#0E121C] via-[#090A0D] to-[#120B10]",
    image:
      "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?q=80&w=1600&auto=format&fit=crop",
  },
  {
    eyebrow: "Creator Premium",
    title: "Chọn gói, mở khóa ngay",
    description: "Gói Premium đồng bộ trực tiếp từ hệ thống TaleX.",
    badge: "Thanh toán an toàn",
    gradient: "from-[#10100D] via-[#090909] to-[#111315]",
    image:
      "https://images.unsplash.com/photo-1497015289639-54688650d173?q=80&w=1600&auto=format&fit=crop",
  },
];

const trendSignals = [
  {
    label: "Viewer momentum",
    value: "82%",
    detail: "ưu tiên combo",
    icon: TrendingUp,
  },
  {
    label: "Watch flow",
    value: "2.4x",
    detail: "xem liền mạch hơn",
    icon: PlayCircle,
  },
  {
    label: "Premium habit",
    value: "68%",
    detail: "quay lại trong tuần",
    icon: Users,
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

function getDurationProgress(subscription: Subscription) {
  const normalizedUnit = subscription.durationUnit.toLowerCase();

  if (normalizedUnit.includes("year")) return 100;
  if (normalizedUnit.includes("month")) return Math.min(92, 45 + subscription.duration * 8);
  return Math.min(78, 24 + subscription.duration * 4);
}

function getBenefits(subscription: Subscription): BenefitItem[] {
  const benefits: BenefitItem[] = [];

  if (subscription.isAdBlocked) {
    benefits.push({
      label: "Không quảng cáo",
      icon: ShieldCheck,
    });
  }

  if (subscription.isStoryUnlocked) {
    benefits.push({
      label: "Mở khóa truyện",
      icon: BookOpen,
    });
  }

  if (subscription.isMovieUnlocked) {
    benefits.push({
      label: "Mở khóa phim & series",
      icon: PlayCircle,
    });
  }

  benefits.push({
    label: "Hỗ trợ 4K HDR",
    icon: Gem,
  });

  return benefits;
}

function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
      <div className="max-w-3xl">
        <p className="text-sm font-medium text-[#D4AF37]">
          {eyebrow}
        </p>
        <h2 className="mt-2 text-xl font-semibold tracking-normal text-white/90 sm:text-2xl">
          {title}
        </h2>
      </div>
      {description ? (
        <p className="max-w-xl text-sm font-medium leading-6 text-slate-400">
          {description}
        </p>
      ) : null}
    </div>
  );
}

function PremiumHero() {
  const carouselPlugins = React.useMemo(
    () => [
      Autoplay({
        delay: 8200,
        stopOnInteraction: true,
        stopOnMouseEnter: true,
      }),
    ],
    [],
  );

  return (
    <section className="relative overflow-hidden bg-[#070707]">
      <Carousel
        opts={{ loop: true, duration: 24 }}
        plugins={carouselPlugins}
        className="w-full"
      >
        <CarouselContent className="ml-0">
          {heroSlides.map((slide) => (
            <CarouselItem key={slide.title} className="pl-0">
              <div
                className={cn(
                  "relative min-h-[240px] overflow-hidden bg-gradient-to-br md:min-h-[280px]",
                  slide.gradient,
                )}
              >
                <div
                  className="absolute inset-0 bg-cover bg-center opacity-35 saturate-[0.82]"
                  style={{ backgroundImage: `url(${slide.image})` }}
                />
                <div className="absolute inset-0 bg-gradient-to-br from-[#050505]/78 via-[#090909]/72 to-[#050505]/86" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_10%,rgba(212,175,55,0.16),transparent_32%),radial-gradient(circle_at_78%_18%,rgba(151,176,255,0.10),transparent_28%)]" />
                <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#080808] to-transparent" />
                <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.58),rgba(0,0,0,0.22),rgba(0,0,0,0.58))]" />
                <div className="relative z-10 mx-auto flex min-h-[240px] w-full max-w-6xl items-center justify-center px-4 py-8 text-center md:min-h-[280px]">
                  <div className="mx-auto max-w-3xl">
                    <Badge variant="premium" className="px-3 py-1 text-xs font-medium">
                      {slide.eyebrow}
                    </Badge>
                    <h1 className="mt-4 text-2xl font-semibold tracking-normal text-white/90 sm:text-3xl">
                      {slide.title}
                    </h1>
                    <p className="mx-auto mt-3 max-w-xl text-sm font-normal leading-6 text-slate-300">
                      {slide.description}
                    </p>
                    <div className="mt-6 flex items-center justify-center gap-3">
                      <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-xs font-medium text-slate-300 backdrop-blur-md">
                        {slide.badge}
                      </span>
                      <span className="rounded-full border border-[#D4AF37]/25 bg-[#D4AF37]/10 px-3 py-1.5 text-xs font-medium text-[#F5D46E]">
                        TaleX Universe
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="hidden sm:inline-flex" />
        <CarouselNext className="hidden sm:inline-flex" />
      </Carousel>
    </section>
  );
}

function PricingSkeleton() {
  return (
    <div className="mx-auto grid max-w-6xl gap-5 lg:grid-cols-3">
      {Array.from({ length: 3 }).map((_, index) => (
        <div
          key={index}
          className="min-h-[360px] animate-pulse rounded-2xl border border-white/10 bg-[#121214] p-5"
        >
          <div className="h-6 w-28 rounded-full bg-white/10" />
          <div className="mt-5 h-8 w-40 rounded-full bg-white/10" />
          <div className="mt-5 h-4 w-full rounded-full bg-white/10" />
          <div className="mt-3 h-4 w-4/5 rounded-full bg-white/10" />
          <div className="mt-10 h-11 w-52 rounded-full bg-[#D4AF37]/20" />
          <div className="mt-8 h-2 rounded-full bg-white/10" />
          <div className="mt-8 space-y-4">
            <div className="h-4 w-full rounded-full bg-white/10" />
            <div className="h-4 w-5/6 rounded-full bg-white/10" />
            <div className="h-4 w-4/6 rounded-full bg-white/10" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex min-h-[200px] flex-col items-center justify-center rounded-2xl border border-dashed border-white/15 bg-white/[0.03] px-6 text-center">
      <HelpCircle className="mb-4 h-8 w-8 text-[#D4AF37]" />
      <h3 className="text-lg font-semibold text-white/90">{title}</h3>
      <p className="mt-2 max-w-md text-sm font-medium leading-6 text-slate-400">
        {description}
      </p>
    </div>
  );
}

function ErrorState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex min-h-[200px] flex-col items-center justify-center rounded-2xl border border-red-400/20 bg-red-400/[0.06] px-6 text-center">
      <Loader2 className="mb-4 h-7 w-7 text-red-200" />
      <h3 className="text-lg font-semibold text-white/90">{title}</h3>
      <p className="mt-2 max-w-md text-sm font-medium leading-6 text-red-100/70">
        {description}
      </p>
    </div>
  );
}

function PricingCard({
  subscription,
  rank,
  isPopular,
  onSelect,
}: {
  subscription: Subscription;
  rank: number;
  isPopular: boolean;
  onSelect: (subscription: Subscription) => void;
}) {
  const benefits = getBenefits(subscription);
  const progress = getDurationProgress(subscription);

  return (
    <article
      className={cn(
        "group relative flex h-full min-h-[340px] flex-col overflow-hidden rounded-2xl border bg-[#121214]/95 p-4 shadow-2xl transition-all duration-300 hover:-translate-y-1 sm:p-5",
        isPopular
          ? "border-[#D4AF37] pt-10 shadow-[0_0_24px_rgba(212,175,55,0.14)]"
          : "border-white/10 hover:border-white/20",
      )}
    >
      <div
        className={cn(
          "pointer-events-none absolute -inset-24 bg-[conic-gradient(from_0deg,transparent_0deg,rgba(212,175,55,0.40)_54deg,transparent_112deg,transparent_360deg)] opacity-0 blur-sm transition-opacity duration-500 group-hover:opacity-25",
          isPopular && "opacity-20 group-hover:opacity-35",
        )}
        style={{ animation: "spin 18s linear infinite" }}
      />
      <div className="pointer-events-none absolute inset-px rounded-[15px] bg-[#121214]/95" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(212,175,55,0.14),transparent_36%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      {isPopular ? (
        <Badge
          variant="premium"
          className="absolute left-1/2 top-4 z-20 -translate-x-1/2 px-3 py-1 text-xs font-medium"
        >
          Phổ biến nhất
        </Badge>
      ) : null}

      <div className="relative z-10 flex flex-1 flex-col">
        <div className="flex items-center justify-between gap-3">
          <Badge variant="outline" className="border-white/10 bg-white/[0.04] text-slate-300">
            Top {rank}
          </Badge>
          <Crown
            className={cn(
              "h-5 w-5 transition-colors",
              isPopular ? "text-[#D4AF37]" : "text-slate-500 group-hover:text-[#D4AF37]",
            )}
          />
        </div>

        <h3 className="mt-4 text-lg font-semibold tracking-normal text-white/90">
          {subscription.tier}
        </h3>
        <p className="mt-2 line-clamp-2 text-sm font-normal leading-6 text-slate-400">
          {subscription.description ||
            "Trải nghiệm TaleX trọn vẹn hơn."}
        </p>

        <div className="mt-4">
          <p className="text-2xl font-semibold tracking-normal text-[#F5D46E]">
            {formatCurrency(subscription.price)}
          </p>
          <p className="mt-1 text-sm font-medium text-slate-400">
            Hiệu lực {formatDuration(subscription)}
          </p>
        </div>

        <div className="mt-4 rounded-xl border border-white/10 bg-black/25 p-3">
          <div className="mb-2 flex items-center justify-between text-xs font-medium text-slate-400">
            <span>Chu kỳ gói</span>
            <span className="text-[#F5D46E]">{progress}%</span>
          </div>
          <Progress value={progress} />
          <div className="mt-3 grid grid-cols-3 gap-2 text-center text-[11px] font-medium text-slate-500">
            <span>Bắt đầu</span>
            <span>Gia hạn</span>
            <span>Ưu tiên</span>
          </div>
        </div>

        <ul className="mt-4 flex flex-1 flex-col gap-2.5">
          {benefits.map((benefit) => {
            const Icon = benefit.icon;

            return (
              <li
                key={benefit.label}
                className="flex gap-3 text-sm font-medium leading-5 text-slate-300"
              >
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#D4AF37]/12 text-[#D4AF37]">
                  <Icon className="h-3.5 w-3.5" />
                </span>
                <span>{benefit.label}</span>
              </li>
            );
          })}
        </ul>

        <Button
          type="button"
          onClick={() => onSelect(subscription)}
          className="mt-5 h-10 w-full rounded-xl bg-[#D4AF37] text-sm font-semibold text-black shadow-[0_0_16px_rgba(212,175,55,0.18)] hover:bg-[#F3CE5E]"
        >
          Chọn gói này
          <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover/button:translate-x-1" />
        </Button>
      </div>
    </article>
  );
}

function PricingSection() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const packagesQuery = useGetPremiumPackages();
  const packages = packagesQuery.data?.data.content ?? [];
  const rankedPackages = [...packages]
    .sort((first, second) => second.price - first.price)
    .slice(0, 3);
  const displayedPackages =
    rankedPackages.length >= 3
      ? [rankedPackages[1], rankedPackages[0], rankedPackages[2]]
      : rankedPackages;
  const popularPackageId = rankedPackages[0]?.subscriptionId ?? "";

  const handleSelectSubscription = (subscription: Subscription) => {
    const checkoutUrl = `/checkout?subscriptionId=${subscription.subscriptionId}`;

    if (!isAuthenticated) {
      router.push(`/login?callbackUrl=${encodeURIComponent(checkoutUrl)}`);
      return;
    }

    router.push(checkoutUrl);
  };

  return (
    <section className="relative overflow-hidden border-y border-white/10 bg-[#090909] py-8 lg:py-10">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_0%,rgba(212,175,55,0.12),transparent_34%),radial-gradient(circle_at_88%_24%,rgba(151,176,255,0.08),transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.035),transparent_38%)]" />
      <div className="pointer-events-none absolute left-1/2 top-20 h-px w-[72rem] -translate-x-1/2 bg-gradient-to-r from-transparent via-[#D4AF37]/35 to-transparent" />
      <div className="relative z-10 mx-auto w-full max-w-6xl px-4">
        <SectionHeading
          eyebrow="Gói thành viên"
          title="Chọn gói Premium"
          description="Gói được đồng bộ từ hệ thống TaleX."
        />

        {packagesQuery.isLoading && <PricingSkeleton />}

        {packagesQuery.isError && (
          <ErrorState
            title="Không thể tải danh sách gói Premium"
            description="Vui lòng thử lại sau."
          />
        )}

        {!packagesQuery.isLoading && !packagesQuery.isError && packages.length === 0 && (
          <EmptyState
            title="Chưa có gói Premium nào"
            description="Gói sẽ xuất hiện khi admin cấu hình."
          />
        )}

        {!packagesQuery.isLoading && !packagesQuery.isError && displayedPackages.length > 0 && (
          <div
            className={cn(
              "grid gap-4 pt-2",
              displayedPackages.length === 1
                ? "mx-auto max-w-md"
                : "lg:grid-cols-3 lg:items-center",
            )}
          >
            {displayedPackages.map((subscription) => {
              const rankIndex =
                rankedPackages.findIndex(
                  (item) => item.subscriptionId === subscription.subscriptionId,
                ) + 1;

              return (
                <PricingCard
                  key={subscription.subscriptionId}
                  subscription={subscription}
                  rank={rankIndex}
                  isPopular={subscription.subscriptionId === popularPackageId}
                  onSelect={handleSelectSubscription}
                />
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

function AudienceTrendBanner() {
  return (
    <section className="relative overflow-hidden bg-[#080808] py-8">
      <div className="mx-auto w-full max-w-6xl px-4">
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#121214] p-5 shadow-2xl">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_10%,rgba(212,175,55,0.13),transparent_32%),radial-gradient(circle_at_88%_16%,rgba(151,176,255,0.10),transparent_28%)]" />
          <div className="relative z-10 grid gap-5 lg:grid-cols-[1.05fr_1.3fr] lg:items-center">
            <div>
              <Badge variant="premium" className="mb-3 px-3 py-1 text-xs font-medium">
                Xu hướng
              </Badge>
              <h2 className="text-xl font-semibold tracking-normal text-white/90 sm:text-2xl">
                Trải nghiệm trọn mạch hơn
              </h2>
              <p className="mt-3 text-sm font-normal leading-6 text-slate-400">
                Chọn gói nhanh, mở khóa rõ ràng, tiếp tục câu chuyện liền mạch.
              </p>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              {trendSignals.map((signal) => {
                const Icon = signal.icon;

                return (
                  <div
                    key={signal.label}
                    className="group rounded-xl border border-white/10 bg-black/30 p-4 transition-all duration-300 hover:-translate-y-1 hover:border-[#D4AF37]/35 hover:bg-black/45"
                  >
                    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl border border-[#D4AF37]/20 bg-[#D4AF37]/10 text-[#D4AF37]">
                      <Icon className="h-5 w-5" />
                    </div>
                    <p className="text-2xl font-semibold text-white/90">
                      {signal.value}
                    </p>
                    <p className="mt-1 text-xs font-medium text-[#D4AF37]">
                      {signal.label}
                    </p>
                    <p className="mt-2 text-sm font-normal leading-6 text-slate-400">
                      {signal.detail}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function PremiumPage() {
  return (
    <main className="min-h-screen bg-[#080808] text-white">
      <PremiumHero />
      <PricingSection />
      <AudienceTrendBanner />
    </main>
  );
}
