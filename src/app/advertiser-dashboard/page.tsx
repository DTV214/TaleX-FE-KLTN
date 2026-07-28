"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { AdvertiserLayout } from "@/features/advertiser-dashboard/components/advertiser-layout";
import { AdAnalyticsChart } from "@/features/advertiser-dashboard/components/ad-analytics-chart";
import { SidebarLabelPopover } from "@/features/advertiser-dashboard/components/sidebar-label-popover";
import { DateRangePicker } from "@/features/advertiser-dashboard/components/date-range-picker";
import { BreakdownPopover } from "@/features/advertiser-dashboard/components/breakdown-popover";
import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adsApi, AdSlot } from "@/features/ads/api/ads-api";
import { toast } from "sonner";
import { Loader2, Plus, Search, Calendar, ChevronDown, Columns, RefreshCw, MoreVertical, X, Check, Tag, Megaphone, PlusCircle } from "lucide-react";
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
      case "report": return <CustomerReportView />;
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

  const [activeReportCampaignId, setActiveReportCampaignId] = useState<string | null>(null);
  const { labels } = useLabels();
  const selectedLabel = searchParams.get("labelId");

  const filteredCampaigns = campaigns?.filter((c: any) => {
    if (!selectedLabel) return true;
    if (!c.labels) return false;
    return c.labels.includes(selectedLabel);
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
            placeholder="Search & filter (/) | Tips: Multi-keyword search is supported"
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
              
              <div className="mt-6 mb-2 px-6">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Management</span>
              </div>
              
              <div className="flex items-center justify-between px-6 py-2.5 text-[#757575] hover:bg-slate-50 cursor-pointer">
                <span className="text-sm font-medium">Bulk export/import</span>
                <span className="text-xs">›</span>
              </div>
              
              <SidebarLabelPopover />

              <div className="flex items-center justify-between px-6 py-2.5 text-[#757575] hover:bg-slate-50 cursor-pointer">
                <span className="text-sm font-medium">View report</span>
                <span className="text-xs">›</span>
              </div>
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
              <th className="px-4 py-2 border-r border-slate-200 text-right">Campaign Budget</th>
              <th className="px-4 py-2 border-r border-slate-200 text-right">Spend</th>
              <th className="px-4 py-2 border-r border-slate-200 text-right">CPC (destination)</th>
              <th className="px-4 py-2 border-r border-slate-200 text-right">CPM</th>
              <th className="px-4 py-2 border-r border-slate-200 text-right">Impressions</th>
              <th className="px-4 py-2 text-right">Clicks (destination)</th>
            </tr>
          </thead>
          <tbody>
            {!filteredCampaigns || filteredCampaigns.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-4 py-32 text-center text-[#757575]">
                  No data to display. Please create a campaign.
                </td>
              </tr>
            ) : (
              filteredCampaigns.map((c: any) => (
                <tr key={c.campaignId} className="border-b border-slate-100 hover:bg-slate-50 group">
                  <td className="px-4 py-3 border-r border-slate-100 text-center"><input type="checkbox" className="rounded-sm" /></td>
                  <td className="px-4 py-3 border-r border-slate-100">
                    <div className={`w-8 h-4 rounded-full flex items-center p-0.5 cursor-pointer ${c.status === 'ACTIVE' || c.status === 'PENDING_REVIEW' ? 'bg-[#00D6BA]' : 'bg-slate-300'}`}>
                      <div className={`w-3 h-3 rounded-full bg-white transition-transform ${c.status === 'ACTIVE' || c.status === 'PENDING_REVIEW' ? 'translate-x-4' : 'translate-x-0'}`}></div>
                    </div>
                  </td>
                  <td className="px-4 py-3 border-r border-slate-100 min-w-[250px]">
                    <div className="font-medium text-[#161823] flex items-center justify-between">
                      {c.name}
                      <button onClick={() => setActiveReportCampaignId(c.campaignId)} className="opacity-0 group-hover:opacity-100 text-teal-600 hover:underline text-xs">View Report</button>
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
                  <td className="px-4 py-3 border-r border-slate-100 text-right font-medium">
                    {c.totalBudget.toLocaleString()} VND
                  </td>
                  <td className="px-4 py-3 border-r border-slate-100 text-right">
                    {(c.totalBudget - (c.campaignBalance || 0)).toLocaleString()} VND
                  </td>
                  <td className="px-4 py-3 border-r border-slate-100 text-right">-</td>
                  <td className="px-4 py-3 border-r border-slate-100 text-right">-</td>
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

      {/* Topup Modal */}
      {isTopupOpen && (
        <TopupModal onClose={() => setIsTopupOpen(false)} balance={profile?.walletBalance || 0} />
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
    <div className="mt-2 flex flex-wrap items-center gap-1.5 relative">
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

function CreateCampaignPanel({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const [formData, setFormData] = useState({
    slotId: "",
    name: "",
    targetImpressions: 1000,
    campaignBudget: 100000,
    mediaType: "IMAGE" as "IMAGE" | "VIDEO",
    targetUrl: "",
    labels: [] as string[]
  });

  const { data: profile } = useQuery({ queryKey: ["ad-wallet-balance"], queryFn: adsApi.getWalletBalance });
  const { data: slots } = useQuery({ queryKey: ["ad-slots"], queryFn: adsApi.getAllSlots });

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
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-sm text-sm">
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
                  <label className="block text-xs font-semibold mb-1">Target Views (Impressions)</label>
                  <input 
                    type="number" 
                    value={formData.targetImpressions} 
                    onChange={(e) => setFormData({...formData, targetImpressions: Number(e.target.value)})}
                    className="w-full border border-slate-300 rounded-sm px-3 py-2 text-sm outline-none focus:border-teal-500" 
                  />
                </div>
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
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold mb-1">Media Type</label>
                    <select 
                      value={formData.mediaType} 
                      onChange={(e) => setFormData({...formData, mediaType: e.target.value as any})}
                      className="w-full border border-slate-300 rounded-sm px-3 py-2 text-sm outline-none focus:border-teal-500"
                    >
                      <option value="IMAGE">Image</option>
                      <option value="VIDEO">Video</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1">Upload File *</label>
                    <input 
                      type="file" 
                      accept={formData.mediaType === "IMAGE" ? "image/*" : "video/*"} 
                      onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} 
                      className="w-full text-xs file:mr-2 file:rounded-sm file:border-0 file:bg-slate-100 file:px-2 file:py-1 file:font-medium hover:file:bg-slate-200" 
                    />
                  </div>
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
                  <label className="block text-xs font-semibold mb-1">Initial Labels (Comma separated)</label>
                  <input 
                    type="text" 
                    onChange={(e) => setFormData({...formData, labels: e.target.value.split(',').map(s=>s.trim()).filter(s=>s)})}
                    placeholder="e.g., Promo, 2026"
                    className="w-full border border-slate-300 rounded-sm px-3 py-2 text-sm outline-none focus:border-teal-500" 
                  />
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

function CustomerReportView() {
  const { data: campaigns, isLoading } = useQuery({ queryKey: ["my-campaigns"], queryFn: adsApi.getMyCampaigns });
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>("");

  if (isLoading) return <div className="flex h-32 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-teal-500" /></div>;

  return (
    <div className="h-full flex flex-col bg-white border border-slate-200 rounded-sm shadow-sm animate-in fade-in slide-in-from-bottom-4">
      <div className="p-6 border-b border-slate-200">
        <h2 className="text-xl font-bold mb-4">Customer Report</h2>
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium">Chọn chiến dịch:</label>
          <select 
            value={selectedCampaignId}
            onChange={(e) => setSelectedCampaignId(e.target.value)}
            className="border border-slate-300 rounded-sm px-3 py-2 outline-none focus:border-teal-500 min-w-[250px] text-sm"
          >
            <option value="">-- Chọn một chiến dịch --</option>
            {campaigns?.map((c: any) => (
              <option key={c.campaignId} value={c.campaignId}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>
      
      <div className="flex-1 overflow-auto p-6">
        {selectedCampaignId ? (
          <AdAnalyticsChart campaignId={selectedCampaignId} />
        ) : (
          <div className="h-full flex items-center justify-center text-slate-400">
            Vui lòng chọn một chiến dịch để xem báo cáo
          </div>
        )}
      </div>
    </div>
  );
}
