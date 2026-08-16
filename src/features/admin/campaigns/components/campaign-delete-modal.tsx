"use client";

import { useState, type FormEvent } from "react";
import { AlertTriangle, Check, Copy, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/shared/api/http-client";
import { Button } from "@/shared/ui/button";
import type { AdminCampaign } from "../types/campaigns.types";
import { useDeleteAdminCampaign } from "../hooks/use-admin-campaigns";

type CampaignDeleteModalProps = {
  campaign: AdminCampaign | null;
  isOpen: boolean;
  onClose: () => void;
};

export function CampaignDeleteModal({
  campaign,
  isOpen,
  onClose,
}: CampaignDeleteModalProps) {
  if (!isOpen || !campaign) {
    return null;
  }

  return (
    <CampaignDeleteDialog
      key={campaign.campaignId}
      campaign={campaign}
      onClose={onClose}
    />
  );
}

function CampaignDeleteDialog({
  campaign,
  onClose,
}: {
  campaign: AdminCampaign;
  onClose: () => void;
}) {
  const deleteMutation = useDeleteAdminCampaign();
  const [typedCampaignId, setTypedCampaignId] = useState("");
  const [isCopied, setIsCopied] = useState(false);

  const isMatch = typedCampaignId.trim() === campaign.campaignId;
  const isSubmitting = deleteMutation.isPending;

  function handleCopy() {
    navigator.clipboard.writeText(campaign.campaignId);
    setIsCopied(true);
    toast.info("Đã sao chép Campaign ID vào clipboard");
    setTimeout(() => setIsCopied(false), 2000);
  }

  function handleClose() {
    if (!isSubmitting) {
      onClose();
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isMatch) return;

    try {
      await deleteMutation.mutateAsync(campaign.campaignId);
      toast.success(`Hủy chiến dịch ${campaign.campaignId} thành công.`);
      onClose();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4 py-6 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        className="w-full max-w-lg overflow-hidden rounded-2xl border border-red-200 bg-white shadow-2xl dark:border-red-900/40 dark:bg-slate-900"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-red-100 bg-red-50/60 px-6 py-5 dark:border-red-950/40 dark:bg-red-950/20">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white">
                Hủy chiến dịch tương tác
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="rounded-lg p-2 text-slate-400 transition hover:bg-red-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            aria-label="Đóng modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="rounded-xl border border-red-200/60 bg-red-50/40 p-4 text-xs font-semibold leading-5 text-red-800 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300">
            ⚠️ <strong>Cảnh báo:</strong> Hành động hủy chiến dịch không thể hoàn tác!
          </div>

          <div className="mt-5 space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Mã Campaign ID cần hủy
            </label>
            <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 dark:border-slate-800 dark:bg-slate-800/60">
              <code className="select-all font-mono text-xs font-bold text-slate-800 dark:text-slate-200">
                {campaign.campaignId}
              </code>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleCopy}
                className="h-7 border border-slate-200 px-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                {isCopied ? <Check className="mr-1 h-3.5 w-3.5 text-emerald-500" /> : <Copy className="mr-1 h-3.5 w-3.5" />}
                {isCopied ? "Đã chép" : "Sao chép"}
              </Button>
            </div>

            <label className="block space-y-1.5 pt-2">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Nhập chính xác <span className="text-red-600 dark:text-red-400">Campaign ID</span> để xác nhận:
              </span>
              <input
                type="text"
                value={typedCampaignId}
                onChange={(e) => setTypedCampaignId(e.target.value)}
                placeholder="Nhập hoặc dán Campaign ID..."
                autoFocus
                className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3.5 font-mono text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-red-500 focus:ring-4 focus:ring-red-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:ring-red-950/50"
              />
            </label>

            {typedCampaignId.length > 0 && !isMatch && (
              <p className="text-xs font-medium text-red-500">
                ✖ Mã Campaign ID chưa chính xác.
              </p>
            )}
            {isMatch && (
              <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                ✓ Mã Campaign ID chính xác. Bạn có thể nhấn Xác nhận Hủy.
              </p>
            )}
          </div>

          <div className="mt-7 flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
              className="h-11 border-slate-200 bg-white px-5 font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              Hủy bỏ
            </Button>
            <Button
              type="submit"
              disabled={!isMatch || isSubmitting}
              className="h-11 bg-red-600 px-6 font-bold text-white shadow-md hover:bg-red-700 disabled:opacity-40"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang hủy...
                </>
              ) : (
                "Xác nhận Hủy Chiến Dịch"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
