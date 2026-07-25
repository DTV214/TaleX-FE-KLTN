"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adsApi, AdSlot } from "@/features/ads/api/ads-api";
import { adminAdsApi, AdCampaignAdmin } from "@/features/admin/api/admin-ads-api";
import { Trash, Check, X, Eye, EyeOff, Edit, ToggleLeft, ToggleRight, PauseCircle, PlayCircle } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/shared/ui/dialog";

export default function AdminAdsPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"SLOTS" | "PENDING" | "ALL">("SLOTS");
  const [editingSlot, setEditingSlot] = useState<AdSlot | null>(null);
  const [previewMedia, setPreviewMedia] = useState<{ url: string; type: string } | null>(null);

  const { data: slots, isLoading: loadingSlots } = useQuery({
    queryKey: ["admin-ad-slots"],
    queryFn: adsApi.getAllSlots,
  });

  const { data: pendingCampaigns, isLoading: loadingPending } = useQuery({
    queryKey: ["admin-pending-campaigns"],
    queryFn: adminAdsApi.getPendingCampaigns,
  });

  const { data: allCampaigns, isLoading: loadingAll } = useQuery({
    queryKey: ["admin-all-campaigns"],
    queryFn: adminAdsApi.getAllCampaigns,
  });

  const createSlotMutation = useMutation({
    mutationFn: adminAdsApi.createSlot,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-ad-slots"] });
      toast.success("Tạo Slot thành công!");
    },
    onError: (err: any) => toast.error(err.response?.data?.message || err.message)
  });

  const deleteSlotMutation = useMutation({
    mutationFn: adminAdsApi.deleteSlot,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-ad-slots"] });
      toast.success("Đã xoá Slot!");
    },
    onError: (err: any) => toast.error(err.response?.data?.message || err.message)
  });

  const updateSlotMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<AdSlot> }) => adminAdsApi.updateSlot(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-ad-slots"] });
      setEditingSlot(null);
      toast.success("Cập nhật Slot thành công!");
    },
    onError: (err: any) => toast.error(err.response?.data?.message || err.message)
  });
  
  const patchSlotStatusMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => adminAdsApi.patchSlotStatus(id, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-ad-slots"] });
      toast.success("Đã thay đổi trạng thái!");
    },
    onError: (err: any) => toast.error(err.response?.data?.message || err.message)
  });

  const reviewCampaignMutation = useMutation({
    mutationFn: ({ id, status, note }: { id: string, status: "ACTIVE" | "REJECTED", note?: string }) => 
      adminAdsApi.reviewCampaign(id, status, note),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-pending-campaigns"] });
      queryClient.invalidateQueries({ queryKey: ["admin-all-campaigns"] });
      toast.success("Đã duyệt/Từ chối thành công!");
    },
    onError: (err: any) => toast.error(err.response?.data?.message || err.message)
  });

  const patchCampaignStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => adminAdsApi.patchCampaignStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-all-campaigns"] });
      toast.success("Đã thay đổi trạng thái chiến dịch!");
    },
    onError: (err: any) => toast.error(err.response?.data?.message || err.message)
  });

  const handleCreateOrUpdateSlot = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      codeName: formData.get("codeName") as string,
      displayName: formData.get("displayName") as string,
      type: formData.get("type") as "BANNER" | "VIDEO" | "POPUP",
      price: Number(formData.get("price")),
      totalViewOfPrice: Number(formData.get("totalViewOfPrice")),
      isActive: formData.get("isActive") === "true",
    };

    if (editingSlot) {
      updateSlotMutation.mutate({ id: editingSlot.slotId, data });
    } else {
      createSlotMutation.mutate(data);
    }
  };

  if (loadingSlots || loadingPending || loadingAll) return <div className="p-8">Loading...</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6 text-slate-800">Quản lý Hệ thống Quảng Cáo</h1>

      <div className="flex gap-4 border-b border-slate-200 mb-6">
        <button 
          onClick={() => setActiveTab("SLOTS")} 
          className={`pb-2 px-1 font-semibold ${activeTab === "SLOTS" ? "text-indigo-600 border-b-2 border-indigo-600" : "text-slate-500 hover:text-slate-700"}`}
        >
          Vị trí Quảng Cáo (Slots)
        </button>
        <button 
          onClick={() => setActiveTab("PENDING")} 
          className={`pb-2 px-1 font-semibold flex items-center gap-2 ${activeTab === "PENDING" ? "text-indigo-600 border-b-2 border-indigo-600" : "text-slate-500 hover:text-slate-700"}`}
        >
          Chờ Duyệt 
          {pendingCampaigns && pendingCampaigns.length > 0 && (
            <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full">{pendingCampaigns.length}</span>
          )}
        </button>
        <button 
          onClick={() => setActiveTab("ALL")} 
          className={`pb-2 px-1 font-semibold ${activeTab === "ALL" ? "text-indigo-600 border-b-2 border-indigo-600" : "text-slate-500 hover:text-slate-700"}`}
        >
          Tất cả Chiến Dịch
        </button>
      </div>

      <div className="space-y-6">
        
        {activeTab === "SLOTS" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <h2 className="text-lg font-bold mb-4">{editingSlot ? "Cập nhật Vị trí" : "Thêm Vị trí mới"}</h2>
              
              <form onSubmit={handleCreateOrUpdateSlot} className="mb-6 grid grid-cols-2 gap-4 text-slate-900" key={editingSlot ? editingSlot.slotId : "new"}>
                <div>
                  <label className="block text-sm font-semibold mb-1 text-slate-700">Mã vị trí (Code Name)</label>
                  <input name="codeName" defaultValue={editingSlot?.codeName} placeholder="VD: BANNER_HOME" required className="w-full border border-slate-300 bg-white rounded px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold mb-1 text-slate-700">Tên hiển thị</label>
                  <input name="displayName" defaultValue={editingSlot?.displayName} placeholder="VD: Banner Trang Chủ" required className="w-full border border-slate-300 bg-white rounded px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold mb-1 text-slate-700">Loại hiển thị (Type)</label>
                  <select name="type" defaultValue={editingSlot?.type} required className="w-full border border-slate-300 bg-white rounded px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    <option value="BANNER">BANNER (Hình ảnh)</option>
                    <option value="VIDEO">VIDEO_PREROLL (Đầu video)</option>
                    <option value="POPUP">POPUP (Cửa sổ bật lên)</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold mb-1 text-slate-700">Giá bán (VND)</label>
                  <input name="price" defaultValue={editingSlot?.price} type="number" placeholder="VD: 50000" required className="w-full border border-slate-300 bg-white rounded px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-1 text-slate-700">Số Views nhận được</label>
                  <input name="totalViewOfPrice" defaultValue={editingSlot?.totalViewOfPrice} type="number" placeholder="VD: 1000" required className="w-full border border-slate-300 bg-white rounded px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold mb-1 text-slate-700">Trạng thái (Status)</label>
                  <select name="isActive" defaultValue={editingSlot ? (editingSlot.isActive ? "true" : "false") : "true"} className="w-full border border-slate-300 bg-white rounded px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    <option value="true">Đang kích hoạt (Active)</option>
                    <option value="false">Tạm ẩn (Inactive)</option>
                  </select>
                </div>

                <div className="col-span-2 flex gap-3 mt-2">
                  <button type="submit" disabled={createSlotMutation.isPending || updateSlotMutation.isPending} className="flex-1 bg-indigo-600 text-white rounded px-4 py-2 font-medium hover:bg-indigo-700">
                    {createSlotMutation.isPending || updateSlotMutation.isPending ? "Đang lưu..." : (editingSlot ? "Lưu thay đổi" : "Tạo Slot")}
                  </button>
                  {editingSlot && (
                    <button type="button" onClick={() => setEditingSlot(null)} className="flex-1 bg-slate-200 text-slate-700 rounded px-4 py-2 font-medium hover:bg-slate-300">
                      Hủy
                    </button>
                  )}
                </div>
              </form>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 overflow-x-auto">
              <h2 className="text-lg font-bold mb-4">Danh sách Vị trí</h2>
              <table className="w-full text-left text-sm border-collapse text-slate-800 whitespace-nowrap">
                <thead>
                  <tr className="border-b bg-slate-50 text-slate-600">
                    <th className="p-3 font-semibold">Code / Tên</th>
                    <th className="p-3 font-semibold">Giá / Views</th>
                    <th className="p-3 font-semibold text-right">Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {slots?.map((slot: AdSlot) => (
                    <tr key={slot.slotId} className={`border-b hover:bg-slate-50 transition-colors ${!slot.isActive ? 'opacity-50' : ''}`}>
                      <td className="p-3">
                        <div className="font-bold text-slate-900">{slot.codeName}</div>
                        <div className="text-slate-500 text-xs">{slot.displayName}</div>
                      </td>
                      <td className="p-3 font-medium text-indigo-600">
                        {slot.price.toLocaleString()}đ / {slot.totalViewOfPrice}
                      </td>
                      <td className="p-3 flex gap-2 justify-end">
                        <button onClick={() => setEditingSlot(slot)} className="text-blue-500 hover:bg-blue-50 p-2 rounded transition-colors" title="Sửa">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => patchSlotStatusMutation.mutate({ id: slot.slotId, isActive: !slot.isActive })} 
                          className={`${slot.isActive ? 'text-amber-500 hover:bg-amber-50' : 'text-green-500 hover:bg-green-50'} p-2 rounded transition-colors`}
                          title={slot.isActive ? "Tắt (Ẩn)" : "Bật (Hiện)"}
                        >
                          {slot.isActive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                        <button onClick={() => deleteSlotMutation.mutate(slot.slotId)} className="text-red-500 hover:bg-red-50 p-2 rounded transition-colors" title="Xóa">
                          <Trash className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "PENDING" && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 max-w-4xl">
            <h2 className="text-lg font-bold mb-4">Duyệt Chiến Dịch Chờ</h2>
            
            <div className="space-y-4">
              {pendingCampaigns?.map((campaign: AdCampaignAdmin) => (
                <div key={campaign.campaignId} className="border border-slate-200 p-4 rounded-lg flex flex-col gap-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-slate-800 text-lg">{campaign.name}</h3>
                      <p className="text-sm text-slate-500">Mục tiêu: {campaign.targetImpressions} Views</p>
                      <p className="text-sm text-slate-500">Ngân sách: <span className="font-semibold text-indigo-600">{campaign.totalBudget?.toLocaleString()}đ</span></p>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => reviewCampaignMutation.mutate({ id: campaign.campaignId, status: "ACTIVE" })}
                        disabled={reviewCampaignMutation.isPending}
                        className="bg-green-100 text-green-700 px-4 py-2 rounded font-medium hover:bg-green-200 flex items-center gap-1"
                      >
                        <Check className="w-4 h-4" /> Duyệt
                      </button>
                      <button 
                        onClick={() => {
                          const note = prompt("Lý do từ chối (User sẽ được hoàn tiền):");
                          if (note) reviewCampaignMutation.mutate({ id: campaign.campaignId, status: "REJECTED", note });
                        }}
                        disabled={reviewCampaignMutation.isPending}
                        className="bg-red-100 text-red-700 px-4 py-2 rounded font-medium hover:bg-red-200 flex items-center gap-1"
                      >
                        <X className="w-4 h-4" /> Từ chối
                      </button>
                    </div>
                  </div>
                  {campaign.creatives && campaign.creatives.length > 0 && (
                    <div className="mt-2 bg-slate-50 p-3 rounded text-sm">
                      <p>
                        <strong>Media đính kèm:</strong>{" "}
                        <button 
                          onClick={() => setPreviewMedia({ url: campaign.creatives[0].mediaUrl, type: campaign.creatives[0].mediaType })} 
                          className="text-blue-600 hover:underline font-medium"
                        >
                          Xem thử bản xem trước ({campaign.creatives[0].mediaType})
                        </button>
                      </p>
                      <p><strong>Link đích:</strong> <a href={campaign.creatives[0].targetUrl} target="_blank" className="text-blue-600 hover:underline break-all">{campaign.creatives[0].targetUrl}</a></p>
                    </div>
                  )}
                </div>
              ))}

              {(!pendingCampaigns || pendingCampaigns.length === 0) && (
                <div className="text-center py-12 text-slate-400 bg-slate-50 rounded-lg">Không có chiến dịch nào đang chờ duyệt</div>
              )}
            </div>
          </div>
        )}

        {activeTab === "ALL" && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 overflow-x-auto">
            <h2 className="text-lg font-bold mb-4">Tất cả Chiến Dịch</h2>
            
            <table className="w-full text-left text-sm border-collapse text-slate-800 whitespace-nowrap">
              <thead>
                <tr className="border-b bg-slate-50 text-slate-600">
                  <th className="p-3 font-semibold">Tên Chiến dịch</th>
                  <th className="p-3 font-semibold">Ngân sách</th>
                  <th className="p-3 font-semibold">Trạng thái</th>
                  <th className="p-3 font-semibold text-right">Điều khiển</th>
                </tr>
              </thead>
              <tbody>
                {allCampaigns?.map((campaign: AdCampaignAdmin) => (
                  <tr key={campaign.campaignId} className="border-b hover:bg-slate-50 transition-colors">
                    <td className="p-3">
                      <div className="font-bold text-slate-900">{campaign.name}</div>
                      <div className="text-slate-500 text-xs">Mục tiêu: {campaign.targetImpressions} views</div>
                    </td>
                    <td className="p-3 font-medium text-indigo-600">
                      {campaign.totalBudget?.toLocaleString()}đ
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                        campaign.status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
                        campaign.status === 'PAUSED' ? 'bg-amber-100 text-amber-700' :
                        campaign.status === 'COMPLETED' ? 'bg-blue-100 text-blue-700' :
                        campaign.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {campaign.status}
                      </span>
                    </td>
                    <td className="p-3 flex justify-end gap-2">
                      <button 
                        onClick={() => setPreviewMedia(campaign.creatives && campaign.creatives.length > 0 ? { url: campaign.creatives[0].mediaUrl, type: campaign.creatives[0].mediaType } : null)} 
                        className="text-slate-500 hover:text-indigo-600 p-2 rounded transition-colors"
                        title="Xem Media"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                      
                      {(campaign.status === 'ACTIVE' || campaign.status === 'PAUSED') && (
                        <button
                          onClick={() => patchCampaignStatusMutation.mutate({ 
                            id: campaign.campaignId, 
                            status: campaign.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE' 
                          })}
                          disabled={patchCampaignStatusMutation.isPending}
                          className={`${campaign.status === 'ACTIVE' ? 'text-amber-500 hover:text-amber-600' : 'text-green-500 hover:text-green-600'} p-2 rounded transition-colors`}
                          title={campaign.status === 'ACTIVE' ? "Tạm Dừng Quảng Cáo" : "Tiếp Tục Quảng Cáo"}
                        >
                          {campaign.status === 'ACTIVE' ? <PauseCircle className="w-5 h-5" /> : <PlayCircle className="w-5 h-5" />}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {(!allCampaigns || allCampaigns.length === 0) && (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-slate-400">Không có dữ liệu</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

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
