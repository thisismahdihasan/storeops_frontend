"use client";

import { Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api";

import type { ListingBackfillResponse } from "./listing.types";
import { useBackfillListingAssignments } from "./use-listing";

type SyncListingsButtonProps = {
  workspaceId: string;
};

export function getListingSyncSuccessMessage(
  result: ListingBackfillResponse["data"],
): string {
  if (result.backfilledCount === 0) {
    return "No unassigned listings found.";
  }

  return `${result.backfilledCount} listing${result.backfilledCount === 1 ? "" : "s"} assigned.`;
}

export function SyncListingsButton({ workspaceId }: SyncListingsButtonProps) {
  const syncMutation = useBackfillListingAssignments(workspaceId);

  const handleSync = async () => {
    try {
      const response = await syncMutation.mutateAsync();
      const message = getListingSyncSuccessMessage(response.data);

      if (response.data.backfilledCount > 0) {
        toast.success(message);
      } else {
        toast.info(message);
      }
    } catch (error) {
      toast.error(
        error instanceof ApiError
          ? error.message
          : "Failed to sync listing assignments. Please try again.",
      );
    }
  };

  return (
    <Button
      className="gap-1.5 font-medium"
      disabled={syncMutation.isPending}
      onClick={() => void handleSync()}
      size="sm"
      type="button"
      variant="outline"
    >
      {syncMutation.isPending ? (
        <Loader2 className="size-3.5 animate-spin" />
      ) : (
        <RefreshCw className="size-3.5" />
      )}
      <span>{syncMutation.isPending ? "Syncing..." : "Sync Listings"}</span>
    </Button>
  );
}
