"use client";

import { useQuery } from "@tanstack/react-query";

import { getStorageCandidates, storageCleanupKeys } from "./storage-cleanup.api";
import type {
  GetStorageCandidatesParams,
  StorageCleanupCandidatesResponse,
} from "./storage-cleanup.types";

export function useStorageCandidates(
  workspaceId: string,
  params: GetStorageCandidatesParams = {},
  enabled = true,
) {
  const normalizedParams: GetStorageCandidatesParams = {
    filter: params.filter ?? "ELIGIBLE",
    limit: params.limit ?? 20,
    page: params.page ?? 1,
    search: params.search?.trim() ? params.search.trim() : undefined,
  };

  return useQuery<StorageCleanupCandidatesResponse>({
    queryKey: storageCleanupKeys.candidates(workspaceId, normalizedParams),
    queryFn: () => getStorageCandidates(workspaceId, normalizedParams),
    enabled: Boolean(workspaceId) && enabled,
  });
}
