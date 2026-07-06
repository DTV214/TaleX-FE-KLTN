"use client";

import { Edit3, Eye, EyeOff, Loader2, Plus, Trash2, X } from "lucide-react";
import { type FormEvent, useState } from "react";
import { toast } from "sonner";
import {
  type Tag,
  type TagPayload,
  type TagStatus,
} from "@/features/admin/api/tag.api";
import {
  useCreateTag,
  useDeleteTag,
  useGetTags,
  useToggleTagStatus,
  useUpdateTag,
} from "@/features/admin/hooks/use-tag";

const statusStyles: Record<TagStatus, string> = {
  ACTIVE: "border-emerald-200 bg-emerald-50 text-emerald-700",
  INACTIVE: "border-slate-200 bg-slate-100 text-slate-600",
  DELETED: "border-red-200 bg-red-50 text-red-700",
};

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Thao tác thất bại.";
}

function StatusBadge({ status }: { status: TagStatus }) {
  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${statusStyles[status]}`}
    >
      {status}
    </span>
  );
}

function TagFormModal({
  isSaving,
  onClose,
  onSubmit,
  open,
  tag,
}: {
  isSaving: boolean;
  onClose: () => void;
  onSubmit: (payload: TagPayload) => void;
  open: boolean;
  tag: Tag | null;
}) {
  if (!open) return null;

  const isEditing = Boolean(tag);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const name = String(formData.get("name") ?? "").trim();
    const description = String(formData.get("description") ?? "").trim();

    if (!name) {
      toast.error("Tên thẻ là bắt buộc.");
      return;
    }

    onSubmit({ name, description });
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm animate-in fade-in duration-200">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200"
      >
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-950">
              {isEditing ? "Chỉnh sửa Thẻ" : "Thêm Thẻ"}
            </h2>
            <p className="mt-1 text-sm font-medium text-slate-500">
              Quản lý nhãn nội dung để creator gắn cho series.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
            aria-label="Đóng"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          <label className="block">
            <span className="mb-2 block text-sm font-bold text-slate-700">
              Tên
            </span>
            <input
              name="name"
              defaultValue={tag?.name ?? ""}
              required
              className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
              placeholder="Ví dụ: Dark Fantasy"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-bold text-slate-700">
              Mô tả
            </span>
            <textarea
              name="description"
              defaultValue={tag?.description ?? ""}
              rows={4}
              className="w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
              placeholder="Mô tả ngắn về thẻ này..."
            />
          </label>
        </div>

        <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="inline-flex h-11 items-center justify-center rounded-lg border border-slate-200 bg-white px-5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-violet-600 px-5 text-sm font-bold text-white shadow-sm transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
            Lưu
          </button>
        </div>
      </form>
    </div>
  );
}

function TagConfirmModal({
  isDeleting,
  onClose,
  onConfirm,
  open,
  tag,
}: {
  isDeleting: boolean;
  onClose: () => void;
  onConfirm: () => void;
  open: boolean;
  tag: Tag | null;
}) {
  if (!open || !tag) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="mb-5">
          <h2 className="text-xl font-bold text-slate-950">Xóa Thẻ?</h2>
          <p className="mt-2 text-sm font-medium leading-6 text-slate-500">
            Thẻ <span className="font-bold text-slate-900">{tag.name}</span> sẽ
            bị xóa khỏi danh sách quản trị. Nội dung đang dùng thẻ này có thể
            bị ảnh hưởng trong phần lọc và hiển thị.
          </p>
        </div>

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="inline-flex h-11 items-center justify-center rounded-lg border border-slate-200 bg-white px-5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-red-600 px-5 text-sm font-bold text-white shadow-sm transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isDeleting && <Loader2 className="h-4 w-4 animate-spin" />}
            Xóa
          </button>
        </div>
      </div>
    </div>
  );
}

export function TagManagement() {
  const tagsQuery = useGetTags();
  const createMutation = useCreateTag();
  const updateMutation = useUpdateTag();
  const deleteMutation = useDeleteTag();
  const toggleStatusMutation = useToggleTagStatus();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [selectedTag, setSelectedTag] = useState<Tag | null>(null);

  const tags = tagsQuery.data ?? [];
  const isMutating =
    createMutation.isPending ||
    updateMutation.isPending ||
    deleteMutation.isPending ||
    toggleStatusMutation.isPending;
  const isSaving = createMutation.isPending || updateMutation.isPending;

  function openCreateModal() {
    setSelectedTag(null);
    setIsFormOpen(true);
  }

  function openEditModal(tag: Tag) {
    setSelectedTag(tag);
    setIsFormOpen(true);
  }

  function closeFormModal() {
    if (isSaving) return;
    setIsFormOpen(false);
    setSelectedTag(null);
  }

  function openDeleteModal(tag: Tag) {
    setSelectedTag(tag);
    setIsConfirmOpen(true);
  }

  function closeConfirmModal() {
    if (deleteMutation.isPending) return;
    setIsConfirmOpen(false);
    setSelectedTag(null);
  }

  function handleSubmit(payload: TagPayload) {
    if (selectedTag) {
      updateMutation.mutate(
        { id: selectedTag.id, payload },
        {
          onSuccess: () => {
            toast.success("Đã cập nhật thẻ.");
            setIsFormOpen(false);
            setSelectedTag(null);
          },
          onError: (error) => toast.error(getErrorMessage(error)),
        },
      );
      return;
    }

    createMutation.mutate(payload, {
      onSuccess: () => {
        toast.success("Đã tạo thẻ.");
        setIsFormOpen(false);
      },
      onError: (error) => toast.error(getErrorMessage(error)),
    });
  }

  function handleToggleStatus(tag: Tag) {
    toggleStatusMutation.mutate(
      {
        id: tag.id,
        hidden: tag.status === "INACTIVE",
      },
      {
        onSuccess: () => {
          toast.success(tag.status === "INACTIVE" ? "Đã hiện thẻ." : "Đã ẩn thẻ.");
        },
        onError: (error) => toast.error(getErrorMessage(error)),
      },
    );
  }

  function handleDelete() {
    if (!selectedTag) return;

    deleteMutation.mutate(selectedTag.id, {
      onSuccess: () => {
        toast.success("Đã xóa thẻ.");
        setIsConfirmOpen(false);
        setSelectedTag(null);
      },
      onError: (error) => toast.error(getErrorMessage(error)),
    });
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 bg-slate-50">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-950">
            Quản lý Thẻ
          </h1>
          <p className="mt-2 text-sm font-medium text-slate-500">
            Quản lý các nhãn nội dung dùng để mô tả và lọc series.
          </p>
        </div>

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

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[780px] text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-6 py-4">Tên thẻ</th>
                <th className="px-6 py-4">Mô tả</th>
                <th className="px-6 py-4">Trạng thái</th>
                <th className="px-6 py-4 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tagsQuery.isLoading && (
                <tr>
                  <td colSpan={4} className="px-6 py-14 text-center">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin text-slate-400" />
                    <p className="mt-2 text-sm font-medium text-slate-500">
                      Đang tải danh sách thẻ...
                    </p>
                  </td>
                </tr>
              )}

              {tagsQuery.isError && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-14 text-center text-sm font-semibold text-red-600"
                  >
                    Không thể tải danh sách thẻ.
                  </td>
                </tr>
              )}

              {!tagsQuery.isLoading &&
                !tagsQuery.isError &&
                tags.length === 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-6 py-14 text-center text-sm font-medium text-slate-500"
                    >
                      Chưa có thẻ nào.
                    </td>
                  </tr>
                )}

              {tags.map((tag) => {
                const isInactive = tag.status === "INACTIVE";
                const isDeleted = tag.status === "DELETED";

                return (
                  <tr key={tag.id} className="transition hover:bg-slate-50/80">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-bold text-slate-950">{tag.name}</p>
                        <p className="mt-0.5 text-xs text-slate-400">
                          ID: {tag.id}
                        </p>
                      </div>
                    </td>
                    <td className="max-w-md px-6 py-4 text-slate-600">
                      <span className="line-clamp-2">
                        {tag.description || "Chưa có mô tả."}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={tag.status} />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openEditModal(tag)}
                          disabled={isMutating || isDeleted}
                          className="rounded-lg p-2 text-slate-400 transition hover:bg-violet-50 hover:text-violet-600 disabled:cursor-not-allowed disabled:opacity-40"
                          title="Sửa"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(tag)}
                          disabled={isMutating || isDeleted}
                          className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
                          title={isInactive ? "Hiện" : "Ẩn"}
                        >
                          {isInactive ? (
                            <Eye className="h-4 w-4" />
                          ) : (
                            <EyeOff className="h-4 w-4" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => openDeleteModal(tag)}
                          disabled={isMutating || isDeleted}
                          className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
                          title="Xóa"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <TagFormModal
        isSaving={isSaving}
        onClose={closeFormModal}
        onSubmit={handleSubmit}
        open={isFormOpen}
        tag={selectedTag}
      />

      <TagConfirmModal
        isDeleting={deleteMutation.isPending}
        onClose={closeConfirmModal}
        onConfirm={handleDelete}
        open={isConfirmOpen}
        tag={selectedTag}
      />
    </div>
  );
}
