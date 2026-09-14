/* eslint-disable @next/next/no-img-element */
"use client";

import Link from "next/link";
import { useState } from "react";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Download,
  ExternalLink,
  Eye,
  ImageIcon,
  Loader2,
  MessageSquare,
  Paintbrush,
  Pencil,
  Trash2,
  Upload,
  User,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { StatusBadge, STATUS_TONE_TEXT_CLASSES } from "@/components/ui/status-badge";
import type { WorkspaceRole } from "@/features/workspace/workspace.types";
import { ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";
import { AuthenticatedReferenceImage } from "./authenticated-reference-image";
import { EditTitleDialog } from "./edit-title-dialog";
import { ReferenceImageUploadModal } from "./reference-image-upload-modal";
import { downloadResearchReferenceImage } from "./research.api";
import type { ResearchStatus } from "./research.types";
import { useDeleteResearchItem, useResearchItemDetail } from "./use-research";

type ResearchItemDetailModalProps = {
  isManagementContext?: boolean;
  onClose: () => void;
  open: boolean;
  researchItemId: string | null;
  userRoles?: WorkspaceRole[];
  workspaceId: string;
};

function getStatusTone(
  status: ResearchStatus,
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

export function ResearchItemDetailModal({
  isManagementContext = true,
  onClose,
  open,
  researchItemId,
  userRoles = [],
  workspaceId,
}: ResearchItemDetailModalProps) {
  const [isEditTitleOpen, setIsEditTitleOpen] = useState(false);
  const [isUploadImageOpen, setIsUploadImageOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const isAdmin = isManagementContext && userRoles.includes("ADMIN");
  const canManageImage =
    isAdmin || userRoles.includes("RESEARCHER");

  const detailQuery = useResearchItemDetail(
    workspaceId,
    researchItemId,
    open && Boolean(researchItemId),
  );

  const deleteMutation = useDeleteResearchItem(workspaceId);

  const item = detailQuery.data?.data.researchItem;

  const isEarlyStage =
    item?.status === "RESEARCHED" || item?.status === "ASSIGNED";

  const handleDownload = async () => {
    if (!researchItemId) return;
    setIsDownloading(true);
    try {
      await downloadResearchReferenceImage(workspaceId, researchItemId);
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Failed to download reference image.",
      );
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDelete = async () => {
    if (!researchItemId) return;
    setIsDeleting(true);

    try {
      await deleteMutation.mutateAsync(researchItemId);
      toast.success("Research item deleted successfully.");
      onClose();
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        toast.error(
          error.message ||
            "This item has already entered production and can no longer be deleted.",
        );
      } else {
        toast.error(
          error instanceof Error
            ? error.message
            : "Failed to delete research item.",
        );
      }
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
        <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto p-6 sm:max-w-2xl">
          {detailQuery.isLoading && (
            <div className="flex h-64 flex-col items-center justify-center gap-3">
              <Loader2 className="size-6 animate-spin text-primary" />
              <p className="text-xs text-muted-foreground">
                Loading item details...
              </p>
            </div>
          )}

          {detailQuery.isError && (
            <div className="flex h-64 flex-col items-center justify-center gap-3 text-center">
              <AlertCircle className="size-8 text-destructive" />
              <p className="text-sm font-semibold text-foreground">
                Failed to load research item
              </p>
              <p className="text-xs text-muted-foreground">
                {detailQuery.error instanceof Error
                  ? detailQuery.error.message
                  : "Unable to retrieve details from the server."}
              </p>
              <Button
                size="xs"
                variant="outline"
                onClick={() => void detailQuery.refetch()}
                className="mt-2"
              >
                Retry
              </Button>
            </div>
          )}

          {item && (
            <div className="space-y-5">
              <DialogHeader>
                <div className="flex flex-wrap items-center justify-between gap-2 pr-6">
                  {isAdmin ? (
                    <StatusBadge
                      label={formatStatusLabel(item.status)}
                      tone={getStatusTone(item.status)}
                    />
                  ) : (
                    <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                      Product Research
                    </span>
                  )}
                  <span className="font-mono text-xs text-muted-foreground">
                    ID: #{item.etsyListingId}
                  </span>
                </div>

                <div className="mt-2 flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                  <DialogTitle className="text-base font-semibold text-foreground sm:text-lg">
                    {item.title || `Etsy Listing #${item.etsyListingId}`}
                  </DialogTitle>

                  <div className="mt-1 flex flex-wrap items-center gap-2 self-start">
                    {isAdmin && item.latestReview?.id && (
                      <Button
                        className="gap-1 text-xs"
                        nativeButton={false}
                        render={
                          <Link
                            href={`/w/${workspaceId}/reviews/${item.latestReview.id}`}
                          />
                        }
                        size="xs"
                        variant="secondary"
                      >
                        <MessageSquare className="size-3" />
                        <span>View Review Feedback</span>
                      </Button>
                    )}
                    {isAdmin && (
                      <Button
                        type="button"
                        variant="outline"
                        size="xs"
                        onClick={() => setIsEditTitleOpen(true)}
                        className="gap-1 text-xs"
                        title="Edit title"
                      >
                        <Pencil className="size-3" />
                        <span>Edit Title</span>
                      </Button>
                    )}
                  </div>
                </div>

                <DialogDescription className="text-xs text-muted-foreground">
                  Added on {new Date(item.createdAt).toLocaleString()}
                  {!isAdmin && item.createdBy?.name ? ` by ${item.createdBy.name}` : ""}
                </DialogDescription>
              </DialogHeader>

              {/* Reference Image Section */}
              <div className="overflow-hidden rounded-lg border border-border bg-muted/30">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-muted/40 px-3.5 py-2">
                  <span className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                    <ImageIcon className="size-3.5 text-muted-foreground" />
                    Reference Image
                  </span>

                  <div className="flex items-center gap-2">
                    {canManageImage && (
                      <Button
                        type="button"
                        size="xs"
                        variant="outline"
                        onClick={() => setIsUploadImageOpen(true)}
                        className="h-7 text-xs gap-1"
                      >
                        <Upload className="size-3" />
                        <span>
                          {item.referenceImageUrl ? "Replace Image" : "Add Image"}
                        </span>
                      </Button>
                    )}

                    {isAdmin && item.referenceImageUrl && (
                      <Button
                        type="button"
                        size="xs"
                        variant="outline"
                        onClick={() => void handleDownload()}
                        disabled={isDownloading}
                        className="h-7 text-xs gap-1"
                        title="Download Reference Image"
                      >
                        {isDownloading ? (
                          <Loader2 className="size-3 animate-spin" />
                        ) : (
                          <Download className="size-3" />
                        )}
                        <span>Download</span>
                      </Button>
                    )}

                    <a
                      href={item.normalizedUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
                    >
                      <ExternalLink className="size-3" />
                      <span>Etsy</span>
                    </a>
                  </div>
                </div>

                <div className="flex min-h-[220px] max-h-[380px] w-full items-center justify-center p-3">
                  <AuthenticatedReferenceImage
                    alt={item.title || "Reference image"}
                    hasImage={Boolean(item.referenceImageUrl)}
                    researchItemId={item.id}
                    workspaceId={workspaceId}
                    userCanUpload={canManageImage}
                    onOpenUpload={() => setIsUploadImageOpen(true)}
                    enabled={open}
                    isActive={open}
                    className="max-h-[350px]"
                  />
                </div>
              </div>

              {/* Item Attributes Grid (Admin only) */}
              {isAdmin && (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {/* Creator Card */}
                  <div className="rounded-lg border border-border bg-card p-3.5 shadow-xs">
                    <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                      <User className="size-3.5" />
                      <span>Researcher</span>
                    </div>
                    <p className="mt-1 text-xs font-semibold text-foreground">
                      {item.createdBy.name || "Unnamed"}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {item.createdBy.email}
                    </p>
                  </div>

                  {/* Designer Card */}
                  <div className="rounded-lg border border-border bg-card p-3.5 shadow-xs">
                    <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                      <Paintbrush className="size-3.5" />
                      <span>Assigned Designer</span>
                    </div>
                    {item.currentDesigner ? (
                      <>
                        <p className="mt-1 text-xs font-semibold text-foreground">
                          {item.currentDesigner.name || "Unnamed"}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {item.currentDesigner.email}
                        </p>
                        {item.currentDesignAssignment && (
                          <p className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground">
                            <Clock className="size-3" />
                            Assigned:{" "}
                            {new Date(
                              item.currentDesignAssignment.assignedAt,
                            ).toLocaleDateString()}
                          </p>
                        )}
                      </>
                    ) : (
                      <p className="mt-1 text-xs text-muted-foreground italic">
                        Unassigned (Status: Researched)
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Latest Review Submission Card (Admin only, if present) */}
              {isAdmin && item.latestReview && (
                <div className="rounded-lg border border-border bg-card p-4 shadow-xs">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                      <Eye className="size-3.5 text-primary" />
                      Latest Review (Round {item.latestReview.roundNumber})
                    </span>
                    <div className="flex flex-wrap items-center gap-2">
                      {item.latestReview.approvedAt ? (
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 text-[11px] font-medium",
                            STATUS_TONE_TEXT_CLASSES.success,
                          )}
                        >
                          <CheckCircle2 className="size-3" />
                          Approved
                        </span>
                      ) : item.status === "CORRECTION_NEEDED" ? (
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 text-[11px] font-medium",
                            STATUS_TONE_TEXT_CLASSES.warning,
                          )}
                        >
                          <AlertTriangle className="size-3" />
                          Correction Needed
                        </span>
                      ) : item.status === "DESIGN_IN_PROGRESS" ? (
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 text-[11px] font-medium",
                            STATUS_TONE_TEXT_CLASSES.info,
                          )}
                        >
                          <Clock className="size-3" />
                          Correction In Progress
                        </span>
                      ) : (
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 text-[11px] font-medium",
                            STATUS_TONE_TEXT_CLASSES.warning,
                          )}
                        >
                          <Clock className="size-3" />
                          In Review
                        </span>
                      )}

                      {isAdmin && item.latestReview.id && (
                        <Button
                          className="gap-1 text-xs"
                          nativeButton={false}
                          render={
                            <Link
                              href={`/w/${workspaceId}/reviews/${item.latestReview.id}`}
                            />
                          }
                          size="xs"
                          variant="outline"
                        >
                          <MessageSquare className="size-3" />
                          <span>View Review Feedback</span>
                        </Button>
                      )}
                    </div>
                  </div>

                  {item.latestReview.note && (
                    <p className="mt-2 rounded-md bg-muted/40 p-2 text-xs text-muted-foreground italic">
                      &ldquo;{item.latestReview.note}&rdquo;
                    </p>
                  )}

                  <div className="mt-3">
                    {item.latestReview.imageDeletedAt ? (
                      <p className="text-[11px] text-muted-foreground italic">
                        Review preview image has expired.
                      </p>
                    ) : item.latestReview.imageUrl ? (
                      <div className="flex max-h-48 justify-center overflow-hidden rounded-md border border-border bg-muted/20 p-2">
                        <img
                          src={item.latestReview.imageUrl}
                          alt="Review draft"
                          className="max-h-44 object-contain"
                        />
                      </div>
                    ) : null}
                  </div>

                  {isAdmin && item.latestReview.id && (
                    <div className="mt-3.5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-t border-border/80 pt-3">
                      <p className="text-[11px] text-muted-foreground">
                        Inspect submission proof, annotated revision notes, and Designer replies.
                      </p>
                      <Button
                        className="gap-1.5 text-xs shrink-0 self-start sm:self-auto"
                        nativeButton={false}
                        render={
                          <Link
                            href={`/w/${workspaceId}/reviews/${item.latestReview.id}`}
                          />
                        }
                        size="xs"
                        variant="default"
                      >
                        <MessageSquare className="size-3" />
                        <span>View Review Feedback</span>
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* Admin Actions Section: Delete */}
              {isAdmin && (
                <div className="flex items-center justify-between border-t border-border pt-4">
                  <div>
                    <p className="text-xs font-medium text-foreground">
                      Admin Actions
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {isEarlyStage
                        ? "Permanently delete this early-stage research item."
                        : "Items that have entered production cannot be deleted."}
                    </p>
                  </div>

                  <ConfirmDialog
                    title="Delete Research Item"
                    description="This permanently removes this early-stage research item. Items that have entered production cannot be deleted."
                    confirmLabel="Delete Item"
                    onConfirm={handleDelete}
                    trigger={
                      <Button
                        type="button"
                        variant="destructive"
                        size="xs"
                        disabled={!isEarlyStage || isDeleting}
                        className="gap-1 text-xs"
                      >
                        {isDeleting ? (
                          <Loader2 className="size-3 animate-spin" />
                        ) : (
                          <Trash2 className="size-3" />
                        )}
                        <span>Delete Item</span>
                      </Button>
                    }
                  />
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Title Dialog (ADMIN only) */}
      {item && (
        <EditTitleDialog
          open={isEditTitleOpen}
          onOpenChange={setIsEditTitleOpen}
          workspaceId={workspaceId}
          researchItemId={item.id}
          currentTitle={item.title}
        />
      )}

      {/* Upload/Replace Reference Image Modal (ADMIN & RESEARCHER) */}
      {item && (
        <ReferenceImageUploadModal
          open={isUploadImageOpen}
          onOpenChange={setIsUploadImageOpen}
          workspaceId={workspaceId}
          researchItemId={item.id}
          title={
            item.referenceImageUrl
              ? "Replace Reference Image"
              : "Add Reference Image"
          }
          description={
            item.referenceImageUrl
              ? "Upload a new JPEG, PNG, or WebP image to replace the current reference image."
              : "Upload a JPEG, PNG, or WebP image (up to 10MB) to attach as reference for designers."
          }
        />
      )}
    </>
  );
}
