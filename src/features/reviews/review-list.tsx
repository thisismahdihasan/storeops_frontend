/* eslint-disable @next/next/no-img-element */
"use client";

import { ArrowRight, ImageOff } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { UserAvatar } from "@/components/ui/user-avatar";

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
    <div className="grid gap-4 min-[640px]:grid-cols-2 min-[900px]:grid-cols-3 min-[1200px]:grid-cols-4">
      {items.map(({ designer, researchItem, review }) => {
        const isImageAvailable =
          review.imageUrl !== null && review.imageDeletedAt === null;
        const designerDisplayName =
          designer?.name || designer?.email || "Unassigned";
        const title = researchItem.title?.trim() || null;

        return (
          <Link
            aria-label={`Review Round ${review.roundNumber} for Etsy #${researchItem.etsyListingId}`}
            className="group block cursor-pointer rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-offset-2"
            href={`/w/${workspaceId}/reviews/${review.id}`}
            key={review.id}
          >
            <article className="flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-xs transition-colors group-hover:border-primary/40 group-hover:shadow-md group-focus-visible:border-primary/60">
            {/* Image Thumbnail Preview */}
            <div className="relative aspect-video w-full overflow-hidden bg-muted/40">
              {isImageAvailable ? (
                <img
                  alt={`Round ${review.roundNumber} preview for Etsy #${researchItem.etsyListingId}`}
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
                <Badge
                  className="rounded-full bg-blue-600/90 px-2 py-0.5 text-xs font-medium text-white shadow-sm backdrop-blur-xs hover:bg-blue-600/95"
                  variant="secondary"
                >
                  Design Review
                </Badge>
              </div>
            </div>

            {/* Content Body */}
            <div className="flex flex-1 flex-col justify-between p-4">
              <div className="space-y-3">
                <div className="space-y-1">
                  <p className="font-mono text-xs text-muted-foreground">
                    Etsy #{researchItem.etsyListingId}
                  </p>
                  {title ? (
                    <h3 className="line-clamp-2 text-sm font-semibold tracking-tight text-foreground">
                      {title}
                    </h3>
                  ) : null}
                </div>

                {/* Designer Info */}
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <UserAvatar
                    email={designer?.email}
                    name={designer?.name}
                    profileImageUrl={designer?.profileImageUrl}
                    size="xs"
                  />
                  <span className="truncate font-medium text-foreground/80">
                    {designerDisplayName}
                  </span>
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
              <div className="mt-4 border-t border-border pt-3">
                <div className="inline-flex h-9 w-full items-center justify-between gap-1.5 rounded-lg border border-transparent bg-primary px-2.5 font-ui text-sm font-medium text-primary-foreground transition-colors group-hover:bg-primary/80">
                  <span>Review Round {review.roundNumber}</span>
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                </div>
              </div>
            </div>
            </article>
          </Link>
        );
      })}
    </div>
  );
}
