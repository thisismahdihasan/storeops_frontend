"use client";

import { useQuery } from "@tanstack/react-query";

import { ApiError } from "@/lib/api";

import { getCurrentSession } from "./auth.api";

export const currentSessionQueryKey = ["auth", "current-session"] as const;

export function isUnauthenticatedError(error: unknown) {
  return error instanceof ApiError && error.status === 401;
}

export function useCurrentSession() {
  return useQuery({
    queryFn: getCurrentSession,
    queryKey: currentSessionQueryKey,
    retry: (failureCount, error) =>
      !isUnauthenticatedError(error) && failureCount < 1,
    staleTime: 60_000,
  });
}
