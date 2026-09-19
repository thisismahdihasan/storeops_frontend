"use client";

import { useMemo } from "react";
import { AlertCircle, AlertTriangle, Loader2 } from "lucide-react";

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

import type {
  BulkFinalAssetCleanupFailure,
  StorageCleanupCandidate,
} from "./storage-cleanup.types";

type StorageBulkDeleteDialogProps = {
  failures?: BulkFinalAssetCleanupFailure[] | null;
  isDeleting: boolean;
  onClearFailures?: () => void;
  onConfirm: () => Promise<void>;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  selectedCandidates: StorageCleanupCandidate[];
};

export function StorageBulkDeleteDialog({
  failures,
  isDeleting,
  onClearFailures,
  onConfirm,
  onOpenChange,
  open,
  selectedCandidates,
}: StorageBulkDeleteDialogProps) {
  const selectedCount = selectedCandidates.length;

  const totalSizeFormatted = useMemo(() => {
    let totalBytes = BigInt(0);
    for (const item of selectedCandidates) {
      try {
        totalBytes += BigInt(item.fileSize);
      } catch {
        // ignore invalid
      }
    }
    return formatFileSize(totalBytes.toString());
  }, [selectedCandidates]);

  const hasFailures = failures && failures.length > 0;

  const handleClose = () => {
    if (isDeleting) return;
    if (hasFailures && onClearFailures) {
      onClearFailures();
    }
    onOpenChange(false);
  };

  return (
    <Dialog onOpenChange={(next) => !isDeleting && (next ? onOpenChange(true) : handleClose())} open={open}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="size-5" />
            <DialogTitle>
              Permanently Delete {selectedCount} Final ZIP{selectedCount === 1 ? "" : "s"}?
            </DialogTitle>
          </div>
          <DialogDescription>
            Selected packages will be permanently removed from managed storage.
          </DialogDescription>
        </DialogHeader>

        {/* Selected Summary Card */}
        <div className="rounded-lg border border-border bg-muted/40 p-3.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Selected Packages</span>
            <span className="font-semibold text-foreground">{selectedCount}</span>
          </div>
          <div className="flex items-center justify-between pt-2 mt-2 border-t border-border/60">
            <span className="text-muted-foreground">Total Space to Reclaim</span>
            <span className="font-medium text-foreground">{totalSizeFormatted}</span>
          </div>
        </div>

        {/* Failure Summary (if any) */}
        {hasFailures && (
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs space-y-2">
            <div className="flex items-center gap-1.5 font-medium text-amber-800 dark:text-amber-300">
              <AlertCircle className="size-4" />
              <span>Some items could not be deleted ({failures.length})</span>
            </div>
            <ul className="divide-y divide-amber-500/20 max-h-32 overflow-y-auto">
              {failures.slice(0, 5).map((f) => (
                <li key={f.finalAssetId} className="py-1 text-[11px] text-amber-900 dark:text-amber-200">
                  <span className="font-mono">{f.finalAssetId.slice(0, 8)}…</span>: {f.reason}
                </li>
              ))}
              {failures.length > 5 && (
                <li className="pt-1 text-[11px] text-amber-800/80 dark:text-amber-300/80 italic">
                  + {failures.length - 5} more
                </li>
              )}
            </ul>
          </div>
        )}

        {/* Safety Copy */}
        <div className="space-y-1.5 text-xs text-muted-foreground">
          <p className="font-medium text-foreground">Please note:</p>
          <ul className="list-disc pl-4 space-y-1 text-xs">
            <li>The production ZIPs will be permanently removed from StoreOps managed storage.</li>
            <li>The published Etsy listings will not be affected.</li>
            <li>Research and listing history remain intact.</li>
            <li>The ZIPs will no longer be downloadable.</li>
            <li>This action cannot be undone automatically.</li>
          </ul>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            disabled={isDeleting}
            onClick={handleClose}
            type="button"
            variant="outline"
          >
            {hasFailures ? "Close" : "Cancel"}
          </Button>
          {!hasFailures && (
            <Button
              disabled={isDeleting || selectedCount === 0}
              onClick={() => void onConfirm()}
              type="button"
              variant="destructive"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="size-3.5 animate-spin mr-1.5" />
                  Deleting {selectedCount} ZIPs…
                </>
              ) : (
                `Delete ${selectedCount} Selected ZIPs`
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
