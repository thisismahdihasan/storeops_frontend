import type { DateRangeQuery, HistoryQuery } from "./role-activity.types";

export const roleActivityKeys = {
  all: ["role-activity"] as const,
  designerHistory: (workspaceId: string, query: HistoryQuery) => ["role-activity", workspaceId, "designer-history", query] as const,
  designerSummary: (workspaceId: string, range: DateRangeQuery) => ["role-activity", workspaceId, "designer-summary", range] as const,
  listerHistory: (workspaceId: string, query: HistoryQuery) => ["role-activity", workspaceId, "lister-history", query] as const,
  listerSummary: (workspaceId: string, range: DateRangeQuery) => ["role-activity", workspaceId, "lister-summary", range] as const,
  researcherSummary: (workspaceId: string, range: DateRangeQuery) => ["role-activity", workspaceId, "researcher-summary", range] as const,
};
