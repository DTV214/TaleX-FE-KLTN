import type { Metadata } from "next";
import { CreatorConfigDashboard } from "@/features/admin/creator-config/components/creator-config-dashboard";

export const metadata: Metadata = {
  title: "Creator Config | Admin",
};

export default function AdminCreatorConfigPage() {
  return <CreatorConfigDashboard />;
}
