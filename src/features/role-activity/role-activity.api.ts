import { ApiError, apiRequest } from "@/lib/api";
import type { DateRangeQuery, DesignerActivitySummaryResponse, DesignerHistoryResponse, HistoryQuery, ListerActivitySummaryResponse, ListerHistoryResponse, ResearcherActivitySummaryResponse } from "./role-activity.types";

function queryString(query: DateRangeQuery | HistoryQuery): string {
  const params = new URLSearchParams();
  if ("page" in query) {
    params.set("page", query.page.toString());
    params.set("limit", query.limit.toString());
    params.set("sort", query.sort);
    if (query.search?.trim()) params.set("search", query.search.trim());
  }
  if (query.dateFrom) params.set("dateFrom", query.dateFrom);
  if (query.dateTo) params.set("dateTo", query.dateTo);
  const value = params.toString();
  return value ? `?${value}` : "";
}

async function getResponse<T>(path: string): Promise<T> {
  const response = await apiRequest<T>(path);
  if (!response) throw new ApiError(502, "The service returned an empty activity response.");
  return response;
}

export const getResearcherActivitySummary = (workspaceId: string, range: DateRangeQuery) => getResponse<ResearcherActivitySummaryResponse>(`/api/v1/workspaces/${workspaceId}/research-items/my-summary${queryString(range)}`);
export const getDesignerActivitySummary = (workspaceId: string, range: DateRangeQuery) => getResponse<DesignerActivitySummaryResponse>(`/api/v1/workspaces/${workspaceId}/designer/summary${queryString(range)}`);
export const getDesignerHistory = (workspaceId: string, query: HistoryQuery) => getResponse<DesignerHistoryResponse>(`/api/v1/workspaces/${workspaceId}/designer/history${queryString(query)}`);
export const getListerActivitySummary = (workspaceId: string, range: DateRangeQuery) => getResponse<ListerActivitySummaryResponse>(`/api/v1/workspaces/${workspaceId}/lister/summary${queryString(range)}`);
export const getListerHistory = (workspaceId: string, query: HistoryQuery) => getResponse<ListerHistoryResponse>(`/api/v1/workspaces/${workspaceId}/lister/history${queryString(query)}`);
