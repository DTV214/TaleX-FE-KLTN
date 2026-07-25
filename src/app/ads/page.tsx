"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adsApi, AdSlot, AdvertiseProfile } from "@/features/ads/api/ads-api";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/shared/ui/dialog";

export default function AdsDashboardPage() {
  const queryClient = useQueryClient();
  const [topupAmount, setTopupAmount] = useState(10000);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [previewMedia, setPreviewMedia] = useState<{ url: string; type: string } | null>(null);
  const [mediaType, setMediaType] = useState<"IMAGE" | "VIDEO">("IMAGE");

  const { data: profile, isLoading } = useQuery({
    queryKey: ["ad-wallet-balance"],
    queryFn: adsApi.getWalletBalance,
  });

  const { data: slots } = useQuery({
    queryKey: ["ad-slots"],
    queryFn: adsApi.getAllSlots,
  });

  const { data: campaigns } = useQuery({
    queryKey: ["my-campaigns"],
    queryFn: adsApi.getMyCampaigns,
  });

  const topupMutation = useMutation({
    mutationFn: adsApi.topupWallet,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ad-wallet-balance"] });
      alert("Nạp tiền thành công!");
    },
  });

  const createCampaignMutation = useMutation({
    mutationFn: adsApi.createCampaign,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ad-wallet-balance"] });
      queryClient.invalidateQueries({ queryKey: ["my-campaigns"] });
      alert("Tạo chiến dịch thành công, đang chờ duyệt!");
    },
    onError: (err: any) => {
      alert("Lỗi: " + err.response?.data?.message || err.message);
    }
  });

  const handleCreateCampaign = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedFile) {
      toast.error("Vui lòng tải lên file hình ảnh hoặc video!");
      return;
    }
    
    // Capture formData before any async operation so e.currentTarget is not nullified
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

  if (isLoading) return <div className="p-10 text-white">Loading...</div>;

  return (
    <div className="mx-auto max-w-6xl p-6 text-white pb-24">
      <h1 className="text-3xl font-bold mb-8 text-[#D4AF37]">TaleX Ads Center</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Wallet Section */}
        <div className="bg-[#1f1f1f] p-6 rounded-2xl border border-white/10">
          <h2 className="text-xl font-bold mb-4">Ví Quảng Cáo</h2>
          <div className="text-4xl font-bold text-[#D4AF37] mb-6">
            {profile?.walletBalance?.toLocaleString()} VND
          </div>
          
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
                className="bg-[#D4AF37] text-black font-bold px-6 py-2 rounded-lg hover:bg-[#b5952f] disabled:opacity-50"
              >
                {topupMutation.isPending ? "Đang nạp..." : "Nạp"}
              </button>
            </div>
          </div>
        </div>

        {/* Create Campaign Section */}
        <div className="bg-[#1f1f1f] p-6 rounded-2xl border border-white/10">
          <h2 className="text-xl font-bold mb-4">Tạo Chiến Dịch Mới</h2>
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
                <label className="block text-sm mb-1 text-white/70">Loại Media (Tự động)</label>
                <select 
                  name="mediaType" 
                  value={mediaType}
                  disabled
                  className="w-full bg-black/50 border border-white/20 rounded-lg px-4 py-2 text-white/50 outline-none cursor-not-allowed"
                >
                  <option value="IMAGE">Hình ảnh (Banner)</option>
                  <option value="VIDEO">Video</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm mb-1 text-white/70">Tải lên Hình Ảnh / Video</label>
              <input 
                type="file" 
                accept="image/*,video/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setSelectedFile(file);
                    if (file.type.startsWith("video/")) {
                      setMediaType("VIDEO");
                    } else if (file.type.startsWith("image/")) {
                      setMediaType("IMAGE");
                    }
                  }
                }}
                className="w-full bg-black/50 border border-white/20 rounded-lg px-4 py-2 text-white outline-none file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#D4AF37] file:text-black hover:file:bg-[#b5952f]" 
              />
              {selectedFile && <p className="text-sm text-green-400 mt-2">Đã đính kèm file: {selectedFile.name}</p>}
            </div>

            <div>
              <label className="block text-sm mb-1 text-white/70">Link Đích đến khi Click (URL)</label>
              <input name="targetUrl" required className="w-full bg-black/50 border border-white/20 rounded-lg px-4 py-2 text-white outline-none" placeholder="https://..." />
            </div>

            <button 
              type="submit" 
              disabled={createCampaignMutation.isPending || isUploading || !selectedFile}
              className="w-full bg-[#D4AF37] text-black font-bold px-6 py-3 rounded-lg hover:bg-[#b5952f] disabled:opacity-50 mt-4"
            >
              {isUploading ? "Đang tải file lên..." : (createCampaignMutation.isPending ? "Đang tạo..." : "Gửi Yêu Cầu Duyệt")}
            </button>
          </form>
        </div>
      </div>
      
      {/* List Campaigns */}
      <div className="mt-8 bg-[#1f1f1f] p-6 rounded-2xl border border-white/10">
        <h2 className="text-xl font-bold mb-4">Lịch sử chiến dịch của bạn</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-white/50 text-sm">
                <th className="py-3 px-4">Tên chiến dịch</th>
                <th className="py-3 px-4">Trạng thái</th>
                <th className="py-3 px-4">Đã chạy (Views)</th>
                <th className="py-3 px-4">Mục tiêu (Views)</th>
                <th className="py-3 px-4">Tổng tiền (VND)</th>
                <th className="py-3 px-4">Media</th>
              </tr>
            </thead>
            <tbody>
              {(campaigns as any[])?.map((c) => (
                <tr key={c.campaignId} className="border-b border-white/5 hover:bg-white/5">
                  <td className="py-3 px-4">{c.name}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                      c.status === 'ACTIVE' ? 'bg-green-500/20 text-green-400' :
                      c.status === 'PENDING_REVIEW' ? 'bg-yellow-500/20 text-yellow-400' :
                      c.status === 'REJECTED' ? 'bg-red-500/20 text-red-400' :
                      'bg-gray-500/20 text-gray-400'
                    }`}>
                      {c.status}
                    </span>
                  </td>
                  <td className="py-3 px-4">{c.currentImpressions}</td>
                  <td className="py-3 px-4">{c.targetImpressions}</td>
                  <td className="py-3 px-4 text-[#D4AF37] font-semibold">{c.totalBudget?.toLocaleString()}</td>
                  <td className="py-3 px-4">
                    {c.creatives?.[0]?.mediaUrl ? (
                      <button 
                        onClick={() => setPreviewMedia({ url: c.creatives[0].mediaUrl, type: c.creatives[0].mediaType })} 
                        className="text-blue-400 hover:underline text-sm flex items-center gap-1"
                      >
                        Xem
                      </button>
                    ) : "-"}
                  </td>
                </tr>
              ))}
              {(!campaigns || campaigns.length === 0) && (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-white/50">Chưa có chiến dịch nào</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={!!previewMedia} onOpenChange={(open) => !open && setPreviewMedia(null)}>
        <DialogContent className="bg-[#1f1f1f] text-white border-white/10 sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Xem trước Media</DialogTitle>
          </DialogHeader>
          <div className="flex justify-center items-center mt-4 bg-black rounded-lg overflow-hidden min-h-[300px]">
            {previewMedia?.type === 'VIDEO' ? (
              <video src={previewMedia.url} controls className="max-w-full max-h-[70vh] w-auto h-auto" />
            ) : previewMedia ? (
              <img src={previewMedia.url} alt="Ad Preview" className="max-w-full max-h-[70vh] object-contain" />
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
