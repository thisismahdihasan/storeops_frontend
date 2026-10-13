export type ResearchStatus =
  | "RESEARCHED"
  | "ASSIGNED"
  | "DESIGN_IN_PROGRESS"
  | "DESIGN_REVIEW"
  | "CORRECTION_NEEDED"
  | "ISSUE_REPORTED"
  | "DESIGN_APPROVED"
  | "READY_FOR_LISTING"
  | "LISTING_IN_PROGRESS"
  | "LISTED";

export type IssueReason =
  | "REFERENCE_UNCLEAR"
  | "COPYRIGHT_CONCERN"
  | "TOO_COMPLEX"
  | "IMAGE_QUALITY"
  | "OTHER";

export type UserSummary = {
  email: string;
  id: string;
  name: string | null;
  profileImageUrl: string | null;
};

export type CurrentDesignAssignment = {
  assignedAt: string;
  completedAt: string | null;
  designerId: string;
  id: string;
  isCurrent: boolean;
  startedAt: string | null;
};

export type LatestIssueReport = {
  createdAt: string;
  details: string | null;
  id: string;
  reason: IssueReason;
  reportedBy: UserSummary;
};

export type LatestReviewSummary = {
  approvedAt: string | null;
  approvedById: string | null;
  id: string;
  imageDeletedAt: string | null;
  imageUrl: string | null;
  note: string | null;
  roundNumber: number;
  submittedAt: string;
};

export type SafeResearchItem = {
  createdAt: string;
  createdById: string;
  etsyListingId: string;
  id: string;
  normalizedUrl: string;
  originalUrl: string;
  referenceImageUrl: string | null;
  status: ResearchStatus;
  targetProduct: string | null;
  title: string | null;
  updatedAt: string;
  workspaceId: string;
};

export type ResearchReviewActivity = {
  designerReplyCount: number;
  latestDesignerReplyAt: string | null;
  latestReviewId: string | null;
};

export type ResearchItemListItem = {
  createdAt: string;
  createdBy: UserSummary;
  currentDesignAssignment: CurrentDesignAssignment | null;
  currentDesigner: UserSummary | null;
  etsyListingId: string;
  id: string;
  latestIssueReport: LatestIssueReport | null;
  normalizedUrl: string;
  originalUrl: string;
  referenceImageUrl: string | null;
  reviewActivity: ResearchReviewActivity;
  status: ResearchStatus;
  targetProduct: string | null;
  title: string | null;
  updatedAt: string;
  usageCount: number;
  workspaceId: string;
};

export type ResearchItemDetail = {
  createdAt: string;
  createdBy: UserSummary;
  currentDesignAssignment: CurrentDesignAssignment | null;
  currentDesigner: UserSummary | null;
  etsyListingId: string;
  id: string;
  latestReview: LatestReviewSummary | null;
  normalizedUrl: string;
  originalUrl: string;
  referenceImageUrl: string | null;
  status: ResearchStatus;
  targetProduct: string | null;
  title: string | null;
  updatedAt: string;
  workspaceId: string;
};

export type PaginationMeta = {
  limit: number;
  page: number;
  total: number;
  totalPages: number;
};

export type ResearchListResult = {
  items: ResearchItemListItem[];
  pagination: PaginationMeta;
};

export type ResearchListResponse = {
  data: ResearchListResult;
  message: string;
  success: true;
};

export type ReassignResearchResponse = {
  data: {
    assignment: {
      assignedAt: string;
      designerId: string;
      id: string;
      isCurrent: boolean;
    };
    researchItem: {
      id: string;
      status: ResearchStatus;
    };
  };
  message: string;
  success: true;
};

export type BulkAssignResearchInput =
  | {
      designerId: string;
      mode: "TARGET";
      researchItemIds: string[];
    }
  | {
      mode: "DISTRIBUTE";
      researchItemIds: string[];
    };

export type BulkAssignResearchResponse = {
  data: {
    assignedCount: number;
    assignedItemIds: string[];
  };
  message: string;
  success: true;
};

export type CreateResearchInput = {
  etsyUrl: string;
  image?: File;
  reuseReference?: boolean;
  targetProduct?: string | null;
};

export type CreateResearchResponse = {
  data: {
    researchItem: SafeResearchItem;
  };
  message: string;
  success: true;
};

export type ResearchDetailResponse = {
  data: {
    researchItem: ResearchItemDetail;
  };
  message: string;
  success: true;
};

export type DuplicateResearchData =
  | {
      alreadyExists: true;
    }
  | {
      alreadyExists: true;
      createdAt: string;
      createdBy: UserSummary;
      currentStatus: ResearchStatus;
      researchItemId: string;
    };

export type ResearchListFilterParams = {
  assignment?: "UNASSIGNED";
  createdBy?: string;
  date?: string;
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
  page?: number;
  search?: string;
  sort?: "newest" | "oldest" | "updated";
  status?: ResearchStatus;
  statusGroup?: "all" | "waiting" | "in_design" | "in_listing" | "listed";
};

export type IssueListFilterParams = Pick<
  ResearchListFilterParams,
  "limit" | "page" | "search"
> & {
  sort?: "fifo" | "newest";
};

export type PreviewDuplicateData = {
  createdAt: string;
  createdBy: UserSummary;
  currentStatus: ResearchStatus;
  researchItemId: string;
};

export type PreviewResearchResult = {
  alreadyExists: boolean;
  canAddAgain: boolean;
  canViewUsageDetails: boolean;
  currentUserLatestOccurrence: {
    createdAt: string;
    researchItemId: string;
    status: ResearchStatus;
    targetProduct: string | null;
  } | null;
  currentUserUsageCount: number;
  duplicate?: PreviewDuplicateData | null;
  etsyListingId: string;
  normalizedUrl: string;
  referenceImageUrl: string | null;
  title: string | null;
  usageCount: number;
};

export type PreviewResearchResponse = {
  data: PreviewResearchResult;
  message: string;
  success: true;
};

export type UploadReferenceImageResponse = {
  data: {
    referenceImageUrl: string;
    researchItemId: string;
  };
  message: string;
  success: true;
};

export type UpdateResearchItemInput = {
  title?: string | null;
};

export type UpdateResearchItemResponse = {
  data: {
    researchItem: SafeResearchItem;
  };
  message: string;
  success: true;
};

export type DeleteResearchItemResponse = {
  data: {
    researchItemId: string;
  };
  message: string;
  success: true;
};

export type BacklogSyncResult = {
  assignedCount: number;
  designerCount: number;
  remainingUnassignedCount: number;
};

export type SyncAssignmentsResponse = {
  data: BacklogSyncResult;
  message: string;
  success: true;
};

export type ReferenceHistoryItem = {
  createdAt: string;
  createdBy: {
    id: string;
    name: string | null;
  };
  id: string;
  status: ResearchStatus;
  targetProduct: string | null;
};

export type ReferenceHistoryPaginationParams = {
  limit?: number;
  page?: number;
};

export type ReferenceHistoryResult = {
  items: ReferenceHistoryItem[];
  pagination: PaginationMeta;
};

export type ReferenceHistoryResponse = {
  data: ReferenceHistoryResult;
  message: string;
  success: true;
};
