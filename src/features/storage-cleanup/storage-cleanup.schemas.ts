import { z } from "zod";

export const finalAssetStorageMetricSchema = z
  .object({
    count: z.number().int().nonnegative(),
    bytes: z.string().regex(/^\d+$/),
  })
  .strict();

export const finalAssetStorageMetricsDataSchema = z
  .object({
    active: finalAssetStorageMetricSchema,
    reclaimable: finalAssetStorageMetricSchema,
    cleaned: finalAssetStorageMetricSchema,
  })
  .strict();

export const finalAssetStorageMetricsResponseSchema = z
  .object({
    data: finalAssetStorageMetricsDataSchema,
    message: z.string(),
    success: z.literal(true),
  })
  .strict();

export const storageCleanupFilterSchema = z.enum([
  "ELIGIBLE",
  "CLEANED",
  "ALL",
]);

export const storageCleanupCandidateSchema = z
  .object({
    finalAssetId: z.string().min(1),
    researchItemId: z.string().min(1),
    etsyListingId: z.string().min(1),
    title: z.string().nullable(),
    fileName: z.string().min(1),
    fileSize: z.string().regex(/^\d+$/),
    uploadedAt: z.string(),
    listedAt: z.string(),
    storageDeletedAt: z.string().nullable(),
  })
  .strict();

export const storageCleanupPaginationSchema = z
  .object({
    page: z.number().int().positive(),
    limit: z.number().int().positive(),
    total: z.number().int().nonnegative(),
    totalPages: z.number().int().nonnegative(),
  })
  .strict();

export const storageCleanupCandidatesResponseSchema = z
  .object({
    data: z
      .object({
        items: z.array(storageCleanupCandidateSchema),
        pagination: storageCleanupPaginationSchema,
      })
      .strict(),
    message: z.string(),
    success: z.literal(true),
  })
  .strict();

export const finalAssetCleanupResultSchema = z
  .object({
    finalAssetId: z.string().min(1),
    status: z.enum(["CLEANED", "ALREADY_CLEANED"]),
    reclaimedBytes: z.string().regex(/^\d+$/),
    storageDeletedAt: z.string(),
  })
  .strict();

export const finalAssetCleanupResponseSchema = z
  .object({
    data: finalAssetCleanupResultSchema,
    message: z.string(),
    success: z.literal(true),
  })
  .strict();

export const bulkFinalAssetCleanupFailureSchema = z
  .object({
    finalAssetId: z.string().min(1),
    reason: z.string(),
  })
  .strict();

export const bulkFinalAssetCleanupResultSchema = z
  .object({
    requestedCount: z.number().int().nonnegative(),
    cleanedCount: z.number().int().nonnegative(),
    alreadyCleanedCount: z.number().int().nonnegative(),
    failedCount: z.number().int().nonnegative(),
    ineligibleCount: z.number().int().nonnegative(),
    reclaimedBytes: z.string().regex(/^\d+$/),
    failed: z.array(bulkFinalAssetCleanupFailureSchema),
  })
  .strict();

export const bulkFinalAssetCleanupResponseSchema = z
  .object({
    data: bulkFinalAssetCleanupResultSchema,
    message: z.string(),
    success: z.literal(true),
  })
  .strict();
