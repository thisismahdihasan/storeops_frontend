/* eslint-disable @next/next/no-img-element */
"use client";

import { ArrowRight, ImageOff, User } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";

import type { ReviewQueueItem } from "./reviews.types";

type ReviewListProps = {
  items: ReviewQueueItem[];
  workspaceId: string;
};

function formatSubmittedTime(value: string): string {
  try {
    return new Intl.DateTimeFormat(undefined, {
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

export function ReviewList({ items, workspaceId }: ReviewListProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map(({ designer, researchItem, review }) => {
        const isImageAvailable =
          review.imageUrl !== null && review.imageDeletedAt === null;
        const designerDisplayName =
          designer?.name || designer?.email || "Unassigned";

        return (
          <article
            className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-xs transition-all hover:border-primary/40 hover:shadow-md"
            key={review.id}
          >
            {/* Image Thumbnail Preview */}
            <div className="relative aspect-video w-full overflow-hidden bg-muted/40">
              {isImageAvailable ? (
                <img
                  alt={`Round ${review.roundNumber} preview for ${
                    researchItem.title || researchItem.etsyListingId
                  }`}
                  className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                  src={review.imageUrl ?? undefined}
                />
              ) : (
                <div className="flex size-full flex-col items-center justify-center gap-1.5 p-4 text-muted-foreground">
                  <ImageOff className="size-6 stroke-[1.5]" />
                  <span className="text-xs font-medium">
                    Preview unavailable
                  </span>
                </div>
              )}

              {/* Round Badge Overlay */}
              <div className="absolute top-2.5 left-2.5">
                <Badge
                  className="bg-black/70 text-xs font-medium text-white backdrop-blur-xs hover:bg-black/80"
                  variant="secondary"
                >
                  Round {review.roundNumber}
                </Badge>
              </div>

              {/* Status Badge Overlay */}
              <div className="absolute top-2.5 right-2.5">
                <StatusBadge label="Design Review" tone="info" />
              </div>
            </div>

            {/* Content Body */}
            <div className="flex flex-1 flex-col justify-between p-4 sm:p-5">
              <div className="space-y-3">
                <div>
                  <h3 className="line-clamp-2 text-sm font-semibold tracking-tight text-foreground">
                    {researchItem.title || `Listing #${researchItem.etsyListingId}`}
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Etsy ID: {researchItem.etsyListingId}
                  </p>
                </div>

                {/* Designer Info */}
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <div className="flex size-5 items-center justify-center rounded-full bg-muted text-muted-foreground">
                    <User className="size-3" />
                  </div>
                  <span className="truncate">{designerDisplayName}</span>
                </div>

                {/* Submitted Timestamp */}
                <p className="text-[11px] text-muted-foreground">
                  Submitted {formatSubmittedTime(review.submittedAt)}
                </p>

                {review.note && (
                  <p className="line-clamp-2 rounded-lg bg-muted/40 p-2 text-xs text-muted-foreground italic">
                    &ldquo;{review.note}&rdquo;
                  </p>
                )}
              </div>

              {/* Action Button */}
              <div className="mt-4 pt-3 border-t border-border">
                <Button
                  className="w-full justify-between"
                  nativeButton={false}
                  render={
                    <Link
                      href={`/w/${workspaceId}/reviews/${review.id}`}
                    />
                  }
                  size="sm"
                >
                  <span>Review Round {review.roundNumber}</span>
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                </Button>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
