"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { listingKeys } from "@/features/listing/listing.keys";

import {
  bulkDeleteFinalAssets,
  deleteFinalAsset,
  storageCleanupKeys,
} from "./storage-cleanup.api";

export function useDeleteFinalAsset(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (finalAssetId: string) =>
      deleteFinalAsset(workspaceId, finalAssetId),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: storageCleanupKeys.all(workspaceId),
      });
      void queryClient.invalidateQueries({
        queryKey: listingKeys.details(workspaceId),
      });
    },
  });
}

export function useBulkDeleteFinalAssets(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (finalAssetIds: string[]) =>
      bulkDeleteFinalAssets(workspaceId, finalAssetIds),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: storageCleanupKeys.all(workspaceId),
      });
      void queryClient.invalidateQueries({
        queryKey: listingKeys.details(workspaceId),
      });
    },
  });
}
