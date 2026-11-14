"use client";

import { Button } from "@/components/ui/button";
import type { ListerHistoryResponse } from "@/features/role-activity/role-activity.types";

type Pagination = ListerHistoryResponse["data"]["pagination"];
type PageItem = number | "ellipsis";

function pageItems(current: number, total: number): PageItem[] {
  const pages = new Set([1, 2, total, current - 2, current - 1, current, current + 1, current + 2]);
  const visible = [...pages].filter((page) => page >= 1 && page <= total).sort((a, b) => a - b);
  const items: PageItem[] = [];
  for (const page of visible) {
    const previous = items.at(-1);
    if (typeof previous === "number" && page - previous === 2) items.push(previous + 1);
    else if (typeof previous === "number" && page - previous > 2) items.push("ellipsis");
    items.push(page);
  }
  return items;
}

export function ListingHistoryPagination({ onPageChange, pagination }: { onPageChange: (page: number) => void; pagination: Pagination }) {
  const { page, totalPages } = pagination;
  if (totalPages <= 1) return null;
  return <nav aria-label="Completed listings pagination" className="flex flex-wrap items-center justify-center gap-1.5 rounded-xl border border-border bg-card p-3">
    <Button aria-label="Previous page" className="h-8 px-2.5" disabled={page <= 1} onClick={() => onPageChange(page - 1)} size="sm" type="button" variant="outline">Previous</Button>
    {pageItems(page, totalPages).map((item, index) => item === "ellipsis"
      ? <span aria-hidden="true" className="px-1 text-xs text-muted-foreground" key={`ellipsis-${index}`}>…</span>
      : <Button aria-current={item === page ? "page" : undefined} aria-label={item === page ? `Page ${item}, current page` : `Go to page ${item}`} className={item === page ? "h-8 min-w-8 border-primary bg-primary px-2 text-primary-foreground hover:bg-primary/85" : "h-8 min-w-8 px-2"} key={item} onClick={() => item !== page && onPageChange(item)} size="sm" type="button" variant={item === page ? "default" : "outline"}>{item}</Button>)}
    <Button aria-label="Next page" className="h-8 px-2.5" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)} size="sm" type="button" variant="outline">Next</Button>
  </nav>;
}
