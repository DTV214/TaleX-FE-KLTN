"use client";

import React, { useState } from "react";
import {
  ArrowUpRight,
  Video,
  BookOpen,
  BarChart3,
  Heart,
  ThumbsUp,
  MessageSquare,
  DollarSign,
  ChevronRight,
  TrendingUp,
  Award,
  Users,
  Eye,
  Clock,
  Wallet,
  Play,
} from "lucide-react";
import { useAuthStore, isFullProfile } from "@/features/auth/store/auth.store";
import { cn } from "@/shared/utils/utils";

type TabType = "overview" | "content" | "comments" | "revenue";

interface DashboardOverviewViewProps {
  onNavigate: (view: any) => void;
  initialTab?: TabType;
}

export function DashboardOverviewView({ onNavigate, initialTab = "overview" }: DashboardOverviewViewProps) {
  const user = useAuthStore((state) => state.user);
  const profileUser = isFullProfile(user) ? user : null;
  const displayName = profileUser?.fullName || profileUser?.username || user?.accountId || "TaleX Creator";

  const [activeTab, setActiveTab] = useState<TabType>(initialTab);

  // Mock Data from mobile app
  const channelStats = {
    subscribers: "15,420",
    views28d: "45.2K",
    viewsTrend: "+12.4%",
    watchTime28d: "1.8K",
    watchTimeTrend: "+8.2%",
    revenue28d: "$380.50",
    revenueTrend: "+15.1%",
    subscribers28d: "+850",
    subscribersTrend: "+20.4%",
  };

  const recentContent = [
    {
      id: "1",
      title: "Chiến Binh Rồng - Tập 1 (Thuyết Minh)",
      type: "video",
      views: "2.5K",
      likes: "124",
      comments: "48",
      duration: "14:20",
      date: "2 ngày trước",
      bgClass: "bg-blue-600/30 border border-blue-500/20 text-blue-400",
    },
    {
      id: "2",
      title: "Hương Vị Tình Yêu - Tập 5",
      type: "video",
      views: "1.8K",
      likes: "95",
      comments: "32",
      duration: "22:15",
      date: "5 ngày trước",
      bgClass: "bg-rose-600/30 border border-rose-500/20 text-rose-400",
    },
    {
      id: "3",
      title: "Thần Thoại Phương Đông - Chương 45",
      type: "comic",
      views: "5.2K",
      likes: "342",
      comments: "88",
      duration: "Manga",
      date: "1 tuần trước",
      bgClass: "bg-emerald-600/30 border border-emerald-500/20 text-emerald-400",
    },
  ];

  const recentComments = [
    {
      id: "c1",
      user: "nguyenvana",
      avatar: "NV",
      comment: "Phim hay quá, chất lượng hình ảnh đỉnh thật sự! Mong ngóng tập sau của ad ghê.",
      time: "5 phút trước",
      contentTitle: "Chiến Binh Rồng - Tập 1",
    },
    {
      id: "c2",
      user: "tranb_reader",
      avatar: "TB",
      comment: "Vẽ đẹp xuất sắc luôn ad ơi, nội dung cuốn nữa. Cố gắng phát huy nhé!",
      time: "2 giờ trước",
      contentTitle: "Thần Thoại Phương Đông - Chương 45",
    },
  ];

  const revenueReports = [
    { month: "Tháng 6, 2026", amount: "$150.20", status: "Đã thanh toán" },
    { month: "Tháng 5, 2026", amount: "$130.40", status: "Đã thanh toán" },
    { month: "Tháng 4, 2026", amount: "$99.90", status: "Đã thanh toán" },
  ];

  return (
    <div className="w-full py-6 space-y-6">
      {/* ================= CHANNEL INFO CARD ================= */}
      <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-gradient-to-br from-[#2E1E1E] to-[#1E1E22] p-6 shadow-xl">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_120%,rgba(212,175,55,0.08),transparent_50%)]" />
        <div className="relative flex flex-col sm:flex-row items-center gap-5">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden border-2 border-[#D4AF37] bg-zinc-950 shrink-0">
            {profileUser?.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profileUser.avatarUrl}
                alt="Avatar"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-zinc-800 text-[#D4AF37] font-black text-2xl uppercase">
                {displayName.charAt(0)}
              </div>
            )}
          </div>
          <div className="flex-1 text-center sm:text-left space-y-1.5">
            <div className="flex flex-col sm:flex-row items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">{displayName}</h1>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black tracking-wider uppercase border bg-yellow-400/10 border-yellow-400/20 text-[#D4AF37] shadow-sm">
                <Award size={10} className="text-[#D4AF37]" /> Partner
              </span>
            </div>
            <p className="text-zinc-400 text-sm font-semibold">{channelStats.subscribers} người đăng ký</p>
          </div>
        </div>
      </div>

      {/* ================= TAB BAR ================= */}
      <div className="border-b border-white/10 flex gap-1 overflow-x-auto scrollbar-none">
        {([
          { id: "overview", label: "Tổng quan" },
          { id: "content", label: "Nội dung" },
          { id: "comments", label: "Bình luận" },
          { id: "revenue", label: "Doanh thu" },
        ] as const).map((tab) => {
          const isSelected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "pb-3.5 px-5 text-sm font-black relative transition-colors outline-none cursor-pointer",
                isSelected ? "text-white" : "text-zinc-500 hover:text-zinc-300"
              )}
            >
              {tab.label}
              {isSelected && (
                <span className="absolute bottom-0 left-5 right-5 h-0.5 bg-red-500 rounded-full" />
              )}
            </button>
          );
        })}
      </div>

      {/* ================= TỔNG QUAN (OVERVIEW) TAB ================= */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          <div>
            <h2 className="text-white text-lg font-black tracking-wide">Số liệu phân tích kênh</h2>
            <p className="text-zinc-550 text-xs font-semibold mt-1">Hiệu suất kênh trong 28 ngày qua</p>
          </div>

          {/* 4 Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Stat 1: Views */}
            <div className="bg-[#1C1C1F] border border-white/5 rounded-2xl p-5 hover:border-white/10 transition-colors">
              <div className="flex justify-between items-start">
                <span className="text-zinc-450 text-xs font-bold uppercase tracking-wider">Số lượt xem</span>
                <Eye size={16} className="text-zinc-500" />
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-white text-2xl font-black">{channelStats.views28d}</span>
                <span className="text-emerald-500 text-xs font-black flex items-center">
                  <ArrowUpRight size={14} /> {channelStats.viewsTrend}
                </span>
              </div>
            </div>

            {/* Stat 2: Watch Time */}
            <div className="bg-[#1C1C1F] border border-white/5 rounded-2xl p-5 hover:border-white/10 transition-colors">
              <div className="flex justify-between items-start">
                <span className="text-zinc-450 text-xs font-bold uppercase tracking-wider">Thời gian xem (giờ)</span>
                <Clock size={16} className="text-zinc-500" />
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-white text-2xl font-black">{channelStats.watchTime28d}</span>
                <span className="text-emerald-500 text-xs font-black flex items-center">
                  <ArrowUpRight size={14} /> {channelStats.watchTimeTrend}
                </span>
              </div>
            </div>

            {/* Stat 3: New Subs */}
            <div className="bg-[#1C1C1F] border border-white/5 rounded-2xl p-5 hover:border-white/10 transition-colors">
              <div className="flex justify-between items-start">
                <span className="text-zinc-450 text-xs font-bold uppercase tracking-wider">Người đăng ký mới</span>
                <Users size={16} className="text-zinc-500" />
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-white text-2xl font-black">{channelStats.subscribers28d}</span>
                <span className="text-emerald-500 text-xs font-black flex items-center">
                  <ArrowUpRight size={14} /> {channelStats.subscribersTrend}
                </span>
              </div>
            </div>

            {/* Stat 4: Revenue */}
            <div className="bg-[#1C1C1F] border border-[#D4AF37]/25 rounded-2xl p-5 hover:border-[#D4AF37]/40 transition-colors shadow-lg shadow-yellow-550/5">
              <div className="flex justify-between items-start">
                <span className="text-zinc-450 text-xs font-bold uppercase tracking-wider">Doanh thu ước tính</span>
                <Wallet size={16} className="text-[#D4AF37]" />
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-[#D4AF37] text-2xl font-black">{channelStats.revenue28d}</span>
                <span className="text-emerald-500 text-xs font-black flex items-center">
                  <ArrowUpRight size={14} /> {channelStats.revenueTrend}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Actions Bar */}
          <div className="bg-[#1C1C1F] border border-white/5 rounded-2xl p-5 flex flex-col sm:flex-row justify-around gap-6 items-center">
            <button
              onClick={() => onNavigate("series")}
              className="group flex flex-col items-center justify-center p-3 text-center rounded-xl hover:bg-white/[0.03] transition-colors w-full max-w-[160px]"
            >
              <div className="w-12 h-12 rounded-full bg-red-500/10 group-hover:bg-red-500/20 flex items-center justify-center mb-2 transition-colors">
                <Video size={20} className="text-red-500" />
              </div>
              <span className="text-zinc-200 text-xs font-black">Đăng video mới</span>
            </button>

            <button
              onClick={() => onNavigate("series")}
              className="group flex flex-col items-center justify-center p-3 text-center rounded-xl hover:bg-white/[0.03] transition-colors w-full max-w-[160px]"
            >
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 group-hover:bg-emerald-500/20 flex items-center justify-center mb-2 transition-colors">
                <BookOpen size={20} className="text-emerald-550" />
              </div>
              <span className="text-zinc-200 text-xs font-black">Đăng truyện mới</span>
            </button>

            <button
              onClick={() => setActiveTab("revenue")}
              className="group flex flex-col items-center justify-center p-3 text-center rounded-xl hover:bg-white/[0.03] transition-colors w-full max-w-[160px]"
            >
              <div className="w-12 h-12 rounded-full bg-blue-500/10 group-hover:bg-blue-500/20 flex items-center justify-center mb-2 transition-colors">
                <BarChart3 size={20} className="text-blue-500" />
              </div>
              <span className="text-zinc-200 text-xs font-black">Xem báo cáo doanh thu</span>
            </button>
          </div>

          {/* Combined Preview Sections */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Content Preview */}
            <div className="bg-[#1C1C1F] border border-white/5 rounded-2xl p-5 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-white text-base font-black">Nội dung mới đăng</h3>
                <button onClick={() => setActiveTab("content")} className="text-red-500 hover:text-red-400 text-xs font-bold transition-colors">
                  Xem tất cả
                </button>
              </div>
              <div className="space-y-3">
                {recentContent.slice(0, 2).map((item) => (
                  <div key={item.id} className="flex bg-white/[0.02] border border-white/5 rounded-xl p-3 hover:bg-white/[0.04] transition-colors items-center gap-3">
                    <div className={cn("w-16 h-12 rounded-lg flex items-center justify-center relative shrink-0", item.bgClass)}>
                      {item.type === "video" ? <Play size={18} fill="currentColor" /> : <BookOpen size={18} />}
                      <span className="absolute bottom-1 right-1 bg-black/60 px-1 rounded text-[8px] font-black uppercase text-white">
                        {item.duration}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-white text-xs font-bold truncate">{item.title}</h4>
                      <p className="text-zinc-550 text-[10px] font-medium mt-1">
                        {item.date} • {item.type === "video" ? "Video" : "Truyện tranh"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Comments Preview */}
            <div className="bg-[#1C1C1F] border border-white/5 rounded-2xl p-5 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-white text-base font-black">Bình luận mới nhất</h3>
                <button onClick={() => setActiveTab("comments")} className="text-red-500 hover:text-red-400 text-xs font-bold transition-colors">
                  Xem tất cả
                </button>
              </div>
              <div className="space-y-3">
                {recentComments.slice(0, 1).map((item) => (
                  <div key={item.id} className="bg-white/[0.02] border border-white/5 rounded-xl p-4 hover:bg-white/[0.04] transition-colors space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-white text-xs font-black">
                          {item.avatar}
                        </div>
                        <div>
                          <h4 className="text-white text-xs font-black">{item.user}</h4>
                          <p className="text-zinc-550 text-[9px] font-semibold mt-0.5">{item.time}</p>
                        </div>
                      </div>
                      <span className="bg-zinc-800 text-zinc-400 text-[8px] font-bold px-2 py-0.5 rounded truncate max-w-[120px]">
                        {item.contentTitle}
                      </span>
                    </div>
                    <p className="text-zinc-300 text-xs leading-relaxed">{item.comment}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= NỘI DUNG (CONTENT) TAB ================= */}
      {activeTab === "content" && (
        <div className="space-y-4">
          <h2 className="text-white text-lg font-black tracking-wide mb-2">Danh sách nội dung mới đăng</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recentContent.map((item) => (
              <div key={item.id} className="flex bg-[#1C1C1F] border border-white/5 rounded-2xl p-4 items-center gap-4 hover:border-white/10 transition-colors">
                <div className={cn("w-24 h-16 rounded-xl flex items-center justify-center relative shrink-0", item.bgClass)}>
                  {item.type === "video" ? <Play size={20} fill="currentColor" /> : <BookOpen size={20} />}
                  <span className="absolute bottom-1 right-1 bg-black/60 px-1.5 rounded text-[9px] font-black uppercase text-white">
                    {item.duration}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-white text-sm font-bold truncate">{item.title}</h3>
                  <p className="text-zinc-500 text-[10px] font-medium mt-1">
                    {item.date} • {item.type === "video" ? "Video" : "Truyện tranh"}
                  </p>
                  {/* Metrics */}
                  <div className="flex items-center gap-4 mt-3">
                    <span className="flex items-center gap-1 text-zinc-400 text-[10px] font-bold">
                      <Eye size={12} className="text-zinc-500" /> {item.views}
                    </span>
                    <span className="flex items-center gap-1 text-zinc-400 text-[10px] font-bold">
                      <ThumbsUp size={12} className="text-zinc-500" /> {item.likes}
                    </span>
                    <span className="flex items-center gap-1 text-zinc-400 text-[10px] font-bold">
                      <MessageSquare size={12} className="text-zinc-500" /> {item.comments}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= BÌNH LUẬN (COMMENTS) TAB ================= */}
      {activeTab === "comments" && (
        <div className="space-y-4">
          <h2 className="text-white text-lg font-black tracking-wide mb-2">Bình luận mới nhất</h2>
          <div className="space-y-4">
            {recentComments.map((item) => (
              <div key={item.id} className="bg-[#1C1C1F] border border-white/5 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-white text-xs font-black">
                      {item.avatar}
                    </div>
                    <div>
                      <h3 className="text-white text-xs font-black">{item.user}</h3>
                      <p className="text-zinc-550 text-[9px] font-semibold mt-0.5">{item.time}</p>
                    </div>
                  </div>
                  <span className="bg-zinc-800 text-zinc-450 text-[9px] font-bold px-2 py-0.5 rounded">
                    {item.contentTitle}
                  </span>
                </div>
                <p className="text-zinc-200 text-xs leading-relaxed pl-1">{item.comment}</p>
                <div className="flex justify-between items-center pt-3 border-t border-white/5 pl-1">
                  <div className="flex items-center gap-4">
                    <button className="flex items-center gap-1.5 text-zinc-500 hover:text-white transition-colors text-[10px] font-bold outline-none">
                      <ThumbsUp size={12} /> Thích
                    </button>
                    <button className="flex items-center gap-1.5 text-zinc-500 hover:text-white transition-colors text-[10px] font-bold outline-none">
                      <Heart size={12} /> Thả tim
                    </button>
                  </div>
                  <button className="bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 px-3.5 py-1.5 rounded-lg text-[10px] font-bold transition-all outline-none">
                    Phản hồi
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= DOANH THU (REVENUE) TAB ================= */}
      {activeTab === "revenue" && (
        <div className="space-y-6">
          <div>
            <h2 className="text-white text-lg font-black tracking-wide">Quản lý tài chính</h2>
            <p className="text-zinc-550 text-xs font-semibold mt-1">Xem thông tin và lịch sử rút tiền</p>
          </div>

          <div
            onClick={() => onNavigate("monetization")}
            className="flex items-center bg-[#1C1C1F] border border-[#D4AF37]/35 rounded-2xl p-5 hover:border-[#D4AF37]/60 transition-colors shadow-lg cursor-pointer group"
          >
            <div className="w-12 h-12 rounded-xl bg-[#D4AF37]/10 flex items-center justify-center mr-4 shrink-0">
              <DollarSign size={24} className="text-[#D4AF37]" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-white font-black text-sm">Trung tâm kiếm tiền</h3>
              <p className="text-zinc-400 text-xs font-semibold mt-1">Hoàn thiện hồ sơ để nhận doanh thu từ TaleX</p>
            </div>
            <ChevronRight size={20} className="text-[#D4AF37] group-hover:translate-x-0.5 transition-transform" />
          </div>

          {/* Balance card */}
          <div className="bg-gradient-to-br from-zinc-800 to-zinc-950 border border-white/5 rounded-2xl p-6 relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_90%_10%,rgba(212,175,55,0.04),transparent_40%)]" />
            <span className="text-zinc-450 text-[10px] font-bold uppercase tracking-widest">Tổng Thu Nhập Chưa Rút</span>
            <div className="text-[#D4AF37] text-3xl font-black mt-2">$125.80</div>
            <span className="text-zinc-550 text-[9px] font-medium mt-1.5 block">Cập nhật lần cuối: Hôm nay lúc 18:00</span>
            <button className="w-full bg-[#D4AF37] hover:bg-yellow-400 text-stone-950 font-black text-xs uppercase tracking-wide h-10 rounded-xl mt-5 transition-all shadow-md shadow-yellow-500/10 outline-none">
              Yêu Cầu Rút Tiền
            </button>
          </div>

          {/* History */}
          <div className="space-y-3">
            <h3 className="text-white text-xs font-black uppercase tracking-wider mb-2">Lịch sử nhận thanh toán</h3>
            {revenueReports.map((report, idx) => (
              <div key={idx} className="flex justify-between items-center bg-[#1C1C1F] border border-white/5 rounded-xl p-4">
                <div>
                  <h4 className="text-white text-xs font-bold">{report.month}</h4>
                  <p className="text-zinc-500 text-[10px] font-medium mt-1">Đăng ký VIP & Lượt xem</p>
                </div>
                <div className="text-right">
                  <span className="text-green-500 text-sm font-black">{report.amount}</span>
                  <div className="bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded mt-1.5 inline-block">
                    <span className="text-green-500 text-[8px] font-black uppercase tracking-wider">{report.status}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
