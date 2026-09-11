import { z } from "zod";

export const designWorkspaceStatusSchema = z.enum([
  "ASSIGNED",
  "DESIGN_IN_PROGRESS",
  "DESIGN_REVIEW",
  "CORRECTION_NEEDED",
  "ISSUE_REPORTED",
  "DESIGN_APPROVED",
  "READY_FOR_LISTING",
  "LISTING_IN_PROGRESS",
  "LISTED",
]);

const userSchema = z.object({
  email: z.string().email(),
  id: z.string(),
  name: z.string().nullable(),
});

const annotationReplySchema = z.object({
  createdAt: z.string(),
  createdBy: z.object({ id: z.string(), name: z.string().nullable() }),
  id: z.string(),
  message: z.string(),
});

const annotationSchema = z.object({
  comment: z.string(),
  createdAt: z.string(),
  createdBy: z.object({ id: z.string(), name: z.string().nullable() }),
  id: z.string(),
  replies: z.array(annotationReplySchema),
  resolved: z.boolean(),
  x: z.number(),
  y: z.number(),
});

export const designDetailResponseSchema = z.object({
  data: z.object({
    assignment: z.object({
      assignedAt: z.string(),
      id: z.string(),
      isCurrent: z.literal(true),
      startedAt: z.string().nullable(),
    }),
    currentDesigner: userSchema,
    finalAssets: z.object({
      count: z.number().int().nonnegative(),
      items: z.array(z.object({
        fileName: z.string(),
        fileSize: z.string().regex(/^\d+$/),
        id: z.string(),
        mimeType: z.string(),
        uploadedAt: z.string(),
      })),
    }),
    latestIssue: z.object({
      createdAt: z.string(),
      details: z.string().nullable(),
      id: z.string(),
      reason: z.string(),
    }).nullable(),
    latestReview: z.object({
      annotations: z.array(annotationSchema),
      approvedAt: z.string().nullable(),
      id: z.string(),
      imageDeletedAt: z.string().nullable(),
      imageUrl: z.string().url().nullable(),
      note: z.string().nullable(),
      roundNumber: z.number().int().positive(),
      submittedAt: z.string(),
    }).nullable(),
    researcher: userSchema,
    researchItem: z.object({
      createdAt: z.string(),
      etsyListingId: z.string(),
      id: z.string(),
      originalUrl: z.string().url(),
      status: designWorkspaceStatusSchema,
      title: z.string().nullable(),
      updatedAt: z.string(),
    }),
  }),
  message: z.string(),
  success: z.literal(true),
});

export const designWorkflowResponseSchema = z.object({
  data: z.object({
    researchItem: z.object({
      id: z.string(),
      status: designWorkspaceStatusSchema,
    }),
  }),
  message: z.string(),
  success: z.literal(true),
});
