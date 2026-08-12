import type { Metadata } from "next";
import { ModerationTicketsDashboard } from "@/features/moderation-reports/components/moderation-tickets-dashboard";

export const metadata: Metadata = {
  title: "Báo cáo & Tickets | Admin",
};

export default function AdminReportsPage() {
  return <ModerationTicketsDashboard scope="admin" />;
}
