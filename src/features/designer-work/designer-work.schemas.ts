import { z } from "zod";

export const designerWorkStatusSchema = z.enum([
  "ASSIGNED",
  "DESIGN_IN_PROGRESS",
  "DESIGN_REVIEW",
  "CORRECTION_NEEDED",
  "ISSUE_REPORTED",
  "DESIGN_APPROVED",
]);

export const designerWorkFiltersSchema = z.object({
  limit: z.literal(20).default(20),
  page: z.number().int().positive().default(1),
  search: z.string().trim().min(1).optional(),
  status: designerWorkStatusSchema.optional(),
});

const queueUserSchema = z.object({
  email: z.string().email(),
  id: z.string(),
  name: z.string().nullable(),
});

const queueResearchItemSchema = z.object({
  createdAt: z.string(),
  createdBy: queueUserSchema,
  etsyListingId: z.string(),
  id: z.string(),
  normalizedUrl: z.string(),
  originalUrl: z.string(),
  referenceImageUrl: z.string().nullable(),
  status: designerWorkStatusSchema,
  title: z.string().nullable(),
  updatedAt: z.string(),
});

export const designerQueueResponseSchema = z.object({
  data: z.object({
    items: z.array(z.object({
      assignedAt: z.string(),
      assignmentId: z.string(),
      researchItem: queueResearchItemSchema,
      startedAt: z.string().nullable(),
    })),
    pagination: z.object({
      limit: z.number(), page: z.number(), total: z.number(), totalPages: z.number(),
    }),
  }),
  message: z.string(),
  success: z.literal(true),
});

export const workflowActionResponseSchema = z.object({
  data: z.object({
    researchItem: z.object({ id: z.string(), status: designerWorkStatusSchema }),
  }),
  message: z.string(),
  success: z.literal(true),
});

export const reportIssueFormSchema = z.object({
  details: z.string().trim().max(1000, "Details cannot exceed 1000 characters.").optional(),
  reason: z.enum([
    "REFERENCE_UNCLEAR", "COPYRIGHT_CONCERN", "TOO_COMPLEX", "IMAGE_QUALITY", "OTHER",
  ], { message: "Select an issue reason." }),
});

export const reportIssueResponseSchema = workflowActionResponseSchema.extend({
  data: workflowActionResponseSchema.shape.data.extend({
    issueReport: z.object({
      createdAt: z.string(), details: z.string().nullable(), id: z.string(), reason: z.string(),
    }),
  }),
});
