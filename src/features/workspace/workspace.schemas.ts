import { z } from "zod";

export const workspaceRoleSchema = z.enum([
  "ADMIN",
  "RESEARCHER",
  "DESIGNER",
  "LISTER",
]);

export const workspaceMembershipSummarySchema = z.object({
  createdAt: z.string(),
  designerAssignmentEnabled: z.boolean(),
  designerAssignmentPausedUntil: z.string().nullable(),
  listerAssignmentEnabled: z.boolean(),
  listerAssignmentPausedUntil: z.string().nullable(),
  id: z.string(),
  roles: z.array(workspaceRoleSchema),
});

export const workspaceWithMembershipSchema = z.object({
  createdAt: z.string(),
  id: z.string(),
  membership: workspaceMembershipSummarySchema,
  name: z.string(),
  ownerId: z.string(),
  updatedAt: z.string(),
});

export const workspacesResponseSchema = z.object({
  data: z.object({
    workspaces: z.array(workspaceWithMembershipSchema),
  }),
  message: z.string(),
  success: z.literal(true),
});

export const createWorkspaceInputSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Workspace name cannot be empty")
    .max(100, "Workspace name must be at most 100 characters long"),
});

export const workspaceSchema = z.object({
  createdAt: z.string(),
  id: z.string(),
  name: z.string(),
  ownerId: z.string(),
  updatedAt: z.string(),
});

export const workspaceMembershipSchema = z.object({
  createdAt: z.string(),
  id: z.string(),
  roles: z.array(workspaceRoleSchema),
  userId: z.string(),
  workspaceId: z.string(),
});

export const createWorkspaceResponseSchema = z.object({
  data: z.object({
    membership: workspaceMembershipSchema,
    workspace: workspaceSchema,
  }),
  message: z.string(),
  success: z.literal(true),
});
