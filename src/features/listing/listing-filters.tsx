"use client";

import { Search, X } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { LISTING_TABS } from "./listing.types";
import type { ListingFilters as ListingFiltersValue, ListingStatus } from "./listing.types";

type ListingFiltersProps = {
  filters: ListingFiltersValue;
  onChange: (changes: Partial<ListingFiltersValue>) => void;
};

export function ListingFilters({ filters, onChange }: ListingFiltersProps) {
  const [searchInput, setSearchInput] = useState(filters.search ?? "");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const search = searchInput.trim() || undefined;
      if (search !== filters.search) onChange({ page: 1, search });
    }, 350);

    return () => window.clearTimeout(timer);
  }, [filters.search, onChange, searchInput]);

  const selectStatus = (status: ListingStatus) => {
    if (status !== filters.status) onChange({ page: 1, status });
  };

  return (
    <section className="space-y-3 rounded-xl border border-border bg-card p-3 shadow-xs sm:p-4">
      <div
        aria-label="Filter listings by status"
        className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1"
        role="tablist"
      >
        {LISTING_TABS.map((tab) => {
          const selected = tab.status === filters.status;
          return (
            <Button
              aria-controls="listing-queue-results"
              aria-selected={selected}
              className="shrink-0"
              key={tab.status}
              onClick={() => selectStatus(tab.status)}
              role="tab"
              size="sm"
              type="button"
              variant={selected ? "secondary" : "ghost"}
            >
              {tab.label}
            </Button>
          );
        })}
      </div>

      <div className="relative">
        <Search
          aria-hidden="true"
          className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          aria-label="Search listings"
          className="pl-9 pr-9"
          maxLength={100}
          onChange={(event) => setSearchInput(event.target.value)}
          placeholder="Search title, Etsy listing ID, or URL"
          type="search"
          value={searchInput}
        />
        {searchInput ? (
          <button
            aria-label="Clear listing search"
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-sm text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
            onClick={() => setSearchInput("")}
            type="button"
          >
            <X className="size-4" />
          </button>
        ) : null}
      </div>
    </section>
  );
}
