"use client";

import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/native-select";
import { cn } from "@/lib/utils";
import { DESIGNER_WORK_TABS } from "./designer-work.types";
import type { DesignerWorkStatus } from "./designer-work.types";

type WorkStatus = DesignerWorkStatus | "completed" | undefined;
type Props = { onSortChange: (sort: "fifo" | "newest") => void; onStatusChange: (status: WorkStatus) => void; sort: "fifo" | "newest"; status: WorkStatus };

export function DesignerWorkFilters({ onSortChange, onStatusChange, sort, status }: Props) {
  const tabs = [...DESIGNER_WORK_TABS, { label: "Completed", status: "completed" as const }];
  return <section className="rounded-xl border border-border bg-card p-3 shadow-xs sm:p-4"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0 flex-1"><div aria-label="Filter design work by status" className="-mx-1 flex items-center gap-1.5 overflow-x-auto px-1 pb-1 scrollbar-none" role="tablist">{tabs.map((tab) => <Button aria-selected={tab.status === status} className={cn("shrink-0", tab.status === status && "font-semibold shadow-xs")} key={tab.label} onClick={() => onStatusChange(tab.status)} role="tab" size="sm" type="button" variant={tab.status === status ? "secondary" : "ghost"}>{tab.label}</Button>)}</div></div>{status !== "completed" ? <div className="shrink-0 sm:text-right"><NativeSelect aria-label="Sort assigned design work" className="h-9 w-full rounded-md border border-input bg-background pl-2.5 pr-8 text-xs sm:w-auto" wrapperClassName="w-full sm:w-auto" onChange={(event) => onSortChange(event.target.value as "fifo" | "newest")} value={sort}><option value="fifo">Oldest assigned first</option><option value="newest">Newest assigned first</option></NativeSelect></div> : null}</div></section>;
}
