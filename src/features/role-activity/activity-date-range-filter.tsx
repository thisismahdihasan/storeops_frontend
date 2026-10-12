"use client";

import { Popover } from "@base-ui/react/popover";
import { CalendarDays, Check, ChevronDown } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { formatActivityRangeLabel, type ActivityDateRangeIntent, type ActivityRange } from "./role-activity-date.utils";

type ActivityDateRangeFilterProps = ActivityDateRangeIntent & {
  onChange: (next: ActivityDateRangeIntent) => void;
};

const presets: Array<{ label: string; value: ActivityRange }> = [
  { label: "All time", value: "all" }, { label: "Today", value: "today" },
  { label: "Last 7 days", value: "7d" }, { label: "Last 30 days", value: "30d" },
];

export function ActivityDateRangeFilter({ range, from, to, onChange }: ActivityDateRangeFilterProps) {
  const [open, setOpen] = useState(false);
  const [draftFrom, setDraftFrom] = useState(from ?? "");
  const [draftTo, setDraftTo] = useState(to ?? "");
  const [showCustom, setShowCustom] = useState(range === "custom");
  const customValid = Boolean(draftFrom && draftTo && draftFrom <= draftTo);
  const selectPreset = (value: ActivityRange) => {
    if (value === "custom") return;
    setShowCustom(false);
    onChange({ range: value });
    setOpen(false);
  };
  const openCustom = () => {
    setDraftFrom(from ?? "");
    setDraftTo(to ?? "");
    setShowCustom(true);
  };
  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger aria-label={`Activity range: ${formatActivityRangeLabel({ range, from, to })}`} className="inline-flex h-9 max-w-full items-center gap-1.5 rounded-md border border-input bg-background px-2.5 text-xs text-foreground transition-colors hover:bg-muted/50 focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring">
        <CalendarDays aria-hidden="true" className="size-3.5 text-muted-foreground" />
        <span className="truncate">{formatActivityRangeLabel({ range, from, to })}</span><ChevronDown aria-hidden="true" className="size-3 text-muted-foreground" />
      </Popover.Trigger>
      <Popover.Portal><Popover.Positioner align="end" side="bottom" sideOffset={4} className="z-50"><Popover.Popup className="w-80 max-w-[calc(100vw-2rem)] rounded-lg border border-border bg-popover p-3 text-popover-foreground shadow-md outline-hidden">
        <div aria-label="Activity date range presets" className="grid gap-1" role="group">
          {presets.map((preset) => <button className={cn("rounded-md px-2.5 py-2 text-left text-sm hover:bg-muted", range === preset.value && "bg-muted font-medium")} key={preset.value} onClick={() => selectPreset(preset.value)} type="button">{preset.label}</button>)}
          <button className={cn("rounded-md px-2.5 py-2 text-left text-sm hover:bg-muted", range === "custom" && "bg-muted font-medium")} onClick={openCustom} type="button">Custom range</button>
        </div>
        {showCustom && <div className="mt-3 border-t border-border pt-3"><div className="space-y-2.5"><label className="grid gap-1 text-xs font-medium text-muted-foreground">From<Input aria-label="Custom range start date" className="w-full text-xs" max={draftTo || undefined} onChange={(event) => setDraftFrom(event.target.value)} type="date" value={draftFrom} /></label><label className="grid gap-1 text-xs font-medium text-muted-foreground">To<Input aria-label="Custom range end date" className="w-full text-xs" min={draftFrom || undefined} onChange={(event) => setDraftTo(event.target.value)} type="date" value={draftTo} /></label></div><Button className="mt-3 w-full" disabled={!customValid} onClick={() => { onChange({ range: "custom", from: draftFrom, to: draftTo }); setOpen(false); }} size="sm" type="button"><Check aria-hidden="true" />Apply range</Button></div>}
      </Popover.Popup></Popover.Positioner></Popover.Portal>
    </Popover.Root>
  );
}
