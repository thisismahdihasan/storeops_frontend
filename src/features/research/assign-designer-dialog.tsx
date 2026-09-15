"use client";

import { useMemo, useState } from "react";
import { Loader2 } from "lucide-react";

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
import {
  formatPausedUntil,
  getAssignmentAvailabilityState,
  getAssignmentPausedUntil,
} from "@/features/workspace/workspace-assignment-availability";

import type { ResearchItemListItem } from "./research.types";

type AssignDesignerDialogProps = {
  designers: TeamMember[];
  isLoadingDesigners: boolean;
  isSubmitting: boolean;
  item: ResearchItemListItem | null;
  onAssign: (designerId: string) => Promise<void>;
  onOpenChange: (open: boolean) => void;
  open: boolean;
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

export function AssignDesignerDialog({
  designers,
  isLoadingDesigners,
  isSubmitting,
  item,
  onAssign,
  onOpenChange,
  open,
}: AssignDesignerDialogProps) {
  if (!item) return null;

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Assign Designer</DialogTitle>
          <DialogDescription>
            Choose a Designer for {item.title || `listing ${item.etsyListingId}`}.
          </DialogDescription>
        </DialogHeader>
        {open && (
          <AssignDesignerForm
            designers={designers}
            isLoadingDesigners={isLoadingDesigners}
            isSubmitting={isSubmitting}
            itemId={item.id}
            onAssign={onAssign}
            onClose={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

type AssignDesignerFormProps = {
  designers: TeamMember[];
  isLoadingDesigners: boolean;
  isSubmitting: boolean;
  itemId: string;
  onAssign: (designerId: string) => Promise<void>;
  onClose: () => void;
};

function AssignDesignerForm({
  designers,
  isLoadingDesigners,
  isSubmitting,
  itemId,
  onAssign,
  onClose,
}: AssignDesignerFormProps) {
  const [designerId, setDesignerId] = useState("");
  const selectedDesigner = useMemo(
    () => designers.find((designer) => designer.userId === designerId),
    [designerId, designers],
  );
  const selectedState = selectedDesigner
    ? getAssignmentAvailabilityState(selectedDesigner, "DESIGNER")
    : "AVAILABLE";
  const hasNoDesigners = !isLoadingDesigners && designers.length === 0;

  const handleAssign = async () => {
    if (!designerId) return;
    await onAssign(designerId);
  };

  return (
    <>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor={`assign-designer-${itemId}`}>Designer</Label>
          <select
            aria-describedby={hasNoDesigners ? `assign-designer-help-${itemId}` : undefined}
            className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isLoadingDesigners || isSubmitting || hasNoDesigners}
            id={`assign-designer-${itemId}`}
            onChange={(event) => setDesignerId(event.target.value)}
            value={designerId}
          >
            <option value="">
              {isLoadingDesigners ? "Loading Designers..." : "Select a Designer"}
            </option>
            {designers.map((designer) => (
              <option key={designer.userId} value={designer.userId}>
                {displayName(designer)} — {designer.email} — {availabilityLabel(designer)}
              </option>
            ))}
          </select>
          {hasNoDesigners && (
            <p className="text-xs text-muted-foreground" id={`assign-designer-help-${itemId}`}>
              No Designers are available in this workspace.
            </p>
          )}
        </div>

        {selectedDesigner && selectedState !== "AVAILABLE" && (
          <InlineNotice title="Manual assignment allowed" variant="warning">
            This Designer is {selectedState === "OFF" ? "off" : "paused"} for
            automatic assignments, but manual assignment is still allowed.
          </InlineNotice>
        )}
      </div>

      <DialogFooter>
        <Button disabled={isSubmitting} onClick={onClose} type="button" variant="outline">
          Cancel
        </Button>
        <Button
          disabled={!designerId || isLoadingDesigners || isSubmitting || hasNoDesigners}
          onClick={() => void handleAssign()}
          type="button"
        >
          {isSubmitting && <Loader2 className="size-3.5 animate-spin" />}
          {isSubmitting ? "Assigning..." : "Assign Designer"}
        </Button>
      </DialogFooter>
    </>
  );
}
