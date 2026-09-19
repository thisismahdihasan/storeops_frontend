"use client";

import { useEffect, useRef, useState } from "react";
import { AlertCircle, ExternalLink, ImageIcon, Tag } from "lucide-react";

import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { MemberIdentityCell } from "@/components/ui/member-identity-cell";
import { ResearchItemDetailModal } from "@/features/research/research-item-detail-modal";
import { calculateSerialNumber } from "@/lib/serial-number";
import type { AdminListingItem, AdminListingListResult } from "./listings-admin.types";
import type { ResearchStatus } from "@/features/research/research.types";

export type ListingsAdminTableProps = {
  data?: AdminListingListResult;
  emptyStateTitle?: string;
  eligibleResearchItemIds: string[];
  hasActiveFilters: boolean;
  isError: boolean;
  isLoading: boolean;
  onToggleAllEligible: () => void;
  onToggleSelection: (researchItemId: string) => void;
  canAssignListers: boolean;
  onAssignLister: (item: AdminListingItem) => void;
  onPageChange: (newPage: number) => void;
  onResetFilters: () => void;
  onRetry: () => void;
  selectedResearchItemIds: string[];
  workspaceId: string;
};

function formatStatus(status: ResearchStatus): {
  label: string;
  tone: "danger" | "info" | "neutral" | "success" | "warning";
} {
  switch (status) {
    case "READY_FOR_LISTING":
      return { label: "Ready for Listing", tone: "info" };
    case "LISTING_IN_PROGRESS":
      return { label: "Listing In Progress", tone: "warning" };
    case "LISTED":
      return { label: "Listed", tone: "success" };
    default:
      return { label: status, tone: "neutral" };
  }
}

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

export function ListingsAdminTable({
  data,
  emptyStateTitle,
  eligibleResearchItemIds,
  hasActiveFilters,
  isError,
  isLoading,
  onToggleAllEligible,
  onToggleSelection,
  canAssignListers,
  onAssignLister,
  onPageChange,
  onResetFilters,
  onRetry,
  selectedResearchItemIds,
  workspaceId,
}: ListingsAdminTableProps) {
  const [selectedDetailItemId, setSelectedDetailItemId] = useState<string | null>(null);
  const selectAllRef = useRef<HTMLInputElement>(null);
  const selectedEligibleCount = eligibleResearchItemIds.filter((itemId) =>
    selectedResearchItemIds.includes(itemId),
  ).length;
  const hasSelectedEligibleItems = selectedEligibleCount > 0;
  const areAllEligibleItemsSelected =
    eligibleResearchItemIds.length > 0 &&
    selectedEligibleCount === eligibleResearchItemIds.length;

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate =
        hasSelectedEligibleItems && !areAllEligibleItemsSelected;
    }
  }, [areAllEligibleItemsSelected, hasSelectedEligibleItems]);

  if (isLoading) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 shadow-xs">
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={`skeleton-${i}`}
              className="h-14 w-full animate-pulse rounded-lg bg-muted/60"
            />
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-destructive/20 bg-destructive/5 p-8 text-center">
        <AlertCircle className="size-8 text-destructive" />
        <h3 className="mt-2 text-sm font-semibold text-foreground">
          Failed to load listing operations
        </h3>
        <p className="mt-1 text-xs text-muted-foreground">
          An error occurred while fetching the listing inventory.
        </p>
        <Button size="xs" variant="outline" onClick={onRetry} className="mt-4">
          Retry
        </Button>
      </div>
    );
  }

  const items = data?.items ?? [];
  const pagination = data?.pagination;

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card p-12 text-center shadow-xs">
        <Tag className="size-10 text-muted-foreground/60" />
        <h3 className="mt-3 text-sm font-semibold text-foreground">
          {emptyStateTitle ??
            (hasActiveFilters
              ? "No listing items match these filters."
              : "No listing operations recorded.")}
        </h3>
        <p className="mt-1 text-xs text-muted-foreground max-w-sm">
          {hasActiveFilters
            ? "Try broadening your search term or adjusting status/lister filters."
            : "Items will appear here once approved designs are ready for listing."}
        </p>
        {hasActiveFilters && (
          <Button
            size="xs"
            variant="outline"
            onClick={onResetFilters}
            className="mt-4"
          >
            Clear Filters
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-border bg-muted/40 font-medium text-muted-foreground">
              <tr>
                {canAssignListers && (
                  <th className="w-10 px-3 py-3">
                    <input
                      aria-label="Select all eligible listing items on this page"
                      checked={areAllEligibleItemsSelected}
                      className="size-4 accent-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      disabled={eligibleResearchItemIds.length === 0}
                      onChange={onToggleAllEligible}
                      ref={selectAllRef}
                      type="checkbox"
                    />
                  </th>
                )}
                <th className="w-12 px-3 py-3 text-center" scope="col">
                  <span className="sr-only">Row number</span>
                  <span aria-hidden="true">#</span>
                </th>
                <th className="px-4 py-3 w-14">Reference</th>
                <th className="px-4 py-3 min-w-48">Etsy Listing / Title</th>
                <th className="px-4 py-3 min-w-36">Lister</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 min-w-28">Listed / Activity</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {items.map((item: AdminListingItem, index: number) => {
                const statusMeta = formatStatus(item.status);
                const publishedUrl = item.listingResult?.etsyListingUrl;
                const canAssignLister =
                  canAssignListers &&
                  item.status === "READY_FOR_LISTING" &&
                  item.currentAssignment === null;
                const isSelected = selectedResearchItemIds.includes(item.id);
                const isSelectionEligible = eligibleResearchItemIds.includes(item.id);

                return (
                  <tr
                    key={item.id}
                    className="hover:bg-muted/20 transition-colors"
                  >
                    {canAssignListers && (
                      <td className="px-3 py-3">
                        {isSelectionEligible && (
                          <input
                            aria-label={`Select ${item.title || `listing item ${item.etsyListingId}`}`}
                            checked={isSelected}
                            className="size-4 accent-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            onChange={() => onToggleSelection(item.id)}
                            type="checkbox"
                          />
                        )}
                      </td>
                    )}
                    {/* Row Number */}
                    <td className="w-12 px-3 py-3 text-center font-mono text-[11px] font-medium text-foreground/70 tabular-nums">
                      {calculateSerialNumber(index, pagination)}
                    </td>
                    {/* Reference Thumbnail */}
                    <td className="px-4 py-3">
                      {item.referenceImageUrl ? (
                        <div className="size-10 overflow-hidden rounded-md border border-border bg-muted">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={item.referenceImageUrl}
                            alt=""
                            className="size-full object-cover"
                            loading="lazy"
                          />
                        </div>
                      ) : (
                        <div className="flex size-10 items-center justify-center rounded-md border border-dashed border-border bg-muted/40">
                          <ImageIcon className="size-4 text-muted-foreground" />
                        </div>
                      )}
                    </td>

                    {/* Listing Title & ID */}
                    <td className="px-4 py-3">
                      <div className="flex flex-col max-w-sm">
                        <button
                          type="button"
                          onClick={() => setSelectedDetailItemId(item.id)}
                          className="font-medium text-foreground line-clamp-1 text-left hover:underline"
                        >
                          {item.title || "Untitled listing item"}
                        </button>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="font-mono text-[11px] text-muted-foreground">
                            ID: {item.etsyListingId}
                          </span>
                          {item.originalUrl && (
                            <a
                              href={item.originalUrl}
                              target="_blank"
                              rel="noreferrer noopener"
                              className="text-[11px] text-primary hover:underline inline-flex items-center gap-0.5"
                              title="Open original Etsy reference"
                            >
                              <span>Ref</span>
                              <ExternalLink className="size-2.5" />
                            </a>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Assigned Lister */}
                    <td className="px-4 py-3">
                      {item.currentLister ? (
                        <MemberIdentityCell
                          email={item.currentLister.email}
                          fallbackLabel="Unnamed Lister"
                          href={`/w/${workspaceId}/listings?listerId=${item.currentLister.id}`}
                          name={item.currentLister.name}
                          profileImageUrl={item.currentLister.profileImageUrl}
                        />
                      ) : (
                        <span className="text-muted-foreground italic">
                          Unassigned
                        </span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      <StatusBadge
                        label={statusMeta.label}
                        tone={statusMeta.tone}
                      />
                    </td>

                    {/* Activity Date */}
                    <td className="px-4 py-3 text-muted-foreground">
                      <div className="flex flex-col text-[11px]">
                        {item.listingResult?.listedAt ? (
                          <span className="font-medium text-foreground">
                            Listed {formatDate(item.listingResult.listedAt)}
                          </span>
                        ) : (
                          <span>Updated {formatDate(item.updatedAt)}</span>
                        )}
                        {item.currentAssignment?.assignedAt && (
                          <span className="text-[10px] text-muted-foreground/80">
                            Assigned {formatDate(item.currentAssignment.assignedAt)}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Operational Actions */}
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex items-center gap-1.5 justify-end">
                        <Button
                          size="xs"
                          variant="ghost"
                          onClick={() => setSelectedDetailItemId(item.id)}
                          className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                        >
                          Details
                        </Button>
                        {canAssignLister && (
                          <Button
                            size="xs"
                            variant="ghost"
                            onClick={() => onAssignLister(item)}
                            className="h-7 px-2 text-xs"
                          >
                            Assign Lister
                          </Button>
                        )}
                        {publishedUrl ? (
                          <a
                            href={publishedUrl}
                            target="_blank"
                            rel="noreferrer noopener"
                            className="inline-flex items-center gap-1 rounded-md border border-input bg-background px-2.5 py-1 text-xs font-medium text-primary hover:bg-muted transition-colors"
                            title="Open published listing"
                          >
                            <span>Published</span>
                            <ExternalLink className="size-3" />
                          </a>
                        ) : null}
                      </div>
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
        <div className="flex items-center justify-between px-2 text-xs text-muted-foreground">
          <p>
            Showing {(pagination.page - 1) * pagination.limit + 1}–
            {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
            {pagination.total} listing items
          </p>
          <div className="flex items-center gap-1">
            <Button
              size="xs"
              variant="outline"
              disabled={pagination.page <= 1}
              onClick={() => onPageChange(pagination.page - 1)}
            >
              Previous
            </Button>
            <span className="px-2 text-xs font-medium text-foreground">
              {pagination.page} / {pagination.totalPages}
            </span>
            <Button
              size="xs"
              variant="outline"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => onPageChange(pagination.page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      <ResearchItemDetailModal
        open={Boolean(selectedDetailItemId)}
        onClose={() => setSelectedDetailItemId(null)}
        researchItemId={selectedDetailItemId}
        workspaceId={workspaceId}
        isManagementContext={true}
        userRoles={["ADMIN"]}
      />
    </div>
  );
}
