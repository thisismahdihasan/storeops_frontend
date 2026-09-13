"use client";

import { Search } from "lucide-react";
import { useId, useMemo, useState } from "react";

import { Input } from "@/components/ui/input";

export type MemberFilterOption = {
  email: string;
  name: string | null;
  userId: string;
};

type MemberFilterSelectProps = {
  allLabel: string;
  emptyMessage: string;
  label: string;
  onValueChange: (userId: string | undefined) => void;
  options: MemberFilterOption[];
  value?: string;
};

function getMemberLabel(member: MemberFilterOption): string {
  return `${member.name || "Unnamed member"} — ${member.email}`;
}

export function MemberFilterSelect({
  allLabel,
  emptyMessage,
  label,
  onValueChange,
  options,
  value,
}: MemberFilterSelectProps) {
  const [search, setSearch] = useState("");
  const searchId = useId();
  const normalizedSearch = search.trim().toLocaleLowerCase();
  const matchingOptions = useMemo(
    () =>
      options.filter((option) => {
        if (!normalizedSearch) {
          return true;
        }

        return `${option.name ?? ""} ${option.email}`
          .toLocaleLowerCase()
          .includes(normalizedSearch);
      }),
    [normalizedSearch, options],
  );

  return (
    <div className="min-w-52 space-y-1">
      <label
        htmlFor={`${searchId}-select`}
        className="block text-[11px] font-medium text-muted-foreground"
      >
        {label}
      </label>
      <div className="relative">
        <Search className="pointer-events-none absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
        <Input
          id={searchId}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={`Search ${label.toLocaleLowerCase()} name or email`}
          className="h-8 pl-8 text-xs"
          aria-label={`Search ${label.toLocaleLowerCase()} by name or email`}
        />
      </div>
      <select
        id={`${searchId}-select`}
        value={value ?? ""}
        onChange={(event) => onValueChange(event.target.value || undefined)}
        className="h-8 w-full rounded-md border border-input bg-background px-2 text-xs text-foreground outline-hidden focus:ring-1 focus:ring-ring"
        aria-label={`Select ${label.toLocaleLowerCase()}`}
      >
        <option value="">{allLabel}</option>
        {matchingOptions.map((option) => (
          <option key={option.userId} value={option.userId}>
            {getMemberLabel(option)}
          </option>
        ))}
      </select>
      {options.length === 0 ? (
        <p className="text-[11px] text-muted-foreground">{emptyMessage}</p>
      ) : normalizedSearch && matchingOptions.length === 0 ? (
        <p className="text-[11px] text-muted-foreground">
          No matching {label.toLocaleLowerCase()} found.
        </p>
      ) : null}
    </div>
  );
}
