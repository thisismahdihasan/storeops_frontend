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
  deleteAnnotationReply,
  deleteReviewAnnotation,
  getReviewDetail,
  getReviewQueue,
  requestReviewCorrection,
  updateAnnotationReply,
  updateReviewAnnotation,
} from "./reviews.api";
import { reviewsKeys } from "./reviews.keys";
import type {
  CreateAnnotationInput,
  CreateReplyInput,
  UpdateAnnotationInput,
  UpdateAnnotationReplyInput,
  ReviewDetailResponse,
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

  return async (researchItemId?: string, reviewId?: string) => {
    const invalidations = [
      queryClient.invalidateQueries({
        queryKey: reviewsKeys.queues(workspaceId),
      }),
    ];

    if (reviewId) {
      invalidations.push(
        queryClient.invalidateQueries({
          queryKey: reviewsKeys.detail(workspaceId, reviewId),
        }),
      );
    } else {
      invalidations.push(
        queryClient.invalidateQueries({
          queryKey: reviewsKeys.details(workspaceId),
        }),
      );
    }

    invalidations.push(
      queryClient.invalidateQueries({
        queryKey: researchKeys.lists(workspaceId),
      }),
    );

    if (researchItemId) {
      invalidations.push(
        queryClient.invalidateQueries({
          queryKey: researchKeys.detail(workspaceId, researchItemId),
        }),
      );
      invalidations.push(
        queryClient.invalidateQueries({
          queryKey: designWorkspaceKeys.detail(workspaceId, researchItemId),
        }),
      );
    }

    invalidations.push(
      queryClient.invalidateQueries({
        queryKey: designerWorkKeys.queues(workspaceId),
      }),
    );

    invalidations.push(
      queryClient.invalidateQueries({
        queryKey: dashboardKeys.overview(workspaceId),
      }),
    );
    invalidations.push(
      queryClient.invalidateQueries({
        queryKey: ["dashboard", workspaceId],
      }),
    );

    await Promise.all(invalidations);
  };
}

function updateReviewDetailStatus(
  queryClient: ReturnType<typeof useQueryClient>,
  workspaceId: string,
  researchItemId: string,
  status: ReviewDetailResponse["data"]["researchItem"]["status"],
) {
  queryClient.setQueriesData<ReviewDetailResponse>(
    { queryKey: reviewsKeys.details(workspaceId) },
    (current) => {
      if (!current || current.data.researchItem.id !== researchItemId) {
        return current;
      }

      return {
        ...current,
        data: {
          ...current.data,
          researchItem: {
            ...current.data.researchItem,
            status,
          },
        },
      };
    },
  );
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

function invalidateMessageDetails(
  queryClient: ReturnType<typeof useQueryClient>,
  workspaceId: string,
  reviewId: string,
  researchItemId?: string,
  includeResearchActivity = false,
) {
  void queryClient.invalidateQueries({
    queryKey: reviewsKeys.detail(workspaceId, reviewId),
  });
  if (researchItemId) {
    void queryClient.invalidateQueries({
      queryKey: designWorkspaceKeys.detail(workspaceId, researchItemId),
    });
    if (includeResearchActivity) {
      void queryClient.invalidateQueries({
        queryKey: researchKeys.lists(workspaceId),
      });
      void queryClient.invalidateQueries({
        queryKey: researchKeys.detail(workspaceId, researchItemId),
      });
    }
  }
}

export function useUpdateReviewAnnotation(workspaceId: string, reviewId: string, researchItemId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ annotationId, input }: { annotationId: string; input: UpdateAnnotationInput }) =>
      updateReviewAnnotation(workspaceId, annotationId, input),
    onError: () => invalidateMessageDetails(queryClient, workspaceId, reviewId, researchItemId),
    onSuccess: () => invalidateMessageDetails(queryClient, workspaceId, reviewId, researchItemId),
  });
}

export function useDeleteReviewAnnotation(workspaceId: string, reviewId: string, researchItemId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (annotationId: string) => deleteReviewAnnotation(workspaceId, annotationId),
    onError: () => invalidateMessageDetails(queryClient, workspaceId, reviewId, researchItemId),
    onSuccess: () => invalidateMessageDetails(queryClient, workspaceId, reviewId, researchItemId),
  });
}

export function useUpdateAnnotationReply(workspaceId: string, reviewId: string, researchItemId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ annotationId, replyId, input }: { annotationId: string; replyId: string; input: UpdateAnnotationReplyInput }) =>
      updateAnnotationReply(workspaceId, annotationId, replyId, input),
    onError: () => invalidateMessageDetails(queryClient, workspaceId, reviewId, researchItemId),
    onSuccess: () => invalidateMessageDetails(queryClient, workspaceId, reviewId, researchItemId),
  });
}

export function useDeleteAnnotationReply(workspaceId: string, reviewId: string, researchItemId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ annotationId, replyId }: { annotationId: string; replyId: string }) =>
      deleteAnnotationReply(workspaceId, annotationId, replyId),
    onError: () => invalidateMessageDetails(queryClient, workspaceId, reviewId, researchItemId, true),
    onSuccess: () => invalidateMessageDetails(queryClient, workspaceId, reviewId, researchItemId, true),
  });
}

export function useRequestReviewCorrection(
  workspaceId: string,
  reviewId: string,
) {
  const invalidate = useReviewActionInvalidation(workspaceId);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => requestReviewCorrection(workspaceId, reviewId),
    onSuccess: async (data) => {
      updateReviewDetailStatus(
        queryClient,
        workspaceId,
        data.data.researchItem.id,
        data.data.researchItem.status,
      );
      await invalidate(data.data.researchItem.id, reviewId);
    },
  });
}

export function useApproveReviewSubmission(
  workspaceId: string,
  reviewId: string,
) {
  const invalidate = useReviewActionInvalidation(workspaceId);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => approveReviewSubmission(workspaceId, reviewId),
    onSuccess: async (data) => {
      updateReviewDetailStatus(
        queryClient,
        workspaceId,
        data.data.researchItem.id,
        data.data.researchItem.status,
      );
      await invalidate(data.data.researchItem.id, reviewId);
    },
  });
}
