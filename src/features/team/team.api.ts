import { ApiError, apiRequest } from "@/lib/api";

import {
  createWorkspaceInviteResponseSchema,
  pendingWorkspaceInvitesResponseSchema,
  removeMemberResponseSchema,
  revokeWorkspaceInviteResponseSchema,
  teamMembersResponseSchema,
  updateMemberRolesResponseSchema,
} from "./team.schemas";
import type {
  CreateWorkspaceInviteInput,
  CreateWorkspaceInviteResponse,
  PendingWorkspaceInvitesResponse,
  RemoveMemberResponse,
  RevokeWorkspaceInviteResponse,
  TeamMembersResponse,
  UpdateMemberRolesInput,
  UpdateMemberRolesResponse,
} from "./team.types";

export function teamMembersQueryKey(workspaceId: string) {
  return ["team", workspaceId, "members"] as const;
}

export function pendingWorkspaceInvitesQueryKey(workspaceId: string) {
  return ["team", workspaceId, "invites", "pending"] as const;
}

export async function getTeamMembers(
  workspaceId: string,
): Promise<TeamMembersResponse> {
  const response = await apiRequest<unknown>(
    `/api/v1/workspaces/${encodeURIComponent(workspaceId)}/members`,
  );
  const parsedResponse = teamMembersResponseSchema.safeParse(response);

  if (!parsedResponse.success) {
    throw new ApiError(502, "The service returned an unexpected members response.");
  }

  return parsedResponse.data;
}

export async function createWorkspaceInvite(
  workspaceId: string,
  input: CreateWorkspaceInviteInput,
): Promise<CreateWorkspaceInviteResponse> {
  const response = await apiRequest<unknown>(
    `/api/v1/workspaces/${encodeURIComponent(workspaceId)}/invites`,
    {
      json: {
        email: input.email.trim().toLowerCase(),
        roles: input.roles,
      },
      method: "POST",
    },
  );
  const parsedResponse = createWorkspaceInviteResponseSchema.safeParse(response);

  if (!parsedResponse.success) {
    throw new ApiError(502, "The service returned an unexpected invitation response.");
  }

  return parsedResponse.data;
}

export async function getPendingWorkspaceInvites(
  workspaceId: string,
): Promise<PendingWorkspaceInvitesResponse> {
  const response = await apiRequest<unknown>(
    `/api/v1/workspaces/${encodeURIComponent(workspaceId)}/invites?status=pending`,
  );
  const parsedResponse = pendingWorkspaceInvitesResponseSchema.safeParse(response);

  if (!parsedResponse.success) {
    throw new ApiError(502, "The service returned an unexpected pending invitations response.");
  }

  return parsedResponse.data;
}

export async function resendWorkspaceInvite(
  workspaceId: string,
  inviteId: string,
): Promise<CreateWorkspaceInviteResponse> {
  const response = await apiRequest<unknown>(
    `/api/v1/workspaces/${encodeURIComponent(workspaceId)}/invites/${encodeURIComponent(inviteId)}/resend`,
    { method: "POST" },
  );
  const parsedResponse = createWorkspaceInviteResponseSchema.safeParse(response);

  if (!parsedResponse.success) {
    throw new ApiError(502, "The service returned an unexpected resend response.");
  }

  return parsedResponse.data;
}

export async function revokeWorkspaceInvite(
  workspaceId: string,
  inviteId: string,
): Promise<RevokeWorkspaceInviteResponse> {
  const response = await apiRequest<unknown>(
    `/api/v1/workspaces/${encodeURIComponent(workspaceId)}/invites/${encodeURIComponent(inviteId)}`,
    { method: "DELETE" },
  );
  const parsedResponse = revokeWorkspaceInviteResponseSchema.safeParse(response);

  if (!parsedResponse.success) {
    throw new ApiError(502, "The service returned an unexpected revoke response.");
  }

  return parsedResponse.data;
}

export async function updateMemberRoles(
  workspaceId: string,
  userId: string,
  input: UpdateMemberRolesInput,
): Promise<UpdateMemberRolesResponse> {
  const response = await apiRequest<unknown>(
    `/api/v1/workspaces/${encodeURIComponent(workspaceId)}/members/${encodeURIComponent(userId)}/roles`,
    {
      json: { roles: input.roles },
      method: "PATCH",
    },
  );
  const parsedResponse = updateMemberRolesResponseSchema.safeParse(response);

  if (!parsedResponse.success) {
    throw new ApiError(502, "The service returned an unexpected member update response.");
  }

  return parsedResponse.data;
}

export async function removeMember(
  workspaceId: string,
  userId: string,
): Promise<RemoveMemberResponse> {
  const response = await apiRequest<unknown>(
    `/api/v1/workspaces/${encodeURIComponent(workspaceId)}/members/${encodeURIComponent(userId)}`,
    { method: "DELETE" },
  );
  const parsedResponse = removeMemberResponseSchema.safeParse(response);

  if (!parsedResponse.success) {
    throw new ApiError(502, "The service returned an unexpected member removal response.");
  }

  return parsedResponse.data;
}
