"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { reassignResearchDesigner } from "@/features/research/research.api";
import { researchKeys } from "@/features/research/use-research";

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
