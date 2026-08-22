import { AdminPayoutsDashboard } from "@/features/admin/payouts/components/admin-payouts-dashboard";

export const metadata = {
  title: "Quản lý Yêu Cầu Rút Tiền | TaleX Admin",
  description: "Duyệt và thực thi lệnh giải ngân rút tiền ví Creator qua PayOS",
};

export default function AdminPayoutsPage() {
  return <AdminPayoutsDashboard />;
}
