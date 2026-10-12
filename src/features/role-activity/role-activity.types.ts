import type { PaginationMeta, ResearchStatus } from "@/features/research/research.types";

export type DateRangeQuery = { dateFrom?: string; dateTo?: string };

export type HistoryQuery = DateRangeQuery & {
  limit: number;
  page: number;
  search?: string;
  sort: "newest" | "oldest";
};

export type ResearcherActivitySummary = {
  inDesign: number;
  inListing: number;
  listed: number;
  totalResearched: number;
  waiting: number;
};

export type DesignerActivitySummary = {
  active: { approved: number; correctionsNeeded: number; inProgress: number; inReview: number; total: number };
  completed: { allTime: number; filtered: number };
};

export type ListerActivitySummary = {
  active: { assigned: number; inProgress: number; total: number };
  completed: { allTime: number; filtered: number };
};

export type DesignerHistoryItem = {
  assignedAt: string;
  completedAt: string;
  id: string;
  researchItem: { etsyListingId: string; id: string; normalizedUrl: string; readyForListingAt: string | null; referenceImageUrl: string | null; status: ResearchStatus; title: string | null };
  startedAt: string | null;
};

export type ListerHistoryItem = {
  assignedAt: string;
  completedAt: string;
  id: string;
  researchItem: { etsyListingId: string; id: string; listingResult: { etsyListingUrl: string | null; listedAt: string } | null; normalizedUrl: string; referenceImageUrl: string | null; status: ResearchStatus; title: string | null };
  startedAt: string | null;
};

export type PaginatedHistory<T> = { items: T[]; pagination: PaginationMeta };
export type ApiEnvelope<T> = { data: T; message: string; success: true };
export type ResearcherActivitySummaryResponse = ApiEnvelope<ResearcherActivitySummary>;
export type DesignerActivitySummaryResponse = ApiEnvelope<DesignerActivitySummary>;
export type ListerActivitySummaryResponse = ApiEnvelope<ListerActivitySummary>;
export type DesignerHistoryResponse = ApiEnvelope<PaginatedHistory<DesignerHistoryItem>>;
export type ListerHistoryResponse = ApiEnvelope<PaginatedHistory<ListerHistoryItem>>;
