"use client";

import { type FormEvent, useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  FileQuestion,
  Image as ImageIcon,
  Loader2,
  RefreshCcw,
} from "lucide-react";
import { toast } from "sonner";
import {
  parseProofUrls,
  type Appeal,
  type AppealStatus,
} from "../api/moderation-reports.api";
import {
  useAppeals,
  useProcessAppeal,
} from "../hooks/use-moderation-reports";
import {
  appealStatusOptions,
  formatDateTime,
  labelForAppealStatus,
  labelForPenaltyLevel,
  statusTone,
} from "../utils/moderation-labels";

const PAGE_SIZE = 20;

function AppealProofLinks({ value }: { value?: string }) {
  const urls = parseProofUrls(value);
  if (!urls.length) return <span className="text-xs font-semibold text-slate-400">Không có ảnh</span>;
  return (
    <div className="flex flex-wrap gap-2">
      {urls.map((url, index) => (
        <a
          key={`${url}-${index}`}
          href={url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-600 hover:border-amber-300 hover:bg-amber-50 hover:text-amber-700"
        >
          <ImageIcon className="h-3.5 w-3.5" />
          Minh chứng {index + 1}
        </a>
      ))}
    </div>
  );
}

function AppealProcessModal({
  appeal,
  onClose,
}: {
  appeal: Appeal | null;
  onClose: () => void;
}) {
  const [isApproved, setIsApproved] = useState(true);
  const [adminNote, setAdminNote] = useState("");
  const processMutation = useProcessAppeal(appeal?.appealId);

  if (!appeal) return null;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = adminNote.trim();
    if (!trimmed) {
      toast.error("Vui lòng nhập ghi chú xử lý khiếu nại.");
      return;
    }
    await processMutation.mutateAsync({ isApproved, adminNote: trimmed });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/60 px-4 py-8 backdrop-blur-sm">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl"
      >
        <h2 className="text-lg font-black text-slate-950">Xét duyệt khiếu nại</h2>
        <p className="mt-1 break-all text-xs font-semibold text-slate-500">
          Appeal {appeal.appealId} · Penalty {appeal.penaltyId}
        </p>

        <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm font-black text-slate-950">Lý do của creator</p>
          <p className="mt-2 whitespace-pre-line text-sm font-medium leading-relaxed text-slate-700">
            {appeal.reason || "Không có nội dung."}
          </p>
          <div className="mt-3">
            <AppealProofLinks value={appeal.proofDocuments} />
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2">
          {[
            { key: true, label: "Chấp nhận khiếu nại" },
            { key: false, label: "Từ chối khiếu nại" },
          ].map((option) => (
            <button
              key={String(option.key)}
              type="button"
              onClick={() => setIsApproved(option.key)}
              disabled={processMutation.isPending || appeal.status !== "PENDING"}
              className={`h-10 rounded-lg border text-xs font-black transition disabled:opacity-50 ${
                isApproved === option.key
                  ? "border-slate-950 bg-slate-950 text-white"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        <label className="mt-4 block">
          <span className="mb-2 block text-sm font-bold text-slate-700">Ghi chú admin</span>
          <textarea
            value={adminNote}
            onChange={(event) => setAdminNote(event.target.value)}
            disabled={processMutation.isPending || appeal.status !== "PENDING"}
            rows={5}
            className="w-full resize-none rounded-lg border border-slate-200 px-3 py-3 text-sm font-medium text-slate-900 outline-none focus:border-amber-500 disabled:bg-slate-100"
            placeholder="Nêu rõ cơ sở chấp nhận hoặc từ chối khiếu nại."
          />
        </label>

        {appeal.status !== "PENDING" && (
          <p className="mt-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-500">
            Khiếu nại này đã được xử lý, không thể thao tác lại.
          </p>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={processMutation.isPending}
            className="h-10 rounded-lg border border-slate-200 px-4 text-sm font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
          >
            Đóng
          </button>
          <button
            type="submit"
            disabled={processMutation.isPending || appeal.status !== "PENDING"}
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-slate-950 px-4 text-sm font-black text-white hover:bg-slate-800 disabled:opacity-50"
          >
            {processMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Lưu kết quả
          </button>
        </div>
      </form>
    </div>
  );
}

export function AppealsDashboard() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<AppealStatus | "ALL">("ALL");
  const [selectedAppeal, setSelectedAppeal] = useState<Appeal | null>(null);

  const queryParams = useMemo(
    () => ({ page, pageSize: PAGE_SIZE, status }),
    [page, status],
  );
  const appealsQuery = useAppeals(queryParams);
  const appeals = appealsQuery.data?.content ?? [];

  return (
    <div className="w-full space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-black text-blue-700">
              <FileQuestion className="h-3.5 w-3.5" />
              Appeals
            </div>
            <h1 className="text-2xl font-black text-slate-950">Khiếu nại hình phạt</h1>
            <p className="mt-1 max-w-2xl text-sm font-semibold leading-relaxed text-slate-500">
              Admin xem khiếu nại từ creator, ảnh minh chứng và quyết định gỡ hoặc giữ penalty.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <select
              value={status}
              onChange={(event) => {
                setStatus(event.target.value as AppealStatus | "ALL");
                setPage(1);
              }}
              className="h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 outline-none focus:border-blue-500"
            >
              {appealStatusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => appealsQuery.refetch()}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-black text-slate-600 hover:bg-slate-50"
            >
              <RefreshCcw className="h-4 w-4" />
              Tải lại
            </button>
          </div>
        </div>
      </section>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {appealsQuery.isLoading ? (
          <div className="px-6 py-16 text-center">
            <Loader2 className="mx-auto h-7 w-7 animate-spin text-slate-400" />
            <p className="mt-3 text-sm font-semibold text-slate-500">Đang tải khiếu nại...</p>
          </div>
        ) : appealsQuery.isError ? (
          <div className="px-6 py-16 text-center text-sm font-bold text-red-600">
            Không thể tải danh sách khiếu nại.
          </div>
        ) : appeals.length === 0 ? (
          <div className="px-6 py-16 text-center text-sm font-semibold text-slate-500">
            Không có khiếu nại phù hợp bộ lọc.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs font-black uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-4">Appeal</th>
                  <th className="px-5 py-4">Creator</th>
                  <th className="px-5 py-4">Penalty</th>
                  <th className="px-5 py-4">Lý do</th>
                  <th className="px-5 py-4">Trạng thái</th>
                  <th className="px-5 py-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {appeals.map((appeal) => (
                  <tr key={appeal.appealId} className="hover:bg-slate-50">
                    <td className="px-5 py-4">
                      <p className="font-black text-slate-950">{appeal.appealId}</p>
                      <p className="mt-1 text-xs font-semibold text-slate-500">
                        {formatDateTime(appeal.createdAt)}
                      </p>
                    </td>
                    <td className="px-5 py-4 font-bold text-slate-800">
                      {appeal.appellantUsername || appeal.appellantId || "-"}
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-bold text-slate-800">{appeal.penaltyId}</p>
                      <p className="mt-1 text-xs font-semibold text-slate-500">
                        {labelForPenaltyLevel(appeal.penalty?.level)}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="max-w-[260px] truncate font-medium text-slate-700">
                        {appeal.reason || "-"}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`rounded-full border px-2.5 py-1 text-[11px] font-black ${statusTone(appeal.status)}`}>
                        {labelForAppealStatus(appeal.status)}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedAppeal(appeal)}
                        className="inline-flex h-9 items-center gap-2 rounded-lg bg-slate-950 px-3 text-xs font-black text-white hover:bg-slate-800"
                      >
                        Xem & xử lý
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {appealsQuery.data && appealsQuery.data.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-200 px-5 py-3">
            <p className="text-sm font-semibold text-slate-500">
              Trang {appealsQuery.data.pageNumber} / {appealsQuery.data.totalPages}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={appealsQuery.data.isFirst || appealsQuery.isFetching}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 disabled:opacity-40"
                aria-label="Trang trước"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setPage((current) => current + 1)}
                disabled={appealsQuery.data.isLast || appealsQuery.isFetching}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 disabled:opacity-40"
                aria-label="Trang sau"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      <AppealProcessModal appeal={selectedAppeal} onClose={() => setSelectedAppeal(null)} />
    </div>
  );
}
