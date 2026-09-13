"use client";

import { useSearchParams } from "next/navigation";
import { AlertTriangle, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DashboardKpiGrid } from "./dashboard-kpi-grid";
import { DashboardOverviewSkeleton } from "./dashboard-skeleton";
import { DateFilter, parseFilterFromParams } from "./date-filter";
import { TeamPerformance } from "./team-performance";
import { useDashboardOverview } from "./use-dashboard";

type DashboardViewProps = {
  workspaceId: string;
};

export function DashboardView({ workspaceId }: DashboardViewProps) {
  const searchParams = useSearchParams();
  const filter = parseFilterFromParams(searchParams);

  const overviewQuery = useDashboardOverview(workspaceId, filter);

  return (
    <div className="mx-auto max-w-screen-2xl space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Page Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
          Executive Dashboard
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Operational production pipeline metrics and team throughput.
        </p>
      </div>

      {/* Date Cohort Filter */}
      <DateFilter
        currentFilter={filter}
        resolvedRange={overviewQuery.data?.data.dateRange}
      />

      {/* Overview KPI Section */}
      {overviewQuery.isLoading && <DashboardOverviewSkeleton />}

      {overviewQuery.isError && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-destructive/20 bg-destructive/5 p-6 text-center shadow-xs">
          <AlertTriangle className="size-8 text-destructive" />
          <h2 className="mt-2 text-sm font-semibold text-foreground">
            Unable to load pipeline overview
          </h2>
          <p className="mt-1 text-xs text-muted-foreground max-w-md">
            {overviewQuery.error instanceof Error
              ? overviewQuery.error.message
              : "A network or server error occurred while retrieving dashboard metrics."}
          </p>
          <Button
            size="xs"
            variant="outline"
            onClick={() => void overviewQuery.refetch()}
            className="mt-4"
          >
            <RefreshCw className="size-3" />
            Retry Overview
          </Button>
        </div>
      )}

      {overviewQuery.data && (
        <DashboardKpiGrid
          data={overviewQuery.data.data}
          workspaceId={workspaceId}
        />
      )}

      {/* Team Performance Section */}
      <TeamPerformance filter={filter} workspaceId={workspaceId} />
    </div>
  );
}
