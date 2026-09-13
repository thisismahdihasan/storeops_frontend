"use client";

import { useId, useMemo, useState } from "react";
import { Popover } from "@base-ui/react/popover";
import { Calendar as CalendarIcon, ChevronDown, ChevronLeft, ChevronRight, X } from "lucide-react";

import { cn } from "@/lib/utils";

export type DateFilterPickerProps = {
  allLabel?: string;
  className?: string;
  id?: string;
  label?: string;
  onChange: (date: string | undefined) => void;
  value?: string;
};

function formatDisplayDate(dateStr: string): string {
  const parts = dateStr.split("-").map(Number);
  if (parts.length !== 3 || parts.some(Number.isNaN)) {
    return dateStr;
  }
  const [year, month, day] = parts;
  const d = new Date(Date.UTC(year, month - 1, day));
  return d.toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
    year: "numeric",
  });
}

function getUtcTodayString(): string {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  const day = String(now.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getUtcYesterdayString(): string {
  const now = new Date();
  now.setUTCDate(now.getUTCDate() - 1);
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  const day = String(now.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function DateFilterPicker({
  allLabel = "All dates",
  className,
  id,
  label = "Date",
  onChange,
  value,
}: DateFilterPickerProps) {
  const generatedId = useId();
  const elementId = id ?? generatedId;
  const [isOpen, setIsOpen] = useState(false);

  // Month navigation state inside calendar
  const initialCalendarDate = useMemo(() => {
    if (value) {
      const parts = value.split("-").map(Number);
      if (parts.length === 3 && !parts.some(Number.isNaN)) {
        return new Date(Date.UTC(parts[0], parts[1] - 1, 1));
      }
    }
    const now = new Date();
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  }, [value]);

  const [viewDate, setViewDate] = useState<Date>(initialCalendarDate);

  const displayLabel = value ? formatDisplayDate(value) : allLabel;
  const todayStr = getUtcTodayString();
  const yesterdayStr = getUtcYesterdayString();

  const handlePrevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setViewDate(
      (prev) => new Date(Date.UTC(prev.getUTCFullYear(), prev.getUTCMonth() - 1, 1)),
    );
  };

  const handleNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setViewDate(
      (prev) => new Date(Date.UTC(prev.getUTCFullYear(), prev.getUTCMonth() + 1, 1)),
    );
  };

  const monthName = viewDate.toLocaleDateString("en-US", {
    month: "long",
    timeZone: "UTC",
    year: "numeric",
  });

  const calendarDays = useMemo(() => {
    const year = viewDate.getUTCFullYear();
    const month = viewDate.getUTCMonth();
    const firstDayIndex = new Date(Date.UTC(year, month, 1)).getUTCDay();
    const totalDaysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();

    const cells: Array<{ dateStr: string; dayNumber: number } | null> = [];
    for (let i = 0; i < firstDayIndex; i += 1) {
      cells.push(null);
    }
    for (let day = 1; day <= totalDaysInMonth; day += 1) {
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      cells.push({ dateStr, dayNumber: day });
    }
    return cells;
  }, [viewDate]);

  const handleSelectDay = (dateStr: string) => {
    onChange(dateStr);
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(undefined);
    setIsOpen(false);
  };

  return (
    <Popover.Root open={isOpen} onOpenChange={setIsOpen}>
      <Popover.Trigger
        id={elementId}
        aria-label={`${label}: ${displayLabel}`}
        className={cn(
          "inline-flex h-9 items-center justify-between gap-1.5 rounded-md border border-input bg-background px-2.5 text-xs text-foreground transition-colors hover:bg-muted/50 focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring",
          value ? "font-medium text-foreground" : "text-muted-foreground",
          className,
        )}
      >
        <div className="flex items-center gap-1.5">
          <CalendarIcon className="size-3.5 shrink-0 text-muted-foreground" />
          <span className="truncate">{displayLabel}</span>
        </div>
        <div className="flex items-center gap-0.5">
          {value && (
            <button
              type="button"
              onClick={handleClear}
              className="rounded-xs p-0.5 text-muted-foreground hover:text-foreground"
              aria-label="Clear date filter"
              title="Clear date"
            >
              <X className="size-3" />
            </button>
          )}
          <ChevronDown className="size-3 shrink-0 text-muted-foreground" />
        </div>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Positioner side="bottom" align="start" sideOffset={4} className="z-50 outline-hidden">
          <Popover.Popup className="z-50 w-72 rounded-lg border border-border bg-popover p-3 text-popover-foreground shadow-md outline-hidden">
            {/* Quick preset buttons */}
            <div className="flex items-center justify-between border-b border-border pb-2 text-xs">
              <span className="font-semibold text-foreground text-[11px] uppercase tracking-wider">
                Date Filter
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleSelectDay(todayStr)}
                  className="rounded px-1.5 py-0.5 text-[11px] text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectDay(yesterdayStr)}
                  className="rounded px-1.5 py-0.5 text-[11px] text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                >
                  Yesterday
                </button>
                {value && (
                  <button
                    type="button"
                    onClick={handleClear}
                    className="rounded px-1.5 py-0.5 text-[11px] text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* Calendar header with month navigation */}
            <div className="mt-2 flex items-center justify-between px-1">
              <span className="text-xs font-medium text-foreground">{monthName}</span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  aria-label="Previous month"
                  className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <ChevronLeft className="size-3.5" />
                </button>
                <button
                  type="button"
                  onClick={handleNextMonth}
                  aria-label="Next month"
                  className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <ChevronRight className="size-3.5" />
                </button>
              </div>
            </div>

            {/* Weekday headers */}
            <div className="mt-2 grid grid-cols-7 text-center text-[10px] font-medium text-muted-foreground">
              <span>Su</span>
              <span>Mo</span>
              <span>Tu</span>
              <span>We</span>
              <span>Th</span>
              <span>Fr</span>
              <span>Sa</span>
            </div>

            {/* Day grid */}
            <div className="mt-1 grid grid-cols-7 gap-1 text-center text-xs">
              {calendarDays.map((cell, idx) => {
                if (!cell) {
                  return <div key={`empty-${idx}`} className="size-8" />;
                }
                const isSelected = cell.dateStr === value;
                const isToday = cell.dateStr === todayStr;

                return (
                  <button
                    key={cell.dateStr}
                    type="button"
                    onClick={() => handleSelectDay(cell.dateStr)}
                    className={cn(
                      "flex size-8 items-center justify-center rounded-md text-xs transition-colors",
                      isSelected
                        ? "bg-primary text-primary-foreground font-semibold"
                        : isToday
                          ? "border border-primary/40 font-medium text-primary hover:bg-muted"
                          : "text-foreground hover:bg-muted",
                    )}
                  >
                    {cell.dayNumber}
                  </button>
                );
              })}
            </div>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
