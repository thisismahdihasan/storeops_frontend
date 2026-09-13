"use client";

import { useQuery } from "@tanstack/react-query";

import { ApiError } from "@/lib/api";

import {
  getDashboardOverview,
  getDesignerPerformance,
  getListerPerformance,
  getResearcherPerformance,
  getUserActivity,
} from "./dashboard.api";
import type { DashboardFilterParams } from "./dashboard.types";

export const dashboardKeys = {
  all: ["dashboard"] as const,
  designers: (workspaceId: string, filter?: DashboardFilterParams) =>
    ["dashboard", workspaceId, "designers", filter ?? {}] as const,
  listers: (workspaceId: string, filter?: DashboardFilterParams) =>
    ["dashboard", workspaceId, "listers", filter ?? {}] as const,
  overview: (workspaceId: string, filter?: DashboardFilterParams) =>
    ["dashboard", workspaceId, "overview", filter ?? {}] as const,
  researchers: (workspaceId: string, filter?: DashboardFilterParams) =>
    ["dashboard", workspaceId, "researchers", filter ?? {}] as const,
  userActivity: (
    workspaceId: string,
    userId: string,
    filter?: DashboardFilterParams,
  ) => ["dashboard", workspaceId, "user-activity", userId, filter ?? {}] as const,
};

function isAuthError(error: unknown) {
  return error instanceof ApiError && (error.status === 401 || error.status === 403);
}

export function useDashboardOverview(
  workspaceId: string,
  filter?: DashboardFilterParams,
  enabled = true,
) {
  return useQuery({
    enabled: enabled && workspaceId.length > 0,
    queryFn: () => getDashboardOverview(workspaceId, filter),
    queryKey: dashboardKeys.overview(workspaceId, filter),
    retry: (failureCount, error) => !isAuthError(error) && failureCount < 1,
    staleTime: 30_000,
  });
}

export function useResearcherPerformance(
  workspaceId: string,
  filter?: DashboardFilterParams,
  enabled = true,
) {
  return useQuery({
    enabled: enabled && workspaceId.length > 0,
    queryFn: () => getResearcherPerformance(workspaceId, filter),
    queryKey: dashboardKeys.researchers(workspaceId, filter),
    retry: (failureCount, error) => !isAuthError(error) && failureCount < 1,
    staleTime: 30_000,
  });
}

export function useDesignerPerformance(
  workspaceId: string,
  filter?: DashboardFilterParams,
  enabled = true,
) {
  return useQuery({
    enabled: enabled && workspaceId.length > 0,
    queryFn: () => getDesignerPerformance(workspaceId, filter),
    queryKey: dashboardKeys.designers(workspaceId, filter),
    retry: (failureCount, error) => !isAuthError(error) && failureCount < 1,
    staleTime: 30_000,
  });
}

export function useListerPerformance(
  workspaceId: string,
  filter?: DashboardFilterParams,
  enabled = true,
) {
  return useQuery({
    enabled: enabled && workspaceId.length > 0,
    queryFn: () => getListerPerformance(workspaceId, filter),
    queryKey: dashboardKeys.listers(workspaceId, filter),
    retry: (failureCount, error) => !isAuthError(error) && failureCount < 1,
    staleTime: 30_000,
  });
}

export function useUserActivity(
  workspaceId: string,
  userId: string,
  filter?: DashboardFilterParams,
  enabled = true,
) {
  return useQuery({
    enabled: enabled && workspaceId.length > 0 && userId.length > 0,
    queryFn: () => getUserActivity(workspaceId, userId, filter),
    queryKey: dashboardKeys.userActivity(workspaceId, userId, filter),
    retry: (failureCount, error) => !isAuthError(error) && failureCount < 1,
    staleTime: 30_000,
  });
}
