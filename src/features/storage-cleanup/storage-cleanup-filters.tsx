"use client";

import { useEffect, useState } from "react";
import { Search, X } from "lucide-react";

import { CountBadge } from "@/components/ui/count-badge";
import { Input } from "@/components/ui/input";

import type { StorageCleanupFilter } from "./storage-cleanup.types";

type StorageCleanupFiltersProps = {
  filter: StorageCleanupFilter;
  onFilterChange: (filter: StorageCleanupFilter) => void;
  onSearchChange: (search: string) => void;
  search: string;
  totalCount?: number;
};

export function StorageCleanupFilters({
  filter,
  onFilterChange,
  onSearchChange,
  search,
  totalCount,
}: StorageCleanupFiltersProps) {
  const [searchInput, setSearchInput] = useState(search);
  const [prevSearch, setPrevSearch] = useState(search);

  // Sync if parent search prop changes (e.g. cleared externally) without cascading effect
  if (search !== prevSearch) {
    setPrevSearch(search);
    setSearchInput(search);
  }

  // Debounced search sync
  useEffect(() => {
    const timer = setTimeout(() => {
      const trimmed = searchInput.trim();
      if (trimmed !== search) {
        onSearchChange(trimmed);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [searchInput, onSearchChange, search]);

  const handleClearSearch = () => {
    setSearchInput("");
    if (search !== "") {
      onSearchChange("");
    }
  };

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      {/* Search Input & Status Dropdown */}
      <div className="flex flex-1 flex-col gap-2.5 sm:flex-row sm:items-center">
        {/* Search */}
        <div className="relative w-full sm:w-72 lg:w-80">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <Input
            className="h-9 pl-8 pr-8 text-xs placeholder:text-muted-foreground/70"
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by title or Etsy ID…"
            type="text"
            value={searchInput}
          />
          {searchInput.length > 0 && (
            <button
              aria-label="Clear search"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              onClick={handleClearSearch}
              type="button"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-1.5">
          <label className="text-xs text-muted-foreground shrink-0" htmlFor="storage-status-filter">
            Status:
          </label>
          <select
            className="h-9 rounded-md border border-input bg-background px-2.5 py-1 text-xs text-foreground shadow-xs transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            id="storage-status-filter"
            onChange={(e) => onFilterChange(e.target.value as StorageCleanupFilter)}
            value={filter}
          >
            <option value="ELIGIBLE">Eligible</option>
            <option value="CLEANED">Cleaned Up</option>
            <option value="ALL">All Listed</option>
          </select>
        </div>
      </div>

      {/* Count Visibility */}
      {totalCount !== undefined && (
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="text-xs text-muted-foreground">Total:</span>
          <CountBadge
            count={totalCount}
            label="package"
            pluralLabel="packages"
          />
        </div>
      )}
    </div>
  );
}
