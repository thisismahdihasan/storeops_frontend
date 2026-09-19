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
