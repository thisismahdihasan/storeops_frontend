"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { resolveDefaultRouteForRoles } from "@/components/layout/navigation.config";
import { ApiError } from "@/lib/api";

import {
  createWorkspace,
  getWorkspaces,
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
    onError: async (error: Error) => {
      if (error instanceof ApiError && error.status === 409) {
        // 409: Stale state recovery — refetch workspaces
        try {
          const freshWorkspaces = await queryClient.fetchQuery({
            queryFn: getWorkspaces,
            queryKey: workspacesQueryKey,
          });

          if (freshWorkspaces.data.workspaces.length > 0) {
            const firstWs = freshWorkspaces.data.workspaces[0];
            toast.info("You already own a workspace. Navigating to your dashboard...");
            const target = resolveDefaultRouteForRoles(
              firstWs.membership.roles,
              firstWs.id,
            );
            router.push(target);
            return;
          }
        } catch {
          // Fall through to standard error toast if refetch fails
        }
      }

      toast.error(error.message || "Failed to create workspace. Please try again.");
    },
    onSuccess: (response) => {
      const createdWorkspace = response.data.workspace;
      const createdMembership = response.data.membership;

      const newWorkspaceItem: WorkspaceWithMembership = {
        createdAt: createdWorkspace.createdAt,
        id: createdWorkspace.id,
        membership: {
          createdAt: createdMembership.createdAt,
          id: createdMembership.id,
          roles: createdMembership.roles,
        },
        name: createdWorkspace.name,
        ownerId: createdWorkspace.ownerId,
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
