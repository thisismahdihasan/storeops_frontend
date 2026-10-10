"use client";

import { Loader2, RotateCcw, TriangleAlert } from "lucide-react";
import Link from "next/link";
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

type PendingWorkspaceOverlayProps = {
  alternativeWorkspaceId: string | undefined;
  isOwner: boolean;
  onRestore: () => Promise<void>;
  permanentDeletionAt: string | null;
  restoring: boolean;
  workspaceName: string;
};

function formatPermanentDeletionAt(value: string | null) {
  if (!value) return "Unavailable";

  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return "Unavailable";

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function PendingWorkspaceOverlay({
  alternativeWorkspaceId,
  isOwner,
  onRestore,
  permanentDeletionAt,
  restoring,
  workspaceName,
}: PendingWorkspaceOverlayProps) {
  if (!isOwner) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
        <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 text-center shadow-lg">
          <TriangleAlert className="mx-auto size-10 text-amber-600" />
          <h2 className="mt-4 text-lg font-bold text-foreground">Workspace Scheduled for Deletion</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {workspaceName} is currently scheduled for deletion by its owner. Access to workspace operations is suspended. Only the workspace owner can restore this workspace.
          </p>
          <div className="mt-6">
            <Button
              className="w-full"
              nativeButton={false}
              render={<Link href={alternativeWorkspaceId ? `/w/${alternativeWorkspaceId}` : "/"} />}
            >
              {alternativeWorkspaceId ? "Go to another active workspace" : "Return to Home"}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return <OwnerPendingWorkspaceOverlay onRestore={onRestore} permanentDeletionAt={permanentDeletionAt} restoring={restoring} />;
}

type OwnerPendingWorkspaceOverlayProps = Pick<
  PendingWorkspaceOverlayProps,
  "onRestore" | "permanentDeletionAt" | "restoring"
>;

function OwnerPendingWorkspaceOverlay({
  onRestore,
  permanentDeletionAt,
  restoring,
}: OwnerPendingWorkspaceOverlayProps) {
  const [restoreError, setRestoreError] = useState<string | null>(null);

  const handleRestore = async () => {
    setRestoreError(null);
    try {
      await onRestore();
    } catch (error) {
      setRestoreError(
        error instanceof ApiError
          ? error.message
          : "Could not restore this workspace. Please try again.",
      );
    }
  };

  return (
    <AlertDialog open>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia className="bg-amber-500/10 text-amber-700 dark:text-amber-300">
            <TriangleAlert />
          </AlertDialogMedia>
          <AlertDialogTitle>Workspace scheduled for deletion</AlertDialogTitle>
          <AlertDialogDescription>
            This workspace is currently in a 3-day deletion grace period. Access to normal workspace operations is suspended.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-3 text-sm">
          <div className="rounded-lg border border-border bg-muted/30 p-3">
            <p className="text-muted-foreground">Permanent deletion eligibility begins:</p>
            <p className="mt-1 font-medium text-foreground">{formatPermanentDeletionAt(permanentDeletionAt)}</p>
          </div>
          <p className="text-muted-foreground">
            You can restore this workspace at any time before the deadline. After the grace period ends, data and assets will be permanently purged during scheduled cleanup.
          </p>
          {restoreError && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-destructive" role="alert">
              {restoreError}
            </div>
          )}
        </div>
        <AlertDialogFooter>
          <AlertDialogAction disabled={restoring} onClick={() => void handleRestore()}>
            {restoring ? <Loader2 className="size-3.5 animate-spin" /> : <RotateCcw className="size-3.5" />}
            Restore Workspace
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
