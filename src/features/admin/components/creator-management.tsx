"use client";

import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Mail,
  ShieldAlert,
  UserRound,
  Users,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import {
  type AdminCreatorItem,
  type AdminCreatorStatus,
} from "@/features/admin/api/creator-admin.api";
import {
  useGetAdminCreators,
  useGetCreatorViolations,
} from "@/features/admin/hooks/use-creator-admin";

const statusStyles: Record<AdminCreatorStatus, string> = {
  ACTIVE: "border-emerald-200 bg-emerald-50 text-emerald-700",
  INACTIVE: "border-slate-200 bg-slate-100 text-slate-600",
  BANNED: "border-red-200 bg-red-50 text-red-700",
  SUSPENDED: "border-orange-200 bg-orange-50 text-orange-700",
  PENDING: "border-blue-200 bg-blue-50 text-blue-700",
};

const CREATOR_PAGE_SIZE = 10;

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function StatusBadge({ status }: { status: AdminCreatorStatus }) {
  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${statusStyles[status]}`}
    >
      {status}
    </span>
  );
}

function CreatorAvatar({ creator }: { creator: AdminCreatorItem }) {
  if (creator.avatar) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={creator.avatar}
        alt={creator.name}
        className="h-11 w-11 rounded-full border border-slate-200 object-cover"
      />
    );
  }

  return (
    <div className="flex h-11 w-11 items-center justify-center rounded-full border border-violet-100 bg-violet-50 text-sm font-bold text-violet-600">
      {getInitials(creator.name) || <UserRound className="h-5 w-5" />}
    </div>
  );
}

function ViolationSummaryModal({
  creator,
  onClose,
}: {
  creator: AdminCreatorItem | null;
  onClose: () => void;
}) {
  const violationsQuery = useGetCreatorViolations(creator?.id);

  if (!creator) return null;

  const summary = violationsQuery.data;
  const isRedAlert = (summary?.copyrightStrikes ?? 0) >= 3;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-950">
              Hồ sơ vi phạm
            </h2>
            <p className="mt-1 text-sm font-medium text-slate-500">
              {creator.name} - {creator.email}
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

        {violationsQuery.isLoading && (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-6 py-12 text-center">
            <Loader2 className="mx-auto h-7 w-7 animate-spin text-slate-400" />
            <p className="mt-3 text-sm font-semibold text-slate-500">
              Đang tải hồ sơ vi phạm...
            </p>
          </div>
        )}

        {violationsQuery.isError && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-6 py-10 text-center">
            <AlertTriangle className="mx-auto h-7 w-7 text-red-600" />
            <p className="mt-3 text-sm font-bold text-red-700">
              Không thể tải hồ sơ vi phạm của creator này.
            </p>
          </div>
        )}

        {summary && (
          <div className="space-y-4">
            {isRedAlert && (
              <div className="rounded-2xl border border-red-300 bg-red-50 p-4 text-red-700 shadow-sm shadow-red-100">
                <div className="flex gap-3">
                  <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
                  <p className="text-sm font-black uppercase leading-6">
                    ⚠️ TÀI KHOẢN NÀY ĐANG TRONG DIỆN BÁO ĐỘNG ĐỎ VÌ VI PHẠM
                    BẢN QUYỀN NHIỀU LẦN
                  </p>
                </div>
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
                <p className="text-sm font-bold text-red-600">
                  Gậy bản quyền
                </p>
                <p className="mt-3 text-4xl font-black text-red-700">
                  {summary.copyrightStrikes}
                </p>
              </div>
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
                <p className="text-sm font-bold text-amber-700">
                  Rớt kiểm duyệt
                </p>
                <p className="mt-3 text-4xl font-black text-amber-700">
                  {summary.censorshipViolations}
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                Creator ID
              </p>
              <p className="mt-1 break-all text-sm font-bold text-slate-900">
                {summary.creatorId}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function CreatorManagement() {
  const creatorsQuery = useGetAdminCreators();
  const [selectedCreator, setSelectedCreator] =
    useState<AdminCreatorItem | null>(null);
  const [page, setPage] = useState(1);
  const creators = useMemo(() => creatorsQuery.data ?? [], [creatorsQuery.data]);
  const totalPages = Math.max(1, Math.ceil(creators.length / CREATOR_PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const firstItem =
    creators.length === 0 ? 0 : (currentPage - 1) * CREATOR_PAGE_SIZE + 1;
  const lastItem = Math.min(currentPage * CREATOR_PAGE_SIZE, creators.length);
  const paginatedCreators = useMemo(
    () =>
      creators.slice(
        (currentPage - 1) * CREATOR_PAGE_SIZE,
        currentPage * CREATOR_PAGE_SIZE,
      ),
    [creators, currentPage],
  );

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-950 backoffice-dark:text-white">
          Quản Lý Người Sáng Tạo
        </h1>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.04]">
        <div className="border-b border-slate-200 bg-white px-6 py-4 backoffice-dark:border-white/10 backoffice-dark:bg-transparent">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-950">
                Danh sách Nhà Sáng Tạo
              </h2>
              <p className="text-sm font-medium text-slate-500">
                {creators.length} tài khoản
              </p>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500 backoffice-dark:border-white/10 backoffice-dark:bg-white/5 backoffice-dark:text-white/45">
              <tr>
                <th className="px-6 py-4">Creator</th>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4">Trạng thái</th>
                <th className="px-6 py-4 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {creatorsQuery.isLoading && (
                <tr>
                  <td colSpan={4} className="px-6 py-14 text-center">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin text-slate-400" />
                    <p className="mt-2 text-sm font-medium text-slate-500">
                      Đang tải danh sách creator...
                    </p>
                  </td>
                </tr>
              )}

              {creatorsQuery.isError && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-14 text-center text-sm font-semibold text-red-600"
                  >
                    Không thể tải danh sách creator.
                  </td>
                </tr>
              )}

              {!creatorsQuery.isLoading &&
                !creatorsQuery.isError &&
                creators.length === 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-6 py-14 text-center text-sm font-medium text-slate-500"
                    >
                      Chưa có creator nào trong hệ thống.
                    </td>
                  </tr>
                )}

              {paginatedCreators.map((creator) => (
                <tr key={creator.id} className="transition hover:bg-slate-50/80 backoffice-dark:hover:bg-white/[0.05]">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <CreatorAvatar creator={creator} />
                      <div>
                        <p className="font-bold text-slate-950">
                          {creator.name}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-400">
                          ID: {creator.id}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 font-semibold text-slate-700">
                      <Mail className="h-4 w-4 text-slate-400" />
                      {creator.email}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={creator.status} />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => setSelectedCreator(creator)}
                        className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 transition hover:border-violet-200 hover:bg-violet-50 hover:text-violet-600 backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.05] backoffice-dark:text-white/75 backoffice-dark:hover:bg-white/10"
                      >
                        <ShieldAlert className="h-4 w-4" />
                        Hồ sơ vi phạm
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {!creatorsQuery.isLoading && !creatorsQuery.isError && creators.length > 0 && (
          <div className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4 sm:flex-row sm:items-center sm:justify-between backoffice-dark:border-white/10 backoffice-dark:bg-black/30">
            <p className="text-sm font-bold text-slate-500 backoffice-dark:text-white/55">
              Hiển thị {firstItem}-{lastItem} / {creators.length} creator
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={currentPage === 1}
                className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-45 backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.05] backoffice-dark:text-white/70 backoffice-dark:hover:bg-white/10"
              >
                <ChevronLeft className="h-4 w-4" />
                Trước
              </button>
              <span className="inline-flex h-10 min-w-16 items-center justify-center rounded-lg border border-slate-200 bg-white px-3 text-sm font-black text-slate-900 backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.08] backoffice-dark:text-white">
                {currentPage} / {totalPages}
              </span>
              <button
                type="button"
                onClick={() =>
                  setPage((current) => Math.min(totalPages, current + 1))
                }
                disabled={currentPage === totalPages}
                className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-45 backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.05] backoffice-dark:text-white/70 backoffice-dark:hover:bg-white/10"
              >
                Sau
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      <ViolationSummaryModal
        creator={selectedCreator}
        onClose={() => setSelectedCreator(null)}
      />
    </div>
  );
}
