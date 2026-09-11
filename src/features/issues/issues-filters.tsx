"use client";

import { useEffect, useState } from "react";
import { Search, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { Input } from "@/components/ui/input";

type IssuesFiltersProps = {
  search: string | undefined;
};

export function IssuesFilters({ search }: IssuesFiltersProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchInput, setSearchInput] = useState(search ?? "");
  const [previousSearch, setPreviousSearch] = useState(search);

  if (search !== previousSearch) {
    setPreviousSearch(search);
    setSearchInput(search ?? "");
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const nextSearch = searchInput.trim();
      const currentSearch = searchParams.get("search") ?? "";

      if (nextSearch === currentSearch) return;

      const nextParams = new URLSearchParams(searchParams.toString());
      if (nextSearch) {
        nextParams.set("search", nextSearch);
      } else {
        nextParams.delete("search");
      }
      nextParams.delete("page");
      const query = nextParams.toString();
      router.push(query ? `${pathname}?${query}` : pathname);
    }, 400);

    return () => window.clearTimeout(timer);
  }, [pathname, router, searchInput, searchParams]);

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-xs">
      <label className="relative block" htmlFor="issues-search">
        <Search className="absolute top-2.5 left-2.5 size-4 text-muted-foreground" />
        <Input
          className="pl-9 pr-8 text-xs"
          id="issues-search"
          onChange={(event) => setSearchInput(event.target.value)}
          placeholder="Search by title, listing ID, or Etsy URL..."
          value={searchInput}
        />
        {searchInput && (
          <button
            className="absolute top-2.5 right-2.5 text-muted-foreground transition-colors hover:text-foreground"
            onClick={() => setSearchInput("")}
            title="Clear search"
            type="button"
          >
            <X className="size-4" />
            <span className="sr-only">Clear search</span>
          </button>
        )}
      </label>
    </div>
  );
}
