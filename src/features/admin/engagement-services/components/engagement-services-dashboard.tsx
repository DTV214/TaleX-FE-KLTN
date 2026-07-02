"use client";

import { Megaphone, Plus, RefreshCw, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/shared/ui/button";
import { useGetEngagementServices } from "../hooks/use-engagement-services";
import type {
  EngagementService,
  EngagementServiceFilterParams,
  EngagementTarget,
  EngagementType,
} from "../types/engagement-services.types";
import { EngagementServiceFormModal } from "./engagement-service-form-modal";
import { EngagementServicesTable } from "./engagement-services-table";

const DEFAULT_PAGE_SIZE = 10;

type TypeFilter = "ALL" | EngagementType;
type TargetFilter = "ALL" | EngagementTarget;

function toTypes(value: TypeFilter) {
  return value === "ALL" ? undefined : [value];
}

function toTargets(value: TargetFilter) {
  return value === "ALL" ? undefined : [value];
}

export function EngagementServicesDashboard() {
  const [page, setPage] = useState(1);
  const [searchKey, setSearchKey] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("ALL");
  const [targetFilter, setTargetFilter] = useState<TargetFilter>("ALL");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingService, setEditingService] =
    useState<EngagementService | null>(null);

  const filters: EngagementServiceFilterParams = useMemo(
    () => ({
      page,
      pageSize: DEFAULT_PAGE_SIZE,
      sortBy: "createdAt",
      sortDirection: "DESC",
      types: toTypes(typeFilter),
      targets: toTargets(targetFilter),
      criteria: {
        searchKey: searchKey.trim() || undefined,
      },
    }),
    [page, searchKey, targetFilter, typeFilter],
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

  function handleTypeChange(value: TypeFilter) {
    setTypeFilter(value);
    setPage(1);
  }

  function handleTargetChange(value: TargetFilter) {
    setTargetFilter(value);
    setPage(1);
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
      <div className="flex flex-col gap-5 rounded-xl border border-slate-200 bg-white p-6 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-[#E6F7F9] text-[#007A8A]">
            <Megaphone className="h-6 w-6" />
          </div>
          <div>
            <p className="mb-1 text-sm font-bold text-slate-500">
              Admin / Engagement Services
            </p>
            <h1 className="font-heading text-3xl font-black text-slate-900">
              Quản lý Dịch vụ Tương tác
            </h1>
            <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-slate-500">
              Quản lý các gói đẩy lượt xem, lượt theo dõi và lượt thích cho hệ
              thống TaleX.
            </p>
          </div>
        </div>

        <Button
          type="button"
          onClick={openCreateForm}
          className="h-11 bg-[#007A8A] px-5 font-bold text-white hover:bg-[#006673]"
        >
          <Plus className="h-4 w-4" />
          Tạo mới dịch vụ
        </Button>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_180px_180px_auto] lg:items-end">
          <label className="space-y-2">
            <span className="text-sm font-bold text-slate-800">
              Tìm kiếm tên
            </span>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={searchKey}
                onChange={(event) => handleSearchChange(event.target.value)}
                placeholder="Nhập tên dịch vụ..."
                className="h-11 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-3 text-sm font-semibold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#007A8A] focus:ring-4 focus:ring-[#007A8A]/10"
              />
            </div>
          </label>

          <label className="space-y-2">
            <span className="text-sm font-bold text-slate-800">Types</span>
            <select
              value={typeFilter}
              onChange={(event) =>
                handleTypeChange(event.target.value as TypeFilter)
              }
              className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-[#007A8A] focus:ring-4 focus:ring-[#007A8A]/10"
            >
              <option value="ALL">Tất cả</option>
              <option value="BROAD">BROAD</option>
              <option value="TARGETED">TARGETED</option>
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-sm font-bold text-slate-800">Targets</span>
            <select
              value={targetFilter}
              onChange={(event) =>
                handleTargetChange(event.target.value as TargetFilter)
              }
              className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-[#007A8A] focus:ring-4 focus:ring-[#007A8A]/10"
            >
              <option value="ALL">Tất cả</option>
              <option value="VIEW">VIEW</option>
              <option value="FOLLOW">FOLLOW</option>
              <option value="LIKE">LIKE</option>
            </select>
          </label>

          <Button
            type="button"
            variant="outline"
            onClick={() => servicesQuery.refetch()}
            className="h-11 border-slate-200 bg-white px-4 text-slate-700 hover:bg-slate-50"
          >
            <RefreshCw
              className={`h-4 w-4 ${
                servicesQuery.isFetching ? "animate-spin" : ""
              }`}
            />
            Làm mới
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
