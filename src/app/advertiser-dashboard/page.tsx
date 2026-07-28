"use client";

import { useSearchParams } from "next/navigation";
import { AdvertiserLayout } from "@/features/advertiser-dashboard/components/advertiser-layout";
import { AdAnalyticsChart } from "@/features/advertiser-dashboard/components/ad-analytics-chart";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adsApi, AdSlot } from "@/features/ads/api/ads-api";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useAuthStore } from "@/features/auth/store/auth.store";

export default function AdvertiserDashboardPage() {
  const searchParams = useSearchParams();
  const view = searchParams.get("view") || "dashboard";
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  if (!isAuthenticated) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#111113] text-white">
        Vui lòng đăng nhập để sử dụng tính năng này.
      </div>
    );
  }

  return (
    <AdvertiserLayout activeView={view}>
      {view === "dashboard" && <OverviewView />}
      {view === "campaigns" && <CampaignsView />}
      {view === "create" && <CreateCampaignView />}
      {view === "wallet" && <WalletView />}
      {view === "analytics" && <AnalyticsView />}
    </AdvertiserLayout>
  );
}

function OverviewView() {
  const { data: profile } = useQuery({ queryKey: ["ad-wallet-balance"], queryFn: adsApi.getWalletBalance });
  const { data: campaigns } = useQuery({ queryKey: ["my-campaigns"], queryFn: adsApi.getMyCampaigns });

  const activeCount = campaigns?.filter((c: any) => c.status === "ACTIVE").length || 0;
  
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white">Tổng quan Quảng Cáo</h2>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="rounded-xl border border-white/10 bg-[#1f1f1f] p-6">
          <p className="text-sm font-medium text-slate-400">Số dư ví Ads</p>
          <p className="mt-2 text-3xl font-bold text-[#D4AF37]">
            {profile?.walletBalance?.toLocaleString() || 0} đ
          </p>
        </div>
        <div className="rounded-xl border border-white/10 bg-[#1f1f1f] p-6">
          <p className="text-sm font-medium text-slate-400">Chiến dịch đang chạy</p>
          <p className="mt-2 text-3xl font-bold text-green-400">{activeCount}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-[#1f1f1f] p-6">
          <p className="text-sm font-medium text-slate-400">Tổng chiến dịch</p>
          <p className="mt-2 text-3xl font-bold text-white">{campaigns?.length || 0}</p>
        </div>
      </div>
    </div>
  );
}

function CampaignsView() {
  const { data: campaigns, isLoading } = useQuery({ queryKey: ["my-campaigns"], queryFn: adsApi.getMyCampaigns });

  if (isLoading) return <div className="flex h-32 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-[#D4AF37]" /></div>;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white">Chiến dịch của tôi</h2>
      <div className="rounded-xl border border-white/10 bg-[#1f1f1f] overflow-hidden">
        <table className="w-full text-left text-sm text-slate-300">
          <thead className="bg-white/5 text-xs font-semibold uppercase text-slate-400">
            <tr>
              <th className="px-4 py-3">Tên chiến dịch</th>
              <th className="px-4 py-3">Trạng thái</th>
              <th className="px-4 py-3">Vị trí</th>
              <th className="px-4 py-3">Tiến độ (Views)</th>
              <th className="px-4 py-3">Ngân sách</th>
            </tr>
          </thead>
          <tbody>
            {campaigns?.map((c: any) => (
              <tr key={c.campaignId} className="border-b border-white/5 hover:bg-white/5">
                <td className="px-4 py-3 font-medium text-white">{c.name}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-1 text-[10px] font-bold ${
                    c.status === "ACTIVE" ? "bg-green-500/20 text-green-400" :
                    c.status === "PENDING_REVIEW" ? "bg-yellow-500/20 text-yellow-400" :
                    c.status === "PAUSED" ? "bg-gray-500/20 text-gray-400" : "bg-red-500/20 text-red-400"
                  }`}>
                    {c.status}
                  </span>
                </td>
                <td className="px-4 py-3">{c.slotCodeName}</td>
                <td className="px-4 py-3">{c.currentImpressions} / {c.targetImpressions}</td>
                <td className="px-4 py-3 text-[#D4AF37]">{c.totalBudget.toLocaleString()} đ</td>
              </tr>
            ))}
            {(!campaigns || campaigns.length === 0) && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                  Bạn chưa có chiến dịch nào.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CreateCampaignView() {
  const queryClient = useQueryClient();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [mediaType, setMediaType] = useState<"IMAGE" | "VIDEO">("IMAGE");

  const { data: slots } = useQuery({ queryKey: ["ad-slots"], queryFn: adsApi.getAllSlots });

  const createCampaignMutation = useMutation({
    mutationFn: adsApi.createCampaign,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ad-wallet-balance"] });
      queryClient.invalidateQueries({ queryKey: ["my-campaigns"] });
      toast.success("Tạo chiến dịch thành công, đang chờ duyệt!");
      // Reset form logic would go here
    },
    onError: (err: any) => {
      toast.error("Lỗi: " + (err.response?.data?.message || err.message));
    }
  });

  const handleCreateCampaign = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedFile) {
      toast.error("Vui lòng tải lên file hình ảnh hoặc video!");
      return;
    }
    
    const formData = new FormData(e.currentTarget);
    setIsUploading(true);
    const toastId = toast.loading("Đang tải lên Media lên S3...");
    let uploadedUrl = "";
    
    try {
      uploadedUrl = await adsApi.uploadMedia(selectedFile);
      toast.success("Tải lên thành công, đang tạo chiến dịch...", { id: toastId });
    } catch (err: any) {
      toast.error("Lỗi tải lên: " + err.message, { id: toastId });
      setIsUploading(false);
      return;
    }

    createCampaignMutation.mutate({
      slotId: formData.get("slotId") as string,
      name: formData.get("name") as string,
      targetImpressions: Number(formData.get("targetImpressions")),
      mediaType: mediaType,
      mediaUrl: uploadedUrl,
      targetUrl: formData.get("targetUrl") as string,
    }, {
      onSettled: () => setIsUploading(false)
    });
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white">Tạo Chiến Dịch Mới</h2>
      <div className="rounded-xl border border-white/10 bg-[#1f1f1f] p-6 max-w-2xl">
        <form onSubmit={handleCreateCampaign} className="space-y-4">
          <div>
            <label className="block text-sm mb-1 text-white/70">Tên chiến dịch</label>
            <input name="name" required className="w-full bg-black/50 border border-white/20 rounded-lg px-4 py-2 text-white outline-none" />
          </div>
          
          <div>
            <label className="block text-sm mb-1 text-white/70">Vị trí Quảng cáo (Slot)</label>
            <select name="slotId" required className="w-full bg-black/50 border border-white/20 rounded-lg px-4 py-2 text-white outline-none">
              <option value="">Chọn vị trí...</option>
              {slots?.map((slot: AdSlot) => (
                <option key={slot.slotId} value={slot.slotId}>
                  {slot.displayName} - {slot.price.toLocaleString()}đ / {slot.totalViewOfPrice} Views
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm mb-1 text-white/70">Mục tiêu (Views)</label>
              <input name="targetImpressions" type="number" defaultValue={1000} required className="w-full bg-black/50 border border-white/20 rounded-lg px-4 py-2 text-white outline-none" />
            </div>
            <div>
              <label className="block text-sm mb-1 text-white/70">Loại Media</label>
              <select name="mediaType" value={mediaType} onChange={(e) => setMediaType(e.target.value as any)} className="w-full bg-black/50 border border-white/20 rounded-lg px-4 py-2 text-white outline-none">
                <option value="IMAGE">Hình ảnh (Banner)</option>
                <option value="VIDEO">Video</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm mb-1 text-white/70">Link đích (Target URL)</label>
            <input name="targetUrl" type="url" required placeholder="https://..." className="w-full bg-black/50 border border-white/20 rounded-lg px-4 py-2 text-white outline-none" />
          </div>

          <div>
            <label className="block text-sm mb-1 text-white/70">Tải lên File</label>
            <input type="file" accept={mediaType === "IMAGE" ? "image/*" : "video/*"} onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} required className="w-full text-sm text-slate-400 file:mr-4 file:rounded-lg file:border-0 file:bg-white/10 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-white/20" />
          </div>

          <button type="submit" disabled={isUploading || createCampaignMutation.isPending} className="mt-4 w-full rounded-lg bg-[#D4AF37] px-4 py-3 font-bold text-black transition-colors hover:bg-[#b5952f] disabled:opacity-50">
            {isUploading || createCampaignMutation.isPending ? "Đang xử lý..." : "Tạo Chiến Dịch"}
          </button>
        </form>
      </div>
    </div>
  );
}

function WalletView() {
  const queryClient = useQueryClient();
  const [topupAmount, setTopupAmount] = useState(10000);
  const { data: profile } = useQuery({ queryKey: ["ad-wallet-balance"], queryFn: adsApi.getWalletBalance });

  const topupMutation = useMutation({
    mutationFn: adsApi.topupWallet,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ad-wallet-balance"] });
      toast.success("Nạp tiền thành công!");
    },
  });

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white">Ví Quảng Cáo & Nạp Tiền</h2>
      <div className="rounded-xl border border-white/10 bg-[#1f1f1f] p-6 max-w-md">
        <p className="text-sm font-medium text-slate-400">Số dư hiện tại</p>
        <p className="mt-2 text-4xl font-bold text-[#D4AF37] mb-8">
          {profile?.walletBalance?.toLocaleString() || 0} VND
        </p>
        
        <div className="space-y-4">
          <h3 className="font-semibold text-white/70">Nạp Tiền (Mockup)</h3>
          <div className="flex gap-4">
            <input 
              type="number" 
              value={topupAmount}
              onChange={(e) => setTopupAmount(Number(e.target.value))}
              className="bg-black/50 border border-white/20 rounded-lg px-4 py-2 text-white outline-none w-full"
            />
            <button 
              onClick={() => topupMutation.mutate(topupAmount)}
              disabled={topupMutation.isPending}
              className="bg-white/10 text-white font-bold px-6 py-2 rounded-lg hover:bg-white/20 disabled:opacity-50"
            >
              {topupMutation.isPending ? "Đang nạp..." : "Nạp"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function AnalyticsView() {
  const { data: campaigns, isLoading } = useQuery({ queryKey: ["my-campaigns"], queryFn: adsApi.getMyCampaigns });
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>("");

  if (isLoading) return <div className="flex h-32 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-[#D4AF37]" /></div>;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white">Thống kê hiệu quả (Analytics)</h2>
      
      <div className="rounded-xl border border-white/10 bg-[#1f1f1f] p-6">
        <div className="mb-6 max-w-md">
          <label className="block text-sm font-medium text-slate-400 mb-2">Chọn chiến dịch để xem biểu đồ</label>
          <select 
            value={selectedCampaignId} 
            onChange={(e) => setSelectedCampaignId(e.target.value)}
            className="w-full rounded-lg border border-white/20 bg-black/50 px-4 py-2.5 text-sm text-white outline-none focus:border-[#D4AF37]"
          >
            <option value="" disabled>-- Vui lòng chọn chiến dịch --</option>
            {campaigns?.map((c: any) => (
              <option key={c.campaignId} value={c.campaignId}>
                {c.name} ({c.status})
              </option>
            ))}
          </select>
        </div>

        {selectedCampaignId ? (
          <AdAnalyticsChart campaignId={selectedCampaignId} />
        ) : (
          <div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-white/10 bg-white/5">
            <p className="text-slate-500">Chọn một chiến dịch ở trên để hiển thị biểu đồ</p>
          </div>
        )}
      </div>
    </div>
  );
}
