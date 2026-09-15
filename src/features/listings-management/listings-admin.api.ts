import { ApiError, apiRequest } from "@/lib/api";
import {
  adminListingListResponseSchema,
  assignListerResponseSchema,
  bulkAssignListingsResponseSchema,
} from "./listings-admin.schemas";
import type {
  AdminListingFilterParams,
  AdminListingListResult,
  AssignListerResponse,
  BulkAssignListingsInput,
  BulkAssignListingsResponse,
} from "./listings-admin.types";

export async function getAdminListingList(
  workspaceId: string,
  filters: AdminListingFilterParams = {},
): Promise<AdminListingListResult> {
  const params = new URLSearchParams();
  if (filters.page && filters.page > 1) {
    params.set("page", String(filters.page));
  }
  if (filters.limit) {
    params.set("limit", String(filters.limit));
  }
  if (filters.listerId) {
    params.set("listerId", filters.listerId);
  }
  if (filters.status) {
    params.set("status", filters.status);
  }
  if (filters.assignment === "UNASSIGNED") {
    params.set("assignment", filters.assignment);
  }
  if (filters.date) {
    params.set("date", filters.date);
  }
  if (filters.search) {
    params.set("search", filters.search);
  }

  const query = params.toString();
  const endpoint = `/api/v1/workspaces/${workspaceId}/listing${query ? `?${query}` : ""}`;

  const response = await apiRequest<unknown>(endpoint);
  const parsed = adminListingListResponseSchema.safeParse(response);
  if (!parsed.success) {
    console.error("Listing Admin API parse error:", parsed.error.format());
    throw new ApiError(502, "Unexpected admin listing list response format.");
  }

  return parsed.data.data;
}

export async function assignLister(
  workspaceId: string,
  researchItemId: string,
  listerId: string,
): Promise<AssignListerResponse> {
  const response = await apiRequest<unknown>(
    `/api/v1/workspaces/${workspaceId}/listing/${researchItemId}/lister`,
    {
      json: { listerId },
      method: "PATCH",
    },
  );
  const parsed = assignListerResponseSchema.safeParse(response);

  if (!parsed.success) {
    console.error("Lister assignment API parse error:", parsed.error.format());
    throw new ApiError(502, "Unexpected lister assignment response format.");
  }

  return parsed.data;
}

export async function bulkAssignListers(
  workspaceId: string,
  input: BulkAssignListingsInput,
): Promise<BulkAssignListingsResponse> {
  const response = await apiRequest<unknown>(
    `/api/v1/workspaces/${workspaceId}/listing/bulk-assign`,
    {
      json: input,
      method: "POST",
    },
  );
  const parsed = bulkAssignListingsResponseSchema.safeParse(response);

  if (!parsed.success) {
    throw new ApiError(502, "Unexpected bulk Lister assignment response format.");
  }

  return parsed.data;
}
