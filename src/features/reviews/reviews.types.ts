import type { ResearchStatus } from "@/features/research/research.types";

export type ReviewUserSummary = {
  email: string;
  id: string;
  name: string | null;
};

export type ReviewAssignmentSummary = {
  assignedAt: string;
  completedAt: string | null;
  designerId: string;
  id: string;
  isCurrent: boolean;
  startedAt: string | null;
};

export type ReviewQueueItemReview = {
  id: string;
  imageDeletedAt: string | null;
  imageUrl: string | null;
  note: string | null;
  roundNumber: number;
  submittedAt: string;
};

export type ReviewQueueItemResearch = {
  etsyListingId: string;
  id: string;
  normalizedUrl: string;
  originalUrl: string;
  status: ResearchStatus;
  title: string | null;
};

export type ReviewQueueItem = {
  designer: ReviewUserSummary | null;
  researchItem: ReviewQueueItemResearch;
  review: ReviewQueueItemReview;
};

export type ReviewQueuePagination = {
  limit: number;
  page: number;
  total: number;
  totalPages: number;
};

export type ReviewQueueResult = {
  items: ReviewQueueItem[];
  pagination: ReviewQueuePagination;
};

export type ReviewQueueResponse = {
  data: ReviewQueueResult;
  message: string;
  success: boolean;
};

export type ReviewReplyDetail = {
  createdAt: string;
  createdBy: {
    id: string;
    name: string | null;
  };
  id: string;
  message: string;
};

export type ReviewAnnotationDetail = {
  comment: string;
  createdAt: string;
  createdBy: {
    id: string;
    name: string | null;
  };
  id: string;
  replies: ReviewReplyDetail[];
  resolved: boolean;
  x: number;
  y: number;
};

export type ReviewHistoryItem = {
  annotations: ReviewAnnotationDetail[];
  approvedAt: string | null;
  approvedById: string | null;
  id: string;
  imageDeletedAt: string | null;
  imageUrl: string | null;
  note: string | null;
  roundNumber: number;
  submittedAt: string;
};

export type ReviewDetailResearchItem = {
  createdAt: string;
  createdBy: ReviewUserSummary;
  etsyListingId: string;
  id: string;
  normalizedUrl: string;
  originalUrl: string;
  referenceImageUrl: string | null;
  status: ResearchStatus;
  title: string | null;
  updatedAt: string;
};

export type ReviewDetailResult = {
  currentDesignAssignment: ReviewAssignmentSummary | null;
  currentDesigner: ReviewUserSummary | null;
  latestReviewId: string;
  researchItem: ReviewDetailResearchItem;
  reviews: ReviewHistoryItem[];
  selectedReview: ReviewHistoryItem;
};

export type ReviewDetailResponse = {
  data: ReviewDetailResult;
  message: string;
  success: boolean;
};

export type CreateAnnotationInput = {
  comment: string;
  x: number;
  y: number;
};

export type CreateAnnotationResult = {
  annotation: {
    comment: string;
    createdAt: string;
    createdBy: {
      id: string;
      name: string | null;
    };
    id: string;
    resolved: boolean;
    reviewSubmissionId: string;
    x: number;
    y: number;
  };
};

export type CreateAnnotationResponse = {
  data: CreateAnnotationResult;
  message: string;
  success: boolean;
};

export type CreateReplyInput = {
  message: string;
};

export type CreateReplyResult = {
  reply: {
    annotationId: string;
    createdAt: string;
    createdBy: {
      id: string;
      name: string | null;
    };
    id: string;
    message: string;
  };
};

export type CreateReplyResponse = {
  data: CreateReplyResult;
  message: string;
  success: boolean;
};

export type RequestCorrectionResult = {
  researchItem: {
    id: string;
    status: ResearchStatus;
  };
};

export type RequestCorrectionResponse = {
  data: RequestCorrectionResult;
  message: string;
  success: boolean;
};

export type ApproveReviewResult = {
  researchItem: {
    id: string;
    status: ResearchStatus;
  };
  reviewSubmission: {
    approvedAt: string;
    approvedById: string;
    id: string;
    roundNumber: number;
  };
};

export type ApproveReviewResponse = {
  data: ApproveReviewResult;
  message: string;
  success: boolean;
};
