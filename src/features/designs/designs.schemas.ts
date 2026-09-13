import { z } from "zod";
import type { AdminDesignFilterParams } from "./designs.types";
import type { ResearchStatus } from "@/features/research/research.types";

const VALID_DESIGN_STATUSES = new Set<string>([
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

export function parseDesignFiltersFromParams(
  searchParams: URLSearchParams,
): AdminDesignFilterParams {
  const statusParam = searchParams.get("status");
  const searchParam = searchParams.get("search") ?? undefined;
  const dateParam = searchParams.get("date") ?? undefined;
  const designerIdParam = searchParams.get("designerId") ?? undefined;
  const pageParam = searchParams.get("page");

  const parsedStatus =
    statusParam && VALID_DESIGN_STATUSES.has(statusParam)
      ? (statusParam as ResearchStatus)
      : undefined;

  const parsedPage =
    pageParam && !Number.isNaN(Number(pageParam)) && Number(pageParam) > 0
      ? Number(pageParam)
      : 1;

  const isValidDate = dateParam ? /^\d{4}-\d{2}-\d{2}$/.test(dateParam) : false;

  return {
    date: isValidDate ? dateParam : undefined,
    designerId: designerIdParam,
    limit: 20,
    page: parsedPage,
    search:
      searchParam && searchParam.trim().length > 0
        ? searchParam.trim()
        : undefined,
    status: parsedStatus,
  };
}

export const adminDesignItemSchema = z.object({
  createdAt: z.string(),
  currentAssignment: z
    .object({
      assignedAt: z.string(),
      completedAt: z.string().nullable(),
      id: z.string(),
      startedAt: z.string().nullable(),
    })
    .nullable(),
  currentDesigner: z
    .object({
      email: z.string(),
      id: z.string(),
      name: z.string().nullable(),
    })
    .nullable(),
  etsyListingId: z.string(),
  id: z.string(),
  latestIssueReport: z
    .object({
      createdAt: z.string(),
      details: z.string().nullable(),
      id: z.string(),
      reason: z.string(),
    })
    .nullable(),
  latestReview: z
    .object({
      approvedAt: z.string().nullable(),
      id: z.string(),
      roundNumber: z.number(),
      submittedAt: z.string(),
    })
    .nullable(),
  normalizedUrl: z.string(),
  originalUrl: z.string(),
  referenceImageUrl: z.string().nullable(),
  status: z.custom<ResearchStatus>(),
  title: z.string().nullable(),
  updatedAt: z.string(),
});

export const adminDesignListResponseSchema = z.object({
  data: z.object({
    items: z.array(adminDesignItemSchema),
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
