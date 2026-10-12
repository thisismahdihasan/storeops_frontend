"use client";

import { useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Tag } from "lucide-react";

import { useWorkspaces } from "@/features/workspace/use-workspaces";
import { ApiError } from "@/lib/api";

import { getAssignmentAvailabilityState } from "@/features/workspace/workspace-assignment-availability";
import { WorkerAssignmentStatusBanner } from "@/features/workspace/worker-assignment-status-banner";
import { CountBadge } from "@/components/ui/count-badge";
import { FilterToolbarLayout } from "@/components/filter-toolbar-layout";
import { FilterSearchInput } from "@/components/filter-search-input";
import { ActivityDateRangeFilter } from "@/features/role-activity/activity-date-range-filter";
import { resolveActivityDateRange, type ActivityDateRangeIntent } from "@/features/role-activity/role-activity-date.utils";
import { useListerHistory, useListerSummary } from "@/features/role-activity/use-role-activity";
import { ListingAccessState } from "./listing-access-state";
import { ListingFilters } from "./listing-filters";
import { ListingList } from "./listing-list";
import { ListingCompletedList } from "./listing-completed-list";
import { listingFiltersSchema } from "./listing.schemas";
import type { ListingFilters as ListingFiltersValue } from "./listing.types";
import { useListingQueue } from "./use-listing";

type SearchParamsReader = Pick<URLSearchParams, "get">;

function parseListingFilters(searchParams: SearchParamsReader): ListingFiltersValue {
  const page = Number(searchParams.get("page"));
  const parsed = listingFiltersSchema.safeParse({
    limit: 20,
    page: Number.isInteger(page) && page > 0 ? page : 1,
    search: searchParams.get("search")?.trim() || undefined,
    sort: searchParams.get("sort") || undefined,
    status: searchParams.get("status") || "READY_FOR_LISTING",
  });

  return parsed.success
    ? parsed.data
    : { limit: 20, page: 1, sort: "fifo", status: "READY_FOR_LISTING" };
}

type ListingViewProps = { workspaceId: string };

export function ListingView({ workspaceId }: ListingViewProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const filters = parseListingFilters(searchParams);
  const view = searchParams.get("view") === "completed" ? "completed" : "active";
  const activityIntent: ActivityDateRangeIntent = { range: (["today", "7d", "30d", "custom"].includes(searchParams.get("range") ?? "") ? searchParams.get("range") : "all") as ActivityDateRangeIntent["range"], from: searchParams.get("from") ?? undefined, to: searchParams.get("to") ?? undefined };
  const resolvedRange = resolveActivityDateRange(activityIntent);
  const historyQuery = { page: filters.page, limit: 20, search: filters.search, sort: (searchParams.get("sort") === "oldest" ? "oldest" : "newest") as "newest" | "oldest", dateFrom: resolvedRange.dateFrom, dateTo: resolvedRange.dateTo };
  const workspacesQuery = useWorkspaces();
  const workspace = workspacesQuery.data?.data.workspaces.find(
    (item) => item.id === workspaceId,
  );
  const hasListerRole = workspace?.membership.roles.includes("LISTER") ?? false;
  const queueQuery = useListingQueue(workspaceId, filters, hasListerRole && view === "active");
  const summaryQuery = useListerSummary(workspaceId, { dateFrom: resolvedRange.dateFrom, dateTo: resolvedRange.dateTo }, hasListerRole && resolvedRange.isValid);
  const completedQuery = useListerHistory(workspaceId, historyQuery, hasListerRole && view === "completed" && resolvedRange.isValid);

  const updateFilters = useCallback(
    (changes: Partial<ListingFiltersValue>) => {
      const next = { ...filters, ...changes };
      const params = new URLSearchParams(searchParams.toString());
      if (next.status !== "READY_FOR_LISTING") {
        params.set("status", next.status);
      } else {
        params.delete("status");
      }
      if (next.search) params.set("search", next.search);
      else params.delete("search");
      if (next.sort !== "fifo") params.set("sort", next.sort);
      else params.delete("sort");
      if (next.page > 1) params.set("page", next.page.toString());
      else params.delete("page");
      const query = params.toString();
      router.push(query ? `${pathname}?${query}` : pathname);
    },
    [filters, pathname, router, searchParams],
  );
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
    const page = changes.page ?? 1;
    if (page > 1) params.set("page", String(page)); else params.delete("page");
    const query = params.toString(); router.push(query ? `${pathname}?${query}` : pathname);
  };

  if (
    workspacesQuery.data &&
    !hasListerRole
  ) {
    return <ListingAccessState workspaceId={workspaceId} />;
  }

  if (queueQuery.error instanceof ApiError && queueQuery.error.status === 403) {
    return (
      <ListingAccessState
        description="Only a Lister with access to this workspace can open the listing queue."
        title="You cannot access this listing queue"
        workspaceId={workspaceId}
      />
    );
  }

  return (
    <main className="mx-auto max-w-screen-2xl space-y-5 p-4 sm:p-6 lg:p-8">
      <header className="flex flex-col gap-3 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">
            Lister workflow
          </p>
          <h1 className="mt-1 flex items-center gap-2 text-2xl font-bold tracking-tight sm:text-3xl">
            <Tag className="size-6 text-primary" /> Listing
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Inspect approved work, download production files, and publish your assigned listings.
          </p>
        </div>
        {view === "active" && queueQuery.data ? (
          <CountBadge
            count={queueQuery.data.data.pagination.total}
            label="listing"
          />
        ) : null}
      </header>
      <div aria-label="Listing view" className="flex flex-wrap gap-2" role="group"><button aria-pressed={view === "active"} className={`rounded-md px-3 py-1.5 text-sm ${view === "active" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`} onClick={() => updateCompleted({ view: "active" })} type="button">Active</button><button aria-pressed={view === "completed"} className={`rounded-md px-3 py-1.5 text-sm ${view === "completed" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`} onClick={() => updateCompleted({ view: "completed" })} type="button">Completed</button></div>
      {summaryQuery.data && <section aria-label="Listing activity summary" className="flex flex-wrap gap-2"><button className="rounded-md border bg-card p-2 text-left text-xs" onClick={() => updateCompleted({ view: "active" })} type="button">Active <strong className="ml-1">{summaryQuery.data.data.active.total}</strong></button><span className="rounded-md border bg-card p-2 text-xs">In Progress <strong className="ml-1">{summaryQuery.data.data.active.inProgress}</strong></span><button className="rounded-md border bg-card p-2 text-left text-xs" onClick={() => updateCompleted({ view: "completed" })} type="button">Completed <strong className="ml-1">{summaryQuery.data.data.completed.filtered}</strong></button><span className="rounded-md border bg-card p-2 text-xs">All-time completed <strong className="ml-1">{summaryQuery.data.data.completed.allTime}</strong></span></section>}

      {workspace ? (
        <WorkerAssignmentStatusBanner
          membership={workspace.membership}
          role="LISTER"
        />
      ) : null}

      {view === "active" ? <><ListingFilters
        filters={filters}
        key={filters.search ?? ""}
        onChange={updateFilters}
      />
      <ListingList
        availabilityState={
          workspace
            ? getAssignmentAvailabilityState(workspace.membership, "LISTER")
            : "AVAILABLE"
        }
        data={queueQuery.data?.data}
        hasSearch={Boolean(filters.search)}
        isError={queueQuery.isError || workspacesQuery.isError}
        isLoading={queueQuery.isLoading || workspacesQuery.isLoading}
        onPageChange={(page) => updateFilters({ page })}
        onRetry={() => {
          void workspacesQuery.refetch();
          void queueQuery.refetch();
        }}
        status={filters.status}
        workspaceId={workspaceId}
      /></> : <><FilterToolbarLayout hasActiveFilters={Boolean(historyQuery.search || historyQuery.sort === "oldest" || activityIntent.range !== "all")} onClearFilters={() => updateCompleted({ search: "", sort: "newest", range: "all" })} searchSlot={<FilterSearchInput onSearch={(search) => updateCompleted({ search: search.trim() })} placeholder="Search completed listings" value={historyQuery.search ?? ""} />}><ActivityDateRangeFilter {...activityIntent} onChange={(next) => updateCompleted(next)} /><select aria-label="Sort completed listings" className="h-9 rounded-md border border-input bg-background px-2.5 text-xs" onChange={(event) => updateCompleted({ sort: event.target.value as "newest" | "oldest" })} value={historyQuery.sort}><option value="newest">Newest listed</option><option value="oldest">Oldest listed</option></select></FilterToolbarLayout><p className="text-xs text-muted-foreground">Date range applies to completed history; active counts are current.</p><ListingCompletedList data={completedQuery.data?.data} isError={completedQuery.isError} isLoading={completedQuery.isLoading} onPageChange={(page) => updateCompleted({ page })} onReset={() => updateCompleted({ search: "", sort: "newest", range: "all" })} onRetry={() => void completedQuery.refetch()} /></>}
    </main>
  );
}
