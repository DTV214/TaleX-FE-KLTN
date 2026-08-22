"use client";

import { UserManagementTable } from "@/features/admin/components/user-management-table";

export default function UsersPage() {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
      <div>
        <div>
          <h1 className="mb-2 text-3xl font-bold tracking-tight text-gray-900 backoffice-dark:text-white">
            Quản Lý Người Dùng
          </h1>
        </div>
      </div>

      <UserManagementTable />
    </div>
  );
}
