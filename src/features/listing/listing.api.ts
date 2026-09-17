import { ApiError, apiRequest } from "@/lib/api";

import {
  completeListingResponseSchema,
  listingBackfillResponseSchema,
  listingDetailResponseSchema,
  listingQueueResponseSchema,
  startListingResponseSchema,
} from "./listing.schemas";
import type {
  CompleteListingFormValues,
  ListingBackfillResponse,
  ListingDetailResponse,
  ListingFilters,
  ListingQueueResponse,
} from "./listing.types";

export async function backfillListingAssignments(
  workspaceId: string,
): Promise<ListingBackfillResponse> {
  const response = await apiRequest<unknown>(
    `/api/v1/workspaces/${workspaceId}/listing/backfill-assignments`,
    { method: "POST" },
  );
  const parsed = listingBackfillResponseSchema.safeParse(response);

  if (!parsed.success) {
    throw new ApiError(502, "Unexpected listing assignment sync response format.");
  }

  return parsed.data;
}

function buildQueueQuery(filters: ListingFilters): string {
  const searchParams = new URLSearchParams({
    limit: filters.limit.toString(),
    page: filters.page.toString(),
    status: filters.status,
  });

  if (filters.search) searchParams.set("search", filters.search);
  return `?${searchParams.toString()}`;
}

export async function getListingQueue(
  workspaceId: string,
  filters: ListingFilters,
): Promise<ListingQueueResponse> {
  const response = await apiRequest<unknown>(
    `/api/v1/workspaces/${workspaceId}/lister/my-work${buildQueueQuery(filters)}`,
  );
  const parsed = listingQueueResponseSchema.safeParse(response);

  if (!parsed.success) {
    throw new ApiError(502, "Unexpected listing queue response format.");
  }

  return parsed.data;
}

export async function getListingDetail(
  workspaceId: string,
  researchItemId: string,
): Promise<ListingDetailResponse> {
  const response = await apiRequest<unknown>(
    `/api/v1/workspaces/${workspaceId}/listing/${researchItemId}`,
  );
  const parsed = listingDetailResponseSchema.safeParse(response);

  if (!parsed.success) {
    throw new ApiError(502, "Unexpected listing detail response format.");
  }

  return parsed.data;
}

export async function startListing(
  workspaceId: string,
  researchItemId: string,
) {
  const response = await apiRequest<unknown>(
    `/api/v1/workspaces/${workspaceId}/listing/${researchItemId}/start`,
    { json: {}, method: "POST" },
  );
  const parsed = startListingResponseSchema.safeParse(response);

  if (!parsed.success) {
    throw new ApiError(502, "Unexpected start listing response format.");
  }

  return parsed.data;
}

export async function completeListing(
  workspaceId: string,
  researchItemId: string,
  values: CompleteListingFormValues,
) {
  const etsyListingUrl = values.etsyListingUrl.trim() || null;
  const response = await apiRequest<unknown>(
    `/api/v1/workspaces/${workspaceId}/listing/${researchItemId}/complete`,
    {
      json: { etsyListingUrl },
      method: "POST",
    },
  );
  const parsed = completeListingResponseSchema.safeParse(response);

  if (!parsed.success) {
    throw new ApiError(502, "Unexpected complete listing response format.");
  }

  return parsed.data;
}

function getListingAssetDownloadUrl(
  workspaceId: string,
  assetId: string,
): string {
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "");
  if (!apiBaseUrl) {
    throw new Error("The download service is not configured.");
  }

  return `${apiBaseUrl}/api/v1/workspaces/${workspaceId}/listing/assets/${assetId}/download`;
}

export function downloadListingAsset(
  workspaceId: string,
  assetId: string,
  fallbackFileName?: string,
): void {
  const downloadUrl = getListingAssetDownloadUrl(workspaceId, assetId);
  const anchor = document.createElement("a");
  anchor.href = downloadUrl;
  if (fallbackFileName) {
    anchor.download = fallbackFileName;
  }
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}
