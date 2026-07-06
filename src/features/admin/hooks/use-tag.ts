"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createTag,
  deleteTag,
  getTags,
  hideTag,
  unhideTag,
  updateTag,
  type TagPayload,
} from "@/features/admin/api/tag.api";

export const tagKeys = {
  all: ["admin", "tags"] as const,
  lists: () => [...tagKeys.all, "list"] as const,
};

export function useGetTags() {
  return useQuery({
    queryKey: tagKeys.lists(),
    queryFn: getTags,
    staleTime: 60 * 1000,
  });
}

export function useCreateTag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: TagPayload) => createTag(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tagKeys.lists() });
    },
  });
}

export function useUpdateTag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: TagPayload }) =>
      updateTag(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tagKeys.lists() });
    },
  });
}

export function useDeleteTag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteTag(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tagKeys.lists() });
    },
  });
}

export function useToggleTagStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, hidden }: { id: string; hidden: boolean }) =>
      hidden ? unhideTag(id) : hideTag(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tagKeys.lists() });
    },
  });
}
