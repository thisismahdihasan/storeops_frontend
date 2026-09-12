import type { z } from "zod";

import type {
  markAllNotificationsReadResponseSchema,
  markNotificationReadResponseSchema,
  notificationSchema,
  notificationsResponseSchema,
  notificationTypeSchema,
} from "./notifications.schemas";

export type NotificationType = z.infer<typeof notificationTypeSchema>;
export type Notification = z.infer<typeof notificationSchema>;
export type NotificationsResponse = z.infer<typeof notificationsResponseSchema>;
export type MarkNotificationReadResponse = z.infer<
  typeof markNotificationReadResponseSchema
>;
export type MarkAllNotificationsReadResponse = z.infer<
  typeof markAllNotificationsReadResponseSchema
>;
