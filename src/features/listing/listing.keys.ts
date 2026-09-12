import type { ListingFilters } from "./listing.types";

export const listingKeys = {
  all: (workspaceId: string) => ["listing", workspaceId] as const,
  detail: (workspaceId: string, researchItemId: string) =>
    ["listing", workspaceId, "detail", researchItemId] as const,
  details: (workspaceId: string) =>
    ["listing", workspaceId, "detail"] as const,
  queue: (workspaceId: string, filters: ListingFilters) =>
    ["listing", workspaceId, "queue", filters] as const,
  queues: (workspaceId: string) =>
    ["listing", workspaceId, "queue"] as const,
};
