"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createViolationLabelTranslation,
  deleteViolationLabelTranslation,
  getViolationLabelTranslations,
  updateViolationLabelTranslation,
  type ViolationLabelTranslationCreatePayload,
  type ViolationLabelTranslationUpdatePayload,
} from "@/features/admin/api/violation-label-translation.api";

export const violationLabelTranslationKeys = {
  all: ["admin", "violation-label-translations"] as const,
  lists: () => [...violationLabelTranslationKeys.all, "list"] as const,
};

export function useGetViolationLabelTranslations() {
  return useQuery({
    queryKey: violationLabelTranslationKeys.lists(),
    queryFn: getViolationLabelTranslations,
    staleTime: 60 * 1000,
  });
}

export function useCreateViolationLabelTranslation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ViolationLabelTranslationCreatePayload) =>
      createViolationLabelTranslation(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: violationLabelTranslationKeys.lists() });
    },
  });
}

export function useUpdateViolationLabelTranslation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: ViolationLabelTranslationUpdatePayload;
    }) => updateViolationLabelTranslation(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: violationLabelTranslationKeys.lists() });
    },
  });
}

export function useDeleteViolationLabelTranslation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteViolationLabelTranslation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: violationLabelTranslationKeys.lists() });
    },
  });
}
