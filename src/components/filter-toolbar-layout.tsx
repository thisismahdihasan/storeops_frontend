"use client";

import type { ReactNode } from "react";
import { RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type FilterToolbarLayoutProps = {
  children?: ReactNode;
  className?: string;
  clearLabel?: string;
  hasActiveFilters?: boolean;
  onClearFilters?: () => void;
  searchSlot: ReactNode;
};

export function FilterToolbarLayout({
  children,
  className,
  clearLabel = "Clear filters",
  hasActiveFilters,
  onClearFilters,
  searchSlot,
}: FilterToolbarLayoutProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-2.5 rounded-xl border border-border bg-card p-3 shadow-xs md:flex-row md:items-center md:justify-between",
        className,
      )}
    >
      {/* Search Slot */}
      <div className="flex-1 min-w-48">{searchSlot}</div>

      {/* Filter Controls Row */}
      <div className="flex flex-wrap items-center gap-2">
        {children}

        {/* Clear Filters Action */}
        {hasActiveFilters && onClearFilters && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            className="h-9 gap-1.5 px-2.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="size-3 text-muted-foreground" />
            <span>{clearLabel}</span>
          </Button>
        )}
      </div>
    </div>
  );
}
