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

export const reviewUserSummarySchema = z.object({
  email: z.string(),
  id: z.string(),
  name: z.string().nullable(),
});

export const reviewAssignmentSummarySchema = z.object({
  assignedAt: z.string(),
  completedAt: z.string().nullable(),
  designerId: z.string(),
  id: z.string(),
  isCurrent: z.boolean(),
  startedAt: z.string().nullable(),
});

export const reviewQueueItemReviewSchema = z.object({
  id: z.string(),
  imageDeletedAt: z.string().nullable(),
  imageUrl: z.string().nullable(),
  note: z.string().nullable(),
  roundNumber: z.number().int(),
  submittedAt: z.string(),
});

export const reviewQueueItemResearchSchema = z.object({
  etsyListingId: z.string(),
  id: z.string(),
  normalizedUrl: z.string(),
  originalUrl: z.string(),
  status: researchStatusSchema,
  title: z.string().nullable(),
});

export const reviewQueueItemSchema = z.object({
  designer: reviewUserSummarySchema.nullable(),
  researchItem: reviewQueueItemResearchSchema,
  review: reviewQueueItemReviewSchema,
});

export const reviewQueuePaginationSchema = z.object({
  limit: z.number().int(),
  page: z.number().int(),
  total: z.number().int(),
  totalPages: z.number().int(),
});

export const reviewQueueResponseSchema = z.object({
  data: z.object({
    items: z.array(reviewQueueItemSchema),
    pagination: reviewQueuePaginationSchema,
  }),
  message: z.string(),
  statusCode: z.number(),
  success: z.boolean(),
});

export const reviewReplyDetailSchema = z.object({
  createdAt: z.string(),
  createdBy: z.object({
    id: z.string(),
    name: z.string().nullable(),
  }),
  id: z.string(),
  message: z.string(),
});

export const reviewAnnotationDetailSchema = z.object({
  comment: z.string(),
  createdAt: z.string(),
  createdBy: z.object({
    id: z.string(),
    name: z.string().nullable(),
  }),
  id: z.string(),
  replies: z.array(reviewReplyDetailSchema),
  resolved: z.boolean(),
  x: z.number(),
  y: z.number(),
});

export const reviewHistoryItemSchema = z.object({
  annotations: z.array(reviewAnnotationDetailSchema),
  approvedAt: z.string().nullable(),
  approvedById: z.string().nullable(),
  id: z.string(),
  imageDeletedAt: z.string().nullable(),
  imageUrl: z.string().nullable(),
  note: z.string().nullable(),
  roundNumber: z.number().int(),
  submittedAt: z.string(),
});

export const reviewDetailResearchItemSchema = z.object({
  createdAt: z.string(),
  createdBy: reviewUserSummarySchema,
  etsyListingId: z.string(),
  id: z.string(),
  normalizedUrl: z.string(),
  originalUrl: z.string(),
  referenceImageUrl: z.string().nullable(),
  status: researchStatusSchema,
  title: z.string().nullable(),
  updatedAt: z.string(),
});

export const reviewDetailResponseSchema = z.object({
  data: z.object({
    currentDesignAssignment: reviewAssignmentSummarySchema.nullable(),
    currentDesigner: reviewUserSummarySchema.nullable(),
    latestReviewId: z.string(),
    researchItem: reviewDetailResearchItemSchema,
    reviews: z.array(reviewHistoryItemSchema),
    selectedReview: reviewHistoryItemSchema,
  }),
  message: z.string(),
  statusCode: z.number(),
  success: z.boolean(),
});

export const createAnnotationResponseSchema = z.object({
  data: z.object({
    annotation: z.object({
      comment: z.string(),
      createdAt: z.string(),
      createdBy: z.object({
        id: z.string(),
        name: z.string().nullable(),
      }),
      id: z.string(),
      resolved: z.boolean(),
      reviewSubmissionId: z.string(),
      x: z.number(),
      y: z.number(),
    }),
  }),
  message: z.string(),
  statusCode: z.number(),
  success: z.boolean(),
});

export const createReplyResponseSchema = z.object({
  data: z.object({
    reply: z.object({
      annotationId: z.string(),
      createdAt: z.string(),
      createdBy: z.object({
        id: z.string(),
        name: z.string().nullable(),
      }),
      id: z.string(),
      message: z.string(),
    }),
  }),
  message: z.string(),
  statusCode: z.number(),
  success: z.boolean(),
});

export const requestCorrectionResponseSchema = z.object({
  data: z.object({
    researchItem: z.object({
      id: z.string(),
      status: researchStatusSchema,
    }),
  }),
  message: z.string(),
  statusCode: z.number(),
  success: z.boolean(),
});

export const approveReviewResponseSchema = z.object({
  data: z.object({
    researchItem: z.object({
      id: z.string(),
      status: researchStatusSchema,
    }),
    reviewSubmission: z.object({
      approvedAt: z.string(),
      approvedById: z.string(),
      id: z.string(),
      roundNumber: z.number().int(),
    }),
  }),
  message: z.string(),
  statusCode: z.number(),
  success: z.boolean(),
});
