import { z } from "zod";
import type { AdminListingFilterParams } from "./listings-admin.types";
import type { ResearchStatus } from "@/features/research/research.types";

const VALID_LISTING_STATUSES = new Set<string>([
  "READY_FOR_LISTING",
  "LISTING_IN_PROGRESS",
  "LISTED",
]);

export function parseListingAdminFiltersFromParams(
  searchParams: URLSearchParams,
): AdminListingFilterParams {
  const statusParam = searchParams.get("status");
  const searchParam = searchParams.get("search") ?? undefined;
  const dateParam = searchParams.get("date") ?? undefined;
  const listerIdParam = searchParams.get("listerId") ?? undefined;
  const pageParam = searchParams.get("page");

  const parsedStatus =
    statusParam && VALID_LISTING_STATUSES.has(statusParam)
      ? (statusParam as ResearchStatus)
      : undefined;

  const parsedPage =
    pageParam && !Number.isNaN(Number(pageParam)) && Number(pageParam) > 0
      ? Number(pageParam)
      : 1;

  const isValidDate = dateParam ? /^\d{4}-\d{2}-\d{2}$/.test(dateParam) : false;

  return {
    date: isValidDate ? dateParam : undefined,
    limit: 20,
    listerId: listerIdParam,
    page: parsedPage,
    search:
      searchParam && searchParam.trim().length > 0
        ? searchParam.trim()
        : undefined,
    status: parsedStatus,
  };
}

export const adminListingItemSchema = z.object({
  createdAt: z.string(),
  currentAssignment: z
    .object({
      assignedAt: z.string(),
      completedAt: z.string().nullable(),
      id: z.string(),
      startedAt: z.string().nullable(),
    })
    .nullable(),
  currentLister: z
    .object({
      email: z.string(),
      id: z.string(),
      name: z.string().nullable(),
    })
    .nullable(),
  etsyListingId: z.string(),
  id: z.string(),
  listingResult: z
    .object({
      etsyListingUrl: z.string().nullable(),
      id: z.string(),
      listedAt: z.string(),
      listedBy: z.object({
        email: z.string(),
        id: z.string(),
        name: z.string().nullable(),
      }),
    })
    .nullable(),
  normalizedUrl: z.string(),
  originalUrl: z.string(),
  referenceImageUrl: z.string().nullable(),
  status: z.custom<ResearchStatus>(),
  title: z.string().nullable(),
  updatedAt: z.string(),
});

export const adminListingListResponseSchema = z.object({
  data: z.object({
    items: z.array(adminListingItemSchema),
    pagination: z.object({
      limit: z.number(),
      page: z.number(),
      total: z.number(),
      totalPages: z.number(),
    }),
  }),
  message: z.string(),
  statusCode: z.number(),
});
