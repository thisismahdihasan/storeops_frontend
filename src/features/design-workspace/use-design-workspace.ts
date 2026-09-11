"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { reportDesignIssue } from "@/features/designer-work/designer-work.api";
import type { ReportIssueFormValues } from "@/features/designer-work/designer-work.types";
import { designerWorkKeys } from "@/features/designer-work/use-designer-work";
import { researchKeys } from "@/features/research/use-research";
import { ApiError } from "@/lib/api";

import {
  getDesignDetail,
  postDesignAction,
  uploadFinalAssets,
  uploadReview,
} from "./design-workspace.api";
import { createAnnotationReply } from "@/features/reviews/reviews.api";
import { reviewsKeys } from "@/features/reviews/reviews.keys";

export const designWorkspaceKeys = {
  all: ["design-workspace"] as const,
  detail: (workspaceId: string, researchItemId: string) =>
    ["design-workspace", workspaceId, "detail", researchItemId] as const,
};

function shouldRetry(error: unknown, failureCount: number): boolean {
  return !(error instanceof ApiError && (error.status === 401 || error.status === 403 || error.status === 404)) && failureCount < 1;
}

function useDesignInvalidation(workspaceId: string, researchItemId: string) {
  const queryClient = useQueryClient();
  return (includeDashboard = false) => {
    void queryClient.invalidateQueries({ queryKey: designWorkspaceKeys.detail(workspaceId, researchItemId) });
    void queryClient.invalidateQueries({ queryKey: designerWorkKeys.queues(workspaceId) });
    void queryClient.invalidateQueries({ queryKey: researchKeys.detail(workspaceId, researchItemId) });
    if (includeDashboard) void queryClient.invalidateQueries({ queryKey: ["dashboard", workspaceId] });
  };
}

export function useDesignDetail(workspaceId: string, researchItemId: string, enabled: boolean) {
  return useQuery({
    enabled: enabled && workspaceId.length > 0 && researchItemId.length > 0,
    queryFn: () => getDesignDetail(workspaceId, researchItemId),
    queryKey: designWorkspaceKeys.detail(workspaceId, researchItemId),
    retry: (failureCount, error) => shouldRetry(error, failureCount),
    staleTime: 15_000,
  });
}

export function useDesignActions(workspaceId: string, researchItemId: string) {
  const invalidate = useDesignInvalidation(workspaceId, researchItemId);
  const startWork = useMutation({
    mutationFn: () => postDesignAction(workspaceId, researchItemId, "start"),
    onSuccess: () => { invalidate(); },
  });
  const startCorrection = useMutation({
    mutationFn: () => postDesignAction(workspaceId, researchItemId, "start-correction"),
    onSuccess: () => invalidate(true),
  });
  const completeWork = useMutation({
    mutationFn: () => postDesignAction(workspaceId, researchItemId, "complete"),
    onSuccess: () => { invalidate(); },
  });
  const submitReview = useMutation({
    mutationFn: ({ image, note }: { image: File; note: string }) => uploadReview(workspaceId, researchItemId, image, note),
    onSuccess: () => { invalidate(); },
  });
  const submitFinalAssets = useMutation({
    mutationFn: (files: File[]) => uploadFinalAssets(workspaceId, researchItemId, files),
    onSuccess: () => { invalidate(); },
  });
  const reportIssue = useMutation({
    mutationFn: (values: ReportIssueFormValues) => reportDesignIssue(workspaceId, researchItemId, values),
    onSuccess: () => invalidate(true),
  });

  return { completeWork, reportIssue, startCorrection, startWork, submitFinalAssets, submitReview };
}

export function useDesignerAnnotationReply(
  workspaceId: string,
  researchItemId: string,
  reviewId?: string,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      annotationId,
      message,
    }: {
      annotationId: string;
      message: string;
    }) => createAnnotationReply(workspaceId, annotationId, { message }),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: designWorkspaceKeys.detail(workspaceId, researchItemId),
      });
      if (reviewId) {
        void queryClient.invalidateQueries({
          queryKey: reviewsKeys.detail(workspaceId, reviewId),
        });
      } else {
        void queryClient.invalidateQueries({
          queryKey: reviewsKeys.details(workspaceId),
        });
      }
    },
  });
}
