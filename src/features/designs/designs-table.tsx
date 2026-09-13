"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertCircle, ArrowUpRight, CheckSquare, ExternalLink, ImageIcon, Palette } from "lucide-react";

import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { ResearchItemDetailModal } from "@/features/research/research-item-detail-modal";
import type { AdminDesignItem, AdminDesignListResult } from "./designs.types";
import type { ResearchStatus } from "@/features/research/research.types";

export type DesignsTableProps = {
  data?: AdminDesignListResult;
  emptyStateTitle?: string;
  hasActiveFilters: boolean;
  isError: boolean;
  isLoading: boolean;
  onPageChange: (newPage: number) => void;
  onResetFilters: () => void;
  onRetry: () => void;
  workspaceId: string;
};

function formatStatus(status: ResearchStatus): {
  label: string;
  tone: "danger" | "info" | "neutral" | "success" | "warning";
} {
  switch (status) {
    case "ASSIGNED":
      return { label: "Assigned", tone: "neutral" };
    case "DESIGN_IN_PROGRESS":
      return { label: "Designing", tone: "info" };
    case "DESIGN_REVIEW":
      return { label: "Waiting Review", tone: "warning" };
    case "CORRECTION_NEEDED":
      return { label: "Correction Needed", tone: "danger" };
    case "ISSUE_REPORTED":
      return { label: "Issue Reported", tone: "danger" };
    case "DESIGN_APPROVED":
      return { label: "Approved", tone: "success" };
    case "READY_FOR_LISTING":
      return { label: "Ready for Listing", tone: "success" };
    case "LISTING_IN_PROGRESS":
      return { label: "Listing", tone: "info" };
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

export function DesignsTable({
  data,
  emptyStateTitle,
  hasActiveFilters,
  isError,
  isLoading,
  onPageChange,
  onResetFilters,
  onRetry,
  workspaceId,
}: DesignsTableProps) {
  const [selectedDetailItemId, setSelectedDetailItemId] = useState<string | null>(null);

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
          Failed to load design operations
        </h3>
        <p className="mt-1 text-xs text-muted-foreground">
          An error occurred while fetching the design inventory.
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
        <Palette className="size-10 text-muted-foreground/60" />
        <h3 className="mt-3 text-sm font-semibold text-foreground">
          {emptyStateTitle ??
            (hasActiveFilters
              ? "No design items match these filters."
              : "No design operations recorded.")}
        </h3>
        <p className="mt-1 text-xs text-muted-foreground max-w-sm">
          {hasActiveFilters
            ? "Try broadening your search term or adjusting status/designer filters."
            : "Designs will appear here once research items are assigned to designers."}
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
                <th className="px-4 py-3 w-14">Reference</th>
                <th className="px-4 py-3 min-w-48">Etsy Listing / Title</th>
                <th className="px-4 py-3 min-w-36">Designer</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 min-w-28">Activity</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {items.map((item: AdminDesignItem) => {
                const statusMeta = formatStatus(item.status);
                const hasReview = Boolean(item.latestReview);
                const isWaitingReview = item.status === "DESIGN_REVIEW";

                return (
                  <tr
                    key={item.id}
                    className="hover:bg-muted/20 transition-colors"
                  >
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
                          {item.title || "Untitled design job"}
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
                              title="Open original Etsy listing"
                            >
                              <span>Etsy</span>
                              <ExternalLink className="size-2.5" />
                            </a>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Assigned Designer */}
                    <td className="px-4 py-3">
                      {item.currentDesigner ? (
                        <div className="flex flex-col">
                          <Link
                            href={`/w/${workspaceId}/designs?designerId=${item.currentDesigner.id}`}
                            className="font-medium text-foreground hover:underline"
                          >
                            {item.currentDesigner.name || "Unnamed Designer"}
                          </Link>
                          <span className="text-[11px] text-muted-foreground">
                            {item.currentDesigner.email}
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground italic">
                          Unassigned
                        </span>
                      )}
                    </td>

                    {/* Status & Indicators */}
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1 items-start">
                        <StatusBadge
                          label={statusMeta.label}
                          tone={statusMeta.tone}
                        />
                        {item.latestReview && (
                          <span className="text-[10px] text-muted-foreground">
                            Round {item.latestReview.roundNumber}
                          </span>
                        )}
                        {item.status === "ISSUE_REPORTED" && item.latestIssueReport && (
                          <span
                            className="inline-flex items-center gap-1 text-[10px] text-destructive font-medium"
                            title={item.latestIssueReport.details ?? undefined}
                          >
                            <AlertCircle className="size-2.5" />
                            <span>{item.latestIssueReport.reason}</span>
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Activity Date */}
                    <td className="px-4 py-3 text-muted-foreground">
                      <div className="flex flex-col text-[11px]">
                        <span>Updated {formatDate(item.updatedAt)}</span>
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
                        {isWaitingReview && item.latestReview ? (
                          <Link
                            href={`/w/${workspaceId}/reviews/${item.latestReview.id}`}
                            className="inline-flex items-center gap-1 rounded-md bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                          >
                            <CheckSquare className="size-3" />
                            <span>Review</span>
                          </Link>
                        ) : hasReview && item.latestReview ? (
                          <Link
                            href={`/w/${workspaceId}/reviews/${item.latestReview.id}`}
                            className="inline-flex items-center gap-1 rounded-md border border-input bg-background px-2.5 py-1 text-xs font-medium text-foreground hover:bg-muted transition-colors"
                          >
                            <span>View Review</span>
                            <ArrowUpRight className="size-3 text-muted-foreground" />
                          </Link>
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
            {pagination.total} design items
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
