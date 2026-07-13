"use client";

import {
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Plus,
  Search,
  Unlock,
  UserRound,
  X,
} from "lucide-react";
import { type FormEvent, useState } from "react";
import { toast } from "sonner";
import {
  type AccountRole,
  type AccountStatus,
  type AdminAccountItem,
  type CreateStaffPayload,
} from "@/features/admin/api/account.api";
import {
  useBanAccount,
  useCreateStaff,
  useGetAdminAccounts,
  useUnbanAccount,
} from "@/features/admin/hooks/use-account";

const PAGE_SIZE = 10;

const roleOptions: Array<AccountRole | ""> = [
  "",
  "VIEWER",
  "CREATOR",
  "STAFF",
  "ADMIN",
];

const statusOptions: Array<AccountStatus | ""> = ["", "ACTIVE", "BANNED"];

const roleStyles: Record<AccountRole, string> = {
  VIEWER: "border-slate-200 bg-slate-100 text-slate-700",
  CREATOR: "border-violet-200 bg-violet-50 text-violet-700",
  STAFF: "border-sky-200 bg-sky-50 text-sky-700",
  ADMIN: "border-amber-200 bg-amber-50 text-amber-700",
};

const statusStyles: Record<AccountStatus, string> = {
  ACTIVE: "border-emerald-200 bg-emerald-50 text-emerald-700",
  BANNED: "border-red-200 bg-red-50 text-red-700",
  SUSPENDED: "border-orange-200 bg-orange-50 text-orange-700",
  DELETED: "border-slate-200 bg-slate-100 text-slate-500",
  PENDING: "border-blue-200 bg-blue-50 text-blue-700",
};

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Thao tác thất bại.";
}

function formatDate(value: string) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function getInitials(account: AdminAccountItem) {
  return (account.fullName || account.username || account.email)
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function RoleBadge({ role }: { role: AccountRole }) {
  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${roleStyles[role]}`}
    >
      {role}
    </span>
  );
}

function StatusBadge({ status }: { status: AccountStatus }) {
  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${statusStyles[status]}`}
    >
      {status}
    </span>
  );
}

function AccountAvatar({ account }: { account: AdminAccountItem }) {
  if (account.avatarUrl) {
    return (
      <span
        className="h-11 w-11 rounded-full border border-slate-200 bg-cover bg-center"
        style={{ backgroundImage: `url(${account.avatarUrl})` }}
        aria-label={account.fullName}
      />
    );
  }

  return (
    <span className="flex h-11 w-11 items-center justify-center rounded-full border border-violet-100 bg-violet-50 text-sm font-bold text-violet-600">
      {getInitials(account) || <UserRound className="h-5 w-5" />}
    </span>
  );
}

function StaffFormModal({
  isSaving,
  onClose,
  onSubmit,
  open,
}: {
  isSaving: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateStaffPayload) => void;
  open: boolean;
}) {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  if (!open) return null;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const payload = {
      email: String(formData.get("email") ?? "").trim(),
      username: String(formData.get("username") ?? "").trim(),
      fullName: String(formData.get("fullName") ?? "").trim(),
      password: String(formData.get("password") ?? ""),
    };

    if (
      !payload.email ||
      !payload.username ||
      !payload.fullName ||
      !payload.password
    ) {
      toast.error("Vui lòng nhập đầy đủ thông tin Staff.");
      return;
    }

    onSubmit(payload);
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm animate-in fade-in duration-200">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200"
      >
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-950">Thêm Staff</h2>
            <p className="mt-1 text-sm font-medium text-slate-500">
              Tạo tài khoản nhân sự có quyền truy cập khu vực vận hành.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
            aria-label="Đóng"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Email">
            <input
              name="email"
              type="email"
              required
              className={inputClassName}
              placeholder="staff@talex.vn"
            />
          </FormField>
          <FormField label="Username">
            <input
              name="username"
              required
              className={inputClassName}
              placeholder="staff_name"
            />
          </FormField>
          <FormField label="Họ tên">
            <input
              name="fullName"
              required
              className={inputClassName}
              placeholder="Nguyễn Văn A"
            />
          </FormField>
          <FormField label="Mật khẩu">
            <div className="relative">
              <input
                name="password"
                type={isPasswordVisible ? "text" : "password"}
                required
                className={`${inputClassName} pr-11`}
                placeholder="Tối thiểu 8 ký tự"
              />
              <button
                type="button"
                onClick={() => setIsPasswordVisible((visible) => !visible)}
                className="absolute right-3 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                aria-label={
                  isPasswordVisible ? "Ẩn mật khẩu" : "Hiện mật khẩu"
                }
              >
                {isPasswordVisible ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </FormField>
        </div>

        <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="inline-flex h-11 items-center justify-center rounded-lg border border-slate-200 bg-white px-5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-violet-600 px-5 text-sm font-bold text-white shadow-sm transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
            Tạo Staff
          </button>
        </div>
      </form>
    </div>
  );
}

function ConfirmAccountModal({
  account,
  action,
  isSaving,
  onClose,
  onConfirm,
}: {
  account: AdminAccountItem | null;
  action: "ban" | "unban" | null;
  isSaving: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  if (!account || !action) return null;

  const isBan = action === "ban";

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="mb-5">
          <h2 className="text-xl font-bold text-slate-950">
            {isBan ? "Khóa tài khoản?" : "Mở khóa tài khoản?"}
          </h2>
          <p className="mt-2 text-sm font-medium leading-6 text-slate-500">
            Bạn có chắc chắn muốn {isBan ? "Khóa" : "Mở khóa"} tài khoản{" "}
            <span className="font-bold text-slate-900">{account.fullName}</span>{" "}
            không?
          </p>
        </div>

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="inline-flex h-11 items-center justify-center rounded-lg border border-slate-200 bg-white px-5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isSaving}
            className={`inline-flex h-11 items-center justify-center gap-2 rounded-lg px-5 text-sm font-bold text-white shadow-sm transition disabled:cursor-not-allowed disabled:opacity-60 ${
              isBan
                ? "bg-red-600 hover:bg-red-700"
                : "bg-emerald-600 hover:bg-emerald-700"
            }`}
          >
            {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
            {isBan ? "Khóa" : "Mở khóa"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function UserManagementTable() {
  const [keyword, setKeyword] = useState("");
  const [roleName, setRoleName] = useState<AccountRole | "">("");
  const [status, setStatus] = useState<AccountStatus | "">("");
  const [page, setPage] = useState(0);
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] =
    useState<AdminAccountItem | null>(null);
  const [confirmAction, setConfirmAction] = useState<"ban" | "unban" | null>(
    null,
  );

  const accountsQuery = useGetAdminAccounts({
    page,
    size: PAGE_SIZE,
    keyword,
    roleName,
    status,
  });
  const createStaffMutation = useCreateStaff();
  const banMutation = useBanAccount();
  const unbanMutation = useUnbanAccount();

  const accounts = accountsQuery.data?.content ?? [];
  const totalElements = accountsQuery.data?.totalElements ?? 0;
  const totalPages = accountsQuery.data?.totalPages ?? 0;
  const isMutating =
    createStaffMutation.isPending ||
    banMutation.isPending ||
    unbanMutation.isPending;

  function handleKeywordChange(value: string) {
    setKeyword(value);
    setPage(0);
  }

  function handleRoleChange(value: AccountRole | "") {
    setRoleName(value);
    setPage(0);
  }

  function handleStatusChange(value: AccountStatus | "") {
    setStatus(value);
    setPage(0);
  }

  function closeStaffModal() {
    if (createStaffMutation.isPending) return;
    setIsStaffModalOpen(false);
  }

  function handleCreateStaff(payload: CreateStaffPayload) {
    createStaffMutation.mutate(payload, {
      onSuccess: () => {
        toast.success("Đã tạo tài khoản Staff.");
        setIsStaffModalOpen(false);
      },
      onError: (error) => toast.error(getErrorMessage(error)),
    });
  }

  function openConfirmModal(
    account: AdminAccountItem,
    action: "ban" | "unban",
  ) {
    setSelectedAccount(account);
    setConfirmAction(action);
  }

  function closeConfirmModal() {
    if (banMutation.isPending || unbanMutation.isPending) return;
    setSelectedAccount(null);
    setConfirmAction(null);
  }

  function handleConfirmAction() {
    if (!selectedAccount || !confirmAction) return;

    const mutation = confirmAction === "ban" ? banMutation : unbanMutation;
    mutation.mutate(selectedAccount.accountId, {
      onSuccess: () => {
        toast.success(
          confirmAction === "ban"
            ? "Đã khóa tài khoản."
            : "Đã mở khóa tài khoản.",
        );
        setSelectedAccount(null);
        setConfirmAction(null);
      },
      onError: (error) => toast.error(getErrorMessage(error)),
    });
  }

  return (
    <div className="w-full bg-slate-50">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:flex-row lg:items-center">
          <div className="relative w-full lg:max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm theo tên, email, username..."
              value={keyword}
              onChange={(event) => handleKeywordChange(event.target.value)}
              className="h-11 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-4 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
            />
          </div>

          <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto">
            <select
              value={roleName}
              onChange={(event) =>
                handleRoleChange(event.target.value as AccountRole | "")
              }
              className="h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
            >
              {roleOptions.map((role) => (
                <option key={role || "ALL"} value={role}>
                  {role || "Tất cả vai trò"}
                </option>
              ))}
            </select>

            <select
              value={status}
              onChange={(event) =>
                handleStatusChange(event.target.value as AccountStatus | "")
              }
              className="h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
            >
              {statusOptions.map((item) => (
                <option key={item || "ALL"} value={item}>
                  {item || "Tất cả trạng thái"}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => setIsStaffModalOpen(true)}
              disabled={isMutating}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-violet-600 px-5 text-sm font-bold text-white shadow-sm transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Plus className="h-4 w-4" />
              Thêm Staff
            </button>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px] text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-6 py-4">Người dùng</th>
                  <th className="px-6 py-4">Vai trò</th>
                  <th className="px-6 py-4">Trạng thái</th>
                  <th className="px-6 py-4">Ngày tham gia</th>
                  <th className="px-6 py-4 text-right">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {accountsQuery.isLoading && (
                  <tr>
                    <td colSpan={5} className="px-6 py-14 text-center">
                      <Loader2 className="mx-auto h-6 w-6 animate-spin text-slate-400" />
                      <p className="mt-2 text-sm font-medium text-slate-500">
                        Đang tải danh sách người dùng...
                      </p>
                    </td>
                  </tr>
                )}

                {accountsQuery.isError && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-14 text-center text-sm font-semibold text-red-600"
                    >
                      Không thể tải danh sách người dùng.
                    </td>
                  </tr>
                )}

                {!accountsQuery.isLoading &&
                  !accountsQuery.isError &&
                  accounts.length === 0 && (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-6 py-14 text-center text-sm font-medium text-slate-500"
                      >
                        Không có tài khoản phù hợp.
                      </td>
                    </tr>
                  )}

                {accounts.map((account) => {
                  const isAdmin = account.roleName === "ADMIN";
                  const isBanned = account.status === "BANNED";

                  return (
                    <tr
                      key={account.accountId}
                      className="transition hover:bg-slate-50/80"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <AccountAvatar account={account} />
                          <div className="min-w-0">
                            <p className="truncate font-bold text-slate-950">
                              {account.fullName}
                            </p>
                            <p className="mt-0.5 truncate text-xs font-medium text-slate-400">
                              {account.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <RoleBadge role={account.roleName} />
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={account.status} />
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-600">
                        {formatDate(account.createdAt)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openConfirmModal(account, "ban")}
                            disabled={isMutating || isAdmin || isBanned}
                            className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
                            title={
                              isAdmin
                                ? "Không thể khóa Admin"
                                : "Khóa tài khoản"
                            }
                          >
                            <Lock className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => openConfirmModal(account, "unban")}
                            disabled={isMutating || !isBanned}
                            className="rounded-lg p-2 text-slate-400 transition hover:bg-emerald-50 hover:text-emerald-600 disabled:cursor-not-allowed disabled:opacity-40"
                            title="Mở khóa tài khoản"
                          >
                            <Unlock className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50/70 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs font-medium text-slate-500">
              Tổng cộng{" "}
              <span className="font-bold text-slate-900">{totalElements}</span>{" "}
              tài khoản
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((current) => Math.max(current - 1, 0))}
                disabled={page <= 0 || accountsQuery.isFetching}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Trang trước"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="min-w-24 text-center text-xs font-bold text-slate-600">
                Trang {totalPages === 0 ? 0 : page + 1}/{totalPages}
              </span>
              <button
                type="button"
                onClick={() =>
                  setPage((current) =>
                    totalPages > 0
                      ? Math.min(current + 1, totalPages - 1)
                      : current,
                  )
                }
                disabled={
                  totalPages === 0 ||
                  page >= totalPages - 1 ||
                  accountsQuery.isFetching
                }
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Trang sau"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <StaffFormModal
        isSaving={createStaffMutation.isPending}
        onClose={closeStaffModal}
        onSubmit={handleCreateStaff}
        open={isStaffModalOpen}
      />

      <ConfirmAccountModal
        account={selectedAccount}
        action={confirmAction}
        isSaving={banMutation.isPending || unbanMutation.isPending}
        onClose={closeConfirmModal}
        onConfirm={handleConfirmAction}
      />
    </div>
  );
}

const inputClassName =
  "h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-violet-500 focus:ring-4 focus:ring-violet-100";

function FormField({
  children,
  label,
}: {
  children: React.ReactNode;
  label: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold text-slate-700">
        {label}
      </span>
      {children}
    </label>
  );
}
