import { z } from "zod";

export const researchStatusSchema = z.enum([
  "RESEARCHED",
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

export const issueReasonSchema = z.enum([
  "REFERENCE_UNCLEAR",
  "COPYRIGHT_CONCERN",
  "TOO_COMPLEX",
  "IMAGE_QUALITY",
  "OTHER",
]);

export const userSummarySchema = z.object({
  email: z.string().email(),
  id: z.string(),
  name: z.string().nullable(),
});

export const currentDesignAssignmentSchema = z.object({
  assignedAt: z.string(),
  completedAt: z.string().nullable(),
  designerId: z.string(),
  id: z.string(),
  isCurrent: z.boolean(),
  startedAt: z.string().nullable(),
});

export const latestIssueReportSchema = z.object({
  createdAt: z.string(),
  details: z.string().nullable(),
  id: z.string(),
  reason: issueReasonSchema,
  reportedBy: userSummarySchema,
});

export const latestReviewSummarySchema = z.object({
  approvedAt: z.string().nullable(),
  approvedById: z.string().nullable(),
  id: z.string(),
  imageDeletedAt: z.string().nullable(),
  imageUrl: z.string().nullable(),
  note: z.string().nullable(),
  roundNumber: z.number(),
  submittedAt: z.string(),
});

export const safeResearchItemSchema = z.object({
  createdAt: z.string(),
  createdById: z.string(),
  etsyListingId: z.string(),
  id: z.string(),
  normalizedUrl: z.string(),
  originalUrl: z.string(),
  referenceImageUrl: z.string().nullable(),
  status: researchStatusSchema,
  title: z.string().nullable(),
  updatedAt: z.string(),
  workspaceId: z.string(),
});

export const researchItemListItemSchema = z.object({
  createdAt: z.string(),
  createdBy: userSummarySchema,
  currentDesignAssignment: currentDesignAssignmentSchema.nullable(),
  currentDesigner: userSummarySchema.nullable(),
  etsyListingId: z.string(),
  id: z.string(),
  latestIssueReport: latestIssueReportSchema.nullable(),
  normalizedUrl: z.string(),
  originalUrl: z.string(),
  referenceImageUrl: z.string().nullable(),
  status: researchStatusSchema,
  title: z.string().nullable(),
  updatedAt: z.string(),
  workspaceId: z.string(),
});

export const paginationMetaSchema = z.object({
  limit: z.number(),
  page: z.number(),
  total: z.number(),
  totalPages: z.number(),
});

export const researchListResponseSchema = z.object({
  data: z.object({
    items: z.array(researchItemListItemSchema),
    pagination: paginationMetaSchema,
  }),
  message: z.string(),
  success: z.literal(true),
});

export const researchDetailResponseSchema = z.object({
  data: z.object({
    researchItem: z.object({
      createdAt: z.string(),
      createdBy: userSummarySchema,
      currentDesignAssignment: currentDesignAssignmentSchema.nullable(),
      currentDesigner: userSummarySchema.nullable(),
      etsyListingId: z.string(),
      id: z.string(),
      latestReview: latestReviewSummarySchema.nullable(),
      normalizedUrl: z.string(),
      originalUrl: z.string(),
      referenceImageUrl: z.string().nullable(),
      status: researchStatusSchema,
      title: z.string().nullable(),
      updatedAt: z.string(),
      workspaceId: z.string(),
    }),
  }),
  message: z.string(),
  success: z.literal(true),
});

export const createResearchResponseSchema = z.object({
  data: z.object({
    researchItem: safeResearchItemSchema,
  }),
  message: z.string(),
  success: z.literal(true),
});

export const duplicateResearchDataSchema = z.object({
  alreadyExists: z.literal(true),
  createdAt: z.string(),
  createdBy: userSummarySchema,
  currentStatus: researchStatusSchema,
  researchItemId: z.string(),
});

// Client-side validation schema for Add Research form
export const createResearchFormSchema = z.object({
  etsyUrl: z
    .string()
    .trim()
    .min(1, "Etsy listing URL is required")
    .refine((url) => {
      try {
        const parsed = new URL(url);
        if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
          return false;
        }
        const hostname = parsed.hostname.toLowerCase();
        const isEtsyHost =
          hostname === "etsy.com" || hostname.endsWith(".etsy.com");
        if (!isEtsyHost) {
          return false;
        }
        return /(?:^|\/)listing\/(\d+)(?:\/|$)/i.test(parsed.pathname);
      } catch {
        return false;
      }
    }, "Please enter a valid Etsy listing URL with a numeric listing ID (e.g. https://www.etsy.com/listing/123456789)"),
});

export const previewDuplicateDataSchema = z.object({
  createdAt: z.string(),
  createdBy: userSummarySchema,
  currentStatus: researchStatusSchema,
  researchItemId: z.string(),
});

export const previewResearchResultSchema = z.object({
  alreadyExists: z.boolean(),
  duplicate: previewDuplicateDataSchema.nullable(),
  etsyListingId: z.string(),
  normalizedUrl: z.string(),
  referenceImageUrl: z.string().nullable(),
  title: z.string().nullable(),
});

export const previewResearchResponseSchema = z.object({
  data: previewResearchResultSchema,
  message: z.string(),
  success: z.literal(true),
});

export const uploadReferenceImageResponseSchema = z.object({
  data: z.object({
    referenceImageUrl: z.string(),
    researchItemId: z.string(),
  }),
  message: z.string(),
  success: z.literal(true),
});

export const updateResearchItemInputSchema = z.object({
  title: z.string().nullable().optional(),
});

export const updateResearchItemResponseSchema = z.object({
  data: z.object({
    researchItem: safeResearchItemSchema,
  }),
  message: z.string(),
  success: z.literal(true),
});

export const deleteResearchItemResponseSchema = z.object({
  data: z.object({
    researchItemId: z.string(),
  }),
  message: z.string(),
  success: z.literal(true),
});

export const updateTitleFormSchema = z.object({
  title: z.string().trim().max(300, "Title cannot exceed 300 characters"),
});
