"use client";

import { useCallback, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Palette } from "lucide-react";
import { toast } from "sonner";

import { ApiError } from "@/lib/api";
import { useWorkspaces } from "@/features/workspace/use-workspaces";
import { getAssignmentAvailabilityState } from "@/features/workspace/workspace-assignment-availability";

import { WorkerAssignmentStatusBanner } from "@/features/workspace/worker-assignment-status-banner";
import { CountBadge } from "@/components/ui/count-badge";
import { FilterToolbarLayout } from "@/components/filter-toolbar-layout";
import { FilterSearchInput } from "@/components/filter-search-input";
import { ActivityDateRangeFilter } from "@/features/role-activity/activity-date-range-filter";
import { resolveActivityDateRange, type ActivityDateRangeIntent } from "@/features/role-activity/role-activity-date.utils";
import { useDesignerHistory, useDesignerSummary } from "@/features/role-activity/use-role-activity";
import { DesignerWorkFilters } from "./designer-work-filters";
import { DesignerWorkList } from "./designer-work-list";
import { DesignerCompletedList } from "./designer-completed-list";
import { ReportIssueDialog } from "./report-issue-dialog";
import { designerWorkFiltersSchema } from "./designer-work.schemas";
import type { DesignerWorkFilters as DesignerWorkFiltersValue, DesignerWorkItem, ReportIssueFormValues } from "./designer-work.types";
import { useDesignerWorkQueue, useReportDesignIssue, useStartCorrection, useStartDesignWork } from "./use-designer-work";

function parseDesignerWorkFilters(searchParams: URLSearchParams): DesignerWorkFiltersValue {
  const page = Number(searchParams.get("page"));
  const candidate = { limit: 20, page: Number.isInteger(page) && page > 0 ? page : 1, search: searchParams.get("search")?.trim() || undefined, status: searchParams.get("status") || undefined, sort: searchParams.get("sort") || undefined };
  const parsed = designerWorkFiltersSchema.safeParse(candidate);
  return parsed.success ? parsed.data : { limit: 20, page: 1, sort: "fifo" };
}

function getActionErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError && error.status === 409) return `${error.message} The queue has been refreshed.`;
  return error instanceof Error ? error.message : fallback;
}

type DesignerWorkViewProps = { workspaceId: string };

export function DesignerWorkView({ workspaceId }: DesignerWorkViewProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const filters = parseDesignerWorkFilters(searchParams);
  const view = searchParams.get("view") === "completed" ? "completed" : "active";
  const activityIntent: ActivityDateRangeIntent = { range: (["today", "7d", "30d", "custom"].includes(searchParams.get("range") ?? "") ? searchParams.get("range") : "all") as ActivityDateRangeIntent["range"], from: searchParams.get("from") ?? undefined, to: searchParams.get("to") ?? undefined };
  const resolvedRange = resolveActivityDateRange(activityIntent);
  const historyQuery = { page: filters.page, limit: 20, search: filters.search, sort: (searchParams.get("sort") === "oldest" ? "oldest" : "newest") as "newest" | "oldest", dateFrom: resolvedRange.dateFrom, dateTo: resolvedRange.dateTo };
  const workspacesQuery = useWorkspaces();
  const activeWorkspace = workspacesQuery.data?.data.workspaces.find((workspace) => workspace.id === workspaceId);
  const hasDesignerRole = activeWorkspace?.membership.roles.includes("DESIGNER") ?? false;
  const queueQuery = useDesignerWorkQueue(workspaceId, filters, hasDesignerRole && view === "active");
  const summaryQuery = useDesignerSummary(workspaceId, { dateFrom: resolvedRange.dateFrom, dateTo: resolvedRange.dateTo }, hasDesignerRole && resolvedRange.isValid);
  const completedQuery = useDesignerHistory(workspaceId, historyQuery, hasDesignerRole && view === "completed" && resolvedRange.isValid);
  const startWorkMutation = useStartDesignWork(workspaceId);
  const reportIssueMutation = useReportDesignIssue(workspaceId);
  const startCorrectionMutation = useStartCorrection(workspaceId);
  const [issueWork, setIssueWork] = useState<DesignerWorkItem | null>(null);

  const updateFilters = useCallback((changes: Partial<DesignerWorkFiltersValue>) => {
    const next = { ...filters, ...changes };
    const params = new URLSearchParams(searchParams.toString());
    if (next.status) params.set("status", next.status);
    else params.delete("status");
    if (next.search) params.set("search", next.search);
    else params.delete("search");
    if (next.sort && next.sort !== "fifo") params.set("sort", next.sort);
    else params.delete("sort");
    if (next.page > 1) params.set("page", next.page.toString());
    else params.delete("page");
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  }, [filters, pathname, router, searchParams]);
  const updateCompleted = (changes: Partial<typeof historyQuery> & Partial<ActivityDateRangeIntent> & { view?: "active" | "completed" }) => {
    const params = new URLSearchParams(searchParams.toString());
    const nextView = changes.view ?? view;
    if (nextView === "completed") params.set("view", "completed"); else params.delete("view");
    if (changes.view === "completed" && !["newest", "oldest"].includes(searchParams.get("sort") ?? "")) params.delete("sort");
    if (changes.search !== undefined) { if (changes.search) params.set("search", changes.search); else params.delete("search"); }
    if (changes.sort !== undefined) { if (changes.sort === "oldest") params.set("sort", "oldest"); else params.delete("sort"); }
    if (changes.range !== undefined) {
      if (changes.range === "all") params.delete("range"); else params.set("range", changes.range);
      if (changes.range !== "custom") { params.delete("from"); params.delete("to"); }
    }
    if (changes.from !== undefined) { if (changes.from) params.set("from", changes.from); else params.delete("from"); }
    if (changes.to !== undefined) { if (changes.to) params.set("to", changes.to); else params.delete("to"); }
    const nextPage = changes.page ?? 1;
    if (nextPage > 1) params.set("page", String(nextPage)); else params.delete("page");
    const query = params.toString(); router.push(query ? `${pathname}?${query}` : pathname);
  };

  const refreshQueueAfterConflict = () => { void queueQuery.refetch(); };
  const handleOpenWork = (work: DesignerWorkItem) => {
    router.push(`/w/${workspaceId}/design/${work.researchItem.id}`);
  };
  const handleStartWork = async (work: DesignerWorkItem) => {
    try {
      await startWorkMutation.mutateAsync(work.researchItem.id);
      toast.success("Design work started.");
      router.push(`/w/${workspaceId}/design/${work.researchItem.id}`);
    } catch (error) {
      toast.error(getActionErrorMessage(error, "Unable to start work."));
      if (error instanceof ApiError && error.status === 409) refreshQueueAfterConflict();
    }
  };
  const handleStartCorrection = async (work: DesignerWorkItem) => {
    try { await startCorrectionMutation.mutateAsync(work.researchItem.id); toast.success("Correction work started."); }
    catch (error) { toast.error(getActionErrorMessage(error, "Unable to start correction.")); if (error instanceof ApiError && error.status === 409) refreshQueueAfterConflict(); }
  };
  const handleReportIssue = async (values: ReportIssueFormValues) => {
    if (!issueWork) return;
    try { await reportIssueMutation.mutateAsync({ researchItemId: issueWork.researchItem.id, values }); toast.success("Design issue reported. Waiting for Admin action."); setIssueWork(null); }
    catch (error) { toast.error(getActionErrorMessage(error, "Unable to report the issue.")); if (error instanceof ApiError && error.status === 409) refreshQueueAfterConflict(); }
  };

  return (
    <div className="mx-auto max-w-screen-2xl space-y-5 p-4 sm:p-6 lg:p-8">
      <header className="flex flex-col gap-3 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">Designer workflow</p>
          <h1 className="mt-1 flex items-center gap-2 text-2xl font-bold tracking-tight sm:text-3xl">
            <Palette className="size-6 text-primary" />My Work
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">Your active design assignments, ordered by oldest assignment first.</p>
        </div>
        {view === "active" && queueQuery.data && (
          <CountBadge
            count={queueQuery.data.data.pagination.total}
            label="active assignment"
          />
        )}
      </header>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Work view"><button aria-pressed={view === "active"} className={`rounded-md px-3 py-1.5 text-sm ${view === "active" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`} onClick={() => updateCompleted({ view: "active" })} type="button">Active Work</button><button aria-pressed={view === "completed"} className={`rounded-md px-3 py-1.5 text-sm ${view === "completed" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`} onClick={() => updateCompleted({ view: "completed" })} type="button">Completed</button></div>
      {summaryQuery.data && <section className="flex flex-wrap gap-2" aria-label="Design activity summary"><button className="rounded-md border bg-card p-2 text-left text-xs" onClick={() => updateCompleted({ view: "active" })} type="button">Active <strong className="ml-1">{summaryQuery.data.data.active.total}</strong></button><span className="rounded-md border bg-card p-2 text-xs">In Review <strong className="ml-1">{summaryQuery.data.data.active.inReview}</strong></span><span className="rounded-md border bg-card p-2 text-xs">Corrections <strong className="ml-1">{summaryQuery.data.data.active.correctionsNeeded}</strong></span><button className="rounded-md border bg-card p-2 text-left text-xs" onClick={() => updateCompleted({ view: "completed" })} type="button">Completed <strong className="ml-1">{summaryQuery.data.data.completed.filtered}</strong></button><span className="rounded-md border bg-card p-2 text-xs">All-time completed <strong className="ml-1">{summaryQuery.data.data.completed.allTime}</strong></span></section>}
      {activeWorkspace ? (
        <WorkerAssignmentStatusBanner
          membership={activeWorkspace.membership}
          role="DESIGNER"
        />
      ) : null}
      {view === "active" ? <><DesignerWorkFilters key={filters.search ?? ""} filters={filters} onChange={updateFilters} />
      <DesignerWorkList
        availabilityState={
          activeWorkspace
            ? getAssignmentAvailabilityState(activeWorkspace.membership, "DESIGNER")
            : "AVAILABLE"
        }
        data={queueQuery.data?.data}
        filtersActive={Boolean(filters.search || filters.status)}
        isError={queueQuery.isError}
        isLoading={queueQuery.isLoading || workspacesQuery.isLoading}
        onOpenWork={handleOpenWork}
        onPageChange={(page) => updateFilters({ page })}
        onReportIssue={setIssueWork}
        onRetry={() => void queueQuery.refetch()}
        onStartCorrection={(work) => void handleStartCorrection(work)}
        onStartWork={(work) => void handleStartWork(work)}
        startingCorrectionItemId={startCorrectionMutation.isPending ? startCorrectionMutation.variables : undefined}
        startingWorkItemId={startWorkMutation.isPending ? startWorkMutation.variables : undefined}
        workspaceId={workspaceId}
      /></> : <><FilterToolbarLayout hasActiveFilters={Boolean(historyQuery.search || historyQuery.sort === "oldest" || activityIntent.range !== "all")} onClearFilters={() => updateCompleted({ search: "", sort: "newest", range: "all" })} searchSlot={<FilterSearchInput onSearch={(search) => updateCompleted({ search: search.trim() })} placeholder="Search completed designs" value={historyQuery.search ?? ""} />}><ActivityDateRangeFilter {...activityIntent} onChange={(next) => updateCompleted(next)} /><select aria-label="Sort completed designs" className="h-9 rounded-md border border-input bg-background px-2.5 text-xs" onChange={(event) => updateCompleted({ sort: event.target.value as "newest" | "oldest" })} value={historyQuery.sort}><option value="newest">Newest completed</option><option value="oldest">Oldest completed</option></select></FilterToolbarLayout><p className="text-xs text-muted-foreground">Date range applies to completed history; active counts are current.</p><DesignerCompletedList data={completedQuery.data?.data} isError={completedQuery.isError} isLoading={completedQuery.isLoading} onPageChange={(page) => updateCompleted({ page })} onReset={() => updateCompleted({ search: "", sort: "newest", range: "all" })} onRetry={() => void completedQuery.refetch()} workspaceId={workspaceId} /></>}
      {view === "active" && <ReportIssueDialog isSubmitting={reportIssueMutation.isPending} onOpenChange={(open) => !open && setIssueWork(null)} onSubmit={(values) => void handleReportIssue(values)} open={issueWork !== null} workTitle={issueWork?.researchItem.title || `Etsy Listing #${issueWork?.researchItem.etsyListingId ?? ""}`} />}
    </div>
  );
}
