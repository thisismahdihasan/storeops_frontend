"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { ApiError } from "@/lib/api";
import { currentSessionQueryKey } from "@/features/auth/use-current-session";
import { dashboardKeys } from "@/features/dashboard/use-dashboard";
import { workspacesQueryKey } from "@/features/workspace/use-workspaces";

import {
  createWorkspaceInvite,
  getPendingWorkspaceInvites,
  getTeamMembers,
  pendingWorkspaceInvitesQueryKey,
  removeMember,
  resendWorkspaceInvite,
  revokeWorkspaceInvite,
  teamMembersQueryKey,
  updateMemberAssignmentAvailability,
  updateMemberRoles,
} from "./team.api";
import type {
  CreateWorkspaceInviteInput,
  TeamMembersResponse,
  UpdateMemberAssignmentAvailabilityInput,
  UpdateMemberRolesInput,
} from "./team.types";

function isUnauthenticatedError(error: unknown) {
  return error instanceof ApiError && error.status === 401;
}

export function useTeamMembers(workspaceId: string, enabled: boolean) {
  return useQuery({
    enabled,
    queryFn: () => getTeamMembers(workspaceId),
    queryKey: teamMembersQueryKey(workspaceId),
    retry: (failureCount, error) =>
      !isUnauthenticatedError(error) && failureCount < 1,
    staleTime: 60_000,
  });
}

export function useCreateWorkspaceInvite(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateWorkspaceInviteInput) =>
      createWorkspaceInvite(workspaceId, input),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: pendingWorkspaceInvitesQueryKey(workspaceId),
      }),
  });
}

export function usePendingWorkspaceInvites(workspaceId: string, enabled: boolean) {
  return useQuery({
    enabled,
    queryFn: () => getPendingWorkspaceInvites(workspaceId),
    queryKey: pendingWorkspaceInvitesQueryKey(workspaceId),
    retry: (failureCount, error) =>
      !isUnauthenticatedError(error) && failureCount < 1,
    staleTime: 60_000,
  });
}

export function useResendWorkspaceInvite(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (inviteId: string) => resendWorkspaceInvite(workspaceId, inviteId),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: pendingWorkspaceInvitesQueryKey(workspaceId),
      }),
  });
}

export function useRevokeWorkspaceInvite(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (inviteId: string) => revokeWorkspaceInvite(workspaceId, inviteId),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: pendingWorkspaceInvitesQueryKey(workspaceId),
      }),
  });
}

function invalidateMemberMutationQueries(
  queryClient: ReturnType<typeof useQueryClient>,
  workspaceId: string,
) {
  void queryClient.invalidateQueries({
    queryKey: teamMembersQueryKey(workspaceId),
  });
  void queryClient.invalidateQueries({ queryKey: workspacesQueryKey });
  void queryClient.invalidateQueries({ queryKey: currentSessionQueryKey });
  void queryClient.invalidateQueries({
    queryKey: dashboardKeys.all,
    predicate: (query) => query.queryKey[1] === workspaceId,
  });
}

export function useUpdateMemberRoles(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ input, userId }: { input: UpdateMemberRolesInput; userId: string }) =>
      updateMemberRoles(workspaceId, userId, input),
    onSuccess: () => invalidateMemberMutationQueries(queryClient, workspaceId),
  });
}

export function useUpdateMemberAssignmentAvailability(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ input, userId }: { input: UpdateMemberAssignmentAvailabilityInput; userId: string }) =>
      updateMemberAssignmentAvailability(workspaceId, userId, input),
    onError: (error: Error) => {
      toast.error(error.message || "Could not update assignment availability.");
    },
    onSuccess: (response) => {
      queryClient.setQueryData<TeamMembersResponse>(
        teamMembersQueryKey(workspaceId),
        (current) => {
          if (!current) return current;

          return {
            ...current,
            data: {
              ...current.data,
              members: current.data.members.map((member) =>
                member.userId === response.data.member.userId
                  ? response.data.member
                  : member,
              ),
            },
          };
        },
      );
      void queryClient.invalidateQueries({
        queryKey: teamMembersQueryKey(workspaceId),
      });
      toast.success("Assignment availability updated.");
    },
  });
}

export function useRemoveMember(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => removeMember(workspaceId, userId),
    onSuccess: () => invalidateMemberMutationQueries(queryClient, workspaceId),
  });
}
