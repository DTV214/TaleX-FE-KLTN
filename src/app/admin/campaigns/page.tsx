import type { Metadata } from "next";
import { CampaignsDashboard } from "@/features/admin/campaigns/components/campaigns-dashboard";

export const metadata: Metadata = {
  title: "Quản lý Chiến dịch | TaleX Admin",
  description: "Quản lý các chiến dịch đẩy tương tác trong TaleX Admin.",
};

export default function CampaignsPage() {
  return <CampaignsDashboard />;
}
