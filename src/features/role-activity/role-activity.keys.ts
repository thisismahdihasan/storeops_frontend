import type { DateRangeQuery, HistoryQuery } from "./role-activity.types";

export const roleActivityKeys = {
  all: ["role-activity"] as const,
  designerHistories: (workspaceId: string) => ["role-activity", workspaceId, "designer-history"] as const,
  designerHistory: (workspaceId: string, query: HistoryQuery) => ["role-activity", workspaceId, "designer-history", query] as const,
  designerSummaries: (workspaceId: string) => ["role-activity", workspaceId, "designer-summary"] as const,
  designerSummary: (workspaceId: string, range: DateRangeQuery) => ["role-activity", workspaceId, "designer-summary", range] as const,
  listerHistories: (workspaceId: string) => ["role-activity", workspaceId, "lister-history"] as const,
  listerHistory: (workspaceId: string, query: HistoryQuery) => ["role-activity", workspaceId, "lister-history", query] as const,
  listerSummaries: (workspaceId: string) => ["role-activity", workspaceId, "lister-summary"] as const,
  listerSummary: (workspaceId: string, range: DateRangeQuery) => ["role-activity", workspaceId, "lister-summary", range] as const,
  researcherSummaries: (workspaceId: string) => ["role-activity", workspaceId, "researcher-summary"] as const,
  researcherSummary: (workspaceId: string, range: DateRangeQuery) => ["role-activity", workspaceId, "researcher-summary", range] as const,
};
