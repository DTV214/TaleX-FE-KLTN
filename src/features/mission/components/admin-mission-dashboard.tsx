"use client";

import { useState } from "react";
import { Edit2, Plus, Power, PowerOff, Target } from "lucide-react";
import type { Mission } from "../api/mission.dto";
import { useAdminMissions } from "../hooks/useMissionQueries";
import { useToggleMissionMutation } from "../hooks/useMissionMutations";
import { AdminMissionForm } from "./admin-mission-form";

function formatCoin(value: number) {
  return new Intl.NumberFormat("vi-VN", {
    maximumFractionDigits: 4,
  }).format(value);
}

function TableSkeleton() {
  return (
    <div className="space-y-3 p-6 animate-pulse">
      {[0, 1, 2, 3].map((item) => (
        <div key={item} className="h-14 rounded-lg bg-gray-100" />
      ))}
    </div>
  );
}

export function AdminMissionDashboard() {
  const [editingMission, setEditingMission] = useState<
    Mission | null | undefined
  >(undefined);
  const missionsQuery = useAdminMissions();
  const toggleMutation = useToggleMissionMutation();

  if (editingMission !== undefined) {
    return (
      <AdminMissionForm
        initialData={editingMission}
        onSuccess={() => setEditingMission(undefined)}
        onCancel={() => setEditingMission(undefined)}
      />
    );
  }

  return (
    <section className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
      <div className="flex flex-col gap-4 border-b border-gray-100 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-heading text-xl font-bold text-gray-900">
            Danh Sách Nhiệm Vụ
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Quản lý nội dung, chỉ tiêu, phần thưởng và trạng thái hoạt động.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setEditingMission(null)}
          className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-lg bg-[#007A8A] px-5 text-sm font-bold text-white shadow-sm transition hover:bg-[#006673]"
        >
          <Plus className="h-4 w-4" />
          Thêm Nhiệm Vụ Mới
        </button>
      </div>

      {missionsQuery.isLoading && <TableSkeleton />}

      {!missionsQuery.isLoading && missionsQuery.isError && (
        <div className="m-6 rounded-lg border border-red-200 bg-red-50 p-5 text-sm font-semibold text-red-700">
          Không thể tải danh sách nhiệm vụ. Vui lòng thử lại sau.
        </div>
      )}

      {!missionsQuery.isLoading &&
        !missionsQuery.isError &&
        missionsQuery.data?.length === 0 && (
          <div className="flex min-h-72 flex-col items-center justify-center px-6 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-xl bg-[#E6F7F9] text-[#007A8A]">
              <Target className="h-7 w-7" />
            </span>
            <p className="mt-4 font-heading text-lg font-bold text-gray-900">
              Chưa có nhiệm vụ nào
            </p>
            <p className="mt-2 max-w-sm text-sm leading-6 text-gray-500">
              Tạo nhiệm vụ đầu tiên để bắt đầu xây dựng hệ thống thử thách cho người dùng.
            </p>
          </div>
        )}

      {!missionsQuery.isLoading &&
        !missionsQuery.isError &&
        Boolean(missionsQuery.data?.length) && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px] text-left">
              <thead className="border-b border-gray-100 bg-gray-50/80">
                <tr className="text-xs font-bold uppercase tracking-wider text-gray-500">
                  <th className="px-6 py-4">Mã Code</th>
                  <th className="px-6 py-4">Nhiệm vụ</th>
                  <th className="px-6 py-4">Phần thưởng</th>
                  <th className="px-6 py-4">Mục tiêu</th>
                  <th className="px-6 py-4">Trạng thái</th>
                  <th className="px-6 py-4 text-right">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {missionsQuery.data?.map((mission) => {
                  const isToggling =
                    toggleMutation.isPending &&
                    toggleMutation.variables === mission.missionId;

                  return (
                    <tr
                      key={mission.missionId}
                      className="transition hover:bg-gray-50/70"
                    >
                      <td className="px-6 py-4">
                        <span className="rounded-md bg-gray-100 px-2.5 py-1 font-mono text-xs font-bold text-gray-700">
                          {mission.code}
                        </span>
                      </td>
                      <td className="max-w-xs px-6 py-4">
                        <p className="truncate text-sm font-bold text-gray-900">
                          {mission.title}
                        </p>
                        <p className="mt-1 truncate text-xs text-gray-500">
                          {mission.description}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-[#007A8A]">
                        {formatCoin(mission.rewardAmount)} Coin
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-gray-700">
                        {mission.targetValue}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={
                            mission.isActive
                              ? "inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700"
                              : "inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-bold text-gray-500"
                          }
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              mission.isActive ? "bg-emerald-500" : "bg-gray-400"
                            }`}
                          />
                          {mission.isActive ? "Đang bật" : "Đang tắt"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            disabled={toggleMutation.isPending}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              toggleMutation.mutate(mission.missionId);
                            }}
                            className={
                              mission.isActive
                                ? "inline-flex h-9 items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 text-xs font-bold text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-50"
                                : "inline-flex h-9 items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 text-xs font-bold text-red-600 transition hover:bg-red-100 disabled:opacity-50"
                            }
                          >
                            {mission.isActive ? (
                              <Power className={`h-4 w-4 ${isToggling ? "animate-pulse" : ""}`} />
                            ) : (
                              <PowerOff className={`h-4 w-4 ${isToggling ? "animate-pulse" : ""}`} />
                            )}
                            {mission.isActive ? "Tắt" : "Bật"}
                          </button>

                          <button
                            type="button"
                            onClick={() => setEditingMission(mission)}
                            className="inline-flex h-9 items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 text-xs font-bold text-gray-600 transition hover:border-[#007A8A]/40 hover:text-[#007A8A]"
                          >
                            <Edit2 className="h-4 w-4" />
                            Chỉnh sửa
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
    </section>
  );
}
