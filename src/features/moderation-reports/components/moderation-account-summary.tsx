"use client";

import { Loader2 } from "lucide-react";
import { useModerationAccount } from "../hooks/use-moderation-reports";

type Props = {
  accountId?: string | null;
  fallbackName?: string | null;
  showUsername?: boolean;
};

function shortId(value?: string | null) {
  if (!value) return "-";
  if (value.length <= 14) return value;
  return `${value.slice(0, 8)}...${value.slice(-6)}`;
}

export function ModerationAccountSummary({
  accountId,
  fallbackName,
  showUsername = true,
}: Props) {
  const accountQuery = useModerationAccount(accountId);
  const account = accountQuery.data;
  const displayName =
    account?.fullName ??
    account?.username ??
    account?.email ??
    fallbackName;

  return (
    <div className="min-w-0 space-y-1">
      <div className="flex min-w-0 items-center gap-2">
        {accountQuery.isLoading && (
          <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-slate-400" />
        )}
        <p
          className="truncate font-black text-slate-900 backoffice-dark:text-white"
          title={displayName ?? accountId ?? undefined}
        >
          {displayName ??
            (accountQuery.isLoading
              ? "Đang tải người dùng..."
              : shortId(accountId))}
        </p>
      </div>
      {showUsername && account?.username && account.username !== displayName && (
        <p className="truncate text-xs font-semibold text-slate-400">
          @{account.username}
        </p>
      )}
      {account?.email && account.email !== displayName && (
        <p className="truncate text-xs font-semibold text-slate-500">
          {account.email}
        </p>
      )}
      {accountQuery.isError && accountId && (
        <p className="truncate text-xs font-semibold text-amber-600">
          Tạm hiển thị mã: {shortId(accountId)}
        </p>
      )}
    </div>
  );
}
