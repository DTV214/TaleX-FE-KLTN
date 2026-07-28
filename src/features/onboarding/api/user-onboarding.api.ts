"use client";

import axios from "axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  httpClient,
  type BasePageResponse,
  type BaseResponse,
} from "@/shared/api/http-client";

const USER_FEATURE_ENDPOINT = "/api/v1/mongo/features/user";
const PUBLIC_CATEGORIES_ENDPOINT = "/api/v1/public/categories";
const PUBLIC_TAGS_ENDPOINT = "/api/v1/public/tags";

export type OnboardingGender = "MALE" | "FEMAL" | "UNKNOWN";

export type UserFeatureProfile = {
  accountId?: string;
  language?: string;
  gender?: OnboardingGender;
  age?: number;
  onboardingMovieGeneres?: string[];
  onboardingGenres?: string[];
  onboardingTags?: string[];
  onboardingMovieGenres?: string[];
  onboardingComicGenres?: string[];
  interactions?: {
    totalClicks?: number;
    totalLikes?: number;
    totalBookmarks?: number;
    totalShares?: number;
    totalComments?: number;
  };
};

export type UserFeatureRequest = {
  gender: OnboardingGender;
  age: number;
  onboardingMovieGeneres: string[];
  onboardingGenres: string[];
  onboardingTags: string[];
  // Compatibility aliases for the current Swagger contract.
  onboardingMovieGenres: string[];
  onboardingComicGenres: string[];
};

export type PublicCategoryOption = {
  id: string;
  name: string;
  description?: string;
};

export type PublicTagOption = {
  id: string;
  name: string;
  description?: string;
};

type CategoryApiItem = {
  id?: string;
  categoryId?: string;
  name?: string;
  categoryName?: string;
  description?: string;
};

type TagApiItem = {
  id?: string;
  tagId?: string;
  name?: string;
  tagName?: string;
  description?: string;
};

type FlexibleListPayload<T> = T[] | BasePageResponse<T>;

export const userOnboardingKeys = {
  all: ["user-onboarding"] as const,
  me: () => [...userOnboardingKeys.all, "me"] as const,
  categories: () => [...userOnboardingKeys.all, "categories"] as const,
  tags: () => [...userOnboardingKeys.all, "tags"] as const,
};

function extractList<T>(payload: FlexibleListPayload<T>) {
  return Array.isArray(payload) ? payload : payload.content;
}

function normalizeCategory(item: CategoryApiItem): PublicCategoryOption | null {
  const id = item.categoryId ?? item.id;
  const name = item.categoryName ?? item.name;

  if (!id || !name) {
    return null;
  }

  return {
    id,
    name,
    description: item.description,
  };
}

function normalizeTag(item: TagApiItem): PublicTagOption | null {
  const id = item.tagId ?? item.id;
  const name = item.tagName ?? item.name;

  if (!id || !name) {
    return null;
  }

  return {
    id,
    name,
    description: item.description,
  };
}

export function isMissingUserFeatureError(error: unknown) {
  return axios.isAxiosError(error) && error.response?.status === 404;
}

export function useUserFeatureProfile(enabled: boolean) {
  return useQuery({
    queryKey: userOnboardingKeys.me(),
    queryFn: async (): Promise<UserFeatureProfile> => {
      const response = await httpClient.get<BaseResponse<UserFeatureProfile>>(
        USER_FEATURE_ENDPOINT,
      );
      return response.data.data;
    },
    enabled,
    retry: false,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
}

export function usePublicOnboardingCategories(enabled: boolean) {
  return useQuery({
    queryKey: userOnboardingKeys.categories(),
    queryFn: async (): Promise<PublicCategoryOption[]> => {
      const response = await httpClient.get<
        BaseResponse<FlexibleListPayload<CategoryApiItem>>
      >(PUBLIC_CATEGORIES_ENDPOINT, {
        params: { page: 1, pageSize: 100 },
      });

      return extractList(response.data.data)
        .map(normalizeCategory)
        .filter((item): item is PublicCategoryOption => Boolean(item));
    },
    enabled,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
}

export function usePublicOnboardingTags(enabled: boolean) {
  return useQuery({
    queryKey: userOnboardingKeys.tags(),
    queryFn: async (): Promise<PublicTagOption[]> => {
      const response = await httpClient.get<
        BaseResponse<FlexibleListPayload<TagApiItem>>
      >(PUBLIC_TAGS_ENDPOINT, {
        params: { page: 1, pageSize: 100 },
      });

      return extractList(response.data.data)
        .map(normalizeTag)
        .filter((item): item is PublicTagOption => Boolean(item));
    },
    enabled,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
}

export function useCreateUserFeatureProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      payload: UserFeatureRequest,
    ): Promise<UserFeatureProfile> => {
      const response = await httpClient.post<BaseResponse<UserFeatureProfile>>(
        USER_FEATURE_ENDPOINT,
        payload,
      );
      return response.data.data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(userOnboardingKeys.me(), data);
    },
  });
}
