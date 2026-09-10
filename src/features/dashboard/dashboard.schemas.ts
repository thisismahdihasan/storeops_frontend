import { z } from "zod";

export const dashboardDatePresetSchema = z.enum([
  "all",
  "today",
  "week",
  "month",
  "custom",
]);

export const resolvedDashboardDateRangeSchema = z.object({
  dateFrom: z.string().nullable(),
  dateTo: z.string().nullable(),
  preset: dashboardDatePresetSchema,
});

export const dashboardPipelineCountsSchema = z.object({
  assigned: z.number(),
  correctionNeeded: z.number(),
  designApproved: z.number(),
  designInProgress: z.number(),
  designReview: z.number(),
  issueReported: z.number(),
  listed: z.number(),
  listingInProgress: z.number(),
  readyForListing: z.number(),
  researched: z.number(),
});

export const dashboardOverviewResponseSchema = z.object({
  data: z.object({
    dateRange: resolvedDashboardDateRangeSchema,
    pipeline: dashboardPipelineCountsSchema,
    totalResearch: z.number(),
  }),
  message: z.string(),
  success: z.literal(true),
});

export const researcherPerformanceRowSchema = z.object({
  email: z.string().email(),
  name: z.string().nullable(),
  researchCount: z.number(),
  userId: z.string(),
});

export const researcherPerformanceResponseSchema = z.object({
  data: z.object({
    dateRange: resolvedDashboardDateRangeSchema,
    researchers: z.array(researcherPerformanceRowSchema),
  }),
  message: z.string(),
  success: z.literal(true),
});

export const designerPerformanceRowSchema = z.object({
  approvedCount: z.number(),
  assignedCount: z.number(),
  completedCount: z.number(),
  correctionsCount: z.number(),
  currentInProgress: z.number(),
  email: z.string().email(),
  name: z.string().nullable(),
  submittedCount: z.number(),
  userId: z.string(),
});

export const designerPerformanceResponseSchema = z.object({
  data: z.object({
    dateRange: resolvedDashboardDateRangeSchema,
    designers: z.array(designerPerformanceRowSchema),
  }),
  message: z.string(),
  success: z.literal(true),
});

export const listerPerformanceRowSchema = z.object({
  assignedCount: z.number(),
  currentInProgress: z.number(),
  email: z.string().email(),
  listedCount: z.number(),
  name: z.string().nullable(),
  userId: z.string(),
});

export const listerPerformanceResponseSchema = z.object({
  data: z.object({
    dateRange: resolvedDashboardDateRangeSchema,
    listers: z.array(listerPerformanceRowSchema),
  }),
  message: z.string(),
  success: z.literal(true),
});
