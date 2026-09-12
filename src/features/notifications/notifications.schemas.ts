import { z } from "zod";

export const notificationTypeSchema = z.enum([
  "DESIGN_ASSIGNED",
  "DESIGN_ISSUE_REPORTED",
  "DESIGN_REVIEW_SUBMITTED",
  "DESIGN_CORRECTION_REQUESTED",
  "DESIGN_APPROVED",
  "LISTING_ASSIGNED",
]);

export const notificationSchema = z.object({
  createdAt: z.string(),
  id: z.string().min(1),
  isRead: z.boolean(),
  message: z.string(),
  researchItemId: z.string().nullable(),
  title: z.string(),
  type: notificationTypeSchema,
  workspaceId: z.string().min(1),
});

export const notificationsPaginationSchema = z.object({
  limit: z.number(),
  page: z.number(),
  total: z.number(),
  totalPages: z.number(),
});

export const notificationsResponseSchema = z.object({
  data: z.object({
    items: z.array(notificationSchema),
    pagination: notificationsPaginationSchema,
    unreadCount: z.number(),
  }),
  message: z.string(),
  success: z.literal(true),
});

export const markNotificationReadResponseSchema = z.object({
  data: z.object({
    id: z.string().min(1),
    isRead: z.literal(true),
  }),
  message: z.string(),
  success: z.literal(true),
});

export const markAllNotificationsReadResponseSchema = z.object({
  data: z.object({
    updatedCount: z.number().int().nonnegative(),
  }),
  message: z.string(),
  success: z.literal(true),
});
