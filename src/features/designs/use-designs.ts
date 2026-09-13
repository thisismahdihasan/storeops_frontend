"use client";

import { useQuery } from "@tanstack/react-query";
import { getAdminDesignList } from "./designs.api";
import type { AdminDesignFilterParams } from "./designs.types";

export const designKeys = {
  adminList: (workspaceId: string, filters?: AdminDesignFilterParams) =>
    ["designs", workspaceId, "admin-list", filters ?? {}] as const,
  all: ["designs"] as const,
};

export function useAdminDesignList(
  workspaceId: string,
  filters: AdminDesignFilterParams = {},
  enabled = true,
) {
  return useQuery({
    enabled: Boolean(workspaceId) && enabled,
    queryFn: () => getAdminDesignList(workspaceId, filters),
    queryKey: designKeys.adminList(workspaceId, filters),
  });
}
