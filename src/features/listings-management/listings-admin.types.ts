import type { ResearchStatus } from "@/features/research/research.types";

export type AdminListingItem = {
  createdAt: string;
  currentAssignment: {
    assignedAt: string;
    completedAt: string | null;
    id: string;
    startedAt: string | null;
  } | null;
  currentLister: {
    email: string;
    id: string;
    name: string | null;
  } | null;
  etsyListingId: string;
  id: string;
  listingResult: {
    etsyListingUrl: string | null;
    id: string;
    listedAt: string;
    listedBy: {
      email: string;
      id: string;
      name: string | null;
    };
  } | null;
  normalizedUrl: string;
  originalUrl: string;
  referenceImageUrl: string | null;
  status: ResearchStatus;
  title: string | null;
  updatedAt: string;
};

export type AdminListingPagination = {
  limit: number;
  page: number;
  total: number;
  totalPages: number;
};

export type AdminListingListResult = {
  items: AdminListingItem[];
  pagination: AdminListingPagination;
};

export type AdminListingFilterParams = {
  assignment?: "UNASSIGNED";
  date?: string;
  limit?: number;
  listerId?: string;
  page?: number;
  search?: string;
  status?: ResearchStatus;
};

export type AssignListerResponse = {
  data: {
    assignment: {
      assignedAt: string;
      id: string;
      isCurrent: boolean;
      listerId: string;
    };
    researchItem: {
      id: string;
      status: ResearchStatus;
    };
  };
  message: string;
  success: true;
};
