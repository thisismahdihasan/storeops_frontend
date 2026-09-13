"use client";

import { Check, RotateCcw } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api";

import {
  useApproveReviewSubmission,
  useRequestReviewCorrection,
  useReviewActionInvalidation,
} from "./use-reviews";

type ReviewActionsProps = {
  annotationCount: number;
  isActionable: boolean;
  researchItemId: string;
  reviewId: string;
  roundNumber: number;
  workspaceId: string;
};

export function ReviewActions({
  annotationCount,
  isActionable,
  researchItemId,
  reviewId,
  roundNumber,
  workspaceId,
}: ReviewActionsProps) {
  const [isApproveOpen, setIsApproveOpen] = useState(false);
  const [isCorrectionOpen, setIsCorrectionOpen] = useState(false);

  const approveMutation = useApproveReviewSubmission(workspaceId, reviewId);
  const correctionMutation = useRequestReviewCorrection(workspaceId, reviewId);
  const invalidate = useReviewActionInvalidation(workspaceId);

  const isPending = approveMutation.isPending || correctionMutation.isPending;
  const isCorrectionFeedbackRequired = annotationCount === 0;

  if (!isActionable) {
    return null;
  }

  async function handleApprove() {
    try {
      await approveMutation.mutateAsync();
      toast.success("Design approved.");
      setIsApproveOpen(false);
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : "Failed to approve design.";
      toast.error(message);
      // On 409 or any error, refetch relevant state because another actor may have changed status
      void invalidate(researchItemId, reviewId);
    }
  }

  async function handleRequestCorrection() {
    try {
      await correctionMutation.mutateAsync();
      toast.success("Correction requested.");
      setIsCorrectionOpen(false);
    } catch (error) {
      const message = hasCorrectionFeedbackRequiredCode(error)
        ? "Add at least one correction note before requesting changes."
        : error instanceof ApiError
          ? error.message
          : "Failed to request correction.";
      toast.error(message);
      // On 409 or any error, refetch relevant state because another actor may have changed status
      void invalidate(researchItemId, reviewId);
    }
  }

  return (
    <section
      aria-label="Review decision"
      className="rounded-xl border border-border bg-card p-4 shadow-xs"
    >
      <div>
        <h2 className="text-sm font-semibold text-foreground">Review decision</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Approve the submission or send it back with actionable feedback.
        </p>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2">
      {/* Request Correction Dialog */}
      <AlertDialog onOpenChange={setIsCorrectionOpen} open={isCorrectionOpen}>
        <AlertDialogTrigger
          render={
            <Button
              disabled={isPending || isCorrectionFeedbackRequired}
              type="button"
              variant="outline"
            />
          }
        >
          <RotateCcw className="size-4" />
          Request Correction
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Request Corrections for Round {roundNumber}</AlertDialogTitle>
            <AlertDialogDescription>
              Request corrections with {annotationCount} {annotationCount === 1 ? "note" : "notes"} for Round {roundNumber}? The assigned designer will be notified to begin revisions.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={isPending}
              onClick={() => void handleRequestCorrection()}
              variant="default"
            >
              {correctionMutation.isPending
                ? "Requesting…"
                : "Request Correction"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Approve Design Dialog */}
      <AlertDialog onOpenChange={setIsApproveOpen} open={isApproveOpen}>
        <AlertDialogTrigger
          render={
            <Button
              disabled={isPending}
              type="button"
            />
          }
        >
          <Check className="size-4" />
          Approve Design
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approve Design — Round {roundNumber}</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to approve this design? Once approved, the
              research item will move to Design Approved status, and the
              designer will be instructed to upload final production assets.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={isPending}
              onClick={() => void handleApprove()}
              variant="default"
            >
              {approveMutation.isPending ? "Approving…" : "Approve Design"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      </div>
      {isCorrectionFeedbackRequired ? (
        <p className="mt-3 text-xs font-medium text-amber-700 dark:text-amber-300">
          Add at least one correction note before requesting changes.
        </p>
      ) : null}
    </section>
  );
}

function hasCorrectionFeedbackRequiredCode(error: unknown): boolean {
  if (!(error instanceof ApiError) || typeof error.data !== "object" || error.data === null) {
    return false;
  }

  return "code" in error.data && error.data.code === "CORRECTION_FEEDBACK_REQUIRED";
}
