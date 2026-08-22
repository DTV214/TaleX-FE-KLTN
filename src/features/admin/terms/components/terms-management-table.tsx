"use client";

import { useEffect, useState, type ChangeEvent } from "react";
import {
  Search,
  Plus,
  Filter,
  MoreVertical,
  Edit2,
  Trash2,
  FileText,
  Loader2,
  AlertCircle,
  Eye,
} from "lucide-react";
import { TermsFormModal } from "./terms-form-modal";
import {
  useTermsVersions,
  useDeleteTermsVersion,
} from "../hooks/useTermsQueries";
import {
  TermsFilterParams,
  TermsType,
  TermsVersion,
} from "../types/terms.types";

const termsTypeLabels: Record<TermsType, string> = {
  CREATOR: "Điều khoản Creator",
  GENERAL_TOS: "Điều khoản chung",
  CREATOR_VERIFYING_PROCESS: "Quá trình xác thực (Creator)",
  CREATOR_ENABLE_MONETIZATION: "Bật kiếm tiền (Creator)",
};

export function TermsManagementTable() {
  // 1. Khởi tạo state CHUẨN PHẲNG (Đã xóa bỏ object `criteria`)
  const [filters, setFilters] = useState<TermsFilterParams>({
    page: 1,
    pageSize: 10,
    sortBy: "createdAt",
    sortDirection: "DESC",
  });

  const [searchInput, setSearchInput] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [targetId, setTargetId] = useState<string | null>(null);
  const [modalMode, setModalMode] = useState<"create" | "edit" | "view">(
    "create",
  );

  // Fetch API với các params chuẩn (Backend chỉ nhận page, pageSize, types, sortBy...)
  const {
    data: response,
    isLoading,
    isError,
    isFetching,
  } = useTermsVersions(filters);
  const deleteMutation = useDeleteTermsVersion();

  // Dữ liệu thô từ Backend
  const serverTermsList = response?.data?.content || [];
  const totalPages = response?.data?.totalPages || 1;
  const totalElements = response?.data?.totalElements || 0;

  // 2. LỌC DỮ LIỆU PHÍA FRONTEND (Client-side Filtering)
  // Lọc trực tiếp trên mảng dữ liệu lấy về từ Backend
  const termsList = serverTermsList.filter((term: TermsVersion) => {
    // Lọc theo Search Version (Text Includes)
    const matchVersion = filters.version
      ? term.version.toLowerCase().includes(filters.version.toLowerCase())
      : true;

    // Lọc theo Status (Boolean)
    const matchStatus =
      filters.isActive !== undefined
        ? term.isActive === filters.isActive
        : true;

    return matchVersion && matchStatus;
  });

  const handleOpenModal = (mode: "create" | "edit" | "view", id?: string) => {
    setTargetId(id || null);
    setModalMode(mode);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setTimeout(() => {
      setTargetId(null);
      setModalMode("create");
    }, 200);
  };

  // 3. Cập nhật State Tìm kiếm (Đưa ra ngoài cùng, không dùng criteria)
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters((prev) => ({
        ...prev,
        page: 1,
        version: searchInput || undefined, // Lưu thẳng vào biến version
      }));
    }, 500);

    return () => clearTimeout(timer);
  }, [searchInput]);

  const handleTypeChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setFilters((prev) => ({
      ...prev,
      types: val ? [val as TermsType] : undefined,
      page: 1, // Reset về trang 1 khi đổi bộ lọc gọi API
    }));
  };

  const handleStatusChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setFilters((prev) => ({
      ...prev,
      page: 1,
      isActive: val === "all" ? undefined : val === "true", // Lưu thẳng vào biến isActive
    }));
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa phiên bản điều khoản này?")) {
      await deleteMutation.mutateAsync(id);
    }
  };

  return (
    <div className="w-full flex flex-col gap-6 font-sans">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 backoffice-dark:text-white">
            Terms & Conditions
          </h2>
        </div>
        <button
          type="button"
          className="flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-bold text-white shadow-sm transition-colors hover:bg-violet-700 backoffice-dark:bg-[var(--backoffice-primary)] backoffice-dark:text-black backoffice-dark:hover:bg-[var(--backoffice-primary-bright)]"
          onClick={() => handleOpenModal("create")}
        >
          <Plus className="w-4 h-4" />
          Tạo Phiên Bản Mới
        </button>
      </div>

      <div className="flex flex-col items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.04] sm:flex-row">
        <div className="relative w-full sm:max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Tìm kiếm theo mã phiên bản (VD: 1.0)..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-4 text-sm font-medium text-slate-900 transition-all focus:border-violet-500 focus:outline-none focus:ring-4 focus:ring-violet-100 backoffice-dark:border-white/10 backoffice-dark:bg-black/30 backoffice-dark:text-white backoffice-dark:focus:ring-[rgba(212,175,55,0.16)]"
          />
        </div>

        <div className="flex w-full sm:w-auto items-center gap-3">
          <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 backoffice-dark:border-white/10 backoffice-dark:bg-black/30 backoffice-dark:text-white/70">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              onChange={handleTypeChange}
              className="bg-transparent border-none outline-none cursor-pointer"
            >
              <option value="">Tất cả phân loại</option>
              <option value="CREATOR">Điều khoản Creator</option>
              <option value="GENERAL_TOS">Điều khoản chung</option>
              <option value="CREATOR_VERIFYING_PROCESS">
                Quá trình xác thực (Creator)
              </option>
              <option value="CREATOR_ENABLE_MONETIZATION">
                Bật kiếm tiền (Creator)
              </option>
            </select>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 backoffice-dark:border-white/10 backoffice-dark:bg-black/30 backoffice-dark:text-white/70">
            <select
              onChange={handleStatusChange}
              className="bg-transparent border-none outline-none cursor-pointer"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="true">Đang Hoạt Động (Active)</option>
              <option value="false">Đã Vô Hiệu (Inactive)</option>
            </select>
          </div>
        </div>
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.04]">
        {isFetching && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/50 backdrop-blur-[1px] backoffice-dark:bg-black/30">
            <Loader2 className="h-6 w-6 animate-spin text-violet-600 backoffice-dark:text-[var(--backoffice-primary)]" />
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 backoffice-dark:border-white/10 backoffice-dark:bg-white/5">
                <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Mã Phiên Bản
                </th>
                <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Phân Loại
                </th>
                <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Trạng Thái
                </th>
                <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Ngày Tạo
                </th>
                <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">
                  Thao Tác
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 backoffice-dark:divide-white/10">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-gray-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                    Đang tải dữ liệu...
                  </td>
                </tr>
              ) : isError ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-red-500">
                    <AlertCircle className="w-6 h-6 mx-auto mb-2" />
                    Không thể tải dữ liệu. Vui lòng thử lại.
                  </td>
                </tr>
              ) : termsList.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-gray-500">
                    <FileText className="w-8 h-8 mx-auto mb-3 text-gray-300" />
                    Không tìm thấy điều khoản nào khớp với bộ lọc.
                  </td>
                </tr>
              ) : (
                termsList.map((term: TermsVersion) => (
                  <tr
                    key={term.id}
                    className="transition-colors hover:bg-gray-50/50 backoffice-dark:hover:bg-white/[0.05]"
                  >
                    <td className="py-4 px-6">
                      <span className="font-medium text-gray-900">
                        {term.version}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${term.type === "CREATOR"
                          ? "bg-violet-50 text-violet-600 backoffice-dark:bg-[var(--backoffice-primary-soft)] backoffice-dark:text-[var(--backoffice-primary)]"
                          : "bg-blue-50 text-blue-600"
                          }`}
                      >
                        {termsTypeLabels[term.type]}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${term.isActive
                          ? "bg-green-50 text-[#00A389]"
                          : "bg-red-50 text-[#E50914]"
                          }`}
                      >
                        {term.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-500">
                      {new Date(term.createdAt).toLocaleDateString("vi-VN", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          className="rounded-md p-1.5 text-gray-400 transition-colors hover:bg-violet-50 hover:text-violet-600 backoffice-dark:hover:bg-white/10 backoffice-dark:hover:text-white"
                          title="View Details"
                          onClick={() => handleOpenModal("view", term.id)}
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          className="rounded-md p-1.5 text-gray-400 transition-colors hover:bg-violet-50 hover:text-violet-600 backoffice-dark:hover:bg-white/10 backoffice-dark:hover:text-white"
                          title="Edit"
                          onClick={() => handleOpenModal("edit", term.id)}
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          className="p-1.5 text-gray-400 hover:text-[#E50914] hover:bg-red-50 rounded-md transition-colors disabled:opacity-50"
                          title="Delete"
                          onClick={() => handleDelete(term.id)}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          className="p-1.5 text-gray-400 hover:text-gray-600 rounded-md transition-colors"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!isLoading && !isError && serverTermsList.length > 0 && (
          <div className="flex items-center justify-between border-t border-slate-200 bg-black-50/50 px-6 py-4 backoffice-dark:border-white/10 backoffice-dark:bg-black/20">
            <span className="text-sm text-gray-500">
              Đang hiển thị{" "}
              <span className="font-medium text-gray-900">
                {termsList.length}
              </span>{" "}
              / {totalElements} kết quả
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="px-3 py-1.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-md hover:bg-gray-50 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                onClick={() =>
                  setFilters((prev) => ({
                    ...prev,
                    page: Math.max(1, prev.page - 1),
                  }))
                }
                disabled={filters.page <= 1}
              >
                Trước
              </button>
              <div className="rounded-md bg-violet-50 px-3 py-1 text-sm font-medium text-violet-600 backoffice-dark:bg-[var(--backoffice-primary-soft)] backoffice-dark:text-[var(--backoffice-primary)]">
                Trang {filters.page} / {totalPages}
              </div>
              <button
                type="button"
                className="px-3 py-1.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-md hover:bg-gray-50 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                onClick={() =>
                  setFilters((prev) => ({
                    ...prev,
                    page: Math.min(totalPages, prev.page + 1),
                  }))
                }
                disabled={filters.page >= totalPages}
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </div>

      <TermsFormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        targetId={targetId}
        mode={modalMode}
      />
    </div>
  );
}
