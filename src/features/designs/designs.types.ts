import type { ResearchStatus } from "@/features/research/research.types";

export type AdminDesignItem = {
  createdAt: string;
  currentAssignment: {
    assignedAt: string;
    completedAt: string | null;
    id: string;
    startedAt: string | null;
  } | null;
  currentDesigner: {
    email: string;
    id: string;
    name: string | null;
  } | null;
  etsyListingId: string;
  id: string;
  latestIssueReport: {
    createdAt: string;
    details: string | null;
    id: string;
    reason: string;
  } | null;
  latestReview: {
    approvedAt: string | null;
    id: string;
    roundNumber: number;
    submittedAt: string;
  } | null;
  normalizedUrl: string;
  originalUrl: string;
  referenceImageUrl: string | null;
  status: ResearchStatus;
  title: string | null;
  updatedAt: string;
};

export type AdminDesignPagination = {
  limit: number;
  page: number;
  total: number;
  totalPages: number;
};

export type AdminDesignListResult = {
  items: AdminDesignItem[];
  pagination: AdminDesignPagination;
};

export type AdminDesignFilterParams = {
  date?: string;
  designerId?: string;
  limit?: number;
  page?: number;
  search?: string;
  status?: ResearchStatus;
};
