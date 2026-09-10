/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useState } from "react";
import { AlertCircle, ImageIcon, Loader2, RefreshCw, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useResearchReferenceImage } from "./use-research";

type AuthenticatedReferenceImageProps = {
  alt: string;
  className?: string;
  containerClassName?: string;
  enabled?: boolean;
  hasImage: boolean;
  isActive?: boolean;
  onOpenUpload?: () => void;
  researchItemId: string;
  userCanUpload?: boolean;
  workspaceId: string;
};

export function AuthenticatedReferenceImage({
  alt,
  className,
  containerClassName,
  enabled = true,
  hasImage,
  isActive = true,
  onOpenUpload,
  researchItemId,
  userCanUpload = false,
  workspaceId,
}: AuthenticatedReferenceImageProps) {
  const active = isActive && enabled;
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [decodeError, setDecodeError] = useState(false);

  const {
    data: blob,
    error,
    isError,
    isLoading,
    refetch,
  } = useResearchReferenceImage(workspaceId, researchItemId, active && hasImage);

  // Manage component-instance Object URL lifecycle
  useEffect(() => {
    if (!blob || !active) return;

    const nextObjectUrl = URL.createObjectURL(blob);
    let isCancelled = false;

    queueMicrotask(() => {
      if (!isCancelled) {
        setObjectUrl(nextObjectUrl);
      }
    });

    return () => {
      isCancelled = true;
      URL.revokeObjectURL(nextObjectUrl);
      setObjectUrl(null);
    };
  }, [blob, active]);

  // State 1: No reference image exists
  if (!hasImage) {
    return (
      <div
        className={cn(
          "flex min-h-[200px] w-full flex-col items-center justify-center gap-2 p-4 text-center text-muted-foreground",
          containerClassName,
        )}
      >
        <div className="rounded-full bg-muted/60 p-3">
          <ImageIcon className="size-8 text-muted-foreground/80" />
        </div>
        <p className="text-xs font-medium text-foreground">
          No reference image available
        </p>
        <p className="max-w-xs text-[11px] text-muted-foreground">
          This item does not currently have a visual reference asset attached.
        </p>
        {userCanUpload && onOpenUpload && (
          <Button
            type="button"
            size="xs"
            variant="outline"
            onClick={onOpenUpload}
            className="mt-2 gap-1.5 text-xs"
          >
            <Upload className="size-3" />
            <span>Add Reference Image</span>
          </Button>
        )}
      </div>
    );
  }

  // State 2: Image request or decode failed
  if (isError || decodeError) {
    return (
      <div
        className={cn(
          "flex min-h-[200px] w-full flex-col items-center justify-center gap-2 p-4 text-center text-destructive",
          containerClassName,
        )}
      >
        <div className="rounded-full bg-destructive/10 p-2.5">
          <AlertCircle className="size-6 text-destructive" />
        </div>
        <p className="text-xs font-semibold">Unable to load reference image</p>
        <p className="max-w-xs text-[11px] text-muted-foreground">
          {error instanceof Error
            ? error.message
            : "An authenticated error occurred while retrieving the image."}
        </p>
        <Button
          type="button"
          size="xs"
          variant="outline"
          onClick={() => {
            setDecodeError(false);
            void refetch();
          }}
          className="mt-2 gap-1.5 text-xs"
        >
          <RefreshCw className="size-3" />
          <span>Retry</span>
        </Button>
      </div>
    );
  }

  // State 3: Image exists and is loading or preparing object URL
  if (isLoading || !objectUrl) {
    return (
      <div
        className={cn(
          "flex min-h-[200px] w-full flex-col items-center justify-center gap-2.5 p-4 text-center text-muted-foreground",
          containerClassName,
        )}
      >
        <Loader2 className="size-6 animate-spin text-primary" />
        <span className="text-xs">Loading reference image…</span>
      </div>
    );
  }

  // State 4: Image loaded successfully with fresh object URL
  return (
    <div
      className={cn(
        "flex w-full items-center justify-center overflow-hidden",
        containerClassName,
      )}
    >
      <img
        src={objectUrl}
        alt={alt}
        onError={() => setDecodeError(true)}
        className={cn(
          "max-h-[340px] max-w-full rounded-md object-contain",
          className,
        )}
      />
    </div>
  );
}
