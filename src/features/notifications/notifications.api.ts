import { ApiError, apiRequest } from "@/lib/api";

import { notificationsResponseSchema } from "./notifications.schemas";
import type { NotificationsResponse } from "./notifications.types";

export const notificationsQueryKey = ["notifications"] as const;

export async function getNotifications(): Promise<NotificationsResponse> {
  const response = await apiRequest<unknown>("/api/v1/notifications");
  const parsedResponse = notificationsResponseSchema.safeParse(response);

  if (!parsedResponse.success) {
    throw new ApiError(502, "The service returned an unexpected notifications response.");
  }

  return parsedResponse.data;
}
