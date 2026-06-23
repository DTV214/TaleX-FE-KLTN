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
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-[#E6F7F9] text-[#007A8A]">
          <Target className="h-6 w-6" />
        </div>
        <div>
          <p className="mb-1 text-sm font-medium text-gray-500">
            Admin / Mission System
          </p>
          <h1 className="font-heading text-3xl font-bold text-gray-900">
            Quản Lý Nhiệm Vụ Động
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Tạo thử thách, điều chỉnh phần thưởng và kiểm soát nhiệm vụ hiển thị cho người dùng.
          </p>
        </div>
      </div>

      <AdminMissionDashboard />
    </div>
  );
}
