/* eslint-disable @next/next/no-img-element */
"use client";

import { MessageSquare, MessageSquarePlus, X } from "lucide-react";
import { type MouseEvent, useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api";

import type { ReviewAnnotationDetail } from "./reviews.types";
import { useCreateReviewAnnotation } from "./use-reviews";

type ReviewImageAnnotation = Pick<
  ReviewAnnotationDetail,
  "comment" | "id" | "x" | "y"
>;

type ReviewImageCanvasProps = {
  annotations: ReviewImageAnnotation[];
  hoveredAnnotationId?: string | null;
  imageDeletedAt: string | null;
  imageUrl: string | null;
  isActionable: boolean;
  onHoverAnnotation?: (annotationId: string | null) => void;
  onOpenImage?: () => void;
  onSelectAnnotation?: (annotationId: string) => void;
  researchItemId?: string;
  reviewId: string;
  roundNumber: number;
  selectedAnnotationId?: string | null;
  workspaceId: string;
};

export function ReviewImageCanvas({
  annotations,
  hoveredAnnotationId,
  imageDeletedAt,
  imageUrl,
  isActionable,
  onHoverAnnotation,
  onOpenImage,
  onSelectAnnotation,
  researchItemId,
  reviewId,
  roundNumber,
  selectedAnnotationId,
  workspaceId,
}: ReviewImageCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeComposer, setActiveComposer] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [commentText, setCommentText] = useState("");

  const createAnnotationMutation = useCreateReviewAnnotation(
    workspaceId,
    reviewId,
    researchItemId,
  );

  const isImageUnavailable = !imageUrl || imageDeletedAt !== null;

  if (isImageUnavailable) {
    return (
      <div className="flex min-h-[380px] w-full flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/20 p-8 text-center">
        <div className="rounded-full bg-muted/50 p-4 text-muted-foreground">
          <MessageSquare className="size-8 stroke-[1.5]" />
        </div>
        <h3 className="mt-3 text-base font-semibold text-foreground">
          Review image no longer available.
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          The submission screenshot for Round {roundNumber} has been cleaned up
          or is not available.
        </p>
      </div>
    );
  }

  function handleImageClick(e: MouseEvent<HTMLDivElement>) {
    if (!isActionable) {
      onOpenImage?.();
      return;
    }

    // If clicking directly on an existing marker or composer popover, do nothing
    const target = e.target as HTMLElement;
    if (target.closest("[data-annotation-element]")) {
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    const rawX = (e.clientX - rect.left) / rect.width;
    const rawY = (e.clientY - rect.top) / rect.height;

    const normalizedX = Math.min(Math.max(rawX, 0), 1);
    const normalizedY = Math.min(Math.max(rawY, 0), 1);

    setActiveComposer({ x: normalizedX, y: normalizedY });
    setCommentText("");
  }

  async function handleSubmitAnnotation() {
    if (!activeComposer) return;

    const trimmed = commentText.trim();
    if (!trimmed) {
      toast.error("Please enter a comment for this annotation.");
      return;
    }

    try {
      await createAnnotationMutation.mutateAsync({
        comment: trimmed,
        x: activeComposer.x,
        y: activeComposer.y,
      });
      toast.success("Annotation added.");
      setActiveComposer(null);
      setCommentText("");
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : "Failed to add annotation.";
      toast.error(message);
    }
  }

  function handleCancelComposer() {
    setActiveComposer(null);
    setCommentText("");
  }

  return (
    <div className="flex flex-col items-center">
      {isActionable && (
        <div className="mb-3 flex w-full items-center justify-between gap-2 rounded-lg bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5 font-medium text-foreground">
            <MessageSquarePlus className="size-3.5 text-primary" />
            Click anywhere on the image to place a correction note
          </span>
          <span className="hidden sm:inline">Normalized coordinate pin</span>
        </div>
      )}

      {/* Main Image Container with relative positioning */}
      <div
        className={`relative inline-block max-w-full overflow-hidden rounded-xl border border-border bg-black/5 shadow-xs dark:bg-black/20 ${
          isActionable ? "cursor-crosshair" : "cursor-default"
        }`}
        onClick={handleImageClick}
        ref={containerRef}
      >
        <img
          alt={`Review submission round ${roundNumber}`}
          className="block max-h-[720px] w-auto max-w-full object-contain select-none"
          src={imageUrl}
        />

        {/* Existing Annotation Markers */}
        {annotations.map((annotation, idx) => {
          const isSelected = selectedAnnotationId === annotation.id;
          const isHovered = hoveredAnnotationId === annotation.id;
          const markerNumber = idx + 1;

          return (
            <button
              aria-label={`Annotation ${markerNumber}: ${annotation.comment}`}
              className={`group absolute -translate-x-1/2 -translate-y-1/2 rounded-full border font-bold shadow-md transition-all focus-visible:outline-none ${
                isSelected
                  ? "z-30 size-7 border-amber-200 bg-amber-600 text-xs text-white ring-4 ring-amber-500/40"
                  : isHovered
                    ? "z-30 size-7 border-amber-100 bg-amber-600 text-xs text-white ring-4 ring-amber-500/30"
                    : "z-20 size-6 border-amber-400 bg-amber-500 text-[11px] text-white hover:scale-110 hover:bg-amber-600 focus-visible:ring-2 focus-visible:ring-amber-500"
              }`}
              data-annotation-element="true"
              key={annotation.id}
              onClick={(e) => {
                e.stopPropagation();
                onSelectAnnotation?.(annotation.id);
              }}
              onBlur={() => onHoverAnnotation?.(null)}
              onFocus={() => onHoverAnnotation?.(annotation.id)}
              onMouseEnter={() => onHoverAnnotation?.(annotation.id)}
              onMouseLeave={() => onHoverAnnotation?.(null)}
              style={{
                left: `${annotation.x * 100}%`,
                top: `${annotation.y * 100}%`,
              }}
              type="button"
            >
              {markerNumber}

              {/* Hover Tooltip */}
              <span className="pointer-events-none absolute bottom-full left-1/2 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-popover px-2.5 py-1 text-xs font-normal text-popover-foreground shadow-lg group-hover:block dark:border dark:border-border">
                <span className="line-clamp-2 max-w-[200px] text-left">
                  {annotation.comment}
                </span>
              </span>
            </button>
          );
        })}

        {/* Active Annotation Composer Pin & Popover */}
        {activeComposer && (
          <div
            className="absolute z-40 -translate-x-1/2 -translate-y-1/2"
            data-annotation-element="true"
            style={{
              left: `${activeComposer.x * 100}%`,
              top: `${activeComposer.y * 100}%`,
            }}
          >
            {/* Pulsing Pin Marker */}
            <div className="size-6 animate-pulse rounded-full bg-primary text-center text-xs font-bold text-primary-foreground shadow-lg ring-4 ring-primary/40">
              +
            </div>

            {/* In-place Composer Card */}
            <div
              className={`absolute top-full mt-2 w-72 rounded-xl border border-border bg-card p-3 shadow-xl ${
                activeComposer.x > 0.6 ? "-right-3" : "-left-3"
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between gap-2 border-b border-border pb-2">
                <p className="text-xs font-semibold text-foreground">
                  New Annotation
                </p>
                <button
                  aria-label="Cancel"
                  className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                  onClick={handleCancelComposer}
                  type="button"
                >
                  <X className="size-3.5" />
                </button>
              </div>

              <textarea
                autoFocus
                className="mt-2.5 w-full resize-none rounded-lg border border-border bg-background p-2.5 text-xs text-foreground placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary focus-visible:outline-none"
                disabled={createAnnotationMutation.isPending}
                maxLength={2000}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                    e.preventDefault();
                    void handleSubmitAnnotation();
                  }
                }}
                placeholder="Type your correction note here…"
                rows={3}
                value={commentText}
              />

              <div className="mt-2.5 flex items-center justify-end gap-2">
                <Button
                  disabled={createAnnotationMutation.isPending}
                  onClick={handleCancelComposer}
                  size="sm"
                  type="button"
                  variant="ghost"
                >
                  Cancel
                </Button>
                <Button
                  disabled={
                    createAnnotationMutation.isPending ||
                    commentText.trim().length === 0
                  }
                  onClick={() => void handleSubmitAnnotation()}
                  size="sm"
                  type="button"
                >
                  {createAnnotationMutation.isPending
                    ? "Adding…"
                    : "Add Comment"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
