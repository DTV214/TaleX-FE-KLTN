import type { Metadata } from "next";
import { EngagementServicesDashboard } from "@/features/admin/engagement-services/components/engagement-services-dashboard";

export const metadata: Metadata = {
  title: "Quản lý Dịch vụ Tương tác | TaleX Admin",
  description: "Quản lý các gói dịch vụ đẩy tương tác trong TaleX Admin.",
};

export default function AdminEngagementServicesPage() {
  return <EngagementServicesDashboard />;
}
