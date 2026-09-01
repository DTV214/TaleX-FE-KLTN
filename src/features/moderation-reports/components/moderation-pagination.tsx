"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import type { BasePageResponse } from "@/shared/api/http-client";

type ModerationPaginationProps<T> = {
  data?: BasePageResponse<T>;
  isFetching?: boolean;
  itemLabel: string;
  onPageChange: (page: number) => void;
};

export function ModerationPagination<T>({
  data,
  isFetching = false,
  itemLabel,
  onPageChange,
}: ModerationPaginationProps<T>) {
  if (!data) return null;

  const currentPage = data.pageNumber ?? 1;
  const totalPages = Math.max(data.totalPages ?? 1, 1);
  const totalElements = data.totalElements ?? data.content.length;
  const isFirst = data.isFirst || currentPage <= 1;
  const isLast = data.isLast || currentPage >= totalPages;

  return (
    <div className="flex flex-col gap-3 border-t border-slate-200 px-5 py-3 sm:flex-row sm:items-center sm:justify-between backoffice-dark:border-white/10">
      <p className="text-sm font-semibold text-slate-500 backoffice-dark:text-white/55">
        Trang {currentPage} / {totalPages} · {totalElements} {itemLabel}
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={isFirst || isFetching}
          className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 backoffice-dark:border-white/10 backoffice-dark:text-white/60 backoffice-dark:hover:bg-white/10"
          aria-label="Trang trước"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={isLast || isFetching}
          className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 backoffice-dark:border-white/10 backoffice-dark:text-white/60 backoffice-dark:hover:bg-white/10"
          aria-label="Trang sau"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
