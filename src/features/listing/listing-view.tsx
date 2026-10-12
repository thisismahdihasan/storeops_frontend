"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Tag } from "lucide-react";
import { ApiError } from "@/lib/api";
import { CountBadge } from "@/components/ui/count-badge";
import { NativeSelect } from "@/components/native-select";
import { FilterToolbarLayout } from "@/components/filter-toolbar-layout";
import { FilterSearchInput } from "@/components/filter-search-input";
import { useWorkspaces } from "@/features/workspace/use-workspaces";
import { getAssignmentAvailabilityState } from "@/features/workspace/workspace-assignment-availability";
import { WorkerAssignmentStatusBanner } from "@/features/workspace/worker-assignment-status-banner";
import { ActivityDateRangeFilter } from "@/features/role-activity/activity-date-range-filter";
import { resolveActivityDateRange, type ActivityDateRangeIntent } from "@/features/role-activity/role-activity-date.utils";
import { useListerHistory, useListerSummary } from "@/features/role-activity/use-role-activity";
import { ListingAccessState } from "./listing-access-state";
import { ListingCompletedList } from "./listing-completed-list";
import { ListingFilters } from "./listing-filters";
import { ListingList } from "./listing-list";
import { useListingQueue } from "./use-listing";

const dateIntent = (params: URLSearchParams): ActivityDateRangeIntent => ({ range: (["today", "7d", "30d", "custom"].includes(params.get("range") ?? "") ? params.get("range") : "all") as ActivityDateRangeIntent["range"], from: params.get("from") ?? undefined, to: params.get("to") ?? undefined });

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

export function ListingView({ workspaceId }: { workspaceId: string }) {
  const pathname = usePathname(); const router = useRouter(); const params = useSearchParams(); const isCompleted = params.get("status") === "completed";
  const activeStatus = params.get("status") === "LISTING_IN_PROGRESS" ? "LISTING_IN_PROGRESS" as const : "READY_FOR_LISTING" as const; const page = Math.max(1, Number(params.get("page")) || 1); const activeSort = params.get("sort") === "newest" ? "newest" as const : "fifo" as const;
  const intent = dateIntent(params); const range = resolveActivityDateRange(intent); const historyQuery = { page, limit: 20, search: params.get("search")?.trim() || undefined, sort: params.get("sort") === "oldest" ? "oldest" as const : "newest" as const, dateFrom: range.dateFrom, dateTo: range.dateTo };
  const workspaces = useWorkspaces(); const workspace = workspaces.data?.data.workspaces.find((item) => item.id === workspaceId); const hasRole = workspace?.membership.roles.includes("LISTER") ?? false;
  const queue = useListingQueue(workspaceId, { limit: 20, page, status: activeStatus, sort: activeSort }, hasRole && !isCompleted); const summary = useListerSummary(workspaceId, { dateFrom: range.dateFrom, dateTo: range.dateTo }, hasRole && range.isValid); const history = useListerHistory(workspaceId, historyQuery, hasRole && isCompleted && range.isValid);
  const update = (changes: Record<string, string | undefined>) => { const next = new URLSearchParams(params.toString()); Object.entries(changes).forEach(([key, value]) => value ? next.set(key, value) : next.delete(key)); const query = next.toString(); router.push(query ? `${pathname}?${query}` : pathname); };
  const select = (status: "READY_FOR_LISTING" | "LISTING_IN_PROGRESS" | "completed") => status === "completed" ? update({ status, page: undefined, sort: undefined }) : update({ status: status === "READY_FOR_LISTING" ? undefined : status, page: undefined, sort: undefined, search: undefined, range: undefined, from: undefined, to: undefined });
  const updateHistory = (changes: Partial<typeof historyQuery> & Partial<ActivityDateRangeIntent>) => { const mapped: Record<string, string | undefined> = { page: changes.page && changes.page > 1 ? String(changes.page) : undefined }; if (changes.search !== undefined) mapped.search = changes.search; if (changes.sort !== undefined) mapped.sort = changes.sort === "oldest" ? "oldest" : undefined; if (changes.range !== undefined) { mapped.range = changes.range === "all" ? undefined : changes.range; if (changes.range !== "custom") { mapped.from = undefined; mapped.to = undefined; } } if (changes.from !== undefined) mapped.from = changes.from; if (changes.to !== undefined) mapped.to = changes.to; update(mapped); };
  if (workspaces.data && !hasRole) return <ListingAccessState workspaceId={workspaceId} />; if (queue.error instanceof ApiError && queue.error.status === 403) return <ListingAccessState description="Only a Lister with access to this workspace can open the listing queue." title="You cannot access this listing queue" workspaceId={workspaceId} />;
  const completedBadge = getCompletedBadgeLabel(intent.range);
  return <main className="mx-auto max-w-screen-2xl space-y-5 p-4 sm:p-6 lg:p-8"><header className="flex flex-col gap-3 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-semibold uppercase tracking-widest text-primary">Lister workflow</p><h1 className="mt-1 flex items-center gap-2 text-2xl font-bold tracking-tight sm:text-3xl"><Tag className="size-6 text-primary" />Listing</h1><p className="mt-1 max-w-2xl text-sm text-muted-foreground">Your listing assignments and completed history.</p></div>{summary.data ? <CountBadge count={isCompleted ? summary.data.data.completed.filtered : summary.data.data.active.total} label={isCompleted ? completedBadge.label : "active listing"} pluralLabel={isCompleted ? completedBadge.pluralLabel : "active listings"} /> : null}</header>{workspace ? <WorkerAssignmentStatusBanner membership={workspace.membership} role="LISTER" /> : null}<ListingFilters counts={{ READY_FOR_LISTING: summary.data?.data.active.assigned ?? 0, LISTING_IN_PROGRESS: summary.data?.data.active.inProgress ?? 0, completed: summary.data?.data.completed.allTime ?? 0 }} onSortChange={(sort) => update({ sort: sort === "fifo" ? undefined : sort, page: undefined })} onStatusChange={select} sort={activeSort} status={isCompleted ? "completed" : activeStatus} />{isCompleted ? <><FilterToolbarLayout hasActiveFilters={Boolean(historyQuery.search || historyQuery.sort === "oldest" || intent.range !== "all")} onClearFilters={() => updateHistory({ search: "", sort: "newest", range: "all" })} searchSlot={<FilterSearchInput onSearch={(search) => updateHistory({ search: search.trim() })} placeholder="Search completed listings" value={historyQuery.search ?? ""} />}><ActivityDateRangeFilter {...intent} onChange={updateHistory} /><NativeSelect aria-label="Sort completed listings" className="h-9 rounded-md border border-input bg-background pl-2.5 pr-8 text-xs" onChange={(event) => updateHistory({ sort: event.target.value as "newest" | "oldest" })} value={historyQuery.sort}><option value="newest">Newest listed</option><option value="oldest">Oldest listed</option></NativeSelect></FilterToolbarLayout><p className="text-xs text-muted-foreground">Date range applies to completed history; active counts are current.</p><ListingCompletedList data={history.data?.data} isError={history.isError} isLoading={history.isLoading} onPageChange={(next) => updateHistory({ page: next })} onReset={() => updateHistory({ search: "", sort: "newest", range: "all" })} onRetry={() => void history.refetch()} workspaceId={workspaceId} /></> : <ListingList availabilityState={workspace ? getAssignmentAvailabilityState(workspace.membership, "LISTER") : "AVAILABLE"} data={queue.data?.data} hasSearch={false} isError={queue.isError || workspaces.isError} isLoading={queue.isLoading || workspaces.isLoading} onPageChange={(next) => update({ page: String(next) })} onRetry={() => { void workspaces.refetch(); void queue.refetch(); }} status={activeStatus} workspaceId={workspaceId} />}</main>;
}
