"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  getIssueItems,
  reassignResearchDesigner,
} from "@/features/research/research.api";
import { researchKeys } from "@/features/research/use-research";
import type { IssueListFilterParams } from "@/features/research/research.types";
import { ApiError } from "@/lib/api";

export const issueKeys = {
  all: ["issues"] as const,
  list: (workspaceId: string, filter: IssueListFilterParams) =>
    ["issues", workspaceId, "list", filter] as const,
  lists: (workspaceId: string) => ["issues", workspaceId, "list"] as const,
};

export function useIssueItems(
  workspaceId: string,
  filter: IssueListFilterParams,
  enabled = true,
) {
  return useQuery({
    enabled: enabled && workspaceId.length > 0,
    queryFn: () => getIssueItems(workspaceId, filter),
    queryKey: issueKeys.list(workspaceId, filter),
    retry: (failureCount, error) =>
      !(error instanceof ApiError && (error.status === 401 || error.status === 403)) &&
      failureCount < 1,
    staleTime: 15_000,
  });
}

export function useReassignIssue(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ designerId, researchItemId }: {
      designerId: string;
      researchItemId: string;
    }) => reassignResearchDesigner(workspaceId, researchItemId, designerId),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: researchKeys.lists(workspaceId),
      });
      void queryClient.invalidateQueries({
        queryKey: issueKeys.lists(workspaceId),
      });
      void queryClient.invalidateQueries({
        queryKey: researchKeys.detail(workspaceId, variables.researchItemId),
      });
      void queryClient.invalidateQueries({
        queryKey: ["dashboard", workspaceId],
      });
      void queryClient.invalidateQueries({
        queryKey: ["designer-work", workspaceId],
      });
      void queryClient.invalidateQueries({
        queryKey: ["design-workspace", workspaceId],
      });
    },
  });
}
