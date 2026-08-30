"use client";

import { Edit3, Loader2, Plus, RefreshCw, Search, Settings2, Trash2 } from "lucide-react";
import { type FormEvent, useMemo, useState } from "react";
import { toast } from "sonner";
import { type ViolationLabelTranslation, type ViolationLabelTranslationCreatePayload } from "@/features/admin/api/violation-label-translation.api";
import {
  useCreateViolationLabelTranslation,
  useDeleteViolationLabelTranslation,
  useGetViolationLabelTranslations,
  useUpdateViolationLabelTranslation,
} from "@/features/admin/hooks/use-violation-label-translation";
import { useGetViolationLabelCategories } from "@/features/admin/hooks/use-violation-label-category";
import {
  ViolationLabelTranslationConfirmModal,
  ViolationLabelTranslationFormModal,
} from "@/features/admin/components/violation-label-translation-form-modal";
import { ViolationLabelCategoryManagerModal } from "@/features/admin/components/violation-label-category-manager-modal";

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Thao tác thất bại.";
}

function removeVietnameseTones(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "d")
    .toLowerCase()
    .trim();
}

export function ViolationLabelTranslationManagement() {
  const translationsQuery = useGetViolationLabelTranslations();
  const categoriesQuery = useGetViolationLabelCategories();
  const createMutation = useCreateViolationLabelTranslation();
  const updateMutation = useUpdateViolationLabelTranslation();
  const deleteMutation = useDeleteViolationLabelTranslation();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isCategoryManagerOpen, setIsCategoryManagerOpen] = useState(false);
  const [selected, setSelected] = useState<ViolationLabelTranslation | null>(null);

  // Search, Filter & Pagination states
  const [searchDraft, setSearchDraft] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const all = translationsQuery.data ?? [];
  const categories = categoriesQuery.data ?? [];

  const filtered = useMemo(() => {
    return all.filter((item) => {
      if (categoryFilter !== "ALL" && item.categoryName !== categoryFilter) {
        return false;
      }
      if (searchTerm.trim()) {
        const rawTerm = searchTerm.toLowerCase().trim();
        const normTerm = removeVietnameseTones(searchTerm);

        const awsRaw = item.awsLabel.toLowerCase();
        const vnRaw = item.vietnameseText.toLowerCase();
        const vnNorm = removeVietnameseTones(item.vietnameseText);
        const catRaw = (item.categoryName || "").toLowerCase();
        const catNorm = removeVietnameseTones(item.categoryName || "");

        const matchAws = awsRaw.includes(rawTerm);
        const matchVn = vnRaw.includes(rawTerm) || vnNorm.includes(normTerm);
        const matchCat = catRaw.includes(rawTerm) || catNorm.includes(normTerm);

        if (!matchAws && !matchVn && !matchCat) return false;
      }
      return true;
    });
  }, [all, categoryFilter, searchTerm]);

  const totalElements = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalElements / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage, pageSize]);

  const firstItem = totalElements === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const lastItem = Math.min(currentPage * pageSize, totalElements);

  const handleSearchSubmit = (e: FormEvent) => {
    e.preventDefault();
    setSearchTerm(searchDraft);
    setPage(1);
  };

  const handleCategoryFilterChange = (newCat: string) => {
    setCategoryFilter(newCat);
    setPage(1);
  };

  const isMutating =
    createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;
  const isSaving = createMutation.isPending || updateMutation.isPending;

  function openCreateModal() {
    setSelected(null);
    setIsFormOpen(true);
  }

  function openEditModal(item: ViolationLabelTranslation) {
    setSelected(item);
    setIsFormOpen(true);
  }

  function closeFormModal() {
    if (isSaving) return;
    setIsFormOpen(false);
    setSelected(null);
  }

  function openDeleteModal(item: ViolationLabelTranslation) {
    setSelected(item);
    setIsConfirmOpen(true);
  }

  function closeConfirmModal() {
    if (deleteMutation.isPending) return;
    setIsConfirmOpen(false);
    setSelected(null);
  }

  function handleSubmit(payload: ViolationLabelTranslationCreatePayload) {
    if (selected) {
      updateMutation.mutate(
        { id: selected.id, payload: { vietnameseText: payload.vietnameseText, categoryId: payload.categoryId } },
        {
          onSuccess: () => {
            toast.success("Đã cập nhật bản dịch.");
            setIsFormOpen(false);
            setSelected(null);
          },
          onError: (error) => toast.error(getErrorMessage(error)),
        },
      );
      return;
    }

    createMutation.mutate(payload, {
      onSuccess: () => {
        toast.success("Đã thêm bản dịch.");
        setIsFormOpen(false);
      },
      onError: (error) => toast.error(getErrorMessage(error)),
    });
  }

  function handleDelete() {
    if (!selected) return;

    deleteMutation.mutate(selected.id, {
      onSuccess: () => {
        toast.success("Đã xóa bản dịch.");
        setIsConfirmOpen(false);
        setSelected(null);
      },
      onError: (error) => toast.error(getErrorMessage(error)),
    });
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-950 backoffice-dark:text-white">
            Nhãn Kiểm Duyệt
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => void translationsQuery.refetch()}
            disabled={translationsQuery.isFetching}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50 backoffice-dark:border-white/10 backoffice-dark:bg-white/5 backoffice-dark:text-white/80 backoffice-dark:hover:bg-white/10"
          >
            <RefreshCw
              className={
                translationsQuery.isFetching
                  ? "h-4 w-4 animate-spin"
                  : "h-4 w-4"
              }
            />
            Làm mới
          </button>
          <button
            type="button"
            onClick={() => setIsCategoryManagerOpen(true)}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 backoffice-dark:border-white/10 backoffice-dark:bg-white/5 backoffice-dark:text-white/80 backoffice-dark:hover:bg-white/10"
          >
            <Settings2 className="h-4 w-4" />
            Quản lý nhóm
          </button>
          <button
            type="button"
            onClick={openCreateModal}
            disabled={isMutating}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-violet-600 px-5 text-sm font-bold text-white shadow-sm transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60 backoffice-dark:bg-[var(--backoffice-primary)] backoffice-dark:text-black backoffice-dark:hover:bg-[var(--backoffice-primary-bright)]"
          >
            <Plus className="h-5 w-5" />
            Thêm mới
          </button>
        </div>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.04]">
        <form
          onSubmit={handleSearchSubmit}
          className="grid gap-3 sm:grid-cols-[minmax(240px,1fr)_200px_auto] sm:items-end"
        >
          <label className="relative block">
            <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-500 backoffice-dark:text-white/45">
              Tìm kiếm
            </span>
            <Search className="absolute bottom-3 left-3 h-4 w-4 text-gray-400" />
            <input
              type="search"
              value={searchDraft}
              onChange={(e) => setSearchDraft(e.target.value)}
              placeholder="Tìm theo nhãn AWS, bản dịch, nhóm..."
              className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-violet-500 focus:ring-2 focus:ring-violet-100 backoffice-dark:border-white/10 backoffice-dark:bg-black/30 backoffice-dark:text-white"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-500 backoffice-dark:text-white/45">
              Nhóm nhãn
            </span>
            <select
              value={categoryFilter}
              onChange={(e) => handleCategoryFilterChange(e.target.value)}
              className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100 backoffice-dark:border-white/10 backoffice-dark:bg-black/30 backoffice-dark:text-white"
            >
              <option value="ALL">Tất cả nhóm</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.name}>
                  {cat.name}
                </option>
              ))}
            </select>
          </label>

          <div className="flex gap-2">
            <button
              type="submit"
              className="h-10 rounded-lg bg-violet-600 px-4 text-sm font-semibold text-white shadow-sm hover:bg-violet-700 backoffice-dark:bg-[var(--backoffice-primary)] backoffice-dark:text-black backoffice-dark:hover:bg-[var(--backoffice-primary-bright)]"
            >
              Tìm kiếm
            </button>
            {searchTerm || categoryFilter !== "ALL" ? (
              <button
                type="button"
                onClick={() => {
                  setSearchDraft("");
                  setSearchTerm("");
                  setCategoryFilter("ALL");
                  setPage(1);
                }}
                className="h-10 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 hover:text-slate-900 backoffice-dark:border-white/10 backoffice-dark:bg-white/5 backoffice-dark:text-white backoffice-dark:hover:bg-white/10"
              >
                Xóa lọc
              </button>
            ) : null}
          </div>
        </form>
      </section>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.04]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[780px] text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500 backoffice-dark:border-white/10 backoffice-dark:bg-white/5 backoffice-dark:text-white/45">
              <tr>
                <th className="px-6 py-4">Nhãn AWS</th>
                <th className="px-6 py-4">Bản dịch tiếng Việt</th>
                <th className="px-6 py-4">Nhóm</th>
                <th className="px-6 py-4 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 backoffice-dark:divide-white/10">
              {translationsQuery.isLoading && (
                <tr>
                  <td colSpan={4} className="px-6 py-14 text-center">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin text-slate-400" />
                    <p className="mt-2 text-sm font-medium text-slate-500">Đang tải danh sách...</p>
                  </td>
                </tr>
              )}

              {translationsQuery.isError && (
                <tr>
                  <td colSpan={4} className="px-6 py-14 text-center text-sm font-semibold text-red-600">
                    Không thể tải danh sách bản dịch.
                  </td>
                </tr>
              )}

              {!translationsQuery.isLoading && !translationsQuery.isError && paginatedItems.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-14 text-center text-sm font-medium text-slate-500">
                    {searchTerm || categoryFilter !== "ALL"
                      ? "Không tìm thấy kết quả phù hợp với bộ lọc."
                      : "Chưa có bản dịch nào."}
                  </td>
                </tr>
              )}

              {paginatedItems.map((item) => (
                <tr key={item.id} className="transition hover:bg-slate-50/80 backoffice-dark:hover:bg-white/[0.05]">
                  <td className="px-6 py-4 font-mono text-xs text-slate-600 backoffice-dark:text-white/70">{item.awsLabel}</td>
                  <td className="px-6 py-4 font-bold text-slate-950 backoffice-dark:text-white">{item.vietnameseText}</td>
                  <td className="px-6 py-4 text-slate-500 backoffice-dark:text-white/60">{item.categoryName || "-"}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => openEditModal(item)}
                        disabled={isMutating}
                        className="rounded-lg p-2 text-slate-400 transition hover:bg-violet-50 hover:text-violet-600 disabled:cursor-not-allowed disabled:opacity-40 backoffice-dark:text-white/40 backoffice-dark:hover:bg-white/10 backoffice-dark:hover:text-white"
                        title="Sửa"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => openDeleteModal(item)}
                        disabled={isMutating}
                        className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40 backoffice-dark:text-white/40 backoffice-dark:hover:bg-red-500/10 backoffice-dark:hover:text-red-400"
                        title="Xóa"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalElements > 0 && (
          <div className="flex flex-col gap-3 border-t border-slate-100 bg-gray-50/50 px-6 py-4 sm:flex-row sm:items-center sm:justify-between backoffice-dark:border-white/10 backoffice-dark:bg-transparent">
            <p className="text-sm font-semibold text-gray-500 backoffice-dark:text-zinc-400">
              Hiển thị {firstItem} - {lastItem} / {totalElements} nhãn
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="inline-flex h-9 items-center justify-center rounded-lg border border-gray-200 bg-white px-3 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.04] backoffice-dark:text-zinc-200 backoffice-dark:hover:bg-white/10"
                disabled={currentPage <= 1}
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              >
                Trước
              </button>
              <span className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-black text-gray-700 shadow-sm backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.04] backoffice-dark:text-zinc-200">
                {currentPage} / {totalPages}
              </span>
              <button
                type="button"
                className="inline-flex h-9 items-center justify-center rounded-lg border border-gray-200 bg-white px-3 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.04] backoffice-dark:text-zinc-200 backoffice-dark:hover:bg-white/10"
                disabled={currentPage >= totalPages}
                onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </div>

      <ViolationLabelTranslationFormModal
        isSaving={isSaving}
        onClose={closeFormModal}
        onSubmit={handleSubmit}
        open={isFormOpen}
        translation={selected}
      />

      <ViolationLabelTranslationConfirmModal
        isDeleting={deleteMutation.isPending}
        onClose={closeConfirmModal}
        onConfirm={handleDelete}
        open={isConfirmOpen}
        translation={selected}
      />

      <ViolationLabelCategoryManagerModal
        open={isCategoryManagerOpen}
        onClose={() => setIsCategoryManagerOpen(false)}
      />
    </div>
  );
}
