"use client";

import { useState } from "react";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Eye,
  CheckCircle2,
  XCircle,
  Film,
  BookOpen,
  Loader2,
} from "lucide-react";
import { usePendingMedia } from "../hooks/use-moderation-queries";
import { useApproveMedia, useRejectMedia } from "../hooks/use-moderation-mutations";
import { RejectReasonModal } from "./reject-reason-modal";

export function ContentModerationTable() {
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(0);
  const [rejectTarget, setRejectTarget] = useState<string | null>(null);

  const { data, isLoading } = usePendingMedia(page, 20);
  const approveMutation = useApproveMedia();
  const rejectMutation = useRejectMedia();

  const items = data?.content ?? [];

  return (
    <div className="w-full flex flex-col gap-6 mt-6">
      {/* Search */}
      <div className="relative w-full md:max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Tìm theo ID hoặc loại media..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="h-11 w-full rounded-lg border border-gray-200 bg-white pl-10 pr-4 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#10B981]/20 focus:border-[#10B981] transition-all shadow-sm"
        />
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50/80 text-gray-500 text-xs font-bold uppercase tracking-wider border-b border-gray-100">
              <tr>
                <th className="px-6 py-4">Media ID</th>
                <th className="px-6 py-4">Loại</th>
                <th className="px-6 py-4">Trạng thái</th>
                <th className="px-6 py-4">Ngày tạo</th>
                <th className="px-6 py-4 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-gray-400" />
                    <p className="mt-2 text-sm text-gray-500">Đang tải...</p>
                  </td>
                </tr>
              )}
              {!isLoading && items.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-sm text-gray-500">
                    Không có nội dung nào chờ duyệt.
                  </td>
                </tr>
              )}
              {items.map((item) => (
                <tr key={item.mediaId} className="hover:bg-gray-50/80 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <p className="text-sm font-bold text-gray-900 truncate max-w-[200px]">
                      {item.mediaId.slice(0, 8)}...
                    </p>
                    <p className="text-[11px] text-gray-500">Episode: {item.episodeId.slice(0, 8)}...</p>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {item.mediaType === "VIDEO" ? (
                        <Film className="w-4 h-4 text-blue-500" />
                      ) : (
                        <BookOpen className="w-4 h-4 text-purple-500" />
                      )}
                      <span className="text-xs font-bold text-gray-700">{item.mediaType}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2.5 py-1 text-[10px] font-bold tracking-wider rounded-md uppercase bg-amber-50 text-amber-600">
                      {item.approvalStatus}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500">
                    {new Date(item.createdAt).toLocaleDateString("vi-VN")}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-1">
                      {item.originalUrl && (
                        <a
                          href={item.originalUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                          title="Xem nội dung"
                        >
                          <Eye className="w-4 h-4" />
                        </a>
                      )}
                      <button
                        onClick={() => approveMutation.mutate(item.mediaId)}
                        disabled={approveMutation.isPending}
                        className="p-2 text-gray-400 hover:text-[#10B981] rounded-lg hover:bg-[#ECFDF5] transition-colors disabled:opacity-50"
                        title="Phê duyệt"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setRejectTarget(item.mediaId)}
                        className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                        title="Từ chối"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data && data.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-100 px-6 py-3">
            <p className="text-xs text-gray-500">
              Trang {data.pageNumber + 1} / {data.totalPages} ({data.totalElements} items)
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={data.isFirst}
                className="p-1.5 rounded border border-gray-200 disabled:opacity-30"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={data.isLast}
                className="p-1.5 rounded border border-gray-200 disabled:opacity-30"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Reject Modal */}
      <RejectReasonModal
        open={rejectTarget !== null}
        onOpenChange={(open) => { if (!open) setRejectTarget(null); }}
        onConfirm={(reason) => {
          if (rejectTarget) {
            rejectMutation.mutate(
              { mediaId: rejectTarget, reason },
              { onSuccess: () => setRejectTarget(null) },
            );
          }
        }}
        isLoading={rejectMutation.isPending}
      />
    </div>
  );
}
