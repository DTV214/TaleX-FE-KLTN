"use client";

import {
  ArrowUpDown,
  ChevronDown,
  CreditCard,
  Filter,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/shared/ui/button";
import type {
  SortDirection,
  Subscription,
  SubscriptionDurationUnit,
  SubscriptionFilterParams,
  SubscriptionSortBy,
} from "../types/subscriptions.types";
import { useGetSubscriptions } from "../hooks/use-subscriptions";
import { SubscriptionFormModal } from "./subscription-form-modal";
import { SubscriptionsTable } from "./subscriptions-table";

const DEFAULT_PAGE_SIZE = 10;

type BooleanFilter = "ALL" | "YES" | "NO";
type DurationUnitFilter = "ALL" | SubscriptionDurationUnit;

const sortOptions: Array<{ label: string; value: SubscriptionSortBy }> = [
  { label: "Ngày tạo", value: "createdAt" },
  { label: "Ngày cập nhật", value: "updatedAt" },
  { label: "Giá", value: "price" },
  { label: "Thời hạn", value: "duration" },
  { label: "Lượt mua", value: "totalPurchases" },
];

const booleanOptions = [
  { label: "Tất cả", value: "ALL" },
  { label: "Có", value: "YES" },
  { label: "Không", value: "NO" },
];

function toBooleanFilter(value: BooleanFilter) {
  if (value === "YES") {
    return true;
  }

  if (value === "NO") {
    return false;
  }

  return undefined;
}

function toOptionalNumber(value: string) {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return undefined;
  }

  const parsedValue = Number(trimmedValue);
  return Number.isFinite(parsedValue) ? parsedValue : undefined;
}

function toOptionalDateTime(value: string) {
  return value.trim() || undefined;
}

function toDurationUnits(value: DurationUnitFilter) {
  return value === "ALL" ? undefined : [value];
}

export function SubscriptionsDashboard() {
  const [page, setPage] = useState(1);
  const [searchDraft, setSearchDraft] = useState("");
  const [searchKey, setSearchKey] = useState("");
  const [durationUnit, setDurationUnit] =
    useState<DurationUnitFilter>("ALL");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [minDuration, setMinDuration] = useState("");
  const [maxDuration, setMaxDuration] = useState("");
  const [minTotalPurchases, setMinTotalPurchases] = useState("");
  const [maxTotalPurchases, setMaxTotalPurchases] = useState("");
  const [createdAtFrom, setCreatedAtFrom] = useState("");
  const [createdAtTo, setCreatedAtTo] = useState("");
  const [updatedAtFrom, setUpdatedAtFrom] = useState("");
  const [updatedAtTo, setUpdatedAtTo] = useState("");
  const [adFilter, setAdFilter] = useState<BooleanFilter>("ALL");
  const [movieFilter, setMovieFilter] = useState<BooleanFilter>("ALL");
  const [storyFilter, setStoryFilter] = useState<BooleanFilter>("ALL");
  const [sortBy, setSortBy] = useState<SubscriptionSortBy>("createdAt");
  const [sortDirection, setSortDirection] = useState<SortDirection>("DESC");
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSubscription, setEditingSubscription] =
    useState<Subscription | null>(null);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setPage(1);
      setSearchKey(searchDraft);
    }, 400);

    return () => window.clearTimeout(timeoutId);
  }, [searchDraft]);

  const filters = useMemo<SubscriptionFilterParams>(() => {
    const trimmedSearch = searchKey.trim();
    const durationUnits = toDurationUnits(durationUnit);
    const isAdBlocked = toBooleanFilter(adFilter);
    const isMovieUnlocked = toBooleanFilter(movieFilter);
    const isStoryUnlocked = toBooleanFilter(storyFilter);
    const parsedMinPrice = toOptionalNumber(minPrice);
    const parsedMaxPrice = toOptionalNumber(maxPrice);
    const parsedMinDuration = toOptionalNumber(minDuration);
    const parsedMaxDuration = toOptionalNumber(maxDuration);
    const parsedMinTotalPurchases = toOptionalNumber(minTotalPurchases);
    const parsedMaxTotalPurchases = toOptionalNumber(maxTotalPurchases);
    const parsedCreatedAtFrom = toOptionalDateTime(createdAtFrom);
    const parsedCreatedAtTo = toOptionalDateTime(createdAtTo);
    const parsedUpdatedAtFrom = toOptionalDateTime(updatedAtFrom);
    const parsedUpdatedAtTo = toOptionalDateTime(updatedAtTo);

    return {
      ...(trimmedSearch ? { searchKey: trimmedSearch } : {}),
      ...(durationUnits ? { durationUnits } : {}),
      ...(parsedMinPrice !== undefined ? { minPrice: parsedMinPrice } : {}),
      ...(parsedMaxPrice !== undefined ? { maxPrice: parsedMaxPrice } : {}),
      ...(parsedMinDuration !== undefined
        ? { minDuration: parsedMinDuration }
        : {}),
      ...(parsedMaxDuration !== undefined
        ? { maxDuration: parsedMaxDuration }
        : {}),
      ...(parsedMinTotalPurchases !== undefined
        ? { minTotalPurchases: parsedMinTotalPurchases }
        : {}),
      ...(parsedMaxTotalPurchases !== undefined
        ? { maxTotalPurchases: parsedMaxTotalPurchases }
        : {}),
      ...(isAdBlocked !== undefined ? { isAdBlocked } : {}),
      ...(isMovieUnlocked !== undefined ? { isMovieUnlocked } : {}),
      ...(isStoryUnlocked !== undefined ? { isStoryUnlocked } : {}),
      ...(parsedCreatedAtFrom ? { createdAtFrom: parsedCreatedAtFrom } : {}),
      ...(parsedCreatedAtTo ? { createdAtTo: parsedCreatedAtTo } : {}),
      ...(parsedUpdatedAtFrom ? { updatedAtFrom: parsedUpdatedAtFrom } : {}),
      ...(parsedUpdatedAtTo ? { updatedAtTo: parsedUpdatedAtTo } : {}),
      page,
      pageSize: DEFAULT_PAGE_SIZE,
      sortBy,
      sortDirection,
    };
  }, [
    adFilter,
    createdAtFrom,
    createdAtTo,
    durationUnit,
    maxDuration,
    maxPrice,
    maxTotalPurchases,
    minDuration,
    minPrice,
    minTotalPurchases,
    movieFilter,
    page,
    searchKey,
    sortBy,
    sortDirection,
    storyFilter,
    updatedAtFrom,
    updatedAtTo,
  ]);

  const activeFilterCount = useMemo(() => {
    return [
      durationUnit !== "ALL",
      minPrice.trim(),
      maxPrice.trim(),
      minDuration.trim(),
      maxDuration.trim(),
      minTotalPurchases.trim(),
      maxTotalPurchases.trim(),
      createdAtFrom.trim(),
      createdAtTo.trim(),
      updatedAtFrom.trim(),
      updatedAtTo.trim(),
      adFilter !== "ALL",
      movieFilter !== "ALL",
      storyFilter !== "ALL",
    ].filter(Boolean).length;
  }, [
    adFilter,
    createdAtFrom,
    createdAtTo,
    durationUnit,
    maxDuration,
    maxPrice,
    maxTotalPurchases,
    minDuration,
    minPrice,
    minTotalPurchases,
    movieFilter,
    storyFilter,
    updatedAtFrom,
    updatedAtTo,
  ]);

  const subscriptionsQuery = useGetSubscriptions(filters);
  const pageData = subscriptionsQuery.data?.data;
  const subscriptions = pageData?.content ?? [];

  function openCreateModal() {
    setEditingSubscription(null);
    setIsModalOpen(true);
  }

  function openUpdateModal(subscription: Subscription) {
    setEditingSubscription(subscription);
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
    setEditingSubscription(null);
  }

  function updateFilter(setter: (value: string) => void, value: string) {
    setPage(1);
    setter(value);
  }

  function updateBooleanFilter(
    setter: (value: BooleanFilter) => void,
    value: BooleanFilter,
  ) {
    setPage(1);
    setter(value);
  }

  function updateDurationUnit(value: DurationUnitFilter) {
    setPage(1);
    setDurationUnit(value);
  }

  function updateSortBy(value: SubscriptionSortBy) {
    setPage(1);
    setSortBy(value);
  }

  function updateSortDirection(value: SortDirection) {
    setPage(1);
    setSortDirection(value);
  }

  function resetFilters() {
    setPage(1);
    setSearchDraft("");
    setSearchKey("");
    setDurationUnit("ALL");
    setMinPrice("");
    setMaxPrice("");
    setMinDuration("");
    setMaxDuration("");
    setMinTotalPurchases("");
    setMaxTotalPurchases("");
    setCreatedAtFrom("");
    setCreatedAtTo("");
    setUpdatedAtFrom("");
    setUpdatedAtTo("");
    setAdFilter("ALL");
    setMovieFilter("ALL");
    setStoryFilter("ALL");
    setSortBy("createdAt");
    setSortDirection("DESC");
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
      <header className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div className="flex gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-[#E6F7F9] text-[#007A8A]">
            <CreditCard className="h-6 w-6" />
          </div>
          <div>
            <p className="mb-1 text-sm font-medium text-gray-500">
              Admin / Gói Premium
            </p>
            <h1 className="font-heading text-3xl font-bold tracking-tight text-gray-900">
              Quản lý Gói Premium
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">
              Quản lý giá, thời hạn, lượt mua và quyền lợi của các gói Premium
              trong hệ thống.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={() => subscriptionsQuery.refetch()}
            disabled={subscriptionsQuery.isFetching}
            className="border-gray-200 bg-white text-gray-700 shadow-sm hover:bg-gray-50"
          >
            <RefreshCw
              className={
                subscriptionsQuery.isFetching
                  ? "h-4 w-4 animate-spin"
                  : "h-4 w-4"
              }
            />
            Làm mới
          </Button>
          <Button
            type="button"
            size="lg"
            onClick={openCreateModal}
            className="bg-[#007A8A] text-white shadow-sm hover:bg-[#006673]"
          >
            <Plus className="h-4 w-4" />
            Tạo mới Gói
          </Button>
        </div>
      </header>

      <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="grid gap-4 lg:grid-cols-[minmax(280px,1fr)_220px_170px_auto] lg:items-end">
          <label className="relative block">
            <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-gray-500">
              Tìm kiếm
            </span>
            <Search className="absolute bottom-3.5 left-3 h-4 w-4 text-gray-400" />
            <input
              type="search"
              value={searchDraft}
              onChange={(event) => setSearchDraft(event.target.value)}
              placeholder="Tìm theo tên hoặc mô tả gói..."
              className="h-11 w-full rounded-lg border border-gray-200 bg-white pl-10 pr-3 text-sm font-medium text-gray-900 outline-none transition focus:border-[#007A8A] focus:ring-4 focus:ring-[#007A8A]/10"
            />
          </label>

          <FilterSelect
            label="Sắp xếp theo"
            value={sortBy}
            onChange={(value) => updateSortBy(value as SubscriptionSortBy)}
            options={sortOptions}
          />

          <FilterSelect
            label="Thứ tự"
            value={sortDirection}
            onChange={(value) => updateSortDirection(value as SortDirection)}
            options={[
              { label: "Giảm dần", value: "DESC" },
              { label: "Tăng dần", value: "ASC" },
            ]}
          />

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsFilterPanelOpen((current) => !current)}
              aria-expanded={isFilterPanelOpen}
              className="h-11 border-gray-200 bg-white px-4 text-gray-700 shadow-sm hover:bg-gray-50"
            >
              <Filter className="h-4 w-4 text-[#007A8A]" />
              Bộ lọc
              {activeFilterCount > 0 && (
                <span className="ml-1 rounded-full bg-[#007A8A] px-2 py-0.5 text-xs font-black text-white">
                  {activeFilterCount}
                </span>
              )}
              <ChevronDown
                className={`h-4 w-4 transition-transform ${
                  isFilterPanelOpen ? "rotate-180" : ""
                }`}
              />
            </Button>
            {activeFilterCount > 0 && (
              <Button
                type="button"
                variant="outline"
                onClick={resetFilters}
                className="h-11 border-gray-200 bg-white px-3 text-gray-700 shadow-sm hover:bg-gray-50"
                aria-label="Xóa lọc"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {isFilterPanelOpen && (
          <div className="mt-5 rounded-xl border border-gray-100 bg-gray-50/60 p-4">
            <div className="mb-4 flex items-center gap-2 text-sm font-bold text-gray-900">
              <ArrowUpDown className="h-4 w-4 text-[#007A8A]" />
              Lọc chi tiết
            </div>

            <div className="grid gap-4 lg:grid-cols-4">
              <FilterSelect
                label="Đơn vị thời hạn"
                value={durationUnit}
                onChange={(value) =>
                  updateDurationUnit(value as DurationUnitFilter)
                }
                options={[
                  { label: "Tất cả", value: "ALL" },
                  { label: "Ngày", value: "Days" },
                  { label: "Tháng", value: "Months" },
                  { label: "Năm", value: "Years" },
                ]}
              />

              <FilterSelect
                label="Chặn quảng cáo"
                value={adFilter}
                onChange={(value) =>
                  updateBooleanFilter(setAdFilter, value as BooleanFilter)
                }
                options={booleanOptions}
              />
              <FilterSelect
                label="Mở khóa phim"
                value={movieFilter}
                onChange={(value) =>
                  updateBooleanFilter(setMovieFilter, value as BooleanFilter)
                }
                options={booleanOptions}
              />
              <FilterSelect
                label="Mở khóa truyện"
                value={storyFilter}
                onChange={(value) =>
                  updateBooleanFilter(setStoryFilter, value as BooleanFilter)
                }
                options={booleanOptions}
              />

              <NumberFilter
                label="Giá từ"
                value={minPrice}
                onChange={(value) => updateFilter(setMinPrice, value)}
              />
              <NumberFilter
                label="Giá đến"
                value={maxPrice}
                onChange={(value) => updateFilter(setMaxPrice, value)}
              />
              <NumberFilter
                label="Thời hạn từ"
                value={minDuration}
                onChange={(value) => updateFilter(setMinDuration, value)}
              />
              <NumberFilter
                label="Thời hạn đến"
                value={maxDuration}
                onChange={(value) => updateFilter(setMaxDuration, value)}
              />

              <NumberFilter
                label="Lượt mua từ"
                value={minTotalPurchases}
                onChange={(value) => updateFilter(setMinTotalPurchases, value)}
              />
              <NumberFilter
                label="Lượt mua đến"
                value={maxTotalPurchases}
                onChange={(value) => updateFilter(setMaxTotalPurchases, value)}
              />
              <DateTimeFilter
                label="Tạo từ"
                value={createdAtFrom}
                onChange={(value) => updateFilter(setCreatedAtFrom, value)}
              />
              <DateTimeFilter
                label="Tạo đến"
                value={createdAtTo}
                onChange={(value) => updateFilter(setCreatedAtTo, value)}
              />

              <DateTimeFilter
                label="Cập nhật từ"
                value={updatedAtFrom}
                onChange={(value) => updateFilter(setUpdatedAtFrom, value)}
              />
              <DateTimeFilter
                label="Cập nhật đến"
                value={updatedAtTo}
                onChange={(value) => updateFilter(setUpdatedAtTo, value)}
              />
            </div>
          </div>
        )}
      </section>

      {subscriptionsQuery.isError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-bold text-red-700">
          Không thể tải danh sách gói Premium. Kiểm tra API
          `/api/v1/subscriptions`.
        </div>
      )}

      <SubscriptionsTable
        subscriptions={subscriptions}
        page={pageData?.pageNumber ?? page}
        pageSize={pageData?.pageSize ?? DEFAULT_PAGE_SIZE}
        totalPages={pageData?.totalPages ?? 0}
        totalElements={pageData?.totalElements ?? 0}
        isLoading={subscriptionsQuery.isLoading}
        onPageChange={setPage}
        onEdit={openUpdateModal}
      />

      <SubscriptionFormModal
        isOpen={isModalOpen}
        onClose={closeModal}
        initialData={editingSubscription}
      />
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ label: string; value: string }>;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-gray-500">
        {label}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm font-semibold text-gray-700 outline-none transition focus:border-[#007A8A] focus:ring-4 focus:ring-[#007A8A]/10"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function NumberFilter({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-gray-500">
        {label}
      </span>
      <input
        type="number"
        min="0"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm font-semibold text-gray-700 outline-none transition focus:border-[#007A8A] focus:ring-4 focus:ring-[#007A8A]/10"
      />
    </label>
  );
}

function DateTimeFilter({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-gray-500">
        {label}
      </span>
      <input
        type="datetime-local"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm font-semibold text-gray-700 outline-none transition focus:border-[#007A8A] focus:ring-4 focus:ring-[#007A8A]/10"
      />
    </label>
  );
}
