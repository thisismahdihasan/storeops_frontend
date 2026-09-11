import { z } from "zod";

import { workspaceRoleSchema } from "@/features/workspace/workspace.schemas";

export const createWorkspaceInviteInputSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Email is required")
    .email("Enter a valid email address"),
  roles: z
    .array(workspaceRoleSchema)
    .min(1, "Select at least one role")
    .refine((roles) => new Set(roles).size === roles.length, {
      message: "Each role can only be selected once",
    }),
});

export const teamMemberSchema = z.object({
  email: z.string().email(),
  joinedAt: z.string(),
  membershipId: z.string(),
  name: z.string().nullable(),
  roles: z.array(workspaceRoleSchema),
  userId: z.string(),
});

export const teamMembersResponseSchema = z.object({
  data: z.object({
    members: z.array(teamMemberSchema),
  }),
  message: z.string(),
  success: z.literal(true),
});

export const workspaceInviteSchema = z.object({
  createdAt: z.string(),
  email: z.string().email(),
  expiresAt: z.string(),
  id: z.string(),
  lastSentAt: z.string(),
  roles: z.array(workspaceRoleSchema),
  workspaceId: z.string(),
});

export const createWorkspaceInviteResponseSchema = z.object({
  data: z.object({
    invite: workspaceInviteSchema,
  }),
  message: z.string(),
  success: z.literal(true),
});

export const pendingWorkspaceInviteStatusSchema = z.enum([
  "PENDING",
  "EXPIRED",
]);

export const pendingWorkspaceInviteSchema = z.object({
  acceptedAt: z.string().nullable(),
  createdAt: z.string(),
  email: z.string().email(),
  expiresAt: z.string(),
  id: z.string(),
  lastSentAt: z.string().nullable(),
  roles: z.array(workspaceRoleSchema),
  status: pendingWorkspaceInviteStatusSchema,
});

export const pendingWorkspaceInvitesResponseSchema = z.object({
  data: z.object({
    invites: z.array(pendingWorkspaceInviteSchema),
  }),
  message: z.string(),
  success: z.literal(true),
});

export const revokeWorkspaceInviteResponseSchema = z.object({
  data: z.object({
    inviteId: z.string(),
  }),
  message: z.string(),
  success: z.literal(true),
});
