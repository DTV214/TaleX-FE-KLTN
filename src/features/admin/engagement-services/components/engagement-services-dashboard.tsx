"use client";

import { Megaphone, Plus, RefreshCw, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/shared/ui/button";
import { useGetEngagementServices } from "../hooks/use-engagement-services";
import type {
  EngagementService,
  EngagementServiceFilterParams,
} from "../types/engagement-services.types";
import { EngagementServiceFormModal } from "./engagement-service-form-modal";
import { EngagementServicesTable } from "./engagement-services-table";

const DEFAULT_PAGE_SIZE = 10;

export function EngagementServicesDashboard() {
  const [page, setPage] = useState(1);
  const [searchKey, setSearchKey] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingService, setEditingService] =
    useState<EngagementService | null>(null);

  const filters: EngagementServiceFilterParams = useMemo(
    () => ({
      page,
      pageSize: DEFAULT_PAGE_SIZE,
      sortBy: "createdAt",
      sortDirection: "DESC",
      criteria: {
        searchKey: searchKey.trim() || undefined,
      },
    }),
    [page, searchKey],
  );

  const servicesQuery = useGetEngagementServices(filters);
  const pageData = servicesQuery.data?.data;
  const services = pageData?.content ?? [];
  const totalPages = pageData?.totalPages ?? 1;
  const totalElements = pageData?.totalElements ?? 0;
  const currentPage = pageData?.pageNumber ?? page;
  const isFirstPage = pageData?.isFirst ?? page <= 1;
  const isLastPage = pageData?.isLast ?? page >= totalPages;

  function openCreateForm() {
    setEditingService(null);
    setIsFormOpen(true);
  }

  function openEditForm(service: EngagementService) {
    setEditingService(service);
    setIsFormOpen(true);
  }

  function closeForm() {
    setIsFormOpen(false);
    setEditingService(null);
  }

  function handleSearchChange(value: string) {
    setSearchKey(value);
    setPage(1);
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
      <h1 className="text-3xl font-bold tracking-tight text-slate-900 backoffice-dark:text-white">
        Quản Lý Dịch Vụ Tăng Tương Tác
      </h1>
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.04]">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_180px_180px_auto] lg:items-end">
          <label className="space-y-2">
            <span className="text-sm font-bold text-slate-800">
              Tìm kiếm tên dịch vụ
            </span>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={searchKey}
                onChange={(event) => handleSearchChange(event.target.value)}
                placeholder="Nhập tên dịch vụ..."
                className="h-11 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-3 text-sm font-semibold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-violet-500 focus:ring-4 focus:ring-violet-100 backoffice-dark:border-white/10 backoffice-dark:bg-black/30 backoffice-dark:text-white backoffice-dark:focus:ring-[rgba(212,175,55,0.16)]"
              />
            </div>
          </label>

          <Button
            type="button"
            variant="outline"
            onClick={() => servicesQuery.refetch()}
            className="h-11 border-slate-200 bg-white px-4 text-slate-700 hover:bg-slate-50"
          >
            <RefreshCw
              className={`h-4 w-4 ${servicesQuery.isFetching ? "animate-spin" : ""
                }`}
            />
            Làm mới
          </Button>

          <Button
            type="button"
            onClick={openCreateForm}
            className="h-11 bg-violet-600 px-5 font-bold text-white hover:bg-violet-700 backoffice-dark:bg-[var(--backoffice-primary)] backoffice-dark:text-black backoffice-dark:hover:bg-[var(--backoffice-primary-bright)]"
          >
            <Plus className="h-4 w-4" />
            Tạo mới dịch vụ
          </Button>
        </div>
      </section>

      <EngagementServicesTable
        services={services}
        isLoading={servicesQuery.isLoading}
        isError={servicesQuery.isError}
        onEdit={openEditForm}
      />

      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-semibold text-slate-500">
          Tổng cộng{" "}
          <span className="font-black text-slate-900">{totalElements}</span>{" "}
          dịch vụ. Trang{" "}
          <span className="font-black text-slate-900">{currentPage}</span> /{" "}
          <span className="font-black text-slate-900">
            {Math.max(totalPages, 1)}
          </span>
        </p>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={isFirstPage || servicesQuery.isFetching}
            onClick={() => setPage((value) => Math.max(1, value - 1))}
            className="h-9 border-slate-200 bg-white px-4 text-slate-700 hover:bg-slate-50"
          >
            Trước
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={isLastPage || servicesQuery.isFetching}
            onClick={() => setPage((value) => value + 1)}
            className="h-9 border-slate-200 bg-white px-4 text-slate-700 hover:bg-slate-50"
          >
            Sau
          </Button>
        </div>
      </div>

      <EngagementServiceFormModal
        isOpen={isFormOpen}
        onClose={closeForm}
        initialData={editingService}
      />
    </div>
  );
}
