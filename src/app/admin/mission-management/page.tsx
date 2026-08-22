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
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 backoffice-dark:text-white">
            Quản Lý Nhiệm Vụ
          </h1>
        </div>
      </div>

      <AdminMissionDashboard />
    </div>
  );
}
