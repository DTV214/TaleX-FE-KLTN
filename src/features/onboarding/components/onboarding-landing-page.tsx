"use client";

import { memo, useCallback, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Cake,
  Check,
  Clapperboard,
  Film,
  Heart,
  Loader2,
  Mars,
  PartyPopper,
  RefreshCw,
  ShieldQuestion,
  Smile,
  Sparkles,
  Star,
  Tags,
  Venus,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { getApiErrorMessage } from "@/shared/api/http-client";
import { isFullProfile, useAuthStore } from "@/features/auth/store/auth.store";
import {
  isMissingUserFeatureError,
  type OnboardingGender,
  useCreateUserFeatureProfile,
  usePublicOnboardingCategories,
  usePublicOnboardingTags,
  useUserFeatureProfile,
} from "../api/user-onboarding.api";

const welcomeImages = [
  "https://images.unsplash.com/photo-1618336753974-aae8e04506aa?q=80&w=900&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1518005020951-eccb494ad742?q=80&w=900&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=900&auto=format&fit=crop",
];

const welcomePosterItems = welcomeImages.map((image, index) => ({
  image,
  label: ["TaleX", "Truyện hay", "Phim chọn lọc"][index],
}));

const cardImages = [
  "https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=900&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1519608487953-e999c86e7455?q=80&w=900&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?q=80&w=900&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1518709268805-4e9042af2176?q=80&w=900&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1528722828814-77b9b83aafb2?q=80&w=900&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?q=80&w=900&auto=format&fit=crop",
];

const profileStepImages = [
  {
    image:
      "https://images.unsplash.com/photo-1618336753974-aae8e04506aa?q=80&w=900&auto=format&fit=crop",
    label: "Gu xem",
  },
  {
    image:
      "https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=900&auto=format&fit=crop",
    label: "Nhịp đọc",
  },
  {
    image:
      "https://images.unsplash.com/photo-1528722828814-77b9b83aafb2?q=80&w=900&auto=format&fit=crop",
    label: "Cảm xúc",
  },
];

const floatingDecorations: Array<{
  icon: LucideIcon;
  className: string;
}> = [
  {
    icon: Sparkles,
    className: "left-[7%] top-[17%] rotate-12 text-[#D4AF37]/18",
  },
  {
    icon: Heart,
    className: "right-[10%] top-[20%] -rotate-12 text-rose-200/12",
  },
  {
    icon: BookOpen,
    className: "left-[12%] bottom-[18%] -rotate-6 text-cyan-100/10",
  },
  {
    icon: Star,
    className: "right-[17%] bottom-[14%] rotate-12 text-[#D4AF37]/14",
  },
  {
    icon: Clapperboard,
    className: "left-[46%] top-[11%] rotate-6 text-white/8",
  },
  {
    icon: Smile,
    className: "right-[42%] bottom-[9%] -rotate-12 text-white/8",
  },
];

const genderOptions: Array<{
  value: OnboardingGender;
  label: string;
  image: string;
  icon: LucideIcon;
}> = [
  {
    value: "MALE",
    label: "Nam",
    image:
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=900&auto=format&fit=crop",
    icon: Mars,
  },
  {
    value: "FEMAL",
    label: "Nữ",
    image:
      "https://images.unsplash.com/photo-1518005020951-eccb494ad742?q=80&w=900&auto=format&fit=crop",
    icon: Venus,
  },
  {
    value: "UNKNOWN",
    label: "Riêng tư",
    image:
      "https://images.unsplash.com/photo-1518709268805-4e9042af2176?q=80&w=900&auto=format&fit=crop",
    icon: ShieldQuestion,
  },
];

function normalizeAge(value: string) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 18;
  return Math.min(80, Math.max(8, Math.round(parsed)));
}

function sanitizeNextPath(value: string | null) {
  if (!value) return "/";

  let decodedValue = value;
  for (let index = 0; index < 4; index += 1) {
    try {
      const nextDecodedValue = decodeURIComponent(decodedValue);
      if (nextDecodedValue === decodedValue) break;
      decodedValue = nextDecodedValue;
    } catch {
      break;
    }
  }

  if (
    !decodedValue.startsWith("/") ||
    decodedValue.startsWith("//") ||
    decodedValue.startsWith("/onboarding")
  ) {
    return "/";
  }

  return decodedValue;
}

function StepHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="space-y-3">
      <Badge variant="premium" className="px-3 py-1 text-[11px] font-semibold">
        {eyebrow}
      </Badge>
      <h1 className="font-heading text-3xl font-black leading-tight text-white/92 sm:text-4xl lg:text-5xl">
        {title}
      </h1>
      <p className="max-w-2xl text-sm leading-6 text-slate-400 sm:text-base">
        {description}
      </p>
    </div>
  );
}

function SmallStat({
  icon: Icon,
  label,
}: {
  icon: LucideIcon;
  label: string;
}) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-semibold text-white/75">
      <Icon className="h-4 w-4 text-[#D4AF37]" />
      {label}
    </div>
  );
}

function DecorativeIcons() {
  return (
    <div className="pointer-events-none fixed inset-0 z-[1] hidden overflow-hidden md:block">
      {floatingDecorations.map((item, index) => {
        const Icon = item.icon;

        return (
          <Icon
            key={index}
            className={`absolute h-10 w-10 opacity-80 blur-[0.2px] ${item.className}`}
          />
        );
      })}
    </div>
  );
}

function StackedPosterCards({
  items,
  className = "",
}: {
  items: Array<{ image: string; label?: string }>;
  className?: string;
}) {
  return (
    <div
      className={`relative mx-auto hidden min-h-[560px] w-full max-w-[560px] md:block ${className}`}
    >
      {items.map((item, index) => (
        <div
          key={item.image}
          className="absolute w-[260px] overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.04] shadow-[0_26px_80px_rgba(0,0,0,0.48)] transition duration-300 hover:-translate-y-2 hover:border-[#D4AF37]/35"
          style={{
            top: `${index * 82}px`,
            left: `${index * 88}px`,
            zIndex: items.length - index,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={item.image}
            alt=""
            className="aspect-[3/4] w-full object-cover opacity-82"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/82 via-black/18 to-transparent" />
          {item.label ? (
            <div className="absolute bottom-4 left-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/45 px-3 py-1.5 text-xs font-bold text-white/82 backdrop-blur-md">
              <Sparkles className="h-3.5 w-3.5 text-[#D4AF37]" />
              {item.label}
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}

function ChoiceCard({
  title,
  selected,
  onClick,
  image,
}: {
  title: string;
  selected: boolean;
  onClick: () => void;
  image: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative min-h-[136px] overflow-hidden rounded-[1.45rem] border p-4 text-left transition duration-200 hover:-translate-y-1 hover:border-[#D4AF37]/45 hover:shadow-[0_18px_48px_rgba(0,0,0,0.3)] ${
        selected
          ? "border-[#D4AF37]/65 bg-[#D4AF37]/10 shadow-[0_0_0_1px_rgba(212,175,55,0.18)]"
          : "border-white/10 bg-white/[0.035]"
      }`}
    >
      <span className="absolute right-4 top-4 z-20 flex h-7 w-7 items-center justify-center rounded-full border border-[#D4AF37]/30 bg-black/45 text-[#E6C95C] shadow-[0_8px_26px_rgba(212,175,55,0.16)] backdrop-blur-md">
        <Star className="h-3.5 w-3.5 fill-current" />
      </span>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={image}
        alt=""
        className="absolute inset-0 h-full w-full object-cover opacity-20 transition duration-300 group-hover:opacity-30"
      />
      <span className="absolute inset-0 bg-gradient-to-br from-black/82 via-black/60 to-[#111112]/88" />
      <span className="relative z-10 flex h-full flex-col justify-between gap-4">
        <span>
          <span className="text-base font-black text-white/92">{title}</span>
        </span>
        <span
          className={`inline-flex h-7 w-7 items-center justify-center rounded-full border transition ${
            selected
              ? "border-[#D4AF37] bg-[#D4AF37] text-black"
              : "border-white/15 bg-black/30 text-white/40"
          }`}
        >
          <Check className="h-4 w-4" />
        </span>
      </span>
    </button>
  );
}

const MemoChoiceCard = memo(ChoiceCard);

function OptionGridState({
  isLoading,
  isError,
  error,
  onRetry,
}: {
  isLoading: boolean;
  isError: boolean;
  error: unknown;
  onRetry: () => void;
}) {
  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 9 }).map((_, index) => (
          <div
            key={index}
            className="h-[136px] animate-pulse rounded-[1.45rem] border border-white/10 bg-white/[0.04]"
          />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-2xl border border-red-400/20 bg-red-400/[0.07] p-5">
        <p className="text-sm font-semibold text-red-100">
          Chưa tải được dữ liệu khảo sát.
        </p>
        <p className="mt-2 text-xs leading-5 text-red-100/70">
          {getApiErrorMessage(error)}
        </p>
        <Button
          type="button"
          onClick={onRetry}
          variant="outline"
          className="mt-4 h-9 rounded-xl border-red-200/20 bg-red-300/10 text-red-100 hover:bg-red-300/15"
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Thử lại
        </Button>
      </div>
    );
  }

  return null;
}

export function OnboardingLandingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated } = useAuthStore();
  const profileUser = isFullProfile(user) ? user : null;
  const nextPath = useMemo(
    () => sanitizeNextPath(searchParams.get("next")),
    [searchParams],
  );
  const [step, setStep] = useState(0);
  const [gender, setGender] = useState<OnboardingGender>("UNKNOWN");
  const [age, setAge] = useState(18);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const profileQuery = useUserFeatureProfile(isAuthenticated);
  const categoriesQuery = usePublicOnboardingCategories(step >= 2);
  const tagsQuery = usePublicOnboardingTags(step >= 3);
  const createProfileMutation = useCreateUserFeatureProfile();
  const categories = categoriesQuery.data ?? [];
  const tags = tagsQuery.data ?? [];
  const displayName =
    profileUser?.fullName || profileUser?.username || "người bạn mới";
  const shouldShowSurvey =
    profileQuery.isError && isMissingUserFeatureError(profileQuery.error);
  const canRenderSurvey = shouldShowSurvey || createProfileMutation.isSuccess;

  const toggleCategory = useCallback((id: string) => {
    setSelectedCategoryIds((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );
  }, []);

  const toggleTag = useCallback((id: string) => {
    setSelectedTagIds((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );
  }, []);

  const handleExplore = useCallback(() => {
    router.replace(nextPath);
  }, [nextPath, router]);

  const handleGoHome = useCallback(() => {
    router.replace("/");
  }, [router]);

  const handleSubmit = useCallback(() => {
    createProfileMutation.mutate(
      {
        gender,
        age,
        onboardingMovieGeneres: selectedCategoryIds,
        onboardingGenres: selectedCategoryIds,
        onboardingTags: selectedTagIds,
        onboardingMovieGenres: selectedCategoryIds,
        onboardingComicGenres: selectedTagIds,
      },
      {
        onSuccess: () => {
          toast.success("TaleX đã ghi nhận gu nội dung của bạn.");
          setStep(4);
        },
        onError: (error) => {
          console.error("[Onboarding] Cannot save survey", error);
          toast.error(getApiErrorMessage(error));
        },
      },
    );
  }, [
    age,
    createProfileMutation,
    gender,
    selectedCategoryIds,
    selectedTagIds,
  ]);

  const progress = useMemo(() => {
    if (step >= 4) return 100;
    return Math.max(8, ((step + 1) / 4) * 100);
  }, [step]);

  if (!isAuthenticated) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#080808] px-4 text-white">
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-8 text-center">
          <p className="text-sm font-semibold text-white/80">
            Vui lòng đăng nhập để tiếp tục khảo sát.
          </p>
          <Button
            type="button"
            onClick={() => router.replace("/login")}
            className="mt-5 rounded-xl bg-[#D4AF37] text-black hover:bg-[#F5D46E]"
          >
            Đăng nhập
          </Button>
        </div>
      </main>
    );
  }

  if (profileQuery.isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#080808] px-4 text-white">
        <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-4 text-sm font-semibold text-white/75">
          <Loader2 className="h-5 w-5 animate-spin text-[#D4AF37]" />
          Đang chuẩn bị khảo sát...
        </div>
      </main>
    );
  }

  if (!canRenderSurvey) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#080808] px-4 text-white">
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-8 text-center">
          <p className="text-sm font-semibold text-white/80">
            Hồ sơ gợi ý của bạn đã sẵn sàng.
          </p>
          <Button
            type="button"
            onClick={handleExplore}
            className="mt-5 rounded-xl bg-[#D4AF37] text-black hover:bg-[#F5D46E]"
          >
            Quay lại TaleX
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#080808] text-white">
      <div
        className="fixed inset-0 bg-cover bg-center opacity-18"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=1600&auto=format&fit=crop')",
        }}
      />
      <div className="fixed inset-0 bg-gradient-to-br from-[#080808]/96 via-[#111113]/95 to-black/98" />
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(212,175,55,0.18),transparent_32%),radial-gradient(circle_at_82%_18%,rgba(125,211,252,0.10),transparent_26%)]" />
      <DecorativeIcons />

      <section className="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-7 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center justify-between gap-4">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-[#D4AF37] transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-xs font-semibold text-slate-500">
            {Math.min(step + 1, 4)}/4
          </span>
        </div>

        <div className="flex flex-1 items-center">
          {step === 0 && (
            <div className="grid w-full gap-16 lg:grid-cols-[0.9fr_1fr] lg:items-center xl:gap-24">
              <StackedPosterCards items={welcomePosterItems} />

              <div className="max-w-2xl lg:pl-4">
                <StepHeader
                  eyebrow="TaleX xin chào"
                  title={`Chào ${displayName}, cùng tìm gu xem của bạn nhé.`}
                  description="Một vài lựa chọn ngắn sẽ giúp TaleX gợi ý truyện, phim và nội dung hợp tâm trạng hơn."
                />
                <div className="mt-6 flex flex-wrap gap-3">
                  <SmallStat icon={Sparkles} label="Gợi ý dịu hơn" />
                  <SmallStat icon={Heart} label="Ít bước, dễ chọn" />
                  <SmallStat icon={Film} label="Cá nhân hóa nội dung" />
                </div>
                <Button
                  type="button"
                  onClick={() => setStep(1)}
                  className="mt-8 h-12 rounded-2xl bg-[#D4AF37] px-6 text-sm font-bold text-black shadow-[0_16px_46px_rgba(212,175,55,0.24)] hover:bg-[#F5D46E]"
                >
                  Bắt đầu
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="grid w-full gap-16 lg:grid-cols-[0.82fr_1.18fr] lg:items-center xl:gap-20">
              <StackedPosterCards items={profileStepImages} />

              <div className="min-w-0">
                <StepHeader
                  eyebrow="Bước 1"
                  title="Một chút thông tin cơ bản"
                  description="Chọn nhẹ nhàng thôi. TaleX dùng phần này để tinh chỉnh trải nghiệm gợi ý."
                />

                <div className="mt-8 grid gap-4 sm:grid-cols-3">
                  {genderOptions.map((option) => {
                    const Icon = option.icon;
                    const isSelected = gender === option.value;

                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setGender(option.value)}
                        className={`group relative min-h-[218px] overflow-hidden rounded-[1.65rem] border p-5 text-left transition duration-200 hover:-translate-y-1 hover:border-[#D4AF37]/45 hover:shadow-[0_22px_60px_rgba(0,0,0,0.34)] ${
                          isSelected
                            ? "border-[#D4AF37]/70 bg-[#D4AF37]/10 shadow-[0_0_0_1px_rgba(212,175,55,0.18)]"
                            : "border-white/10 bg-white/[0.035]"
                        }`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={option.image}
                          alt=""
                          className="absolute inset-0 h-full w-full object-cover opacity-22 transition duration-300 group-hover:scale-105 group-hover:opacity-34"
                        />
                        <span className="absolute inset-0 bg-gradient-to-br from-black/82 via-black/58 to-[#111112]/92" />
                        <span className="relative z-10 flex h-full flex-col justify-between gap-8">
                          <span className="flex items-center justify-between gap-3">
                            <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#D4AF37]/25 bg-[#D4AF37]/12 text-[#D4AF37] shadow-[0_14px_32px_rgba(212,175,55,0.12)]">
                              <Icon className="h-6 w-6" />
                            </span>
                            <span
                              className={`flex h-8 w-8 items-center justify-center rounded-full border transition ${
                                isSelected
                                  ? "border-[#D4AF37] bg-[#D4AF37] text-black"
                                  : "border-white/15 bg-black/30 text-white/30"
                              }`}
                            >
                              <Check className="h-4 w-4" />
                            </span>
                          </span>
                          <span>
                            <span className="block text-xl font-black text-white/92">
                              {option.label}
                            </span>
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>

                <label className="mt-5 grid gap-4 rounded-[1.65rem] border border-white/10 bg-black/30 p-5 shadow-[0_18px_60px_rgba(0,0,0,0.22)] sm:grid-cols-[auto_1fr_auto] sm:items-center">
                  <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[#D4AF37]/25 bg-[#D4AF37]/10 text-[#D4AF37]">
                    <Cake className="h-6 w-6" />
                  </span>
                  <span>
                    <span className="block text-base font-black text-white/88">
                      Độ tuổi
                    </span>
                    <span className="mt-1 block text-sm leading-6 text-slate-500">
                      TaleX chỉ dùng con số này để làm gợi ý dịu và phù hợp hơn.
                    </span>
                  </span>
                  <span className="relative block">
                    <input
                      type="number"
                      inputMode="numeric"
                      min={8}
                      max={80}
                      value={age}
                      onChange={(event) =>
                        setAge(normalizeAge(event.target.value))
                      }
                      className="h-16 w-full rounded-2xl border border-white/10 bg-white/[0.055] px-5 pr-14 text-center text-3xl font-black text-white outline-none transition placeholder:text-white/25 focus:border-[#D4AF37]/55 focus:bg-white/[0.075] sm:w-40"
                    />
                    <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold uppercase tracking-wider text-slate-500">
                      tuổi
                    </span>
                  </span>
                </label>

                <div className="mt-8 flex justify-between gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep(0)}
                    className="h-12 rounded-2xl border-white/10 bg-white/[0.04] px-5 text-white/75 hover:border-[#D4AF37]/35 hover:text-[#D4AF37]"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Quay lại
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setStep(2)}
                    className="h-12 rounded-2xl bg-[#D4AF37] px-6 text-sm font-bold text-black shadow-[0_16px_46px_rgba(212,175,55,0.22)] hover:bg-[#F5D46E]"
                  >
                    Tiếp tục
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="w-full">
              <StepHeader
                eyebrow="Bước 2"
                title="Bạn thích thể loại nào?"
                description="Chọn vài thể loại nổi bật. Category ID sẽ được gửi vào onboardingGenres."
              />

              <div className="mt-8">
                <OptionGridState
                  isLoading={categoriesQuery.isLoading}
                  isError={categoriesQuery.isError}
                  error={categoriesQuery.error}
                  onRetry={() => void categoriesQuery.refetch()}
                />
                {!categoriesQuery.isLoading && !categoriesQuery.isError && (
                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {categories.map((category, index) => (
                      <MemoChoiceCard
                        key={category.id}
                        title={category.name}
                        image={cardImages[index % cardImages.length]}
                        selected={selectedCategoryIds.includes(category.id)}
                        onClick={() => toggleCategory(category.id)}
                      />
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-8 flex justify-between gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="h-12 rounded-2xl border-white/10 bg-white/[0.04] px-5 text-white/75 hover:border-[#D4AF37]/35 hover:text-[#D4AF37]"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Quay lại
                </Button>
                <Button
                  type="button"
                  disabled={selectedCategoryIds.length === 0}
                  onClick={() => setStep(3)}
                  className="h-12 rounded-2xl bg-[#D4AF37] px-6 text-sm font-bold text-black hover:bg-[#F5D46E] disabled:cursor-not-allowed disabled:opacity-45"
                >
                  Tiếp tục
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="w-full">
              <StepHeader
                eyebrow="Bước 3"
                title="Thêm vài tags bạn hay tìm"
                description="Tag ID sẽ được gửi vào onboardingTags để TaleX hiểu gu nội dung rõ hơn."
              />

              <div className="mt-8">
                <OptionGridState
                  isLoading={tagsQuery.isLoading}
                  isError={tagsQuery.isError}
                  error={tagsQuery.error}
                  onRetry={() => void tagsQuery.refetch()}
                />
                {!tagsQuery.isLoading && !tagsQuery.isError && (
                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {tags.map((tag, index) => (
                      <MemoChoiceCard
                        key={tag.id}
                        title={`#${tag.name}`}
                        image={cardImages[(index + 2) % cardImages.length]}
                        selected={selectedTagIds.includes(tag.id)}
                        onClick={() => toggleTag(tag.id)}
                      />
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-8 flex justify-between gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(2)}
                  className="h-12 rounded-2xl border-white/10 bg-white/[0.04] px-5 text-white/75 hover:border-[#D4AF37]/35 hover:text-[#D4AF37]"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Quay lại
                </Button>
                <Button
                  type="button"
                  disabled={
                    selectedTagIds.length === 0 ||
                    createProfileMutation.isPending
                  }
                  onClick={handleSubmit}
                  className="h-12 rounded-2xl bg-[#D4AF37] px-6 text-sm font-bold text-black hover:bg-[#F5D46E] disabled:cursor-not-allowed disabled:opacity-45"
                >
                  {createProfileMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Tags className="mr-2 h-4 w-4" />
                  )}
                  Hoàn tất
                </Button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="mx-auto flex min-h-[520px] max-w-2xl flex-col items-center justify-center text-center">
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-[#D4AF37]/25 blur-2xl" />
                <span className="relative flex h-20 w-20 items-center justify-center rounded-full border border-[#D4AF37]/35 bg-[#D4AF37]/15 text-[#F5D46E]">
                  <PartyPopper className="h-10 w-10" />
                </span>
              </div>
              <h1 className="mt-6 font-heading text-3xl font-black text-white/92 sm:text-4xl">
                Cảm ơn bạn đã dành chút thời gian.
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-6 text-slate-400">
                TaleX đã lưu lại gu nội dung của bạn. Từ đây, các gợi ý sẽ dần
                gần hơn với thứ bạn muốn xem và đọc.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <SmallStat icon={Heart} label="Gu cá nhân" />
                <SmallStat icon={Sparkles} label="Gợi ý mềm hơn" />
              </div>
              <Button
                type="button"
                onClick={handleGoHome}
                className="mt-8 h-12 rounded-2xl bg-[#D4AF37] px-6 text-sm font-bold text-black hover:bg-[#F5D46E]"
              >
                Khám phá TaleX
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
