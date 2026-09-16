import { ApiError, apiRequest } from "@/lib/api";

import {
  approveReviewResponseSchema,
  createAnnotationResponseSchema,
  createReplyResponseSchema,
  deleteAnnotationReplyResponseSchema,
  deleteAnnotationResponseSchema,
  requestCorrectionResponseSchema,
  reviewDetailResponseSchema,
  reviewQueueResponseSchema,
  updateAnnotationReplyResponseSchema,
  updateAnnotationResponseSchema,
} from "./reviews.schemas";
import type {
  ApproveReviewResponse,
  CreateAnnotationInput,
  CreateAnnotationResponse,
  CreateReplyInput,
  CreateReplyResponse,
  DeleteAnnotationReplyResponse,
  DeleteAnnotationResponse,
  RequestCorrectionResponse,
  ReviewDetailResponse,
  ReviewQueueResponse,
  UpdateAnnotationInput,
  UpdateAnnotationReplyInput,
  UpdateAnnotationReplyResponse,
  UpdateAnnotationResponse,
} from "./reviews.types";

export async function getReviewQueue(
  workspaceId: string,
  page = 1,
  limit = 20,
): Promise<ReviewQueueResponse> {
  const params = new URLSearchParams({
    limit: String(limit),
    page: String(page),
  });

  const response = await apiRequest<unknown>(
    `/api/v1/workspaces/${workspaceId}/reviews?${params.toString()}`,
  );
  const parsed = reviewQueueResponseSchema.safeParse(response);

  if (!parsed.success) {
    throw new ApiError(502, "Unexpected review queue response format.");
  }

  return parsed.data;
}

export async function updateReviewAnnotation(workspaceId: string, annotationId: string, input: UpdateAnnotationInput): Promise<UpdateAnnotationResponse> {
  const response = await apiRequest<unknown>(`/api/v1/workspaces/${workspaceId}/annotations/${annotationId}`, { json: input, method: "PATCH" });
  const parsed = updateAnnotationResponseSchema.safeParse(response);
  if (!parsed.success) throw new ApiError(502, "Unexpected update annotation response format.");
  return parsed.data;
}

export async function deleteReviewAnnotation(workspaceId: string, annotationId: string): Promise<DeleteAnnotationResponse> {
  const response = await apiRequest<unknown>(`/api/v1/workspaces/${workspaceId}/annotations/${annotationId}`, { method: "DELETE" });
  const parsed = deleteAnnotationResponseSchema.safeParse(response);
  if (!parsed.success) throw new ApiError(502, "Unexpected delete annotation response format.");
  return parsed.data;
}

export async function updateAnnotationReply(workspaceId: string, annotationId: string, replyId: string, input: UpdateAnnotationReplyInput): Promise<UpdateAnnotationReplyResponse> {
  const response = await apiRequest<unknown>(`/api/v1/workspaces/${workspaceId}/annotations/${annotationId}/replies/${replyId}`, { json: input, method: "PATCH" });
  const parsed = updateAnnotationReplyResponseSchema.safeParse(response);
  if (!parsed.success) throw new ApiError(502, "Unexpected update reply response format.");
  return parsed.data;
}

export async function deleteAnnotationReply(workspaceId: string, annotationId: string, replyId: string): Promise<DeleteAnnotationReplyResponse> {
  const response = await apiRequest<unknown>(`/api/v1/workspaces/${workspaceId}/annotations/${annotationId}/replies/${replyId}`, { method: "DELETE" });
  const parsed = deleteAnnotationReplyResponseSchema.safeParse(response);
  if (!parsed.success) throw new ApiError(502, "Unexpected delete reply response format.");
  return parsed.data;
}

export async function getReviewDetail(
  workspaceId: string,
  reviewId: string,
): Promise<ReviewDetailResponse> {
  const response = await apiRequest<unknown>(
    `/api/v1/workspaces/${workspaceId}/reviews/${reviewId}`,
  );
  const parsed = reviewDetailResponseSchema.safeParse(response);

  if (!parsed.success) {
    throw new ApiError(502, "Unexpected review detail response format.");
  }

  return parsed.data;
}

export async function createReviewAnnotation(
  workspaceId: string,
  reviewId: string,
  input: CreateAnnotationInput,
): Promise<CreateAnnotationResponse> {
  const response = await apiRequest<unknown>(
    `/api/v1/workspaces/${workspaceId}/reviews/${reviewId}/annotations`,
    {
      json: input,
      method: "POST",
    },
  );
  const parsed = createAnnotationResponseSchema.safeParse(response);

  if (!parsed.success) {
    throw new ApiError(502, "Unexpected create annotation response format.");
  }

  return parsed.data;
}

export async function createAnnotationReply(
  workspaceId: string,
  annotationId: string,
  input: CreateReplyInput,
): Promise<CreateReplyResponse> {
  const response = await apiRequest<unknown>(
    `/api/v1/workspaces/${workspaceId}/annotations/${annotationId}/replies`,
    {
      json: input,
      method: "POST",
    },
  );
  const parsed = createReplyResponseSchema.safeParse(response);

  if (!parsed.success) {
    throw new ApiError(502, "Unexpected create reply response format.");
  }

  return parsed.data;
}

export async function requestReviewCorrection(
  workspaceId: string,
  reviewId: string,
): Promise<RequestCorrectionResponse> {
  const response = await apiRequest<unknown>(
    `/api/v1/workspaces/${workspaceId}/reviews/${reviewId}/request-correction`,
    {
      method: "POST",
    },
  );
  const parsed = requestCorrectionResponseSchema.safeParse(response);

  if (!parsed.success) {
    throw new ApiError(502, "Unexpected request correction response format.");
  }

  return parsed.data;
}

export async function approveReviewSubmission(
  workspaceId: string,
  reviewId: string,
): Promise<ApproveReviewResponse> {
  const response = await apiRequest<unknown>(
    `/api/v1/workspaces/${workspaceId}/reviews/${reviewId}/approve`,
    {
      method: "POST",
    },
  );
  const parsed = approveReviewResponseSchema.safeParse(response);

  if (!parsed.success) {
    throw new ApiError(502, "Unexpected approve review response format.");
  }

  return parsed.data;
}
