"use client";

import {
  BookOpen,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  Film,
  Filter,
  Loader2,
  RefreshCw,
  RotateCcw,
  Search,
  Star,
  X,
} from "lucide-react";
import { useDeferredValue, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  type AdminSeriesContentType,
  type AdminSeriesFilterParams,
  type AdminSeriesItem,
  type AdminSeriesSortBy,
  type AdminSeriesStatus,
} from "@/features/admin/api/admin-series.api";
import {
  useGetAdminSeries,
  useToggleSeriesVisibility,
} from "@/features/admin/hooks/use-admin-series";

type ConfirmAction = "hide" | "unhide";
type ContentTypeFilter = "ALL" | AdminSeriesContentType;
type StatusFilter = "ALL" | AdminSeriesStatus;

const DEFAULT_PAGE_SIZE = 10;
const SERIES_FETCH_PAGE_SIZE = 1000;

const contentTypeStyles: Record<AdminSeriesContentType, string> = {
  VIDEO: "border-cyan-200 bg-cyan-50 text-cyan-700",
  COMIC: "border-amber-200 bg-amber-50 text-amber-700",
};

const statusStyles: Record<AdminSeriesStatus, string> = {
  DRAFT: "border-slate-200 bg-slate-100 text-slate-600",
  PUBLISHED: "border-emerald-200 bg-emerald-50 text-emerald-700",
  HIDDEN: "border-yellow-200 bg-yellow-50 text-yellow-700",
  DELETED: "border-red-200 bg-red-50 text-red-700",
  SCHEDULED: "border-blue-200 bg-blue-50 text-blue-700",
  INACTIVE: "border-slate-200 bg-slate-100 text-slate-600",
};

const contentTypeOptions: Array<{ label: string; value: ContentTypeFilter }> = [
  { label: "Tất cả loại", value: "ALL" },
  { label: "Phim bộ", value: "VIDEO" },
  { label: "Truyện tranh", value: "COMIC" },
];

const statusOptions: Array<{ label: string; value: StatusFilter }> = [
  { label: "Tất cả trạng thái", value: "ALL" },
  { label: "Bản nháp", value: "DRAFT" },
  { label: "Đã xuất bản", value: "PUBLISHED" },
  { label: "Đã ép ẩn", value: "HIDDEN" },
  { label: "Đã xóa", value: "DELETED" },
  { label: "Đã lên lịch", value: "SCHEDULED" },
  { label: "Không hoạt động", value: "INACTIVE" },
];

const sortOptions: Array<{ label: string; value: AdminSeriesSortBy }> = [
  { label: "Cập nhật gần nhất", value: "updatedAt" },
  { label: "Ngày tạo", value: "createdAt" },
  { label: "Tên tác phẩm", value: "title" },
  { label: "Lượt xem", value: "views" },
  { label: "Điểm đánh giá", value: "averageRating" },
];

const pageSizeOptions = [10, 20, 50];

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Thao tác thất bại.";
}

function formatNumber(value?: number | null) {
  return new Intl.NumberFormat("vi-VN").format(value ?? 0);
}

function formatDateTime(value?: string | null) {
  if (!value) return "Chưa có";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Chưa có";

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function normalizeSearchValue(value: unknown) {
  return String(value ?? "").trim().toLocaleLowerCase("vi-VN");
}

function seriesMatchesSearch(series: AdminSeriesItem, keyword: string) {
  if (!keyword) return true;

  return [
    series.title,
    series.id,
    series.creatorName,
    series.creatorId,
    series.accountId,
    series.language,
    ...series.categories.map((category) => category.name),
    ...series.tags.map((tag) => tag.name),
  ].some((value) => normalizeSearchValue(value).includes(keyword));
}

function getSortValue(series: AdminSeriesItem, sortBy: AdminSeriesSortBy) {
  if (sortBy === "views") return series.views ?? 0;
  if (sortBy === "averageRating") return series.averageRating ?? 0;
  if (sortBy === "createdAt") return new Date(series.createdAt ?? 0).getTime();
  if (sortBy === "updatedAt") return new Date(series.updatedAt ?? 0).getTime();

  return normalizeSearchValue(series.title);
}

function sortSeries(
  seriesList: AdminSeriesItem[],
  sortBy: AdminSeriesSortBy,
  sortDirection: "ASC" | "DESC",
) {
  const direction = sortDirection === "ASC" ? 1 : -1;

  return [...seriesList].sort((first, second) => {
    const firstValue = getSortValue(first, sortBy);
    const secondValue = getSortValue(second, sortBy);

    if (typeof firstValue === "number" && typeof secondValue === "number") {
      return (firstValue - secondValue) * direction;
    }

    return String(firstValue).localeCompare(String(secondValue), "vi") * direction;
  });
}

function getContentTypeLabel(type: AdminSeriesContentType) {
  return type === "VIDEO" ? "Phim bộ" : "Truyện tranh";
}

function ContentTypeBadge({ type }: { type: AdminSeriesContentType }) {
  const Icon = type === "VIDEO" ? Film : BookOpen;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold ${contentTypeStyles[type]}`}
    >
      <Icon className="h-3.5 w-3.5" />
      {getContentTypeLabel(type)}
    </span>
  );
}

function StatusBadge({ status }: { status: AdminSeriesStatus }) {
  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${statusStyles[status]}`}
    >
      {status}
    </span>
  );
}

function SeriesThumb({ series }: { series: AdminSeriesItem }) {
  const imageUrl = series.coverUrl || series.bannerUrl;

  if (!imageUrl) {
    const Icon = series.contentType === "VIDEO" ? Film : BookOpen;

    return (
      <div className="flex h-14 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-400 backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.04]">
        <Icon className="h-4 w-4" />
      </div>
    );
  }

  return (
    <img
      src={imageUrl}
      alt={series.title}
      className="h-14 w-10 shrink-0 rounded-lg object-cover"
      loading="lazy"
    />
  );
}

function SeriesConfirmModal({
  action,
  isLoading,
  onClose,
  onConfirm,
  open,
  series,
}: {
  action: ConfirmAction | null;
  isLoading: boolean;
  onClose: () => void;
  onConfirm: () => void;
  open: boolean;
  series: AdminSeriesItem | null;
}) {
  if (!open || !series || !action) return null;

  const title = action === "hide" ? "Ép ẩn tác phẩm?" : "Mở ẩn tác phẩm?";
  const description =
    action === "hide"
      ? "Tác phẩm sẽ bị ép ẩn khỏi các khu vực hiển thị công khai để xử lý vi phạm hoặc rà soát thêm."
      : "Tác phẩm sẽ được mở ẩn trở lại theo trạng thái backend cho phép.";

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-950">{title}</h2>
            <p className="mt-2 text-sm font-medium leading-6 text-slate-500">
              <span className="font-bold text-slate-900">{series.title}</span>{" "}
              - {description}
            </p>
            {action === "hide" && (
              <p className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-bold leading-6 text-red-700">
                Lưu ý: Việc ép ẩn cấp độ Series sẽ vô hiệu hóa hoàn toàn quyền
                thao tác chỉnh sửa/upload/xóa của Creator lên các nội dung
                Season, Episode, Media bên trong.
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
            aria-label="Đóng"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="inline-flex h-11 items-center justify-center rounded-lg border border-slate-200 bg-white px-5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-violet-600 px-5 text-sm font-bold text-white shadow-sm transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            {action === "hide" ? "Ép ẩn" : "Mở ẩn"}
          </button>
        </div>
      </div>
    </div>
  );
}

function FilterSelect<T extends string>({
  label,
  onChange,
  options,
  value,
}: {
  label: string;
  onChange: (value: T) => void;
  options: Array<{ label: string; value: T }>;
  value: T;
}) {
  return (
    <label className="min-w-0">
      <span className="mb-2 block truncate text-xs font-bold uppercase tracking-wide text-slate-500 backoffice-dark:text-white/45">
        {label}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as T)}
        className="h-11 w-full min-w-0 rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-100 backoffice-dark:border-white/10 backoffice-dark:bg-black/30 backoffice-dark:text-white backoffice-dark:focus:ring-[rgba(212,175,55,0.16)]"
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

function TableSkeleton() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, index) => (
        <tr key={index}>
          <td colSpan={7} className="px-6 py-4">
            <div className="h-16 animate-pulse rounded-xl bg-slate-100 backoffice-dark:bg-white/5" />
          </td>
        </tr>
      ))}
    </>
  );
}

export function AdminSeriesManagement() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [searchDraft, setSearchDraft] = useState("");
  const [contentType, setContentType] = useState<ContentTypeFilter>("ALL");
  const [status, setStatus] = useState<StatusFilter>("ALL");
  const [sortBy, setSortBy] = useState<AdminSeriesSortBy>("updatedAt");
  const [sortDirection, setSortDirection] = useState<"ASC" | "DESC">("DESC");
  const [isAdvancedFilterOpen, setIsAdvancedFilterOpen] = useState(false);
  const [selectedSeries, setSelectedSeries] = useState<AdminSeriesItem | null>(
    null,
  );
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);
  const deferredSearchDraft = useDeferredValue(searchDraft);
  const keyword = normalizeSearchValue(deferredSearchDraft);

  const filters = useMemo<AdminSeriesFilterParams>(
    () => ({
      page: 1,
      pageSize: SERIES_FETCH_PAGE_SIZE,
    }),
    [],
  );

  const seriesQuery = useGetAdminSeries(filters);
  const toggleVisibilityMutation = useToggleSeriesVisibility();

  const allSeriesList = seriesQuery.data?.content ?? [];
  const filteredSeriesList = useMemo(() => {
    const filtered = allSeriesList.filter((series) => {
      const matchesContentType =
        contentType === "ALL" || series.contentType === contentType;
      const matchesStatus = status === "ALL" || series.status === status;

      return (
        matchesContentType &&
        matchesStatus &&
        seriesMatchesSearch(series, keyword)
      );
    });

    return sortSeries(filtered, sortBy, sortDirection);
  }, [allSeriesList, contentType, keyword, sortBy, sortDirection, status]);

  const totalElements = filteredSeriesList.length;
  const totalPages = pageSize > 0 ? Math.ceil(totalElements / pageSize) : 0;
  const currentPage = totalPages === 0 ? 0 : Math.min(page, totalPages);
  const currentPageSize = pageSize;
  const seriesList =
    currentPage === 0
      ? []
      : filteredSeriesList.slice(
          (currentPage - 1) * pageSize,
          currentPage * pageSize,
        );
  const firstItem = totalElements === 0 ? 0 : (currentPage - 1) * currentPageSize + 1;
  const lastItem = Math.min(currentPage * currentPageSize, totalElements);
  const isMutating = toggleVisibilityMutation.isPending;

  const activeFilterCount = useMemo(
    () =>
      [
        keyword.trim(),
        contentType !== "ALL",
        status !== "ALL",
        sortBy !== "updatedAt",
        sortDirection !== "DESC",
        pageSize !== DEFAULT_PAGE_SIZE,
      ].filter(Boolean).length,
    [contentType, keyword, pageSize, sortBy, sortDirection, status],
  );

  function updateContentType(value: ContentTypeFilter) {
    setContentType(value);
    setPage(1);
  }

  function updateStatus(value: StatusFilter) {
    setStatus(value);
    setPage(1);
  }

  function updateSortBy(value: AdminSeriesSortBy) {
    setSortBy(value);
    setPage(1);
  }

  function updateSortDirection(value: "ASC" | "DESC") {
    setSortDirection(value);
    setPage(1);
  }

  function updatePageSize(value: string) {
    setPageSize(Number(value));
    setPage(1);
  }

  function resetFilters() {
    setPage(1);
    setPageSize(DEFAULT_PAGE_SIZE);
    setSearchDraft("");
    setContentType("ALL");
    setStatus("ALL");
    setSortBy("updatedAt");
    setSortDirection("DESC");
  }

  function openConfirm(series: AdminSeriesItem, action: ConfirmAction) {
    setSelectedSeries(series);
    setConfirmAction(action);
  }

  function closeConfirm() {
    if (isMutating) return;
    setSelectedSeries(null);
    setConfirmAction(null);
  }

  function handleConfirm() {
    if (!selectedSeries || !confirmAction) return;

    toggleVisibilityMutation.mutate(
      {
        id: selectedSeries.id,
        hidden: confirmAction === "unhide",
      },
      {
        onSuccess: () => {
          toast.success(
            confirmAction === "unhide"
              ? "Đã mở ẩn tác phẩm."
              : "Đã ép ẩn tác phẩm.",
          );
          setSelectedSeries(null);
          setConfirmAction(null);
        },
        onError: (error) => toast.error(getErrorMessage(error)),
      },
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-950 backoffice-dark:text-white">
            Quản lý tác phẩm (Series)
          </h1>
          <p className="mt-1 text-sm font-semibold text-slate-500 backoffice-dark:text-white/45">
            Theo dõi, lọc và xử lý ép ẩn các series trong hệ thống.
          </p>
        </div>

        <button
          type="button"
          onClick={() => seriesQuery.refetch()}
          disabled={seriesQuery.isFetching}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.04] backoffice-dark:text-white/70 backoffice-dark:hover:bg-white/10"
        >
          <RefreshCw
            className={seriesQuery.isFetching ? "h-4 w-4 animate-spin" : "h-4 w-4"}
          />
          Làm mới
        </button>
      </header>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.04]">
        <div className="grid gap-4 xl:grid-cols-[minmax(260px,1fr)_190px_210px_auto] xl:items-end">
          <div className="min-w-0">
            <label className="relative block min-w-0">
              <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500 backoffice-dark:text-white/45">
                Tìm kiếm
              </span>
              <Search className="absolute bottom-3.5 left-3 h-4 w-4 text-slate-400" />
              <input
                type="search"
                value={searchDraft}
                onChange={(event) => {
                  setPage(1);
                  setSearchDraft(event.target.value);
                }}
                placeholder="Tên, ID series, creator..."
                className="h-11 w-full min-w-0 rounded-lg border border-slate-200 bg-white pl-10 pr-3 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-violet-500 focus:ring-4 focus:ring-violet-100 backoffice-dark:border-white/10 backoffice-dark:bg-black/30 backoffice-dark:text-white backoffice-dark:focus:ring-[rgba(212,175,55,0.16)]"
              />
            </label>
          </div>

          <FilterSelect
            label="Loại nội dung"
            value={contentType}
            onChange={updateContentType}
            options={contentTypeOptions}
          />

          <FilterSelect
            label="Trạng thái"
            value={status}
            onChange={updateStatus}
            options={statusOptions}
          />

          <div className="flex min-w-0 flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setIsAdvancedFilterOpen((current) => !current)}
              aria-expanded={isAdvancedFilterOpen}
              className="inline-flex h-11 min-w-0 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.04] backoffice-dark:text-white/70 backoffice-dark:hover:bg-white/10"
            >
              <Filter className="h-4 w-4 text-violet-600 backoffice-dark:text-[var(--backoffice-primary)]" />
              <span className="truncate">Bộ lọc</span>
              {activeFilterCount > 0 && (
                <span className="rounded-full bg-violet-600 px-2 py-0.5 text-xs font-black text-white backoffice-dark:bg-[var(--backoffice-primary)] backoffice-dark:text-black">
                  {activeFilterCount}
                </span>
              )}
              <ChevronDown
                className={`h-4 w-4 shrink-0 transition-transform ${
                  isAdvancedFilterOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {activeFilterCount > 0 && (
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.04] backoffice-dark:text-white/70 backoffice-dark:hover:bg-white/10"
                aria-label="Xóa lọc"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {isAdvancedFilterOpen && (
          <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50/60 p-4 backoffice-dark:border-white/10 backoffice-dark:bg-black/20">
            <div className="grid gap-4 md:grid-cols-3">
              <FilterSelect
                label="Sắp xếp theo"
                value={sortBy}
                onChange={updateSortBy}
                options={sortOptions}
              />
              <FilterSelect
                label="Thứ tự"
                value={sortDirection}
                onChange={updateSortDirection}
                options={[
                  { label: "Mới nhất / cao nhất", value: "DESC" },
                  { label: "Cũ nhất / thấp nhất", value: "ASC" },
                ]}
              />
              <FilterSelect
                label="Số dòng"
                value={String(pageSize)}
                onChange={updatePageSize}
                options={pageSizeOptions.map((size) => ({
                  label: `${size} dòng / trang`,
                  value: String(size),
                }))}
              />
            </div>
          </div>
        )}
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.04]">
        <div className="border-b border-slate-200 bg-white px-6 py-4 backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.02]">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-950 backoffice-dark:text-white">
                Danh sách tác phẩm
              </h2>
              <p className="mt-0.5 text-sm font-semibold text-slate-500 backoffice-dark:text-white/45">
                Hiển thị {firstItem}-{lastItem} / {formatNumber(totalElements)} tác phẩm
              </p>
            </div>
            {seriesQuery.isFetching && (
              <span className="inline-flex w-fit items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-black text-violet-700 backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.06] backoffice-dark:text-[var(--backoffice-primary)]">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Đang đồng bộ
              </span>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1120px] text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500 backoffice-dark:border-white/10 backoffice-dark:bg-white/5 backoffice-dark:text-white/45">
              <tr>
                <th className="px-6 py-4">Tác phẩm</th>
                <th className="px-6 py-4">Creator</th>
                <th className="px-6 py-4">Loại</th>
                <th className="px-6 py-4">Trạng thái</th>
                <th className="px-6 py-4">Tương tác</th>
                <th className="px-6 py-4">Cập nhật</th>
                <th className="px-6 py-4 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 backoffice-dark:divide-white/10">
              {seriesQuery.isLoading && <TableSkeleton />}

              {!seriesQuery.isLoading && seriesQuery.isError && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-14 text-center text-sm font-semibold text-red-600"
                  >
                    Không thể tải danh sách tác phẩm.
                  </td>
                </tr>
              )}

              {!seriesQuery.isLoading &&
                !seriesQuery.isError &&
                seriesList.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-6 py-14 text-center text-sm font-medium text-slate-500"
                    >
                      {activeFilterCount > 0
                        ? "Không tìm thấy tác phẩm phù hợp với bộ lọc."
                        : "Chưa có tác phẩm nào trong hệ thống."}
                    </td>
                  </tr>
                )}

              {seriesList.map((series) => {
                const isHidden = series.status === "HIDDEN";
                const isDeleted = series.status === "DELETED" || series.isDeleted;
                const categoryLabel =
                  series.categories.map((category) => category.name).filter(Boolean).join(", ") ||
                  "Chưa có thể loại";

                return (
                  <tr
                    key={series.id}
                    className="transition hover:bg-slate-50/80 backoffice-dark:hover:bg-white/[0.05]"
                  >
                    <td className="px-6 py-4">
                      <div className="flex min-w-0 items-center gap-3">
                        <SeriesThumb series={series} />
                        <div className="min-w-0">
                          <p className="truncate font-bold text-slate-950 backoffice-dark:text-white">
                            {series.title}
                          </p>
                          <p className="mt-0.5 truncate text-xs font-semibold text-slate-400">
                            ID: {series.id}
                          </p>
                          <p className="mt-1 max-w-[320px] truncate text-xs font-medium text-slate-500 backoffice-dark:text-white/45">
                            {categoryLabel}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="max-w-[170px]">
                        <p className="truncate font-bold text-slate-800 backoffice-dark:text-white/80">
                          {series.creatorName || "Chưa có creator"}
                        </p>
                        <p className="mt-0.5 truncate text-xs font-medium text-slate-400">
                          {series.creatorId || series.accountId || "Chưa có ID"}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <ContentTypeBadge type={series.contentType} />
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={series.status} />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-2">
                        <span className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-bold text-slate-700 backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.06] backoffice-dark:text-white/75">
                          <Eye className="h-3.5 w-3.5 text-violet-600" />
                          {formatNumber(series.views)}
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-bold text-slate-700 backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.06] backoffice-dark:text-white/75">
                          <Star className="h-3.5 w-3.5 text-amber-500" />
                          {formatNumber(series.averageRating)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs font-semibold text-slate-500 backoffice-dark:text-white/55">
                      {formatDateTime(series.updatedAt || series.createdAt)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            openConfirm(series, isHidden ? "unhide" : "hide")
                          }
                          disabled={isMutating || isDeleted}
                          className="rounded-lg p-2 text-slate-400 transition hover:bg-violet-50 hover:text-violet-600 disabled:cursor-not-allowed disabled:opacity-40 backoffice-dark:hover:bg-white/10"
                          title={isHidden ? "Mở ẩn" : "Ép ẩn"}
                        >
                          {isHidden ? (
                            <Eye className="h-4 w-4" />
                          ) : (
                            <EyeOff className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50/70 px-6 py-4 backoffice-dark:border-white/10 backoffice-dark:bg-black/25 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs font-medium text-slate-500 backoffice-dark:text-white/65">
            Trang{" "}
            <span className="font-bold text-slate-900 backoffice-dark:text-white">
              {totalPages === 0 ? 0 : currentPage}
            </span>{" "}
            / {Math.max(totalPages, 1)}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((current) => Math.max(current - 1, 1))}
              disabled={currentPage <= 1 || seriesQuery.isFetching}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-40 backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.04] backoffice-dark:text-white/60 backoffice-dark:hover:bg-white/10 backoffice-dark:hover:text-white"
              aria-label="Trang trước"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="min-w-24 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-center text-xs font-bold text-slate-600 shadow-sm backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.04] backoffice-dark:text-white/75">
              {totalPages === 0 ? 0 : currentPage}/{Math.max(totalPages, 1)}
            </span>
            <button
              type="button"
              onClick={() =>
                setPage((current) =>
                  totalPages > 0 ? Math.min(current + 1, totalPages) : current,
                )
              }
              disabled={
                totalPages === 0 ||
                currentPage >= totalPages ||
                seriesQuery.isFetching
              }
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-40 backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.04] backoffice-dark:text-white/60 backoffice-dark:hover:bg-white/10 backoffice-dark:hover:text-white"
              aria-label="Trang sau"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>

      <SeriesConfirmModal
        action={confirmAction}
        isLoading={isMutating}
        onClose={closeConfirm}
        onConfirm={handleConfirm}
        open={Boolean(confirmAction)}
        series={selectedSeries}
      />
    </div>
  );
}
