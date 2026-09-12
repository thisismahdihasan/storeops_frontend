"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { researchKeys } from "@/features/research/use-research";
import { ApiError } from "@/lib/api";

import {
  backfillListingAssignments,
  completeListing,
  getListingDetail,
  getListingQueue,
  startListing,
} from "./listing.api";
import { listingKeys } from "./listing.keys";
import type { CompleteListingFormValues, ListingFilters } from "./listing.types";

export function useBackfillListingAssignments(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => backfillListingAssignments(workspaceId),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: listingKeys.queues(workspaceId),
      });
      void queryClient.invalidateQueries({
        queryKey: researchKeys.lists(workspaceId),
      });
      void queryClient.invalidateQueries({
        queryKey: researchKeys.details(workspaceId),
      });
      void queryClient.invalidateQueries({
        queryKey: ["dashboard", workspaceId],
      });
    },
  });
}

function shouldRetry(failureCount: number, error: unknown): boolean {
  return !(
    error instanceof ApiError &&
    (error.status === 401 ||
      error.status === 403 ||
      error.status === 404 ||
      error.status === 409)
  ) && failureCount < 1;
}

export function useListingQueue(
  workspaceId: string,
  filters: ListingFilters,
  enabled: boolean,
) {
  return useQuery({
    enabled: enabled && workspaceId.length > 0,
    queryFn: () => getListingQueue(workspaceId, filters),
    queryKey: listingKeys.queue(workspaceId, filters),
    retry: shouldRetry,
    staleTime: 15_000,
  });
}

export function useListingDetail(
  workspaceId: string,
  researchItemId: string,
  enabled: boolean,
) {
  return useQuery({
    enabled:
      enabled && workspaceId.length > 0 && researchItemId.length > 0,
    queryFn: () => getListingDetail(workspaceId, researchItemId),
    queryKey: listingKeys.detail(workspaceId, researchItemId),
    retry: shouldRetry,
    staleTime: 15_000,
  });
}

function useListingInvalidation(
  workspaceId: string,
  researchItemId: string,
) {
  const queryClient = useQueryClient();

  return (refetchDetail: boolean) => {
    void queryClient.invalidateQueries({
      queryKey: listingKeys.queues(workspaceId),
    });
    void queryClient.invalidateQueries({
      queryKey: listingKeys.detail(workspaceId, researchItemId),
      refetchType: refetchDetail ? "active" : "none",
    });
    void queryClient.invalidateQueries({
      queryKey: researchKeys.lists(workspaceId),
    });
    void queryClient.invalidateQueries({
      queryKey: researchKeys.detail(workspaceId, researchItemId),
    });
    void queryClient.invalidateQueries({
      queryKey: ["dashboard", workspaceId],
    });
  };
}

export function useStartListing(
  workspaceId: string,
  researchItemId: string,
) {
  const invalidate = useListingInvalidation(workspaceId, researchItemId);

  return useMutation({
    mutationFn: () => startListing(workspaceId, researchItemId),
    onError: (error) => {
      if (error instanceof ApiError && error.status === 409) invalidate(true);
    },
    onSuccess: () => invalidate(true),
  });
}

export function useCompleteListing(
  workspaceId: string,
  researchItemId: string,
) {
  const invalidate = useListingInvalidation(workspaceId, researchItemId);

  return useMutation({
    mutationFn: (values: CompleteListingFormValues) =>
      completeListing(workspaceId, researchItemId, values),
    onError: (error) => {
      if (error instanceof ApiError && error.status === 409) invalidate(true);
    },
    onSuccess: () => invalidate(false),
  });
}
