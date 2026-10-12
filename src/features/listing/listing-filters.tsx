"use client";

import { NativeSelect } from "@/components/native-select";
import { Button } from "@/components/ui/button";
import { formatCompactCount } from "@/lib/format-compact-count";
import { LISTING_TABS } from "./listing.types";
import type { ListingStatus } from "./listing.types";

type Status = ListingStatus | "completed";
type Props = { counts: Record<Status, number>; onSortChange: (sort: "fifo" | "newest") => void; onStatusChange: (status: Status) => void; sort: "fifo" | "newest"; status: Status };
const countChipClass = "inline-flex h-[18px] min-w-[18px] shrink-0 items-center justify-center rounded-full border border-amber-500/30 bg-amber-500/15 px-1.5 font-mono text-[10px] font-semibold leading-none tabular-nums";

export function ListingFilters({ counts, onSortChange, onStatusChange, sort, status }: Props) {
  const tabs = [...LISTING_TABS, { label: "Completed", status: "completed" as const }];
  return <section className="rounded-xl border border-border bg-card p-3 shadow-xs sm:p-4"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0 flex-1"><div aria-label="Filter listing work by status" className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1" role="tablist">{tabs.map((tab) => { const count = counts[tab.status]; return <Button aria-selected={tab.status === status} className="shrink-0 gap-1.5" key={tab.status} onClick={() => onStatusChange(tab.status)} role="tab" size="sm" type="button" variant={tab.status === status ? "secondary" : "ghost"}>{tab.label}<span className={countChipClass} title={`${count.toLocaleString()} items`}><span aria-hidden="true">{formatCompactCount(count)}</span><span className="sr-only"> ({count.toLocaleString()} items)</span></span></Button>; })}</div></div>{status !== "completed" ? <div className="shrink-0 sm:text-right"><NativeSelect aria-label="Sort listings" className="h-9 w-full rounded-md border border-input bg-background pl-2.5 pr-8 text-xs sm:w-auto" wrapperClassName="w-full sm:w-auto" onChange={(event) => onSortChange(event.target.value as "fifo" | "newest")} value={sort}><option value="fifo">Oldest assigned first</option><option value="newest">Newest assigned first</option></NativeSelect></div> : null}</div></section>;
}
