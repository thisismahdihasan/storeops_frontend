import { z } from "zod";

import { workspaceRoleSchema } from "@/features/workspace/workspace.schemas";

export const acceptedMembershipSchema = z.object({
  createdAt: z.string(),
  id: z.string().min(1),
  roles: z.array(workspaceRoleSchema),
  userId: z.string().min(1),
  workspaceId: z.string().min(1),
});

export const acceptedWorkspaceSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
});

export const acceptedInviteSummarySchema = z.object({
  acceptedAt: z.string().nullable(),
  id: z.string().min(1),
});

export const acceptInviteResponseSchema = z.object({
  data: z.object({
    invite: acceptedInviteSummarySchema,
    membership: acceptedMembershipSchema,
    workspace: acceptedWorkspaceSchema,
  }),
  message: z.string(),
  success: z.literal(true),
});
