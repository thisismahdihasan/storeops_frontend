import { useQuery } from "@tanstack/react-query";

import { getStorageMetrics, storageCleanupKeys } from "./storage-cleanup.api";
import type { FinalAssetStorageMetricsResponse } from "./storage-cleanup.types";

export function useStorageMetrics(workspaceId: string, enabled = true) {
  return useQuery<FinalAssetStorageMetricsResponse>({
    queryKey: storageCleanupKeys.metrics(workspaceId),
    queryFn: () => getStorageMetrics(workspaceId),
    enabled: Boolean(workspaceId) && enabled,
  });
}
