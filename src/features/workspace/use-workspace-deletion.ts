"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  restoreWorkspace,
  scheduleWorkspaceDeletion,
} from "./workspace.api";
import type {
  ScheduleWorkspaceDeletionInput,
  WorkspacesResponse,
} from "./workspace.types";
import { workspacesQueryKey } from "./use-workspaces";

function updateWorkspaceDeletionCache(
  queryClient: ReturnType<typeof useQueryClient>,
  workspaceId: string,
  deletionScheduledAt: string | null,
  permanentDeletionAt: string | null,
) {
  queryClient.setQueryData<WorkspacesResponse>(workspacesQueryKey, (current) => {
    if (!current) return current;

    return {
      ...current,
      data: {
        ...current.data,
        workspaces: current.data.workspaces.map((workspace) =>
          workspace.id === workspaceId
            ? { ...workspace, deletionScheduledAt, permanentDeletionAt }
            : workspace,
        ),
      },
    };
  });
}

export function useScheduleWorkspaceDeletion(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: ScheduleWorkspaceDeletionInput) =>
      scheduleWorkspaceDeletion(workspaceId, input),
    onSuccess: (response) => {
      updateWorkspaceDeletionCache(
        queryClient,
        workspaceId,
        response.data.workspace.deletionScheduledAt,
        response.data.workspace.permanentDeletionAt,
      );
      void queryClient.invalidateQueries({ queryKey: workspacesQueryKey });
      toast.success("Workspace deletion scheduled successfully");
    },
  });
}

export function useRestoreWorkspace(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => restoreWorkspace(workspaceId),
    onSuccess: () => {
      updateWorkspaceDeletionCache(queryClient, workspaceId, null, null);
      void queryClient.invalidateQueries({ queryKey: workspacesQueryKey });
      void queryClient.invalidateQueries({
        predicate: (query) =>
          Array.isArray(query.queryKey) && query.queryKey.includes(workspaceId),
      });
      toast.success("Workspace restored successfully");
    },
  });
}
