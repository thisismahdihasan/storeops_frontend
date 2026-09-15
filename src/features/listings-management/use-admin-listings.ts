"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { listingKeys } from "@/features/listing/listing.keys";
import { notificationKeys } from "@/features/notifications/notifications.keys";

import { assignLister, getAdminListingList } from "./listings-admin.api";
import type { AdminListingFilterParams } from "./listings-admin.types";

export const listingAdminKeys = {
  adminList: (workspaceId: string, filters?: AdminListingFilterParams) =>
    ["listings", workspaceId, "admin-list", filters ?? {}] as const,
  all: ["listings"] as const,
  lists: (workspaceId: string) =>
    ["listings", workspaceId, "admin-list"] as const,
};

export function useAdminListingList(
  workspaceId: string,
  filters: AdminListingFilterParams = {},
  enabled = true,
) {
  return useQuery({
    enabled: Boolean(workspaceId) && enabled,
    queryFn: () => getAdminListingList(workspaceId, filters),
    queryKey: listingAdminKeys.adminList(workspaceId, filters),
  });
}

export function useAssignLister(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      listerId,
      researchItemId,
    }: {
      listerId: string;
      researchItemId: string;
    }) => assignLister(workspaceId, researchItemId, listerId),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: listingAdminKeys.lists(workspaceId),
      });
      void queryClient.invalidateQueries({
        queryKey: listingKeys.detail(workspaceId, variables.researchItemId),
      });
      void queryClient.invalidateQueries({
        queryKey: listingKeys.queues(workspaceId),
      });
      void queryClient.invalidateQueries({
        queryKey: ["dashboard", workspaceId],
      });
      void queryClient.invalidateQueries({
        queryKey: notificationKeys.all(workspaceId),
      });
    },
  });
}
