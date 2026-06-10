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

export function TermsManagementTable() {
  const [filters, setFilters] = useState<TermsFilterParams>({
    page: 1,
    pageSize: 10,
    sortBy: "createdAt",
    sortDirection: "DESC",
  });
  const [searchInput, setSearchInput] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const {
    data: response,
    isLoading,
    isError,
    isFetching,
  } = useTermsVersions(filters);
  const deleteMutation = useDeleteTermsVersion();

  const termsList = response?.data?.content || [];
  const totalPages = response?.data?.totalPages || 1;
  const totalElements = response?.data?.totalElements || 0;

  const handleOpenModal = (id?: string) => {
    setEditId(id || null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setTimeout(() => setEditId(null), 200);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters((prev) => ({
        ...prev,
        version: searchInput || undefined,
        page: 1,
      }));
    }, 500);

    return () => clearTimeout(timer);
  }, [searchInput]);

  const handleTypeChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setFilters((prev) => ({
      ...prev,
      types: val ? [val as TermsType] : undefined,
      page: 1,
    }));
  };

  const handleStatusChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setFilters((prev) => ({
      ...prev,
      isActive: val === "all" ? undefined : val === "true",
      page: 1,
    }));
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this term version?")) {
      await deleteMutation.mutateAsync(id);
    }
  };

  return (
    <div className="w-full flex flex-col gap-6 font-sans">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">
            Terms & Conditions
          </h2>
          <p className="text-sm text-gray-500">
            Manage creator and general terms of service.
          </p>
        </div>
        <button
          type="button"
          className="flex items-center gap-2 bg-[#7B42FF] hover:bg-[#6834E0] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
          onClick={() => handleOpenModal()}
        >
          <Plus className="w-4 h-4" />
          Add New Version
        </button>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search by version (e.g., 1.0)..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-[#F8F9FA] border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#7B42FF]/20 focus:border-[#7B42FF] transition-all text-gray-900"
          />
        </div>

        <div className="flex w-full sm:w-auto items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-gray-600 bg-[#F8F9FA] border border-gray-200 rounded-lg px-3 py-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              onChange={handleTypeChange}
              className="bg-transparent border-none outline-none cursor-pointer"
            >
              <option value="">All Types</option>
              <option value="CREATOR">Creator Terms</option>
              <option value="GENERAL_TOS">General TOS</option>
            </select>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600 bg-[#F8F9FA] border border-gray-200 rounded-lg px-3 py-2">
            <select
              onChange={handleStatusChange}
              className="bg-transparent border-none outline-none cursor-pointer"
            >
              <option value="all">All Status</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden relative">
        {isFetching && (
          <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] z-10 flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-[#7B42FF] animate-spin" />
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F8F9FA] border-b border-gray-100">
                <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Version
                </th>
                <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Created At
                </th>
                <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-gray-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                    Loading terms...
                  </td>
                </tr>
              ) : isError ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-red-500">
                    <AlertCircle className="w-6 h-6 mx-auto mb-2" />
                    Failed to load data. Please try again.
                  </td>
                </tr>
              ) : termsList.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-gray-500">
                    <FileText className="w-8 h-8 mx-auto mb-3 text-gray-300" />
                    No terms found matching your criteria.
                  </td>
                </tr>
              ) : (
                termsList.map((term: TermsVersion) => (
                  <tr
                    key={term.id}
                    className="hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="py-4 px-6">
                      <span className="font-medium text-gray-900">
                        {term.version}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                          term.type === "CREATOR"
                            ? "bg-[#F3F0FF] text-[#7B42FF]"
                            : "bg-blue-50 text-blue-600"
                        }`}
                      >
                        {term.type === "CREATOR"
                          ? "Creator Terms"
                          : "General TOS"}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                          term.isActive
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
                          className="p-1.5 text-gray-400 hover:text-[#7B42FF] hover:bg-[#F3F0FF] rounded-md transition-colors"
                          title="Edit"
                          onClick={() => handleOpenModal(term.id)}
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

        {!isLoading && !isError && termsList.length > 0 && (
          <div className="flex items-center justify-between border-t border-gray-100 px-6 py-4 bg-[#F8F9FA]/50">
            <span className="text-sm text-gray-500">
              Showing{" "}
              <span className="font-medium text-gray-900">
                {termsList.length}
              </span>{" "}
              of{" "}
              <span className="font-medium text-gray-900">
                {totalElements}
              </span>{" "}
              entries
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="px-3 py-1.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-md hover:bg-gray-50 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                onClick={() =>
                  setFilters((prev) => ({
                    ...prev,
                    page: Math.max(1, (prev.page || 1) - 1),
                  }))
                }
                disabled={(filters.page || 1) <= 1}
              >
                Previous
              </button>
              <div className="px-3 py-1 text-sm font-medium text-[#7B42FF] bg-[#F3F0FF] rounded-md">
                Page {filters.page || 1} of {totalPages}
              </div>
              <button
                type="button"
                className="px-3 py-1.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-md hover:bg-gray-50 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                onClick={() =>
                  setFilters((prev) => ({
                    ...prev,
                    page: Math.min(totalPages, (prev.page || 1) + 1),
                  }))
                }
                disabled={(filters.page || 1) >= totalPages}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      <TermsFormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        editId={editId}
      />
    </div>
  );
}
