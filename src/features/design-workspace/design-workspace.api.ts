import { ApiError, apiRequest } from "@/lib/api";

import {
  designDetailResponseSchema,
  designWorkflowResponseSchema,
  multipartAbortRequestSchema,
  multipartAbortResponseSchema,
  multipartCompleteRequestSchema,
  multipartInitRequestSchema,
  multipartInitResponseSchema,
} from "./design-workspace.schemas";
import type {
  MultipartAbortRequest,
  MultipartCompleteRequest,
  MultipartInitRequest,
  MultipartInitResponse,
} from "./design-workspace.schemas";
import type { DesignDetailResponse } from "./design-workspace.types";

function designPath(workspaceId: string, researchItemId: string): string {
  return `/api/v1/workspaces/${workspaceId}/design/${researchItemId}`;
}

function parseWorkflowResponse(response: unknown) {
  const parsed = designWorkflowResponseSchema.safeParse(response);
  if (!parsed.success) {
    throw new ApiError(502, "Unexpected design workflow response format.");
  }
  return parsed.data;
}

export async function getDesignDetail(
  workspaceId: string,
  researchItemId: string,
): Promise<DesignDetailResponse> {
  const response = await apiRequest<unknown>(designPath(workspaceId, researchItemId));
  const parsed = designDetailResponseSchema.safeParse(response);
  if (!parsed.success) {
    throw new ApiError(502, "Unexpected Designer detail response format.");
  }
  return parsed.data;
}

export async function postDesignAction(
  workspaceId: string,
  researchItemId: string,
  action: "complete" | "start" | "start-correction",
) {
  return parseWorkflowResponse(await apiRequest<unknown>(
    `${designPath(workspaceId, researchItemId)}/${action}`,
    { method: "POST" },
  ));
}

export async function uploadReview(
  workspaceId: string,
  researchItemId: string,
  image: File,
  note: string,
) {
  const formData = new FormData();
  formData.append("image", image);
  if (note.trim().length > 0) {
    formData.append("note", note.trim());
  }

  return parseWorkflowResponse(await apiRequest<unknown>(
    `${designPath(workspaceId, researchItemId)}/review`,
    { body: formData, method: "POST" },
  ));
}

export async function uploadFinalAssets(
  workspaceId: string,
  researchItemId: string,
  file: File,
) {
  const formData = new FormData();
  formData.append("files", file);

  return parseWorkflowResponse(await apiRequest<unknown>(
    `${designPath(workspaceId, researchItemId)}/final-assets`,
    { body: formData, method: "POST" },
  ));
}

export async function initFinalAssetMultipartUpload(
  workspaceId: string,
  researchItemId: string,
  input: MultipartInitRequest,
  signal?: AbortSignal,
): Promise<MultipartInitResponse> {
  const validatedInput = multipartInitRequestSchema.parse(input);
  const response = await apiRequest<unknown>(
    `${designPath(workspaceId, researchItemId)}/final-assets/multipart/init`,
    { json: validatedInput, method: "POST", signal },
  );
  const parsed = multipartInitResponseSchema.safeParse(response);
  if (!parsed.success) {
    throw new ApiError(502, "Unexpected multipart upload response format.");
  }

  return parsed.data.data;
}

export async function completeFinalAssetMultipartUpload(
  workspaceId: string,
  researchItemId: string,
  input: MultipartCompleteRequest,
) {
  const validatedInput = multipartCompleteRequestSchema.parse(input);
  return parseWorkflowResponse(await apiRequest<unknown>(
    `${designPath(workspaceId, researchItemId)}/final-assets/multipart/complete`,
    { json: validatedInput, method: "POST" },
  ));
}

export async function abortFinalAssetMultipartUpload(
  workspaceId: string,
  researchItemId: string,
  input: MultipartAbortRequest,
): Promise<void> {
  const validatedInput = multipartAbortRequestSchema.parse(input);
  const response = await apiRequest<unknown>(
    `${designPath(workspaceId, researchItemId)}/final-assets/multipart/abort`,
    { json: validatedInput, method: "POST" },
  );
  const parsed = multipartAbortResponseSchema.safeParse(response);
  if (!parsed.success) {
    throw new ApiError(502, "Unexpected multipart abort response format.");
  }
}
