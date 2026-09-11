"use client";

import { Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";

import type { BacklogSyncResult } from "./research.types";
import { useSyncResearchAssignments } from "./use-research";

type SyncUnassignedButtonProps = {
  className?: string;
  workspaceId: string;
};

export function getSyncSuccessMessage(result: BacklogSyncResult): string {
  const { assignedCount, designerCount, remainingUnassignedCount } = result;

  if (assignedCount > 0) {
    const itemWord = assignedCount === 1 ? "research item" : "research items";
    return `${assignedCount} ${itemWord} assigned.`;
  }

  if (remainingUnassignedCount === 0) {
    return "No unassigned research items found.";
  }

  if (designerCount === 0) {
    const itemWord =
      remainingUnassignedCount === 1
        ? "research item remains"
        : "research items remain";
    return `No eligible designers available. ${remainingUnassignedCount} ${itemWord} unassigned.`;
  }

  const itemWord =
    remainingUnassignedCount === 1
      ? "research item remains"
      : "research items remain";
  return `No research items assigned. ${remainingUnassignedCount} ${itemWord} unassigned.`;
}

export function SyncUnassignedButton({
  className,
  workspaceId,
}: SyncUnassignedButtonProps) {
  const syncMutation = useSyncResearchAssignments(workspaceId);

  const handleSync = async () => {
    try {
      const response = await syncMutation.mutateAsync();
      const message = getSyncSuccessMessage(response.data);

      if (response.data.assignedCount > 0) {
        toast.success(message);
      } else {
        toast.info(message);
      }
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : "Failed to sync assignments. Please try again.";
      toast.error(message);
    }
  };

  return (
    <Button
      className={cn("gap-1.5 font-medium", className)}
      disabled={syncMutation.isPending}
      onClick={handleSync}
      size="sm"
      type="button"
      variant="outline"
    >
      {syncMutation.isPending ? (
        <Loader2 className="size-3.5 animate-spin" />
      ) : (
        <RefreshCw className="size-3.5" />
      )}
      <span>{syncMutation.isPending ? "Syncing..." : "Sync Unassigned"}</span>
    </Button>
  );
}
