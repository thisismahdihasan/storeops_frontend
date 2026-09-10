import type { WorkspaceRole } from "@/features/workspace/workspace.types";

export type AcceptedMembership = {
  createdAt: string;
  id: string;
  roles: WorkspaceRole[];
  userId: string;
  workspaceId: string;
};

export type AcceptedWorkspace = {
  id: string;
  name: string;
};

export type AcceptedInviteSummary = {
  acceptedAt: string | null;
  id: string;
};

export type AcceptInviteData = {
  invite: AcceptedInviteSummary;
  membership: AcceptedMembership;
  workspace: AcceptedWorkspace;
};

export type AcceptInviteResponse = {
  data: AcceptInviteData;
  message: string;
  success: true;
};
