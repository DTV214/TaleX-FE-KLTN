"use client";

import { useMemo, useState } from "react";
import {
  AlertCircle,
  Check,
  Loader2,
  RefreshCw,
  Sparkles,
  Tags,
} from "lucide-react";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/shared/api/http-client";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { cn } from "@/shared/utils/utils";
import { isFullProfile, useAuthStore } from "../store/auth.store";
import {
  isMissingUserFeatureError,
  type OnboardingAgeSegment,
  type OnboardingGender,
  type PublicCategoryOption,
  type PublicTagOption,
  useCreateUserFeatureProfile,
  usePublicOnboardingCategories,
  usePublicOnboardingTags,
  useUserFeatureProfile,
} from "@/features/onboarding/api/user-onboarding.api";

type PreferenceOption = PublicCategoryOption | PublicTagOption;

const validGenders = new Set<OnboardingGender>(["MALE", "FEMALE", "UNKNOWN"]);
const validAgeSegments = new Set<OnboardingAgeSegment>(["TEEN", "MATURE"]);

const genderOptions: Array<{ value: OnboardingGender; label: string }> = [
  { value: "MALE", label: "Nam" },
  { value: "FEMALE", label: "Nữ" },
  { value: "UNKNOWN", label: "Riêng tư" },
];

const ageOptions: Array<{
  value: OnboardingAgeSegment;
  label: string;
  helper: string;
}> = [
  { value: "TEEN", label: "11-18", helper: "Thanh thiếu niên" },
  { value: "MATURE", label: "18+", helper: "Trưởng thành" },
];

function normalizeToken(value: string) {
  return value.trim().toLocaleLowerCase("vi-VN");
}

function uniqueValues(values: Array<string | undefined>) {
  const seen = new Set<string>();
  const result: string[] = [];

  values.forEach((value) => {
    const trimmedValue = value?.trim();
    if (!trimmedValue) return;

    const key = normalizeToken(trimmedValue);
    if (seen.has(key)) return;

    seen.add(key);
    result.push(trimmedValue);
  });

  return result;
}

function resolveSavedValues(
  values: string[],
  options: PreferenceOption[],
) {
  return values.map((value) => {
    const normalizedValue = normalizeToken(value);
    const option = options.find(
      (item) =>
        normalizeToken(item.id) === normalizedValue ||
        normalizeToken(item.name) === normalizedValue,
    );

    return option?.id ?? value;
  });
}

function getDisplayName(value: string, options: PreferenceOption[]) {
  const normalizedValue = normalizeToken(value);
  const option = options.find(
    (item) =>
      normalizeToken(item.id) === normalizedValue ||
      normalizeToken(item.name) === normalizedValue,
  );

  return option?.name ?? value;
}

function isOptionSelected(values: string[], option: PreferenceOption) {
  return values.some((value) => {
    const normalizedValue = normalizeToken(value);

    return (
      normalizeToken(option.id) === normalizedValue ||
      normalizeToken(option.name) === normalizedValue
    );
  });
}

function toggleOption(values: string[], option: PreferenceOption) {
  if (isOptionSelected(values, option)) {
    return values.filter((value) => {
      const normalizedValue = normalizeToken(value);

      return (
        normalizeToken(option.id) !== normalizedValue &&
        normalizeToken(option.name) !== normalizedValue
      );
    });
  }

  return [...values, option.id];
}

function normalizeGender(value: unknown): OnboardingGender {
  return typeof value === "string" && validGenders.has(value as OnboardingGender)
    ? (value as OnboardingGender)
    : "UNKNOWN";
}

function normalizeAge(value: unknown): OnboardingAgeSegment {
  return typeof value === "string" &&
    validAgeSegments.has(value as OnboardingAgeSegment)
    ? (value as OnboardingAgeSegment)
    : "MATURE";
}

function getGenderLabel(value: OnboardingGender) {
  return genderOptions.find((option) => option.value === value)?.label ?? "Riêng tư";
}

function getAgeLabel(value: OnboardingAgeSegment) {
  return ageOptions.find((option) => option.value === value)?.label ?? "18+";
}

function getAgeHelper(value: OnboardingAgeSegment) {
  return ageOptions.find((option) => option.value === value)?.helper ?? "Trưởng thành";
}

function toggleValue(values: string[], value: string) {
  return values.includes(value)
    ? values.filter((item) => item !== value)
    : [...values, value];
}

function SegmentPicker<TValue extends string>({
  title,
  options,
  value,
  onChange,
}: {
  title: string;
  options: Array<{ value: TValue; label: string; helper?: string }>;
  value: TValue;
  onChange: (value: TValue) => void;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <h3 className="mb-4 text-sm font-semibold text-white/88">{title}</h3>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {options.map((option) => {
          const selected = value === option.value;

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              className={cn(
                "flex min-h-12 items-center justify-between gap-3 rounded-xl border px-3 py-2 text-left transition hover:border-[#D4AF37]/45 hover:bg-[#D4AF37]/10",
                selected
                  ? "border-[#D4AF37]/60 bg-[#D4AF37]/12 text-[#F5D46E]"
                  : "border-white/10 bg-white/[0.035] text-white/78",
              )}
            >
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold">
                  {option.label}
                </span>
                {option.helper ? (
                  <span className="mt-0.5 block truncate text-xs font-medium text-slate-500">
                    {option.helper}
                  </span>
                ) : null}
              </span>
              <span
                className={cn(
                  "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border",
                  selected
                    ? "border-[#D4AF37] bg-[#D4AF37] text-black"
                    : "border-white/15 bg-black/30 text-white/30",
                )}
              >
                <Check className="h-3.5 w-3.5" />
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function PreferenceChip({
  children,
  tone = "default",
}: {
  children: React.ReactNode;
  tone?: "default" | "muted";
}) {
  return (
    <span
      className={cn(
        "inline-flex min-h-9 items-center rounded-full border px-3 py-1.5 text-xs font-semibold",
        tone === "muted"
          ? "border-white/10 bg-white/[0.035] text-slate-400"
          : "border-[#D4AF37]/30 bg-[#D4AF37]/10 text-[#F5D46E]",
      )}
    >
      {children}
    </span>
  );
}

function PreferencePicker({
  title,
  options,
  selectedValues,
  isLoading,
  isError,
  error,
  onRetry,
  onToggleOption,
  onToggleSavedValue,
}: {
  title: string;
  options: PreferenceOption[];
  selectedValues: string[];
  isLoading: boolean;
  isError: boolean;
  error: unknown;
  onRetry: () => void;
  onToggleOption: (option: PreferenceOption) => void;
  onToggleSavedValue: (value: string) => void;
}) {
  const optionIdSet = useMemo(
    () =>
      new Set(
        options.flatMap((option) => [
          normalizeToken(option.id),
          normalizeToken(option.name),
        ]),
      ),
    [options],
  );
  const orphanValues = selectedValues.filter(
    (value) => !optionIdSet.has(normalizeToken(value)),
  );

  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-white/88">{title}</h3>
        <span className="text-xs font-semibold text-slate-500">
          {selectedValues.length} đã chọn
        </span>
      </div>

      {isLoading && (
        <div className="grid gap-3 sm:grid-cols-2">
          {Array.from({ length: 8 }).map((_, index) => (
            <div
              key={index}
              className="h-11 animate-pulse rounded-xl border border-white/10 bg-white/[0.04]"
            />
          ))}
        </div>
      )}

      {isError && (
        <div className="rounded-xl border border-red-400/20 bg-red-400/[0.07] p-4">
          <p className="text-sm font-semibold text-red-100">
            Chưa tải được danh sách lựa chọn.
          </p>
          <p className="mt-1 text-xs leading-5 text-red-100/70">
            {getApiErrorMessage(error)}
          </p>
          <Button
            type="button"
            variant="outline"
            onClick={onRetry}
            className="mt-3 h-9 rounded-xl border-red-200/20 bg-red-300/10 text-red-100 hover:bg-red-300/15"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Thử lại
          </Button>
        </div>
      )}

      {!isLoading && !isError && (
        <div className="max-h-[360px] overflow-y-auto pr-1">
          <div className="grid gap-3 sm:grid-cols-2">
          {options.map((option) => {
            const selected = isOptionSelected(selectedValues, option);

            return (
              <button
                key={option.id}
                type="button"
                onClick={() => onToggleOption(option)}
                className={cn(
                  "flex min-h-11 items-center justify-between gap-3 rounded-xl border px-3 py-2 text-left text-sm font-semibold transition hover:border-[#D4AF37]/45 hover:bg-[#D4AF37]/10",
                  selected
                    ? "border-[#D4AF37]/60 bg-[#D4AF37]/12 text-[#F5D46E]"
                    : "border-white/10 bg-white/[0.035] text-white/78",
                )}
              >
                <span className="min-w-0 truncate">{option.name}</span>
                <span
                  className={cn(
                    "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border",
                    selected
                      ? "border-[#D4AF37] bg-[#D4AF37] text-black"
                      : "border-white/15 bg-black/30 text-white/30",
                  )}
                >
                  <Check className="h-3.5 w-3.5" />
                </span>
              </button>
            );
          })}
          </div>
        </div>
      )}

      {orphanValues.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2 border-t border-white/10 pt-4">
          {orphanValues.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => onToggleSavedValue(value)}
              className="inline-flex min-h-8 items-center rounded-full border border-white/10 bg-white/[0.035] px-3 py-1 text-xs font-semibold text-slate-400 transition hover:border-red-300/35 hover:text-red-100"
            >
              {value}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function ProfilePreferencesForm() {
  const { user, isAuthenticated } = useAuthStore();
  const canLoadProfile = isAuthenticated && isFullProfile(user);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedGender, setSelectedGender] =
    useState<OnboardingGender>("UNKNOWN");
  const [selectedAge, setSelectedAge] =
    useState<OnboardingAgeSegment>("MATURE");
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const profileQuery = useUserFeatureProfile(canLoadProfile);
  const categoriesQuery = usePublicOnboardingCategories(canLoadProfile);
  const tagsQuery = usePublicOnboardingTags(canLoadProfile);
  const updateFeatureMutation = useCreateUserFeatureProfile();

  const featureProfile = profileQuery.data;
  const categories = useMemo(
    () => categoriesQuery.data ?? [],
    [categoriesQuery.data],
  );
  const tags = useMemo(() => tagsQuery.data ?? [], [tagsQuery.data]);
  const missingFeatureProfile =
    profileQuery.isError && isMissingUserFeatureError(profileQuery.error);
  const hasFeatureError = profileQuery.isError && !missingFeatureProfile;

  const savedGenres = useMemo(
    () =>
      uniqueValues([
        ...(featureProfile?.onboardingGenres ?? []),
        ...(featureProfile?.onboardingMovieGeneres ?? []),
        ...(featureProfile?.onboardingMovieGenres ?? []),
      ]),
    [featureProfile],
  );
  const savedTags = useMemo(
    () =>
      uniqueValues([
        ...(featureProfile?.onboardingTags ?? []),
        ...(featureProfile?.onboardingComicGenres ?? []),
      ]),
    [featureProfile],
  );
  const currentGenres = useMemo(
    () => resolveSavedValues(savedGenres, categories),
    [categories, savedGenres],
  );
  const currentTags = useMemo(
    () => resolveSavedValues(savedTags, tags),
    [savedTags, tags],
  );
  const currentGender = normalizeGender(featureProfile?.gender);
  const currentAge = normalizeAge(featureProfile?.age);

  if (!canLoadProfile) {
    return null;
  }

  const displayedGenres = currentGenres.map((value) =>
    getDisplayName(value, categories),
  );
  const displayedTags = currentTags.map((value) => getDisplayName(value, tags));
  const isLoading =
    profileQuery.isLoading || categoriesQuery.isLoading || tagsQuery.isLoading;
  const isSaving = updateFeatureMutation.isPending;
  const canSave =
    !hasFeatureError &&
    validGenders.has(selectedGender) &&
    validAgeSegments.has(selectedAge);

  function handleCancel() {
    setSelectedGender(currentGender);
    setSelectedAge(currentAge);
    setSelectedGenres(currentGenres);
    setSelectedTags(currentTags);
    setIsEditing(false);
  }

  function handleEdit() {
    setSelectedGender(currentGender);
    setSelectedAge(currentAge);
    setSelectedGenres(currentGenres);
    setSelectedTags(currentTags);
    setIsEditing(true);
  }

  async function handleSave() {
    if (!canSave) return;

    const genrePayload = resolveSavedValues(selectedGenres, categories);
    const tagPayload = resolveSavedValues(selectedTags, tags);

    try {
      await updateFeatureMutation.mutateAsync({
        gender: selectedGender,
        age: selectedAge,
        onboardingGenres: genrePayload,
        onboardingTags: tagPayload,
      });

      await profileQuery.refetch();
      toast.success("Đã cập nhật sở thích nội dung của bạn.");
      setIsEditing(false);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  return (
    <section className="rounded-2xl border border-white/10 bg-[#121214]/88 p-6 shadow-[0_18px_50px_rgba(0,0,0,0.24)] transition hover:border-[#D4AF37]/35 sm:p-7">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Badge variant="premium" className="mb-3 gap-1.5 px-3 py-1 text-xs font-medium">
            <Sparkles className="h-3.5 w-3.5" />
            Gu nội dung
          </Badge>
          <h2 className="text-xl font-semibold tracking-normal text-white/90">
            Sở thích nội dung
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-400">
            Điều chỉnh thể loại và tag để TaleX cá nhân hóa nội dung gợi ý.
          </p>
        </div>

        {!isEditing && (
          <Button
            type="button"
            variant="outline"
            onClick={handleEdit}
            className="h-10 rounded-xl border-[#D4AF37]/25 bg-[#D4AF37]/10 px-4 text-[#F5D46E] hover:border-[#D4AF37]/45 hover:bg-[#D4AF37]/15"
          >
            <Tags className="mr-2 h-4 w-4" />
            Chỉnh sửa
          </Button>
        )}
      </div>

      {isLoading && (
        <div className="space-y-4">
          <div className="h-12 animate-pulse rounded-xl border border-white/10 bg-white/[0.04]" />
          <div className="h-12 animate-pulse rounded-xl border border-white/10 bg-white/[0.04]" />
        </div>
      )}

      {hasFeatureError && (
        <div className="rounded-xl border border-red-400/20 bg-red-400/[0.07] p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-300" />
            <div>
              <p className="text-sm font-semibold text-red-100">
                Chưa tải được hồ sơ sở thích.
              </p>
              <p className="mt-1 text-xs leading-5 text-red-100/70">
                {getApiErrorMessage(profileQuery.error)}
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => void profileQuery.refetch()}
            className="mt-4 h-9 rounded-xl border-red-200/20 bg-red-300/10 text-red-100 hover:bg-red-300/15"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Thử lại
          </Button>
        </div>
      )}

      {!isLoading && !hasFeatureError && !isEditing && (
        <div className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="mb-2 text-xs font-semibold uppercase text-slate-500">
                Giới tính
              </p>
              <p className="text-sm font-semibold text-white/88">
                {getGenderLabel(currentGender)}
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="mb-2 text-xs font-semibold uppercase text-slate-500">
                Độ tuổi
              </p>
              <p className="text-sm font-semibold text-white/88">
                {getAgeLabel(currentAge)}
              </p>
              <p className="mt-1 text-xs font-medium text-slate-500">
                {getAgeHelper(currentAge)}
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <p className="mb-3 text-xs font-semibold uppercase text-slate-500">
              Thể loại yêu thích
            </p>
            <div className="flex flex-wrap gap-2">
              {displayedGenres.length > 0 ? (
                displayedGenres.map((genre) => (
                  <PreferenceChip key={genre}>{genre}</PreferenceChip>
                ))
              ) : (
                <PreferenceChip tone="muted">Chưa chọn thể loại</PreferenceChip>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <p className="mb-3 text-xs font-semibold uppercase text-slate-500">
              Tag yêu thích
            </p>
            <div className="flex flex-wrap gap-2">
              {displayedTags.length > 0 ? (
                displayedTags.map((tag) => (
                  <PreferenceChip key={tag}>#{tag}</PreferenceChip>
                ))
              ) : (
                <PreferenceChip tone="muted">Chưa chọn tag</PreferenceChip>
              )}
            </div>
          </div>

          {missingFeatureProfile && (
            <div className="rounded-xl border border-[#D4AF37]/20 bg-[#D4AF37]/[0.055] p-4 text-sm leading-6 text-[#F5D46E]/82">
              Hồ sơ sở thích chưa được tạo. Bạn có thể chọn thể loại và tag rồi lưu lại tại đây.
            </div>
          )}
        </div>
      )}

      {!isLoading && !hasFeatureError && isEditing && (
        <div className="space-y-4">
          <SegmentPicker
            title="Giới tính"
            options={genderOptions}
            value={selectedGender}
            onChange={setSelectedGender}
          />
          <SegmentPicker
            title="Độ tuổi"
            options={ageOptions}
            value={selectedAge}
            onChange={setSelectedAge}
          />
          <PreferencePicker
            title="Thể loại yêu thích"
            options={categories}
            selectedValues={selectedGenres}
            isLoading={categoriesQuery.isLoading}
            isError={categoriesQuery.isError}
            error={categoriesQuery.error}
            onRetry={() => void categoriesQuery.refetch()}
            onToggleOption={(option) =>
              setSelectedGenres((current) => toggleOption(current, option))
            }
            onToggleSavedValue={(value) =>
              setSelectedGenres((current) => toggleValue(current, value))
            }
          />
          <PreferencePicker
            title="Tag nội dung"
            options={tags}
            selectedValues={selectedTags}
            isLoading={tagsQuery.isLoading}
            isError={tagsQuery.isError}
            error={tagsQuery.error}
            onRetry={() => void tagsQuery.refetch()}
            onToggleOption={(option) =>
              setSelectedTags((current) => toggleOption(current, option))
            }
            onToggleSavedValue={(value) =>
              setSelectedTags((current) => toggleValue(current, value))
            }
          />

          <div className="flex flex-col gap-3 border-t border-white/10 pt-5 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isSaving}
              className="h-11 rounded-xl border-white/10 bg-white/[0.04] px-5 text-white/72 hover:border-[#D4AF37]/35 hover:text-[#D4AF37]"
            >
              Hủy
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              disabled={!canSave || isSaving}
              className="h-11 rounded-xl bg-[#D4AF37] px-6 text-sm font-semibold text-black shadow-[0_0_18px_rgba(212,175,55,0.18)] hover:bg-[#E5C158] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Lưu sở thích
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}
