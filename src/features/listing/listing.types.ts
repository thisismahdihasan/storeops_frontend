import type { z } from "zod";

import type {
  completeListingFormSchema,
  listingBackfillResponseSchema,
  listingDetailResponseSchema,
  listingFiltersSchema,
  listingQueueResponseSchema,
  listingStatusSchema,
} from "./listing.schemas";

export type CompleteListingFormValues = z.infer<
  typeof completeListingFormSchema
>;
export type ListingDetailResponse = z.infer<
  typeof listingDetailResponseSchema
>;
export type ListingBackfillResponse = z.infer<
  typeof listingBackfillResponseSchema
>;
export type ListingDetail = ListingDetailResponse["data"];
export type ListingApprovedPreview = Pick<
  NonNullable<ListingDetail["approvedPreview"]>,
  "imageDeletedAt" | "imageUrl"
> | null;
export type ListingFilters = z.infer<typeof listingFiltersSchema>;
export type ListingQueueResponse = z.infer<typeof listingQueueResponseSchema>;
export type ListingQueueItem = ListingQueueResponse["data"]["items"][number];
export type ListingStatus = z.infer<typeof listingStatusSchema>;

export const LISTING_TABS: Array<{
  label: string;
  status: ListingStatus;
}> = [
  { label: "Assigned", status: "READY_FOR_LISTING" },
  { label: "In Progress", status: "LISTING_IN_PROGRESS" },
];

const LISTING_STATUS_META: Record<
  ListingStatus,
  { label: string; tone: "info" | "success" }
> = {
  LISTING_IN_PROGRESS: { label: "Listing in Progress", tone: "info" },
  READY_FOR_LISTING: { label: "Ready for Listing", tone: "success" },
};

export function getListingStatusMeta(status: ListingStatus) {
  return LISTING_STATUS_META[status];
}

export function formatListingDate(value: string | null): string {
  if (!value) return "Not started";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unavailable";

  return new Intl.DateTimeFormat(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}
