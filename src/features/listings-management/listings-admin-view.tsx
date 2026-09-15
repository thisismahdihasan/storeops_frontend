"use client";

import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Tag } from "lucide-react";
import { toast } from "sonner";

import { useTeamMembers } from "@/features/team/use-team";
import { useWorkspaces } from "@/features/workspace/use-workspaces";
import { ApiError } from "@/lib/api";
import { AssignListerDialog } from "./assign-lister-dialog";
import { InlineNotice } from "@/components/ui/inline-notice";
import { parseListingAdminFiltersFromParams } from "./listings-admin.schemas";
import type { AdminListingItem } from "./listings-admin.types";
import { useAdminListingList, useAssignLister } from "./use-admin-listings";
import { ListingsAdminFilters } from "./listings-admin-filters";
import { ListingsAdminTable } from "./listings-admin-table";

type ListingsAdminViewProps = {
  workspaceId: string;
};

export function ListingsAdminView({ workspaceId }: ListingsAdminViewProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const workspacesQuery = useWorkspaces();
  const activeWorkspace = workspacesQuery.data?.data.workspaces.find(
    (ws) => ws.id === workspaceId
  );
  const isAdmin = activeWorkspace?.membership.roles.includes("ADMIN") ?? false;

  const currentFilters = parseListingAdminFiltersFromParams(searchParams);
  const listingsQuery = useAdminListingList(workspaceId, currentFilters);

  const teamMembersQuery = useTeamMembers(workspaceId, isAdmin);
  const listerMembers = (teamMembersQuery.data?.data.members ?? [])
    .filter((member) => member.roles.includes("LISTER"));
  const listers = listerMembers.map((member) => ({
    email: member.email,
    name: member.name,
    userId: member.userId,
  }));

  const selectedLister = listers.find(
    (lister) => lister.userId === currentFilters.listerId,
  );

  const totalCount = listingsQuery.data?.pagination.total;
  const assignListerMutation = useAssignLister(workspaceId);
  const [assignListerItem, setAssignListerItem] =
    useState<AdminListingItem | null>(null);

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
    currentFilters.assignment ||
      currentFilters.status ||
      currentFilters.search ||
      currentFilters.date ||
      currentFilters.listerId ||
      (currentFilters.page && currentFilters.page > 1),
  );

  const handleAssignLister = async (listerId: string) => {
    if (!assignListerItem) return;

    try {
      await assignListerMutation.mutateAsync({
        listerId,
        researchItemId: assignListerItem.id,
      });
      toast.success("Lister assigned");
      setAssignListerItem(null);
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        toast.error("This item is no longer available for assignment. The list has been refreshed.");
        await listingsQuery.refetch();
        setAssignListerItem(null);
        return;
      }
      toast.error("Unable to assign Lister.");
    }
  };

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

      {activeWorkspace && !activeWorkspace.listerAutoAssignmentEnabled && (
        <InlineNotice variant="warning">
          <p className="font-semibold text-[13px] leading-tight mb-0.5">
            Lister auto-assignment is off
          </p>
          <p className="text-xs leading-relaxed">
            New listing-ready items will remain unassigned until an admin assigns them manually or runs Sync Listings.
          </p>
        </InlineNotice>
      )}

      {/* Toolbar Filters */}
      <ListingsAdminFilters
        currentFilters={currentFilters}
        isAdmin={isAdmin}
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
        onAssignLister={(item) => setAssignListerItem(item)}
        canAssignListers={isAdmin}
        workspaceId={workspaceId}
      />

      <AssignListerDialog
        isLoadingListers={teamMembersQuery.isLoading || teamMembersQuery.isError}
        isSubmitting={assignListerMutation.isPending}
        item={assignListerItem}
        listers={listerMembers}
        onAssign={handleAssignLister}
        onOpenChange={(open) => !open && setAssignListerItem(null)}
        open={assignListerItem !== null}
      />
    </div>
  );
}
