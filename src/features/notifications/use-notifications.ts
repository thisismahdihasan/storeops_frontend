"use client";

import { useQuery } from "@tanstack/react-query";

import { ApiError } from "@/lib/api";

import { getNotifications, notificationsQueryKey } from "./notifications.api";

export { notificationsQueryKey };

function isUnauthenticatedError(error: unknown) {
  return error instanceof ApiError && error.status === 401;
}

export function useNotifications(enabled = true) {
  return useQuery({
    enabled,
    queryFn: getNotifications,
    queryKey: notificationsQueryKey,
    retry: (failureCount, error) =>
      !isUnauthenticatedError(error) && failureCount < 1,
    staleTime: 30_000,
  });
}
