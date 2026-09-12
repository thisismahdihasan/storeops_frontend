/* eslint-disable @next/next/no-img-element */
"use client";

import { ImageOff } from "lucide-react";
import { useState } from "react";

import { cn } from "@/lib/utils";

import type { ListingApprovedPreview } from "./listing.types";

type ApprovedPreviewProps = {
  alt: string;
  className?: string;
  preview: ListingApprovedPreview;
};

export function ApprovedPreview({ alt, className, preview }: ApprovedPreviewProps) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const imageUrl =
    preview && !preview.imageDeletedAt && preview.imageUrl !== failedUrl
      ? preview.imageUrl
      : null;

  if (!imageUrl) {
    return (
      <div className={cn("flex min-h-36 flex-col items-center justify-center gap-2 bg-muted/30 p-4 text-center", className)}>
        <ImageOff aria-hidden="true" className="size-6 text-muted-foreground" />
        <p className="max-w-48 text-xs text-muted-foreground">
          Approved review image no longer available
        </p>
      </div>
    );
  }

  return (
    <div className={cn("flex min-h-36 items-center justify-center overflow-hidden bg-muted/20 p-2", className)}>
      <img
        alt={alt}
        className="max-h-full max-w-full object-contain"
        onError={() => setFailedUrl(imageUrl)}
        src={imageUrl}
      />
    </div>
  );
}
