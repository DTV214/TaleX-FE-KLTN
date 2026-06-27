import { CreatorDashboard } from "@/features/creator-dashboard/components/creator-dashboard";
import { CreatorGuard } from "@/features/creator-dashboard/components/creator-guard";

export default function CreatorDashboardPage() {
  return (
    <CreatorGuard>
      <CreatorDashboard />
    </CreatorGuard>
  );
}
