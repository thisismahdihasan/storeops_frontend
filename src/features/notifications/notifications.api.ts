import { ApiError, apiRequest } from "@/lib/api";

import {
  markAllNotificationsReadResponseSchema,
  markNotificationReadResponseSchema,
  notificationsResponseSchema,
} from "./notifications.schemas";
import type {
  MarkAllNotificationsReadResponse,
  MarkNotificationReadResponse,
  NotificationsResponse,
} from "./notifications.types";

export async function getNotifications(
  workspaceId: string,
  page: number,
  limit: number,
): Promise<NotificationsResponse> {
  const searchParams = new URLSearchParams({
    limit: limit.toString(),
    page: page.toString(),
  });
  const response = await apiRequest<unknown>(
    `/api/v1/workspaces/${workspaceId}/notifications?${searchParams.toString()}`,
  );
  const parsedResponse = notificationsResponseSchema.safeParse(response);

  if (!parsedResponse.success) {
    throw new ApiError(502, "The service returned an unexpected notifications response.");
  }

  return parsedResponse.data;
}

export async function markNotificationRead(
  workspaceId: string,
  notificationId: string,
): Promise<MarkNotificationReadResponse> {
  const response = await apiRequest<unknown>(
    `/api/v1/workspaces/${workspaceId}/notifications/${notificationId}/read`,
    { method: "PATCH" },
  );
  const parsedResponse = markNotificationReadResponseSchema.safeParse(response);

  if (!parsedResponse.success) {
    throw new ApiError(502, "The service returned an unexpected notification response.");
  }

  return parsedResponse.data;
}

export async function markAllNotificationsRead(
  workspaceId: string,
): Promise<MarkAllNotificationsReadResponse> {
  const response = await apiRequest<unknown>(
    `/api/v1/workspaces/${workspaceId}/notifications/read-all`,
    { method: "PATCH" },
  );
  const parsedResponse = markAllNotificationsReadResponseSchema.safeParse(response);

  if (!parsedResponse.success) {
    throw new ApiError(502, "The service returned an unexpected notification response.");
  }

  return parsedResponse.data;
}
