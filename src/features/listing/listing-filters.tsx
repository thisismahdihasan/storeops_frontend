"use client";

import { useParams, useSearchParams } from "next/navigation";
import { NativeSelect } from "@/components/native-select";
import { Button } from "@/components/ui/button";
import { formatCompactCount } from "@/lib/format-compact-count";
import { LISTING_TABS } from "./listing.types";
import type { ListingStatus } from "./listing.types";
import { useListingReviewProgress } from "@/features/role-activity/use-role-activity";

export type ListingTab = ListingStatus | "completed" | "flagged_ZAYED" | "flagged_IFAD" | "flagged_MAHDI";
type Props = { counts: Partial<Record<ListingTab, number>>; onSortChange: (sort: "fifo" | "newest") => void; onStatusChange: (status: ListingTab) => void; sort: "fifo" | "newest"; status: ListingTab };
const countChipClass = "inline-flex h-[18px] min-w-[18px] shrink-0 items-center justify-center rounded-full border border-amber-500/30 bg-amber-500/15 px-1.5 font-mono text-[10px] font-semibold leading-none tabular-nums";

export function ListingFilters({ counts, onSortChange, onStatusChange, sort, status }: Props) {
  const params = useParams<{ workspaceId: string }>();
  const searchParams = useSearchParams();
  const progress = useListingReviewProgress(params.workspaceId);
  const reviewerParam = searchParams.get("reviewer");
  const group = reviewerParam === "ZAYED" || reviewerParam === "IFAD" || reviewerParam === "MAHDI" ? reviewerParam : "all";
  const flaggedCounts = progress.data?.data.flaggedByGroup[group];
  const displayCounts = { ...counts, flagged_ZAYED: flaggedCounts?.ZAYED ?? 0, flagged_IFAD: flaggedCounts?.IFAD ?? 0, flagged_MAHDI: flaggedCounts?.MAHDI ?? 0 };
  const tabs = [...LISTING_TABS, { label: "Completed", status: "completed" as const }, { label: "Need Change by Zayed", status: "flagged_ZAYED" as const }, { label: "Need Change by Ifad", status: "flagged_IFAD" as const }, { label: "Need Change by Mahdi", status: "flagged_MAHDI" as const }];
  return <section className="rounded-xl border border-border bg-card p-3 shadow-xs sm:p-4"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0 flex-1"><div aria-label="Filter listing work by status" className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1" role="tablist">{tabs.map((tab) => { const count = displayCounts[tab.status] ?? 0; return <Button aria-selected={tab.status === status} className="shrink-0 gap-1.5" key={tab.status} onClick={() => onStatusChange(tab.status)} role="tab" size="sm" type="button" variant={tab.status === status ? "secondary" : "ghost"}>{tab.label}<span className={countChipClass} title={`${count.toLocaleString()} items`}><span aria-hidden="true">{formatCompactCount(count)}</span><span className="sr-only"> ({count.toLocaleString()} items)</span></span></Button>; })}</div></div>{status === "READY_FOR_LISTING" || status === "LISTING_IN_PROGRESS" ? <div className="shrink-0 sm:text-right"><NativeSelect aria-label="Sort listings" className="h-9 w-full rounded-md border border-input bg-background pl-2.5 pr-8 text-xs sm:w-auto" wrapperClassName="w-full sm:w-auto" onChange={(event) => onSortChange(event.target.value as "fifo" | "newest")} value={sort}><option value="fifo">Oldest assigned first</option><option value="newest">Newest assigned first</option></NativeSelect></div> : null}</div></section>;
}
