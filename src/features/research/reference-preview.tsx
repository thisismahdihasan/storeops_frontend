/* eslint-disable @next/next/no-img-element */
"use client";

import { useState } from "react";
import {
  Download,
  ExternalLink,
  ImageIcon,
  Loader2,
  Maximize2,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { etsyExternalInlineClass } from "@/lib/etsy-styles";
import { AuthenticatedReferenceImage } from "./authenticated-reference-image";
import { downloadResearchReferenceImage } from "./research.api";

export type ReferencePreviewProps = {
  canDownload?: boolean;
  className?: string;
  normalizedUrl?: string;
  onOpenDetail?: () => void;
  referenceImageUrl: string | null;
  researchItemId: string;
  title: string | null;
  userCanUpload?: boolean;
  workspaceId: string;
};

export function ReferencePreview({
  canDownload = true,
  className,
  normalizedUrl,
  onOpenDetail,
  referenceImageUrl,
  researchItemId,
  title,
  userCanUpload = false,
  workspaceId,
}: ReferencePreviewProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const displayTitle = title || "Etsy Reference Preview";

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      await downloadResearchReferenceImage(workspaceId, researchItemId);
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Failed to download reference image.",
      );
    } finally {
      setIsDownloading(false);
    }
  };

  if (!referenceImageUrl || imageError) {
    if (onOpenDetail) {
      return (
        <button
          type="button"
          onClick={onOpenDetail}
          className={cn(
            "flex size-12 shrink-0 items-center justify-center rounded-lg border border-dashed border-border bg-muted/30 text-muted-foreground/60 transition-colors hover:border-primary/50 hover:bg-muted/50 hover:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring",
            className,
          )}
          title={
            userCanUpload
              ? "No reference image. Click to open item and add image."
              : "No reference image available"
          }
        >
          <ImageIcon className="size-4" />
        </button>
      );
    }

    return (
      <div
        className={cn(
          "flex size-12 shrink-0 items-center justify-center rounded-lg border border-border bg-muted/40 text-muted-foreground/60",
          className,
        )}
        title="No reference image available"
      >
        <ImageIcon className="size-4" />
      </div>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={cn(
          "group relative flex size-12 shrink-0 overflow-hidden rounded-lg border border-border bg-muted/40 transition-all hover:ring-2 hover:ring-primary/40 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring",
          className,
        )}
        title="Click to preview reference image"
      >
        <img
          src={referenceImageUrl}
          alt={displayTitle}
          onError={() => setImageError(true)}
          className="size-full object-cover transition-transform group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
          <Maximize2 className="size-3.5 text-white" />
        </div>
      </button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-xl p-6 sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="line-clamp-1 text-base">
              {displayTitle}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Reference image captured from Etsy listing
            </DialogDescription>
          </DialogHeader>

          <div className="relative mt-2 min-h-[250px] max-h-[60vh] w-full overflow-hidden rounded-lg border border-border bg-muted/30 p-2">
            <AuthenticatedReferenceImage
              alt={displayTitle}
              hasImage={Boolean(referenceImageUrl)}
              researchItemId={researchItemId}
              workspaceId={workspaceId}
              enabled={isOpen}
              isActive={isOpen}
              className="max-h-[55vh]"
            />
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-4">
            {normalizedUrl && (
              <a
                href={normalizedUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  "inline-flex items-center gap-1.5 text-xs font-medium transition-colors",
                  etsyExternalInlineClass,
                )}
              >
                <ExternalLink className="size-3.5" />
                <span>Open Etsy Listing</span>
              </a>
            )}

            {canDownload && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => void handleDownload()}
                disabled={isDownloading}
                className="ml-auto gap-1.5"
              >
                {isDownloading ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Download className="size-3.5" />
                )}
                <span>Download Image</span>
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
