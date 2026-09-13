/* eslint-disable @next/next/no-img-element */
"use client";

import Link from "next/link";
import {
  CheckCircle2,
  CircleAlert,
  Clock3,
  Loader2,
  MessageSquareText,
  Play,
  RotateCcw,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { formatWorkDate } from "@/features/designer-work/designer-work.types";

import { FinalAssetsPanel } from "./final-assets-panel";
import { ReviewUploadForm } from "./review-upload-form";
import type { DesignDetail } from "./design-workspace.types";

type DesignStatusPanelProps = {
  detail: DesignDetail;
  hasInlineReviewHistory: boolean;
  isActiveCorrectionSourceRound: boolean;
  isCompleting: boolean;
  isStartingCorrection: boolean;
  isStartingWork: boolean;
  isSubmittingFinalAssets: boolean;
  isSubmittingReview: boolean;
  onComplete: () => void;
  onOpenIssueDialog: () => void;
  onStartCorrection: () => void;
  onStartWork: () => void;
  onSubmitFinalAssets: (files: File[]) => void;
  onSubmitReview: (file: File, note: string) => void;
  workspaceId: string;
};

export function DesignStatusPanel({
  detail,
  hasInlineReviewHistory,
  isActiveCorrectionSourceRound,
  isCompleting,
  isStartingCorrection,
  isStartingWork,
  isSubmittingFinalAssets,
  isSubmittingReview,
  onComplete,
  onOpenIssueDialog,
  onStartCorrection,
  onStartWork,
  onSubmitFinalAssets,
  onSubmitReview,
  workspaceId,
}: DesignStatusPanelProps) {
  const { assignment, finalAssets, latestIssue, latestReview, researchItem } =
    detail;
  const status = researchItem.status;
  const canStartWork =
    status === "ASSIGNED" ||
    (status === "DESIGN_IN_PROGRESS" && assignment.startedAt === null);
  const canReportIssue =
    status === "ASSIGNED" || status === "DESIGN_IN_PROGRESS";
  const isPostDesignState =
    status === "READY_FOR_LISTING" ||
    status === "LISTING_IN_PROGRESS" ||
    status === "LISTED";

  const helperText = getHelperText(status, canStartWork);
  const isRevisedProofSubmission =
    hasInlineReviewHistory &&
    isActiveCorrectionSourceRound &&
    status === "DESIGN_IN_PROGRESS" &&
    !canStartWork;
  const shouldShowReviewUpload =
    status === "DESIGN_IN_PROGRESS" &&
    !canStartWork &&
    (!hasInlineReviewHistory || isActiveCorrectionSourceRound);

  return (
    <section className="flex flex-1 flex-col rounded-xl border border-border bg-card p-5 sm:p-6 shadow-xs min-h-[480px]">
      {/* Panel Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-4">
        <div>
          <h2 className="text-base font-semibold text-foreground">Current Task</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">{helperText}</p>
        </div>
        {canReportIssue && (
          <Button
            className="text-muted-foreground hover:text-foreground shrink-0 gap-1.5 self-start sm:self-auto"
            onClick={onOpenIssueDialog}
            size="xs"
            type="button"
            variant="ghost"
          >
            <CircleAlert className="size-3.5" />
            <span>Report Issue</span>
          </Button>
        )}
      </div>

      {/* Main Task Body */}
      <div className="flex-1 pt-5">
        {canStartWork && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              This assignment is ready to begin.
            </p>
            <div className="flex flex-wrap items-center gap-2.5">
              <Button
                className="font-semibold gap-1.5"
                disabled={isStartingWork}
                onClick={onStartWork}
                size="default"
                type="button"
              >
                {isStartingWork ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Play className="size-4" />
                )}
                <span>Start Work</span>
              </Button>
              {canReportIssue && (
                <Button
                  className="text-muted-foreground hover:text-foreground"
                  onClick={onOpenIssueDialog}
                  size="default"
                  type="button"
                  variant="ghost"
                >
                  <CircleAlert className="size-4" />
                  <span>Report Issue</span>
                </Button>
              )}
            </div>
          </div>
        )}

        {shouldShowReviewUpload && (
          <ReviewUploadForm
            helperText={
              isRevisedProofSubmission
                ? `Your revised submission will create Round ${(latestReview?.roundNumber ?? 0) + 1}.`
                : undefined
            }
            isPending={isSubmittingReview}
            onReportIssue={canReportIssue ? onOpenIssueDialog : undefined}
            onSubmit={onSubmitReview}
            title={
              isRevisedProofSubmission
                ? "Submit Revised Proof"
                : undefined
            }
          />
        )}

        {status === "DESIGN_REVIEW" && (
          <div className="space-y-4">
            <div className="rounded-lg border border-border bg-muted/20 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Clock3 className="size-4 text-muted-foreground" />
                <span>
                  Round {latestReview?.roundNumber ?? 1} submitted — waiting for
                  Admin review.
                </span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {latestReview
                  ? `Submitted ${formatWorkDate(latestReview.submittedAt)}. Your submission is locked while under review.`
                  : "Waiting for Admin review."}
              </p>
            </div>

            {!hasInlineReviewHistory && latestReview?.note && (
              <div className="rounded-lg border border-border bg-muted/15 p-3 text-xs">
                <p className="font-semibold text-muted-foreground">
                  Your Submission Note
                </p>
                <p className="mt-1 whitespace-pre-wrap leading-relaxed text-foreground">
                  {latestReview.note}
                </p>
              </div>
            )}

            {!hasInlineReviewHistory &&
              latestReview &&
              latestReview.imageDeletedAt === null &&
              latestReview.imageUrl && (
                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-muted-foreground">
                    Submitted Proof
                  </p>
                  <div className="flex max-h-72 justify-center overflow-hidden rounded-lg border border-border bg-background p-2">
                    <img
                      alt={`Submitted proof for round ${latestReview.roundNumber}`}
                      className="max-h-64 max-w-full rounded-md object-contain"
                      src={latestReview.imageUrl}
                    />
                  </div>
                </div>
              )}

            {!hasInlineReviewHistory && latestReview && (
              <div>
                <Button
                  nativeButton={false}
                  render={
                    <Link
                      href={`/w/${workspaceId}/reviews/${latestReview.id}`}
                    />
                  }
                  size="sm"
                  type="button"
                  variant="outline"
                >
                  View Review History
                </Button>
              </div>
            )}
          </div>
        )}

        {status === "CORRECTION_NEEDED" && (
          <div className="space-y-4">
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-foreground">
              <div className="flex items-center gap-2">
                <RotateCcw className="size-4 text-amber-600 dark:text-amber-400" />
                <h3 className="text-sm font-semibold text-amber-900 dark:text-amber-200">
                  Revisions requested
                </h3>
                {latestReview && (
                  <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[11px] font-medium text-amber-800 dark:text-amber-300">
                    Round {latestReview.roundNumber}
                  </span>
                )}
              </div>

              {!hasInlineReviewHistory &&
                latestReview &&
                latestReview.annotations.length > 0 && (
                <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <MessageSquareText className="size-3.5 text-amber-600 dark:text-amber-400" />
                  <span>
                    {latestReview.annotations.length} visual{" "}
                    {latestReview.annotations.length === 1
                      ? "annotation requires"
                      : "annotations require"}{" "}
                    attention.
                  </span>
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <Button
                className="font-semibold gap-1.5"
                disabled={isStartingCorrection}
                onClick={onStartCorrection}
                size="default"
                type="button"
              >
                {isStartingCorrection ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <RotateCcw className="size-4" />
                )}
                <span>Start Correction</span>
              </Button>
              {!hasInlineReviewHistory &&
                latestReview &&
                latestReview.annotations.length > 0 && (
                <Button
                  onClick={() => {
                    const el = document.getElementById(
                      "correction-feedback-section",
                    );
                    el?.scrollIntoView({ behavior: "smooth" });
                  }}
                  size="default"
                  type="button"
                  variant="outline"
                >
                  <span>
                    View Annotations ({latestReview.annotations.length})
                  </span>
                </Button>
              )}
            </div>
          </div>
        )}

        {status === "ISSUE_REPORTED" && (
          <div className="space-y-3 rounded-lg border border-amber-500/25 bg-amber-500/5 p-4">
            <div className="flex items-center gap-2">
              <CircleAlert className="size-4 text-amber-600 dark:text-amber-400" />
              <h3 className="text-sm font-semibold text-foreground">
                Issue under Admin review. Work is paused.
              </h3>
            </div>
            {latestIssue ? (
              <div className="space-y-2 text-xs">
                <div>
                  <span className="font-medium text-muted-foreground">
                    Reason:{" "}
                  </span>
                  <span className="font-medium text-foreground">
                    {latestIssue.reason.replaceAll("_", " ")}
                  </span>
                </div>
                {latestIssue.details && (
                  <div>
                    <span className="font-medium text-muted-foreground">
                      Details:{" "}
                    </span>
                    <p className="mt-1 whitespace-pre-wrap rounded-md border border-border/60 bg-background/80 p-2.5 text-foreground leading-relaxed">
                      {latestIssue.details}
                    </p>
                  </div>
                )}
                <p className="flex items-center gap-1 text-[11px] text-muted-foreground pt-1">
                  <Clock3 className="size-3" />
                  Reported {formatWorkDate(latestIssue.createdAt)} · Waiting for
                  Admin action
                </p>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                Waiting for Admin action.
              </p>
            )}
          </div>
        )}

        {status === "DESIGN_APPROVED" && (
          <div className="space-y-4">
            <FinalAssetsPanel
              assets={finalAssets.items}
              count={finalAssets.count}
              isCompleting={isCompleting}
              isPending={isSubmittingFinalAssets}
              onUpload={onSubmitFinalAssets}
              showUploader
            />
            {finalAssets.count > 0 && (
              <div className="pt-3 border-t border-border">
                <p className="mb-2 text-xs text-muted-foreground">
                  Final files are uploaded. Retry completion only if the handoff did not finish.
                </p>
                <Button
                  className="w-full sm:w-auto font-semibold gap-1.5"
                  disabled={isCompleting}
                  onClick={onComplete}
                  size="default"
                  type="button"
                >
                  {isCompleting && <Loader2 className="size-4 animate-spin" />}
                  <span>{isCompleting ? "Completing work..." : "Retry completion"}</span>
                </Button>
              </div>
            )}
          </div>
        )}

        {isPostDesignState && (
          <div className="space-y-4">
            <div className="flex items-center gap-2.5 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4 text-xs text-emerald-800 dark:text-emerald-300">
              <CheckCircle2 className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <div>
                <p className="font-semibold">
                  Design complete and handed off to listing.
                </p>
                <p className="mt-0.5 text-muted-foreground">
                  {status === "READY_FOR_LISTING"
                    ? "Final assets have been submitted and are ready for the lister."
                    : "Listing work is now in progress or completed. Design work is read-only."}
                </p>
              </div>
            </div>
            {finalAssets.count > 0 && (
              <FinalAssetsPanel
              assets={finalAssets.items}
              count={finalAssets.count}
              isCompleting={false}
              isPending={false}
                onUpload={() => undefined}
                showUploader={false}
              />
            )}
          </div>
        )}
      </div>
    </section>
  );
}

function getHelperText(
  status: DesignDetail["researchItem"]["status"],
  canStartWork: boolean,
): string {
  if (canStartWork) return "This assignment is ready to begin.";
  if (status === "DESIGN_IN_PROGRESS")
    return "Create your design and submit a proof for review.";
  if (status === "DESIGN_REVIEW") return "Submission under review.";
  if (status === "CORRECTION_NEEDED")
    return "Review feedback and submit requested changes.";
  if (status === "ISSUE_REPORTED")
    return "Work is paused while issue is under review.";
  if (status === "DESIGN_APPROVED")
    return "Design approved. Upload final files to complete work.";
  if (
    status === "READY_FOR_LISTING" ||
    status === "LISTING_IN_PROGRESS" ||
    status === "LISTED"
  ) {
    return "Design complete and handed off to listing.";
  }
  return "Design workspace.";
}
