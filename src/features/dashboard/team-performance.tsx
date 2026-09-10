"use client";

import { useState } from "react";
import {
  AlertCircle,
  Clock,
  Paintbrush,
  RefreshCw,
  Search,
  Tag,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type {
  DashboardFilterParams,
  DesignerPerformanceRow,
  ListerPerformanceRow,
  ResearcherPerformanceRow,
} from "./dashboard.types";
import {
  useDesignerPerformance,
  useListerPerformance,
  useResearcherPerformance,
} from "./use-dashboard";

type TeamPerformanceProps = {
  filter: DashboardFilterParams;
  workspaceId: string;
};

type PerformanceTab = "researchers" | "designers" | "listers";

export function TeamPerformance({ filter, workspaceId }: TeamPerformanceProps) {
  const [activeTab, setActiveTab] = useState<PerformanceTab>("researchers");

  const researchersQuery = useResearcherPerformance(
    workspaceId,
    filter,
    activeTab === "researchers",
  );
  const designersQuery = useDesignerPerformance(
    workspaceId,
    filter,
    activeTab === "designers",
  );
  const listersQuery = useListerPerformance(
    workspaceId,
    filter,
    activeTab === "listers",
  );

  return (
    <section aria-labelledby="team-performance-heading" className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2
            id="team-performance-heading"
            className="text-base font-semibold tracking-tight text-foreground"
          >
            Team Performance
          </h2>
          <p className="text-xs text-muted-foreground">
            Workload throughput and production contributions across workspace roles.
          </p>
        </div>

        {/* Tab Switcher */}
        <div
          role="tablist"
          aria-label="Role Performance Tabs"
          className="inline-flex rounded-lg border border-border bg-muted/40 p-1 text-xs"
        >
          <button
            role="tab"
            aria-selected={activeTab === "researchers"}
            onClick={() => setActiveTab("researchers")}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-3 py-1.5 font-medium transition-all focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring",
              activeTab === "researchers"
                ? "bg-card text-foreground shadow-xs font-semibold"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Search className="size-3.5" />
            <span>Researchers</span>
            {researchersQuery.data?.data.researchers && (
              <span className="ml-1 rounded-full bg-muted px-1.5 py-0.2 text-[10px] text-muted-foreground">
                {researchersQuery.data.data.researchers.length}
              </span>
            )}
          </button>

          <button
            role="tab"
            aria-selected={activeTab === "designers"}
            onClick={() => setActiveTab("designers")}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-3 py-1.5 font-medium transition-all focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring",
              activeTab === "designers"
                ? "bg-card text-foreground shadow-xs font-semibold"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Paintbrush className="size-3.5" />
            <span>Designers</span>
            {designersQuery.data?.data.designers && (
              <span className="ml-1 rounded-full bg-muted px-1.5 py-0.2 text-[10px] text-muted-foreground">
                {designersQuery.data.data.designers.length}
              </span>
            )}
          </button>

          <button
            role="tab"
            aria-selected={activeTab === "listers"}
            onClick={() => setActiveTab("listers")}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-3 py-1.5 font-medium transition-all focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring",
              activeTab === "listers"
                ? "bg-card text-foreground shadow-xs font-semibold"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Tag className="size-3.5" />
            <span>Listers</span>
            {listersQuery.data?.data.listers && (
              <span className="ml-1 rounded-full bg-muted px-1.5 py-0.2 text-[10px] text-muted-foreground">
                {listersQuery.data.data.listers.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Tab Contents */}
      <div className="rounded-xl border border-border bg-card shadow-xs">
        {activeTab === "researchers" && (
          <ResearchersTable
            isLoading={researchersQuery.isLoading}
            isError={researchersQuery.isError}
            data={researchersQuery.data?.data.researchers}
            onRetry={() => void researchersQuery.refetch()}
          />
        )}

        {activeTab === "designers" && (
          <DesignersTable
            isLoading={designersQuery.isLoading}
            isError={designersQuery.isError}
            data={designersQuery.data?.data.designers}
            onRetry={() => void designersQuery.refetch()}
          />
        )}

        {activeTab === "listers" && (
          <ListersTable
            isLoading={listersQuery.isLoading}
            isError={listersQuery.isError}
            data={listersQuery.data?.data.listers}
            onRetry={() => void listersQuery.refetch()}
          />
        )}
      </div>

      {/* Snapshot vs Event Note */}
      <p className="text-[11px] text-muted-foreground">
        * <strong className="font-medium text-foreground">In Progress Now</strong> is a real-time snapshot of active assignments and is not filtered by the date preset. All other metrics measure activity completed during the selected period.
      </p>
    </section>
  );
}

// ==========================================
// Researchers Table
// ==========================================
type SubTableProps<T> = {
  data?: T[];
  isError: boolean;
  isLoading: boolean;
  onRetry: () => void;
};

function ResearchersTable({
  data,
  isError,
  isLoading,
  onRetry,
}: SubTableProps<ResearcherPerformanceRow>) {
  if (isLoading) {
    return <TableSkeleton rows={4} columns={2} />;
  }

  if (isError) {
    return <TableErrorState onRetry={onRetry} roleName="researchers" />;
  }

  if (!data || data.length === 0) {
    return <TableEmptyState roleName="researchers" />;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs">
        <thead>
          <tr className="border-b border-border bg-muted/30 font-medium text-muted-foreground">
            <th scope="col" className="px-4 py-3">
              Researcher
            </th>
            <th scope="col" className="px-4 py-3 text-right">
              Research Added
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/60">
          {data.map((row) => (
            <tr key={row.userId} className="hover:bg-muted/20 transition-colors">
              <td className="px-4 py-3">
                <div className="flex flex-col">
                  <span className="font-medium text-foreground">
                    {row.name || "Unnamed Researcher"}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    {row.email}
                  </span>
                </div>
              </td>
              <td className="px-4 py-3 text-right font-semibold text-foreground">
                {row.researchCount.toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ==========================================
// Designers Table
// ==========================================
function DesignersTable({
  data,
  isError,
  isLoading,
  onRetry,
}: SubTableProps<DesignerPerformanceRow>) {
  if (isLoading) {
    return <TableSkeleton rows={4} columns={7} />;
  }

  if (isError) {
    return <TableErrorState onRetry={onRetry} roleName="designers" />;
  }

  if (!data || data.length === 0) {
    return <TableEmptyState roleName="designers" />;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs">
        <thead>
          <tr className="border-b border-border bg-muted/30 font-medium text-muted-foreground">
            <th scope="col" className="px-4 py-3">
              Designer
            </th>
            <th scope="col" className="px-4 py-3 text-right">
              Assigned
            </th>
            <th scope="col" className="px-4 py-3 text-right">
              <div className="inline-flex items-center gap-1">
                <span>In Progress</span>
                <span className="inline-flex items-center rounded-sm bg-blue-500/10 px-1 py-0.2 text-[9px] font-semibold text-blue-700 dark:text-blue-400">
                  <Clock className="mr-0.5 size-2.5" />
                  Live
                </span>
              </div>
            </th>
            <th scope="col" className="px-4 py-3 text-right">
              Submitted
            </th>
            <th scope="col" className="px-4 py-3 text-right">
              Approved
            </th>
            <th scope="col" className="px-4 py-3 text-right">
              Corrections
            </th>
            <th scope="col" className="px-4 py-3 text-right">
              Completed
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/60">
          {data.map((row) => (
            <tr key={row.userId} className="hover:bg-muted/20 transition-colors">
              <td className="px-4 py-3">
                <div className="flex flex-col">
                  <span className="font-medium text-foreground">
                    {row.name || "Unnamed Designer"}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    {row.email}
                  </span>
                </div>
              </td>
              <td className="px-4 py-3 text-right text-foreground">
                {row.assignedCount.toLocaleString()}
              </td>
              <td className="px-4 py-3 text-right font-medium text-blue-600 dark:text-blue-400">
                {row.currentInProgress.toLocaleString()}
              </td>
              <td className="px-4 py-3 text-right text-foreground">
                {row.submittedCount.toLocaleString()}
              </td>
              <td className="px-4 py-3 text-right text-emerald-600 dark:text-emerald-400 font-medium">
                {row.approvedCount.toLocaleString()}
              </td>
              <td className="px-4 py-3 text-right text-amber-600 dark:text-amber-400">
                {row.correctionsCount.toLocaleString()}
              </td>
              <td className="px-4 py-3 text-right font-semibold text-foreground">
                {row.completedCount.toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ==========================================
// Listers Table
// ==========================================
function ListersTable({
  data,
  isError,
  isLoading,
  onRetry,
}: SubTableProps<ListerPerformanceRow>) {
  if (isLoading) {
    return <TableSkeleton rows={4} columns={4} />;
  }

  if (isError) {
    return <TableErrorState onRetry={onRetry} roleName="listers" />;
  }

  if (!data || data.length === 0) {
    return <TableEmptyState roleName="listers" />;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs">
        <thead>
          <tr className="border-b border-border bg-muted/30 font-medium text-muted-foreground">
            <th scope="col" className="px-4 py-3">
              Lister
            </th>
            <th scope="col" className="px-4 py-3 text-right">
              Assigned
            </th>
            <th scope="col" className="px-4 py-3 text-right">
              <div className="inline-flex items-center gap-1">
                <span>In Progress</span>
                <span className="inline-flex items-center rounded-sm bg-blue-500/10 px-1 py-0.2 text-[9px] font-semibold text-blue-700 dark:text-blue-400">
                  <Clock className="mr-0.5 size-2.5" />
                  Live
                </span>
              </div>
            </th>
            <th scope="col" className="px-4 py-3 text-right">
              Listed
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/60">
          {data.map((row) => (
            <tr key={row.userId} className="hover:bg-muted/20 transition-colors">
              <td className="px-4 py-3">
                <div className="flex flex-col">
                  <span className="font-medium text-foreground">
                    {row.name || "Unnamed Lister"}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    {row.email}
                  </span>
                </div>
              </td>
              <td className="px-4 py-3 text-right text-foreground">
                {row.assignedCount.toLocaleString()}
              </td>
              <td className="px-4 py-3 text-right font-medium text-blue-600 dark:text-blue-400">
                {row.currentInProgress.toLocaleString()}
              </td>
              <td className="px-4 py-3 text-right font-semibold text-foreground">
                {row.listedCount.toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ==========================================
// States: Skeleton, Empty, Error
// ==========================================
function TableSkeleton({ rows, columns }: { columns: number; rows: number }) {
  return (
    <div className="p-4 space-y-3">
      <div className="flex gap-4">
        {Array.from({ length: columns }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "h-4 rounded-sm bg-muted animate-pulse",
              i === 0 ? "w-32" : "flex-1",
            )}
          />
        ))}
      </div>
      <div className="space-y-2 pt-2">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="flex gap-4">
            {Array.from({ length: columns }).map((_, c) => (
              <div
                key={c}
                className={cn(
                  "h-6 rounded-sm bg-muted/60 animate-pulse",
                  c === 0 ? "w-32" : "flex-1",
                )}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function TableEmptyState({ roleName }: { roleName: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
      <Users className="size-8 text-muted-foreground/60" />
      <p className="mt-2 text-xs font-medium text-foreground">
        No active {roleName} recorded for this period
      </p>
      <p className="mt-1 text-[11px] text-muted-foreground max-w-sm">
        Members with this role will appear here once assignments or throughput actions are recorded.
      </p>
    </div>
  );
}

function TableErrorState({
  onRetry,
  roleName,
}: {
  onRetry: () => void;
  roleName: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
      <AlertCircle className="size-8 text-destructive/80" />
      <p className="mt-2 text-xs font-medium text-foreground">
        Failed to load {roleName} performance
      </p>
      <p className="mt-1 text-[11px] text-muted-foreground">
        An error occurred while fetching data from the server.
      </p>
      <Button
        size="xs"
        variant="outline"
        onClick={onRetry}
        className="mt-3"
      >
        <RefreshCw className="size-3" />
        Retry
      </Button>
    </div>
  );
}
