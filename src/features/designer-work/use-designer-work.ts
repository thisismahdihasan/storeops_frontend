"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { ApiError } from "@/lib/api";
import { researchKeys } from "@/features/research/use-research";

import { getDesignerWorkQueue, reportDesignIssue, startCorrection, startDesignWork } from "./designer-work.api";
import type { DesignerWorkFilters, ReportIssueFormValues } from "./designer-work.types";

export const designerWorkKeys = {
  all: ["designer-work"] as const,
  queue: (workspaceId: string, filters: DesignerWorkFilters) => ["designer-work", workspaceId, "queue", filters] as const,
  queues: (workspaceId: string) => ["designer-work", workspaceId, "queue"] as const,
};

function shouldRetry(error: unknown, failureCount: number): boolean {
  return !(error instanceof ApiError && (error.status === 401 || error.status === 403)) && failureCount < 1;
}

function useDesignerWorkInvalidation(workspaceId: string) {
  const queryClient = useQueryClient();
  return (researchItemId: string, includeDashboard = false) => {
    void queryClient.invalidateQueries({ queryKey: designerWorkKeys.queues(workspaceId) });
    void queryClient.invalidateQueries({ queryKey: researchKeys.detail(workspaceId, researchItemId) });
    if (includeDashboard) void queryClient.invalidateQueries({ queryKey: ["dashboard", workspaceId] });
  };
}

export function useDesignerWorkQueue(workspaceId: string, filters: DesignerWorkFilters, enabled: boolean) {
  return useQuery({
    enabled: enabled && workspaceId.length > 0,
    queryFn: () => getDesignerWorkQueue(workspaceId, filters),
    queryKey: designerWorkKeys.queue(workspaceId, filters),
    retry: (failureCount, error) => shouldRetry(error, failureCount),
    staleTime: 15_000,
  });
}

export function useStartDesignWork(workspaceId: string) {
  const invalidate = useDesignerWorkInvalidation(workspaceId);
  return useMutation({
    mutationFn: (researchItemId: string) => startDesignWork(workspaceId, researchItemId),
    onSuccess: (_data, researchItemId) => invalidate(researchItemId),
  });
}

export function useReportDesignIssue(workspaceId: string) {
  const invalidate = useDesignerWorkInvalidation(workspaceId);
  return useMutation({
    mutationFn: ({ researchItemId, values }: { researchItemId: string; values: ReportIssueFormValues }) => reportDesignIssue(workspaceId, researchItemId, values),
    onSuccess: (_data, variables) => invalidate(variables.researchItemId, true),
  });
}

export function useStartCorrection(workspaceId: string) {
  const invalidate = useDesignerWorkInvalidation(workspaceId);
  return useMutation({
    mutationFn: (researchItemId: string) => startCorrection(workspaceId, researchItemId),
    onSuccess: (_data, researchItemId) => invalidate(researchItemId, true),
  });
}
