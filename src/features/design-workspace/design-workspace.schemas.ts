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
  updatedAt: z.string(),
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
  updatedAt: z.string(),
});

const workspaceReviewAnnotationSchema = z.object({
  comment: z.string(),
  createdAt: z.string(),
  createdBy: z.object({ id: z.string(), name: z.string().nullable() }),
  id: z.string(),
  replies: z.array(z.object({
    createdAt: z.string(),
    createdBy: z.object({ id: z.string(), name: z.string().nullable() }),
    id: z.string(),
    message: z.string(),
    updatedAt: z.string(),
  })),
  x: z.number(),
  y: z.number(),
  updatedAt: z.string(),
});

export const designWorkspaceReviewSchema = z.object({
  annotations: z.array(workspaceReviewAnnotationSchema),
  id: z.string(),
  imageDeletedAt: z.string().nullable(),
  imageUrl: z.string().url().nullable(),
  note: z.string().nullable(),
  roundNumber: z.number().int().positive(),
  submittedAt: z.string(),
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
    reviewHistory: z.object({
      previousReviews: z.array(designWorkspaceReviewSchema),
    }),
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

export const multipartInitRequestSchema = z.object({
  fileName: z.string().trim().min(1),
  fileSize: z.number().int().positive().max(1024 * 1024 * 1024),
}).strict();

export const multipartCompletePartSchema = z.object({
  eTag: z.string().min(1),
  partNumber: z.number().int().positive().max(103),
}).strict();

export const multipartCompleteRequestSchema = z.object({
  parts: z.array(multipartCompletePartSchema).min(1).max(103),
  sessionToken: z.string().min(1),
}).strict();

export const multipartAbortRequestSchema = z.object({
  sessionToken: z.string().min(1),
}).strict();

export const multipartInitResponseSchema = z.object({
  data: z.object({
    partCount: z.number().int().positive().max(103),
    partSize: z.number().int().positive(),
    parts: z.array(z.object({
      partNumber: z.number().int().positive(),
      uploadUrl: z.string().url(),
    }).strict()).min(1).max(103),
    sessionToken: z.string().min(1),
  }).strict(),
  message: z.string(),
  success: z.literal(true),
}).superRefine((value, context) => {
  if (value.data.parts.length !== value.data.partCount) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Multipart part count does not match the response parts.",
      path: ["data", "parts"],
    });
  }

  const partNumbers = new Set<number>();
  value.data.parts.forEach((part, index) => {
    if (partNumbers.has(part.partNumber)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Multipart response contains duplicate part numbers.",
        path: ["data", "parts", index, "partNumber"],
      });
    }
    partNumbers.add(part.partNumber);
  });

  for (let partNumber = 1; partNumber <= value.data.partCount; partNumber += 1) {
    if (!partNumbers.has(partNumber)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Multipart response is missing an expected part number.",
        path: ["data", "parts"],
      });
      break;
    }
  }
});

export const multipartAbortResponseSchema = z.object({
  data: z.object({}).strict(),
  message: z.string(),
  success: z.literal(true),
});

export type MultipartInitRequest = z.infer<typeof multipartInitRequestSchema>;
export type MultipartInitResponse = z.infer<typeof multipartInitResponseSchema>["data"];
export type MultipartCompleteRequest = z.infer<typeof multipartCompleteRequestSchema>;
export type MultipartAbortRequest = z.infer<typeof multipartAbortRequestSchema>;
