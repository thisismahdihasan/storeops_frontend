import { ApiError, apiRequest } from "@/lib/api";

import { finalAssetStorageMetricsResponseSchema } from "./storage-cleanup.schemas";
import type { FinalAssetStorageMetricsResponse } from "./storage-cleanup.types";

export const storageCleanupKeys = {
  all: (workspaceId: string) =>
    ["workspaces", workspaceId, "storage-cleanup"] as const,
  metrics: (workspaceId: string) =>
    [...storageCleanupKeys.all(workspaceId), "metrics"] as const,
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
