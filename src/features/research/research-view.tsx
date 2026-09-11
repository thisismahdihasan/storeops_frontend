"use client";

import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { useWorkspaces } from "@/features/workspace/use-workspaces";
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

  const workspacesQuery = useWorkspaces();
  const activeWorkspace = workspacesQuery.data?.data.workspaces.find(
    (ws) => ws.id === workspaceId,
  );
  const userRoles = activeWorkspace?.membership.roles ?? [];

  const currentFilters = parseResearchFiltersFromParams(searchParams);
  const researchQuery = useResearchItems(workspaceId, currentFilters);

  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  const canCreate =
    userRoles.includes("ADMIN") || userRoles.includes("RESEARCHER");
  const isAdmin = userRoles.includes("ADMIN");

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
      currentFilters.createdBy ||
      (currentFilters.page && currentFilters.page > 1),
  );

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Page Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
            Research Management
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Etsy product discovery queue, reference assets, and automatic designer assignment.
          </p>
        </div>

        {(canCreate || isAdmin) && (
          <div className="flex flex-wrap items-center gap-2">
            {isAdmin && <SyncUnassignedButton workspaceId={workspaceId} />}
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
      <ResearchFilters currentFilters={currentFilters} />

      {/* Research Table */}
      <ResearchTable
        data={researchQuery.data?.data}
        isLoading={researchQuery.isLoading}
        isError={researchQuery.isError}
        onRetry={() => void researchQuery.refetch()}
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
      />
    </div>
  );
}
