/* eslint-disable @next/next/no-img-element */
"use client";

import { ImageIcon } from "lucide-react";

import { AuthenticatedReferenceImage } from "@/features/research/authenticated-reference-image";
import { cn } from "@/lib/utils";

import type { ReviewHistoryItem } from "@/features/reviews/reviews.types";

export type DesignReviewHistorySelection =
  | { kind: "reference" }
  | { kind: "review"; reviewId: string };

type DesignReviewHistoryStripProps = {
  isCorrectionNeeded: boolean;
  latestReviewId: string;
  onSelect: (selection: DesignReviewHistorySelection) => void;
  researchItemId: string;
  reviews: ReviewHistoryItem[];
  selected: DesignReviewHistorySelection;
  workspaceId: string;
};

export function DesignReviewHistoryStrip({
  isCorrectionNeeded,
  latestReviewId,
  onSelect,
  researchItemId,
  reviews,
  selected,
  workspaceId,
}: DesignReviewHistoryStripProps) {
  return (
    <section aria-label="Design review history" className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-foreground">
            Review history
          </h2>
          <p className="text-xs text-muted-foreground">
            Select a reference or review round to inspect its proof and notes.
          </p>
        </div>
      </div>

      <div className="overflow-x-auto pb-1">
        <div className="flex w-max gap-3">
          <ReferenceHistoryCard
            isSelected={selected.kind === "reference"}
            onSelect={() => onSelect({ kind: "reference" })}
            researchItemId={researchItemId}
            workspaceId={workspaceId}
          />
          {reviews.map((review) => (
            <ReviewHistoryCard
              isLatest={review.id === latestReviewId}
              isSelected={
                selected.kind === "review" && selected.reviewId === review.id
              }
              key={review.id}
              needsChanges={
                isCorrectionNeeded && review.id === latestReviewId
              }
              onSelect={() => onSelect({ kind: "review", reviewId: review.id })}
              review={review}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

type ReferenceHistoryCardProps = {
  isSelected: boolean;
  onSelect: () => void;
  researchItemId: string;
  workspaceId: string;
};

function ReferenceHistoryCard({
  isSelected,
  onSelect,
  researchItemId,
  workspaceId,
}: ReferenceHistoryCardProps) {
  return (
    <div
      className={cn(
        "relative w-32 overflow-hidden rounded-xl border bg-card p-1.5 transition-colors focus-within:ring-2 focus-within:ring-primary/30",
        isSelected
          ? "border-primary ring-2 ring-primary/30"
          : "border-border hover:border-primary/50",
      )}
    >
      <div className="pointer-events-none flex h-20 items-center justify-center overflow-hidden rounded-lg bg-muted/30">
        <AuthenticatedReferenceImage
          alt="Reference image"
          className="max-h-20 w-full rounded-lg object-cover"
          containerClassName="h-20 min-h-0 p-0"
          hasImage
          minHeightClassName="min-h-0"
          researchItemId={researchItemId}
          workspaceId={workspaceId}
        />
      </div>
      <button
        aria-pressed={isSelected}
        aria-label="Select reference"
        className="absolute inset-0 z-10 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        onClick={onSelect}
        type="button"
      />
      <div className="mt-1.5 flex w-full items-center justify-between px-1 text-xs font-semibold text-foreground">
        <span>Reference</span>
        {isSelected && <span className="text-[10px] text-primary">Selected</span>}
      </div>
    </div>
  );
}

type ReviewHistoryCardProps = {
  isLatest: boolean;
  isSelected: boolean;
  needsChanges: boolean;
  onSelect: () => void;
  review: ReviewHistoryItem;
};

function ReviewHistoryCard({
  isLatest,
  isSelected,
  needsChanges,
  onSelect,
  review,
}: ReviewHistoryCardProps) {
  const imageUnavailable = review.imageDeletedAt !== null || !review.imageUrl;

  return (
    <button
      aria-pressed={isSelected}
      className={cn(
        "w-32 rounded-xl border bg-card p-1.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
        isSelected
          ? "border-primary ring-2 ring-primary/30"
          : "border-border hover:border-primary/50",
      )}
      onClick={onSelect}
      type="button"
    >
      <div className="flex h-20 items-center justify-center overflow-hidden rounded-lg bg-muted/30">
        {imageUnavailable ? (
          <ImageIcon className="size-6 text-muted-foreground" />
        ) : (
          <img
            alt={`Submitted proof for round ${review.roundNumber}`}
            className="h-full w-full object-cover"
            src={review.imageUrl ?? undefined}
          />
        )}
      </div>
      <span className="mt-1.5 block px-1 text-xs font-semibold text-foreground">
        Round {review.roundNumber}
      </span>
      <span className="flex min-h-4 items-center gap-1 px-1 text-[10px] text-muted-foreground">
        {isLatest && <span className="rounded bg-primary/10 px-1 text-primary">Latest</span>}
        {needsChanges && (
          <span className="rounded bg-amber-500/15 px-1 text-amber-800 dark:text-amber-300">
            Needs Changes
          </span>
        )}
        {isSelected && <span className="text-primary">Selected</span>}
      </span>
    </button>
  );
}
