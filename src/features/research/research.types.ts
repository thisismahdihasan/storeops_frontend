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
  title: string | null;
  updatedAt: string;
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

export type CreateResearchInput = {
  etsyUrl: string;
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

export type DuplicateResearchData = {
  alreadyExists: true;
  createdAt: string;
  createdBy: UserSummary;
  currentStatus: ResearchStatus;
  researchItemId: string;
};

export type ResearchListFilterParams = {
  createdBy?: string;
  date?: string;
  limit?: number;
  page?: number;
  search?: string;
  status?: ResearchStatus;
};

export type IssueListFilterParams = Pick<
  ResearchListFilterParams,
  "limit" | "page" | "search"
>;

export type PreviewDuplicateData = {
  createdAt: string;
  createdBy: UserSummary;
  currentStatus: ResearchStatus;
  researchItemId: string;
};

export type PreviewResearchResult = {
  alreadyExists: boolean;
  duplicate: PreviewDuplicateData | null;
  etsyListingId: string;
  normalizedUrl: string;
  referenceImageUrl: string | null;
  title: string | null;
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
