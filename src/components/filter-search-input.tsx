"use client";

import { Search, X } from "lucide-react";
import { useEffect, useState } from "react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type FilterSearchInputProps = {
  className?: string;
  debounceMs?: number;
  onSearch: (value: string) => void;
  placeholder?: string;
  value: string;
};

export function FilterSearchInput({ className, debounceMs = 350, onSearch, placeholder = "Search…", value }: FilterSearchInputProps) {
  const [draft, setDraft] = useState(value);
  const [previousValue, setPreviousValue] = useState(value);

  if (value !== previousValue) {
    setPreviousValue(value);
    setDraft(value);
  }

  useEffect(() => {
    if (draft === value) return;
    const timer = window.setTimeout(() => onSearch(draft), debounceMs);
    return () => window.clearTimeout(timer);
  }, [debounceMs, draft, onSearch, value]);

  return (
    <div className={cn("relative", className)}>
      <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input aria-label="Search" className="pr-9 pl-9" onChange={(event) => setDraft(event.target.value)} placeholder={placeholder} type="search" value={draft} />
      {draft && (
        <button aria-label="Clear search" className="absolute right-2 top-1/2 rounded-sm p-1 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring" onClick={() => setDraft("")} type="button">
          <X aria-hidden="true" className="size-3.5" />
        </button>
      )}
    </div>
  );
}
