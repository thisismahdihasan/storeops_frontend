"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Tag } from "lucide-react";

import { useTeamMembers } from "@/features/team/use-team";
import { parseListingAdminFiltersFromParams } from "./listings-admin.schemas";
import { useAdminListingList } from "./use-admin-listings";
import { ListingsAdminFilters } from "./listings-admin-filters";
import { ListingsAdminTable } from "./listings-admin-table";

type ListingsAdminViewProps = {
  workspaceId: string;
};

export function ListingsAdminView({ workspaceId }: ListingsAdminViewProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentFilters = parseListingAdminFiltersFromParams(searchParams);
  const listingsQuery = useAdminListingList(workspaceId, currentFilters);

  const teamMembersQuery = useTeamMembers(workspaceId, true);
  const listers = (teamMembersQuery.data?.data.members ?? [])
    .filter((member) => member.roles.includes("LISTER"))
    .map((member) => ({
      email: member.email,
      name: member.name,
      userId: member.userId,
    }));

  const selectedLister = listers.find(
    (lister) => lister.userId === currentFilters.listerId,
  );

  const totalCount = listingsQuery.data?.pagination.total;

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (newPage > 1) {
      params.set("page", newPage.toString());
    } else {
      params.delete("page");
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleResetFilters = () => {
    router.push(pathname);
  };

  const hasActiveFilters = Boolean(
    currentFilters.status ||
      currentFilters.search ||
      currentFilters.date ||
      currentFilters.listerId ||
      (currentFilters.page && currentFilters.page > 1),
  );

  return (
    <div className="mx-auto max-w-screen-2xl space-y-5 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Tag className="size-5 text-primary" />
            <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
              Listing Management
            </h1>
          </div>
          <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
            Workspace listing operations, lister assignments, publication status, and catalog inventory.
          </p>
        </div>

        {/* Lightweight Scoped Count */}
        {totalCount !== undefined && (
          <p className="text-xs text-muted-foreground self-start sm:self-end" role="status">
            {totalCount.toLocaleString()} {totalCount === 1 ? "listing item" : "listing items"}
          </p>
        )}
      </div>

      {/* Toolbar Filters */}
      <ListingsAdminFilters
        currentFilters={currentFilters}
        listers={listers}
      />

      {/* Operational Table */}
      <ListingsAdminTable
        data={listingsQuery.data}
        emptyStateTitle={
          currentFilters.listerId && selectedLister
            ? `No listing items found for ${selectedLister.name || selectedLister.email}.`
            : hasActiveFilters
              ? "No listing items match these filters."
              : undefined
        }
        hasActiveFilters={hasActiveFilters}
        isError={listingsQuery.isError}
        isLoading={listingsQuery.isLoading}
        onPageChange={handlePageChange}
        onResetFilters={handleResetFilters}
        onRetry={() => void listingsQuery.refetch()}
        workspaceId={workspaceId}
      />
    </div>
  );
}
