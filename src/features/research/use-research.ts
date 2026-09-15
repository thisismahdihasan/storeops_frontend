"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { ApiError } from "@/lib/api";
import { notificationKeys } from "@/features/notifications/notifications.keys";

import {
  createResearchItem,
  deleteResearchItem,
  getResearchItemById,
  getResearchItems,
  getResearchReferenceImageBlob,
  reassignResearchDesigner,
  previewResearchItem,
  syncResearchAssignments,
  updateResearchItemTitle,
  uploadResearchReferenceImage,
} from "./research.api";
import type {
  CreateResearchInput,
  ResearchListFilterParams,
} from "./research.types";

export type ResearchListScope = "management" | "my-work";

export const researchKeys = {
  all: ["research"] as const,
  detail: (workspaceId: string, researchItemId: string) =>
    ["research", workspaceId, "detail", researchItemId] as const,
  details: (workspaceId: string) =>
    ["research", workspaceId, "detail"] as const,
  list: (
    workspaceId: string,
    scope: ResearchListScope,
    filter?: ResearchListFilterParams,
  ) => ["research", workspaceId, "list", scope, filter ?? {}] as const,
  lists: (workspaceId: string) =>
    ["research", workspaceId, "list"] as const,
  referenceImage: (workspaceId: string, researchItemId: string) =>
    ["research", workspaceId, "reference-image", researchItemId] as const,
  workspace: (workspaceId: string) =>
    ["research", workspaceId] as const,
};

function isAuthError(error: unknown) {
  return error instanceof ApiError && (error.status === 401 || error.status === 403);
}

export function useResearchItems(
  workspaceId: string,
  filter?: ResearchListFilterParams,
  enabled = true,
  scope: ResearchListScope = "management",
) {
  return useQuery({
    enabled: enabled && workspaceId.length > 0,
    queryFn: () => getResearchItems(workspaceId, filter),
    queryKey: researchKeys.list(workspaceId, scope, filter),
    retry: (failureCount, error) => !isAuthError(error) && failureCount < 1,
    staleTime: 15_000,
  });
}

export function useResearchItemDetail(
  workspaceId: string,
  researchItemId?: string | null,
  enabled = true,
) {
  const hasId = typeof researchItemId === "string" && researchItemId.length > 0;

  return useQuery({
    enabled: enabled && workspaceId.length > 0 && hasId,
    queryFn: () => getResearchItemById(workspaceId, researchItemId!),
    queryKey: researchKeys.detail(workspaceId, researchItemId ?? ""),
    retry: (failureCount, error) => !isAuthError(error) && failureCount < 1,
    staleTime: 30_000,
  });
}

export function useCreateResearchItem(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateResearchInput) =>
      createResearchItem(workspaceId, input),
    onSuccess: () => {
      // Invalidate research list
      void queryClient.invalidateQueries({
        queryKey: researchKeys.lists(workspaceId),
      });

      // Invalidate dashboard overview pipeline so metrics stay up to date
      void queryClient.invalidateQueries({
        queryKey: ["dashboard", workspaceId],
      });
    },
  });
}

export function usePreviewResearch(workspaceId: string) {
  return useMutation({
    mutationFn: (etsyUrl: string) => previewResearchItem(workspaceId, etsyUrl),
  });
}

export function useUploadReferenceImage(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      file,
      researchItemId,
    }: {
      file: File;
      researchItemId: string;
    }) => uploadResearchReferenceImage(workspaceId, researchItemId, file),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: researchKeys.workspace(workspaceId),
      });
      void queryClient.invalidateQueries({
        queryKey: researchKeys.detail(workspaceId, variables.researchItemId),
      });
      void queryClient.invalidateQueries({
        queryKey: researchKeys.referenceImage(workspaceId, variables.researchItemId),
      });
    },
  });
}

export function useUpdateResearchTitle(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      researchItemId,
      title,
    }: {
      researchItemId: string;
      title: string | null;
    }) => updateResearchItemTitle(workspaceId, researchItemId, title),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: researchKeys.lists(workspaceId),
      });
      void queryClient.invalidateQueries({
        queryKey: researchKeys.detail(workspaceId, variables.researchItemId),
      });
    },
  });
}

export function useDeleteResearchItem(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (researchItemId: string) =>
      deleteResearchItem(workspaceId, researchItemId),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: researchKeys.workspace(workspaceId),
      });
      void queryClient.invalidateQueries({
        queryKey: ["dashboard", workspaceId],
      });
    },
  });
}

export function useResearchReferenceImage(
  workspaceId: string,
  researchItemId?: string | null,
  enabled = true,
) {
  const hasId = typeof researchItemId === "string" && researchItemId.length > 0;

  return useQuery({
    enabled: enabled && workspaceId.length > 0 && hasId,
    queryFn: () => getResearchReferenceImageBlob(workspaceId, researchItemId!),
    queryKey: researchKeys.referenceImage(workspaceId, researchItemId ?? ""),
    retry: (failureCount, error) => !isAuthError(error) && failureCount < 1,
    staleTime: 5 * 60 * 1000,
  });
}

export function useSyncResearchAssignments(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => syncResearchAssignments(workspaceId),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: researchKeys.workspace(workspaceId),
      });
      void queryClient.invalidateQueries({
        queryKey: ["dashboard", workspaceId],
      });
      void queryClient.invalidateQueries({
        queryKey: ["designer-work", workspaceId],
      });
    },
  });
}

export function useAssignResearchDesigner(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      designerId,
      researchItemId,
    }: {
      designerId: string;
      researchItemId: string;
    }) => reassignResearchDesigner(workspaceId, researchItemId, designerId),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: researchKeys.lists(workspaceId),
      });
      void queryClient.invalidateQueries({
        queryKey: researchKeys.detail(workspaceId, variables.researchItemId),
      });
      void queryClient.invalidateQueries({
        queryKey: ["designer-work", workspaceId],
      });
      void queryClient.invalidateQueries({
        queryKey: ["dashboard", workspaceId],
      });
      void queryClient.invalidateQueries({
        queryKey: notificationKeys.all(workspaceId),
      });
    },
  });
}



