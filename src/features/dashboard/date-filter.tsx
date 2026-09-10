"use client";

import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Calendar, Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { DashboardDatePreset, DashboardFilterParams } from "./dashboard.types";

const PRESET_OPTIONS: Array<{ label: string; value: DashboardDatePreset }> = [
  { label: "All Time", value: "all" },
  { label: "Today", value: "today" },
  { label: "This Week", value: "week" },
  { label: "This Month", value: "month" },
  { label: "Custom Range", value: "custom" },
];

export function parseFilterFromParams(
  searchParams: URLSearchParams,
): DashboardFilterParams {
  const presetParam = searchParams.get("preset");
  const dateFrom = searchParams.get("dateFrom") ?? undefined;
  const dateTo = searchParams.get("dateTo") ?? undefined;

  if (
    presetParam === "today" ||
    presetParam === "week" ||
    presetParam === "month"
  ) {
    return { preset: presetParam };
  }

  if (presetParam === "custom") {
    if (dateFrom && dateTo) {
      const fromTime = new Date(dateFrom).getTime();
      const toTime = new Date(dateTo).getTime();
      if (
        !Number.isNaN(fromTime) &&
        !Number.isNaN(toTime) &&
        fromTime <= toTime
      ) {
        return {
          dateFrom,
          dateTo,
          preset: "custom",
        };
      }
    }
    // Invalid custom parameters fallback to "all"
    return { preset: "all" };
  }

  return { preset: "all" };
}

type DateFilterProps = {
  currentFilter: DashboardFilterParams;
  resolvedRange?: {
    dateFrom: string | null;
    dateTo: string | null;
    preset: DashboardDatePreset;
  };
};

function formatIsoToDateInput(isoString?: string): string {
  if (!isoString) return "";
  try {
    const d = new Date(isoString);
    if (Number.isNaN(d.getTime())) return "";
    return d.toISOString().slice(0, 10);
  } catch {
    return "";
  }
}

type CustomDateRangeFormProps = {
  initialDateFrom?: string;
  initialDateTo?: string;
  onApply: (dateFromIso: string, dateToIso: string) => void;
};

function CustomDateRangeForm({
  initialDateFrom,
  initialDateTo,
  onApply,
}: CustomDateRangeFormProps) {
  const [fromDateInput, setFromDateInput] = useState<string>(() =>
    formatIsoToDateInput(initialDateFrom),
  );
  const [toDateInput, setToDateInput] = useState<string>(() =>
    formatIsoToDateInput(initialDateTo),
  );
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!fromDateInput || !toDateInput) {
      setValidationError("Both From and To dates are required for custom range.");
      return;
    }

    if (fromDateInput > toDateInput) {
      setValidationError("From date cannot be after To date.");
      return;
    }

    // Convert YYYY-MM-DD into explicit UTC boundary ISO strings
    const dateFromIso = `${fromDateInput}T00:00:00.000Z`;
    const dateToIso = `${toDateInput}T23:59:59.999Z`;

    onApply(dateFromIso, dateToIso);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-3 border-t border-border/60 pt-3 sm:flex-row sm:items-end"
    >
      <div className="flex flex-col gap-1.5 sm:w-48">
        <label
          htmlFor="dashboard-date-from"
          className="text-xs font-medium text-muted-foreground"
        >
          From (UTC)
        </label>
        <input
          id="dashboard-date-from"
          type="date"
          value={fromDateInput}
          max={toDateInput || undefined}
          onChange={(e) => setFromDateInput(e.target.value)}
          className="h-8 rounded-lg border border-border bg-background px-2.5 text-xs text-foreground outline-hidden focus:border-ring focus:ring-2 focus:ring-ring/40"
          required
        />
      </div>

      <div className="flex flex-col gap-1.5 sm:w-48">
        <label
          htmlFor="dashboard-date-to"
          className="text-xs font-medium text-muted-foreground"
        >
          To (UTC)
        </label>
        <input
          id="dashboard-date-to"
          type="date"
          value={toDateInput}
          min={fromDateInput || undefined}
          onChange={(e) => setToDateInput(e.target.value)}
          className="h-8 rounded-lg border border-border bg-background px-2.5 text-xs text-foreground outline-hidden focus:border-ring focus:ring-2 focus:ring-ring/40"
          required
        />
      </div>

      <div className="flex items-center gap-2">
        <Button size="sm" type="submit" className="h-8">
          <Check className="size-3.5" />
          Apply Range
        </Button>
      </div>

      {validationError && (
        <p className="text-xs font-medium text-destructive sm:self-center">
          {validationError}
        </p>
      )}
    </form>
  );
}

export function DateFilter({ currentFilter, resolvedRange }: DateFilterProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const activePreset = currentFilter.preset ?? "all";
  const [wantsCustom, setWantsCustom] = useState(false);

  const isCustomMode = activePreset === "custom" || wantsCustom;

  const handleSelectPreset = (preset: DashboardDatePreset) => {
    if (preset === "custom") {
      setWantsCustom(true);
      return;
    }

    setWantsCustom(false);
    const params = new URLSearchParams(searchParams.toString());
    if (preset === "all") {
      params.delete("preset");
      params.delete("dateFrom");
      params.delete("dateTo");
    } else {
      params.set("preset", preset);
      params.delete("dateFrom");
      params.delete("dateTo");
    }

    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  };

  const handleApplyCustom = (dateFromIso: string, dateToIso: string) => {
    setWantsCustom(false);
    const params = new URLSearchParams(searchParams.toString());
    params.set("preset", "custom");
    params.set("dateFrom", dateFromIso);
    params.set("dateTo", dateToIso);

    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-xs">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="size-4 text-muted-foreground" />
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Cohort Period Filter
          </span>
        </div>

        {/* Preset Selector */}
        <div
          role="group"
          aria-label="Dashboard Date Presets"
          className="inline-flex flex-wrap items-center rounded-lg border border-border bg-muted/40 p-1 text-xs"
        >
          {PRESET_OPTIONS.map((option) => {
            const isSelected =
              isCustomMode && option.value === "custom"
                ? true
                : !isCustomMode && activePreset === option.value;

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => handleSelectPreset(option.value)}
                className={cn(
                  "rounded-md px-3 py-1.5 font-medium transition-all focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring",
                  isSelected
                    ? "bg-card text-foreground shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Custom Range Inputs */}
      {isCustomMode && (
        <CustomDateRangeForm
          key={`${currentFilter.dateFrom ?? ""}-${currentFilter.dateTo ?? ""}`}
          initialDateFrom={currentFilter.dateFrom}
          initialDateTo={currentFilter.dateTo}
          onApply={handleApplyCustom}
        />
      )}

      {/* Explicit Cohort Context Description */}
      <div className="text-xs text-muted-foreground">
        {activePreset === "all" ? (
          <span>
            Displaying the pipeline status for <strong>all research items</strong> in this workspace.
          </span>
        ) : (
          <span>
            Pipeline state for research items created during the selected period.
            {resolvedRange?.dateFrom && resolvedRange.dateTo && (
              <span className="ml-1 text-foreground/80">
                ({new Date(resolvedRange.dateFrom).toLocaleDateString()} —{" "}
                {new Date(resolvedRange.dateTo).toLocaleDateString()} UTC)
              </span>
            )}
          </span>
        )}
      </div>
    </div>
  );
}
