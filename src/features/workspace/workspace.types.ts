export type WorkspaceRole = "ADMIN" | "RESEARCHER" | "DESIGNER" | "LISTER";

export type WorkspaceMembershipSummary = {
  createdAt: string;
  id: string;
  roles: WorkspaceRole[];
  designerAssignmentEnabled: boolean;
  designerAssignmentPausedUntil: string | null;
  listerAssignmentEnabled: boolean;
  listerAssignmentPausedUntil: string | null;
};

export type WorkspaceWithMembership = {
  createdAt: string;
  id: string;
  membership: WorkspaceMembershipSummary;
  name: string;
  ownerId: string;
  updatedAt: string;
};

export type WorkspacesData = {
  workspaces: WorkspaceWithMembership[];
};

export type WorkspacesResponse = {
  data: WorkspacesData;
  message: string;
  success: true;
};

export type CreateWorkspaceInput = {
  name: string;
};

export type Workspace = {
  createdAt: string;
  id: string;
  name: string;
  ownerId: string;
  updatedAt: string;
};

export type WorkspaceMembership = {
  createdAt: string;
  id: string;
  roles: WorkspaceRole[];
  userId: string;
  workspaceId: string;
};

export type CreateWorkspaceData = {
  membership: WorkspaceMembership;
  workspace: Workspace;
};

export type CreateWorkspaceResponse = {
  data: CreateWorkspaceData;
  message: string;
  success: true;
};
