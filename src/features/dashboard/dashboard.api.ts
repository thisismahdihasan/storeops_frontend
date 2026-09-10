import { ApiError, apiRequest } from "@/lib/api";

import {
  dashboardOverviewResponseSchema,
  designerPerformanceResponseSchema,
  listerPerformanceResponseSchema,
  researcherPerformanceResponseSchema,
} from "./dashboard.schemas";
import type {
  DashboardFilterParams,
  DashboardOverviewResponse,
  DesignerPerformanceResponse,
  ListerPerformanceResponse,
  ResearcherPerformanceResponse,
} from "./dashboard.types";

function buildFilterQueryString(filter?: DashboardFilterParams): string {
  if (!filter) {
    return "";
  }

  const searchParams = new URLSearchParams();

  if (filter.preset) {
    searchParams.set("preset", filter.preset);
  }

  if (filter.dateFrom && filter.dateTo) {
    searchParams.set("dateFrom", filter.dateFrom);
    searchParams.set("dateTo", filter.dateTo);
  }

  const query = searchParams.toString();
  return query.length > 0 ? `?${query}` : "";
}

export async function getDashboardOverview(
  workspaceId: string,
  filter?: DashboardFilterParams,
): Promise<DashboardOverviewResponse> {
  const query = buildFilterQueryString(filter);
  const response = await apiRequest<unknown>(
    `/api/v1/workspaces/${workspaceId}/admin/dashboard/overview${query}`,
  );
  const parsed = dashboardOverviewResponseSchema.safeParse(response);

  if (!parsed.success) {
    throw new ApiError(502, "Unexpected dashboard overview response format.");
  }

  return parsed.data;
}

export async function getResearcherPerformance(
  workspaceId: string,
  filter?: DashboardFilterParams,
): Promise<ResearcherPerformanceResponse> {
  const query = buildFilterQueryString(filter);
  const response = await apiRequest<unknown>(
    `/api/v1/workspaces/${workspaceId}/admin/dashboard/researchers${query}`,
  );
  const parsed = researcherPerformanceResponseSchema.safeParse(response);

  if (!parsed.success) {
    throw new ApiError(502, "Unexpected researcher performance response format.");
  }

  return parsed.data;
}

export async function getDesignerPerformance(
  workspaceId: string,
  filter?: DashboardFilterParams,
): Promise<DesignerPerformanceResponse> {
  const query = buildFilterQueryString(filter);
  const response = await apiRequest<unknown>(
    `/api/v1/workspaces/${workspaceId}/admin/dashboard/designers${query}`,
  );
  const parsed = designerPerformanceResponseSchema.safeParse(response);

  if (!parsed.success) {
    throw new ApiError(502, "Unexpected designer performance response format.");
  }

  return parsed.data;
}

export async function getListerPerformance(
  workspaceId: string,
  filter?: DashboardFilterParams,
): Promise<ListerPerformanceResponse> {
  const query = buildFilterQueryString(filter);
  const response = await apiRequest<unknown>(
    `/api/v1/workspaces/${workspaceId}/admin/dashboard/listers${query}`,
  );
  const parsed = listerPerformanceResponseSchema.safeParse(response);

  if (!parsed.success) {
    throw new ApiError(502, "Unexpected lister performance response format.");
  }

  return parsed.data;
}
