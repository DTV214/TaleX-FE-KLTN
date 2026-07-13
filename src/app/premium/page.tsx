"use client";

import * as React from "react";
import Autoplay from "embla-carousel-autoplay";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Ban,
  BookOpen,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock3,
  Crown,
  Film,
  Gem,
  Headphones,
  HelpCircle,
  Infinity,
  Layers,
  Loader2,
  Paperclip,
  PlayCircle,
  Radio,
  ShieldCheck,
  Sparkles,
  Star,
  TrendingUp,
  Tv,
  Users,
  type LucideIcon,
} from "lucide-react";

import { useGetPremiumPackages } from "@/features/premium/api/premium.api";
import type { Subscription } from "@/features/admin/subscriptions/types/subscriptions.types";
import {
  type PublicCombo,
  type PublicComboEpisode,
} from "@/features/public/api/public-content.api";
import { useGetPublicCombos } from "@/features/public/hooks/use-public-combos";
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

type FeatureItem = {
  title: string;
  description: string;
  icon: LucideIcon;
};

type BenefitItem = {
  label: string;
  icon: LucideIcon;
};

const heroSlides = [
  {
    eyebrow: "TaleX Premium",
    title: "Rạp chiếu riêng cho mọi vũ trụ bạn yêu",
    description:
      "Mở khóa phim, series và truyện tranh kỹ thuật số trong một trải nghiệm cinematic mềm, sâu và không bị ngắt mạch.",
    badge: "Không quảng cáo",
    gradient: "from-[#1A1309] via-[#0B0B0E] to-[#090A12]",
    image:
      "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=1600&auto=format&fit=crop",
  },
  {
    eyebrow: "Original Worlds",
    title: "Câu chuyện liền mạch từ màn ảnh đến trang truyện",
    description:
      "Theo dõi các universe độc quyền, đọc tiếp đúng nơi bạn dừng lại và tận hưởng chất lượng hiển thị trọn vẹn hơn.",
    badge: "4K HDR ready",
    gradient: "from-[#0E121C] via-[#090A0D] to-[#120B10]",
    image:
      "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?q=80&w=1600&auto=format&fit=crop",
  },
  {
    eyebrow: "Creator Premium",
    title: "Đặc quyền dành cho người xem nghiêm túc",
    description:
      "Các gói thành viên được đồng bộ từ hệ thống TaleX, sẵn sàng đưa bạn đến checkout ngay khi chọn trải nghiệm phù hợp.",
    badge: "Thanh toán an toàn",
    gradient: "from-[#10100D] via-[#090909] to-[#111315]",
    image:
      "https://images.unsplash.com/photo-1497015289639-54688650d173?q=80&w=1600&auto=format&fit=crop",
  },
];

const featuredBenefits: FeatureItem[] = [
  {
    title: "Kho nội dung vô tận",
    description:
      "Từ tác phẩm kinh điển đến series mới, TaleX Premium giữ thư viện giải trí luôn được làm mới.",
    icon: Infinity,
  },
  {
    title: "Không quảng cáo",
    description:
      "Giữ trọn nhịp cảm xúc ở các khoảnh khắc cao trào mà không bị gián đoạn bởi quảng cáo.",
    icon: Ban,
  },
  {
    title: "Truyện tranh kỹ thuật số",
    description:
      "Truy cập các tiểu thuyết đồ họa, webcomic và universe truyện được tuyển chọn cho độc giả hiện đại.",
    icon: BookOpen,
  },
  {
    title: "Phim & series mở khóa",
    description:
      "Thưởng thức nội dung độc quyền với trải nghiệm xem mượt, rõ và có chiều sâu hơn.",
    icon: Film,
  },
  {
    title: "Đồng bộ đa thiết bị",
    description:
      "Tiếp tục câu chuyện đúng vị trí đã dừng trên điện thoại, laptop hoặc màn hình lớn.",
    icon: Tv,
  },
  {
    title: "Hỗ trợ ưu tiên",
    description:
      "Đội ngũ TaleX hỗ trợ nhanh hơn cho câu hỏi về thanh toán, quyền lợi và tài khoản.",
    icon: Headphones,
  },
];

const testimonials = [
  {
    name: "Minh Anh",
    role: "Movie lover",
    quote:
      "Premium làm TaleX có cảm giác như một rạp chiếu nhỏ ở nhà. Giao diện tối, chữ dịu và nội dung liền mạch hơn hẳn.",
    initials: "MA",
  },
  {
    name: "Hoàng Nam",
    role: "Comic reader",
    quote:
      "Mình thích nhất phần đọc truyện không bị ngắt. Các gói combo cũng dễ hiểu, chọn xong là đi checkout rất nhanh.",
    initials: "HN",
  },
  {
    name: "Linh Chi",
    role: "Series collector",
    quote:
      "Cảm giác premium đúng nghĩa: card rõ, màu vàng vừa đủ sang, không bị chói như nhiều trang streaming khác.",
    initials: "LC",
  },
];

const trendSignals = [
  {
    label: "Viewer momentum",
    value: "82%",
    detail: "người xem ưu tiên combo theo mùa",
    icon: TrendingUp,
  },
  {
    label: "Watch flow",
    value: "2.4x",
    detail: "tỷ lệ xem liền mạch sau khi mua trọn bộ",
    icon: PlayCircle,
  },
  {
    label: "Premium habit",
    value: "68%",
    detail: "quay lại đọc/xem trong tuần đầu",
    icon: Users,
  },
];

const comboTimeline = [
  {
    title: "Gom tập nổi bật",
    description: "Các episode cùng universe được đóng gói để dễ mua hơn.",
    icon: Layers,
  },
  {
    title: "Mở khóa một lần",
    description: "Thanh toán một lần, tiếp tục xem không phải quay lại từng tập.",
    icon: CheckCircle2,
  },
  {
    title: "Theo dõi nhịp phát hành",
    description: "Combo tạo cảm giác sở hữu trọn bộ, hợp với người xem marathon.",
    icon: CalendarDays,
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
      label: "Trải nghiệm xem không quảng cáo",
      icon: ShieldCheck,
    });
  }

  if (subscription.isStoryUnlocked) {
    benefits.push({
      label: "Đọc truyện tranh kỹ thuật số không giới hạn",
      icon: BookOpen,
    });
  }

  if (subscription.isMovieUnlocked) {
    benefits.push({
      label: "Mở khóa toàn bộ kho phim & series",
      icon: PlayCircle,
    });
  }

  benefits.push({
    label: "Hỗ trợ chất lượng 4K HDR & âm thanh vòm",
    icon: Gem,
  });

  return benefits;
}

function getEpisodeLabel(episodes?: PublicComboEpisode[]) {
  const count = episodes?.length ?? 0;

  if (count <= 0) {
    return "Danh sách tập chọn lọc trong vũ trụ TaleX";
  }

  return `${count} tập truyện/phim trong cùng một gói`;
}

function getComboFeatures(combo: PublicCombo) {
  const features = [
    getEpisodeLabel(combo.episodes),
    combo.description || "Mở khóa combo nội dung với mức giá ưu đãi.",
  ];

  const seriesNames = Array.from(
    new Set(
      combo.episodes
        ?.map((episode) => episode.seriesTitle)
        .filter((value): value is string => Boolean(value)),
    ),
  );

  if (seriesNames.length > 0) {
    features.push(`Bao gồm: ${seriesNames.slice(0, 2).join(", ")}`);
  }

  return features;
}

function getHighlightComboId(combos: PublicCombo[]) {
  if (combos.length === 0) {
    return "";
  }

  return combos.reduce((current, combo) =>
    combo.priceVnd > current.priceVnd ? combo : current,
  ).comboId;
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
                  "relative min-h-[280px] overflow-hidden bg-gradient-to-br md:min-h-[320px]",
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
                <div className="relative z-10 mx-auto flex min-h-[280px] w-full max-w-6xl items-center justify-center px-4 py-8 text-center md:min-h-[320px]">
                  <div className="mx-auto max-w-3xl">
                    <Badge variant="premium" className="px-3 py-1 text-xs font-medium">
                      {slide.eyebrow}
                    </Badge>
                    <h1 className="mt-4 text-2xl font-semibold tracking-normal text-white/90 sm:text-3xl lg:text-4xl">
                      {slide.title}
                    </h1>
                    <p className="mx-auto mt-4 max-w-2xl text-sm font-normal leading-6 text-slate-300 sm:text-base">
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
            "Gói Premium dành cho trải nghiệm TaleX trọn vẹn hơn."}
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
    router.push(`/checkout?subscriptionId=${subscription.subscriptionId}`);
  };

  return (
    <section className="relative overflow-hidden border-y border-white/10 bg-[#090909] py-8 lg:py-10">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_0%,rgba(212,175,55,0.12),transparent_34%),radial-gradient(circle_at_88%_24%,rgba(151,176,255,0.08),transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.035),transparent_38%)]" />
      <div className="pointer-events-none absolute left-1/2 top-20 h-px w-[72rem] -translate-x-1/2 bg-gradient-to-r from-transparent via-[#D4AF37]/35 to-transparent" />
      <div className="relative z-10 mx-auto w-full max-w-6xl px-4">
        <SectionHeading
          eyebrow="Gói thành viên"
          title="Top trải nghiệm Premium dành cho bạn"
          description="Dữ liệu gói được đồng bộ trực tiếp từ hệ thống TaleX, giữ nguyên luồng checkout và các trạng thái API hiện có."
        />

        {packagesQuery.isLoading && <PricingSkeleton />}

        {packagesQuery.isError && (
          <ErrorState
            title="Không thể tải danh sách gói Premium"
            description="Vui lòng kiểm tra kết nối API `/api/v1/subscriptions` hoặc thử lại sau."
          />
        )}

        {!packagesQuery.isLoading && !packagesQuery.isError && packages.length === 0 && (
          <EmptyState
            title="Chưa có gói Premium nào"
            description="Khi admin cấu hình gói Premium, danh sách sẽ tự động xuất hiện tại đây."
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

function ComboSkeleton() {
  return (
    <div className="mx-auto grid max-w-6xl gap-5 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 3 }).map((_, index) => (
        <div
          key={index}
          className="min-h-[340px] animate-pulse rounded-2xl border border-white/10 bg-[#121214] p-5"
        >
          <div className="h-11 w-11 rounded-xl bg-[#D4AF37]/15" />
          <div className="mt-6 h-6 w-44 rounded-full bg-white/10" />
          <div className="mt-4 h-4 w-full rounded-full bg-white/10" />
          <div className="mt-3 h-4 w-4/5 rounded-full bg-white/10" />
          <div className="mt-8 h-9 w-40 rounded-full bg-white/10" />
          <div className="my-7 border-t border-white/10" />
          <div className="space-y-4">
            <div className="h-4 w-full rounded-full bg-white/10" />
            <div className="h-4 w-5/6 rounded-full bg-white/10" />
            <div className="h-4 w-3/4 rounded-full bg-white/10" />
          </div>
        </div>
      ))}
    </div>
  );
}

function ComboCard({
  combo,
  isPopular,
}: {
  combo: PublicCombo;
  isPopular: boolean;
}) {
  const router = useRouter();
  const features = getComboFeatures(combo);
  const originalPrice = combo.originalPriceVnd ?? combo.priceVnd;
  const shouldShowOriginalPrice = originalPrice > combo.priceVnd;
  const isPurchasable = combo.priceVnd > 0;

  function handlePurchase() {
    const params = new URLSearchParams({
      itemId: combo.comboId,
      itemType: "COMBO",
      title: combo.title,
    });
    router.push(`/checkout-content?${params.toString()}`);
  }

  return (
    <article
      className={cn(
        "group relative flex min-h-[320px] flex-col overflow-hidden rounded-2xl border bg-[#121214] p-4 shadow-[0_14px_36px_rgba(0,0,0,0.28)] transition-all duration-300 hover:-translate-y-1 sm:p-5",
        isPopular
          ? "border-[#D4AF37] shadow-[0_0_26px_rgba(212,175,55,0.16)]"
          : "border-white/10 hover:border-[#D4AF37]/35",
      )}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(212,175,55,0.12),transparent_34%)]" />
      <div className="relative z-10 flex flex-1 flex-col">
        <div className="flex items-center justify-between gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-[#D4AF37]/20 bg-[#D4AF37]/10 text-[#D4AF37]">
            <Sparkles className="h-5 w-5" />
          </div>
          {isPopular ? (
            <Badge variant="premium" className="text-xs font-medium">
              Nổi bật
            </Badge>
          ) : null}
        </div>

        <h3 className="mt-4 text-lg font-semibold text-white/90">{combo.title}</h3>
        <p className="mt-2 line-clamp-2 text-sm font-normal leading-6 text-slate-400">
          {combo.description ||
            "Combo nội dung điện ảnh được tuyển chọn cho trải nghiệm TaleX trọn vẹn."}
        </p>

        <div className="mt-5">
          {shouldShowOriginalPrice && (
            <p className="text-sm font-medium text-slate-500 line-through">
              {formatCurrency(originalPrice)}
            </p>
          )}
          <p className="mt-1 text-2xl font-semibold text-white/90">
            {combo.priceVnd > 0 ? formatCurrency(combo.priceVnd) : "Liên hệ"}
          </p>
        </div>

        <div className="my-4 border-t border-white/10" />

        <ul className="flex flex-1 flex-col gap-3">
          {features.map((feature) => (
            <li
              key={feature}
              className="flex gap-3 text-sm font-medium leading-5 text-slate-300"
            >
              <Check className="mt-0.5 h-5 w-5 shrink-0 text-[#D4AF37]" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>

        <Button
          type="button"
          disabled={!isPurchasable}
          onClick={handlePurchase}
          className="mt-5 h-10 rounded-xl bg-[#D4AF37] text-sm font-semibold text-black transition hover:bg-[#F3CE5E] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-[#D4AF37]"
        >
          {isPurchasable ? "Mua gói này" : "Liên hệ để mua"}
          <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover/button:translate-x-1" />
        </Button>
      </div>
    </article>
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
                Xu hướng hưởng ứng
              </Badge>
              <h2 className="text-xl font-semibold tracking-normal text-white/90 sm:text-2xl">
                Người xem đang chuyển sang trải nghiệm trọn mạch
              </h2>
              <p className="mt-3 text-sm font-normal leading-6 text-slate-400">
                TaleX Premium ưu tiên nhịp xem liền lạc: chọn gói nhanh, mở khóa rõ ràng, rồi tiếp tục câu chuyện không bị vỡ mạch.
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

function ComboIntroBanner() {
  return (
    <div className="mb-8 overflow-hidden rounded-2xl border border-white/10 bg-[#121214] shadow-2xl">
      <div className="relative grid gap-5 p-5 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(212,175,55,0.16),transparent_30%),radial-gradient(circle_at_88%_12%,rgba(151,176,255,0.10),transparent_28%)]" />
        <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-[#D4AF37]/45 to-transparent" />

        <div className="relative z-10">
          <Badge variant="premium" className="mb-3 px-3 py-1 text-xs font-medium">
            Combo Studio
          </Badge>
          <h2 className="text-xl font-semibold tracking-normal text-white/90 sm:text-2xl">
            Mua trọn bộ, xem liền mạch
          </h2>
          <p className="mt-3 max-w-2xl text-sm font-normal leading-6 text-slate-400">
            Combo giúp gom các tập liên quan thành một hành trình rõ ràng: ít thao tác hơn, cảm giác sở hữu tốt hơn và phù hợp với người xem muốn theo dõi cả universe.
          </p>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {[
              { label: "Tập đã gom", value: "Curated", icon: Paperclip },
              { label: "Nhịp xem", value: "Marathon", icon: Clock3 },
              { label: "Tín hiệu", value: "Public", icon: Radio },
            ].map((item) => {
              const Icon = item.icon;

              return (
                <div
                  key={item.label}
                  className="rounded-xl border border-white/10 bg-black/25 p-3 transition hover:border-[#D4AF37]/30"
                >
                  <Icon className="mb-3 h-5 w-5 text-[#D4AF37]" />
                  <p className="text-xs font-medium text-slate-500">
                    {item.label}
                  </p>
                  <p className="mt-1 text-base font-semibold text-white/90">
                    {item.value}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="relative z-10 rounded-2xl border border-white/10 bg-black/30 p-4">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-xs font-medium text-[#D4AF37]">
              Timeline mở khóa
            </p>
            <Sparkles className="h-5 w-5 text-[#D4AF37]" />
          </div>
          <div className="space-y-4">
            {comboTimeline.map((item, index) => {
              const Icon = item.icon;

              return (
                <div key={item.title} className="relative flex gap-4">
                  {index < comboTimeline.length - 1 ? (
                    <div className="absolute left-5 top-10 h-8 w-px bg-white/10" />
                  ) : null}
                  <div className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#D4AF37]/25 bg-[#D4AF37]/10 text-[#D4AF37]">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="flex h-4 w-4 items-center justify-center rounded border border-[#D4AF37]/40 bg-[#D4AF37]/10">
                        <Check className="h-3 w-3 text-[#D4AF37]" />
                      </span>
                      <h3 className="font-semibold text-white/90">{item.title}</h3>
                    </div>
                    <p className="mt-1 text-sm font-normal leading-5 text-slate-400">
                      {item.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] p-3">
            <div className="mb-2 flex items-center justify-between text-xs font-medium text-slate-400">
              <span>Độ liền mạch</span>
              <span className="text-[#F5D46E]">76%</span>
            </div>
            <Progress value={76} />
          </div>
        </div>
      </div>
    </div>
  );
}

function ComboSection() {
  const combosQuery = useGetPublicCombos();
  const combos = combosQuery.data ?? [];
  const highlightComboId = getHighlightComboId(combos);

  return (
    <section className="relative overflow-hidden border-y border-white/10 bg-[#0A0A0A] py-8 lg:py-10">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(212,175,55,0.11),transparent_34%),radial-gradient(circle_at_10%_55%,rgba(151,176,255,0.08),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.035),transparent_46%)]" />
      <div className="relative z-10 mx-auto w-full max-w-6xl px-4">
        <ComboIntroBanner />
        <SectionHeading
          eyebrow="Combo độc quyền"
          title="Các combo đang sẵn sàng mở khóa"
          description="Các gói combo được gom từ nhiều tập nổi bật, giúp bạn mở khóa nội dung yêu thích với mức giá tốt hơn."
        />

        {combosQuery.isLoading && <ComboSkeleton />}

        {combosQuery.isError && (
          <ErrorState
            title="Không thể tải danh sách Combo"
            description="Vui lòng kiểm tra API /api/v1/public/combos hoặc thử lại sau."
          />
        )}

        {!combosQuery.isLoading && !combosQuery.isError && combos.length === 0 && (
          <EmptyState
            title="Chưa có gói Combo public"
            description="Khi Creator xuất bản combo, các thẻ mua gói sẽ tự động xuất hiện tại đây."
          />
        )}

        {!combosQuery.isLoading && !combosQuery.isError && combos.length > 0 && (
          <div
            className={cn(
              "grid gap-4",
              combos.length === 1 ? "mx-auto max-w-md" : "md:grid-cols-2 xl:grid-cols-3",
            )}
          >
            {combos.map((combo) => (
              <ComboCard
                key={combo.comboId}
                combo={combo}
                isPopular={combo.comboId === highlightComboId}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function TestimonialsSection() {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-8 lg:py-10">
      <SectionHeading
        eyebrow="Đánh giá khách hàng"
        title="Người xem nói gì về TaleX Premium"
        description="Một lớp cảm nhận xã hội nhẹ nhàng, giúp trang Premium có chiều sâu hơn mà không ảnh hưởng đến luồng API."
      />

      <div className="grid gap-5 md:grid-cols-3">
        {testimonials.map((testimonial) => (
          <article
            key={testimonial.name}
            className="group relative overflow-hidden rounded-2xl border border-white/10 bg-[#121214] p-5 transition-all duration-300 hover:-translate-y-1 hover:border-[#D4AF37]/35"
          >
            <Star className="absolute -right-3 -top-3 h-24 w-24 text-[#D4AF37]/[0.06] transition-transform duration-300 group-hover:rotate-6" />
            <div className="relative z-10">
              <div className="mb-5 flex gap-1 text-[#D4AF37]">
                {Array.from({ length: 5 }).map((_, index) => (
                  <Star key={index} className="h-4 w-4 fill-current" />
                ))}
              </div>
              <p className="line-clamp-4 text-sm font-normal leading-6 text-slate-300">
                &ldquo;{testimonial.quote}&rdquo;
              </p>
              <div className="mt-5 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[#D4AF37]/25 bg-[#D4AF37]/10 text-sm font-semibold text-[#F5D46E]">
                  {testimonial.initials}
                </div>
                <div>
                  <p className="font-semibold text-white/90">{testimonial.name}</p>
                  <p className="text-xs font-medium text-slate-500">
                    {testimonial.role}
                  </p>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function BenefitsSection() {
  return (
    <section className="border-y border-white/10 bg-white/[0.03] py-8 lg:py-10">
      <div className="mx-auto w-full max-w-6xl px-4">
        <SectionHeading
          eyebrow="Quyền lợi nổi bật"
          title="Một tài khoản, toàn bộ vũ trụ TaleX"
          description="Các đặc quyền được trình bày rõ hơn, dịu mắt hơn và có tương tác hover nhẹ theo phong cách cinematic."
        />

        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {featuredBenefits.map((feature) => {
            const Icon = feature.icon;

            return (
              <article
                key={feature.title}
                className="group rounded-2xl border border-white/10 bg-[#121214] p-5 transition-all duration-300 hover:-translate-y-1 hover:border-[#D4AF37]/35 hover:bg-[#151515]"
              >
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-slate-300 transition-all duration-300 group-hover:border-[#D4AF37]/30 group-hover:bg-[#D4AF37]/10 group-hover:text-[#D4AF37]">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-semibold text-white/90">
                  {feature.title}
                </h3>
                <p className="mt-2 line-clamp-3 text-sm font-normal leading-6 text-slate-400">
                  {feature.description}
                </p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function SupportCta() {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-8 lg:py-10">
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[#171717] via-[#0D0D0F] to-black px-6 py-8 text-center shadow-2xl sm:px-10">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(212,175,55,0.12),transparent_36%)]" />
        <div className="relative z-10 mx-auto max-w-3xl">
          <Badge variant="premium" className="mb-3 px-3 py-1 text-xs font-medium">
            TaleX Care
          </Badge>
          <h2 className="text-xl font-semibold tracking-normal text-white/90 sm:text-2xl">
            Bạn vẫn còn câu hỏi?
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm font-normal leading-6 text-slate-400">
            Đội ngũ TaleX luôn sẵn sàng hỗ trợ về gói Premium, thanh toán và quyền lợi tài khoản.
          </p>
          <Button
            asChild
            className="mt-5 h-10 rounded-xl bg-[#D4AF37] px-6 text-sm font-semibold text-black hover:bg-[#F3CE5E]"
          >
            <a href="/faq">
              Truy cập Trung tâm hỗ trợ
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover/button:translate-x-1" />
            </a>
          </Button>
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
      <ComboSection />
      <TestimonialsSection />
      <BenefitsSection />
      <SupportCta />
    </main>
  );
}
