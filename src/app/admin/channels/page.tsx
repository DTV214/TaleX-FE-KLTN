import type { Metadata } from "next";
import { AdminChannelsDashboard } from "@/features/admin/channels/components/channels-dashboard";

export const metadata: Metadata = {
  title: "Quản lý Kênh Hiển Thị | Admin",
  description: "Quản lý các kênh tổng hợp và kênh đề xuất cá nhân trên hệ thống TaleX",
};

export default function AdminChannelsPage() {
  return <AdminChannelsDashboard />;
}
