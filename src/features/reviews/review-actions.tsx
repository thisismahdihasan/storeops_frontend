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
  isActionable: boolean;
  researchItemId: string;
  reviewId: string;
  roundNumber: number;
  workspaceId: string;
};

export function ReviewActions({
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
      invalidate(researchItemId, reviewId);
    }
  }

  async function handleRequestCorrection() {
    try {
      await correctionMutation.mutateAsync();
      toast.success("Correction requested.");
      setIsCorrectionOpen(false);
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : "Failed to request correction.";
      toast.error(message);
      // On 409 or any error, refetch relevant state because another actor may have changed status
      invalidate(researchItemId, reviewId);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Request Correction Dialog */}
      <AlertDialog onOpenChange={setIsCorrectionOpen} open={isCorrectionOpen}>
        <AlertDialogTrigger
          render={
            <Button
              disabled={isPending}
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
              Are you sure you want to request corrections for this design? The
              assigned designer will be notified with your pinned image
              annotations to begin revisions.
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
  );
}
