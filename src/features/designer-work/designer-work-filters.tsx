"use client";

import { NativeSelect } from "@/components/native-select";
import { Button } from "@/components/ui/button";
import { formatCompactCount } from "@/lib/format-compact-count";
import { cn } from "@/lib/utils";
import { DESIGNER_WORK_TABS } from "./designer-work.types";
import type { DesignerWorkStatus } from "./designer-work.types";

type WorkStatus = DesignerWorkStatus | "completed";
type Props = { counts: Record<WorkStatus, number>; onSortChange: (sort: "fifo" | "newest") => void; onStatusChange: (status: WorkStatus) => void; sort: "fifo" | "newest"; status: WorkStatus };
const countChipClass = "inline-flex h-[18px] min-w-[18px] shrink-0 items-center justify-center rounded-full border border-amber-500/30 bg-amber-500/15 px-1.5 font-mono text-[10px] font-semibold leading-none tabular-nums";

export function DesignerWorkFilters({ counts, onSortChange, onStatusChange, sort, status }: Props) {
  const tabs = [...DESIGNER_WORK_TABS, { label: "Completed", status: "completed" as const }];
  return <section className="rounded-xl border border-border bg-card p-3 shadow-xs sm:p-4"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0 flex-1"><div aria-label="Filter design work by status" className="-mx-1 flex items-center gap-1.5 overflow-x-auto px-1 pb-1 scrollbar-none" role="tablist">{tabs.map((tab) => { const count = counts[tab.status]; return <Button aria-selected={tab.status === status} className={cn("shrink-0 gap-1.5", tab.status === status && "font-semibold shadow-xs")} key={tab.label} onClick={() => onStatusChange(tab.status)} role="tab" size="sm" type="button" variant={tab.status === status ? "secondary" : "ghost"}>{tab.label}<span className={countChipClass} title={`${count.toLocaleString()} items`}><span aria-hidden="true">{formatCompactCount(count)}</span><span className="sr-only"> ({count.toLocaleString()} items)</span></span></Button>; })}</div></div>{status !== "completed" ? <div className="shrink-0 sm:text-right"><NativeSelect aria-label="Sort assigned design work" className="h-9 w-full rounded-md border border-input bg-background pl-2.5 pr-8 text-xs sm:w-auto" wrapperClassName="w-full sm:w-auto" onChange={(event) => onSortChange(event.target.value as "fifo" | "newest")} value={sort}><option value="fifo">Oldest assigned first</option><option value="newest">Newest assigned first</option></NativeSelect></div> : null}</div></section>;
}
