import type { Metadata } from "next";
import { AdminTrendingDashboard } from "@/features/admin/trending/components/trending-dashboard";

export const metadata: Metadata = {
  title: "Quản lý Xu hướng | Admin",
};

export default function AdminTrendingPage() {
  return <AdminTrendingDashboard />;
}
