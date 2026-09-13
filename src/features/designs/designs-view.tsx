"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Palette } from "lucide-react";

import { useTeamMembers } from "@/features/team/use-team";
import { parseDesignFiltersFromParams } from "./designs.schemas";
import { useAdminDesignList } from "./use-designs";
import { DesignsFilters } from "./designs-filters";
import { DesignsTable } from "./designs-table";

type DesignsViewProps = {
  workspaceId: string;
};

export function DesignsView({ workspaceId }: DesignsViewProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentFilters = parseDesignFiltersFromParams(searchParams);
  const designsQuery = useAdminDesignList(workspaceId, currentFilters);

  const teamMembersQuery = useTeamMembers(workspaceId, true);
  const designers = (teamMembersQuery.data?.data.members ?? [])
    .filter((member) => member.roles.includes("DESIGNER"))
    .map((member) => ({
      email: member.email,
      name: member.name,
      userId: member.userId,
    }));

  const selectedDesigner = designers.find(
    (designer) => designer.userId === currentFilters.designerId,
  );

  const totalCount = designsQuery.data?.pagination.total;

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
      currentFilters.designerId ||
      (currentFilters.page && currentFilters.page > 1),
  );

  return (
    <div className="mx-auto max-w-screen-2xl space-y-5 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Palette className="size-5 text-primary" />
            <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
              Design Management
            </h1>
          </div>
          <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
            Workspace design operations, designer assignments, review status, and production inventory.
          </p>
        </div>

        {/* Lightweight Scoped Count */}
        {totalCount !== undefined && (
          <p className="text-xs text-muted-foreground self-start sm:self-end" role="status">
            {totalCount.toLocaleString()} {totalCount === 1 ? "design item" : "design items"}
          </p>
        )}
      </div>

      {/* Toolbar Filters */}
      <DesignsFilters
        currentFilters={currentFilters}
        designers={designers}
      />

      {/* Operational Table */}
      <DesignsTable
        data={designsQuery.data}
        emptyStateTitle={
          currentFilters.designerId && selectedDesigner
            ? `No design items found for ${selectedDesigner.name || selectedDesigner.email}.`
            : hasActiveFilters
              ? "No design items match these filters."
              : undefined
        }
        hasActiveFilters={hasActiveFilters}
        isError={designsQuery.isError}
        isLoading={designsQuery.isLoading}
        onPageChange={handlePageChange}
        onResetFilters={handleResetFilters}
        onRetry={() => void designsQuery.refetch()}
        workspaceId={workspaceId}
      />
    </div>
  );
}
