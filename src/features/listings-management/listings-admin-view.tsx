"use client";

import { useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Tag } from "lucide-react";
import { toast } from "sonner";

import { useTeamMembers } from "@/features/team/use-team";
import { useWorkspaces } from "@/features/workspace/use-workspaces";
import { ApiError } from "@/lib/api";
import { AssignListerDialog } from "./assign-lister-dialog";
import { BulkAssignListersDialog } from "./bulk-assign-listers-dialog";
import { InlineNotice } from "@/components/ui/inline-notice";
import { parseListingAdminFiltersFromParams } from "./listings-admin.schemas";
import type { AdminListingItem } from "./listings-admin.types";
import { useAdminListingList, useAssignLister } from "./use-admin-listings";
import { ListingsAdminFilters } from "./listings-admin-filters";
import { ListingsAdminTable } from "./listings-admin-table";

type ListingsAdminViewProps = {
  workspaceId: string;
};

type ListingSelectionState = {
  ids: string[];
  scopeKey: string;
};

type ListingBulkAssignmentControllerProps = {
  onStaleConflict: () => Promise<void>;
  onSuccess: () => void;
  researchItemIds: string[];
  workspaceId: string;
};

function ListingBulkAssignmentController({
  onStaleConflict,
  onSuccess,
  researchItemIds,
  workspaceId,
}: ListingBulkAssignmentControllerProps) {
  const [isBulkAssignDialogOpen, setIsBulkAssignDialogOpen] = useState(false);
  const isBulkAssignmentDialogOpen =
    isBulkAssignDialogOpen && researchItemIds.length > 0;

  return (
    <>
      {researchItemIds.length > 0 && (
        <div className="flex flex-col gap-2 rounded-xl border border-border bg-card p-3 shadow-xs sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-medium text-foreground">
            {researchItemIds.length} selected
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              onClick={() => setIsBulkAssignDialogOpen(true)}
              type="button"
            >
              Assign selected
            </button>
            <button
              className="inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-3 text-xs font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              onClick={onSuccess}
              type="button"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      <BulkAssignListersDialog
        key={isBulkAssignmentDialogOpen ? researchItemIds.join(",") : "closed"}
        onOpenChange={setIsBulkAssignDialogOpen}
        onStaleConflict={onStaleConflict}
        onSuccess={onSuccess}
        open={isBulkAssignmentDialogOpen}
        researchItemIds={researchItemIds}
        workspaceId={workspaceId}
      />
    </>
  );
}

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
  const [listingSelection, setListingSelection] = useState<ListingSelectionState>({
    ids: [],
    scopeKey: "",
  });
  const listingItems = listingsQuery.data?.items;
  const eligibleResearchItemIds = useMemo(
    () => (listingItems ?? [])
      .filter((item) =>
        item.status === "READY_FOR_LISTING" && item.currentAssignment === null,
      )
      .map((item) => item.id),
    [listingItems],
  );
  const selectionScopeKey = `${workspaceId}:${searchParams.toString()}`;
  const selectedResearchItemIds = useMemo(() => {
    if (listingSelection.scopeKey !== selectionScopeKey) return [];
    const eligibleItemIds = new Set(eligibleResearchItemIds);
    return listingSelection.ids.filter((itemId) => eligibleItemIds.has(itemId));
  }, [eligibleResearchItemIds, listingSelection, selectionScopeKey]);

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

  const toggleResearchItemSelection = (researchItemId: string) => {
    setListingSelection((selection) => {
      const currentSelectedIds = selection.scopeKey === selectionScopeKey
        ? selection.ids.filter((itemId) => eligibleResearchItemIds.includes(itemId))
        : [];
      return {
        ids: currentSelectedIds.includes(researchItemId)
          ? currentSelectedIds.filter((itemId) => itemId !== researchItemId)
          : [...currentSelectedIds, researchItemId],
        scopeKey: selectionScopeKey,
      };
    });
  };

  const toggleAllEligibleResearchItems = () => {
    setListingSelection((selection) => {
      const currentSelectedIds = selection.scopeKey === selectionScopeKey
        ? selection.ids.filter((itemId) => eligibleResearchItemIds.includes(itemId))
        : [];
      const selectedItemIds = new Set(currentSelectedIds);
      const areAllEligibleItemsSelected = eligibleResearchItemIds.every((itemId) =>
        selectedItemIds.has(itemId),
      );

      if (areAllEligibleItemsSelected) {
        return {
          ids: currentSelectedIds.filter((itemId) => !eligibleResearchItemIds.includes(itemId)),
          scopeKey: selectionScopeKey,
        };
      }

      return {
        ids: Array.from(new Set([...currentSelectedIds, ...eligibleResearchItemIds])),
        scopeKey: selectionScopeKey,
      };
    });
  };

  const handleBulkAssignmentSuccess = () => {
    setListingSelection({ ids: [], scopeKey: selectionScopeKey });
  };

  const handleBulkAssignmentConflict = async () => {
    setListingSelection({ ids: [], scopeKey: selectionScopeKey });
    await listingsQuery.refetch();
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

      {isAdmin && (
        <ListingBulkAssignmentController
          key={selectionScopeKey}
          onStaleConflict={handleBulkAssignmentConflict}
          onSuccess={handleBulkAssignmentSuccess}
          researchItemIds={selectedResearchItemIds}
          workspaceId={workspaceId}
        />
      )}

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
        eligibleResearchItemIds={eligibleResearchItemIds}
        onToggleAllEligible={toggleAllEligibleResearchItems}
        onToggleSelection={toggleResearchItemSelection}
        selectedResearchItemIds={selectedResearchItemIds}
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
