"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/shared/api/http-client";
import {
  assignTicket,
  createAppeal,
  createReport,
  exportReportedContentOrders,
  getAppealByPenalty,
  getMyAppeals,
  getMyPenalties,
  getMyReports,
  getModerationAccount,
  getModerationTargetDetail,
  getModerationStaffAccount,
  getPenalty,
  processAppeal,
  processTicket,
  revokePenalty,
  searchAppeals,
  searchPenalties,
  searchTickets,
  type AppealSearchParams,
  type CreateAppealRequest,
  type CreateReportRequest,
  type ModerationTicket,
  type PenaltySearchParams,
  type ProcessAppealRequest,
  type ReportTargetType,
  type ReportedContentExportRequest,
  type TicketProcessRequest,
  type TicketSearchParams,
} from "../api/moderation-reports.api";

export const moderationReportKeys = {
  all: ["moderation-reports"] as const,
  myReports: (params?: Record<string, unknown>) =>
    [...moderationReportKeys.all, "my-reports", params] as const,
  tickets: (params?: Record<string, unknown>) =>
    [...moderationReportKeys.all, "tickets", params] as const,
  targetDetail: (targetType?: string | null, targetId?: string | null) =>
    [...moderationReportKeys.all, "target-detail", targetType, targetId] as const,
  staffAccount: (accountId?: string | null) =>
    [...moderationReportKeys.all, "staff-account", accountId] as const,
  account: (accountId?: string | null) =>
    [...moderationReportKeys.all, "account", accountId] as const,
  penalties: (params?: Record<string, unknown>) =>
    [...moderationReportKeys.all, "penalties", params] as const,
  myPenalties: (params?: Record<string, unknown>) =>
    [...moderationReportKeys.all, "my-penalties", params] as const,
  penalty: (penaltyId?: string | null) =>
    [...moderationReportKeys.all, "penalty", penaltyId] as const,
  appeals: (params?: Record<string, unknown>) =>
    [...moderationReportKeys.all, "appeals", params] as const,
  myAppeals: (params?: Record<string, unknown>) =>
    [...moderationReportKeys.all, "my-appeals", params] as const,
  appealByPenalty: (penaltyId?: string | null) =>
    [...moderationReportKeys.all, "appeal-by-penalty", penaltyId] as const,
};

function invalidateModeration(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: moderationReportKeys.all });
}

export function useCreateReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateReportRequest) => createReport(payload),
    onSuccess: () => {
      toast.success("Đã gửi báo cáo. TaleX sẽ kiểm tra nội dung này.");
      invalidateModeration(queryClient);
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });
}

export function useMyReports(params?: { page?: number; pageSize?: number }) {
  return useQuery({
    queryKey: moderationReportKeys.myReports(params),
    queryFn: () => getMyReports(params),
  });
}

export function useTickets(params: TicketSearchParams) {
  return useQuery({
    queryKey: moderationReportKeys.tickets(params),
    queryFn: () => searchTickets(params),
  });
}

type ModerationTargetRef = {
  targetType?: ReportTargetType | null;
  targetId?: string | null;
};

export function useModerationTargetDetail(
  target?: ModerationTicket | ModerationTargetRef | null,
) {
  const canFetch =
    Boolean(target?.targetId) &&
    (target?.targetType === "ACCOUNT" ||
      target?.targetType === "SERIES" ||
      target?.targetType === "EPISODE" ||
      target?.targetType === "COMMENT");

  return useQuery({
    queryKey: moderationReportKeys.targetDetail(
      target?.targetType,
      target?.targetId,
    ),
    queryFn: () =>
      getModerationTargetDetail(target!.targetType!, target!.targetId!),
    enabled: canFetch,
    retry: false,
    staleTime: 60 * 1000,
  });
}

export function useModerationStaffAccount(accountId?: string | null) {
  return useQuery({
    queryKey: moderationReportKeys.staffAccount(accountId),
    queryFn: () => getModerationStaffAccount(accountId!),
    enabled: Boolean(accountId),
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
}

export function useModerationAccount(accountId?: string | null) {
  return useQuery({
    queryKey: moderationReportKeys.account(accountId),
    queryFn: () => getModerationAccount(accountId!),
    enabled: Boolean(accountId),
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
}

export function useAssignTicket() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ticketId: string) => assignTicket(ticketId),
    onSuccess: () => {
      toast.success("Đã nhận xử lý ticket.");
      invalidateModeration(queryClient);
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });
}

export function useProcessTicket(ticketId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: TicketProcessRequest) => {
      if (!ticketId) throw new Error("Thiếu mã ticket.");
      return processTicket(ticketId, payload);
    },
    onSuccess: () => {
      toast.success("Đã cập nhật kết quả xử lý ticket.");
      invalidateModeration(queryClient);
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });
}

export function useExportReportedContentOrders() {
  return useMutation({
    mutationFn: (payload: ReportedContentExportRequest) =>
      exportReportedContentOrders(payload),
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });
}

export function usePenalties(params: PenaltySearchParams) {
  return useQuery({
    queryKey: moderationReportKeys.penalties(params),
    queryFn: () => searchPenalties(params),
  });
}

export function useMyPenalties(params?: { page?: number; pageSize?: number }) {
  return useQuery({
    queryKey: moderationReportKeys.myPenalties(params),
    queryFn: () => getMyPenalties(params),
  });
}

export function usePenalty(penaltyId?: string | null) {
  return useQuery({
    queryKey: moderationReportKeys.penalty(penaltyId),
    queryFn: () => getPenalty(penaltyId!),
    enabled: Boolean(penaltyId),
  });
}

export function useRevokePenalty() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ penaltyId, reason }: { penaltyId: string; reason: string }) =>
      revokePenalty(penaltyId, reason),
    onSuccess: () => {
      toast.success("Đã gỡ hình phạt thủ công.");
      invalidateModeration(queryClient);
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });
}

export function useCreateAppeal(penaltyId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateAppealRequest) => {
      if (!penaltyId) throw new Error("Thiếu mã hình phạt.");
      return createAppeal(penaltyId, payload);
    },
    onSuccess: () => {
      toast.success("Đã gửi khiếu nại đến đội ngũ quản trị.");
      invalidateModeration(queryClient);
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });
}

export function useMyAppeals(params?: { page?: number; pageSize?: number }) {
  return useQuery({
    queryKey: moderationReportKeys.myAppeals(params),
    queryFn: () => getMyAppeals(params),
  });
}

export function useAppealByPenalty(penaltyId?: string | null) {
  return useQuery({
    queryKey: moderationReportKeys.appealByPenalty(penaltyId),
    queryFn: () => getAppealByPenalty(penaltyId!),
    enabled: Boolean(penaltyId),
    retry: false,
  });
}

export function useAppeals(params: AppealSearchParams) {
  return useQuery({
    queryKey: moderationReportKeys.appeals(params),
    queryFn: () => searchAppeals(params),
  });
}

export function useProcessAppeal(appealId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ProcessAppealRequest) => {
      if (!appealId) throw new Error("Thiếu mã khiếu nại.");
      return processAppeal(appealId, payload);
    },
    onSuccess: () => {
      toast.success("Đã cập nhật kết quả khiếu nại.");
      invalidateModeration(queryClient);
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });
}
