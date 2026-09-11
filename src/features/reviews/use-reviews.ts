"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { dashboardKeys } from "@/features/dashboard/use-dashboard";
import { designWorkspaceKeys } from "@/features/design-workspace/use-design-workspace";
import { designerWorkKeys } from "@/features/designer-work/use-designer-work";
import { researchKeys } from "@/features/research/use-research";
import { ApiError } from "@/lib/api";

import {
  approveReviewSubmission,
  createAnnotationReply,
  createReviewAnnotation,
  getReviewDetail,
  getReviewQueue,
  requestReviewCorrection,
} from "./reviews.api";
import { reviewsKeys } from "./reviews.keys";
import type {
  CreateAnnotationInput,
  CreateReplyInput,
} from "./reviews.types";

function shouldRetry(error: unknown, failureCount: number): boolean {
  if (
    error instanceof ApiError &&
    (error.status === 401 || error.status === 403 || error.status === 404)
  ) {
    return false;
  }
  return failureCount < 1;
}

export function useReviewQueue(
  workspaceId: string,
  page = 1,
  limit = 20,
  enabled = true,
) {
  return useQuery({
    enabled: enabled && workspaceId.length > 0,
    queryFn: () => getReviewQueue(workspaceId, page, limit),
    queryKey: reviewsKeys.queue(workspaceId, page, limit),
    retry: (failureCount, error) => shouldRetry(error, failureCount),
    staleTime: 15_000,
  });
}

export function useReviewDetail(
  workspaceId: string,
  reviewId: string,
  enabled = true,
) {
  return useQuery({
    enabled: enabled && workspaceId.length > 0 && reviewId.length > 0,
    queryFn: () => getReviewDetail(workspaceId, reviewId),
    queryKey: reviewsKeys.detail(workspaceId, reviewId),
    retry: (failureCount, error) => shouldRetry(error, failureCount),
    staleTime: 15_000,
  });
}

export function useReviewActionInvalidation(workspaceId: string) {
  const queryClient = useQueryClient();

  return (researchItemId?: string, reviewId?: string) => {
    void queryClient.invalidateQueries({
      queryKey: reviewsKeys.queues(workspaceId),
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

    void queryClient.invalidateQueries({
      queryKey: researchKeys.lists(workspaceId),
    });

    if (researchItemId) {
      void queryClient.invalidateQueries({
        queryKey: researchKeys.detail(workspaceId, researchItemId),
      });
      void queryClient.invalidateQueries({
        queryKey: designWorkspaceKeys.detail(workspaceId, researchItemId),
      });
    }

    void queryClient.invalidateQueries({
      queryKey: designerWorkKeys.queues(workspaceId),
    });

    void queryClient.invalidateQueries({
      queryKey: dashboardKeys.overview(workspaceId),
    });
    void queryClient.invalidateQueries({
      queryKey: ["dashboard", workspaceId],
    });
  };
}

export function useCreateReviewAnnotation(
  workspaceId: string,
  reviewId: string,
  researchItemId?: string,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateAnnotationInput) =>
      createReviewAnnotation(workspaceId, reviewId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: reviewsKeys.detail(workspaceId, reviewId),
      });
      if (researchItemId) {
        void queryClient.invalidateQueries({
          queryKey: designWorkspaceKeys.detail(workspaceId, researchItemId),
        });
      }
    },
  });
}

export function useCreateAnnotationReply(
  workspaceId: string,
  reviewId: string,
  researchItemId?: string,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      annotationId,
      input,
    }: {
      annotationId: string;
      input: CreateReplyInput;
    }) => createAnnotationReply(workspaceId, annotationId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: reviewsKeys.detail(workspaceId, reviewId),
      });
      if (researchItemId) {
        void queryClient.invalidateQueries({
          queryKey: designWorkspaceKeys.detail(workspaceId, researchItemId),
        });
      }
    },
  });
}

export function useRequestReviewCorrection(
  workspaceId: string,
  reviewId: string,
) {
  const invalidate = useReviewActionInvalidation(workspaceId);

  return useMutation({
    mutationFn: () => requestReviewCorrection(workspaceId, reviewId),
    onSuccess: (data) => {
      invalidate(data.data.researchItem.id, reviewId);
    },
  });
}

export function useApproveReviewSubmission(
  workspaceId: string,
  reviewId: string,
) {
  const invalidate = useReviewActionInvalidation(workspaceId);

  return useMutation({
    mutationFn: () => approveReviewSubmission(workspaceId, reviewId),
    onSuccess: (data) => {
      invalidate(data.data.researchItem.id, reviewId);
    },
  });
}
