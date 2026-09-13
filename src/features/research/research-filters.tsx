"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Calendar, Filter, RotateCcw, Search, X } from "lucide-react";

import {
  MemberFilterSelect,
  type MemberFilterOption,
} from "@/components/member-filter-select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ResearchListFilterParams, ResearchStatus } from "./research.types";

const STATUS_OPTIONS: Array<{ label: string; value: ResearchStatus }> = [
  { label: "Researched", value: "RESEARCHED" },
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

export function parseResearchFiltersFromParams(
  searchParams: URLSearchParams,
): ResearchListFilterParams {
  const statusParam = searchParams.get("status");
  const searchParam = searchParams.get("search") ?? undefined;
  const dateParam = searchParams.get("date") ?? undefined;
  const createdByParam = searchParams.get("createdBy") ?? undefined;
  const pageParam = searchParams.get("page");

  const validStatuses = new Set<string>([
    "RESEARCHED",
    "ASSIGNED",
    "DESIGN_IN_PROGRESS",
    "DESIGN_REVIEW",
    "CORRECTION_NEEDED",
    "ISSUE_REPORTED",
    "DESIGN_APPROVED",
    "READY_FOR_LISTING",
    "LISTING_IN_PROGRESS",
    "LISTED",
  ]);

  const parsedStatus =
    statusParam && validStatuses.has(statusParam)
      ? (statusParam as ResearchStatus)
      : undefined;

  const parsedPage =
    pageParam && !Number.isNaN(Number(pageParam)) && Number(pageParam) > 0
      ? Number(pageParam)
      : 1;

  // Validate date regex YYYY-MM-DD if present
  const isValidDate = dateParam ? /^\d{4}-\d{2}-\d{2}$/.test(dateParam) : false;

  return {
    createdBy: createdByParam,
    date: isValidDate ? dateParam : undefined,
    limit: 20,
    page: parsedPage,
    search: searchParam && searchParam.trim().length > 0 ? searchParam.trim() : undefined,
    status: parsedStatus,
  };
}

type ResearchFiltersProps = {
  currentFilters: ResearchListFilterParams;
  isAdmin?: boolean;
  researchers?: MemberFilterOption[];
};

export function ResearchFilters({
  currentFilters,
  isAdmin = true,
  researchers = [],
}: ResearchFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Local state for search input
  const [searchInput, setSearchInput] = useState(currentFilters.search ?? "");
  const [prevPropSearch, setPrevPropSearch] = useState(currentFilters.search);

  // Sync searchInput when URL searchParam changes without cascading effect
  if (currentFilters.search !== prevPropSearch) {
    setPrevPropSearch(currentFilters.search);
    setSearchInput(currentFilters.search ?? "");
  }

  // Debounced search sync to URL
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
        params.delete("page"); // Reset to page 1 on search change
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

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedDate = e.target.value;
    const params = new URLSearchParams(searchParams.toString());
    if (selectedDate) {
      params.set("date", selectedDate);
    } else {
      params.delete("date");
    }
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleResearcherChange = (userId: string | undefined) => {
    const params = new URLSearchParams(searchParams.toString());
    if (userId) {
      params.set("createdBy", userId);
    } else {
      params.delete("createdBy");
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
      currentFilters.createdBy ||
      (currentFilters.page && currentFilters.page > 1),
  );

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-xs">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        {/* Search input */}
        <div className="relative flex-1">
          <Search className="absolute top-2.5 left-2.5 size-4 text-muted-foreground" />
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by title, listing ID, or Etsy URL..."
            className="pl-9 pr-8 text-xs"
          />
          {searchInput.length > 0 && (
            <button
              type="button"
              onClick={() => setSearchInput("")}
              className="absolute top-2.5 right-2.5 text-muted-foreground transition-colors hover:text-foreground"
              title="Clear search"
            >
              <X className="size-4" />
            </button>
          )}
        </div>

        {/* Filter controls row */}
        <div className="flex flex-wrap items-center gap-2.5">
          {isAdmin && (
            <MemberFilterSelect
              allLabel="All Researchers"
              emptyMessage="No researchers found."
              label="Researcher"
              onValueChange={handleResearcherChange}
              options={researchers}
              value={currentFilters.createdBy}
            />
          )}

          {/* Status filter (Admin only) */}
          {isAdmin && (
            <div className="flex items-center gap-1.5">
              <Filter className="size-3.5 text-muted-foreground" />
              <select
                value={currentFilters.status ?? "ALL"}
                onChange={handleStatusChange}
                className="h-9 rounded-md border border-input bg-background px-2.5 text-xs text-foreground outline-hidden focus:ring-1 focus:ring-ring"
                aria-label="Filter by status"
              >
                <option value="ALL">All Statuses</option>
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Date filter (single UTC calendar day) */}
          <div className="flex items-center gap-1.5">
            <Calendar className="size-3.5 text-muted-foreground" />
            <input
              type="date"
              value={currentFilters.date ?? ""}
              onChange={handleDateChange}
              className="h-9 rounded-md border border-input bg-background px-2.5 text-xs text-foreground outline-hidden focus:ring-1 focus:ring-ring"
              title="Filter by creation date (UTC)"
              aria-label="Filter by creation date"
            />
          </div>

          {/* Reset button */}
          {hasActiveFilters && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleResetFilters}
              className="h-9 gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              <RotateCcw className="size-3" />
              <span>Reset</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
