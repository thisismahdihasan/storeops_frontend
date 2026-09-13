import { ApiError, apiRequest } from "@/lib/api";
import { adminListingListResponseSchema } from "./listings-admin.schemas";
import type {
  AdminListingFilterParams,
  AdminListingListResult,
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

