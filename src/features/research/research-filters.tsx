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
import { FilterSearchInput } from "@/components/filter-search-input";
import { ActivityDateRangeFilter } from "@/features/role-activity/activity-date-range-filter";
import type { ActivityDateRangeIntent } from "@/features/role-activity/role-activity-date.utils";
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
  const assignmentParam = searchParams.get("assignment");
  const pageParam = searchParams.get("page");
  const sortParam = searchParams.get("sort");
  const statusGroupParam = searchParams.get("statusGroup");
  const dateFromParam = searchParams.get("dateFrom") ?? undefined;
  const dateToParam = searchParams.get("dateTo") ?? undefined;

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
  const assignment = assignmentParam === "UNASSIGNED" ? assignmentParam : undefined;

  // Validate date regex YYYY-MM-DD if present
  const isValidDate = dateParam ? /^\d{4}-\d{2}-\d{2}$/.test(dateParam) : false;

  return {
    createdBy: createdByParam,
    date: isValidDate ? dateParam : undefined,
    limit: 20,
    page: parsedPage,
    search: searchParam && searchParam.trim().length > 0 ? searchParam.trim() : undefined,
    sort:
      sortParam === "oldest" || sortParam === "updated" || sortParam === "newest"
        ? sortParam
        : "newest",
    assignment,
    status: assignment ? undefined : parsedStatus,
    statusGroup: ["all", "waiting", "in_design", "needs_attention", "in_listing", "listed"].includes(statusGroupParam ?? "")
      ? statusGroupParam as ResearchListFilterParams["statusGroup"]
      : undefined,
    dateFrom: dateFromParam,
    dateTo: dateToParam,
  };
}

type ResearchFiltersProps = {
  currentFilters: ResearchListFilterParams;
  isAdmin?: boolean;
  researchers?: MemberFilterOption[];
  isActivityWorker?: boolean;
};

export function ResearchFilters({
  currentFilters,
  isAdmin = true,
  isActivityWorker = false,
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
      params.delete("assignment");
    } else {
      params.delete("status");
    }
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleAssignmentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const params = new URLSearchParams(searchParams.toString());
    if (e.target.value === "UNASSIGNED") {
      params.set("assignment", "UNASSIGNED");
      params.delete("status");
    } else {
      params.delete("assignment");
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

  const handleSortChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const params = new URLSearchParams(searchParams.toString());
    if (event.target.value === "oldest" || event.target.value === "updated") {
      params.set("sort", event.target.value);
    } else {
      params.delete("sort");
    }
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleResetFilters = () => {
    setSearchInput("");
    router.push(pathname);
  };

  const updateWorkerParams = (changes: Partial<ActivityDateRangeIntent> & { search?: string; sort?: ResearchListFilterParams["sort"] }) => {
    const params = new URLSearchParams(searchParams.toString());
    if (changes.search !== undefined) {
      if (changes.search) params.set("search", changes.search); else params.delete("search");
    }
    if (changes.sort !== undefined) {
      if (changes.sort === "newest") params.delete("sort"); else params.set("sort", changes.sort);
    }
    if (changes.range !== undefined) {
      if (changes.range === "all") params.delete("range"); else params.set("range", changes.range);
      if (changes.range !== "custom") { params.delete("from"); params.delete("to"); }
    }
    if (changes.from !== undefined) { if (changes.from) params.set("from", changes.from); else params.delete("from"); }
    if (changes.to !== undefined) { if (changes.to) params.set("to", changes.to); else params.delete("to"); }
    params.delete("page");
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  };

  if (isActivityWorker) {
    const range = (["today", "7d", "30d", "custom"].includes(searchParams.get("range") ?? "") ? searchParams.get("range") : "all") as ActivityDateRangeIntent["range"];
    return <FilterToolbarLayout hasActiveFilters={Boolean(currentFilters.search || currentFilters.sort !== "newest" || range !== "all")} onClearFilters={() => router.push(pathname)} searchSlot={<FilterSearchInput onSearch={(search) => updateWorkerParams({ search: search.trim() })} placeholder="Search by title, listing ID, or Etsy URL..." value={currentFilters.search ?? ""} />}><ActivityDateRangeFilter from={searchParams.get("from") ?? undefined} onChange={(next) => updateWorkerParams(next)} range={range} to={searchParams.get("to") ?? undefined} /><select aria-label="Sort research" className="h-9 rounded-md border border-input bg-background px-2.5 text-xs text-foreground outline-hidden focus:ring-1 focus:ring-ring" onChange={(event) => updateWorkerParams({ sort: event.target.value as ResearchListFilterParams["sort"] })} value={currentFilters.sort ?? "newest"}><option value="newest">Newest first</option><option value="oldest">Oldest first</option><option value="updated">Recently updated</option></select></FilterToolbarLayout>;
  }

  const hasActiveFilters = Boolean(
    currentFilters.assignment ||
      currentFilters.status ||
      currentFilters.search ||
      currentFilters.date ||
      (isAdmin && currentFilters.createdBy) ||
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
            placeholder="Search by title, listing ID, or Etsy URL..."
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
      {/* Researcher Combobox Selector */}
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
      )}

      {isAdmin && (
        <select
          aria-label="Filter by assignment"
          className="h-9 rounded-md border border-input bg-background px-2.5 text-xs text-foreground outline-hidden focus:ring-1 focus:ring-ring"
          onChange={handleAssignmentChange}
          value={currentFilters.assignment ?? "ALL"}
        >
          <option value="ALL">All assignments</option>
          <option value="UNASSIGNED">Unassigned</option>
        </select>
      )}

      {/* Date filter (single UTC calendar day) */}
      <DateFilterPicker
        value={currentFilters.date}
        onChange={handleDateChange}
        label="Created date"
        allLabel="All dates"
      />
      <select
        aria-label="Sort research"
        className="h-9 rounded-md border border-input bg-background px-2.5 text-xs text-foreground outline-hidden focus:ring-1 focus:ring-ring"
        onChange={handleSortChange}
        value={currentFilters.sort ?? "newest"}
      >
        <option value="newest">Newest first</option>
        <option value="oldest">Oldest first</option>
        <option value="updated">Recently updated</option>
      </select>
    </FilterToolbarLayout>
  );
}
