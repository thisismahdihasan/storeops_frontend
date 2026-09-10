"use client";

import { useQuery } from "@tanstack/react-query";

import { ApiError } from "@/lib/api";

import { getWorkspaces } from "./workspace.api";

export const workspacesQueryKey = ["workspaces"] as const;

function isUnauthenticatedError(error: unknown) {
  return error instanceof ApiError && error.status === 401;
}

export function useWorkspaces(enabled = true) {
  return useQuery({
    enabled,
    queryFn: getWorkspaces,
    queryKey: workspacesQueryKey,
    retry: (failureCount, error) =>
      !isUnauthenticatedError(error) && failureCount < 1,
    staleTime: 60_000,
  });
}
