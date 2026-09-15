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

import type { AdminListingItem } from "./listings-admin.types";

type AssignListerDialogProps = {
  isLoadingListers: boolean;
  isSubmitting: boolean;
  item: AdminListingItem | null;
  listers: TeamMember[];
  onAssign: (listerId: string) => Promise<void>;
  onOpenChange: (open: boolean) => void;
  open: boolean;
};

function displayName(member: TeamMember): string {
  return member.name || member.email;
}

function availabilityLabel(member: TeamMember): string {
  const state = getAssignmentAvailabilityState(member, "LISTER");
  if (state === "OFF") return "Off";
  if (state === "PAUSED") {
    const pausedUntil = formatPausedUntil(
      getAssignmentPausedUntil(member, "LISTER"),
    );
    return pausedUntil ? `Paused until ${pausedUntil}` : "Paused";
  }
  return "Available";
}

export function AssignListerDialog({
  isLoadingListers,
  isSubmitting,
  item,
  listers,
  onAssign,
  onOpenChange,
  open,
}: AssignListerDialogProps) {
  if (!item) return null;

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Assign Lister</DialogTitle>
          <DialogDescription>
            Choose a Lister for {item.title || `listing ${item.etsyListingId}`}.
          </DialogDescription>
        </DialogHeader>
        {open && (
          <AssignListerForm
            isLoadingListers={isLoadingListers}
            isSubmitting={isSubmitting}
            itemId={item.id}
            listers={listers}
            onAssign={onAssign}
            onClose={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

type AssignListerFormProps = {
  isLoadingListers: boolean;
  isSubmitting: boolean;
  itemId: string;
  listers: TeamMember[];
  onAssign: (listerId: string) => Promise<void>;
  onClose: () => void;
};

function AssignListerForm({
  isLoadingListers,
  isSubmitting,
  itemId,
  listers,
  onAssign,
  onClose,
}: AssignListerFormProps) {
  const [listerId, setListerId] = useState("");
  const selectedLister = useMemo(
    () => listers.find((lister) => lister.userId === listerId),
    [listerId, listers],
  );
  const selectedState = selectedLister
    ? getAssignmentAvailabilityState(selectedLister, "LISTER")
    : "AVAILABLE";
  const hasNoListers = !isLoadingListers && listers.length === 0;

  const handleAssign = async () => {
    if (!listerId) return;
    await onAssign(listerId);
  };

  return (
    <>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor={`assign-lister-${itemId}`}>Lister</Label>
          <select
            aria-describedby={hasNoListers ? `assign-lister-help-${itemId}` : undefined}
            className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isLoadingListers || isSubmitting || hasNoListers}
            id={`assign-lister-${itemId}`}
            onChange={(event) => setListerId(event.target.value)}
            value={listerId}
          >
            <option value="">
              {isLoadingListers ? "Loading Listers..." : "Select a Lister"}
            </option>
            {listers.map((lister) => (
              <option key={lister.userId} value={lister.userId}>
                {displayName(lister)} — {lister.email} — {availabilityLabel(lister)}
              </option>
            ))}
          </select>
          {hasNoListers && (
            <p className="text-xs text-muted-foreground" id={`assign-lister-help-${itemId}`}>
              No Listers are available in this workspace.
            </p>
          )}
        </div>

        {selectedLister && selectedState !== "AVAILABLE" && (
          <InlineNotice title="Manual assignment allowed" variant="warning">
            This Lister is {selectedState === "OFF" ? "off" : "paused"} for
            automatic assignments, but manual assignment is still allowed.
          </InlineNotice>
        )}
      </div>

      <DialogFooter>
        <Button disabled={isSubmitting} onClick={onClose} type="button" variant="outline">
          Cancel
        </Button>
        <Button
          disabled={!listerId || isLoadingListers || isSubmitting || hasNoListers}
          onClick={() => void handleAssign()}
          type="button"
        >
          {isSubmitting && <Loader2 className="size-3.5 animate-spin" />}
          {isSubmitting ? "Assigning..." : "Assign Lister"}
        </Button>
      </DialogFooter>
    </>
  );
}
