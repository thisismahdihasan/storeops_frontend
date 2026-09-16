import type { z } from "zod";

import type {
  designDetailResponseSchema,
  designWorkspaceStatusSchema,
} from "./design-workspace.schemas";

export type DesignDetailResponse = z.infer<typeof designDetailResponseSchema>;
export type DesignDetail = DesignDetailResponse["data"];
export type DesignWorkspaceStatus = z.infer<typeof designWorkspaceStatusSchema>;
export type DesignFinalAsset = DesignDetail["finalAssets"]["items"][number];
export type DesignLatestReview = NonNullable<DesignDetail["latestReview"]>;
export type DesignWorkspaceReview =
  DesignDetail["reviewHistory"]["previousReviews"][number];
