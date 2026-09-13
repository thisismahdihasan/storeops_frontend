import { ApiError, apiRequest } from "@/lib/api";
import { adminDesignListResponseSchema } from "./designs.schemas";
import type {
  AdminDesignFilterParams,
  AdminDesignListResult,
} from "./designs.types";

export async function getAdminDesignList(
  workspaceId: string,
  filters: AdminDesignFilterParams = {},
): Promise<AdminDesignListResult> {
  const params = new URLSearchParams();
  if (filters.page && filters.page > 1) {
    params.set("page", String(filters.page));
  }
  if (filters.limit) {
    params.set("limit", String(filters.limit));
  }
  if (filters.designerId) {
    params.set("designerId", filters.designerId);
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
  const endpoint = `/api/v1/workspaces/${workspaceId}/design${query ? `?${query}` : ""}`;

  const response = await apiRequest<unknown>(endpoint);
  const parsed = adminDesignListResponseSchema.safeParse(response);
  if (!parsed.success) {
    console.error("Design API parse error:", parsed.error.format());
    throw new ApiError(502, "Unexpected admin design list response format.");
  }

  return parsed.data.data;
}

