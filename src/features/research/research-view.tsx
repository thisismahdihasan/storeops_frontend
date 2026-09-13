"use client";

import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { useNavigationContext } from "@/components/layout/navigation-context";
import { useCurrentSession } from "@/features/auth/use-current-session";
import { useTeamMembers } from "@/features/team/use-team";
import { useWorkspaces } from "@/features/workspace/use-workspaces";
import { SyncListingsButton } from "@/features/listing/sync-listings-button";
import { AddResearchModal } from "./add-research-modal";
import { parseResearchFiltersFromParams, ResearchFilters } from "./research-filters";
import { ResearchItemDetailModal } from "./research-item-detail-modal";
import { ResearchTable } from "./research-table";
import { SyncUnassignedButton } from "./sync-unassigned-button";
import { useResearchItems } from "./use-research";

type ResearchViewProps = {
  workspaceId: string;
};

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
  const researchFilters = isMyResearchContext && currentUserId
    ? { ...currentFilters, createdBy: currentUserId }
    : currentFilters;
  const researchQuery = useResearchItems(
    workspaceId,
    researchFilters,
    !isMyResearchContext || Boolean(currentUserId),
    isMyResearchContext ? "my-work" : "management",
  );

  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  const canCreate = isMyResearchContext;
  const isManagementContext = !isMyResearchContext;
  const canManageResearch = isAdmin && isManagementContext;
  const teamMembersQuery = useTeamMembers(workspaceId, canManageResearch);
  const researchers = (teamMembersQuery.data?.data.members ?? [])
    .filter((member) => member.roles.includes("RESEARCHER"))
    .map((member) => ({
      email: member.email,
      name: member.name,
      userId: member.userId,
    }));
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

  const hasActiveFilters = Boolean(
    currentFilters.status ||
      currentFilters.search ||
      currentFilters.date ||
      (isManagementContext && currentFilters.createdBy) ||
      (currentFilters.page && currentFilters.page > 1),
  );

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

      {/* Filters Bar */}
      <ResearchFilters
        currentFilters={currentFilters}
        isAdmin={canManageResearch}
        researchers={researchers}
      />

      {canManageResearch && scopedResearchCount !== undefined && (
        <p className="text-xs text-muted-foreground" role="status">
          {scopedResearchCount.toLocaleString()} {scopedResearchCount === 1 ? "research item" : "research items"}
        </p>
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
    </div>
  );
}
