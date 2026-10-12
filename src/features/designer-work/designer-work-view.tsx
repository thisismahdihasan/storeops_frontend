"use client";

import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Palette } from "lucide-react";
import { toast } from "sonner";
import { ApiError } from "@/lib/api";
import { CountBadge } from "@/components/ui/count-badge";
import { FilterToolbarLayout } from "@/components/filter-toolbar-layout";
import { FilterSearchInput } from "@/components/filter-search-input";
import { useWorkspaces } from "@/features/workspace/use-workspaces";
import { getAssignmentAvailabilityState } from "@/features/workspace/workspace-assignment-availability";
import { WorkerAssignmentStatusBanner } from "@/features/workspace/worker-assignment-status-banner";
import { ActivityDateRangeFilter } from "@/features/role-activity/activity-date-range-filter";
import { resolveActivityDateRange, type ActivityDateRangeIntent } from "@/features/role-activity/role-activity-date.utils";
import { useDesignerHistory, useDesignerSummary } from "@/features/role-activity/use-role-activity";
import { DesignerCompletedList } from "./designer-completed-list";
import { DesignerWorkFilters } from "./designer-work-filters";
import { DesignerWorkList } from "./designer-work-list";
import { ReportIssueDialog } from "./report-issue-dialog";
import type { DesignerWorkItem, DesignerWorkStatus, ReportIssueFormValues } from "./designer-work.types";
import { useDesignerWorkQueue, useReportDesignIssue, useStartCorrection, useStartDesignWork } from "./use-designer-work";

const activeStatuses: DesignerWorkStatus[] = ["ASSIGNED", "DESIGN_IN_PROGRESS", "DESIGN_REVIEW", "CORRECTION_NEEDED", "ISSUE_REPORTED", "DESIGN_APPROVED"];
const intent = (params: URLSearchParams): ActivityDateRangeIntent => ({ range: (["today", "7d", "30d", "custom"].includes(params.get("range") ?? "") ? params.get("range") : "all") as ActivityDateRangeIntent["range"], from: params.get("from") ?? undefined, to: params.get("to") ?? undefined });

function getCompletedBadgeLabel(range: ActivityDateRangeIntent["range"]): { label: string; pluralLabel: string } {
  switch (range) {
    case "today":
      return { label: "completed today", pluralLabel: "completed today" };
    case "7d":
      return { label: "completed in last 7 days", pluralLabel: "completed in last 7 days" };
    case "30d":
      return { label: "completed in last 30 days", pluralLabel: "completed in last 30 days" };
    default:
      return { label: "completed", pluralLabel: "completed" };
  }
}

export function DesignerWorkView({ workspaceId }: { workspaceId: string }) {
  const pathname = usePathname(); const router = useRouter(); const params = useSearchParams();
  const rawStatus = params.get("status"); const isCompleted = rawStatus === "completed";
  const status = activeStatuses.includes(rawStatus as DesignerWorkStatus) ? rawStatus as DesignerWorkStatus : undefined;
  const page = Math.max(1, Number(params.get("page")) || 1); const activeSort = params.get("sort") === "newest" ? "newest" : "fifo";
  const rangeIntent = intent(params); const range = resolveActivityDateRange(rangeIntent);
  const historyQuery = { page, limit: 20, search: params.get("search")?.trim() || undefined, sort: params.get("sort") === "oldest" ? "oldest" as const : "newest" as const, dateFrom: range.dateFrom, dateTo: range.dateTo };
  const workspaces = useWorkspaces(); const workspace = workspaces.data?.data.workspaces.find((item) => item.id === workspaceId); const hasRole = workspace?.membership.roles.includes("DESIGNER") ?? false;
  const queue = useDesignerWorkQueue(workspaceId, { limit: 20, page, status, sort: activeSort }, hasRole && !isCompleted);
  const summary = useDesignerSummary(workspaceId, { dateFrom: range.dateFrom, dateTo: range.dateTo }, hasRole && range.isValid);
  const history = useDesignerHistory(workspaceId, historyQuery, hasRole && isCompleted && range.isValid);
  const start = useStartDesignWork(workspaceId); const correction = useStartCorrection(workspaceId); const report = useReportDesignIssue(workspaceId); const [issueWork, setIssueWork] = useState<DesignerWorkItem | null>(null);
  const update = (changes: Record<string, string | undefined>) => { const next = new URLSearchParams(params.toString()); Object.entries(changes).forEach(([key, value]) => value ? next.set(key, value) : next.delete(key)); const query = next.toString(); router.push(query ? `${pathname}?${query}` : pathname); };
  const selectStatus = (next: DesignerWorkStatus | "completed" | undefined) => { if (next === "completed") update({ status: "completed", page: undefined, sort: undefined }); else update({ status: next, page: undefined, sort: undefined, search: undefined, range: undefined, from: undefined, to: undefined }); };
  const updateHistory = (changes: Partial<typeof historyQuery> & Partial<ActivityDateRangeIntent>) => { const mapped: Record<string, string | undefined> = { page: changes.page && changes.page > 1 ? String(changes.page) : undefined, search: changes.search, sort: changes.sort === "oldest" ? "oldest" : changes.sort === "newest" ? undefined : undefined }; if (changes.range !== undefined) { mapped.range = changes.range === "all" ? undefined : changes.range; if (changes.range !== "custom") { mapped.from = undefined; mapped.to = undefined; } } if (changes.from !== undefined) mapped.from = changes.from; if (changes.to !== undefined) mapped.to = changes.to; update(mapped); };
  const actionError = (error: unknown, fallback: string) => error instanceof ApiError && error.status === 409 ? `${error.message} The queue has been refreshed.` : error instanceof Error ? error.message : fallback;
  const doStart = async (item: DesignerWorkItem) => { try { await start.mutateAsync(item.researchItem.id); toast.success("Design work started."); router.push(`/w/${workspaceId}/design/${item.researchItem.id}`); } catch (error) { toast.error(actionError(error, "Unable to start work.")); if (error instanceof ApiError && error.status === 409) void queue.refetch(); } };
  const doCorrection = async (item: DesignerWorkItem) => { try { await correction.mutateAsync(item.researchItem.id); toast.success("Correction work started."); } catch (error) { toast.error(actionError(error, "Unable to start correction.")); if (error instanceof ApiError && error.status === 409) void queue.refetch(); } };
  const doReport = async (values: ReportIssueFormValues) => { if (!issueWork) return; try { await report.mutateAsync({ researchItemId: issueWork.researchItem.id, values }); toast.success("Design issue reported. Waiting for Admin action."); setIssueWork(null); } catch (error) { toast.error(actionError(error, "Unable to report the issue.")); } };
  const completedBadge = getCompletedBadgeLabel(rangeIntent.range);
  return <div className="mx-auto max-w-screen-2xl space-y-5 p-4 sm:p-6 lg:p-8"><header className="flex flex-col gap-3 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-semibold uppercase tracking-widest text-primary">Designer workflow</p><h1 className="mt-1 flex items-center gap-2 text-2xl font-bold tracking-tight sm:text-3xl"><Palette className="size-6 text-primary" />My Work</h1><p className="mt-1 max-w-2xl text-sm text-muted-foreground">Your design assignments and completed history.</p></div>{summary.data ? <CountBadge count={isCompleted ? summary.data.data.completed.filtered : summary.data.data.active.total} label={isCompleted ? completedBadge.label : "active assignment"} pluralLabel={isCompleted ? completedBadge.pluralLabel : "active assignments"} /> : null}</header>{summary.data ? <section aria-label="Design activity summary" className="flex flex-wrap gap-2"><button className="rounded-md border bg-card p-2 text-left text-xs" onClick={() => selectStatus(undefined)} type="button">Active <strong className="ml-1">{summary.data.data.active.total}</strong></button><button className="rounded-md border bg-card p-2 text-left text-xs" onClick={() => selectStatus("DESIGN_REVIEW")} type="button">In Review <strong className="ml-1">{summary.data.data.active.inReview}</strong></button><button className="rounded-md border bg-card p-2 text-left text-xs" onClick={() => selectStatus("CORRECTION_NEEDED")} type="button">Corrections <strong className="ml-1">{summary.data.data.active.correctionsNeeded}</strong></button><button className="rounded-md border bg-card p-2 text-left text-xs" onClick={() => selectStatus("completed")} type="button">Completed <strong className="ml-1">{summary.data.data.completed.allTime}</strong></button></section> : null}{workspace ? <WorkerAssignmentStatusBanner membership={workspace.membership} role="DESIGNER" /> : null}<DesignerWorkFilters onSortChange={(sort) => update({ sort: sort === "fifo" ? undefined : sort, page: undefined })} onStatusChange={selectStatus} sort={activeSort} status={isCompleted ? "completed" : status} />{isCompleted ? <><FilterToolbarLayout hasActiveFilters={Boolean(historyQuery.search || historyQuery.sort === "oldest" || rangeIntent.range !== "all")} onClearFilters={() => updateHistory({ search: "", sort: "newest", range: "all" })} searchSlot={<FilterSearchInput onSearch={(search) => updateHistory({ search: search.trim() })} placeholder="Search completed designs" value={historyQuery.search ?? ""} />}><ActivityDateRangeFilter {...rangeIntent} onChange={updateHistory} /><select aria-label="Sort completed designs" className="h-9 rounded-md border border-input bg-background px-2.5 text-xs" onChange={(event) => updateHistory({ sort: event.target.value as "newest" | "oldest" })} value={historyQuery.sort}><option value="newest">Newest completed</option><option value="oldest">Oldest completed</option></select></FilterToolbarLayout><p className="text-xs text-muted-foreground">Date range applies to completed history; active counts are current.</p><DesignerCompletedList data={history.data?.data} isError={history.isError} isLoading={history.isLoading} onPageChange={(next) => updateHistory({ page: next })} onReset={() => updateHistory({ search: "", sort: "newest", range: "all" })} onRetry={() => void history.refetch()} workspaceId={workspaceId} /></> : <DesignerWorkList availabilityState={workspace ? getAssignmentAvailabilityState(workspace.membership, "DESIGNER") : "AVAILABLE"} data={queue.data?.data} filtersActive={Boolean(status)} isError={queue.isError} isLoading={queue.isLoading || workspaces.isLoading} onOpenWork={(item) => router.push(`/w/${workspaceId}/design/${item.researchItem.id}`)} onPageChange={(next) => update({ page: String(next) })} onReportIssue={setIssueWork} onRetry={() => void queue.refetch()} onStartCorrection={(item) => void doCorrection(item)} onStartWork={(item) => void doStart(item)} startingCorrectionItemId={correction.isPending ? correction.variables : undefined} startingWorkItemId={start.isPending ? start.variables : undefined} workspaceId={workspaceId} />} {!isCompleted ? <ReportIssueDialog isSubmitting={report.isPending} onOpenChange={(open) => !open && setIssueWork(null)} onSubmit={(values) => void doReport(values)} open={issueWork !== null} workTitle={issueWork?.researchItem.title || `Etsy Listing #${issueWork?.researchItem.etsyListingId ?? ""}`} /> : null}</div>;
}
