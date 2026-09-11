"use client";

import { CheckCircle2, CircleAlert, Clock3, Loader2, Play, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { formatWorkDate } from "@/features/designer-work/designer-work.types";

import { FinalAssetsPanel } from "./final-assets-panel";
import { ReviewFeedback } from "./review-feedback";
import { ReviewUploadForm } from "./review-upload-form";
import type { DesignDetail } from "./design-workspace.types";

type DesignStatusPanelProps = {
  detail: DesignDetail;
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
};

export function DesignStatusPanel({ detail, isCompleting, isStartingCorrection, isStartingWork, isSubmittingFinalAssets, isSubmittingReview, onComplete, onOpenIssueDialog, onStartCorrection, onStartWork, onSubmitFinalAssets, onSubmitReview }: DesignStatusPanelProps) {
  const { assignment, finalAssets, latestIssue, latestReview, researchItem } = detail;
  const status = researchItem.status;
  const canStartWork = status === "ASSIGNED" || (status === "DESIGN_IN_PROGRESS" && assignment.startedAt === null);
  const canReportIssue = status === "ASSIGNED" || status === "DESIGN_IN_PROGRESS";
  const showsReview = status === "DESIGN_REVIEW" || status === "CORRECTION_NEEDED";
  const isPostDesignState = status === "READY_FOR_LISTING" || status === "LISTING_IN_PROGRESS" || status === "LISTED";

  return <div className="space-y-4">
    <section className="rounded-xl border border-border bg-card p-4 shadow-xs"><h2 className="font-semibold">Design status</h2><p className="mt-1 text-sm text-muted-foreground"><StatusMessage status={status} /></p>{canStartWork && <div className="mt-4 flex flex-wrap gap-2"><Button disabled={isStartingWork} onClick={onStartWork} type="button">{isStartingWork ? <Loader2 className="animate-spin" /> : <Play />}Start Work</Button>{canReportIssue && <Button onClick={onOpenIssueDialog} type="button" variant="outline"><CircleAlert />Report Issue</Button>}</div>}{status === "DESIGN_IN_PROGRESS" && <div className="mt-4 space-y-4">{canReportIssue && !canStartWork && <Button onClick={onOpenIssueDialog} type="button" variant="outline"><CircleAlert />Report Issue</Button>}<ReviewUploadForm isPending={isSubmittingReview} onSubmit={onSubmitReview} /></div>}{status === "CORRECTION_NEEDED" && <div className="mt-4"><Button disabled={isStartingCorrection} onClick={onStartCorrection} type="button">{isStartingCorrection ? <Loader2 className="animate-spin" /> : <RotateCcw />}Start Correction</Button></div>}</section>
    {showsReview && <ReviewFeedback review={latestReview} />}
    {status === "ISSUE_REPORTED" && <IssueSummary issue={latestIssue} />}
    {status === "DESIGN_APPROVED" && <div className="space-y-3"><FinalAssetsPanel assets={finalAssets.items} count={finalAssets.count} isPending={isSubmittingFinalAssets} onUpload={onSubmitFinalAssets} showUploader />{finalAssets.count > 0 && <Button disabled={isCompleting} onClick={onComplete} type="button">{isCompleting && <Loader2 className="animate-spin" />}Complete Work</Button>}</div>}
    {isPostDesignState && <div className="space-y-3"><FinalAssetsPanel assets={finalAssets.items} count={finalAssets.count} isPending={false} onUpload={() => undefined} showUploader={false} /><section className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-sm text-emerald-800 dark:text-emerald-300"><CheckCircle2 className="mb-2 size-5" />{status === "READY_FOR_LISTING" ? "Design work complete. The handoff is ready for listing." : "Design handoff complete. Listing work is now read-only for Designers."}</section></div>}
  </div>;
}

function StatusMessage({ status }: { status: DesignDetail["researchItem"]["status"] }) {
  if (status === "ASSIGNED") return "This work is assigned and ready to begin.";
  if (status === "DESIGN_IN_PROGRESS") return "Create the design, then upload an image for Admin review.";
  if (status === "DESIGN_REVIEW") return "Waiting for Admin Review. This state is read-only.";
  if (status === "CORRECTION_NEEDED") return "Review the feedback below, then begin the requested correction.";
  if (status === "ISSUE_REPORTED") return "Waiting for Admin action.";
  if (status === "DESIGN_APPROVED") return "Approved. Upload the final production files to finish this work.";
  if (status === "READY_FOR_LISTING") return "Design work is complete and ready for listing.";
  return "Design handoff complete.";
}

function IssueSummary({ issue }: { issue: DesignDetail["latestIssue"] }) {
  if (!issue) return <section className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">Waiting for Admin action.</section>;
  return <section className="rounded-xl border border-red-500/20 bg-red-500/5 p-4"><h2 className="font-semibold text-red-900 dark:text-red-300">Issue reported</h2><p className="mt-2 text-sm font-medium">{issue.reason.replaceAll("_", " ")}</p>{issue.details && <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{issue.details}</p>}<p className="mt-3 flex items-center gap-1 text-xs text-muted-foreground"><Clock3 className="size-3" />Reported {formatWorkDate(issue.createdAt)} · Waiting for Admin action</p></section>;
}
