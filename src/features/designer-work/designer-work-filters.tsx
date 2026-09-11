"use client";

import { useEffect, useState } from "react";
import { Search, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { DESIGNER_WORK_TABS } from "./designer-work.types";
import type { DesignerWorkFilters, DesignerWorkStatus } from "./designer-work.types";

type DesignerWorkFiltersProps = {
  filters: DesignerWorkFilters;
  onChange: (next: Partial<DesignerWorkFilters>) => void;
};

export function DesignerWorkFilters({ filters, onChange }: DesignerWorkFiltersProps) {
  const [searchInput, setSearchInput] = useState(filters.search ?? "");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const search = searchInput.trim() || undefined;
      if (search !== filters.search) onChange({ page: 1, search });
    }, 350);
    return () => window.clearTimeout(timer);
  }, [filters.search, onChange, searchInput]);

  const selectStatus = (status?: DesignerWorkStatus) => {
    if (status !== filters.status) onChange({ page: 1, status });
  };

  return (
    <div className="space-y-3 rounded-xl border border-border bg-card p-3 shadow-xs sm:p-4">
      <div aria-label="Filter work by status" className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1" role="tablist">
        {DESIGNER_WORK_TABS.map((tab) => {
          const isSelected = tab.status === filters.status;
          return (
            <Button key={tab.label} aria-selected={isSelected} onClick={() => selectStatus(tab.status)} role="tab" size="sm" type="button" variant={isSelected ? "secondary" : "ghost"} className="shrink-0">
              {tab.label}
            </Button>
          );
        })}
      </div>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input aria-label="Search assigned design work" className="pl-9 pr-9" onChange={(event) => setSearchInput(event.target.value)} placeholder="Search title, Etsy listing ID, or URL" value={searchInput} />
        {searchInput && (
          <button aria-label="Clear search" className="absolute right-3 top-1/2 -translate-y-1/2 rounded-sm text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring" onClick={() => setSearchInput("")} type="button">
            <X className="size-4" />
          </button>
        )}
      </div>
    </div>
  );
}
