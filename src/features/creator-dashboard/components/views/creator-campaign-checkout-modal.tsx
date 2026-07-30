"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
    AlertCircle,
    BookOpen,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    Film,
    Loader2,
    ReceiptText,
    X,
} from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Badge } from "@/shared/ui/badge";
import { getApiErrorMessage } from "@/shared/api/http-client";
import {
    useCreateEngagementOrder,
    useGetCreatorCampaignPublishedSeries,
} from "@/features/creator-dashboard/hooks/use-creator-campaigns";
import type { SeriesResponse } from "@/features/creator-dashboard/api/creator-content-api";
import type { CreatorCampaignService } from "@/features/creator-dashboard/types/creator-campaigns.types";

type CreatorCampaignCheckoutModalProps = {
    open: boolean;
    plan: CreatorCampaignService | null;
    onOpenChange: (open: boolean) => void;
};

const SERIES_PAGE_SIZE = 6;

const formatPrice = (price: number) =>
    new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
        maximumFractionDigits: 0,
    }).format(price);

function getSeriesImage(series: SeriesResponse) {
    return series.bannerUrl || series.coverUrl || "";
}

export function CreatorCampaignCheckoutModal({
    open,
    plan,
    onOpenChange,
}: CreatorCampaignCheckoutModalProps) {
    const router = useRouter();
    const [page, setPage] = useState(1);
    const [selectedSeriesIds, setSelectedSeriesIds] = useState<string[]>([]);
    const [formError, setFormError] = useState<string | null>(null);
    const createOrderMutation = useCreateEngagementOrder();

    const seriesQuery = useGetCreatorCampaignPublishedSeries(
        {
            statuses: ["PUBLISHED"],
            page,
            pageSize: SERIES_PAGE_SIZE,
        },
        open,
    );

    const seriesList = seriesQuery.data?.content ?? [];
    const totalPages = Math.max(seriesQuery.data?.totalPages ?? 1, 1);
    const selectedCount = selectedSeriesIds.length;

    const selectedSeries = useMemo(
        () =>
            seriesList.filter((series) =>
                selectedSeriesIds.includes(series.seriesId),
            ),
        [selectedSeriesIds, seriesList],
    );

    if (!open || !plan) {
        return null;
    }

    const toggleSeries = (seriesId: string) => {
        setFormError(null);
        setSelectedSeriesIds((current) =>
            current.includes(seriesId)
                ? current.filter((id) => id !== seriesId)
                : [...current, seriesId],
        );
    };

    const handleClose = () => {
        if (createOrderMutation.isPending) return;
        setSelectedSeriesIds([]);
        setFormError(null);
        setPage(1);
        onOpenChange(false);
    };

    const handleCheckout = () => {
        if (selectedSeriesIds.length === 0) {
            setFormError("Vui lòng chọn ít nhất một nội dung để áp dụng gói.");
            return;
        }

        createOrderMutation.mutate(
            {
                engagementServiceId: plan.engagementServiceId,
                seriesIds: selectedSeriesIds,
            },
            {
                onSuccess: (order) => {
                    if (!order?.orderId) {
                        setFormError("Không nhận được mã đơn hàng. Vui lòng thử lại.");
                        return;
                    }

                    onOpenChange(false);
                    router.push(`/checkout-engagement?orderId=${order.orderId}`);
                },
                onError: (error) => {
                    setFormError(getApiErrorMessage(error));
                },
            },
        );
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-4 py-6 backdrop-blur-xl">
            <div className="relative flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-[30px] border border-white/10 bg-[#0d0d0f] shadow-[0_30px_100px_rgba(0,0,0,0.55)]">
                <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-yellow-400/10 blur-3xl" />
                <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(212,175,55,0.08),transparent_38%,rgba(59,130,246,0.06))]" />

                <div className="relative flex items-start justify-between gap-5 border-b border-white/10 p-5 md:p-6">
                    <div className="flex items-start gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-yellow-400/25 bg-yellow-400/10 text-yellow-300">
                            <ReceiptText className="h-6 w-6" />
                        </div>
                        <div>
                            <Badge className="border-yellow-400/30 bg-yellow-400/10 text-yellow-200">
                                Gói tăng tương tác
                            </Badge>
                            <h2 className="mt-3 text-2xl font-black text-white md:text-3xl">
                                {plan.name}
                            </h2>
                            <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-zinc-400">
                                {plan.description}
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={handleClose}
                        className="rounded-full border border-white/10 bg-white/[0.04] p-2 text-zinc-400 transition hover:bg-white/10 hover:text-white"
                        aria-label="Đóng"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="relative grid min-h-0 flex-1 gap-5 overflow-y-auto p-5 md:p-6 lg:grid-cols-[minmax(0,1fr)_320px]">
                    <section className="min-h-0 rounded-[24px] border border-white/10 bg-white/[0.035] p-4">
                        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                            <div>
                                <h3 className="text-lg font-black text-white">
                                    Chọn nội dung áp dụng
                                </h3>
                                <p className="mt-1 text-sm font-semibold text-zinc-500">
                                    Chỉ hiển thị series đã xuất bản của creator hiện tại.
                                </p>
                            </div>
                            <Badge className="w-fit border-white/10 bg-white/[0.06] text-zinc-300">
                                Đã chọn {selectedCount}
                            </Badge>
                        </div>

                        {seriesQuery.isLoading ? (
                            <div className="grid gap-3 md:grid-cols-2">
                                {Array.from({ length: 6 }).map((_, index) => (
                                    <div
                                        key={index}
                                        className="h-28 animate-pulse rounded-2xl bg-white/[0.06]"
                                    />
                                ))}
                            </div>
                        ) : seriesQuery.isError ? (
                            <div className="rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-sm font-semibold text-red-200">
                                <AlertCircle className="mr-2 inline h-4 w-4" />
                                Không thể tải danh sách nội dung. Vui lòng thử lại.
                            </div>
                        ) : seriesList.length === 0 ? (
                            <div className="rounded-2xl border border-white/10 bg-black/25 p-8 text-center text-sm font-semibold text-zinc-400">
                                Bạn chưa có series nào đang xuất bản.
                            </div>
                        ) : (
                            <div className="grid gap-3 md:grid-cols-2">
                                {seriesList.map((series) => {
                                    const isSelected = selectedSeriesIds.includes(
                                        series.seriesId,
                                    );
                                    const ImageIcon =
                                        series.contentType === "COMIC" ? BookOpen : Film;
                                    const imageUrl = getSeriesImage(series);

                                    return (
                                        <button
                                            key={series.seriesId}
                                            type="button"
                                            onClick={() => toggleSeries(series.seriesId)}
                                            className={`group relative overflow-hidden rounded-2xl border p-3 text-left transition hover:-translate-y-0.5 ${
                                                isSelected
                                                    ? "border-yellow-400/70 bg-yellow-400/10"
                                                    : "border-white/10 bg-black/25 hover:border-yellow-400/35 hover:bg-white/[0.055]"
                                            }`}
                                        >
                                            <div className="flex gap-3">
                                                <div className="relative h-20 w-28 shrink-0 overflow-hidden rounded-xl bg-white/[0.06]">
                                                    {imageUrl ? (
                                                        // eslint-disable-next-line @next/next/no-img-element
                                                        <img
                                                            src={imageUrl}
                                                            alt={series.title}
                                                            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                                                        />
                                                    ) : (
                                                        <div className="flex h-full w-full items-center justify-center text-zinc-500">
                                                            <ImageIcon className="h-6 w-6" />
                                                        </div>
                                                    )}
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <Badge className="border-yellow-400/20 bg-yellow-400/10 text-[10px] uppercase tracking-[0.14em] text-yellow-200">
                                                            {series.contentType === "COMIC"
                                                                ? "Truyện"
                                                                : "Video"}
                                                        </Badge>
                                                        <span className="text-xs font-semibold text-zinc-500">
                                                            {series.status}
                                                        </span>
                                                    </div>
                                                    <p className="mt-2 line-clamp-1 text-base font-black text-white">
                                                        {series.title}
                                                    </p>
                                                    <p className="mt-1 line-clamp-2 text-xs font-semibold leading-5 text-zinc-500">
                                                        {series.description ||
                                                            "Chưa có mô tả nội dung."}
                                                    </p>
                                                </div>
                                                <span
                                                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border ${
                                                        isSelected
                                                            ? "border-yellow-400 bg-yellow-400 text-black"
                                                            : "border-white/15 bg-black/30 text-zinc-500"
                                                    }`}
                                                >
                                                    <CheckCircle2 className="h-4 w-4" />
                                                </span>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        )}

                        <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-4">
                            <p className="text-sm font-semibold text-zinc-500">
                                Trang {seriesQuery.data?.pageNumber ?? page}/{totalPages}
                            </p>
                            <div className="flex gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="border-white/10 bg-white/[0.04] text-zinc-200 hover:bg-white/10"
                                    disabled={page <= 1 || seriesQuery.isFetching}
                                    onClick={() => setPage((current) => Math.max(1, current - 1))}
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="border-white/10 bg-white/[0.04] text-zinc-200 hover:bg-white/10"
                                    disabled={page >= totalPages || seriesQuery.isFetching}
                                    onClick={() =>
                                        setPage((current) => Math.min(totalPages, current + 1))
                                    }
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </section>

                    <aside className="rounded-[24px] border border-yellow-400/20 bg-black/30 p-5">
                        <p className="text-xs font-black uppercase tracking-[0.28em] text-yellow-300">
                            Tóm tắt đơn hàng
                        </p>
                        <h3 className="mt-3 text-xl font-black text-white">
                            {plan.name}
                        </h3>
                        <div className="mt-5 space-y-3 border-y border-white/10 py-5 text-sm font-semibold">
                            <div className="flex justify-between gap-4">
                                <span className="text-zinc-500">Mục tiêu</span>
                                <span className="text-white">{plan.targetValue} lượt</span>
                            </div>
                            <div className="flex justify-between gap-4">
                                <span className="text-zinc-500">Nội dung</span>
                                <span className="text-white">{selectedCount} series</span>
                            </div>
                            <div className="flex justify-between gap-4">
                                <span className="text-zinc-500">Tổng tiền</span>
                                <span className="text-yellow-200">{formatPrice(plan.price)}</span>
                            </div>
                        </div>

                        {selectedSeries.length > 0 && (
                            <div className="mt-5 space-y-2">
                                <p className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-500">
                                    Đã chọn
                                </p>
                                {selectedSeries.slice(0, 3).map((series) => (
                                    <p
                                        key={series.seriesId}
                                        className="line-clamp-1 rounded-xl bg-white/[0.045] px-3 py-2 text-sm font-semibold text-zinc-300"
                                    >
                                        {series.title}
                                    </p>
                                ))}
                            </div>
                        )}

                        {formError && (
                            <div className="mt-5 rounded-2xl border border-red-400/20 bg-red-500/10 p-3 text-sm font-semibold text-red-200">
                                {formError}
                            </div>
                        )}

                        <div className="mt-6 grid gap-3">
                            <Button
                                type="button"
                                className="h-12 rounded-2xl bg-yellow-400 font-black text-black hover:bg-yellow-300"
                                disabled={createOrderMutation.isPending}
                                onClick={handleCheckout}
                            >
                                {createOrderMutation.isPending ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : null}
                                Thanh toán
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                className="h-12 rounded-2xl border-white/10 bg-white/[0.04] font-black text-zinc-200 hover:bg-white/10"
                                disabled={createOrderMutation.isPending}
                                onClick={handleClose}
                            >
                                Hủy thanh toán
                            </Button>
                        </div>
                    </aside>
                </div>
            </div>
        </div>
    );
}
