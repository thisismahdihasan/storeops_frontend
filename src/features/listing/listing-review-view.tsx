"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Tag } from "lucide-react";
import { CountBadge } from "@/components/ui/count-badge";
import { ApiError } from "@/lib/api";
import { FilterSearchInput } from "@/components/filter-search-input";
import { FilterToolbarLayout } from "@/components/filter-toolbar-layout";
import { NativeSelect } from "@/components/native-select";
import { ActivityDateRangeFilter } from "@/features/role-activity/activity-date-range-filter";
import { resolveActivityDateRange, type ActivityDateRangeIntent } from "@/features/role-activity/role-activity-date.utils";
import type { CopyrightReviewer } from "@/features/role-activity/role-activity.types";
import { useListerHistory, useListerSummary, useListingReviewProgress } from "@/features/role-activity/use-role-activity";
import { useWorkspaces } from "@/features/workspace/use-workspaces";
import { ListingAccessState } from "./listing-access-state";
import { ListingFilters, type ListingTab } from "./listing-filters";
import { ListingReviewList } from "./listing-review-list";

const reviewers: CopyrightReviewer[] = ["ZAYED", "IFAD", "MAHDI"];
const name: Record<CopyrightReviewer, string> = { ZAYED: "Zayed", IFAD: "Ifad", MAHDI: "Mahdi" };

export function ListingReviewView({ workspaceId }: { workspaceId: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const params = useSearchParams();
  const rawStatus = params.get("status");
  const status: ListingTab = rawStatus === "flagged_ZAYED" || rawStatus === "flagged_IFAD" || rawStatus === "flagged_MAHDI" ? rawStatus : "completed";
  const flaggedBy = reviewers.find((reviewer) => status === `flagged_${reviewer}`);
  const assignedReviewer = reviewers.find((reviewer) => reviewer === params.get("reviewer"));
  const intent: ActivityDateRangeIntent = {
    range: (["today", "7d", "30d", "custom"].includes(params.get("range") ?? "") ? params.get("range") : "all") as ActivityDateRangeIntent["range"],
    from: params.get("from") ?? undefined,
    to: params.get("to") ?? undefined,
  };
  const range = resolveActivityDateRange(intent);
  const page = Math.max(1, Number(params.get("page")) || 1);
  const query = {
    page, limit: 20, search: params.get("search")?.trim() || undefined,
    sort: params.get("sort") === "oldest" ? "oldest" as const : "newest" as const,
    dateFrom: range.dateFrom, dateTo: range.dateTo, assignedReviewer, flaggedBy,
  };
  const workspaces = useWorkspaces();
  const workspace = workspaces.data?.data.workspaces.find((item) => item.id === workspaceId);
  const hasRole = workspace?.membership.roles.includes("LISTER") ?? false;
  const history = useListerHistory(workspaceId, query, hasRole && range.isValid);
  const summary = useListerSummary(workspaceId, { dateFrom: range.dateFrom, dateTo: range.dateTo }, hasRole && range.isValid);
  const progress = useListingReviewProgress(workspaceId, hasRole);

  const update = (changes: Record<string, string | undefined>) => {
    const next = new URLSearchParams(params.toString());
    Object.entries(changes).forEach(([key, value]) => value ? next.set(key, value) : next.delete(key));
    const suffix = next.toString();
    router.push(suffix ? `${pathname}?${suffix}` : pathname);
  };
  const select = (next: ListingTab) => update({ status: next === "READY_FOR_LISTING" ? undefined : next, page: undefined, sort: undefined, ...(next === "READY_FOR_LISTING" || next === "LISTING_IN_PROGRESS" ? { reviewer: undefined, search: undefined, range: undefined, from: undefined, to: undefined } : {}) });
  const updateHistory = (changes: { page?: number; search?: string; sort?: "newest" | "oldest"; range?: ActivityDateRangeIntent["range"]; from?: string; to?: string }) => {
    const mapped: Record<string, string | undefined> = { page: changes.page && changes.page > 1 ? String(changes.page) : undefined };
    if (changes.search !== undefined) mapped.search = changes.search;
    if (changes.sort !== undefined) mapped.sort = changes.sort === "oldest" ? "oldest" : undefined;
    if (changes.range !== undefined) {
      mapped.range = changes.range === "all" ? undefined : changes.range;
      if (changes.range !== "custom") { mapped.from = undefined; mapped.to = undefined; }
    }
    if (changes.from !== undefined) mapped.from = changes.from;
    if (changes.to !== undefined) mapped.to = changes.to;
    update(mapped);
  };
  const counts = {
    READY_FOR_LISTING: summary.data?.data.active.assigned ?? 0,
    LISTING_IN_PROGRESS: summary.data?.data.active.inProgress ?? 0,
    completed: summary.data?.data.completed.allTime ?? 0,
    flagged_ZAYED: progress.data?.data.flagged.ZAYED ?? 0,
    flagged_IFAD: progress.data?.data.flagged.IFAD ?? 0,
    flagged_MAHDI: progress.data?.data.flagged.MAHDI ?? 0,
  };
  const selectedProgress = progress.data?.data.progress[assignedReviewer ?? "all"];
  if (workspaces.data && !hasRole) return <ListingAccessState workspaceId={workspaceId} />;
  if (history.error instanceof ApiError && history.error.status === 403) return <ListingAccessState workspaceId={workspaceId} />;
  return <main className="mx-auto max-w-screen-2xl space-y-5 p-4 sm:p-6 lg:p-8">
    <header className="flex flex-col gap-3 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-semibold uppercase tracking-widest text-primary">Lister workflow</p><h1 className="mt-1 flex items-center gap-2 text-2xl font-bold tracking-tight sm:text-3xl"><Tag className="size-6 text-primary" />Listing</h1><p className="mt-1 text-sm text-muted-foreground">Completed listing history and copyright review.</p></div>{history.data ? <CountBadge count={history.data.data.pagination.total} label="listing" pluralLabel="listings" /> : null}</header>
    <ListingFilters counts={counts} onSortChange={() => {}} onStatusChange={select} sort="fifo" status={status} />
    <section className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-3 sm:p-4" aria-label="Copyright review progress">
      <div className="flex flex-wrap items-center gap-3"><label className="text-xs font-medium" htmlFor="reviewer-group">Assigned reviewer</label><NativeSelect id="reviewer-group" aria-label="Assigned reviewer" className="h-9 rounded-md border border-input bg-background px-2 text-xs" value={assignedReviewer ?? "all"} onChange={(event) => update({ reviewer: event.target.value === "all" ? undefined : event.target.value, page: undefined })}><option value="all">All Listings</option>{reviewers.map((reviewer) => <option key={reviewer} value={reviewer}>{name[reviewer]}&apos;s Listings</option>)}</NativeSelect></div>
      <span className="rounded-md border border-border bg-background px-2.5 py-1.5 text-xs font-medium tabular-nums text-foreground" role="status">Checked {selectedProgress?.checked ?? "–"}</span>
    </section>
    <FilterToolbarLayout hasActiveFilters={Boolean(query.search || query.sort === "oldest" || intent.range !== "all")} onClearFilters={() => updateHistory({ search: "", sort: "newest", range: "all" })} searchSlot={<FilterSearchInput onSearch={(search) => updateHistory({ search: search.trim() })} placeholder="Search completed listings" value={query.search ?? ""} />}><ActivityDateRangeFilter {...intent} onChange={updateHistory} /><NativeSelect aria-label="Sort completed listings" className="h-9 rounded-md border border-input bg-background pl-2.5 pr-8 text-xs" onChange={(event) => updateHistory({ sort: event.target.value as "newest" | "oldest" })} value={query.sort}><option value="newest">Newest listed</option><option value="oldest">Oldest listed</option></NativeSelect></FilterToolbarLayout>
    <p className="text-xs text-muted-foreground">Date range applies to completed history; progress covers all completed listings.</p>
    <ListingReviewList assignedReviewer={assignedReviewer} isFlaggedTab={Boolean(flaggedBy)} data={history.data?.data} isError={history.isError} isLoading={history.isLoading} onPageChange={(next) => updateHistory({ page: next })} onReset={() => updateHistory({ search: "", sort: "newest", range: "all" })} onRetry={() => void history.refetch()} workspaceId={workspaceId} />
  </main>;
}
