"use client";

import { Loader2, TriangleAlert } from "lucide-react";
import { useState } from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api";

type DeleteWorkspaceDialogProps = {
  onOpenChange: (open: boolean) => void;
  onSchedule: (workspaceName: string) => Promise<void>;
  open: boolean;
  submitting: boolean;
  workspaceName: string;
};

export function DeleteWorkspaceDialog({
  onOpenChange,
  onSchedule,
  open,
  submitting,
  workspaceName,
}: DeleteWorkspaceDialogProps) {
  const [confirmationName, setConfirmationName] = useState("");
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const trimmedConfirmationName = confirmationName.trim();
  const isNameMatch = trimmedConfirmationName === workspaceName;

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setConfirmationName("");
      setSubmissionError(null);
    }
    onOpenChange(nextOpen);
  };

  const handleSchedule = async () => {
    if (!isNameMatch) {
      return;
    }

    setSubmissionError(null);
    try {
      await onSchedule(trimmedConfirmationName);
      handleOpenChange(false);
    } catch (error) {
      setSubmissionError(
        error instanceof ApiError
          ? error.message
          : "Could not schedule workspace deletion. Please try again.",
      );
    }
  };

  return (
    <AlertDialog onOpenChange={handleOpenChange} open={open}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia className="bg-destructive/10 text-destructive">
            <TriangleAlert />
          </AlertDialogMedia>
          <AlertDialogTitle>Schedule workspace deletion?</AlertDialogTitle>
          <AlertDialogDescription>
            This workspace will enter a 3-day deletion period. You can restore it before the countdown expires. After that, the workspace and all related data/assets will be permanently deleted.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-3">
          <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm">
            <p className="text-muted-foreground">Workspace</p>
            <p className="mt-1 font-medium text-foreground">{workspaceName}</p>
          </div>
          <label className="grid gap-1.5 text-sm font-medium text-foreground" htmlFor="workspace-deletion-confirmation">
            To confirm, type {workspaceName} below.
            <input
              autoComplete="off"
              className="h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
              disabled={submitting}
              id="workspace-deletion-confirmation"
              onChange={(event) => setConfirmationName(event.target.value)}
              value={confirmationName}
            />
          </label>
          {submissionError && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive" role="alert">
              {submissionError}
            </div>
          )}
        </div>
        <AlertDialogFooter>
          <Button disabled={submitting} onClick={() => handleOpenChange(false)} type="button" variant="outline">
            Cancel
          </Button>
          <AlertDialogAction
            disabled={!isNameMatch || submitting}
            onClick={(event) => {
              event.preventDefault();
              void handleSchedule();
            }}
            variant="destructive"
          >
            {submitting && <Loader2 className="size-3.5 animate-spin" />}
            Schedule Deletion
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
