"use client";

import { useEffect, useRef } from "react";
import { AlertCircle, ArchiveX, ShieldAlert, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { calculateSerialNumber } from "@/lib/serial-number";
import { formatFileSize } from "@/lib/format-file-size";

import type {
  StorageCleanupCandidate,
  StorageCleanupFilter,
  StorageCleanupPagination,
} from "./storage-cleanup.types";

export type StorageCleanupTableProps = {
  errorMessage?: string;
  filter: StorageCleanupFilter;
  hasSearch: boolean;
  isError: boolean;
  isLoading: boolean;
  isPermissionDenied?: boolean;
  items: StorageCleanupCandidate[];
  onDeleteCandidate: (candidate: StorageCleanupCandidate) => void;
  onPageChange: (newPage: number) => void;
  onRetry?: () => void;
  onToggleAllEligibleOnPage: () => void;
  onToggleCandidateSelection: (finalAssetId: string) => void;
  pagination?: StorageCleanupPagination;
  selectedFinalAssetIds: string[];
};

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

export function StorageCleanupTable({
  errorMessage,
  filter,
  hasSearch,
  isError,
  isLoading,
  isPermissionDenied = false,
  items,
  onDeleteCandidate,
  onPageChange,
  onRetry,
  onToggleAllEligibleOnPage,
  onToggleCandidateSelection,
  pagination,
  selectedFinalAssetIds,
}: StorageCleanupTableProps) {
  const selectAllRef = useRef<HTMLInputElement>(null);

  // Eligible items on current page
  const eligibleItemsOnPage = items.filter(
    (item) => item.storageDeletedAt === null,
  );
  const eligibleIdsOnPage = eligibleItemsOnPage.map((item) => item.finalAssetId);

  const selectedEligibleCountOnPage = eligibleIdsOnPage.filter((id) =>
    selectedFinalAssetIds.includes(id),
  ).length;

  const areAllEligibleSelectedOnPage =
    eligibleIdsOnPage.length > 0 &&
    selectedEligibleCountOnPage === eligibleIdsOnPage.length;

  const hasSomeEligibleSelectedOnPage =
    selectedEligibleCountOnPage > 0 && !areAllEligibleSelectedOnPage;

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = hasSomeEligibleSelectedOnPage;
    }
  }, [hasSomeEligibleSelectedOnPage]);

  // Loading State
  if (isLoading) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 shadow-xs">
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={`table-skeleton-${i}`}
              className="h-14 w-full animate-pulse rounded-lg bg-muted/60"
            />
          ))}
        </div>
      </div>
    );
  }

  // Permission Denied State (403)
  if (isPermissionDenied) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-destructive/20 bg-destructive/5 p-8 text-center">
        <ShieldAlert className="size-8 text-destructive" />
        <h3 className="mt-2 text-sm font-semibold text-foreground">
          Admin Permission Required
        </h3>
        <p className="mt-1 text-xs text-muted-foreground max-w-sm">
          You do not have permission to manage storage for this workspace. Only workspace administrators can perform storage cleanup.
        </p>
      </div>
    );
  }

  // Error State
  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-destructive/20 bg-destructive/5 p-8 text-center">
        <AlertCircle className="size-8 text-destructive" />
        <h3 className="mt-2 text-sm font-semibold text-foreground">
          Failed to load storage packages
        </h3>
        <p className="mt-1 text-xs text-muted-foreground max-w-sm">
          {errorMessage ?? "An error occurred while fetching listed storage assets."}
        </p>
        {onRetry && (
          <Button className="mt-4" onClick={onRetry} size="xs" variant="outline">
            Retry
          </Button>
        )}
      </div>
    );
  }

  // Empty State
  if (items.length === 0) {
    if (pagination && pagination.total > 0 && pagination.page > 1) {
      return (
        <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card p-12 text-center shadow-xs">
          <ArchiveX className="size-10 text-muted-foreground/60" />
          <h3 className="mt-3 text-sm font-semibold text-foreground">
            No items on this page.
          </h3>
          <p className="mt-1 text-xs text-muted-foreground max-w-sm">
            {pagination.total} listed package{pagination.total === 1 ? "" : "s"} available on earlier pages.
          </p>
          <Button
            className="mt-4"
            onClick={() => onPageChange(Math.max(1, pagination.totalPages))}
            size="xs"
            variant="outline"
          >
            Go to page {Math.max(1, pagination.totalPages)}
          </Button>
        </div>
      );
    }

    let emptyMessage = "No listed Final ZIP packages found.";
    if (hasSearch) {
      emptyMessage = "No matching items.";
    } else if (filter === "ELIGIBLE") {
      emptyMessage = "No listed ZIP packages are currently available for manual cleanup.";
    } else if (filter === "CLEANED") {
      emptyMessage = "No Final ZIP packages have been cleaned up yet.";
    }

    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card p-12 text-center shadow-xs">
        <ArchiveX className="size-10 text-muted-foreground/60" />
        <h3 className="mt-3 text-sm font-semibold text-foreground">
          {emptyMessage}
        </h3>
        <p className="mt-1 text-xs text-muted-foreground max-w-sm">
          {hasSearch
            ? "Try adjusting your search query to find the listed package."
            : filter === "ELIGIBLE"
              ? "When listings are published with production ZIPs, they will appear here for manual reclaim."
              : "Items will appear here once storage cleanup actions have been performed."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Table Container */}
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-border bg-muted/40 font-medium text-muted-foreground">
              <tr>
                {/* Checkbox Header */}
                <th className="w-10 px-3 py-3" scope="col">
                  <input
                    aria-label="Select all eligible items on this page"
                    checked={areAllEligibleSelectedOnPage}
                    className="size-4 accent-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    disabled={eligibleIdsOnPage.length === 0}
                    onChange={onToggleAllEligibleOnPage}
                    ref={selectAllRef}
                    type="checkbox"
                  />
                </th>

                {/* Serial Number */}
                <th className="w-12 px-3 py-3 text-center" scope="col">
                  <span className="sr-only">Row number</span>
                  <span aria-hidden="true">#</span>
                </th>

                {/* Etsy Item */}
                <th className="px-4 py-3 min-w-48" scope="col">
                  Etsy Item
                </th>

                {/* Final ZIP */}
                <th className="px-4 py-3 min-w-44" scope="col">
                  Final ZIP
                </th>

                {/* Size */}
                <th className="px-4 py-3 min-w-24" scope="col">
                  Size
                </th>

                {/* Listed Date */}
                <th className="px-4 py-3 min-w-28" scope="col">
                  Listed
                </th>

                {/* Storage Status */}
                <th className="px-4 py-3 min-w-32" scope="col">
                  Storage Status
                </th>

                {/* Actions */}
                <th className="px-4 py-3 text-right min-w-24" scope="col">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {items.map((item, index) => {
                const isCleaned = item.storageDeletedAt !== null;
                const isSelected = selectedFinalAssetIds.includes(item.finalAssetId);

                return (
                  <tr
                    className="hover:bg-muted/20 transition-colors"
                    key={item.finalAssetId}
                  >
                    {/* Checkbox */}
                    <td className="px-3 py-3">
                      {!isCleaned ? (
                        <input
                          aria-label={`Select ${item.title || `listing item ${item.etsyListingId}`}`}
                          checked={isSelected}
                          className="size-4 accent-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          onChange={() => onToggleCandidateSelection(item.finalAssetId)}
                          type="checkbox"
                        />
                      ) : (
                        <span className="inline-block size-4" />
                      )}
                    </td>

                    {/* Row Number */}
                    <td className="w-12 px-3 py-3 text-center font-mono text-[11px] font-medium text-foreground/70 tabular-nums">
                      {calculateSerialNumber(index, pagination)}
                    </td>

                    {/* Etsy Item */}
                    <td className="px-4 py-3">
                      <div className="flex flex-col max-w-sm">
                        <span
                          className="font-medium text-foreground line-clamp-1"
                          title={item.title || "Untitled listing item"}
                        >
                          {item.title || "Untitled listing item"}
                        </span>
                        <span className="font-mono text-[11px] text-muted-foreground mt-0.5">
                          ID: {item.etsyListingId}
                        </span>
                      </div>
                    </td>

                    {/* Final ZIP File Name */}
                    <td className="px-4 py-3">
                      <span
                        className="font-mono text-[11px] text-foreground/90 line-clamp-1"
                        title={item.fileName}
                      >
                        {item.fileName}
                      </span>
                    </td>

                    {/* Size */}
                    <td className="px-4 py-3">
                      <span className="font-medium text-foreground tabular-nums">
                        {formatFileSize(item.fileSize)}
                      </span>
                    </td>

                    {/* Listed Date */}
                    <td className="px-4 py-3 text-muted-foreground">
                      <span className="text-[11px] tabular-nums">
                        {formatDate(item.listedAt)}
                      </span>
                    </td>

                    {/* Storage Status */}
                    <td className="px-4 py-3">
                      {!isCleaned ? (
                        <StatusBadge
                          label="Active in Storage"
                          tone="info"
                        />
                      ) : (
                        <StatusBadge
                          label="Cleaned Up"
                          tone="neutral"
                        />
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3 text-right">
                      {!isCleaned ? (
                        <Button
                          className="h-7 px-2.5 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive gap-1"
                          onClick={() => onDeleteCandidate(item)}
                          size="xs"
                          type="button"
                          variant="ghost"
                        >
                          <Trash2 className="size-3" />
                          <span>Delete ZIP</span>
                        </Button>
                      ) : (
                        <span className="text-muted-foreground/40 text-[11px] select-none pr-3">
                          —
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Footer */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between px-2 text-xs text-muted-foreground">
          <p>
            Showing {(pagination.page - 1) * pagination.limit + 1}–
            {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
            {pagination.total} listed packages
          </p>
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <Button
              disabled={pagination.page <= 1}
              onClick={() => onPageChange(pagination.page - 1)}
              size="xs"
              variant="outline"
            >
              Previous
            </Button>
            <span className="px-2 text-xs font-medium text-foreground">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <Button
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => onPageChange(pagination.page + 1)}
              size="xs"
              variant="outline"
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
