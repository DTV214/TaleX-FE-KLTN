"use client";

import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Check,
  Clock,
  Edit,
  Eye,
  EyeOff,
  Loader2,
  Megaphone,
  MonitorPlay,
  PauseCircle,
  PlayCircle,
  Plus,
  Power,
  RefreshCw,
  Route,
  Settings2,
  TimerReset,
  Video,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { adsApi, AdSlot } from "@/features/ads/api/ads-api";
import {
  adminAdsApi,
  type AdCampaignAdmin,
} from "@/features/admin/api/admin-ads-api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";

type AdsTab = "SLOTS" | "PENDING" | "ALL" | "CONFIG";

const QUICK_ROUTES = [
  "/",
  "/series",
  "/comics",
  "/watch",
  "/read",
  "/intro",
  "/missions",
  "/profile",
  "/bookmarks",
  "/liked",
  "/coin-history",
  "/premium",
  "/premium-history",
  "/purchase-history",
  "/subscriptions",
  "/creator-channel",
  "/public-channel",
];

const tabs: Array<{ id: AdsTab; label: string; icon: typeof Megaphone }> = [
  { id: "SLOTS", label: "Vị trí quảng cáo", icon: MonitorPlay },
  { id: "PENDING", label: "Chờ duyệt", icon: Check },
  { id: "ALL", label: "Tất cả chiến dịch", icon: Megaphone },
  { id: "CONFIG", label: "Cấu hình hệ thống", icon: Settings2 },
];

function getErrorMessage(error: unknown) {
  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error &&
    typeof error.response === "object" &&
    error.response !== null &&
    "data" in error.response
  ) {
    const data = error.response.data as { message?: string };
    if (data.message) return data.message;
  }

  return error instanceof Error ? error.message : "Thao tác thất bại.";
}

function formatCurrency(value?: number | null) {
  return `${new Intl.NumberFormat("vi-VN").format(value ?? 0)}đ`;
}

function formatNumber(value?: number | null) {
  return new Intl.NumberFormat("vi-VN").format(value ?? 0);
}

function getStatusLabel(status?: string | null) {
  switch (status) {
    case "ACTIVE":
      return "Đang chạy";
    case "PAUSED":
      return "Tạm dừng";
    case "COMPLETED":
      return "Hoàn tất";
    case "REJECTED":
      return "Từ chối";
    case "PENDING":
      return "Chờ duyệt";
    default:
      return status || "Chưa rõ";
  }
}

function getStatusClassName(status?: string | null) {
  switch (status) {
    case "ACTIVE":
      return "border-emerald-200 bg-emerald-50 text-emerald-700 backoffice-dark:border-emerald-400/30 backoffice-dark:bg-emerald-400/10 backoffice-dark:text-emerald-200";
    case "PAUSED":
      return "border-amber-200 bg-amber-50 text-amber-700 backoffice-dark:border-amber-400/30 backoffice-dark:bg-amber-400/10 backoffice-dark:text-amber-200";
    case "COMPLETED":
      return "border-sky-200 bg-sky-50 text-sky-700 backoffice-dark:border-sky-400/30 backoffice-dark:bg-sky-400/10 backoffice-dark:text-sky-200";
    case "REJECTED":
      return "border-red-200 bg-red-50 text-red-700 backoffice-dark:border-red-400/30 backoffice-dark:bg-red-400/10 backoffice-dark:text-red-200";
    default:
      return "border-slate-200 bg-slate-100 text-slate-700 backoffice-dark:border-white/10 backoffice-dark:bg-white/8 backoffice-dark:text-white/70";
  }
}

function getSlotTypeLabel(type: AdSlot["type"]) {
  switch (type) {
    case "BANNER":
      return "Banner";
    case "VIDEO":
      return "Video preroll";
    case "POPUP":
      return "Popup";
    default:
      return type;
  }
}

function TabButton({
  activeTab,
  count,
  icon: Icon,
  label,
  onClick,
  tab,
}: {
  activeTab: AdsTab;
  count?: number;
  icon: typeof Megaphone;
  label: string;
  onClick: () => void;
  tab: AdsTab;
}) {
  const isActive = activeTab === tab;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold transition ${isActive
          ? "bg-white text-slate-950 shadow-sm backoffice-dark:bg-[var(--backoffice-primary)] backoffice-dark:text-black"
          : "text-slate-500 hover:text-slate-900 backoffice-dark:text-white/55 backoffice-dark:hover:text-white"
        }`}
    >
      <Icon className="h-4 w-4" />
      {label}
      {count ? (
        <span className="rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-black text-white">
          {count}
        </span>
      ) : null}
    </button>
  );
}

function ActionButton({
  children,
  className = "",
  disabled,
  onClick,
  title,
}: {
  children: ReactNode;
  className?: string;
  disabled?: boolean;
  onClick?: () => void;
  title: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-40 backoffice-dark:hover:bg-white/10 backoffice-dark:hover:text-white ${className}`}
    >
      {children}
    </button>
  );
}

function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-12 text-center text-sm font-medium text-slate-500 backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.03] backoffice-dark:text-white/55">
      {children}
    </div>
  );
}

export default function AdminAdsPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<AdsTab>("SLOTS");
  const [editingSlot, setEditingSlot] = useState<AdSlot | null>(null);
  const [previewMedia, setPreviewMedia] = useState<{
    url: string;
    type: string;
  } | null>(null);

  const { data: slots, isLoading: loadingSlots, isFetching: fetchingSlots } =
    useQuery({
      queryKey: ["admin-ad-slots"],
      queryFn: adminAdsApi.getAllSlots,
    });

  const {
    data: pendingCampaigns,
    isLoading: loadingPending,
    isFetching: fetchingPending,
  } = useQuery({
    queryKey: ["admin-pending-campaigns"],
    queryFn: adminAdsApi.getPendingCampaigns,
  });

  const {
    data: allCampaigns,
    isLoading: loadingAll,
    isFetching: fetchingAll,
  } = useQuery({
    queryKey: ["admin-all-campaigns"],
    queryFn: adminAdsApi.getAllCampaigns,
  });

  const updateSlotMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<AdSlot> }) =>
      adminAdsApi.updateSlot(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-ad-slots"] });
      setEditingSlot(null);
      toast.success("Cập nhật Slot thành công.");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const patchSlotStatusMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      adminAdsApi.patchSlotStatus(id, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-ad-slots"] });
      toast.success("Đã thay đổi trạng thái.");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const reviewCampaignMutation = useMutation({
    mutationFn: ({
      id,
      note,
      status,
    }: {
      id: string;
      status: "ACTIVE" | "REJECTED";
      note?: string;
    }) => adminAdsApi.reviewCampaign(id, status, note),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-pending-campaigns"] });
      queryClient.invalidateQueries({ queryKey: ["admin-all-campaigns"] });
      toast.success("Đã xử lý chiến dịch thành công.");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const patchCampaignStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      adminAdsApi.patchCampaignStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-all-campaigns"] });
      toast.success("Đã thay đổi trạng thái chiến dịch.");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const { data: popupConfig, isLoading: loadingRoutes } = useQuery({
    queryKey: ["ad-popup-config"],
    queryFn: adsApi.getPopupConfig,
  });
  const [routeInput, setRouteInput] = useState("");
  const [editedRoutes, setEditedRoutes] = useState<string[]>([]);
  const [delayMs, setDelayMs] = useState<number>(3000);
  const [cooldownMinutes, setCooldownMinutes] = useState<number>(15);

  const configSynced = useRef(false);
  useEffect(() => {
    if (popupConfig && !configSynced.current) {
      setEditedRoutes(popupConfig.allowedRoutes);
      setDelayMs(popupConfig.showDelayMs);
      setCooldownMinutes(popupConfig.cooldownMinutes);
      configSynced.current = true;
    }
  }, [popupConfig]);

  const updateConfigMutation = useMutation({
    mutationFn: (config: {
      allowedRoutes: string[];
      showDelayMs: number;
      cooldownMinutes: number;
    }) => adsApi.updatePopupConfig(config),
    onSuccess: (data) => {
      setEditedRoutes(data.allowedRoutes);
      setDelayMs(data.showDelayMs);
      setCooldownMinutes(data.cooldownMinutes);
      queryClient.invalidateQueries({ queryKey: ["ad-popup-config"] });
      toast.success("Đã lưu cấu hình Popup.");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  // Cấu hình In-Video Preroll
  const { data: inVideoConfig } = useQuery({
    queryKey: ["ad-in-video-config-admin"],
    queryFn: adsApi.getInVideoConfig,
  });
  const [skipAfterSec, setSkipAfterSec] = useState<number>(5);
  const [inVideoCooldown, setInVideoCooldown] = useState<number>(30);

  const inVideoConfigSynced = useRef(false);
  useEffect(() => {
    if (inVideoConfig && !inVideoConfigSynced.current) {
      setSkipAfterSec(inVideoConfig.skipAfterSec);
      setInVideoCooldown(inVideoConfig.cooldownSeconds);
      inVideoConfigSynced.current = true;
    }
  }, [inVideoConfig]);

  const updateInVideoConfigMutation = useMutation({
    mutationFn: (config: { skipAfterSec: number; cooldownSeconds: number }) =>
      adsApi.updateInVideoConfig(config),
    onSuccess: (data) => {
      setSkipAfterSec(data.skipAfterSec);
      setInVideoCooldown(data.cooldownSeconds);
      queryClient.invalidateQueries({ queryKey: ["ad-in-video-config-admin"] });
      queryClient.invalidateQueries({ queryKey: ["ad-in-video-config"] });
      toast.success("Đã lưu cấu hình In-Video.");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const handleAddRoute = () => {
    const route = routeInput.trim();
    if (!route) return;
    if (!route.startsWith("/")) {
      toast.error("Route phải bắt đầu bằng /");
      return;
    }
    if (editedRoutes.includes(route)) {
      toast.error("Route này đã tồn tại");
      return;
    }
    setEditedRoutes([...editedRoutes, route]);
    setRouteInput("");
  };

  const handleRemoveRoute = (route: string) => {
    setEditedRoutes(editedRoutes.filter((item) => item !== route));
  };

  const handleCreateOrUpdateSlot = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingSlot) return;
    const formData = new FormData(event.currentTarget);
    const data = {
      codeName: formData.get("codeName") as string,
      displayName: formData.get("displayName") as string,
      type: formData.get("type") as "BANNER" | "VIDEO" | "POPUP",
      price: Number(formData.get("price")),
      totalViewOfPrice: Number(formData.get("totalViewOfPrice")),
      isActive: formData.get("isActive") === "true",
      isServingEnabled: formData.get("isServingEnabled") === "true",
    };

    updateSlotMutation.mutate({ id: editingSlot.slotId, data });
  };

  const isInitialLoading = loadingSlots || loadingPending || loadingAll;
  const slotsCount = slots?.length ?? 0;
  const pendingCount = pendingCampaigns?.length ?? 0;
  const campaignCount = allCampaigns?.length ?? 0;
  const isAnyFetching = fetchingSlots || fetchingPending || fetchingAll;

  if (isInitialLoading) {
    return (
      <div className="flex min-h-[360px] items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 shadow-sm backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.04] backoffice-dark:text-white/55">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Đang tải hệ thống quảng cáo...
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
      <header className="flex flex-col gap-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.04] lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 backoffice-dark:text-white">
            Quản lý Hệ thống Quảng Cáo
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500 backoffice-dark:text-white/55">
            Quản lý vị trí hiển thị, duyệt chiến dịch và cấu hình popup redirect
            cho các trang public.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3 sm:min-w-[420px]">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 backoffice-dark:border-white/10 backoffice-dark:bg-black/25">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 backoffice-dark:text-white/45">
              Slots
            </p>
            <p className="mt-2 text-2xl font-bold text-slate-950 backoffice-dark:text-white">
              {formatNumber(slotsCount)}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 backoffice-dark:border-white/10 backoffice-dark:bg-black/25">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 backoffice-dark:text-white/45">
              Chờ duyệt
            </p>
            <p className="mt-2 text-2xl font-bold text-slate-950 backoffice-dark:text-white">
              {formatNumber(pendingCount)}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 backoffice-dark:border-white/10 backoffice-dark:bg-black/25">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 backoffice-dark:text-white/45">
              Chiến dịch
            </p>
            <p className="mt-2 text-2xl font-bold text-slate-950 backoffice-dark:text-white">
              {formatNumber(campaignCount)}
            </p>
          </div>
        </div>
      </header>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.04]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-slate-100 p-1 backoffice-dark:border-white/10 backoffice-dark:bg-black/25">
            {tabs.map((tab) => (
              <TabButton
                key={tab.id}
                activeTab={activeTab}
                count={tab.id === "PENDING" ? pendingCount : undefined}
                icon={tab.icon}
                label={tab.label}
                onClick={() => setActiveTab(tab.id)}
                tab={tab.id}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={() => {
              queryClient.invalidateQueries({ queryKey: ["admin-ad-slots"] });
              queryClient.invalidateQueries({
                queryKey: ["admin-pending-campaigns"],
              });
              queryClient.invalidateQueries({
                queryKey: ["admin-all-campaigns"],
              });
              queryClient.invalidateQueries({ queryKey: ["ad-popup-config"] });
            }}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition hover:bg-slate-50 backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.04] backoffice-dark:text-white/70 backoffice-dark:hover:bg-white/10"
          >
            <RefreshCw
              className={isAnyFetching ? "h-4 w-4 animate-spin" : "h-4 w-4"}
            />
            Làm mới
          </button>
        </div>
      </section>

      {activeTab === "CONFIG" && (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.04]">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#E6F7F9] text-[#007A8A] backoffice-dark:bg-[var(--backoffice-primary)]/15 backoffice-dark:text-[var(--backoffice-primary)]">
                <Route className="h-6 w-6" />
              </div>
              <h2 className="mt-4 text-xl font-bold text-slate-950 backoffice-dark:text-white">
                Cấu hình Popup Quảng Cáo
              </h2>
              <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-slate-500 backoffice-dark:text-white/55">
                Quản lý danh sách route được phép hiển thị popup. Hệ thống dùng
                prefix match, ví dụ `/series` sẽ khớp cả `/series/123`.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:w-[360px]">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 backoffice-dark:border-white/10 backoffice-dark:bg-black/25">
                <Clock className="mb-3 h-5 w-5 text-[#007A8A] backoffice-dark:text-[var(--backoffice-primary)]" />
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500 backoffice-dark:text-white/45">
                  Thời gian chờ
                </p>
                <p className="mt-2 text-xl font-bold text-slate-950 backoffice-dark:text-white">
                  {formatNumber(delayMs)}ms
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 backoffice-dark:border-white/10 backoffice-dark:bg-black/25">
                <TimerReset className="mb-3 h-5 w-5 text-[#007A8A] backoffice-dark:text-[var(--backoffice-primary)]" />
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500 backoffice-dark:text-white/45">
                  Cooldown
                </p>
                <p className="mt-2 text-xl font-bold text-slate-950 backoffice-dark:text-white">
                  {formatNumber(cooldownMinutes)} phút
                </p>
              </div>
            </div>
          </div>

          <div className="mt-7 grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 backoffice-dark:border-white/10 backoffice-dark:bg-black/20">
              <div className="mb-4 flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-950 backoffice-dark:text-white">
                    Routes đang bật
                  </h3>
                  <p className="mt-1 text-xs font-medium text-slate-500 backoffice-dark:text-white/45">
                    Popup chỉ hiển thị trên các route trong danh sách này.
                  </p>
                </div>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-slate-600 shadow-sm backoffice-dark:bg-white/10 backoffice-dark:text-white/70">
                  {formatNumber(editedRoutes.length)}
                </span>
              </div>

              {loadingRoutes ? (
                <div className="flex min-h-32 items-center justify-center text-sm font-medium text-slate-400">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang tải...
                </div>
              ) : editedRoutes.length === 0 ? (
                <EmptyState>
                  Chưa có route nào. Popup sẽ không hiển thị ở bất kỳ đâu.
                </EmptyState>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {editedRoutes.map((route) => (
                    <span
                      key={route}
                      className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-3 py-1.5 font-mono text-xs font-bold text-violet-700 backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.06] backoffice-dark:text-white/80"
                    >
                      {route}
                      <button
                        type="button"
                        onClick={() => handleRemoveRoute(route)}
                        className="rounded-full p-0.5 text-violet-400 transition hover:bg-red-50 hover:text-red-500 backoffice-dark:hover:bg-red-400/10"
                        title="Xóa route này"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.04]">
              <h3 className="text-sm font-bold text-slate-950 backoffice-dark:text-white">
                Thêm route
              </h3>
              <div className="mt-4 flex gap-2">
                <input
                  type="text"
                  value={routeInput}
                  onChange={(event) => setRouteInput(event.target.value)}
                  onKeyDown={(event) =>
                    event.key === "Enter" &&
                    (event.preventDefault(), handleAddRoute())
                  }
                  placeholder="/watch, /series, /comics..."
                  className="h-11 min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-3 font-mono text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-violet-500 focus:ring-4 focus:ring-violet-100 backoffice-dark:border-white/10 backoffice-dark:bg-black/30 backoffice-dark:text-white backoffice-dark:focus:ring-[rgba(212,175,55,0.16)]"
                />
                <button
                  type="button"
                  onClick={handleAddRoute}
                  className="inline-flex h-11 items-center gap-2 rounded-lg bg-violet-600 px-4 text-sm font-bold text-white transition hover:bg-violet-700 backoffice-dark:bg-[var(--backoffice-primary)] backoffice-dark:text-black backoffice-dark:hover:bg-[var(--backoffice-primary-bright)]"
                >
                  <Plus className="h-4 w-4" />
                  Thêm
                </button>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
                <label className="block">
                  <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500 backoffice-dark:text-white/45">
                    Thời gian chờ (ms)
                  </span>
                  <input
                    type="number"
                    value={delayMs}
                    onChange={(event) => setDelayMs(Number(event.target.value))}
                    min={0}
                    step={500}
                    className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 font-mono text-sm font-semibold text-slate-900 outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-100 backoffice-dark:border-white/10 backoffice-dark:bg-black/30 backoffice-dark:text-white backoffice-dark:focus:ring-[rgba(212,175,55,0.16)]"
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500 backoffice-dark:text-white/45">
                    Cooldown sau khi đóng (phút)
                  </span>
                  <input
                    type="number"
                    value={cooldownMinutes}
                    onChange={(event) =>
                      setCooldownMinutes(Number(event.target.value))
                    }
                    min={0}
                    step={1}
                    className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 font-mono text-sm font-semibold text-slate-900 outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-100 backoffice-dark:border-white/10 backoffice-dark:bg-black/30 backoffice-dark:text-white backoffice-dark:focus:ring-[rgba(212,175,55,0.16)]"
                  />
                </label>
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5 backoffice-dark:border-white/10 backoffice-dark:bg-black/20">
            <div className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500 backoffice-dark:text-white/45">
              Thêm nhanh
            </div>
            <div className="flex flex-wrap gap-2">
              {QUICK_ROUTES.map((route) => {
                const selected = editedRoutes.includes(route);

                return (
                  <button
                    key={route}
                    type="button"
                    onClick={() => {
                      if (!selected) {
                        setEditedRoutes([...editedRoutes, route]);
                      } else {
                        toast.info(`${route} đã có trong danh sách`);
                      }
                    }}
                    className={`rounded-full border px-3 py-1.5 font-mono text-xs font-bold transition ${selected
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700 backoffice-dark:border-emerald-400/30 backoffice-dark:bg-emerald-400/10 backoffice-dark:text-emerald-200"
                        : "border-slate-200 bg-white text-slate-600 hover:border-violet-300 hover:text-violet-600 backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.04] backoffice-dark:text-white/60 backoffice-dark:hover:text-white"
                      }`}
                  >
                    {selected ? "Đã thêm " : "+ "}
                    {route}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-6 flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 backoffice-dark:border-white/10 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={() => setEditedRoutes([])}
              className="inline-flex h-11 items-center justify-center rounded-lg border border-red-200 bg-red-50 px-4 text-sm font-bold text-red-600 transition hover:bg-red-100 backoffice-dark:border-red-400/30 backoffice-dark:bg-red-400/10 backoffice-dark:text-red-200"
            >
              Xóa tất cả routes
            </button>
            <button
              type="button"
              onClick={() =>
                updateConfigMutation.mutate({
                  allowedRoutes: editedRoutes,
                  showDelayMs: delayMs,
                  cooldownMinutes,
                })
              }
              disabled={updateConfigMutation.isPending}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-violet-600 px-6 text-sm font-bold text-white shadow-sm transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60 backoffice-dark:bg-[var(--backoffice-primary)] backoffice-dark:text-black backoffice-dark:hover:bg-[var(--backoffice-primary-bright)]"
            >
              {updateConfigMutation.isPending && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              Lưu cấu hình Popup
            </button>
          </div>

          {/* Card Cấu hình In-Video Preroll */}
          <div className="mt-8 border-t border-slate-200 pt-8 backoffice-dark:border-white/10">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-violet-100 p-2.5 text-violet-700 backoffice-dark:bg-white/10 backoffice-dark:text-[var(--backoffice-primary)]">
                <Video className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-950 backoffice-dark:text-white">
                  Cấu hình In-Video Preroll
                </h2>
                <p className="text-xs font-medium text-slate-500 backoffice-dark:text-white/55">
                  Cấu hình số giây bắt buộc xem trước khi hiện nút Skip và thời gian hồi (cooldown) chống spam F5.
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500 backoffice-dark:text-white/45">
                  Số giây xem trước khi hiện Skip (giây)
                </span>
                <input
                  type="number"
                  value={skipAfterSec}
                  onChange={(e) => setSkipAfterSec(Number(e.target.value))}
                  min={0}
                  step={1}
                  className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 font-mono text-sm font-semibold text-slate-900 outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-100 backoffice-dark:border-white/10 backoffice-dark:bg-black/30 backoffice-dark:text-white"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500 backoffice-dark:text-white/45">
                  Thời gian hồi / Chống spam F5 (giây)
                </span>
                <input
                  type="number"
                  value={inVideoCooldown}
                  onChange={(e) => setInVideoCooldown(Number(e.target.value))}
                  min={0}
                  step={5}
                  className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 font-mono text-sm font-semibold text-slate-900 outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-100 backoffice-dark:border-white/10 backoffice-dark:bg-black/30 backoffice-dark:text-white"
                />
              </label>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() =>
                  updateInVideoConfigMutation.mutate({
                    skipAfterSec,
                    cooldownSeconds: inVideoCooldown,
                  })
                }
                disabled={updateInVideoConfigMutation.isPending}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-violet-600 px-6 text-sm font-bold text-white shadow-sm transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60 backoffice-dark:bg-[var(--backoffice-primary)] backoffice-dark:text-black"
              >
                {updateInVideoConfigMutation.isPending && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
                Lưu cấu hình In-Video
              </button>
            </div>
          </div>
        </section>
      )}

      {activeTab === "SLOTS" && (
        <section className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
          {editingSlot && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.04]">
              <h2 className="text-lg font-bold text-slate-950 backoffice-dark:text-white">
                Cập nhật vị trí
              </h2>
              <p className="mt-1 text-sm font-medium text-slate-500 backoffice-dark:text-white/55">
                Điều chỉnh thông tin slot quảng cáo đang được hệ thống phục vụ.
              </p>

              <form
                onSubmit={handleCreateOrUpdateSlot}
                className="mt-5 grid gap-4 text-slate-900"
                key={editingSlot.slotId}
              >
                <SlotField label="Mã vị trí">
                  <input
                    name="codeName"
                    defaultValue={editingSlot.codeName}
                    placeholder="BANNER_HOME"
                    required
                    className={inputClassName}
                  />
                </SlotField>
                <SlotField label="Tên hiển thị">
                  <input
                    name="displayName"
                    defaultValue={editingSlot.displayName}
                    placeholder="Banner Trang Chủ"
                    required
                    className={inputClassName}
                  />
                </SlotField>
                <SlotField label="Loại hiển thị">
                  <select
                    name="type"
                    defaultValue={editingSlot.type}
                    required
                    className={inputClassName}
                  >
                    <option value="BANNER">Banner hình ảnh</option>
                    <option value="VIDEO">Video preroll</option>
                    <option value="POPUP">Popup</option>
                  </select>
                </SlotField>
                <SlotField label="Giá bán (VND)">
                  <input
                    name="price"
                    defaultValue={editingSlot.price}
                    type="number"
                    required
                    className={inputClassName}
                  />
                </SlotField>
                <SlotField label="Số views nhận được">
                  <input
                    name="totalViewOfPrice"
                    defaultValue={editingSlot.totalViewOfPrice}
                    type="number"
                    required
                    className={inputClassName}
                  />
                </SlotField>
                <SlotField label="Trạng thái">
                  <select
                    name="isActive"
                    defaultValue={editingSlot.isActive ? "true" : "false"}
                    className={inputClassName}
                  >
                    <option value="true">Đang kích hoạt</option>
                    <option value="false">Tạm ẩn</option>
                  </select>
                </SlotField>

                <div className="mt-2 flex gap-3">
                  <button
                    type="submit"
                    disabled={updateSlotMutation.isPending}
                    className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-lg bg-violet-600 px-4 text-sm font-bold text-white transition hover:bg-violet-700 disabled:opacity-60 backoffice-dark:bg-[var(--backoffice-primary)] backoffice-dark:text-black"
                  >
                    {updateSlotMutation.isPending && (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    )}
                    Lưu
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingSlot(null)}
                    className="h-11 flex-1 rounded-lg border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition hover:bg-slate-50 backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.04] backoffice-dark:text-white/70"
                  >
                    Hủy
                  </button>
                </div>
              </form>
            </div>
          )}

          <div
            className={`overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.04] ${editingSlot ? "" : "xl:col-span-2"
              }`}
          >
            <div className="border-b border-slate-200 px-6 py-4 backoffice-dark:border-white/10">
              <h2 className="text-lg font-bold text-slate-950 backoffice-dark:text-white">
                Danh sách vị trí
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500 backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.04] backoffice-dark:text-white/45">
                  <tr>
                    <th className="px-6 py-4">Code / Tên</th>
                    <th className="px-6 py-4">Loại</th>
                    <th className="px-6 py-4">Giá / Views</th>
                    <th className="px-6 py-4">Trạng thái</th>
                    <th className="px-6 py-4 text-right">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 backoffice-dark:divide-white/10">
                  {slots?.map((slot) => (
                    <tr
                      key={slot.slotId}
                      className={`transition hover:bg-slate-50/80 backoffice-dark:hover:bg-white/[0.05] ${!slot.isActive ? "opacity-60" : ""
                        }`}
                    >
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-950 backoffice-dark:text-white">
                          {slot.codeName}
                        </p>
                        <p className="mt-0.5 text-xs font-medium text-slate-400">
                          {slot.displayName}
                        </p>
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-600 backoffice-dark:text-white/65">
                        {getSlotTypeLabel(slot.type)}
                      </td>
                      <td className="px-6 py-4 font-semibold text-violet-600 backoffice-dark:text-[var(--backoffice-primary)]">
                        {formatCurrency(slot.price)} / {formatNumber(slot.totalViewOfPrice)}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${slot.isActive
                              ? getStatusClassName("ACTIVE")
                              : getStatusClassName("PAUSED")
                            }`}
                        >
                          {slot.isActive ? "Đang bật" : "Đang ẩn"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <ActionButton
                            onClick={() => setEditingSlot(slot)}
                            title="Sửa"
                          >
                            <Edit className="h-4 w-4" />
                          </ActionButton>
                          <ActionButton
                            onClick={() =>
                              patchSlotStatusMutation.mutate({
                                id: slot.slotId,
                                isActive: !slot.isActive,
                              })
                            }
                            title={slot.isActive ? "Tắt" : "Bật"}
                            className={
                              slot.isActive
                                ? "hover:bg-amber-50 hover:text-amber-600"
                                : "hover:bg-emerald-50 hover:text-emerald-600"
                            }
                          >
                            {slot.isActive ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </ActionButton>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {(!slots || slots.length === 0) && (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-6 py-14 text-center text-sm font-medium text-slate-500"
                      >
                        Không có slot quảng cáo.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {activeTab === "PENDING" && (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.04]">
          <h2 className="text-lg font-bold text-slate-950 backoffice-dark:text-white">
            Duyệt chiến dịch chờ
          </h2>
          <div className="mt-5 grid gap-4">
            {pendingCampaigns?.map((campaign) => (
              <div
                key={campaign.campaignId}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-5 transition hover:bg-white backoffice-dark:border-white/10 backoffice-dark:bg-black/20 backoffice-dark:hover:bg-white/[0.05]"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-slate-950 backoffice-dark:text-white">
                      {campaign.name}
                    </h3>
                    <p className="mt-1 text-sm font-medium text-slate-500 backoffice-dark:text-white/55">
                      Mục tiêu: {formatNumber(campaign.targetImpressions)} views
                    </p>
                    <p className="mt-1 text-sm font-semibold text-violet-600 backoffice-dark:text-[var(--backoffice-primary)]">
                      Ngân sách: {formatCurrency(campaign.totalBudget)}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        reviewCampaignMutation.mutate({
                          id: campaign.campaignId,
                          status: "ACTIVE",
                        })
                      }
                      disabled={reviewCampaignMutation.isPending}
                      className="inline-flex h-10 items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 text-sm font-bold text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-60 backoffice-dark:border-emerald-400/30 backoffice-dark:bg-emerald-400/10 backoffice-dark:text-emerald-200"
                    >
                      <Check className="h-4 w-4" />
                      Duyệt
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const note = prompt(
                          "Lý do từ chối (User sẽ được hoàn tiền):",
                        );
                        if (note) {
                          reviewCampaignMutation.mutate({
                            id: campaign.campaignId,
                            status: "REJECTED",
                            note,
                          });
                        }
                      }}
                      disabled={reviewCampaignMutation.isPending}
                      className="inline-flex h-10 items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 text-sm font-bold text-red-700 transition hover:bg-red-100 disabled:opacity-60 backoffice-dark:border-red-400/30 backoffice-dark:bg-red-400/10 backoffice-dark:text-red-200"
                    >
                      <X className="h-4 w-4" />
                      Từ chối
                    </button>
                  </div>
                </div>

                {campaign.creatives && campaign.creatives.length > 0 && (
                  <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4 text-sm backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.04]">
                    <button
                      type="button"
                      onClick={() =>
                        setPreviewMedia({
                          url: campaign.creatives[0].mediaUrl,
                          type: campaign.creatives[0].mediaType,
                        })
                      }
                      className="font-bold text-violet-600 transition hover:text-violet-700 backoffice-dark:text-[var(--backoffice-primary)]"
                    >
                      Xem media đính kèm ({campaign.creatives[0].mediaType})
                    </button>
                    <p className="mt-2 break-all text-xs font-medium text-slate-500 backoffice-dark:text-white/55">
                      Link đích:{" "}
                      <a
                        href={campaign.creatives[0].targetUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-violet-600 hover:underline backoffice-dark:text-[var(--backoffice-primary)]"
                      >
                        {campaign.creatives[0].targetUrl}
                      </a>
                    </p>
                  </div>
                )}
              </div>
            ))}

            {(!pendingCampaigns || pendingCampaigns.length === 0) && (
              <EmptyState>Không có chiến dịch nào đang chờ duyệt.</EmptyState>
            )}
          </div>
        </section>
      )}

      {activeTab === "ALL" && (
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.04]">
          <div className="border-b border-slate-200 px-6 py-4 backoffice-dark:border-white/10">
            <h2 className="text-lg font-bold text-slate-950 backoffice-dark:text-white">
              Tất cả chiến dịch
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500 backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.04] backoffice-dark:text-white/45">
                <tr>
                  <th className="px-6 py-4">Tên chiến dịch</th>
                  <th className="px-6 py-4">Ngân sách</th>
                  <th className="px-6 py-4">Trạng thái</th>
                  <th className="px-6 py-4 text-right">Điều khiển</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 backoffice-dark:divide-white/10">
                {allCampaigns?.map((campaign) => (
                  <tr
                    key={campaign.campaignId}
                    className="transition hover:bg-slate-50/80 backoffice-dark:hover:bg-white/[0.05]"
                  >
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-950 backoffice-dark:text-white">
                        {campaign.name}
                      </p>
                      <p className="mt-0.5 text-xs font-medium text-slate-400">
                        Mục tiêu: {formatNumber(campaign.targetImpressions)} views
                      </p>
                    </td>
                    <td className="px-6 py-4 font-semibold text-violet-600 backoffice-dark:text-[var(--backoffice-primary)]">
                      {formatCurrency(campaign.totalBudget)}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${getStatusClassName(
                          campaign.status,
                        )}`}
                      >
                        {getStatusLabel(campaign.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        <ActionButton
                          onClick={() =>
                            setPreviewMedia(
                              campaign.creatives && campaign.creatives.length > 0
                                ? {
                                  url: campaign.creatives[0].mediaUrl,
                                  type: campaign.creatives[0].mediaType,
                                }
                                : null,
                            )
                          }
                          title="Xem media"
                        >
                          <Eye className="h-5 w-5" />
                        </ActionButton>
                        {(campaign.status === "ACTIVE" ||
                          campaign.status === "PAUSED") && (
                            <ActionButton
                              onClick={() =>
                                patchCampaignStatusMutation.mutate({
                                  id: campaign.campaignId,
                                  status:
                                    campaign.status === "ACTIVE"
                                      ? "PAUSED"
                                      : "ACTIVE",
                                })
                              }
                              disabled={patchCampaignStatusMutation.isPending}
                              className={
                                campaign.status === "ACTIVE"
                                  ? "hover:bg-amber-50 hover:text-amber-600"
                                  : "hover:bg-emerald-50 hover:text-emerald-600"
                              }
                              title={
                                campaign.status === "ACTIVE"
                                  ? "Tạm dừng quảng cáo"
                                  : "Tiếp tục quảng cáo"
                              }
                            >
                              {campaign.status === "ACTIVE" ? (
                                <PauseCircle className="h-5 w-5" />
                              ) : (
                                <PlayCircle className="h-5 w-5" />
                              )}
                            </ActionButton>
                          )}
                      </div>
                    </td>
                  </tr>
                ))}
                {(!allCampaigns || allCampaigns.length === 0) && (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-6 py-14 text-center text-sm font-medium text-slate-500"
                    >
                      Không có dữ liệu.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <Dialog
        open={!!previewMedia}
        onOpenChange={(open) => !open && setPreviewMedia(null)}
      >
        <DialogContent className="border-white/10 bg-[#1f1f1f] text-white sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Xem trước Media</DialogTitle>
          </DialogHeader>
          <div className="mt-4 flex min-h-[300px] items-center justify-center overflow-hidden rounded-lg bg-black">
            {previewMedia?.type === "VIDEO" ? (
              <video
                src={previewMedia.url}
                controls
                className="h-auto max-h-[70vh] w-auto max-w-full"
              />
            ) : previewMedia ? (
              // eslint-disable-next-line @next/next/no-img-element -- Admin preview uses backend-provided ad media URLs.
              <img
                src={previewMedia.url}
                alt="Ad Preview"
                className="max-h-[70vh] max-w-full object-contain"
              />
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

const inputClassName =
  "h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-violet-500 focus:ring-4 focus:ring-violet-100 backoffice-dark:border-white/10 backoffice-dark:bg-black/30 backoffice-dark:text-white backoffice-dark:focus:ring-[rgba(212,175,55,0.16)]";

function SlotField({
  children,
  label,
}: {
  children: ReactNode;
  label: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold text-slate-700 backoffice-dark:text-white/75">
        {label}
      </span>
      {children}
    </label>
  );
}
