"use client";

import { useState } from "react";
import { AlertCircle, CalendarClock, Download, ExternalLink, Loader2, Pencil, Upload } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { StatusBadge } from "@/components/ui/status-badge";
import { AuthenticatedReferenceImage } from "@/features/research/authenticated-reference-image";
import { EditTitleDialog } from "@/features/research/edit-title-dialog";
import { getIssueReasonLabel } from "@/features/research/issue-reasons";
import { ReferenceImageUploadModal } from "@/features/research/reference-image-upload-modal";
import { downloadResearchReferenceImage } from "@/features/research/research.api";
import { useResearchItemDetail } from "@/features/research/use-research";

import type { ActiveIssue } from "./issues.types";

type IssueDetailDialogProps = {
  issue: ActiveIssue | null;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  workspaceId: string;
};

function formatDateTime(value: string | null | undefined): string {
  if (!value) return "Not available";

  return new Intl.DateTimeFormat(undefined, {
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function displayName(name: string | null, email: string): string {
  return name || email;
}

export function IssueDetailDialog({ issue, onOpenChange, open, workspaceId }: IssueDetailDialogProps) {
  const [isEditTitleOpen, setIsEditTitleOpen] = useState(false);
  const [isReplaceImageOpen, setIsReplaceImageOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const detailQuery = useResearchItemDetail(workspaceId, issue?.id, open && Boolean(issue));
  const detail = detailQuery.data?.data.researchItem;
  const item = detail ?? issue;

  if (!issue || !item) return null;

  const issueReport = issue.latestIssueReport;

  const handleDownload = async () => {
    setIsDownloading(true);

    try {
      await downloadResearchReferenceImage(workspaceId, item.id);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to download reference image.",
      );
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <>
      <Dialog onOpenChange={onOpenChange} open={open}>
        <DialogContent className="max-h-[90vh] max-w-[calc(100%-2rem)] overflow-y-auto p-5 sm:max-w-2xl">
          <DialogHeader>
            <div className="flex flex-wrap items-center gap-2 pr-7">
              <StatusBadge label="Issue reported" tone="danger" />
              <span className="font-mono text-xs text-muted-foreground">#{item.etsyListingId}</span>
            </div>
            <div className="mt-2 flex flex-col gap-2 pr-7 sm:flex-row sm:items-start sm:justify-between">
              <DialogTitle className="text-lg">{item.title || `Etsy Listing #${item.etsyListingId}`}</DialogTitle>
              <Button className="self-start" onClick={() => setIsEditTitleOpen(true)} size="xs" type="button" variant="outline">
                <Pencil className="size-3" />
                Edit Title
              </Button>
            </div>
            <DialogDescription>
              Review the reported issue and supporting research context before reassigning work.
            </DialogDescription>
          </DialogHeader>

          {detailQuery.isError && (
            <div className="flex gap-2 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-muted-foreground">
              <AlertCircle className="mt-0.5 size-4 shrink-0 text-amber-700 dark:text-amber-400" />
              <p>Some supporting research context could not be refreshed. The active issue details below remain available.</p>
            </div>
          )}

          <div className="overflow-hidden rounded-lg border border-border bg-muted/30">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-3 py-2">
              <span className="text-xs font-medium">Reference image</span>
              <div className="flex flex-wrap items-center gap-2">
                <Button onClick={() => setIsReplaceImageOpen(true)} size="xs" type="button" variant="outline">
                  <Upload className="size-3" />
                  {item.referenceImageUrl ? "Replace Image" : "Add Image"}
                </Button>
                {item.referenceImageUrl && (
                  <Button disabled={isDownloading} onClick={() => void handleDownload()} size="xs" type="button" variant="outline">
                    {isDownloading ? <Loader2 className="size-3 animate-spin" /> : <Download className="size-3" />}
                    Download
                  </Button>
                )}
                <a className="inline-flex items-center gap-1 rounded-md px-1 py-1 text-xs text-muted-foreground hover:text-foreground" href={item.normalizedUrl} rel="noreferrer" target="_blank">
                  View on Etsy <ExternalLink className="size-3" />
                </a>
              </div>
            </div>
            <AuthenticatedReferenceImage
              alt={item.title || `Reference for Etsy listing ${item.etsyListingId}`}
              hasImage={Boolean(item.referenceImageUrl)}
              researchItemId={item.id}
              workspaceId={workspaceId}
            />
          </div>

          <section className="rounded-lg border border-destructive/20 bg-destructive/5 p-4">
            <p className="text-sm font-semibold text-destructive">{getIssueReasonLabel(issueReport.reason)}</p>
            <p className="mt-2 whitespace-pre-wrap break-words text-sm text-foreground">
              {issueReport.details || "No additional details were provided."}
            </p>
            <p className="mt-3 text-xs text-muted-foreground">
              Reported by {displayName(issueReport.reportedBy.name, issueReport.reportedBy.email)} on {formatDateTime(issueReport.createdAt)}
            </p>
          </section>

          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <InfoCell label="Researcher" value={displayName(item.createdBy.name, item.createdBy.email)} />
            <InfoCell label="Current Designer" value={item.currentDesigner ? displayName(item.currentDesigner.name, item.currentDesigner.email) : "Unassigned"} />
            <InfoCell label="Assigned at" value={formatDateTime(item.currentDesignAssignment?.assignedAt)} />
            <InfoCell label="Research created" value={formatDateTime(item.createdAt)} />
            <InfoCell label="Last updated" value={formatDateTime(item.updatedAt)} />
            <InfoCell label="Research status" value="Issue reported" />
          </dl>

          {detailQuery.isLoading && (
            <p className="flex items-center gap-2 text-xs text-muted-foreground"><Loader2 className="size-3.5 animate-spin" />Refreshing research context...</p>
          )}
        </DialogContent>
      </Dialog>

      <EditTitleDialog
        currentTitle={item.title}
        onOpenChange={setIsEditTitleOpen}
        open={isEditTitleOpen}
        researchItemId={item.id}
        workspaceId={workspaceId}
      />
      <ReferenceImageUploadModal
        description={item.referenceImageUrl ? "Select a JPEG, PNG, or WebP image (up to 10MB) to replace the existing reference image." : undefined}
        onOpenChange={setIsReplaceImageOpen}
        open={isReplaceImageOpen}
        researchItemId={item.id}
        title={item.referenceImageUrl ? "Replace Reference Image" : "Add Reference Image"}
        workspaceId={workspaceId}
      />
    </>
  );
}

function InfoCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-lg border border-border bg-card p-3">
      <dt className="flex items-center gap-1 text-xs text-muted-foreground"><CalendarClock className="size-3" />{label}</dt>
      <dd className="mt-1 truncate text-sm font-medium text-foreground" title={value}>{value}</dd>
    </div>
  );
}
