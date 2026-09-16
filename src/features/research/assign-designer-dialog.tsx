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
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const selectedDesigner = useMemo(
    () => designers.find((designer) => designer.userId === designerId),
    [designerId, designers],
  );
  const selectedState = selectedDesigner
    ? getAssignmentAvailabilityState(selectedDesigner, "DESIGNER")
    : "AVAILABLE";
  const hasNoDesigners = !isLoadingDesigners && designers.length === 0;
  const selectorDisabled = isLoadingDesigners || isSubmitting || hasNoDesigners;

  const handleAssign = async () => {
    if (!designerId) return;
    await onAssign(designerId);
  };

  return (
    <>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor={`assign-designer-${itemId}`}>Designer</Label>
          <Popover.Root open={isSelectorOpen} onOpenChange={setIsSelectorOpen}>
            <Popover.Trigger
              aria-describedby={hasNoDesigners ? `assign-designer-help-${itemId}` : undefined}
              className="flex h-11 w-full items-center justify-between gap-2 rounded-md border border-input bg-background px-3 text-left text-sm outline-none transition-colors hover:bg-muted/50 focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              disabled={selectorDisabled}
              id={`assign-designer-${itemId}`}
            >
              {selectedDesigner ? (
                <MemberOptionRow
                  email={selectedDesigner.email}
                  name={selectedDesigner.name}
                  profileImageUrl={selectedDesigner.profileImageUrl}
                  showEmail={false}
                />
              ) : (
                <span className="text-muted-foreground">
                  {isLoadingDesigners ? "Loading Designers..." : "Select a Designer"}
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
                    aria-label="Select a Designer"
                    className="max-h-60 overflow-y-auto p-1"
                    role="listbox"
                  >
                    {designers.map((designer) => {
                      const isSelected = designer.userId === designerId;

                      return (
                        <button
                          aria-selected={isSelected}
                          className="flex w-full rounded-md px-2 py-2 text-left transition-colors hover:bg-muted focus-visible:bg-muted focus-visible:outline-hidden"
                          key={designer.userId}
                          onClick={() => {
                            setDesignerId(designer.userId);
                            setIsSelectorOpen(false);
                          }}
                          role="option"
                          type="button"
                        >
                          <MemberOptionRow
                            email={designer.email}
                            name={designer.name}
                            profileImageUrl={designer.profileImageUrl}
                            selected={isSelected}
                            statusLabel={availabilityLabel(designer)}
                          />
                        </button>
                      );
                    })}
                  </div>
                </Popover.Popup>
              </Popover.Positioner>
            </Popover.Portal>
          </Popover.Root>
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
