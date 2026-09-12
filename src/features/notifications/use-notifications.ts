"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { ApiError } from "@/lib/api";

import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "./notifications.api";
import { notificationKeys } from "./notifications.keys";

function isUnauthenticatedError(error: unknown) {
  return error instanceof ApiError && error.status === 401;
}

export function useNotifications(
  workspaceId: string,
  page: number,
  limit: number,
  enabled = true,
) {
  return useQuery({
    enabled: enabled && workspaceId.length > 0,
    queryFn: () => getNotifications(workspaceId, page, limit),
    queryKey: notificationKeys.list(workspaceId, page, limit),
    retry: (failureCount, error) =>
      !isUnauthenticatedError(error) && failureCount < 1,
    staleTime: 30_000,
  });
}

function useNotificationInvalidation(workspaceId: string) {
  const queryClient = useQueryClient();

  return () => {
    void queryClient.invalidateQueries({
      queryKey: notificationKeys.all(workspaceId),
    });
  };
}

export function useMarkNotificationRead(workspaceId: string) {
  const invalidateNotifications = useNotificationInvalidation(workspaceId);

  return useMutation({
    mutationFn: (notificationId: string) =>
      markNotificationRead(workspaceId, notificationId),
    onSuccess: invalidateNotifications,
  });
}

export function useMarkAllNotificationsRead(workspaceId: string) {
  const invalidateNotifications = useNotificationInvalidation(workspaceId);

  return useMutation({
    mutationFn: () => markAllNotificationsRead(workspaceId),
    onSuccess: invalidateNotifications,
  });
}
