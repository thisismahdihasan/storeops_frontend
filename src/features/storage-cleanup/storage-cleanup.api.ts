import { ApiError, apiRequest } from "@/lib/api";

import {
  bulkFinalAssetCleanupResponseSchema,
  finalAssetCleanupResponseSchema,
  finalAssetStorageMetricsResponseSchema,
  storageCleanupCandidatesResponseSchema,
} from "./storage-cleanup.schemas";
import type {
  BulkFinalAssetCleanupResponse,
  FinalAssetCleanupResponse,
  FinalAssetStorageMetricsResponse,
  GetStorageCandidatesParams,
  StorageCleanupCandidatesResponse,
} from "./storage-cleanup.types";

export const storageCleanupKeys = {
  all: (workspaceId: string) =>
    ["workspaces", workspaceId, "storage-cleanup"] as const,
  metrics: (workspaceId: string) =>
    [...storageCleanupKeys.all(workspaceId), "metrics"] as const,
  candidates: (workspaceId: string, params?: GetStorageCandidatesParams) =>
    [...storageCleanupKeys.all(workspaceId), "candidates", params] as const,
};

export async function getStorageMetrics(
  workspaceId: string,
): Promise<FinalAssetStorageMetricsResponse> {
  const response = await apiRequest<unknown>(
    `/api/v1/workspaces/${workspaceId}/admin/storage/metrics`,
  );
  const parsed = finalAssetStorageMetricsResponseSchema.safeParse(response);

  if (!parsed.success) {
    throw new ApiError(
      502,
      "The service returned an unexpected storage metrics response.",
    );
  }

  return parsed.data;
}

export async function getStorageCandidates(
  workspaceId: string,
  params: GetStorageCandidatesParams = {},
): Promise<StorageCleanupCandidatesResponse> {
  const query = new URLSearchParams();
  if (params.page && params.page > 1) {
    query.set("page", String(params.page));
  }
  if (params.limit) {
    query.set("limit", String(params.limit));
  }
  if (params.filter) {
    query.set("filter", params.filter);
  }
  if (params.search && params.search.trim().length > 0) {
    query.set("search", params.search.trim());
  }

  const queryString = query.toString();
  const endpoint = `/api/v1/workspaces/${workspaceId}/admin/storage/final-assets${
    queryString ? `?${queryString}` : ""
  }`;

  const response = await apiRequest<unknown>(endpoint);
  const parsed = storageCleanupCandidatesResponseSchema.safeParse(response);

  if (!parsed.success) {
    throw new ApiError(
      502,
      "The service returned an unexpected storage candidates response.",
    );
  }

  return parsed.data;
}

export async function deleteFinalAsset(
  workspaceId: string,
  finalAssetId: string,
): Promise<FinalAssetCleanupResponse> {
  const endpoint = `/api/v1/workspaces/${workspaceId}/admin/storage/final-assets/${finalAssetId}`;
  const response = await apiRequest<unknown>(endpoint, {
    method: "DELETE",
  });
  const parsed = finalAssetCleanupResponseSchema.safeParse(response);

  if (!parsed.success) {
    throw new ApiError(
      502,
      "The service returned an unexpected final asset cleanup response.",
    );
  }

  return parsed.data;
}

export async function bulkDeleteFinalAssets(
  workspaceId: string,
  finalAssetIds: string[],
): Promise<BulkFinalAssetCleanupResponse> {
  const endpoint = `/api/v1/workspaces/${workspaceId}/admin/storage/final-assets/bulk-delete`;
  const response = await apiRequest<unknown>(endpoint, {
    json: { finalAssetIds },
    method: "POST",
  });
  const parsed = bulkFinalAssetCleanupResponseSchema.safeParse(response);

  if (!parsed.success) {
    throw new ApiError(
      502,
      "The service returned an unexpected bulk final asset cleanup response.",
    );
  }

  return parsed.data;
}
