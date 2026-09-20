/* eslint-disable @next/next/no-img-element */
"use client";

import { useState } from "react";
import { AlertCircle, ImageIcon, Loader2, RefreshCw, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getReferenceImageProxyUrl } from "./research.api";

type AuthenticatedReferenceImageProps = {
  alt: string;
  className?: string;
  containerClassName?: string;
  enabled?: boolean;
  hasImage: boolean;
  isActive?: boolean;
  minHeightClassName?: string;
  openImageLabel?: string;
  onOpenImage?: (imageUrl: string) => void;
  onOpenUpload?: () => void;
  researchItemId: string;
  userCanUpload?: boolean;
  version?: string | number;
  workspaceId: string;
};

export function AuthenticatedReferenceImage({
  alt,
  className,
  containerClassName,
  enabled = true,
  hasImage,
  isActive = true,
  minHeightClassName = "min-h-[200px]",
  openImageLabel,
  onOpenImage,
  onOpenUpload,
  researchItemId,
  userCanUpload = false,
  version,
  workspaceId,
}: AuthenticatedReferenceImageProps) {
  const active = isActive && enabled;

  // Track native image load state with a cache-busting key for retry.
  const [loadKey, setLoadKey] = useState(0);
  const [loadState, setLoadState] = useState<"loading" | "loaded" | "error">("loading");

  // The authenticated backend URL — the browser sends the session cookie automatically
  // as a subresource request (not a CORS fetch). The backend validates auth and issues
  // a 302 to Cloudinary. The browser follows in navigation mode, bypassing CORS entirely.
  // Passing version (e.g. item.updatedAt) busts the browser's 24h HTTP 302 redirect cache on replace.
  const imageUrl = getReferenceImageProxyUrl(workspaceId, researchItemId, false, version);

  // When imageUrl changes (e.g. version update after Replace Image), reset loadState to loading
  const [prevImageUrl, setPrevImageUrl] = useState(imageUrl);
  if (prevImageUrl !== imageUrl) {
    setPrevImageUrl(imageUrl);
    setLoadState("loading");
  }

  // State 1: No reference image exists
  if (!hasImage) {
    return (
      <div
        className={cn(
          "flex w-full flex-col items-center justify-center gap-2 p-4 text-center text-muted-foreground",
          minHeightClassName,
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

  // State 2: Image load failed (native onError)
  if (loadState === "error") {
    return (
      <div
        className={cn(
          "flex w-full flex-col items-center justify-center gap-2 p-4 text-center text-destructive",
          minHeightClassName,
          containerClassName,
        )}
      >
        <div className="rounded-full bg-destructive/10 p-2.5">
          <AlertCircle className="size-6 text-destructive" />
        </div>
        <p className="text-xs font-semibold">Unable to load reference image</p>
        <p className="max-w-xs text-[11px] text-muted-foreground">
          An error occurred while retrieving the image.
        </p>
        <Button
          type="button"
          size="xs"
          variant="outline"
          onClick={() => {
            setLoadState("loading");
            setLoadKey((k) => k + 1);
          }}
          className="mt-2 gap-1.5 text-xs"
        >
          <RefreshCw className="size-3" />
          <span>Retry</span>
        </Button>
      </div>
    );
  }

  // When not active/enabled, render nothing
  if (!active) {
    return null;
  }

  // States 3 & 4: loading spinner overlay + image element.
  // The img is always rendered so native load events fire; the spinner sits on top while
  // loadState === "loading" and disappears once the browser fires onLoad.
  return (
    <div
      className={cn(
        "flex w-full items-center justify-center overflow-hidden",
        containerClassName,
      )}
    >
      {/* Loading spinner — visible until the image fires onLoad */}
      {loadState === "loading" && (
        <div
          className={cn(
            "absolute flex flex-col items-center justify-center gap-2.5 p-4 text-muted-foreground",
            minHeightClassName,
          )}
        >
          <Loader2 className="size-6 animate-spin text-primary" />
          <span className="text-xs">Loading reference image…</span>
        </div>
      )}

      {/* The image itself.
          - No crossOrigin attribute: the browser sends the session cookie as a
            first-party subresource (same as any <img> on the page). The backend
            validates auth, then issues 302. The browser follows the redirect to
            Cloudinary in navigation mode — no CORS evaluation occurs.
          - key={loadKey} forces React to unmount/remount the element on retry,
            which causes the browser to re-issue the request fresh. */}
      {onOpenImage ? (
        <button
          aria-label={openImageLabel || `Open ${alt} larger`}
          className={cn(
            "max-w-full rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
            loadState === "loading" && "invisible",
          )}
          onClick={() => onOpenImage(imageUrl)}
          type="button"
        >
          <img
            key={`${loadKey}-${imageUrl}`}
            alt={alt}
            className={cn(
              "max-h-[340px] max-w-full rounded-md object-contain",
              className,
            )}
            onError={() => setLoadState("error")}
            onLoad={() => setLoadState("loaded")}
            src={imageUrl}
          />
        </button>
      ) : (
        <img
          key={`${loadKey}-${imageUrl}`}
          alt={alt}
          className={cn(
            "max-h-[340px] max-w-full rounded-md object-contain",
            loadState === "loading" && "invisible",
            className,
          )}
          onError={() => setLoadState("error")}
          onLoad={() => setLoadState("loaded")}
          src={imageUrl}
        />
      )}
    </div>
  );
}
