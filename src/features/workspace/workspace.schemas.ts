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
  designerAutoAssignmentEnabled: z.boolean(),
  listerAutoAssignmentEnabled: z.boolean(),
  finalAssetAutoCleanupEnabled: z.boolean(),
  finalAssetRetentionDays: z.number().int().min(1).max(365),
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

export const updateWorkspaceSettingsInputSchema = z
  .object({
    designerAutoAssignmentEnabled: z.boolean().optional(),
    listerAutoAssignmentEnabled: z.boolean().optional(),
    finalAssetAutoCleanupEnabled: z.boolean().optional(),
    finalAssetRetentionDays: z.number().int().min(1).max(365).optional(),
  })
  .strict()
  .refine(
    (data) =>
      data.designerAutoAssignmentEnabled !== undefined ||
      data.listerAutoAssignmentEnabled !== undefined ||
      data.finalAssetAutoCleanupEnabled !== undefined ||
      data.finalAssetRetentionDays !== undefined,
    "At least one setting must be provided"
  );

export const updateWorkspaceSettingsResponseSchema = z.object({
  data: z.object({
    workspace: workspaceWithMembershipSchema.pick({
      id: true,
      name: true,
      ownerId: true,
      designerAutoAssignmentEnabled: true,
      listerAutoAssignmentEnabled: true,
      finalAssetAutoCleanupEnabled: true,
      finalAssetRetentionDays: true,
      createdAt: true,
      updatedAt: true,
    }),
  }),
  message: z.string(),
  success: z.literal(true),
});
