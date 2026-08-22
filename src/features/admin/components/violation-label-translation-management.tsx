"use client";

import { Edit3, Loader2, Plus, Search, Settings2, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { type ViolationLabelTranslation, type ViolationLabelTranslationCreatePayload } from "@/features/admin/api/violation-label-translation.api";
import {
  useCreateViolationLabelTranslation,
  useDeleteViolationLabelTranslation,
  useGetViolationLabelTranslations,
  useUpdateViolationLabelTranslation,
} from "@/features/admin/hooks/use-violation-label-translation";
import {
  ViolationLabelTranslationConfirmModal,
  ViolationLabelTranslationFormModal,
} from "@/features/admin/components/violation-label-translation-form-modal";
import { ViolationLabelCategoryManagerModal } from "@/features/admin/components/violation-label-category-manager-modal";

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Thao tác thất bại.";
}

export function ViolationLabelTranslationManagement() {
  const translationsQuery = useGetViolationLabelTranslations();
  const createMutation = useCreateViolationLabelTranslation();
  const updateMutation = useUpdateViolationLabelTranslation();
  const deleteMutation = useDeleteViolationLabelTranslation();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isCategoryManagerOpen, setIsCategoryManagerOpen] = useState(false);
  const [selected, setSelected] = useState<ViolationLabelTranslation | null>(null);
  const [keyword, setKeyword] = useState("");

  const all = translationsQuery.data ?? [];
  const filtered = useMemo(() => {
    const normalized = keyword.trim().toLowerCase();
    if (!normalized) return all;
    return all.filter(
      (item) =>
        item.awsLabel.toLowerCase().includes(normalized) ||
        item.vietnameseText.toLowerCase().includes(normalized) ||
        item.categoryName.toLowerCase().includes(normalized),
    );
  }, [all, keyword]);

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
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-950 backoffice-dark:text-white">
            Nhãn Kiểm Duyệt
          </h1>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setIsCategoryManagerOpen(true)}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-5 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            <Settings2 className="h-5 w-5" />
            Quản lý nhóm
          </button>
          <button
            type="button"
            onClick={openCreateModal}
            disabled={isMutating}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-violet-600 px-5 text-sm font-bold text-white shadow-sm transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Plus className="h-5 w-5" />
            Thêm mới
          </button>
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
          placeholder="Tìm theo nhãn AWS, bản dịch, nhóm..."
          className="h-11 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm font-medium text-slate-900 outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
        />
      </div>

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
            <tbody className="divide-y divide-slate-100">
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

              {!translationsQuery.isLoading && !translationsQuery.isError && filtered.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-14 text-center text-sm font-medium text-slate-500">
                    {keyword ? "Không tìm thấy kết quả phù hợp." : "Chưa có bản dịch nào."}
                  </td>
                </tr>
              )}

              {filtered.map((item) => (
                <tr key={item.id} className="transition hover:bg-slate-50/80 backoffice-dark:hover:bg-white/[0.05]">
                  <td className="px-6 py-4 font-mono text-xs text-slate-600">{item.awsLabel}</td>
                  <td className="px-6 py-4 font-bold text-slate-950">{item.vietnameseText}</td>
                  <td className="px-6 py-4 text-slate-500">{item.categoryName || "-"}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => openEditModal(item)}
                        disabled={isMutating}
                        className="rounded-lg p-2 text-slate-400 transition hover:bg-violet-50 hover:text-violet-600 disabled:cursor-not-allowed disabled:opacity-40"
                        title="Sửa"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => openDeleteModal(item)}
                        disabled={isMutating}
                        className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
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
