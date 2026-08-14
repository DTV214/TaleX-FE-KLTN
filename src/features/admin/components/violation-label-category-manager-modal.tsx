"use client";

import { Check, Loader2, Plus, Trash2, X, Pencil } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  useCreateViolationLabelCategory,
  useDeleteViolationLabelCategory,
  useGetViolationLabelCategories,
  useUpdateViolationLabelCategory,
} from "@/features/admin/hooks/use-violation-label-category";

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Thao tác thất bại.";
}

export function ViolationLabelCategoryManagerModal({
  onClose,
  open,
}: {
  onClose: () => void;
  open: boolean;
}) {
  const categoriesQuery = useGetViolationLabelCategories();
  const createMutation = useCreateViolationLabelCategory();
  const updateMutation = useUpdateViolationLabelCategory();
  const deleteMutation = useDeleteViolationLabelCategory();
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  if (!open) return null;

  const categories = categoriesQuery.data ?? [];
  const isMutating =
    createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;

  function handleCreate() {
    const name = newName.trim();
    if (!name) {
      toast.error("Tên nhóm là bắt buộc.");
      return;
    }
    createMutation.mutate(name, {
      onSuccess: () => {
        toast.success("Đã thêm nhóm.");
        setNewName("");
      },
      onError: (error) => toast.error(getErrorMessage(error)),
    });
  }

  function startEdit(id: string, currentName: string) {
    setEditingId(id);
    setEditingName(currentName);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditingName("");
  }

  function saveEdit(id: string) {
    const name = editingName.trim();
    if (!name) {
      toast.error("Tên nhóm là bắt buộc.");
      return;
    }
    updateMutation.mutate(
      { id, name },
      {
        onSuccess: () => {
          toast.success("Đã cập nhật nhóm.");
          cancelEdit();
        },
        onError: (error) => toast.error(getErrorMessage(error)),
      },
    );
  }

  function handleDelete(id: string) {
    deleteMutation.mutate(id, {
      onSuccess: () => toast.success("Đã xóa nhóm."),
      onError: (error) => toast.error(getErrorMessage(error)),
    });
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-950">Quản lý nhóm</h2>
            <p className="mt-1 text-sm font-medium text-slate-500">
              Nhóm dùng để phân loại nhãn vi phạm trong danh sách.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label="Đóng"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-4 flex gap-2">
          <input
            value={newName}
            onChange={(event) => setNewName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") handleCreate();
            }}
            placeholder="Tên nhóm mới..."
            disabled={createMutation.isPending}
            className="h-10 flex-1 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-900 outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
          />
          <button
            type="button"
            onClick={handleCreate}
            disabled={createMutation.isPending}
            className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg bg-violet-600 px-3 text-sm font-bold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {createMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
          </button>
        </div>

        <div className="max-h-80 space-y-1.5 overflow-y-auto">
          {categoriesQuery.isLoading && (
            <p className="py-6 text-center text-sm text-slate-500">Đang tải...</p>
          )}

          {!categoriesQuery.isLoading && categories.length === 0 && (
            <p className="py-6 text-center text-sm text-slate-500">Chưa có nhóm nào.</p>
          )}

          {categories.map((category) => (
            <div
              key={category.id}
              className="flex items-center gap-2 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2"
            >
              {editingId === category.id ? (
                <>
                  <input
                    value={editingName}
                    onChange={(event) => setEditingName(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") saveEdit(category.id);
                      if (event.key === "Escape") cancelEdit();
                    }}
                    autoFocus
                    className="h-8 flex-1 rounded-md border border-violet-300 bg-white px-2 text-sm font-medium text-slate-900 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => saveEdit(category.id)}
                    disabled={isMutating}
                    className="rounded-md p-1.5 text-emerald-600 hover:bg-emerald-50"
                    title="Lưu"
                  >
                    <Check className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={cancelEdit}
                    disabled={isMutating}
                    className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100"
                    title="Hủy"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </>
              ) : (
                <>
                  <span className="flex-1 text-sm font-medium text-slate-800">
                    {category.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => startEdit(category.id, category.name)}
                    disabled={isMutating}
                    className="rounded-md p-1.5 text-slate-400 hover:bg-violet-50 hover:text-violet-600 disabled:cursor-not-allowed disabled:opacity-40"
                    title="Sửa"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(category.id)}
                    disabled={isMutating}
                    className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
                    title="Xóa"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
