"use client";

import { Check, Loader2, Plus, Trash2, X, Pencil, ShieldAlert } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  useCreateContentWarningCategory,
  useDeleteContentWarningCategory,
  useGetAllContentWarningCategories,
  useUpdateContentWarningCategory,
} from "@/features/admin/hooks/use-content-warning-category";

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Thao tác thất bại.";
}

// UPPER_SNAKE_CASE — khớp validation @Pattern ở BE (ContentWarningCategoryCreateRequestDto).
const CODE_PATTERN = /^[A-Z][A-Z0-9_]*$/;

export function ContentWarningCategoryManagement() {
  const categoriesQuery = useGetAllContentWarningCategories();
  const createMutation = useCreateContentWarningCategory();
  const updateMutation = useUpdateContentWarningCategory();
  const deleteMutation = useDeleteContentWarningCategory();

  const [newCode, setNewCode] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingLabel, setEditingLabel] = useState("");

  const categories = categoriesQuery.data ?? [];
  const isMutating =
    createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;

  function handleCreate() {
    const code = newCode.trim().toUpperCase();
    const label = newLabel.trim();
    if (!code || !label) {
      toast.error("Mã nhóm và nhãn hiển thị là bắt buộc.");
      return;
    }
    if (!CODE_PATTERN.test(code)) {
      toast.error("Mã nhóm phải viết hoa dạng UPPER_SNAKE_CASE, VD: SEXUAL_NUDITY.");
      return;
    }
    createMutation.mutate(
      { code, label },
      {
        onSuccess: () => {
          toast.success("Đã thêm nhóm cảnh báo nội dung.");
          setNewCode("");
          setNewLabel("");
        },
        onError: (error) => toast.error(getErrorMessage(error)),
      },
    );
  }

  function startEdit(id: string, currentLabel: string) {
    setEditingId(id);
    setEditingLabel(currentLabel);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditingLabel("");
  }

  function saveEdit(id: string, isActive: boolean) {
    const label = editingLabel.trim();
    if (!label) {
      toast.error("Nhãn hiển thị là bắt buộc.");
      return;
    }
    updateMutation.mutate(
      { id, label, isActive },
      {
        onSuccess: () => {
          toast.success("Đã cập nhật nhóm.");
          cancelEdit();
        },
        onError: (error) => toast.error(getErrorMessage(error)),
      },
    );
  }

  function toggleActive(id: string, label: string, isActive: boolean) {
    updateMutation.mutate(
      { id, label, isActive: !isActive },
      {
        onSuccess: () =>
          toast.success(!isActive ? "Đã bật hiển thị nhóm." : "Đã ẩn nhóm khỏi form khai báo."),
        onError: (error) => toast.error(getErrorMessage(error)),
      },
    );
  }

  function handleDelete(id: string, label: string) {
    deleteMutation.mutate(id, {
      onSuccess: () => toast.success(`Đã xóa nhóm "${label}".`),
      onError: (error) => toast.error(getErrorMessage(error)),
    });
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
          <ShieldAlert className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-950">Cảnh báo nội dung</h1>
          <p className="text-sm font-medium text-slate-500">
            Danh sách nhóm nội dung nhạy cảm Creator khai báo khi tạo series 18+. AI tự động
            duyệt vi phạm phát hiện được đúng nhóm đã khai, không cần Staff xem lại.
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-3 text-sm font-bold text-slate-700">Thêm nhóm mới</h2>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            value={newCode}
            onChange={(event) => setNewCode(event.target.value)}
            placeholder="Mã (VD: HORROR)"
            disabled={createMutation.isPending}
            className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-900 outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-100 sm:w-48"
          />
          <input
            value={newLabel}
            onChange={(event) => setNewLabel(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") handleCreate();
            }}
            placeholder="Nhãn hiển thị (VD: Kinh dị)"
            disabled={createMutation.isPending}
            className="h-10 flex-1 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-900 outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
          />
          <button
            type="button"
            onClick={handleCreate}
            disabled={createMutation.isPending}
            className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg bg-violet-600 px-4 text-sm font-bold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {createMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            Thêm
          </button>
        </div>
        <p className="mt-2 text-xs text-slate-400">
          Lưu ý: nhóm mới thêm chỉ hiện trong form khai báo cho Creator chọn. Để AI tự động
          nhận diện đúng vi phạm thuộc nhóm mới này, cần bổ sung thêm ánh xạ nhãn AWS Rekognition
          ở backend (việc kỹ thuật, không tự làm được qua màn hình này).
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-100 bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left font-bold text-slate-600">Mã</th>
              <th className="px-4 py-3 text-left font-bold text-slate-600">Nhãn hiển thị</th>
              <th className="px-4 py-3 text-left font-bold text-slate-600">Trạng thái</th>
              <th className="px-4 py-3 text-right font-bold text-slate-600">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {categoriesQuery.isLoading && (
              <tr>
                <td colSpan={4} className="py-8 text-center text-slate-500">
                  Đang tải...
                </td>
              </tr>
            )}

            {!categoriesQuery.isLoading && categories.length === 0 && (
              <tr>
                <td colSpan={4} className="py-8 text-center text-slate-500">
                  Chưa có nhóm nào.
                </td>
              </tr>
            )}

            {categories.map((category) => (
              <tr key={category.id} className="border-b border-slate-50 last:border-0">
                <td className="px-4 py-3 font-mono text-xs text-slate-500">{category.code}</td>
                <td className="px-4 py-3">
                  {editingId === category.id ? (
                    <input
                      value={editingLabel}
                      onChange={(event) => setEditingLabel(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") saveEdit(category.id, category.isActive);
                        if (event.key === "Escape") cancelEdit();
                      }}
                      autoFocus
                      className="h-8 w-full rounded-md border border-violet-300 bg-white px-2 text-sm font-medium text-slate-900 outline-none"
                    />
                  ) : (
                    <span className="font-medium text-slate-800">{category.label}</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => toggleActive(category.id, category.label, category.isActive)}
                    disabled={isMutating}
                    className={`rounded-full px-2.5 py-1 text-xs font-bold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                      category.isActive
                        ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                        : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                    }`}
                    title="Bấm để đổi trạng thái"
                  >
                    {category.isActive ? "Đang hiển thị" : "Đã ẩn"}
                  </button>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1.5">
                    {editingId === category.id ? (
                      <>
                        <button
                          type="button"
                          onClick={() => saveEdit(category.id, category.isActive)}
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
                        <button
                          type="button"
                          onClick={() => startEdit(category.id, category.label)}
                          disabled={isMutating}
                          className="rounded-md p-1.5 text-slate-400 hover:bg-violet-50 hover:text-violet-600 disabled:cursor-not-allowed disabled:opacity-40"
                          title="Sửa nhãn"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(category.id, category.label)}
                          disabled={isMutating}
                          className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
                          title="Xóa"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
