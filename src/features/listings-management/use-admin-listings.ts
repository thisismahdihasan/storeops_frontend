"use client";

import { useQuery } from "@tanstack/react-query";
import { getAdminListingList } from "./listings-admin.api";
import type { AdminListingFilterParams } from "./listings-admin.types";

export const listingAdminKeys = {
  adminList: (workspaceId: string, filters?: AdminListingFilterParams) =>
    ["listings", workspaceId, "admin-list", filters ?? {}] as const,
  all: ["listings"] as const,
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
