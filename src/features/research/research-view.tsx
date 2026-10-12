"use client";

import { useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

import { useNavigationContext } from "@/components/layout/navigation-context";
import { InlineNotice } from "@/components/ui/inline-notice";
import { useCurrentSession } from "@/features/auth/use-current-session";
import { useTeamMembers } from "@/features/team/use-team";
import { useWorkspaces } from "@/features/workspace/use-workspaces";
import { ApiError } from "@/lib/api";
import { AssignDesignerDialog } from "./assign-designer-dialog";
import { BulkAssignDesignersDialog } from "./bulk-assign-designers-dialog";
import { SyncListingsButton } from "@/features/listing/sync-listings-button";
import { AddResearchModal } from "./add-research-modal";
import { parseResearchFiltersFromParams, ResearchFilters } from "./research-filters";
import { ResearchItemDetailModal } from "./research-item-detail-modal";
import { ResearchTable } from "./research-table";
import { SyncUnassignedButton } from "./sync-unassigned-button";
import type { ResearchItemListItem } from "./research.types";
import { useAssignResearchDesigner, useResearchItems } from "./use-research";
import { resolveActivityDateRange, type ActivityDateRangeIntent } from "@/features/role-activity/role-activity-date.utils";
import { useResearcherSummary } from "@/features/role-activity/use-role-activity";

type ResearchViewProps = {
  workspaceId: string;
};

type ResearchSelectionState = {
  ids: string[];
  scopeKey: string;
};

type ResearchBulkAssignmentControllerProps = {
  onStaleConflict: () => Promise<void>;
  onSuccess: () => void;
  researchItemIds: string[];
  workspaceId: string;
};

function ResearchBulkAssignmentController({
  onStaleConflict,
  onSuccess,
  researchItemIds,
  workspaceId,
}: ResearchBulkAssignmentControllerProps) {
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

      <BulkAssignDesignersDialog
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

export function ResearchView({ workspaceId }: ResearchViewProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { mode } = useNavigationContext();

  const sessionQuery = useCurrentSession();
  const workspacesQuery = useWorkspaces();
  const activeWorkspace = workspacesQuery.data?.data.workspaces.find(
    (ws) => ws.id === workspaceId,
  );
  const userRoles = activeWorkspace?.membership.roles ?? [];

  const isAdmin = userRoles.includes("ADMIN");
  const isMyResearchContext =
    mode === "work" && userRoles.includes("RESEARCHER");
  const currentUserId = sessionQuery.data?.data.user.id;
  const currentFilters = parseResearchFiltersFromParams(searchParams);
  const activityIntent: ActivityDateRangeIntent = {
    range: (["today", "7d", "30d", "custom"].includes(searchParams.get("range") ?? "") ? searchParams.get("range") : "all") as ActivityDateRangeIntent["range"],
    from: searchParams.get("from") ?? undefined,
    to: searchParams.get("to") ?? undefined,
  };
  const resolvedActivityRange = resolveActivityDateRange(activityIntent);
  const researchFilters = isMyResearchContext && currentUserId
    ? { ...currentFilters, createdBy: currentUserId, date: undefined, dateFrom: resolvedActivityRange.dateFrom, dateTo: resolvedActivityRange.dateTo, status: undefined }
    : currentFilters;
  const researchQuery = useResearchItems(
    workspaceId,
    researchFilters,
    !isMyResearchContext || Boolean(currentUserId),
    isMyResearchContext ? "my-work" : "management",
  );
  const summaryQuery = useResearcherSummary(workspaceId, { dateFrom: resolvedActivityRange.dateFrom, dateTo: resolvedActivityRange.dateTo }, isMyResearchContext && resolvedActivityRange.isValid);

  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [assignDesignerItem, setAssignDesignerItem] =
    useState<ResearchItemListItem | null>(null);
  const [researchSelection, setResearchSelection] = useState<ResearchSelectionState>({
    ids: [],
    scopeKey: "",
  });

  const canCreate = isMyResearchContext;
  const isManagementContext = !isMyResearchContext;
  const canManageResearch = isAdmin && isManagementContext;
  const teamMembersQuery = useTeamMembers(workspaceId, canManageResearch);
  const researchers = (teamMembersQuery.data?.data.members ?? [])
    .filter((member) => member.roles.includes("RESEARCHER"))
    .map((member) => ({
      email: member.email,
      name: member.name,
      profileImageUrl: member.profileImageUrl,
      userId: member.userId,
    }));
  const designers = (teamMembersQuery.data?.data.members ?? []).filter(
    (member) => member.roles.includes("DESIGNER"),
  );
  const assignDesignerMutation = useAssignResearchDesigner(workspaceId);
  const researchItems = researchQuery.data?.data.items;
  const eligibleResearchItemIds = useMemo(
    () => (researchItems ?? [])
      .filter((item) =>
        item.status === "RESEARCHED" && item.currentDesignAssignment === null,
      )
      .map((item) => item.id),
    [researchItems],
  );
  const selectionScopeKey = `${workspaceId}:${searchParams.toString()}`;
  const selectedResearchItemIds = useMemo(() => {
    if (researchSelection.scopeKey !== selectionScopeKey) return [];
    const eligibleItemIds = new Set(eligibleResearchItemIds);
    return researchSelection.ids.filter((itemId) => eligibleItemIds.has(itemId));
  }, [eligibleResearchItemIds, researchSelection, selectionScopeKey]);
  const scopedResearchCount = researchQuery.data?.data.pagination.total;

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

  const selectStatusGroup = (statusGroup: NonNullable<ResearchItemListItem["status"]> | "all" | "waiting" | "in_design" | "needs_attention" | "in_listing" | "listed") => {
    const params = new URLSearchParams(searchParams.toString());
    if (statusGroup === "all") params.delete("statusGroup"); else params.set("statusGroup", statusGroup);
    params.delete("status");
    params.delete("page");
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  };

  const hasActiveFilters = Boolean(
    currentFilters.assignment ||
      currentFilters.status ||
      currentFilters.search ||
      currentFilters.date ||
      (isManagementContext && currentFilters.createdBy) ||
      (currentFilters.page && currentFilters.page > 1),
  );

  const handleAssignDesigner = async (designerId: string) => {
    if (!assignDesignerItem) return;

    try {
      await assignDesignerMutation.mutateAsync({
        designerId,
        researchItemId: assignDesignerItem.id,
      });
      toast.success("Designer assigned");
      setAssignDesignerItem(null);
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        toast.error("This item is no longer available for assignment. The list has been refreshed.");
        await researchQuery.refetch();
        setAssignDesignerItem(null);
        return;
      }
      toast.error("Unable to assign Designer.");
    }
  };

  const toggleResearchItemSelection = (researchItemId: string) => {
    setResearchSelection((selection) => {
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
    setResearchSelection((selection) => {
      const currentSelectedIds = selection.scopeKey === selectionScopeKey
        ? selection.ids.filter((itemId) => eligibleResearchItemIds.includes(itemId))
        : [];
      const selectedItemIds = new Set(currentSelectedIds);
      const areAllEligibleItemsSelected = eligibleResearchItemIds.every((itemId) =>
        selectedItemIds.has(itemId),
      );

      if (areAllEligibleItemsSelected) {
        return {
          ids: currentSelectedIds.filter(
            (itemId) => !eligibleResearchItemIds.includes(itemId),
          ),
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
    setResearchSelection({ ids: [], scopeKey: selectionScopeKey });
  };

  const handleBulkAssignmentConflict = async () => {
    setResearchSelection({ ids: [], scopeKey: selectionScopeKey });
    await researchQuery.refetch();
  };

  return (
    <div className="mx-auto max-w-screen-2xl space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Page Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
            {isMyResearchContext ? "My Research" : "Research Management"}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            {isMyResearchContext
              ? "Discover Etsy listings, manage your reference assets, and track your research work."
              : "Etsy product discovery queue, reference assets, and automatic designer assignment."}
          </p>
        </div>

        {(canCreate || canManageResearch) && (
          <div className="flex flex-wrap items-center gap-2">
            {canManageResearch && <SyncUnassignedButton workspaceId={workspaceId} />}
            {canManageResearch && <SyncListingsButton workspaceId={workspaceId} />}
            {canCreate && (
              <AddResearchModal
                workspaceId={workspaceId}
                onOpenExistingDetail={(id) => setSelectedItemId(id)}
              />
            )}
          </div>
        )}
      </div>

      {canManageResearch && activeWorkspace && !activeWorkspace.designerAutoAssignmentEnabled && (
        <InlineNotice variant="warning">
          <p className="font-semibold text-[13px] leading-tight mb-0.5">
            Designer auto-assignment is off
          </p>
          <p className="text-xs leading-relaxed">
            New research items will remain unassigned until an admin assigns them manually or runs Sync Unassigned.
          </p>
        </InlineNotice>
      )}

      {isMyResearchContext && (
        <section aria-label="Research activity summary" className="flex flex-wrap gap-2">
          {summaryQuery.isLoading ? [0, 1, 2, 3, 4, 5].map((item) => <div className="h-16 w-28 animate-pulse rounded-lg bg-muted" key={item} />) : summaryQuery.data ? [
            ["Total Researched", "all", summaryQuery.data.data.totalResearched], ["Waiting", "waiting", summaryQuery.data.data.waiting], ["In Design", "in_design", summaryQuery.data.data.inDesign], ["Needs Attention", "needs_attention", summaryQuery.data.data.needsAttention], ["In Listing", "in_listing", summaryQuery.data.data.inListing], ["Listed", "listed", summaryQuery.data.data.listed],
          ].map(([label, group, count]) => <button aria-pressed={(currentFilters.statusGroup ?? "all") === group} className={`min-w-28 rounded-lg border p-3 text-left transition-colors ${(currentFilters.statusGroup ?? "all") === group ? "border-primary bg-primary/10" : "border-border bg-card hover:bg-muted"}`} key={String(group)} onClick={() => selectStatusGroup(String(group) as Parameters<typeof selectStatusGroup>[0])} type="button"><span className="block text-xs text-muted-foreground">{label}</span><strong className="text-lg">{Number(count).toLocaleString()}</strong></button>) : <p className="text-xs text-muted-foreground">Activity summary is unavailable. <button className="underline" onClick={() => void summaryQuery.refetch()} type="button">Retry</button></p>}
        </section>
      )}

      {/* Filters Bar */}
      <ResearchFilters
        currentFilters={currentFilters}
        isAdmin={canManageResearch}
        isActivityWorker={isMyResearchContext}
        researchers={researchers}
      />

      {canManageResearch && scopedResearchCount !== undefined && (
        <p className="text-xs text-muted-foreground" role="status">
          {scopedResearchCount.toLocaleString()} {scopedResearchCount === 1 ? "research item" : "research items"}
        </p>
      )}

      {canManageResearch && (
        <ResearchBulkAssignmentController
          key={selectionScopeKey}
          onStaleConflict={handleBulkAssignmentConflict}
          onSuccess={handleBulkAssignmentSuccess}
          researchItemIds={selectedResearchItemIds}
          workspaceId={workspaceId}
        />
      )}

      {/* Research Table */}
      <ResearchTable
        data={researchQuery.data?.data}
        emptyStateTitle={
          canManageResearch && currentFilters.createdBy
            ? "No research items found for this researcher."
            : hasActiveFilters
              ? "No research items match these filters."
              : undefined
        }
        isLoading={researchQuery.isLoading}
        isError={researchQuery.isError}
        onRetry={() => void researchQuery.refetch()}
        isManagementContext={isManagementContext}
        workspaceId={workspaceId}
        userRoles={userRoles}
        hasActiveFilters={hasActiveFilters}
        onOpenDetail={(id) => setSelectedItemId(id)}
        onPageChange={handlePageChange}
        onResetFilters={handleResetFilters}
        onOpenAddModal={() => {
          // Trigger add research modal
          const addBtn = document.querySelector('[data-slot="dialog-trigger"]');
          if (addBtn instanceof HTMLElement) {
            addBtn.click();
          }
        }}
        onAssignDesigner={(item) => setAssignDesignerItem(item)}
        eligibleResearchItemIds={eligibleResearchItemIds}
        onToggleAllEligible={toggleAllEligibleResearchItems}
        onToggleSelection={toggleResearchItemSelection}
        selectedResearchItemIds={selectedResearchItemIds}
      />

      {/* Item Detail Modal */}
      <ResearchItemDetailModal
        open={selectedItemId !== null}
        onClose={() => setSelectedItemId(null)}
        researchItemId={selectedItemId}
        workspaceId={workspaceId}
        userRoles={userRoles}
        isManagementContext={isManagementContext}
      />

      <AssignDesignerDialog
        designers={designers}
        isLoadingDesigners={teamMembersQuery.isLoading || teamMembersQuery.isError}
        isSubmitting={assignDesignerMutation.isPending}
        item={assignDesignerItem}
        onAssign={handleAssignDesigner}
        onOpenChange={(open) => !open && setAssignDesignerItem(null)}
        open={assignDesignerItem !== null}
      />

    </div>
  );
}
