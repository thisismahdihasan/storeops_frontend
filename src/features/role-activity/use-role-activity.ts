"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiError } from "@/lib/api";
import { getDesignerActivitySummary, getDesignerHistory, getListerActivitySummary, getListerHistory, getListingReviewProgress, updateListingReview, getResearcherActivitySummary } from "./role-activity.api";
import { roleActivityKeys } from "./role-activity.keys";
import type { DateRangeQuery, HistoryQuery, ReviewMutation } from "./role-activity.types";

function shouldRetry(failureCount: number, error: unknown): boolean {
  return !(error instanceof ApiError && (error.status === 401 || error.status === 403)) && failureCount < 1;
}

function hasValidRange(range: DateRangeQuery): boolean {
  return (range.dateFrom === undefined && range.dateTo === undefined) || (Boolean(range.dateFrom) && Boolean(range.dateTo));
}

export function useResearcherSummary(workspaceId: string, range: DateRangeQuery, enabled = true) {
  return useQuery({ enabled: enabled && workspaceId.length > 0 && hasValidRange(range), queryFn: () => getResearcherActivitySummary(workspaceId, range), queryKey: roleActivityKeys.researcherSummary(workspaceId, range), retry: shouldRetry, staleTime: 15_000 });
}
export function useDesignerSummary(workspaceId: string, range: DateRangeQuery, enabled = true) {
  return useQuery({ enabled: enabled && workspaceId.length > 0 && hasValidRange(range), queryFn: () => getDesignerActivitySummary(workspaceId, range), queryKey: roleActivityKeys.designerSummary(workspaceId, range), retry: shouldRetry, staleTime: 15_000 });
}
export function useDesignerHistory(workspaceId: string, query: HistoryQuery, enabled = true) {
  return useQuery({ enabled: enabled && workspaceId.length > 0 && hasValidRange(query), queryFn: () => getDesignerHistory(workspaceId, query), queryKey: roleActivityKeys.designerHistory(workspaceId, query), retry: shouldRetry, staleTime: 15_000 });
}
export function useListerSummary(workspaceId: string, range: DateRangeQuery, enabled = true) {
  return useQuery({ enabled: enabled && workspaceId.length > 0 && hasValidRange(range), queryFn: () => getListerActivitySummary(workspaceId, range), queryKey: roleActivityKeys.listerSummary(workspaceId, range), retry: shouldRetry, staleTime: 15_000 });
}
export function useListerHistory(workspaceId: string, query: HistoryQuery, enabled = true) {
  return useQuery({ enabled: enabled && workspaceId.length > 0 && hasValidRange(query), queryFn: () => getListerHistory(workspaceId, query), queryKey: roleActivityKeys.listerHistory(workspaceId, query), retry: shouldRetry, staleTime: 15_000 });
}
export function useListingReviewProgress(workspaceId: string, enabled = true) {
  return useQuery({ enabled: enabled && Boolean(workspaceId), queryFn: () => getListingReviewProgress(workspaceId), queryKey: roleActivityKeys.listingReviewProgress(workspaceId), staleTime: 15_000, refetchInterval: 30_000 });
}
export function useUpdateListingReview(workspaceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ researchItemId, input }: { researchItemId: string; input: ReviewMutation }) => updateListingReview(workspaceId, researchItemId, input),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: roleActivityKeys.listerHistories(workspaceId) }),
        queryClient.invalidateQueries({ queryKey: roleActivityKeys.listingReviewProgress(workspaceId) }),
      ]);
    },
  });
}
