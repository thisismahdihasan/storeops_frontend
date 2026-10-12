"use client";

import { Button } from "@/components/ui/button";
import { LISTING_TABS } from "./listing.types";
import type { ListingStatus } from "./listing.types";

type Status = ListingStatus | "completed";
type Props = { onSortChange: (sort: "fifo" | "newest") => void; onStatusChange: (status: Status) => void; sort: "fifo" | "newest"; status: Status };

export function ListingFilters({ onSortChange, onStatusChange, sort, status }: Props) {
  const tabs = [...LISTING_TABS, { label: "Completed", status: "completed" as const }];
  return <section className="space-y-3 rounded-xl border border-border bg-card p-3 shadow-xs sm:p-4"><div aria-label="Filter listing work by status" className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1" role="tablist">{tabs.map((tab) => <Button aria-selected={tab.status === status} className="shrink-0" key={tab.status} onClick={() => onStatusChange(tab.status)} role="tab" size="sm" type="button" variant={tab.status === status ? "secondary" : "ghost"}>{tab.label}</Button>)}</div>{status !== "completed" ? <select aria-label="Sort listings" className="h-9 rounded-md border border-input bg-background px-2.5 text-xs" onChange={(event) => onSortChange(event.target.value as "fifo" | "newest")} value={sort}><option value="fifo">Oldest assigned first</option><option value="newest">Newest assigned first</option></select> : null}</section>;
}
