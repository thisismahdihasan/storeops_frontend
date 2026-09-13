"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";

import { DateFilterPicker } from "@/components/date-filter-picker";
import { FilterToolbarLayout } from "@/components/filter-toolbar-layout";
import {
  MemberFilterSelect,
  type MemberFilterOption,
} from "@/components/member-filter-select";
import { Input } from "@/components/ui/input";
import type { AdminDesignFilterParams } from "./designs.types";
import type { ResearchStatus } from "@/features/research/research.types";

const DESIGN_STATUS_OPTIONS: Array<{ label: string; value: ResearchStatus }> = [
  { label: "Assigned", value: "ASSIGNED" },
  { label: "Designing", value: "DESIGN_IN_PROGRESS" },
  { label: "Waiting Review", value: "DESIGN_REVIEW" },
  { label: "Correction Needed", value: "CORRECTION_NEEDED" },
  { label: "Issue Reported", value: "ISSUE_REPORTED" },
  { label: "Design Approved", value: "DESIGN_APPROVED" },
  { label: "Ready for Listing", value: "READY_FOR_LISTING" },
  { label: "Listing In Progress", value: "LISTING_IN_PROGRESS" },
  { label: "Listed", value: "LISTED" },
];

type DesignsFiltersProps = {
  currentFilters: AdminDesignFilterParams;
  designers?: MemberFilterOption[];
};

export function DesignsFilters({
  currentFilters,
  designers = [],
}: DesignsFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [searchInput, setSearchInput] = useState(currentFilters.search ?? "");
  const [prevPropSearch, setPrevPropSearch] = useState(currentFilters.search);

  if (currentFilters.search !== prevPropSearch) {
    setPrevPropSearch(currentFilters.search);
    setSearchInput(currentFilters.search ?? "");
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      const trimmed = searchInput.trim();
      const currentInUrl = searchParams.get("search") ?? "";
      if (trimmed !== currentInUrl) {
        const params = new URLSearchParams(searchParams.toString());
        if (trimmed.length > 0) {
          params.set("search", trimmed);
        } else {
          params.delete("search");
        }
        params.delete("page");
        router.push(`${pathname}?${params.toString()}`);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [searchInput, pathname, router, searchParams]);

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = e.target.value;
    const params = new URLSearchParams(searchParams.toString());
    if (selected && selected !== "ALL") {
      params.set("status", selected);
    } else {
      params.delete("status");
    }
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleDesignerChange = (userId: string | undefined) => {
    const params = new URLSearchParams(searchParams.toString());
    if (userId) {
      params.set("designerId", userId);
    } else {
      params.delete("designerId");
    }
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleDateChange = (date: string | undefined) => {
    const params = new URLSearchParams(searchParams.toString());
    if (date) {
      params.set("date", date);
    } else {
      params.delete("date");
    }
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleResetFilters = () => {
    setSearchInput("");
    router.push(pathname);
  };

  const hasActiveFilters = Boolean(
    currentFilters.status ||
      currentFilters.search ||
      currentFilters.date ||
      currentFilters.designerId ||
      (currentFilters.page && currentFilters.page > 1),
  );

  return (
    <FilterToolbarLayout
      hasActiveFilters={hasActiveFilters}
      onClearFilters={handleResetFilters}
      searchSlot={
        <div className="relative w-full">
          <Search className="pointer-events-none absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search designs by title, listing ID, or Etsy URL..."
            className="h-9 pl-9 pr-8 text-xs"
          />
          {searchInput.length > 0 && (
            <button
              type="button"
              onClick={() => setSearchInput("")}
              className="absolute right-2.5 top-2.5 text-muted-foreground transition-colors hover:text-foreground"
              title="Clear search"
              aria-label="Clear search input"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
      }
    >
      {/* Designer Combobox Selector */}
      <MemberFilterSelect
        allLabel="All Designers"
        emptyMessage="No designers found."
        label="Designer"
        onValueChange={handleDesignerChange}
        options={designers}
        value={currentFilters.designerId}
      />

      {/* Status Filter */}
      <select
        value={currentFilters.status ?? "ALL"}
        onChange={handleStatusChange}
        className="h-9 rounded-md border border-input bg-background px-2.5 text-xs text-foreground outline-hidden focus:ring-1 focus:ring-ring"
        aria-label="Filter by design status"
      >
        <option value="ALL">All Statuses</option>
        {DESIGN_STATUS_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      {/* Date Filter */}
      <DateFilterPicker
        value={currentFilters.date}
        onChange={handleDateChange}
        label="Creation date"
        allLabel="All dates"
      />
    </FilterToolbarLayout>
  );
}
