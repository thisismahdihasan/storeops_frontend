"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import {
  createWorkspace,
  workspacesQueryKey,
} from "./workspace.api";
import type {
  CreateWorkspaceInput,
  WorkspaceWithMembership,
  WorkspacesResponse,
} from "./workspace.types";

export function useCreateWorkspace() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: (input: CreateWorkspaceInput) => createWorkspace(input),
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create workspace. Please try again.");
    },
    onSuccess: (response) => {
      const createdWorkspace = response.data.workspace;
      const createdMembership = response.data.membership;

      const newWorkspaceItem: WorkspaceWithMembership = {
        createdAt: createdWorkspace.createdAt,
        designerAutoAssignmentEnabled: true,
        listerAutoAssignmentEnabled: true,
        finalAssetAutoCleanupEnabled: false,
        finalAssetRetentionDays: 30,
        deletionScheduledAt: null,
        id: createdWorkspace.id,
        membership: {
          createdAt: createdMembership.createdAt,
          designerAssignmentEnabled: true,
          designerAssignmentPausedUntil: null,
          id: createdMembership.id,
          listerAssignmentEnabled: true,
          listerAssignmentPausedUntil: null,
          roles: createdMembership.roles,
        },
        name: createdWorkspace.name,
        ownerId: createdWorkspace.ownerId,
        permanentDeletionAt: null,
        updatedAt: createdWorkspace.updatedAt,
      };

      queryClient.setQueryData<WorkspacesResponse>(workspacesQueryKey, (old) => {
        if (!old) {
          return {
            data: { workspaces: [newWorkspaceItem] },
            message: "Workspaces retrieved successfully",
            success: true,
          };
        }
        return {
          ...old,
          data: {
            workspaces: [newWorkspaceItem, ...old.data.workspaces],
          },
        };
      });

      void queryClient.invalidateQueries({ queryKey: workspacesQueryKey });
      toast.success("Workspace created successfully");
      router.push(`/w/${createdWorkspace.id}/dashboard`);
    },
  });
}
