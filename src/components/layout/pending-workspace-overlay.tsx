"use client";

import { Loader2, RotateCcw, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

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
import { getWorkspaces } from "@/features/workspace/workspace.api";
import { CreateWorkspaceDialog } from "@/features/workspace/create-workspace-dialog";
import { workspacesQueryKey } from "@/features/workspace/use-workspaces";

type PendingWorkspaceOverlayProps = {
  alternativeWorkspaceRoute: string | null;
  isOwner: boolean;
  onRestore: () => Promise<void>;
  permanentDeletionAt: string | null;
  restoring: boolean;
  workspaceId: string;
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

function calculateRemainingTime(permanentDeletionAt: string | null) {
  const deadline = permanentDeletionAt ? new Date(permanentDeletionAt).getTime() : Number.NaN;
  const totalMs = Number.isNaN(deadline) ? 0 : Math.max(0, deadline - Date.now());
  const totalSeconds = Math.floor(totalMs / 1_000);
  const days = Math.floor(totalSeconds / 86_400);
  const hours = Math.floor((totalSeconds % 86_400) / 3_600);
  const minutes = Math.floor((totalSeconds % 3_600) / 60);
  const seconds = totalSeconds % 60;

  return {
    days,
    hours,
    isExpired: totalMs === 0,
    minutes,
    seconds,
    totalMs,
  };
}

function formatCountdownValue(value: number) {
  return value.toString().padStart(2, "0");
}

export function PendingWorkspaceOverlay({
  alternativeWorkspaceRoute,
  isOwner,
  onRestore,
  permanentDeletionAt,
  restoring,
  workspaceId,
  workspaceName,
}: PendingWorkspaceOverlayProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  return (
    <>
      {isOwner ? (
        <OwnerPendingWorkspaceOverlay
          alternativeWorkspaceRoute={alternativeWorkspaceRoute}
          isCreateOpen={isCreateOpen}
          onCreateWorkspace={() => setIsCreateOpen(true)}
          onRestore={onRestore}
          permanentDeletionAt={permanentDeletionAt}
          restoring={restoring}
          workspaceId={workspaceId}
        />
      ) : (
        <NonOwnerPendingScreen
          alternativeWorkspaceRoute={alternativeWorkspaceRoute}
          onCreateWorkspace={() => setIsCreateOpen(true)}
          workspaceName={workspaceName}
        />
      )}
      <CreateWorkspaceDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} />
    </>
  );
}

type OwnerPendingWorkspaceOverlayProps = Pick<
  PendingWorkspaceOverlayProps,
  "alternativeWorkspaceRoute" | "onRestore" | "permanentDeletionAt" | "restoring"
> & {
  isCreateOpen: boolean;
  onCreateWorkspace: () => void;
  workspaceId: string;
};

type NonOwnerPendingScreenProps = Pick<
  PendingWorkspaceOverlayProps,
  "alternativeWorkspaceRoute" | "workspaceName"
> & {
  onCreateWorkspace: () => void;
};

function NonOwnerPendingScreen({
  alternativeWorkspaceRoute,
  onCreateWorkspace,
  workspaceName,
}: NonOwnerPendingScreenProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 text-center shadow-lg">
        <TriangleAlert className="mx-auto size-10 text-amber-600" />
        <h2 className="mt-4 text-lg font-bold text-foreground">Workspace Scheduled for Deletion</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {workspaceName} is currently scheduled for deletion by its owner. Access to workspace operations is suspended. Only the workspace owner can restore this workspace.
        </p>
        <div className="mt-6">
          {alternativeWorkspaceRoute !== null ? (
            <Button
              className="w-full"
              nativeButton={false}
              render={<Link href={alternativeWorkspaceRoute} />}
            >
              Go to another active workspace
            </Button>
          ) : (
            <Button className="w-full" onClick={onCreateWorkspace}>
              Create Workspace
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function OwnerPendingWorkspaceOverlay({
  alternativeWorkspaceRoute,
  isCreateOpen,
  onCreateWorkspace,
  onRestore,
  permanentDeletionAt,
  restoring,
  workspaceId,
}: OwnerPendingWorkspaceOverlayProps) {
  const queryClient = useQueryClient();
  const [countdown, setCountdown] = useState(() =>
    calculateRemainingTime(permanentDeletionAt),
  );
  const [restoreError, setRestoreError] = useState<string | null>(null);
  const [serverExpired, setServerExpired] = useState(false);
  const isExpired = countdown.isExpired || serverExpired;

  useEffect(() => {
    const updateCountdown = () => {
      const nextCountdown = calculateRemainingTime(permanentDeletionAt);
      setCountdown(nextCountdown);
      return nextCountdown.isExpired;
    };

    if (serverExpired || updateCountdown()) {
      return;
    }

    const intervalId = window.setInterval(() => {
      if (updateCountdown()) {
        window.clearInterval(intervalId);
      }
    }, 1_000);

    return () => window.clearInterval(intervalId);
  }, [permanentDeletionAt, serverExpired]);

  useQuery({
    enabled: isExpired,
    queryFn: getWorkspaces,
    queryKey: workspacesQueryKey,
    refetchInterval: isExpired ? 30_000 : false,
    refetchOnWindowFocus: isExpired,
  });

  const handleRestore = async () => {
    setRestoreError(null);
    try {
      await onRestore();
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        try {
          const refreshedWorkspaces = await queryClient.fetchQuery({
            queryFn: getWorkspaces,
            queryKey: workspacesQueryKey,
          });
          const refreshedWorkspace = refreshedWorkspaces.data.workspaces.find(
            (workspace) => workspace.id === workspaceId,
          );

          if (!refreshedWorkspace) {
            return;
          }

          if (refreshedWorkspace.deletionScheduledAt === null) {
            toast.info("Workspace is already active.");
            return;
          }

          setServerExpired(true);
          setRestoreError(error.message);
          return;
        } catch {
          setRestoreError(
            "Could not confirm this workspace's deletion status. Please try restoring again.",
          );
          return;
        }
      }

      setRestoreError(
        error instanceof ApiError
          ? error.message
          : "Could not restore this workspace. Please try again.",
      );
    }
  };

  return (
    <AlertDialog open={!isCreateOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia className="bg-amber-500/10 text-amber-700 dark:text-amber-300">
            <TriangleAlert />
          </AlertDialogMedia>
          <AlertDialogTitle>{isExpired ? "Grace period expired" : "Workspace scheduled for deletion"}</AlertDialogTitle>
          <AlertDialogDescription>
            {isExpired
              ? "Permanent deletion is in progress."
              : "This workspace is currently in a 3-day deletion grace period. Access to normal workspace operations is suspended."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-3 text-sm">
          {!isExpired && (
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
              <p className="text-muted-foreground">Time remaining</p>
              <p className="mt-1 font-mono text-lg font-semibold text-foreground tabular-nums">
                {countdown.days}d {formatCountdownValue(countdown.hours)}h {formatCountdownValue(countdown.minutes)}m {formatCountdownValue(countdown.seconds)}s
              </p>
            </div>
          )}
          <div className="rounded-lg border border-border bg-muted/30 p-3">
            <p className="text-muted-foreground">Permanent deletion eligibility {isExpired ? "began" : "begins"}:</p>
            <p className="mt-1 font-medium text-foreground">{formatPermanentDeletionAt(permanentDeletionAt)}</p>
          </div>
          {isExpired ? (
            <p className="text-muted-foreground">
              This workspace and its related data and assets will be permanently purged during a scheduled cleanup run. The physical purge may occur shortly after the grace-period deadline.
            </p>
          ) : (
            <p className="text-muted-foreground">
              You can restore this workspace at any time before the deadline. After the grace period ends, data and assets will be permanently purged during scheduled cleanup.
            </p>
          )}
          {restoreError && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-destructive" role="alert">
              {restoreError}
            </div>
          )}
        </div>
        <AlertDialogFooter className="flex-col sm:flex-col">
          {alternativeWorkspaceRoute !== null ? (
            <Button
              nativeButton={false}
              render={<Link href={alternativeWorkspaceRoute} />}
              variant="outline"
            >
              Go to another workspace
            </Button>
          ) : (
            <Button onClick={onCreateWorkspace} variant="outline">
              Create Workspace
            </Button>
          )}
          {!isExpired && (
            <AlertDialogAction disabled={restoring} onClick={() => void handleRestore()}>
              {restoring ? <Loader2 className="size-3.5 animate-spin" /> : <RotateCcw className="size-3.5" />}
              Restore Workspace
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
