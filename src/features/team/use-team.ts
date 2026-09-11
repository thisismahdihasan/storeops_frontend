"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { ApiError } from "@/lib/api";

import {
  createWorkspaceInvite,
  getPendingWorkspaceInvites,
  getTeamMembers,
  pendingWorkspaceInvitesQueryKey,
  resendWorkspaceInvite,
  revokeWorkspaceInvite,
  teamMembersQueryKey,
} from "./team.api";
import type { CreateWorkspaceInviteInput } from "./team.types";

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
