import type { WorkspaceRole } from "@/features/workspace/workspace.types";

export type TeamMember = {
  email: string;
  joinedAt: string;
  membershipId: string;
  name: string | null;
  roles: WorkspaceRole[];
  userId: string;
};

export type TeamMembersResponse = {
  data: {
    members: TeamMember[];
  };
  message: string;
  success: true;
};

export type CreateWorkspaceInviteInput = {
  email: string;
  roles: WorkspaceRole[];
};

export type WorkspaceInvite = {
  createdAt: string;
  email: string;
  expiresAt: string;
  id: string;
  lastSentAt: string;
  roles: WorkspaceRole[];
  workspaceId: string;
};

export type CreateWorkspaceInviteResponse = {
  data: {
    invite: WorkspaceInvite;
  };
  message: string;
  success: true;
};

export type PendingWorkspaceInviteStatus = "EXPIRED" | "PENDING";

export type PendingWorkspaceInvite = {
  acceptedAt: string | null;
  createdAt: string;
  email: string;
  expiresAt: string;
  id: string;
  lastSentAt: string | null;
  roles: WorkspaceRole[];
  status: PendingWorkspaceInviteStatus;
};

export type PendingWorkspaceInvitesResponse = {
  data: {
    invites: PendingWorkspaceInvite[];
  };
  message: string;
  success: true;
};

export type RevokeWorkspaceInviteResponse = {
  data: {
    inviteId: string;
  };
  message: string;
  success: true;
};

export type UpdateMemberRolesInput = {
  roles: WorkspaceRole[];
};

export type UpdateMemberRolesResponse = {
  data: {
    member: TeamMember;
  };
  message: string;
  success: true;
};

export type RemoveMemberResponse = {
  data: {
    userId: string;
  };
  message: string;
  success: true;
};
