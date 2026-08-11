import type { Metadata } from "next";
import { Target } from "lucide-react";
import { AdminMissionDashboard } from "@/features/mission/components/admin-mission-dashboard";

export const metadata: Metadata = {
  title: "Quản Lý Nhiệm Vụ | TaleX Admin",
  description: "Quản lý nhiệm vụ động, phần thưởng và trạng thái kích hoạt.",
};

export default function AdminMissionManagementPage() {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-8">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600 backoffice-dark:bg-[var(--backoffice-primary-soft)] backoffice-dark:text-[var(--backoffice-primary)]">
          <Target className="h-6 w-6" />
        </div>
        <div>
          <p className="mb-1 text-sm font-medium text-gray-500 backoffice-dark:text-white/55">
            Admin / Mission System
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 backoffice-dark:text-white">
            Quản Lý Nhiệm Vụ Động
          </h1>
          <p className="mt-2 text-sm text-gray-500 backoffice-dark:text-white/55">
            Tạo thử thách, điều chỉnh phần thưởng và kiểm soát nhiệm vụ hiển thị cho người dùng.
          </p>
        </div>
      </div>

      <AdminMissionDashboard />
    </div>
  );
}
