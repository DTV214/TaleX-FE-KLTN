import type { Metadata } from "next";
import { PenaltiesDashboard } from "@/features/moderation-reports/components/penalties-dashboard";

export const metadata: Metadata = {
  title: "Hình phạt | Admin",
};

export default function AdminPenaltiesPage() {
  return <PenaltiesDashboard />;
}
