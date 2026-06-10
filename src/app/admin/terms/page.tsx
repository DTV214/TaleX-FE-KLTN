import { Metadata } from "next";
import { TermsManagementTable } from "@/features/admin/terms/components/terms-management-table";

export const metadata: Metadata = {
  title: "Terms Management | TaleX Admin",
  description:
    "Manage creator and general terms of service versions for the TaleX platform.",
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
