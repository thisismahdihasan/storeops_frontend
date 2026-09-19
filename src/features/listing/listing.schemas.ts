import { z } from "zod";

export const listingStatusSchema = z.enum([
  "READY_FOR_LISTING",
  "LISTING_IN_PROGRESS",
]);

export const listingFiltersSchema = z
  .object({
    limit: z.literal(20).default(20),
    page: z.number().int().positive().default(1),
    search: z.string().trim().min(1).max(100).optional(),
    status: listingStatusSchema.default("READY_FOR_LISTING"),
  })
  .strict();

const detailPersonSchema = z
  .object({
    id: z.string(),
    name: z.string().nullable(),
    profileImageUrl: z.string().nullable(),
  })
  .strict();

const approvedPreviewSchema = z
  .object({
    approvedAt: z.string(),
    imageDeletedAt: z.string().nullable(),
    imageUrl: z.string().url().nullable(),
    reviewId: z.string(),
    roundNumber: z.number().int().positive(),
  })
  .strict()
  .nullable();

const queueApprovedPreviewSchema = z
  .object({
    imageDeletedAt: z.string().nullable(),
    imageUrl: z.string().url().nullable(),
  })
  .strict()
  .nullable();

const queueFinalAssetSchema = z
  .object({
    fileName: z.string(),
    fileSize: z.string().regex(/^\d+$/),
    id: z.string(),
    mimeType: z.string(),
  })
  .strict();

const queueResearchItemSchema = z
  .object({
    etsyListingId: z.string(),
    id: z.string(),
    originalUrl: z.string().url(),
    status: listingStatusSchema,
    title: z.string().nullable(),
  })
  .strict();

export const listingQueueResponseSchema = z
  .object({
    data: z
      .object({
        items: z.array(
          z
            .object({
              assignmentId: z.string(),
              finalAssetId: z.string().nullable(),
              preview: queueApprovedPreviewSchema,
              researchItem: queueResearchItemSchema,
            })
            .strict(),
        ),
        pagination: z
          .object({
            limit: z.number().int().positive(),
            page: z.number().int().positive(),
            total: z.number().int().nonnegative(),
            totalPages: z.number().int().nonnegative(),
          })
          .strict(),
      })
      .strict(),
    message: z.string(),
    success: z.literal(true),
  })
  .strict();

const detailFinalAssetSchema = queueFinalAssetSchema
  .extend({
    uploadedAt: z.string(),
    storageDeletedAt: z.string().nullable(),
  })
  .strict();

export const listingDetailResponseSchema = z
  .object({
    data: z
      .object({
        approvedPreview: approvedPreviewSchema,
        creator: detailPersonSchema,
        designer: detailPersonSchema.nullable(),
        finalAssets: z.array(detailFinalAssetSchema),
        listingAssignment: z
          .object({
            assignedAt: z.string(),
            completedAt: z.string().nullable(),
            id: z.string(),
            isCurrent: z.literal(true),
            startedAt: z.string().nullable(),
          })
          .strict(),
        researchItem: z
          .object({
            createdAt: z.string(),
            etsyListingId: z.string(),
            id: z.string(),
            normalizedUrl: z.string().url(),
            originalUrl: z.string().url(),
            status: listingStatusSchema,
            title: z.string().nullable(),
            updatedAt: z.string(),
          })
          .strict(),
      })
      .strict(),
    message: z.string(),
    success: z.literal(true),
  })
  .strict();

export const startListingResponseSchema = z
  .object({
    data: z
      .object({
        assignment: z
          .object({ id: z.string(), startedAt: z.string() })
          .strict(),
        researchItem: z
          .object({ id: z.string(), status: z.literal("LISTING_IN_PROGRESS") })
          .strict(),
      })
      .strict(),
    message: z.string(),
    success: z.literal(true),
  })
  .strict();

export const completeListingResponseSchema = z
  .object({
    data: z
      .object({
        assignment: z
          .object({ completedAt: z.string(), id: z.string() })
          .strict(),
        listingResult: z
          .object({
            etsyListingUrl: z.string().url().nullable(),
            id: z.string(),
            listedAt: z.string(),
          })
          .strict(),
        researchItem: z
          .object({ id: z.string(), status: z.literal("LISTED") })
          .strict(),
      })
      .strict(),
    message: z.string(),
    success: z.literal(true),
  })
  .strict();

export const listingBackfillResponseSchema = z
  .object({
    data: z
      .object({
        assignedItemIds: z.array(z.string()),
        backfilledCount: z.number().int().nonnegative(),
      })
      .strict(),
    message: z.string(),
    success: z.literal(true),
  })
  .strict();

export const completeListingFormSchema = z
  .object({
    etsyListingUrl: z
      .string()
      .trim()
      .max(2048, "Etsy Listing URL cannot exceed 2048 characters.")
      .superRefine((value, context) => {
        const trimmed = value.trim();
        if (!trimmed) return;

        let url: URL;
        try {
          url = new URL(trimmed);
        } catch {
          context.addIssue({
            code: "custom",
            message: "Enter a valid HTTP or HTTPS URL.",
          });
          return;
        }

        if (url.protocol !== "http:" && url.protocol !== "https:") {
          context.addIssue({
            code: "custom",
            message: "Enter a valid HTTP or HTTPS URL.",
          });
          return;
        }

        const hostname = url.hostname.toLowerCase();
        if (hostname !== "etsy.com" && !hostname.endsWith(".etsy.com")) {
          context.addIssue({
            code: "custom",
            message: "Use an etsy.com listing URL.",
          });
          return;
        }

        if (!/(?:^|\/)listing\/\d+(?:\/|$)/i.test(url.pathname)) {
          context.addIssue({
            code: "custom",
            message: "The URL must contain /listing/ followed by a numeric listing ID.",
          });
        }
      }),
  })
  .strict();
