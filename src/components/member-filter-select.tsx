"use client";

import { useId, useMemo, useState } from "react";
import { Popover } from "@base-ui/react/popover";
import { Check, ChevronDown, Search, User, X } from "lucide-react";

import { cn } from "@/lib/utils";

export type MemberFilterOption = {
  email: string;
  name: string | null;
  userId: string;
};

export type MemberFilterSelectProps = {
  allLabel: string;
  className?: string;
  emptyMessage?: string;
  id?: string;
  label: string;
  onValueChange: (userId: string | undefined) => void;
  options: MemberFilterOption[];
  value?: string;
};

export function MemberFilterSelect({
  allLabel,
  className,
  emptyMessage = "No members found.",
  id,
  label,
  onValueChange,
  options,
  value,
}: MemberFilterSelectProps) {
  const generatedId = useId();
  const elementId = id ?? generatedId;
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");

  const selectedMember = useMemo(
    () => options.find((opt) => opt.userId === value),
    [options, value],
  );

  const normalizedSearch = search.trim().toLocaleLowerCase();
  const matchingOptions = useMemo(() => {
    if (!normalizedSearch) {
      return options;
    }
    return options.filter((option) =>
      `${option.name ?? ""} ${option.email}`
        .toLocaleLowerCase()
        .includes(normalizedSearch),
    );
  }, [normalizedSearch, options]);

  const displayLabel = selectedMember
    ? selectedMember.name || selectedMember.email
    : allLabel;

  const handleSelect = (userId: string | undefined) => {
    onValueChange(userId);
    setIsOpen(false);
    setSearch("");
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onValueChange(undefined);
    setSearch("");
  };

  return (
    <Popover.Root
      open={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open);
        if (!open) {
          setSearch("");
        }
      }}
    >
      <Popover.Trigger
        id={elementId}
        aria-label={`${label}: ${displayLabel}`}
        className={cn(
          "inline-flex h-9 items-center justify-between gap-1.5 rounded-md border border-input bg-background px-2.5 text-xs text-foreground transition-colors hover:bg-muted/50 focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring",
          value ? "font-medium text-foreground" : "text-muted-foreground",
          className,
        )}
      >
        <div className="flex items-center gap-1.5 truncate">
          <User className="size-3.5 shrink-0 text-muted-foreground" />
          <span className="truncate">{displayLabel}</span>
        </div>
        <div className="flex items-center gap-0.5 shrink-0">
          {value && (
            <button
              type="button"
              onClick={handleClear}
              className="rounded-xs p-0.5 text-muted-foreground hover:text-foreground"
              aria-label={`Clear ${label.toLocaleLowerCase()} filter`}
              title={`Clear ${label.toLocaleLowerCase()}`}
            >
              <X className="size-3" />
            </button>
          )}
          <ChevronDown className="size-3 text-muted-foreground" />
        </div>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Positioner side="bottom" align="start" sideOffset={4} className="z-50 outline-hidden">
          <Popover.Popup className="z-50 w-72 rounded-lg border border-border bg-popover p-1 text-popover-foreground shadow-md outline-hidden">
            {/* Search Input Inside Dropdown Popover */}
            <div className="relative p-1.5 border-b border-border">
              <Search className="pointer-events-none absolute left-3.5 top-3.5 size-3.5 text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={`Search ${label.toLocaleLowerCase()}...`}
                className="h-8 w-full rounded-md border border-input bg-background pl-7 pr-7 text-xs text-foreground placeholder:text-muted-foreground outline-hidden focus:ring-1 focus:ring-ring"
                aria-label={`Search ${label.toLocaleLowerCase()} by name or email`}
                autoFocus
              />
              {search.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-3.5 top-3.5 text-muted-foreground hover:text-foreground"
                  aria-label="Clear member search"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>

            {/* Options List */}
            <div className="max-h-60 overflow-y-auto p-1 text-xs" role="listbox">
              {/* "All" option */}
              <button
                type="button"
                role="option"
                aria-selected={!value}
                onClick={() => handleSelect(undefined)}
                className={cn(
                  "flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-xs transition-colors hover:bg-muted focus-visible:bg-muted focus-visible:outline-hidden",
                  !value ? "bg-muted font-medium text-foreground" : "text-muted-foreground",
                )}
              >
                <span>{allLabel}</span>
                {!value && <Check className="size-3.5 text-primary shrink-0" />}
              </button>

              {/* Members */}
              {matchingOptions.map((option) => {
                const isSelected = option.userId === value;
                return (
                  <button
                    key={option.userId}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelect(option.userId)}
                    className={cn(
                      "flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left transition-colors hover:bg-muted focus-visible:bg-muted focus-visible:outline-hidden",
                      isSelected ? "bg-muted font-medium text-foreground" : "text-foreground",
                    )}
                  >
                    <div className="flex flex-col min-w-0 pr-2">
                      <span className="truncate text-xs font-medium text-foreground">
                        {option.name || "Unnamed member"}
                      </span>
                      <span className="truncate text-[11px] text-muted-foreground">
                        {option.email}
                      </span>
                    </div>
                    {isSelected && <Check className="size-3.5 text-primary shrink-0" />}
                  </button>
                );
              })}

              {options.length === 0 ? (
                <p className="px-2 py-3 text-center text-[11px] text-muted-foreground">
                  {emptyMessage}
                </p>
              ) : matchingOptions.length === 0 ? (
                <p className="px-2 py-3 text-center text-[11px] text-muted-foreground">
                  No matching {label.toLocaleLowerCase()} found.
                </p>
              ) : null}
            </div>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
