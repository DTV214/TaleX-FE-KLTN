"use client";

import { Filter, Plus, RefreshCw, Search, ShieldCheck } from "lucide-react";
import { type FormEvent, useMemo, useState } from "react";
import { Button } from "@/shared/ui/button";
import type { CreatorTier } from "../types/creator-tiers.types";
import { useGetCreatorTiers } from "../hooks/use-creator-tiers";
import { CreatorTierFormModal } from "./creator-tier-form-modal";
import { CreatorTiersTable } from "./creator-tiers-table";

const DEFAULT_PAGE_SIZE = 10;

type DefaultFilter = "ALL" | "DEFAULT" | "CUSTOM";

export function CreatorTiersDashboard() {
  const [page, setPage] = useState(1);
  const [tierNameDraft, setTierNameDraft] = useState("");
  const [tierNameFilter, setTierNameFilter] = useState("");
  const [defaultFilter, setDefaultFilter] = useState<DefaultFilter>("ALL");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTier, setEditingTier] = useState<CreatorTier | null>(null);

  const filters = useMemo(() => {
    const trimmedTierName = tierNameFilter.trim();

    return {
      ...(trimmedTierName ? { tierName: trimmedTierName } : {}),
      ...(defaultFilter === "DEFAULT"
        ? { isDefault: true }
        : defaultFilter === "CUSTOM"
          ? { isDefault: false }
          : {}),
      page,
      pageSize: DEFAULT_PAGE_SIZE,
      sortBy: "tierLevel" as const,
      sortDirection: "ASC" as const,
    };
  }, [defaultFilter, page, tierNameFilter]);

  const tiersQuery = useGetCreatorTiers(filters);
  const pageData = tiersQuery.data?.data;
  const tiers = pageData?.content ?? [];

  function openCreateModal() {
    setEditingTier(null);
    setIsModalOpen(true);
  }

  function openUpdateModal(tier: CreatorTier) {
    setEditingTier(tier);
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
    setEditingTier(null);
  }

  function handleSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPage(1);
    setTierNameFilter(tierNameDraft);
  }

  function handleDefaultFilterChange(value: DefaultFilter) {
    setPage(1);
    setDefaultFilter(value);
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
      <header className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div className="flex gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 backoffice-dark:text-white">
              Quản lý cấp Creator
            </h1>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={() => tiersQuery.refetch()}
            disabled={tiersQuery.isFetching}
            className="border-gray-200 bg-white text-gray-700 shadow-sm hover:bg-gray-50 backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.04] backoffice-dark:text-white/70 backoffice-dark:hover:bg-white/10"
          >
            <RefreshCw
              className={
                tiersQuery.isFetching ? "h-4 w-4 animate-spin" : "h-4 w-4"
              }
            />
            Làm mới
          </Button>
          <Button
            type="button"
            size="lg"
            onClick={openCreateModal}
            className="bg-violet-600 text-white shadow-sm hover:bg-violet-700 backoffice-dark:bg-[var(--backoffice-primary)] backoffice-dark:text-black backoffice-dark:hover:bg-[var(--backoffice-primary-bright)]"
          >
            <Plus className="h-4 w-4" />
            Tạo mới Tier
          </Button>
        </div>
      </header>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.04]">
        <div className="mb-4 flex items-center gap-2 text-sm font-bold text-gray-900 backoffice-dark:text-white">
          <Filter className="h-4 w-4 text-violet-600 backoffice-dark:text-[var(--backoffice-primary)]" />
          Bộ lọc
        </div>

        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <form
            onSubmit={handleSearchSubmit}
            className="relative w-full lg:max-w-xl"
          >
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="search"
              value={tierNameDraft}
              onChange={(event) => setTierNameDraft(event.target.value)}
              placeholder="Tìm kiếm theo tên tier..."
              className="h-11 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-24 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-violet-500 focus:ring-4 focus:ring-violet-100 backoffice-dark:border-white/10 backoffice-dark:bg-black/30 backoffice-dark:text-white backoffice-dark:focus:ring-[rgba(212,175,55,0.16)]"
            />
            <button
              type="submit"
              className="absolute right-1.5 top-1/2 h-8 -translate-y-1/2 rounded-md bg-violet-600 px-3 text-xs font-bold text-white transition hover:bg-violet-700 backoffice-dark:bg-[var(--backoffice-primary)] backoffice-dark:text-black backoffice-dark:hover:bg-[var(--backoffice-primary-bright)]"
            >
              Tìm
            </button>
          </form>

          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
            <label className="text-xs font-bold uppercase tracking-wide text-gray-500 backoffice-dark:text-white/45">
              Trạng thái mặc định
            </label>
            <select
              value={defaultFilter}
              onChange={(event) =>
                handleDefaultFilterChange(event.target.value as DefaultFilter)
              }
              className="h-11 min-w-48 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-100 backoffice-dark:border-white/10 backoffice-dark:bg-black/30 backoffice-dark:text-white backoffice-dark:focus:ring-[rgba(212,175,55,0.16)]"
            >
              <option value="ALL">Tất cả</option>
              <option value="DEFAULT">Mặc định</option>
              <option value="CUSTOM">Tùy chỉnh</option>
            </select>
          </div>
        </div>
      </section>

      {tiersQuery.isError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-bold text-red-700 backoffice-dark:border-red-400/30 backoffice-dark:bg-red-400/10 backoffice-dark:text-red-200">
          Không thể tải danh sách cấp Creator. Kiểm tra API
          `/api/v1/creator-tiers`.
        </div>
      )}

      <CreatorTiersTable
        tiers={tiers}
        page={pageData?.pageNumber ?? page}
        pageSize={pageData?.pageSize ?? DEFAULT_PAGE_SIZE}
        totalPages={pageData?.totalPages ?? 0}
        totalElements={pageData?.totalElements ?? 0}
        isLoading={tiersQuery.isLoading}
        onPageChange={setPage}
        onEdit={openUpdateModal}
      />

      <CreatorTierFormModal
        isOpen={isModalOpen}
        onClose={closeModal}
        initialData={editingTier}
      />
    </div>
  );
}
