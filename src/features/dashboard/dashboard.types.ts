import type { z } from "zod";

import type { userActivityResponseSchema } from "./dashboard.schemas";

export type DashboardDatePreset =
  | "all"
  | "today"
  | "week"
  | "month"
  | "custom";

export type DashboardFilterParams = {
  dateFrom?: string;
  dateTo?: string;
  preset?: DashboardDatePreset;
};

export type ResolvedDashboardDateRange = {
  dateFrom: string | null;
  dateTo: string | null;
  preset: DashboardDatePreset;
};

export type DashboardPipelineCounts = {
  assigned: number;
  correctionNeeded: number;
  designApproved: number;
  designInProgress: number;
  designReview: number;
  issueReported: number;
  listed: number;
  listingInProgress: number;
  readyForListing: number;
  researched: number;
};

export type DashboardOverviewData = {
  dateRange: ResolvedDashboardDateRange;
  pipeline: DashboardPipelineCounts;
  totalResearch: number;
};

export type DashboardOverviewResponse = {
  data: DashboardOverviewData;
  message: string;
  success: true;
};

export type ResearcherPerformanceRow = {
  email: string;
  name: string | null;
  researchCount: number;
  userId: string;
};

export type ResearcherPerformanceData = {
  dateRange: ResolvedDashboardDateRange;
  researchers: ResearcherPerformanceRow[];
};

export type ResearcherPerformanceResponse = {
  data: ResearcherPerformanceData;
  message: string;
  success: true;
};

export type DesignerPerformanceRow = {
  approvedCount: number;
  assignedCount: number;
  completedCount: number;
  correctionsCount: number;
  currentInProgress: number;
  email: string;
  name: string | null;
  submittedCount: number;
  userId: string;
};

export type DesignerPerformanceData = {
  dateRange: ResolvedDashboardDateRange;
  designers: DesignerPerformanceRow[];
};

export type DesignerPerformanceResponse = {
  data: DesignerPerformanceData;
  message: string;
  success: true;
};

export type ListerPerformanceRow = {
  assignedCount: number;
  currentInProgress: number;
  email: string;
  listedCount: number;
  name: string | null;
  userId: string;
};

export type ListerPerformanceData = {
  dateRange: ResolvedDashboardDateRange;
  listers: ListerPerformanceRow[];
};

export type ListerPerformanceResponse = {
  data: ListerPerformanceData;
  message: string;
  success: true;
};

export type UserActivityResponse = z.infer<typeof userActivityResponseSchema>;
export type UserActivityData = UserActivityResponse["data"];
export type UserActivityRecentItem = UserActivityData["recentItems"][number];
