import type { Metadata } from "next";
import { AppealsDashboard } from "@/features/moderation-reports/components/appeals-dashboard";

export const metadata: Metadata = {
  title: "Khiếu nại | Admin",
};

export default function AdminAppealsPage() {
  return <AppealsDashboard />;
}
