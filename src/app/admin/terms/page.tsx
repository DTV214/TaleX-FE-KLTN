import { Metadata } from "next";
import { TermsManagementTable } from "@/features/admin/terms/components/terms-management-table";

export const metadata: Metadata = {
  title: "Điều khoản & Điều kiện | TaleX Admin",
  description:
    "Quản lý các phiên bản điều khoản dịch vụ và điều khoản dành cho nhà sáng tạo trên TaleX.",
};

export default function AdminTermsPage() {
  return (
    <div className="w-full max-w-7xl mx-auto fade-in">
      {/* 
        Container bọc ngoài đảm bảo nội dung không bị tràn màn hình rộng (max-w-7xl)
        và căn giữa (mx-auto) đúng theo layout admin hiện tại.
      */}
      <TermsManagementTable />
    </div>
  );
}
