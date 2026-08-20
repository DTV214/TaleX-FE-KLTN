"use client";

import { Loader2, X } from "lucide-react";
import type { FormEvent } from "react";
import { useState } from "react";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/shared/api/http-client";
import { Button } from "@/shared/ui/button";
import type {
  AdminCampaign,
  AdminCampaignStatus,
} from "../types/campaigns.types";
import { useUpdateAdminCampaign } from "../hooks/use-admin-campaigns";
import {
  adminCampaignStatusOptions,
  getAdminCampaignStatusLabel,
} from "./campaign-status";

type CampaignStatusModalProps = {
  campaign: AdminCampaign | null;
  isOpen: boolean;
  onClose: () => void;
};

function shortenId(value?: string | null) {
  if (!value) {
    return "Chưa có";
  }

  return value.length > 18 ? `${value.slice(0, 10)}...${value.slice(-6)}` : value;
}

export function CampaignStatusModal({
  campaign,
  isOpen,
  onClose,
}: CampaignStatusModalProps) {
  if (!isOpen || !campaign) {
    return null;
  }

  return (
    <CampaignStatusDialog
      key={`${campaign.campaignId}-${campaign.status ?? "UNKNOWN"}`}
      campaign={campaign}
      onClose={onClose}
    />
  );
}

function CampaignStatusDialog({
  campaign,
  onClose,
}: {
  campaign: AdminCampaign;
  onClose: () => void;
}) {
  const updateMutation = useUpdateAdminCampaign();
  const [status, setStatus] = useState<AdminCampaignStatus>(
    campaign.status ?? "RUNNING",
  );
  const isSubmitting = updateMutation.isPending;

  const activeCampaign = campaign;

  function handleClose() {
    if (!isSubmitting) {
      onClose();
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      await updateMutation.mutateAsync({
        campaignId: activeCampaign.campaignId,
        payload: { status },
      });
      toast.success("Cập nhật trạng thái chiến dịch thành công.");
      onClose();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/35 px-4 py-6 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        className="w-full max-w-xl overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">
          <div>
            <p className="text-xs font-black uppercase tracking-wider text-violet-600 backoffice-dark:text-[var(--backoffice-primary)]">
              Quản trị chiến dịch
            </p>
            <h2 className="mt-1 text-2xl font-black text-slate-900">
              Cập nhật chiến dịch
            </h2>
            <p className="mt-2 text-sm font-medium leading-6 text-slate-500">
              Admin chỉ thay đổi trạng thái vận hành của chiến dịch tương tác.
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Đóng modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4">
            <dl className="grid gap-4 text-sm sm:grid-cols-2">
              <div>
                <dt className="font-bold text-slate-500">Mã chiến dịch</dt>
                <dd className="mt-1 break-all font-black text-slate-900">
                  {activeCampaign.campaignId}
                </dd>
              </div>
              <div>
                <dt className="font-bold text-slate-500">Mã đơn hàng</dt>
                <dd className="mt-1 font-black text-slate-900">
                  {shortenId(activeCampaign.orderId)}
                </dd>
              </div>
              <div>
                <dt className="font-bold text-slate-500">Trạng thái hiện tại</dt>
                <dd className="mt-1 font-black text-slate-900">
                  {getAdminCampaignStatusLabel(activeCampaign.status)}
                </dd>
              </div>
              <div>
                <dt className="font-bold text-slate-500">Gói tương tác</dt>
                <dd className="mt-1 font-black text-slate-900">
                  {shortenId(activeCampaign.engagementServiceId)}
                </dd>
              </div>
            </dl>
          </div>

          <label className="mt-5 block space-y-2">
            <span className="text-sm font-bold text-slate-800">
              Trạng thái mới
            </span>
            <select
              value={status}
              onChange={(event) =>
                setStatus(event.target.value as AdminCampaignStatus)
              }
              className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-100 backoffice-dark:border-white/10 backoffice-dark:bg-black/30 backoffice-dark:text-white backoffice-dark:focus:ring-[rgba(212,175,55,0.16)]"
            >
              {adminCampaignStatusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <div className="mt-7 flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
              className="h-11 border-slate-200 bg-white px-5 text-slate-700 hover:bg-slate-50"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || status === activeCampaign.status}
              className="h-11 bg-violet-600 px-6 font-bold text-white hover:bg-violet-700 backoffice-dark:bg-[var(--backoffice-primary)] backoffice-dark:text-black backoffice-dark:hover:bg-[var(--backoffice-primary-bright)]"
            >
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Lưu thay đổi
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
