"use client";

import { Edit3, Eye, EyeOff, Loader2, Plus, RefreshCw, Search, Trash2, X } from "lucide-react";
import { type FormEvent, useMemo, useState } from "react";
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

function removeVietnameseTones(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "d")
    .toLowerCase()
    .trim();
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

  // Search, Filter & Pagination states
  const [searchDraft, setSearchDraft] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const tags = tagsQuery.data ?? [];
  const isMutating =
    createMutation.isPending ||
    updateMutation.isPending ||
    deleteMutation.isPending ||
    toggleStatusMutation.isPending;
  const isSaving = createMutation.isPending || updateMutation.isPending;

  const filteredTags = useMemo(() => {
    return tags.filter((tag) => {
      if (statusFilter !== "ALL" && tag.status !== statusFilter) {
        return false;
      }
      if (searchTerm.trim()) {
        const rawTerm = searchTerm.toLowerCase().trim();
        const normTerm = removeVietnameseTones(searchTerm);

        const nameRaw = tag.name.toLowerCase();
        const nameNorm = removeVietnameseTones(tag.name);

        const descRaw = (tag.description || "").toLowerCase();
        const descNorm = removeVietnameseTones(tag.description || "");

        const matchName = nameRaw.includes(rawTerm) || nameNorm.includes(normTerm);
        const matchDesc = descRaw.includes(rawTerm) || descNorm.includes(normTerm);

        if (!matchName && !matchDesc) return false;
      }
      return true;
    });
  }, [tags, statusFilter, searchTerm]);

  const totalElements = filteredTags.length;
  const totalPages = Math.max(1, Math.ceil(totalElements / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginatedTags = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredTags.slice(start, start + pageSize);
  }, [filteredTags, currentPage, pageSize]);

  const firstItem = totalElements === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const lastItem = Math.min(currentPage * pageSize, totalElements);

  const handleSearchSubmit = (e: FormEvent) => {
    e.preventDefault();
    setSearchTerm(searchDraft);
    setPage(1);
  };

  const handleStatusFilterChange = (newStatus: string) => {
    setStatusFilter(newStatus);
    setPage(1);
  };

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
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-950 backoffice-dark:text-white">
            Quản Lý Thẻ
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void tagsQuery.refetch()}
            disabled={tagsQuery.isFetching}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50 backoffice-dark:border-white/10 backoffice-dark:bg-white/5 backoffice-dark:text-white/80 backoffice-dark:hover:bg-white/10"
          >
            <RefreshCw
              className={
                tagsQuery.isFetching
                  ? "h-4 w-4 animate-spin"
                  : "h-4 w-4"
              }
            />
            Làm mới
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
              placeholder="Tên thẻ, mô tả..."
              className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-violet-500 focus:ring-2 focus:ring-violet-100 backoffice-dark:border-white/10 backoffice-dark:bg-black/30 backoffice-dark:text-white"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-500 backoffice-dark:text-white/45">
              Trạng thái
            </span>
            <select
              value={statusFilter}
              onChange={(e) => handleStatusFilterChange(e.target.value)}
              className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100 backoffice-dark:border-white/10 backoffice-dark:bg-black/30 backoffice-dark:text-white"
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
              <option value="DELETED">DELETED</option>
            </select>
          </label>

          <div className="flex gap-2">
            <button
              type="submit"
              className="h-10 rounded-lg bg-violet-600 px-4 text-sm font-semibold text-white shadow-sm hover:bg-violet-700 backoffice-dark:bg-[var(--backoffice-primary)] backoffice-dark:text-black backoffice-dark:hover:bg-[var(--backoffice-primary-bright)]"
            >
              Tìm kiếm
            </button>
            {searchTerm || statusFilter !== "ALL" ? (
              <button
                type="button"
                onClick={() => {
                  setSearchDraft("");
                  setSearchTerm("");
                  setStatusFilter("ALL");
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
                <th className="px-6 py-4">Tên thẻ</th>
                <th className="px-6 py-4">Mô tả</th>
                <th className="px-6 py-4">Trạng thái</th>
                <th className="px-6 py-4 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 backoffice-dark:divide-white/10">
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
                paginatedTags.length === 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-6 py-14 text-center text-sm font-medium text-slate-500"
                    >
                      {searchTerm || statusFilter !== "ALL"
                        ? "Không tìm thấy thẻ phù hợp với bộ lọc."
                        : "Chưa có thẻ nào."}
                    </td>
                  </tr>
                )}

              {paginatedTags.map((tag) => {
                const isInactive = tag.status === "INACTIVE";
                const isDeleted = tag.status === "DELETED";

                return (
                  <tr key={tag.id} className="transition hover:bg-slate-50/80 backoffice-dark:hover:bg-white/[0.05]">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-bold text-slate-950 backoffice-dark:text-white">{tag.name}</p>
                      </div>
                    </td>
                    <td className="max-w-md px-6 py-4 text-slate-600 backoffice-dark:text-white/70">
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
                          className="rounded-lg p-2 text-slate-400 transition hover:bg-violet-50 hover:text-violet-600 disabled:cursor-not-allowed disabled:opacity-40 backoffice-dark:text-white/40 backoffice-dark:hover:bg-white/10 backoffice-dark:hover:text-white"
                          title="Sửa"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(tag)}
                          disabled={isMutating || isDeleted}
                          className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-40 backoffice-dark:text-white/40 backoffice-dark:hover:bg-white/10 backoffice-dark:hover:text-white"
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
                          className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40 backoffice-dark:text-white/40 backoffice-dark:hover:bg-red-500/10 backoffice-dark:hover:text-red-400"
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

        {totalElements > 0 && (
          <div className="flex flex-col gap-3 border-t border-slate-100 bg-gray-50/50 px-6 py-4 sm:flex-row sm:items-center sm:justify-between backoffice-dark:border-white/10 backoffice-dark:bg-transparent">
            <p className="text-sm font-semibold text-gray-500 backoffice-dark:text-zinc-400">
              Hiển thị {firstItem} - {lastItem} / {totalElements} thẻ
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
