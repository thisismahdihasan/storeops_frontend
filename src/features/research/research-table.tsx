"use client";

import Link from "next/link";
import { useState } from "react";
import {
  AlertCircle,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Download,
  ExternalLink,
  Eye,
  Loader2,
  MessageSquare,
  Pencil,
  Plus,
  RefreshCw,
  Search,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import type { WorkspaceRole } from "@/features/workspace/workspace.types";
import { ReferencePreview } from "./reference-preview";
import { downloadResearchReferenceImage } from "./research.api";
import type {
  ResearchItemListItem,
  ResearchListResult,
  ResearchStatus,
} from "./research.types";

export type ResearchTableProps = {
  data?: ResearchListResult;
  hasActiveFilters: boolean;
  isError: boolean;
  isLoading: boolean;
  onOpenAddModal: () => void;
  onOpenDetail: (researchItemId: string) => void;
  onPageChange: (newPage: number) => void;
  onResetFilters: () => void;
  onRetry: () => void;
  userRoles: WorkspaceRole[];
  workspaceId: string;
};

function getStatusTone(
  status: ResearchStatus
): "danger" | "info" | "neutral" | "success" | "warning" {
  switch (status) {
    case "CORRECTION_NEEDED":
      return "warning";
    case "ISSUE_REPORTED":
      return "danger";
    case "DESIGN_APPROVED":
    case "LISTED":
      return "success";
    case "DESIGN_IN_PROGRESS":
    case "DESIGN_REVIEW":
    case "READY_FOR_LISTING":
    case "LISTING_IN_PROGRESS":
      return "info";
    default:
      return "neutral";
  }
}

function formatStatusLabel(status: ResearchStatus): string {
  return status
    .split("_")
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(" ");
}

export function ResearchTable({
  data,
  hasActiveFilters,
  isError,
  isLoading,
  onOpenAddModal,
  onOpenDetail,
  onPageChange,
  onResetFilters,
  onRetry,
  userRoles,
  workspaceId,
}: ResearchTableProps) {
  const isAdmin = userRoles.includes("ADMIN");
  const canCreate = userRoles.includes("RESEARCHER");

  if (isLoading) {
    return <TableSkeleton isAdmin={isAdmin} />;
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card p-10 text-center shadow-xs">
        <AlertCircle className="size-8 text-destructive" />
        <h3 className="mt-3 text-sm font-semibold text-foreground">
          Failed to load research items
        </h3>
        <p className="mt-1 text-xs text-muted-foreground">
          A server or network error occurred while retrieving research queue data.
        </p>
        <Button size="xs" variant="outline" onClick={onRetry} className="mt-4 gap-1.5">
          <RefreshCw className="size-3" />
          <span>Retry</span>
        </Button>
      </div>
    );
  }

  const items = data?.items ?? [];
  const pagination = data?.pagination;

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card p-12 text-center shadow-xs">
        <Search className="size-10 text-muted-foreground/60" />
        {hasActiveFilters ? (
          <>
            <h3 className="mt-3 text-sm font-semibold text-foreground">
              No matching research items
            </h3>
            <p className="mt-1 text-xs text-muted-foreground max-w-sm">
              No items match your active search, status, or date filters.
            </p>
            <Button
              size="xs"
              variant="outline"
              onClick={onResetFilters}
              className="mt-4"
            >
              Clear Filters
            </Button>
          </>
        ) : (
          <>
            <h3 className="mt-3 text-sm font-semibold text-foreground">
              No research items yet
            </h3>
            <p className="mt-1 text-xs text-muted-foreground max-w-sm">
              {canCreate
                ? "Start discovering and queuing product ideas by adding Etsy listing URLs."
                : "No research items have been added to this workspace yet."}
            </p>
            {canCreate && (
              <Button size="sm" onClick={onOpenAddModal} className="mt-4 gap-1.5">
                <Plus className="size-4" />
                <span>Add First Research Item</span>
              </Button>
            )}
          </>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/30 font-medium text-muted-foreground">
                <th scope="col" className="w-16 px-3 py-3">
                  Reference
                </th>
                <th scope="col" className="px-4 py-3">
                  Etsy Listing / Title
                </th>
                {isAdmin && (
                  <th scope="col" className="px-4 py-3">
                    Researcher
                  </th>
                )}
                <th scope="col" className="px-4 py-3">
                  Added
                </th>
                {isAdmin && (
                  <th scope="col" className="px-4 py-3">
                    Status
                  </th>
                )}
                {isAdmin && (
                  <th scope="col" className="px-4 py-3">
                    Designer
                  </th>
                )}
                <th scope="col" className="px-4 py-3 text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {items.map((item) => (
                <ResearchTableRow
                  key={item.id}
                  item={item}
                  onOpenDetail={onOpenDetail}
                  userCanUpload={canCreate}
                  userRoles={userRoles}
                  workspaceId={workspaceId}
                />
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination controls */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex flex-col items-center justify-between gap-3 border-t border-border px-4 py-3 text-xs text-muted-foreground sm:flex-row">
            <span>
              Showing {items.length} of {pagination.total} items
            </span>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="xs"
                disabled={pagination.page <= 1}
                onClick={() => onPageChange(pagination.page - 1)}
                className="h-7 gap-1 px-2 text-xs"
              >
                <ChevronLeft className="size-3.5" />
                <span>Previous</span>
              </Button>

              <span className="px-2 font-medium text-foreground">
                Page {pagination.page} of {pagination.totalPages}
              </span>

              <Button
                variant="outline"
                size="xs"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => onPageChange(pagination.page + 1)}
                className="h-7 gap-1 px-2 text-xs"
              >
                <span>Next</span>
                <ChevronRight className="size-3.5" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ResearchTableRow({
  item,
  onOpenDetail,
  userCanUpload,
  userRoles,
  workspaceId,
}: {
  item: ResearchItemListItem;
  onOpenDetail: (id: string) => void;
  userCanUpload: boolean;
  userRoles: WorkspaceRole[];
  workspaceId: string;
}) {
  const [isDownloading, setIsDownloading] = useState(false);

  const { designerReplyCount, latestReviewId } = item.reviewActivity ?? {
    designerReplyCount: 0,
    latestDesignerReplyAt: null,
    latestReviewId: null,
  };
  const isAdmin = userRoles.includes("ADMIN");
  const canClickReview = isAdmin && Boolean(latestReviewId);
  const replyCountLabel = `${designerReplyCount} Designer ${designerReplyCount === 1 ? "reply" : "replies"}`;
  const replyCountTooltip = `${replyCountLabel} on review annotations`;

  const handleDownload = async () => {
    if (!item.referenceImageUrl) return;
    setIsDownloading(true);
    try {
      await downloadResearchReferenceImage(workspaceId, item.id);
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Failed to download reference image."
      );
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <tr className="transition-colors hover:bg-muted/20">
      {/* Reference Thumbnail (Enlarged to size-12 / 48px) */}
      <td className="px-3 py-3">
        <ReferencePreview
          canDownload={isAdmin}
          referenceImageUrl={item.referenceImageUrl}
          title={item.title}
          researchItemId={item.id}
          workspaceId={workspaceId}
          normalizedUrl={item.normalizedUrl}
          onOpenDetail={() => onOpenDetail(item.id)}
          userCanUpload={userCanUpload}
        />
      </td>

      {/* Etsy Listing / Title */}
      <td className="max-w-xs px-4 py-3 sm:max-w-sm md:max-w-md">
        <div className="flex flex-col gap-1">
          <button
            type="button"
            onClick={() => onOpenDetail(item.id)}
            className="line-clamp-2 text-left font-medium text-foreground hover:underline"
          >
            {item.title || `Etsy Listing #${item.etsyListingId}`}
          </button>
          <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
            <span className="font-mono">#{item.etsyListingId}</span>
            {!isAdmin ? (
              <a
                href={item.normalizedUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`View listing #${item.etsyListingId} on Etsy`}
                className="inline-flex items-center gap-1 rounded-md border border-border/70 bg-muted/40 px-2 py-0.5 text-[11px] font-medium text-muted-foreground transition-colors hover:border-border hover:bg-muted hover:text-foreground"
              >
                <span>View on Etsy</span>
                <ExternalLink className="size-2.5" />
              </a>
            ) : (
              <a
                href={item.normalizedUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-0.5 hover:text-foreground"
                title="View on Etsy"
              >
                <span>Etsy</span>
                <ExternalLink className="size-2.5" />
              </a>
            )}
          </div>
        </div>
      </td>

      {/* Researcher (Admin only) */}
      {isAdmin && (
        <td className="px-4 py-3">
          <div className="flex flex-col">
            <span className="font-medium text-foreground">
              {item.createdBy.name || "Unnamed"}
            </span>
            <span className="text-[11px] text-muted-foreground">
              {item.createdBy.email}
            </span>
          </div>
        </td>
      )}

      {/* Added Date */}
      <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
        {new Date(item.createdAt).toLocaleDateString()}
      </td>

      {/* Status + Issue indicator (Admin only) */}
      {isAdmin && (
        <td className="px-4 py-3 whitespace-nowrap">
          <div className="flex flex-col items-start gap-1">
            <StatusBadge
              label={formatStatusLabel(item.status)}
              tone={getStatusTone(item.status)}
            />
            {item.status === "ISSUE_REPORTED" && item.latestIssueReport && (
              <span
                className="inline-flex items-center gap-1 text-[10px] text-destructive"
                title={`Issue: ${item.latestIssueReport.reason}`}
              >
                <AlertTriangle className="size-2.5" />
                <span>Issue reported</span>
              </span>
            )}
          </div>
        </td>
      )}

      {/* Designer (Admin only) */}
      {isAdmin && (
        <td className="px-4 py-3">
          {item.currentDesigner ? (
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-medium text-foreground">
                  {item.currentDesigner.name || "Unnamed"}
                </span>
                {designerReplyCount > 0 && (
                  canClickReview ? (
                    <Link
                      aria-label={replyCountLabel}
                      className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary transition-colors hover:bg-primary/20 hover:underline"
                      href={`/w/${workspaceId}/reviews/${latestReviewId}`}
                      onClick={(e) => e.stopPropagation()}
                      title={replyCountTooltip}
                    >
                      <MessageSquare className="size-2.5" />
                      <span>{designerReplyCount}</span>
                    </Link>
                  ) : (
                    <span
                      aria-label={replyCountLabel}
                      className="inline-flex items-center gap-1 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground"
                      title={replyCountTooltip}
                    >
                      <MessageSquare className="size-2.5" />
                      <span>{designerReplyCount}</span>
                    </span>
                  )
                )}
              </div>
              <span className="text-[11px] text-muted-foreground">
                {item.currentDesigner.email}
              </span>
            </div>
          ) : (
            <span className="text-[11px] text-muted-foreground italic">
              Unassigned
            </span>
          )}
        </td>
      )}

      {/* Actions */}
      <td className="px-4 py-3 text-right whitespace-nowrap">
        <div className="flex items-center justify-end gap-1.5">
          {isAdmin ? (
            <Button
              size="xs"
              variant="ghost"
              onClick={() => onOpenDetail(item.id)}
              title="Open Details"
              className="h-7 px-2 text-xs"
            >
              <Eye className="size-3" />
              <span>Open</span>
            </Button>
          ) : (
            <Button
              size="xs"
              variant="outline"
              onClick={() => onOpenDetail(item.id)}
              title="Edit Research Item"
              className="h-7 gap-1 px-2.5 text-xs font-medium "
            >
              <Pencil className="size-3" />
              <span>Edit</span>
            </Button>
          )}

          {/* Download Action (Admin only) */}
          {isAdmin && (
            <Button
              type="button"
              size="xs"
              variant="ghost"
              onClick={() => void handleDownload()}
              disabled={!item.referenceImageUrl || isDownloading}
              title={
                item.referenceImageUrl
                  ? "Download Reference Image"
                  : "No reference image available"
              }
              className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
            >
              {isDownloading ? (
                <Loader2 className="size-3 animate-spin" />
              ) : (
                <Download className="size-3" />
              )}
            </Button>
          )}
        </div>
      </td>
    </tr>
  );
}

function TableSkeleton({ isAdmin = true }: { isAdmin?: boolean }) {
  const columnCount = isAdmin ? 7 : 4;

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-xs">
      <div className="p-4 space-y-3">
        <div className="flex gap-4 border-b border-border/60 pb-3">
          {Array.from({ length: columnCount }).map((_, i) => (
            <div
              key={i}
              className="h-4 rounded-sm bg-muted animate-pulse flex-1"
            />
          ))}
        </div>
        {Array.from({ length: 6 }).map((_, r) => (
          <div key={r} className="flex gap-4 py-2">
            {Array.from({ length: columnCount }).map((_, c) => (
              <div
                key={c}
                className="h-6 rounded-sm bg-muted/60 animate-pulse flex-1"
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
