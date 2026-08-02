"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { AdvertiserLayout } from "@/features/advertiser-dashboard/components/advertiser-layout";
import { AdAnalyticsChart } from "@/features/advertiser-dashboard/components/ad-analytics-chart";
import { SidebarLabelPopover } from "@/features/advertiser-dashboard/components/sidebar-label-popover";
import { DateRangePicker } from "@/features/advertiser-dashboard/components/date-range-picker";
import { BreakdownPopover } from "@/features/advertiser-dashboard/components/breakdown-popover";
import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adsApi, AdSlot } from "@/features/ads/api/ads-api";
import { toast } from "sonner";
import { Loader2, Plus, Search, Calendar, ChevronDown, Columns, RefreshCw, MoreVertical, X, Check, Tag, Megaphone, PlusCircle, Coins, HelpCircle, BarChart2, Trash2 } from "lucide-react";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { useLabels, AdLabel } from "@/features/ads/hooks/use-labels";

export default function AdvertiserDashboardPage() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const searchParams = useSearchParams();
  const view = searchParams.get("view") || "dashboard";

  const { data: profile, isLoading } = useQuery({ 
    queryKey: ["ad-wallet-balance"], 
    queryFn: adsApi.getWalletBalance,
    enabled: isAuthenticated
  });

  if (!isAuthenticated) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#111113] text-white">
        Vui lòng đăng nhập để sử dụng tính năng này.
      </div>
    );
  }

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center bg-[#111113]"><Loader2 className="h-8 w-8 animate-spin text-[#D4AF37]" /></div>;
  }

  if (profile && !profile.isSetupCompleted) {
    return <SetupProfileView profile={profile} />;
  }

  const renderView = () => {
    switch (view) {
      case "dashboard": return <OverviewView profile={profile} />;
      case "campaigns": return <CampaignManagementView profile={profile} />;
      case "wallet": return <WalletView profile={profile} />;
      default: return <OverviewView profile={profile} />;
    }
  };

  return (
    <AdvertiserLayout activeView={view}>
      {renderView()}
    </AdvertiserLayout>
  );
}

function SetupProfileView({ profile }: { profile: any }) {
  const queryClient = useQueryClient();
  const setupMutation = useMutation({
    mutationFn: adsApi.setupProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ad-wallet-balance"] });
      toast.success("Thiết lập hồ sơ doanh nghiệp thành công!");
    },
    onError: (err: any) => {
      toast.error("Lỗi: " + (err.response?.data?.message || err.message));
    }
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setupMutation.mutate({
      companyName: formData.get("companyName") as string,
      phone: formData.get("phone") as string,
      website: formData.get("website") as string,
    });
  };

  return (
    <div className="flex min-h-screen bg-[#F8F8F8] text-[#161823]">
      <div className="mx-auto w-full max-w-4xl px-4 py-12">
        <h1 className="mb-2 text-3xl font-bold">Welcome to TaleX Ads Manager</h1>
        <p className="mb-8 text-sm text-[#757575]">
          Thiết lập thông tin Doanh nghiệp của bạn để bắt đầu tạo quảng cáo và theo dõi hiệu suất.
        </p>
        <div className="rounded-lg bg-white p-6 md:p-8 shadow-sm border border-slate-200">
          <form onSubmit={handleSubmit} className="space-y-5 max-w-lg">
            <div>
              <label className="mb-1 block text-sm font-medium">Tên Doanh Nghiệp / Thương Hiệu *</label>
              <input name="companyName" required className="w-full rounded-md border border-slate-300 px-4 py-2.5 outline-none focus:border-teal-500" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Số điện thoại liên hệ *</label>
              <input name="phone" required className="w-full rounded-md border border-slate-300 px-4 py-2.5 outline-none focus:border-teal-500" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Website (Tùy chọn)</label>
              <input name="website" type="url" className="w-full rounded-md border border-slate-300 px-4 py-2.5 outline-none focus:border-teal-500" />
            </div>
            <div className="pt-6">
              <button type="submit" disabled={setupMutation.isPending} className="rounded-md bg-teal-500 px-8 py-2.5 font-bold text-white hover:bg-teal-600">
                {setupMutation.isPending ? "Processing..." : "Xác nhận"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function CampaignManagementView({ profile }: { profile: any }) {
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const [isCreating, setIsCreating] = useState(false);
  const [isTopupOpen, setIsTopupOpen] = useState(false);
  const { data: campaigns, isLoading } = useQuery({ queryKey: ["my-campaigns"], queryFn: adsApi.getMyCampaigns });
  const [selectedCampaignIds, setSelectedCampaignIds] = useState<string[]>([]);

  const handleSelectCampaign = (id: string) => {
    setSelectedCampaignIds(prev => 
      prev.includes(id) ? prev.filter(cId => cId !== id) : [...prev, id]
    );
  };

  const toggleMutation = useMutation({
    mutationFn: adsApi.toggleCampaign,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-campaigns"] });
      toast.success("Campaign status updated!");
    },
    onError: (err: any) => toast.error(err.response?.data?.message || err.message)
  });

  const cancelMutation = useMutation({
    mutationFn: adsApi.cancelCampaign,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-campaigns"] });
      queryClient.invalidateQueries({ queryKey: ["ad-wallet-balance"] });
      toast.success("Campaign cancelled and refunded!");
    },
    onError: (err: any) => toast.error(err.response?.data?.message || err.message)
  });

  const [activeReportCampaignId, setActiveReportCampaignId] = useState<string | null>(null);
  const [scheduleCampaign, setScheduleCampaign] = useState<any>(null);
  const [topupCampaign, setTopupCampaign] = useState<any>(null);
  const { labels } = useLabels();
  const selectedLabel = searchParams.get("labelId");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredCampaigns = campaigns?.filter((c: any) => {
    if (selectedLabel && (!c.labels || !c.labels.includes(selectedLabel))) return false;
    if (searchQuery && (!c.name || !c.name.toLowerCase().includes(searchQuery.toLowerCase()))) return false;
    return true;
  });

  if (isLoading) return <div className="flex h-32 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-teal-500" /></div>;

  return (
    <div className="h-full flex flex-col bg-white border border-slate-200 rounded-sm shadow-sm animate-in fade-in slide-in-from-bottom-4 relative">
      
      {/* Top Header Action Bar */}
      <div className="flex items-center gap-4 p-3 border-b border-slate-200 bg-[#F4F5F6]">
        <button 
          onClick={() => setIsCreating(true)}
          className="flex-shrink-0 flex items-center gap-1.5 bg-[#00D6BA] hover:bg-[#00BFA5] text-white px-4 py-1.5 rounded-sm font-medium transition-colors"
        >
          <Plus className="h-4 w-4" />
          Create
        </button>
        
        <div className="flex-1 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-400" />
          </div>
          <input 
            type="text" 
            placeholder="Search & filter (/)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-4 py-1.5 w-full text-sm border border-slate-300 rounded-sm outline-none focus:border-teal-500 bg-white"
          />
        </div>
        
        <div className="flex items-center gap-3 flex-shrink-0">
          <button 
            onClick={() => setIsTopupOpen(true)}
            className="flex items-center gap-2 text-sm font-medium text-teal-600 hover:bg-teal-50 px-3 py-1.5 rounded-sm transition-colors border border-teal-200 bg-white"
          >
            Balance: {profile?.walletBalance?.toLocaleString() || 0} VND
          </button>

          <DateRangePicker />
          
          <BreakdownPopover />
          
          <button onClick={() => queryClient.invalidateQueries({queryKey: ["my-campaigns"]})} className="p-1.5 border border-slate-300 rounded-sm bg-white hover:bg-slate-50 transition-colors">
            <RefreshCw className="h-4 w-4 text-slate-600" />
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Inner Sidebar */}
        <aside className="hidden w-[220px] flex-col border-r border-slate-200 bg-white lg:flex z-0">
          <div className="flex-1 overflow-y-auto">
            <nav className="flex flex-col py-4">
              <Link href="/advertiser-dashboard?view=campaigns" className={`group flex items-center justify-between px-6 py-2.5 ${!selectedLabel ? 'bg-teal-50 text-teal-600 border-r-2 border-teal-500' : 'text-[#757575] hover:bg-slate-50'}`}>
                <div className="flex items-center gap-3">
                  <Megaphone className={`h-5 w-5 ${!selectedLabel ? 'text-teal-500' : ''}`} />
                  <span className="text-sm font-medium">All Campaigns</span>
                </div>
                <PlusCircle className={`h-4 w-4 ${!selectedLabel ? 'text-teal-500' : 'text-transparent'}`} />
              </Link>
              
              {labels.map(l => (
                <Link 
                  key={l.labelId}
                  href={`/advertiser-dashboard?view=campaigns&labelId=${l.labelId}`} 
                  className={`flex items-center px-6 py-2.5 cursor-pointer ${selectedLabel === l.labelId ? 'bg-teal-50 text-teal-600 border-r-2 border-teal-500' : 'text-[#757575] hover:bg-slate-50'}`}
                >
                  <div className="flex items-center gap-3">
                    <Tag className="h-4 w-4" style={{ color: l.color }} />
                    <span className="text-sm font-medium">{l.name}</span>
                  </div>
                </Link>
              ))}
              
              <div className="mt-4 pt-4 mb-2 px-6 border-t border-slate-100">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Management</span>
              </div>
              
              <div className="flex items-center justify-between px-6 py-2.5 text-[#757575] hover:bg-slate-50 cursor-pointer">
                <span className="text-sm font-medium">Bulk export/import</span>
                <span className="text-xs">›</span>
              </div>
              
              <SidebarLabelPopover />

              <div 
                className="flex items-center justify-between px-6 py-2.5 text-[#757575] hover:bg-slate-50 cursor-pointer"
                onClick={() => {
                  if (selectedCampaignIds.length > 0) {
                    setActiveReportCampaignId(selectedCampaignIds[0]);
                  } else {
                    toast.error("Vui lòng tick chọn ít nhất 1 chiến dịch ở bảng bên phải để xem báo cáo");
                  }
                }}
              >
                <span className="text-sm font-medium">View report</span>
                <span className="text-xs">›</span>
              </div>

              {selectedCampaignIds.length > 0 && (
                <>
                  <div className="my-1 border-t border-slate-100 mx-4" />
                  <div 
                  className="flex items-center justify-start gap-3 px-6 py-2.5 text-red-500 hover:bg-red-50 cursor-pointer transition-colors"
                  onClick={() => {
                    const cId = selectedCampaignIds[0];
                    const c = campaigns?.find((cmp: any) => cmp.campaignId === cId);
                    if (c && (c.status === 'ACTIVE' || c.status === 'PAUSED' || c.status === 'PENDING_REVIEW')) {
                      if (confirm(`Are you sure you want to cancel this campaign? Any unspent balance (≈ ${((c.totalBudget - (c.campaignBalance || 0))).toLocaleString()} VND) will be refunded to your Master Wallet.`)) {
                        cancelMutation.mutate(cId);
                        setSelectedCampaignIds(prev => prev.filter(id => id !== cId));
                      }
                    } else {
                      toast.error("Chiến dịch này đã hoàn thành hoặc đã hủy, không thể thao tác.");
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="text-sm font-medium">Cancel campaign</span>
                </div>
                </>
              )}
            </nav>
          </div>
        </aside>

        {/* Main Content Area (Table + Footer) */}
        <div className="flex-1 flex flex-col min-w-0 bg-white">
          <div className="flex-1 overflow-auto">
            <table className="w-full text-left text-xs whitespace-nowrap">
            <thead className="sticky top-0 bg-[#F4F5F6] text-[#757575] font-semibold z-10 shadow-sm border-b border-slate-200">
            <tr>
              <th className="px-4 py-2 border-r border-slate-200 w-10 text-center"><input type="checkbox" className="rounded-sm" /></th>
              <th className="px-4 py-2 border-r border-slate-200">On/off</th>
              <th className="px-4 py-2 border-r border-slate-200">Name</th>
              <th className="px-4 py-2 border-r border-slate-200">Status</th>
              <th className="px-4 py-2 border-r border-slate-200 text-right">Start Date</th>
              <th className="px-4 py-2 border-r border-slate-200 text-right">End Date</th>
              <th className="px-4 py-2 border-r border-slate-200 text-right">
                <div className="flex items-center justify-end gap-1 relative group cursor-help">
                  Campaign Budget
                  <HelpCircle className="h-3 w-3 text-slate-400" />
                  <div className="absolute top-full right-0 mt-1 hidden group-hover:block w-48 p-2 bg-slate-800 text-white font-normal text-xs rounded shadow-lg z-50 text-left whitespace-normal">
                    Tổng ngân sách tối đa được phép chi tiêu cho chiến dịch này.
                  </div>
                </div>
              </th>
              <th className="px-4 py-2 border-r border-slate-200 text-right">
                <div className="flex items-center justify-end gap-1 relative group cursor-help">
                  Spend
                  <HelpCircle className="h-3 w-3 text-slate-400" />
                  <div className="absolute top-full right-0 mt-1 hidden group-hover:block w-48 p-2 bg-slate-800 text-white font-normal text-xs rounded shadow-lg z-50 text-left whitespace-normal">
                    Tổng số tiền đã chi tiêu thực tế tính đến thời điểm hiện tại.
                  </div>
                </div>
              </th>
              <th className="px-4 py-2 border-r border-slate-200 text-right">
                <div className="flex items-center justify-end gap-1 relative group cursor-help">
                  CPM
                  <HelpCircle className="h-3 w-3 text-slate-400" />
                  <div className="absolute top-full right-0 mt-1 hidden group-hover:block w-48 p-2 bg-slate-800 text-white font-normal text-xs rounded shadow-lg z-50 text-left whitespace-normal">
                    Chi phí trung bình ước tính mà bạn trả cho mỗi 1.000 lượt hiển thị quảng cáo.
                  </div>
                </div>
              </th>
              <th className="px-4 py-2 border-r border-slate-200 text-right">
                <div className="flex items-center justify-end gap-1 relative group cursor-help">
                  Cost per result
                  <HelpCircle className="h-3 w-3 text-slate-400" />
                  <div className="absolute top-full right-0 mt-1 hidden group-hover:block w-48 p-2 bg-slate-800 text-white font-normal text-xs rounded shadow-lg z-50 text-left whitespace-normal">
                    Chi phí trung bình để thu về một kết quả (ví dụ: một lượt click).
                  </div>
                </div>
              </th>
              <th className="px-4 py-2 border-r border-slate-200 text-right">
                <div className="flex items-center justify-end gap-1 relative group cursor-help">
                  6-second focused views
                  <HelpCircle className="h-3 w-3 text-slate-400" />
                  <div className="absolute top-full right-0 mt-1 hidden group-hover:block w-56 p-2 bg-slate-800 text-white font-normal text-xs rounded shadow-lg z-50 text-left whitespace-normal">
                    Số lần người dùng nán lại xem quảng cáo của bạn liên tục trong ít nhất 6 giây.
                  </div>
                </div>
              </th>
              <th className="px-4 py-2 border-r border-slate-200 text-right">
                <div className="flex items-center justify-end gap-1 relative group cursor-help">
                  Result rate
                  <HelpCircle className="h-3 w-3 text-slate-400" />
                  <div className="absolute top-full right-0 mt-1 hidden group-hover:block w-56 p-2 bg-slate-800 text-white font-normal text-xs rounded shadow-lg z-50 text-left whitespace-normal">
                    Tỉ lệ phần trăm người dùng thực hiện hành động (click) sau khi nhìn thấy quảng cáo.
                  </div>
                </div>
              </th>
              <th className="px-4 py-2 border-r border-slate-200 text-right">
                <div className="flex items-center justify-end gap-1 relative group cursor-help">
                  6-second focused views (paid views)
                  <HelpCircle className="h-3 w-3 text-slate-400" />
                  <div className="absolute top-full right-0 mt-1 hidden group-hover:block w-56 p-2 bg-slate-800 text-white font-normal text-xs rounded shadow-lg z-50 text-left whitespace-normal">
                    Số lượt xem 6 giây mà bạn đã trả phí để có được.
                  </div>
                </div>
              </th>
              <th className="px-4 py-2 border-r border-slate-200 text-right">
                <div className="flex items-center justify-end gap-1 relative group cursor-help">
                  Focused view 6-second view rate (impression)
                  <HelpCircle className="h-3 w-3 text-slate-400" />
                  <div className="absolute top-full right-0 mt-1 hidden group-hover:block w-56 p-2 bg-slate-800 text-white font-normal text-xs rounded shadow-lg z-50 text-left whitespace-normal">
                    Tỉ lệ người dùng xem quảng cáo ít nhất 6 giây trên tổng số lần hiển thị.
                  </div>
                </div>
              </th>
              <th className="px-4 py-2 border-r border-slate-200 text-right">
                <div className="flex items-center justify-end gap-1 relative group cursor-help">
                  Target Views
                  <HelpCircle className="h-3 w-3 text-slate-400" />
                  <div className="absolute top-full right-0 mt-1 hidden group-hover:block w-48 p-2 bg-slate-800 text-white font-normal text-xs rounded shadow-lg z-50 text-left whitespace-normal">
                    Mục tiêu số lượt hiển thị mà chiến dịch cần đạt được.
                  </div>
                </div>
              </th>
              <th className="px-4 py-2 border-r border-slate-200 text-right">
                <div className="flex items-center justify-end gap-1 relative group cursor-help">
                  Impressions
                  <HelpCircle className="h-3 w-3 text-slate-400" />
                  <div className="absolute top-full right-0 mt-1 hidden group-hover:block w-48 p-2 bg-slate-800 text-white font-normal text-xs rounded shadow-lg z-50 text-left whitespace-normal">
                    Tổng số lần quảng cáo của bạn đã được hiển thị trên màn hình người dùng.
                  </div>
                </div>
              </th>
              <th className="px-4 py-2 text-right">
                <div className="flex items-center justify-end gap-1 relative group cursor-help">
                  Clicks
                  <HelpCircle className="h-3 w-3 text-slate-400" />
                  <div className="absolute top-full right-0 mt-1 hidden group-hover:block w-48 p-2 bg-slate-800 text-white font-normal text-xs rounded shadow-lg z-50 text-left whitespace-normal">
                    Tổng số lần người dùng đã bấm vào quảng cáo của bạn.
                  </div>
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {!filteredCampaigns || filteredCampaigns.length === 0 ? (
              <tr>
                <td colSpan={17} className="px-4 py-32 text-center text-[#757575]">
                  No data to display. Please create a campaign.
                </td>
              </tr>
            ) : (
              filteredCampaigns.map((c: any) => (
                <tr key={c.campaignId} className="border-b border-slate-100 hover:bg-slate-50 group">
                  <td className="px-4 py-3 border-r border-slate-100 text-center">
                    <input 
                      type="checkbox" 
                      className="rounded-sm cursor-pointer w-4 h-4 text-teal-500 focus:ring-teal-500" 
                      checked={selectedCampaignIds.includes(c.campaignId)}
                      onChange={() => handleSelectCampaign(c.campaignId)}
                    />
                  </td>
                  <td className="px-4 py-3 border-r border-slate-100">
                    <div 
                      onClick={() => {
                        if (c.status === 'ACTIVE' || c.status === 'PAUSED') toggleMutation.mutate(c.campaignId);
                      }}
                      className={`w-8 h-4 rounded-full flex items-center p-0.5 ${(c.status === 'ACTIVE' || c.status === 'PAUSED') ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'} ${c.status === 'ACTIVE' ? 'bg-[#00D6BA]' : 'bg-slate-300'}`}
                    >
                      <div className={`w-3 h-3 rounded-full bg-white transition-transform ${c.status === 'ACTIVE' ? 'translate-x-4' : 'translate-x-0'}`}></div>
                    </div>
                  </td>
                  <td className="px-4 py-3 border-r border-slate-100 min-w-[250px] relative align-top">
                    <div className="font-medium text-[#161823] flex items-start justify-between gap-2">
                      <span className="pr-20">{c.name}</span>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col items-end gap-1 opacity-0 group-hover:opacity-100 bg-slate-50 pl-4 py-1 z-10">
                        <button onClick={() => setActiveReportCampaignId(c.campaignId)} className="text-teal-600 hover:underline text-xs font-medium">View Report</button>
                        {(c.status === 'PAUSED' || c.status === 'PENDING_REVIEW') && (
                          <button 
                            onClick={() => setScheduleCampaign(c)} 
                            className="text-blue-500 hover:underline text-xs font-medium"
                          >
                            Edit Schedule
                          </button>
                        )}
                        {(c.status === 'ACTIVE' || c.status === 'PAUSED' || c.status === 'PENDING_REVIEW') && (
                          <button 
                            onClick={() => setTopupCampaign(c)} 
                            className="text-yellow-600 hover:underline text-xs font-medium"
                          >
                            Top-up Budget
                          </button>
                        )}
                      </div>
                    </div>
                    <LabelManager campaign={c} />
                  </td>
                  <td className="px-4 py-3 border-r border-slate-100">
                    <div className="flex items-center gap-1.5">
                      <div className={`w-2 h-2 rounded-full ${c.status === 'ACTIVE' ? 'bg-green-500' : c.status === 'PENDING_REVIEW' ? 'bg-yellow-400' : 'bg-slate-300'}`}></div>
                      <span className="text-[#161823]">{c.status === 'PENDING_REVIEW' ? 'Not Delivering' : c.status}</span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">Last edit: {new Date(c.createdAt).toLocaleDateString()}</div>
                  </td>
                  <td className="px-4 py-3 border-r border-slate-100 text-right">{c.startDate ? new Date(c.startDate).toLocaleDateString() : '-'}</td>
                  <td className="px-4 py-3 border-r border-slate-100 text-right">{c.endDate ? new Date(c.endDate).toLocaleDateString() : '-'}</td>
                  <td className="px-4 py-3 border-r border-slate-100 text-right font-medium">
                    {c.totalBudget.toLocaleString()} VND
                  </td>
                  <td className="px-4 py-3 border-r border-slate-100 text-right">
                    {(c.totalBudget - (c.campaignBalance || 0)).toLocaleString()} VND
                  </td>
                  <td className="px-4 py-3 border-r border-slate-100 text-right">{c.lockedCpm ? c.lockedCpm.toLocaleString() + ' VND' : '-'}</td>
                  <td className="px-4 py-3 border-r border-slate-100 text-right">
                    {c.currentClicks && c.currentClicks > 0 
                      ? Math.round((c.totalBudget - (c.campaignBalance || 0)) / c.currentClicks).toLocaleString() + ' VND' 
                      : '-'}
                  </td>
                  <td className="px-4 py-3 border-r border-slate-100 text-right">{c.focusedViews6s || 0}</td>
                  <td className="px-4 py-3 border-r border-slate-100 text-right">
                    {c.currentImpressions && c.currentImpressions > 0 
                      ? ((c.currentClicks / c.currentImpressions) * 100).toFixed(2) + '%' 
                      : '-'}
                  </td>
                  <td className="px-4 py-3 border-r border-slate-100 text-right">{c.paidFocusedViews6s || 0}</td>
                  <td className="px-4 py-3 border-r border-slate-100 text-right">
                    {c.currentImpressions && c.currentImpressions > 0 
                      ? (((c.focusedViews6s || 0) / c.currentImpressions) * 100).toFixed(2) + '%' 
                      : '-'}
                  </td>
                  <td className="px-4 py-3 border-r border-slate-100 text-right">{c.targetImpressions}</td>
                  <td className="px-4 py-3 border-r border-slate-100 text-right">{c.currentImpressions}</td>
                  <td className="px-4 py-3 text-right">{c.currentClicks}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer / Pagination */}
      <div className="flex items-center justify-between p-3 border-t border-slate-200 bg-white text-xs text-[#757575]">
        <div>Total of {filteredCampaigns?.length || 0} campaigns</div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <span>&lt;</span>
            <span>&gt;</span>
          </div>
          <div>200/page</div>
        </div>
      </div>
    </div>
  </div>

      {/* Slide-over Create Campaign */}
      {isCreating && (
        <CreateCampaignPanel onClose={() => setIsCreating(false)} />
      )}

      {/* Slide-over Report */}
      {activeReportCampaignId && typeof document !== 'undefined' && createPortal(
        <CustomerReportView campaignId={activeReportCampaignId} onClose={() => setActiveReportCampaignId(null)} />,
        document.body
      )}

      {/* Modals */}
      {scheduleCampaign && (
        <ScheduleUpdateModal campaign={scheduleCampaign} onClose={() => setScheduleCampaign(null)} />
      )}
      {topupCampaign && (
        <CampaignTopupModal campaign={topupCampaign} onClose={() => setTopupCampaign(null)} />
      )}
    </div>
  );
}

function LabelManager({ campaign }: { campaign: any }) {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const { labels } = useLabels();
  const [search, setSearch] = useState("");
  
  const updateMutation = useMutation({
    mutationFn: (labels: string[]) => adsApi.updateCampaignLabels(campaign.campaignId, labels),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-campaigns"] });
      setIsOpen(false);
      setSearch("");
    }
  });

  const parsedLabels: AdLabel[] = (campaign.labels || [])
    .map((labelId: string) => labels.find(l => l.labelId === labelId))
    .filter(Boolean) as AdLabel[];

  const availableLabels = labels.filter((l) => 
    l.name.toLowerCase().includes(search.toLowerCase()) && 
    !parsedLabels.find((pl) => pl.labelId === l.labelId)
  );

  const toggleLabel = (label: AdLabel) => {
    const currentLabels = campaign.labels || [];
    if (!currentLabels.includes(label.labelId)) {
      updateMutation.mutate([...currentLabels, label.labelId]);
    }
  };

  const removeLabel = (labelToRemove: AdLabel) => {
    const currentLabels = campaign.labels || [];
    updateMutation.mutate(currentLabels.filter((id: string) => id !== labelToRemove.labelId));
  };

  return (
    <div className="mt-2 flex flex-wrap items-center gap-1.5 relative pr-24">
      {parsedLabels.map((label: AdLabel, idx: number) => (
        <span 
          key={idx} 
          className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-sm border"
          style={{ backgroundColor: label.color + '20', color: label.color, borderColor: label.color + '40' }}
        >
          <Tag className="h-2.5 w-2.5" />
          {label.name}
          <button onClick={() => removeLabel(label)} className="opacity-70 hover:opacity-100"><X className="h-3 w-3" /></button>
        </span>
      ))}
      <div className="relative">
        <button 
          onClick={() => setIsOpen(!isOpen)} 
          className="inline-flex items-center justify-center w-5 h-5 rounded-sm border border-dashed border-slate-400 text-slate-500 hover:text-teal-600 hover:border-teal-500 transition-colors"
        >
          <Plus className="h-3 w-3" />
        </button>
        
        {isOpen && (
          <div className="absolute left-0 top-full mt-1 w-64 bg-white shadow-xl rounded-md border border-slate-200 z-[100] cursor-default" onClick={(e) => e.stopPropagation()}>
            <div className="p-2 border-b border-slate-100 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search to assign label..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-7 pr-3 py-1.5 border border-slate-300 rounded-sm text-xs outline-none focus:border-teal-500"
              />
            </div>
            <div className="max-h-48 overflow-y-auto p-1">
              {availableLabels.length === 0 ? (
                <div className="p-3 text-center text-xs text-slate-400">
                  {search ? "No matches found." : "No available labels. Create one in sidebar."}
                </div>
              ) : (
                availableLabels.map((l) => (
                  <div 
                    key={l.labelId} 
                    onClick={() => toggleLabel(l)}
                    className="flex items-center gap-2 p-2 hover:bg-slate-50 rounded-sm cursor-pointer"
                  >
                    <Tag className="h-3.5 w-3.5" style={{ color: l.color }} />
                    <span className="text-xs font-medium">{l.name}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ScheduleUpdateModal({ campaign, onClose }: { campaign: any, onClose: () => void }) {
  const queryClient = useQueryClient();
  const [startDate, setStartDate] = useState(campaign.startDate ? new Date(campaign.startDate).toISOString().slice(0, 16) : "");
  const [endDate, setEndDate] = useState(campaign.endDate ? new Date(campaign.endDate).toISOString().slice(0, 16) : "");

  const updateMutation = useMutation({
    mutationFn: (data: { startDate?: string, endDate?: string }) => adsApi.updateCampaignSchedule(campaign.campaignId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-campaigns"] });
      toast.success("Campaign schedule updated successfully!");
      onClose();
    },
    onError: (err: any) => toast.error("Error: " + (err.response?.data?.message || err.message))
  });

  const handleSubmit = () => {
    if (startDate && endDate && new Date(endDate) <= new Date(startDate)) {
      return toast.error("End date must be after start date");
    }
    updateMutation.mutate({
      startDate: startDate ? new Date(startDate).toISOString() : undefined,
      endDate: endDate ? new Date(endDate).toISOString() : undefined,
    });
  };

  return (
    <div className="absolute inset-0 bg-black/50 z-[100] flex items-center justify-center animate-in fade-in">
      <div className="bg-white rounded-md w-full max-w-md shadow-xl overflow-hidden animate-in zoom-in-95">
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <h3 className="font-bold">Update Campaign Schedule</h3>
          <button onClick={onClose}><X className="h-5 w-5 text-slate-400 hover:text-black" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="bg-slate-50 p-4 rounded-sm border border-slate-200 mb-4">
            <div className="font-medium">{campaign.name}</div>
            <div className="text-xs text-slate-500">Status: {campaign.status}</div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Start Date (Optional)</label>
            <input 
              type="datetime-local" 
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full border border-slate-300 rounded-sm px-3 py-2 outline-none focus:border-teal-500 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">End Date (Optional)</label>
            <input 
              type="datetime-local" 
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full border border-slate-300 rounded-sm px-3 py-2 outline-none focus:border-teal-500 text-sm"
            />
          </div>
          <div className="pt-2">
            <button 
              onClick={handleSubmit}
              disabled={updateMutation.isPending}
              className="w-full py-2.5 bg-[#00D6BA] text-white font-bold rounded-sm hover:bg-[#00BFA5] transition-colors disabled:opacity-50"
            >
              {updateMutation.isPending ? "Updating..." : "Save Schedule"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CampaignTopupModal({ campaign, onClose }: { campaign: any, onClose: () => void }) {
  const queryClient = useQueryClient();
  const [amount, setAmount] = useState<number>(100000);

  const topupMutation = useMutation({
    mutationFn: (topupAmount: number) => adsApi.topupCampaign(campaign.campaignId, topupAmount),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-campaigns"] });
      queryClient.invalidateQueries({ queryKey: ["ad-wallet-balance"] });
      toast.success("Campaign topped up successfully!");
      onClose();
    },
    onError: (err: any) => toast.error("Error: " + (err.response?.data?.message || err.message))
  });

  const handleSubmit = () => {
    if (amount < 10000) {
      return toast.error("Minimum top-up amount is 10,000 VND");
    }
    topupMutation.mutate(amount);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-md shadow-lg w-[400px] overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
          <h3 className="font-bold text-[#161823]">Top-up Campaign Budget</h3>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-100">
            <X className="h-4 w-4 text-slate-500" />
          </button>
        </div>
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold mb-1">Campaign: {campaign.name}</label>
            <p className="text-xs text-slate-500">Current Balance: {campaign.campaignBalance?.toLocaleString()} VND</p>
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1">Top-up Amount (VND)</label>
            <input 
              type="number" 
              value={amount} 
              onChange={(e) => setAmount(Number(e.target.value))}
              className="w-full border border-slate-300 rounded-sm px-3 py-2 text-sm outline-none focus:border-teal-500" 
            />
          </div>
        </div>
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-1.5 text-sm font-medium rounded-sm border border-slate-300 bg-white hover:bg-slate-50 transition-colors">
            Cancel
          </button>
          <button 
            onClick={handleSubmit} 
            disabled={topupMutation.isPending}
            className="px-4 py-1.5 text-sm font-medium rounded-sm bg-teal-500 text-white hover:bg-teal-600 transition-colors disabled:opacity-70 flex items-center gap-2"
          >
            {topupMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Confirm Top-up
          </button>
        </div>
      </div>
    </div>
  );
}

function CreateCampaignPanel({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isScheduled, setIsScheduled] = useState(false);

  const [formData, setFormData] = useState({
    slotId: "",
    name: "",
    targetImpressions: 1000,
    campaignBudget: 100000,
    mediaType: "IMAGE" as "IMAGE" | "VIDEO",
    targetUrl: "",
    labels: [] as string[],
    startDate: "",
    endDate: ""
  });

  const { data: profile } = useQuery({ queryKey: ["ad-wallet-balance"], queryFn: adsApi.getWalletBalance });
  const { data: slots } = useQuery({ queryKey: ["ad-slots"], queryFn: adsApi.getAllSlots });
  const { data: labelsData } = useQuery({ queryKey: ["ad-labels"], queryFn: adsApi.getLabels });

  const createCampaignMutation = useMutation({
    mutationFn: adsApi.createCampaign,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ad-wallet-balance"] });
      queryClient.invalidateQueries({ queryKey: ["my-campaigns"] });
      toast.success("Campaign created successfully!");
      onClose();
    },
    onError: (err: any) => {
      toast.error("Error: " + (err.response?.data?.message || err.message));
    }
  });

  const handleNext = () => {
    if (step === 1 && !formData.slotId) return toast.error("Please select an objective/placement");
    if (step === 2) {
      if (formData.campaignBudget < 10000) return toast.error("Minimum budget is 10,000 VND");
      if (profile && formData.campaignBudget > profile.walletBalance) return toast.error("Budget exceeds your Master Wallet balance");
      if (formData.startDate && formData.endDate && new Date(formData.endDate) <= new Date(formData.startDate)) return toast.error("End date must be after start date");
    }
    setStep(step + 1);
  };

  const handleSubmit = async () => {
    if (!formData.name) return toast.error("Please enter a campaign name");
    if (!selectedFile) return toast.error("Please upload your media file!");

    setIsUploading(true);
    const toastId = toast.loading("Uploading media to S3...");
    let uploadedUrl = "";
    
    try {
      uploadedUrl = await adsApi.uploadMedia(selectedFile);
      toast.success("Upload complete, initializing campaign...", { id: toastId });
    } catch (err: any) {
      toast.error("Upload failed: " + err.message, { id: toastId });
      setIsUploading(false);
      return;
    }

    createCampaignMutation.mutate({
      ...formData,
      mediaUrl: uploadedUrl,
      startDate: formData.startDate ? new Date(formData.startDate).toISOString() : undefined,
      endDate: formData.endDate ? new Date(formData.endDate).toISOString() : undefined,
    }, {
      onSettled: () => setIsUploading(false)
    });
  };

  return (
    <div className="absolute inset-y-0 right-0 w-[600px] bg-white shadow-2xl border-l border-slate-200 z-50 flex flex-col animate-in slide-in-from-right duration-300">
      <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-[#F8F8F8]">
        <h3 className="text-lg font-bold text-[#161823]">Create New Campaign</h3>
        <button onClick={onClose} className="p-1 hover:bg-slate-200 rounded-full"><X className="h-5 w-5" /></button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-6">
        {/* Step Indicator */}
        <div className="flex gap-2 mb-8">
          <div className={`h-1 flex-1 rounded-full ${step >= 1 ? 'bg-[#00D6BA]' : 'bg-slate-200'}`} />
          <div className={`h-1 flex-1 rounded-full ${step >= 2 ? 'bg-[#00D6BA]' : 'bg-slate-200'}`} />
          <div className={`h-1 flex-1 rounded-full ${step >= 3 ? 'bg-[#00D6BA]' : 'bg-slate-200'}`} />
        </div>

        {step === 1 && (
          <div className="space-y-6 animate-in fade-in">
            <div>
              <h4 className="text-base font-bold mb-1">1. Objectives & Placement</h4>
              <p className="text-xs text-[#757575] mb-4">Choose where you want your ads to appear.</p>
              
              <div className="grid gap-3">
                {slots?.map((slot: AdSlot) => (
                  <div 
                    key={slot.slotId}
                    onClick={() => setFormData({...formData, slotId: slot.slotId})}
                    className={`cursor-pointer rounded-sm border-2 p-4 transition-all ${formData.slotId === slot.slotId ? 'border-[#00D6BA] bg-teal-50/50' : 'border-slate-200 bg-white hover:border-slate-300'}`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-bold text-[#161823]">{slot.displayName}</h4>
                        <p className="text-xs text-[#757575] mt-1">{slot.price.toLocaleString()} VND / {slot.totalViewOfPrice} Views</p>
                      </div>
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${formData.slotId === slot.slotId ? 'border-[#00D6BA]' : 'border-slate-300'}`}>
                        {formData.slotId === slot.slotId && <div className="w-2 h-2 rounded-full bg-[#00D6BA]" />}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 animate-in fade-in">
            <div>
              <h4 className="text-base font-bold mb-1">2. Budget & Targeting</h4>
              <p className="text-xs text-[#757575] mb-4">Set your spending limit and goals.</p>
              
              <div className="space-y-4">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-sm text-sm mb-4">
                  <span className="text-[#757575]">Available Master Balance: </span>
                  <span className="font-bold">{profile?.walletBalance?.toLocaleString()} VND</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1">Campaign Budget (VND) *</label>
                  <input 
                    type="number" 
                    value={formData.campaignBudget} 
                    onChange={(e) => setFormData({...formData, campaignBudget: Number(e.target.value)})}
                    className="w-full border border-slate-300 rounded-sm px-3 py-2 text-sm outline-none focus:border-teal-500" 
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1">Target Views (Impressions) *</label>
                  <input 
                    type="number" 
                    value={formData.targetImpressions} 
                    onChange={(e) => setFormData({...formData, targetImpressions: Number(e.target.value)})}
                    className="w-full border border-slate-300 rounded-sm px-3 py-2 text-sm outline-none focus:border-teal-500" 
                  />
                </div>
                <div className="flex items-center gap-3 pt-2 pb-1 border-t border-slate-100 mt-2">
                  <div 
                    onClick={() => {
                      setIsScheduled(!isScheduled);
                      if (isScheduled) {
                        setFormData({...formData, startDate: "", endDate: ""});
                      }
                    }}
                    className={`w-8 h-4 rounded-full flex items-center p-0.5 cursor-pointer ${isScheduled ? 'bg-[#00D6BA]' : 'bg-slate-300'}`}
                  >
                    <div className={`w-3 h-3 rounded-full bg-white transition-transform ${isScheduled ? 'translate-x-4' : 'translate-x-0'}`}></div>
                  </div>
                  <label className="text-sm font-medium text-[#161823] cursor-pointer" onClick={() => setIsScheduled(!isScheduled)}>Đặt lịch chạy (Tùy chọn)</label>
                </div>
                
                {isScheduled && (
                  <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3 rounded-sm border border-slate-200">
                    <div>
                      <label className="block text-xs font-semibold mb-1">Start Date</label>
                      <input 
                        type="datetime-local" 
                        value={formData.startDate} 
                        onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                        className="w-full border border-slate-300 rounded-sm px-3 py-2 text-sm outline-none focus:border-teal-500" 
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1">End Date</label>
                      <input 
                        type="datetime-local" 
                        value={formData.endDate} 
                        onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                        className="w-full border border-slate-300 rounded-sm px-3 py-2 text-sm outline-none focus:border-teal-500" 
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 animate-in fade-in">
            <div>
              <h4 className="text-base font-bold mb-1">3. Ad Content</h4>
              <p className="text-xs text-[#757575] mb-4">Upload your creatives and destination.</p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold mb-1">Campaign Name *</label>
                  <input 
                    value={formData.name} 
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="e.g., Summer Sale"
                    className="w-full border border-slate-300 rounded-sm px-3 py-2 text-sm outline-none focus:border-teal-500" 
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-semibold mb-1">Upload File * (Image or Video)</label>
                  <input 
                    type="file" 
                    accept="image/*,video/*" 
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      setSelectedFile(file);
                      if (file) {
                        setFormData({...formData, mediaType: file.type.startsWith('video') ? "VIDEO" : "IMAGE"});
                      }
                    }} 
                    className="w-full text-xs file:mr-2 file:rounded-sm file:border-0 file:bg-slate-100 file:px-2 file:py-1 file:font-medium hover:file:bg-slate-200" 
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1">Destination URL *</label>
                  <input 
                    type="url" 
                    value={formData.targetUrl} 
                    onChange={(e) => setFormData({...formData, targetUrl: e.target.value})}
                    placeholder="https://..."
                    className="w-full border border-slate-300 rounded-sm px-3 py-2 text-sm outline-none focus:border-teal-500" 
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-semibold mb-2">Initial Labels (Optional)</label>
                  <div className="flex flex-wrap gap-2">
                    {!labelsData || labelsData.length === 0 ? (
                      <p className="text-xs text-slate-500 italic">No labels created yet. Go to Settings tab to create.</p>
                    ) : (
                      labelsData.map((lbl) => {
                        const isSelected = formData.labels.includes(lbl.name);
                        return (
                          <button
                            key={lbl.labelId}
                            type="button"
                            onClick={() => {
                              const newLabels = isSelected
                                ? formData.labels.filter((n) => n !== lbl.name)
                                : [...formData.labels, lbl.name];
                              setFormData({ ...formData, labels: newLabels });
                            }}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors flex items-center ${
                              isSelected
                                ? "bg-indigo-50 border-indigo-300 text-indigo-700"
                                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                            }`}
                          >
                            <span 
                              className="inline-block w-2 h-2 rounded-full mr-2" 
                              style={{ backgroundColor: lbl.color }}
                            />
                            {lbl.name}
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      <div className="p-4 border-t border-slate-200 bg-[#F8F8F8] flex justify-between">
        {step > 1 ? (
          <button onClick={() => setStep(step - 1)} className="px-6 py-2 bg-white border border-slate-300 rounded-sm text-sm font-semibold hover:bg-slate-50 transition-colors">Previous</button>
        ) : <div></div>}
        
        {step < 3 ? (
          <button onClick={handleNext} className="px-6 py-2 bg-[#00D6BA] text-white rounded-sm text-sm font-semibold hover:bg-[#00BFA5] transition-colors">Next</button>
        ) : (
          <button onClick={handleSubmit} disabled={isUploading || createCampaignMutation.isPending} className="px-6 py-2 bg-[#00D6BA] text-white rounded-sm text-sm font-semibold hover:bg-[#00BFA5] disabled:opacity-50 transition-colors">
            {isUploading || createCampaignMutation.isPending ? "Submitting..." : "Submit"}
          </button>
        )}
      </div>
    </div>
  );
}

function ReportPanel({ campaignId, onClose }: { campaignId: string, onClose: () => void }) {
  return (
    <div className="absolute inset-y-0 right-0 w-[800px] bg-white shadow-2xl border-l border-slate-200 z-50 flex flex-col animate-in slide-in-from-right duration-300">
      <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-[#F8F8F8]">
        <h3 className="text-lg font-bold text-[#161823]">Campaign Report</h3>
        <button onClick={onClose} className="p-1 hover:bg-slate-200 rounded-full"><X className="h-5 w-5" /></button>
      </div>
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <AdAnalyticsChart campaignId={campaignId} />
        
        <div className="mt-8 border-t border-slate-100 pt-6">
          <h3 className="text-base font-bold text-[#161823] mb-4">Transaction History</h3>
          <TransactionHistory campaignId={campaignId} />
        </div>
      </div>
    </div>
  );
}

function TransactionHistory({ campaignId }: { campaignId: string }) {
  const { data: transactions, isLoading } = useQuery({ 
    queryKey: ["campaign-transactions", campaignId], 
    queryFn: () => adsApi.getCampaignTransactions(campaignId) 
  });

  if (isLoading) return <div className="text-xs text-[#757575]">Loading transactions...</div>;
  if (!transactions || transactions.length === 0) return <div className="text-xs text-[#757575]">No transactions found.</div>;

  return (
    <table className="w-full text-left text-xs text-[#161823] border border-slate-200">
      <thead className="bg-[#F8F8F8] font-semibold text-[#757575] border-b border-slate-200">
        <tr>
          <th className="px-3 py-2">Time</th>
          <th className="px-3 py-2">Type</th>
          <th className="px-3 py-2 text-right">Amount</th>
          <th className="px-3 py-2">Note</th>
        </tr>
      </thead>
      <tbody>
        {transactions.map((tx: any, idx: number) => (
          <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50">
            <td className="px-3 py-2">{new Date(tx.createdAt).toLocaleString()}</td>
            <td className="px-3 py-2 text-[10px] uppercase font-bold text-slate-500">{tx.type}</td>
            <td className={`px-3 py-2 text-right font-medium ${tx.type === 'FUND_CAMPAIGN' ? 'text-green-600' : 'text-red-600'}`}>
              {tx.type === "FUND_CAMPAIGN" ? "+" : "-"}{tx.amount.toLocaleString()} VND
            </td>
            <td className="px-3 py-2">{tx.note}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function TopupModal({ onClose, balance }: { onClose: () => void, balance: number }) {
  const queryClient = useQueryClient();
  const [topupAmount, setTopupAmount] = useState(10000);

  const topupMutation = useMutation({
    mutationFn: adsApi.topupWallet,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ad-wallet-balance"] });
      toast.success("Balance added successfully!");
      onClose();
    },
  });

  return (
    <div className="absolute inset-0 bg-black/50 z-[100] flex items-center justify-center animate-in fade-in">
      <div className="bg-white rounded-md w-full max-w-md shadow-xl overflow-hidden animate-in zoom-in-95">
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <h3 className="font-bold">Add Funds to Master Wallet</h3>
          <button onClick={onClose}><X className="h-5 w-5 text-slate-400 hover:text-black" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="bg-slate-50 p-4 rounded-sm border border-slate-200 text-center">
            <div className="text-sm text-[#757575] mb-1">Current Balance</div>
            <div className="text-2xl font-bold text-[#00D6BA]">{balance.toLocaleString()} VND</div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Amount to add (VND)</label>
            <input 
              type="number" 
              value={topupAmount}
              onChange={(e) => setTopupAmount(Number(e.target.value))}
              className="w-full border border-slate-300 rounded-sm px-3 py-2 outline-none focus:border-teal-500"
            />
          </div>
          <button 
            onClick={() => topupMutation.mutate(topupAmount)}
            disabled={topupMutation.isPending}
            className="w-full py-2.5 bg-[#161823] text-white font-bold rounded-sm hover:bg-black transition-colors disabled:opacity-50"
          >
            {topupMutation.isPending ? "Processing..." : "Confirm Payment"}
          </button>
        </div>
      </div>
    </div>
  );
}

function OverviewView({ profile }: { profile: any }) {
  const { data: campaigns } = useQuery({ queryKey: ["my-campaigns"], queryFn: adsApi.getMyCampaigns });
  const activeCount = campaigns?.filter((c: any) => c.status === "ACTIVE").length || 0;

  return (
    <div className="h-full flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-md shadow-sm border border-slate-200">
          <div className="text-sm text-slate-500 mb-2">Số dư ví (VND)</div>
          <div className="text-3xl font-bold text-teal-600">{profile?.walletBalance?.toLocaleString() || 0}</div>
        </div>
        <div className="bg-white p-6 rounded-md shadow-sm border border-slate-200">
          <div className="text-sm text-slate-500 mb-2">Chiến dịch đang chạy</div>
          <div className="text-3xl font-bold text-[#161823]">{activeCount}</div>
        </div>
        <div className="bg-white p-6 rounded-md shadow-sm border border-slate-200">
          <div className="text-sm text-slate-500 mb-2">Tổng chiến dịch</div>
          <div className="text-3xl font-bold text-[#161823]">{campaigns?.length || 0}</div>
        </div>
      </div>
      <div className="bg-white flex-1 p-6 rounded-md shadow-sm border border-slate-200 flex items-center justify-center text-slate-400">
        Biểu đồ tổng quan sẽ hiển thị ở đây
      </div>
    </div>
  );
}

function WalletView({ profile }: { profile: any }) {
  const [isTopupOpen, setIsTopupOpen] = useState(false);
  const { data: transactions, isLoading } = useQuery({ queryKey: ["wallet-transactions"], queryFn: adsApi.getWalletTransactions });

  return (
    <div className="h-full flex flex-col bg-white border border-slate-200 rounded-sm shadow-sm animate-in fade-in slide-in-from-bottom-4">
      <div className="p-6 border-b border-slate-200 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Ví tiền & Thanh toán</h2>
          <p className="text-sm text-slate-500 mt-1">Quản lý số dư và lịch sử giao dịch của bạn</p>
        </div>
        <button 
          onClick={() => setIsTopupOpen(true)}
          className="flex items-center gap-1.5 bg-[#00D6BA] hover:bg-[#00BFA5] text-white px-4 py-2 rounded-sm font-medium transition-colors"
        >
          <Plus className="h-4 w-4" />
          Nạp Tiền
        </button>
      </div>

      <div className="p-6 bg-slate-50">
        <div className="bg-white p-6 rounded-md border border-slate-200 max-w-sm">
          <div className="text-sm text-slate-500 mb-1">Số dư hiện tại</div>
          <div className="text-3xl font-bold text-[#161823]">{profile?.walletBalance?.toLocaleString() || 0} <span className="text-lg text-slate-400">VND</span></div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <h3 className="font-bold mb-4">Lịch sử giao dịch</h3>
        {isLoading ? (
          <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-teal-500" /></div>
        ) : !transactions || transactions.length === 0 ? (
          <div className="text-center py-10 text-slate-400">Chưa có giao dịch nào</div>
        ) : (
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-[#F4F5F6] text-[#757575] font-semibold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 border-r border-slate-200">Thời gian</th>
                <th className="px-4 py-3 border-r border-slate-200">Loại giao dịch</th>
                <th className="px-4 py-3 border-r border-slate-200 text-right">Số tiền</th>
                <th className="px-4 py-3">Ghi chú</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx: any) => (
                <tr key={tx.transactionId} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3 border-r border-slate-100">{new Date(tx.createdAt).toLocaleString()}</td>
                  <td className="px-4 py-3 border-r border-slate-100 font-medium text-slate-600">{tx.type}</td>
                  <td className={`px-4 py-3 border-r border-slate-100 text-right font-bold ${tx.type === 'TOPUP' || tx.type === 'REFUND' ? 'text-green-600' : 'text-red-600'}`}>
                    {tx.type === 'TOPUP' || tx.type === 'REFUND' ? '+' : '-'}{tx.amount.toLocaleString()} VND
                  </td>
                  <td className="px-4 py-3 text-slate-600 truncate max-w-xs" title={tx.note}>{tx.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {isTopupOpen && (
        <TopupModal onClose={() => setIsTopupOpen(false)} balance={profile?.walletBalance || 0} />
      )}
    </div>
  );
}

function CustomerReportView({ campaignId, onClose }: { campaignId?: string; onClose?: () => void }) {
  const { data: campaigns, isLoading } = useQuery({ queryKey: ["my-campaigns"], queryFn: adsApi.getMyCampaigns });
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>(campaignId || "");

  if (isLoading) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 transition-opacity" onClick={onClose}>
      <div 
        className="relative h-full w-[calc(100%-80px)] bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-300"
        onClick={e => e.stopPropagation()}
      >
        <button 
          onClick={onClose}
          className="absolute top-0 -left-10 flex h-10 w-10 items-center justify-center bg-[#24252a] hover:bg-[#111113] text-slate-400 hover:text-white rounded-l-md transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center justify-between p-6 border-b border-slate-200 bg-slate-50/50">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Customer Report</h2>
            <p className="text-sm text-slate-500 mt-1">Xem thống kê hiệu suất chi tiết của chiến dịch</p>
          </div>
        </div>
        
        <div className="p-6 border-b border-slate-100 bg-white">
          <div className="flex items-center gap-4">
            <label className="text-sm font-semibold text-slate-700">Chọn chiến dịch:</label>
            <select 
              value={selectedCampaignId}
              onChange={(e) => setSelectedCampaignId(e.target.value)}
              className="border border-slate-200 rounded-lg px-4 py-2 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 min-w-[300px] text-sm font-medium text-slate-800 bg-slate-50 transition-all cursor-pointer"
            >
              <option value="">-- Chọn một chiến dịch --</option>
              {campaigns?.map((c: any) => (
                <option key={c.campaignId} value={c.campaignId}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="flex-1 overflow-auto p-6 bg-slate-50/30">
          {selectedCampaignId ? (
            <AdAnalyticsChart campaignId={selectedCampaignId} />
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-400">
              <BarChart2 className="h-12 w-12 text-slate-200 mb-4" />
              <p className="text-lg font-medium text-slate-500">Chưa chọn chiến dịch</p>
              <p className="text-sm mt-1">Vui lòng chọn một chiến dịch để xem báo cáo thống kê</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
