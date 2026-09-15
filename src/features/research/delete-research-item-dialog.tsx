"use client";

import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { ResearchStatus } from "./research.types";
import { useDeleteResearchItem } from "./use-research";

export type DeleteResearchItemTarget = {
  etsyListingId?: string;
  id: string;
  status: ResearchStatus;
  title?: string | null;
};

export type DeleteResearchItemDialogProps = {
  item: DeleteResearchItemTarget | null;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  open: boolean;
  workspaceId: string;
};

export type DeleteConfirmationConfig = {
  confirmLabel: string;
  description: string;
  title: string;
};

export function getDeleteConfirmationConfig(
  status: ResearchStatus
): DeleteConfirmationConfig {
  switch (status) {
    case "RESEARCHED":
    case "ASSIGNED":
      return {
        title: "Delete Research Item",
        description:
          "This permanently removes this research item and its assignment. This action cannot be undone.",
        confirmLabel: "Delete Item",
      };

    case "DESIGN_IN_PROGRESS":
    case "DESIGN_REVIEW":
    case "CORRECTION_NEEDED":
    case "ISSUE_REPORTED":
    case "DESIGN_APPROVED":
    case "READY_FOR_LISTING":
    case "LISTING_IN_PROGRESS":
      return {
        title: "Delete In-Production Item?",
        description:
          "This permanently deletes this item and all associated work, including design assignments, review history, and uploaded final assets. This action cannot be undone.",
        confirmLabel: "Delete In-Production Item",
      };

    case "LISTED":
      return {
        title: "Delete Completed Listing Record?",
        description:
          "This permanently removes the StoreOps internal listing and workflow record. The live Etsy listing will NOT be deleted or modified. This action cannot be undone.",
        confirmLabel: "Delete Record Permanently",
      };
  }
}

export function DeleteResearchItemDialog({
  item,
  onOpenChange,
  onSuccess,
  open,
  workspaceId,
}: DeleteResearchItemDialogProps) {
  const deleteMutation = useDeleteResearchItem(workspaceId);

  if (!item) {
    return null;
  }

  const { confirmLabel, description, title } = getDeleteConfirmationConfig(
    item.status
  );

  const handleConfirm = async () => {
    try {
      await deleteMutation.mutateAsync(item.id);
      toast.success("Research item deleted successfully.");
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to delete research item."
      );
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteMutation.isPending}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            disabled={deleteMutation.isPending}
            onClick={() => void handleConfirm()}
            variant="destructive"
            className="gap-1.5"
          >
            {deleteMutation.isPending ? (
              <>
                <Loader2 className="size-3.5 animate-spin" />
                <span>Deleting…</span>
              </>
            ) : (
              confirmLabel
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
