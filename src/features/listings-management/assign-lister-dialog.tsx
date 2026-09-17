"use client";

import { useMemo, useState } from "react";
import { Popover } from "@base-ui/react/popover";
import { ChevronDown, Loader2 } from "lucide-react";

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
import { MemberOptionRow } from "@/components/ui/member-option-row";
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
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const selectedLister = useMemo(
    () => listers.find((lister) => lister.userId === listerId),
    [listerId, listers],
  );
  const selectedState = selectedLister
    ? getAssignmentAvailabilityState(selectedLister, "LISTER")
    : "AVAILABLE";
  const hasNoListers = !isLoadingListers && listers.length === 0;
  const selectorDisabled = isLoadingListers || isSubmitting || hasNoListers;

  const handleAssign = async () => {
    if (!listerId) return;
    await onAssign(listerId);
  };

  return (
    <>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor={`assign-lister-${itemId}`}>Lister</Label>
          <Popover.Root open={isSelectorOpen} onOpenChange={setIsSelectorOpen}>
            <Popover.Trigger
              aria-describedby={hasNoListers ? `assign-lister-help-${itemId}` : undefined}
              className="flex h-11 w-full items-center justify-between gap-2 rounded-md border border-input bg-background px-3 text-left text-sm outline-none transition-colors hover:bg-muted/50 focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              disabled={selectorDisabled}
              id={`assign-lister-${itemId}`}
            >
              {selectedLister ? (
                <MemberOptionRow
                  email={selectedLister.email}
                  name={selectedLister.name}
                  profileImageUrl={selectedLister.profileImageUrl}
                  showEmail={false}
                />
              ) : (
                <span className="text-muted-foreground">
                  {isLoadingListers ? "Loading Listers..." : "Select a Lister"}
                </span>
              )}
              <ChevronDown aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
            </Popover.Trigger>

            <Popover.Portal>
              <Popover.Positioner
                align="start"
                className="z-[60] outline-hidden"
                side="bottom"
                sideOffset={4}
              >
                <Popover.Popup className="z-[60] w-80 max-w-[calc(100vw-2rem)] rounded-lg border border-border bg-popover p-1 text-popover-foreground shadow-md outline-hidden">
                  <div
                    aria-label="Select a Lister"
                    className="max-h-60 overflow-y-auto p-1"
                    role="listbox"
                  >
                    {listers.map((lister) => {
                      const isSelected = lister.userId === listerId;

                      return (
                        <button
                          aria-selected={isSelected}
                          className="flex w-full rounded-md px-2 py-2 text-left transition-colors hover:bg-muted focus-visible:bg-muted focus-visible:outline-hidden"
                          key={lister.userId}
                          onClick={() => {
                            setListerId(lister.userId);
                            setIsSelectorOpen(false);
                          }}
                          role="option"
                          type="button"
                        >
                          <MemberOptionRow
                            email={lister.email}
                            name={lister.name}
                            profileImageUrl={lister.profileImageUrl}
                            selected={isSelected}
                            statusLabel={availabilityLabel(lister)}
                          />
                        </button>
                      );
                    })}
                  </div>
                </Popover.Popup>
              </Popover.Positioner>
            </Popover.Portal>
          </Popover.Root>
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
