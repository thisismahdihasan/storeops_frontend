"use client";

import { useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { InlineNotice } from "@/components/ui/inline-notice";
import { Label } from "@/components/ui/label";
import type { TeamMember } from "@/features/team/team.types";
import { useTeamMembers } from "@/features/team/use-team";
import {
  formatPausedUntil,
  getAssignmentAvailabilityState,
  getAssignmentPausedUntil,
} from "@/features/workspace/workspace-assignment-availability";
import { ApiError } from "@/lib/api";

import { useBulkAssignResearchDesigners } from "./use-research";

type BulkAssignmentMode = "DISTRIBUTE" | "TARGET";

type BulkAssignDesignersDialogProps = {
  onOpenChange: (open: boolean) => void;
  onStaleConflict: () => Promise<void>;
  onSuccess: () => void;
  open: boolean;
  researchItemIds: string[];
  workspaceId: string;
};

function displayName(member: TeamMember): string {
  return member.name || member.email;
}

function availabilityLabel(member: TeamMember): string {
  const state = getAssignmentAvailabilityState(member, "DESIGNER");
  if (state === "OFF") return "Off";
  if (state === "PAUSED") {
    const pausedUntil = formatPausedUntil(
      getAssignmentPausedUntil(member, "DESIGNER"),
    );
    return pausedUntil ? `Paused until ${pausedUntil}` : "Paused";
  }
  return "Available";
}

export function BulkAssignDesignersDialog({
  onOpenChange,
  onStaleConflict,
  onSuccess,
  open,
  researchItemIds,
  workspaceId,
}: BulkAssignDesignersDialogProps) {
  const [mode, setMode] = useState<BulkAssignmentMode>("TARGET");
  const [designerId, setDesignerId] = useState("");
  const membersQuery = useTeamMembers(workspaceId, open);
  const bulkAssignMutation = useBulkAssignResearchDesigners(workspaceId);
  const designers = (membersQuery.data?.data.members ?? []).filter((member) =>
    member.roles.includes("DESIGNER"),
  );
  const selectedDesigner = useMemo(
    () => designers.find((designer) => designer.userId === designerId),
    [designerId, designers],
  );
  const selectedState = selectedDesigner
    ? getAssignmentAvailabilityState(selectedDesigner, "DESIGNER")
    : "AVAILABLE";
  const hasNoDesigners =
    !membersQuery.isLoading && !membersQuery.isError && designers.length === 0;

  const handleSubmit = async () => {
    if (researchItemIds.length === 0) return;
    if (mode === "TARGET" && !designerId) return;

    try {
      const result = await bulkAssignMutation.mutateAsync(
        mode === "TARGET"
          ? { designerId, mode, researchItemIds }
          : { mode, researchItemIds },
      );
      const assignedCount = result.data.assignedCount;
      toast.success(
        mode === "TARGET" && selectedDesigner
          ? `${assignedCount} items assigned to ${displayName(selectedDesigner)}`
          : `${assignedCount} items distributed`,
      );
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        const isNoCandidateConflict = /no eligible designers/i.test(error.message);
        toast.error(
          isNoCandidateConflict
            ? "No available Designers can receive distributed work. Update assignment availability or choose a specific team member."
            : "Some selected items are no longer available for assignment. The list has been refreshed.",
        );
        await onStaleConflict();
        onOpenChange(false);
        return;
      }
      toast.error("Unable to assign selected items.");
    }
  };

  const targetUnavailable = mode === "TARGET" && hasNoDesigners;
  const submitDisabled =
    researchItemIds.length === 0 ||
    bulkAssignMutation.isPending ||
    targetUnavailable ||
    (mode === "TARGET" && !designerId);

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Assign selected items</DialogTitle>
          <DialogDescription>
            Choose how to assign {researchItemIds.length} selected research item{researchItemIds.length === 1 ? "" : "s"}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium text-foreground">Assignment method</legend>
            <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-muted/50 has-[:checked]:border-primary has-[:checked]:bg-primary/5">
              <input
                checked={mode === "TARGET"}
                className="mt-0.5 size-4 accent-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                disabled={bulkAssignMutation.isPending}
                name="designer-bulk-assignment-method"
                onChange={() => setMode("TARGET")}
                type="radio"
              />
              <span>
                <span className="block text-sm font-medium">Specific team member</span>
                <span className="block text-xs text-muted-foreground">Choose one Designer for every selected item.</span>
              </span>
            </label>
            <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-muted/50 has-[:checked]:border-primary has-[:checked]:bg-primary/5">
              <input
                checked={mode === "DISTRIBUTE"}
                className="mt-0.5 size-4 accent-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                disabled={bulkAssignMutation.isPending}
                name="designer-bulk-assignment-method"
                onChange={() => setMode("DISTRIBUTE")}
                type="radio"
              />
              <span>
                <span className="block text-sm font-medium">Distribute by workload</span>
                <span className="block text-xs text-muted-foreground">Distribute selected items among currently available Designers based on workload.</span>
              </span>
            </label>
          </fieldset>

          {mode === "TARGET" ? (
            <div className="space-y-2">
              <Label htmlFor="bulk-assign-designer">Designer</Label>
              <select
                aria-describedby={hasNoDesigners ? "bulk-assign-designer-help" : undefined}
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                disabled={membersQuery.isLoading || membersQuery.isError || bulkAssignMutation.isPending || hasNoDesigners}
                id="bulk-assign-designer"
                onChange={(event) => setDesignerId(event.target.value)}
                value={designerId}
              >
                <option value="">
                  {membersQuery.isLoading ? "Loading Designers..." : "Select a Designer"}
                </option>
                {designers.map((designer) => (
                  <option key={designer.userId} value={designer.userId}>
                    {displayName(designer)} — {designer.email} — {availabilityLabel(designer)}
                  </option>
                ))}
              </select>
              {hasNoDesigners && (
                <p className="text-xs text-muted-foreground" id="bulk-assign-designer-help">
                  No Designers are available in this workspace.
                </p>
              )}
              {selectedDesigner && selectedState !== "AVAILABLE" && (
                <InlineNotice title="Manual assignment allowed" variant="warning">
                  This Designer is {selectedState === "OFF" ? "off" : "paused"} for automatic assignments, but manual assignment is still allowed.
                </InlineNotice>
              )}
            </div>
          ) : (
            <InlineNotice title="Distribute by workload" variant="info">
              Selected items will be distributed among currently available Designers based on workload.
            </InlineNotice>
          )}
        </div>

        <DialogFooter>
          <Button disabled={bulkAssignMutation.isPending} onClick={() => onOpenChange(false)} type="button" variant="outline">
            Cancel
          </Button>
          <Button disabled={submitDisabled} onClick={() => void handleSubmit()} type="button">
            {bulkAssignMutation.isPending && <Loader2 className="size-3.5 animate-spin" />}
            {bulkAssignMutation.isPending ? "Assigning..." : "Assign selected"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
