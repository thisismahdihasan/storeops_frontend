import { ApiError, apiRequest } from "@/lib/api";

import {
  completeListingResponseSchema,
  listingDetailResponseSchema,
  listingQueueResponseSchema,
  startListingResponseSchema,
} from "./listing.schemas";
import type {
  CompleteListingFormValues,
  ListingDetailResponse,
  ListingFilters,
  ListingQueueResponse,
} from "./listing.types";

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

export async function downloadListingAsset(
  workspaceId: string,
  assetId: string,
  fallbackFileName: string,
): Promise<void> {
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "");
  if (!apiBaseUrl) throw new Error("The download service is not configured.");

  let response: Response;
  try {
    response = await fetch(
      `${apiBaseUrl}/api/v1/workspaces/${workspaceId}/listing/assets/${assetId}/download`,
      { credentials: "include", method: "GET" },
    );
  } catch {
    throw new ApiError(
      0,
      "Unable to reach the download service. Check your connection and try again.",
    );
  }

  if (!response.ok) {
    const message =
      response.status === 401
        ? "Your session has expired. Please sign in again."
        : response.status === 403
          ? "You do not have permission to download this file."
          : response.status === 404
            ? "This file is no longer available."
            : "The file could not be downloaded. Please try again.";
    throw new ApiError(response.status, message);
  }

  const fileName = resolveDownloadFileName(
    response.headers.get("content-disposition"),
    fallbackFileName,
  );
  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = objectUrl;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(objectUrl);
}

function resolveDownloadFileName(
  contentDisposition: string | null,
  fallbackFileName: string,
): string {
  const encodedMatch = /filename\*=UTF-8''([^;]+)/i.exec(
    contentDisposition ?? "",
  );
  const plainMatch = /filename="?([^";]+)"?/i.exec(contentDisposition ?? "");
  let candidate = fallbackFileName;

  if (encodedMatch?.[1]) {
    try {
      candidate = decodeURIComponent(encodedMatch[1].trim());
    } catch {
      candidate = fallbackFileName;
    }
  } else if (plainMatch?.[1]) {
    candidate = plainMatch[1].trim();
  }

  const safeName = candidate
    .normalize("NFC")
    .replace(/[\u0000-\u001F\u007F]/g, "")
    .replace(/[\\/:*?"<>|]/g, "_")
    .trim()
    .slice(0, 200);

  return safeName || "download";
}
