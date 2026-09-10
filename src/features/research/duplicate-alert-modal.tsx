"use client";

import { AlertCircle, ArrowRight, Calendar, User } from "lucide-react";

import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { DuplicateResearchData, ResearchStatus } from "./research.types";

type DuplicateAlertModalProps = {
  duplicateData: DuplicateResearchData | null;
  onClose: () => void;
  onViewExistingItem: (researchItemId: string) => void;
  open: boolean;
};

function getStatusTone(
  status: ResearchStatus,
): "danger" | "info" | "neutral" | "success" | "warning" {
  switch (status) {
    case "CORRECTION_NEEDED":
      return "warning";
    case "ISSUE_REPORTED":
      return "danger";
    case "DESIGN_APPROVED":
    case "LISTED":
      return "success";
    case "DESIGN_IN_PROGRESS":
    case "DESIGN_REVIEW":
    case "READY_FOR_LISTING":
    case "LISTING_IN_PROGRESS":
      return "info";
    default:
      return "neutral";
  }
}

function formatStatusLabel(status: ResearchStatus): string {
  return status
    .split("_")
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(" ");
}

export function DuplicateAlertModal({
  duplicateData,
  onClose,
  onViewExistingItem,
  open,
}: DuplicateAlertModalProps) {
  if (!duplicateData) {
    return null;
  }

  const creatorName =
    duplicateData.createdBy.name || duplicateData.createdBy.email;
  const createdDate = new Date(duplicateData.createdAt).toLocaleDateString(
    undefined,
    {
      day: "numeric",
      month: "short",
      year: "numeric",
    },
  );

  const handleView = () => {
    onClose();
    onViewExistingItem(duplicateData.researchItemId);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-md p-6">
        <DialogHeader>
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-500">
            <AlertCircle className="size-5 shrink-0" />
            <DialogTitle className="text-base">Listing Already Added</DialogTitle>
          </div>
          <DialogDescription className="mt-1 text-xs">
            This Etsy listing already exists in this workspace and cannot be re-added as a new research item.
          </DialogDescription>
        </DialogHeader>

        <div className="my-2 space-y-3 rounded-lg border border-border bg-muted/30 p-3.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Current Status:</span>
            <StatusBadge
              label={formatStatusLabel(duplicateData.currentStatus)}
              tone={getStatusTone(duplicateData.currentStatus)}
            />
          </div>

          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <User className="size-3.5" />
              <span>Added by:</span>
            </span>
            <span className="font-medium text-foreground">{creatorName}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <Calendar className="size-3.5" />
              <span>Date Added:</span>
            </span>
            <span className="text-foreground">{createdDate}</span>
          </div>
        </div>

        <DialogFooter className="mt-2 flex-row justify-end gap-2 sm:flex-row">
          <Button variant="outline" size="sm" onClick={onClose}>
            Dismiss
          </Button>
          <Button size="sm" onClick={handleView}>
            <span>View Existing Item</span>
            <ArrowRight className="size-3.5" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
