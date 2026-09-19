"use client";

import { AlertTriangle, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatFileSize } from "@/lib/format-file-size";

import type { StorageCleanupCandidate } from "./storage-cleanup.types";

type StorageDeleteDialogProps = {
  candidate: StorageCleanupCandidate | null;
  isDeleting: boolean;
  onConfirm: () => Promise<void>;
  onOpenChange: (open: boolean) => void;
  open: boolean;
};

export function StorageDeleteDialog({
  candidate,
  isDeleting,
  onConfirm,
  onOpenChange,
  open,
}: StorageDeleteDialogProps) {
  if (!candidate) return null;

  return (
    <Dialog onOpenChange={(next) => !isDeleting && onOpenChange(next)} open={open}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="size-5" />
            <DialogTitle>Permanently Delete Final ZIP?</DialogTitle>
          </div>
          <DialogDescription>
            Review the item details and permanent deletion implications below.
          </DialogDescription>
        </DialogHeader>

        {/* Item Metadata Box */}
        <div className="rounded-lg border border-border bg-muted/40 p-3.5 text-xs space-y-2">
          <div className="flex flex-col gap-0.5">
            <span className="text-muted-foreground">Etsy Listing Item</span>
            <span className="font-semibold text-foreground line-clamp-1">
              {candidate.title || "Untitled listing item"}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-border/60">
            <div>
              <span className="text-muted-foreground block text-[11px]">Etsy ID</span>
              <span className="font-mono font-medium text-foreground">
                {candidate.etsyListingId}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground block text-[11px]">Size</span>
              <span className="font-medium text-foreground">
                {formatFileSize(candidate.fileSize)}
              </span>
            </div>
          </div>

          <div className="pt-1 border-t border-border/60">
            <span className="text-muted-foreground block text-[11px]">File Name</span>
            <span className="font-mono text-[11px] text-foreground break-all">
              {candidate.fileName}
            </span>
          </div>
        </div>

        {/* Safety Copy */}
        <div className="space-y-1.5 text-xs text-muted-foreground">
          <p className="font-medium text-foreground">Please note:</p>
          <ul className="list-disc pl-4 space-y-1 text-xs">
            <li>The production ZIP will be permanently removed from StoreOps managed storage.</li>
            <li>The published Etsy listing will not be affected.</li>
            <li>Research and listing history remain intact.</li>
            <li>The ZIP will no longer be downloadable.</li>
            <li>This action cannot be undone automatically.</li>
          </ul>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            disabled={isDeleting}
            onClick={() => onOpenChange(false)}
            type="button"
            variant="outline"
          >
            Cancel
          </Button>
          <Button
            disabled={isDeleting}
            onClick={() => void onConfirm()}
            type="button"
            variant="destructive"
          >
            {isDeleting ? (
              <>
                <Loader2 className="size-3.5 animate-spin mr-1.5" />
                Deleting…
              </>
            ) : (
              "Delete ZIP"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
