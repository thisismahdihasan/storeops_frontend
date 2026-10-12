"use client";

import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/native-select";
import { LISTING_TABS } from "./listing.types";
import type { ListingStatus } from "./listing.types";

type Status = ListingStatus | "completed";
type Props = { onSortChange: (sort: "fifo" | "newest") => void; onStatusChange: (status: Status) => void; sort: "fifo" | "newest"; status: Status };

export function ListingFilters({ onSortChange, onStatusChange, sort, status }: Props) {
  const tabs = [...LISTING_TABS, { label: "Completed", status: "completed" as const }];
  return <section className="rounded-xl border border-border bg-card p-3 shadow-xs sm:p-4"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0 flex-1"><div aria-label="Filter listing work by status" className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1" role="tablist">{tabs.map((tab) => <Button aria-selected={tab.status === status} className="shrink-0" key={tab.status} onClick={() => onStatusChange(tab.status)} role="tab" size="sm" type="button" variant={tab.status === status ? "secondary" : "ghost"}>{tab.label}</Button>)}</div></div>{status !== "completed" ? <div className="shrink-0 sm:text-right"><NativeSelect aria-label="Sort listings" className="h-9 w-full rounded-md border border-input bg-background pl-2.5 pr-8 text-xs sm:w-auto" wrapperClassName="w-full sm:w-auto" onChange={(event) => onSortChange(event.target.value as "fifo" | "newest")} value={sort}><option value="fifo">Oldest assigned first</option><option value="newest">Newest assigned first</option></NativeSelect></div> : null}</div></section>;
}
