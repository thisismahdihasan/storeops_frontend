/* eslint-disable @next/next/no-img-element */
"use client";

import {
  Maximize,
  MessageSquare,
  MessageSquarePlus,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { type MouseEvent, useLayoutEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api";

import type { ReviewAnnotationDetail } from "./reviews.types";
import { useCreateReviewAnnotation } from "./use-reviews";

type ReviewImageAnnotation = Pick<
  ReviewAnnotationDetail,
  "comment" | "id" | "x" | "y"
>;

type ComposerPlacement = {
  left: number;
  top: number;
};

type ReviewViewMode = "comment" | "inspect";

const ZOOM_SCALES = [1, 1.25, 1.5, 2] as const;

type ReviewImageCanvasProps = {
  annotations: ReviewImageAnnotation[];
  enableZoomControls?: boolean;
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
  enableZoomControls = false,
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
  const composerRef = useRef<HTMLDivElement>(null);
  const scrollViewportRef = useRef<HTMLDivElement>(null);
  const [activeComposer, setActiveComposer] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [composerPlacement, setComposerPlacement] =
    useState<ComposerPlacement | null>(null);
  const [commentText, setCommentText] = useState("");
  const [viewMode, setViewMode] = useState<ReviewViewMode>("inspect");
  const [zoomIndex, setZoomIndex] = useState(0);
  const [zoomBaseWidth, setZoomBaseWidth] = useState<number | null>(null);

  const createAnnotationMutation = useCreateReviewAnnotation(
    workspaceId,
    reviewId,
    researchItemId,
  );

  const isImageUnavailable = !imageUrl || imageDeletedAt !== null;
  const zoomScale = ZOOM_SCALES[zoomIndex];
  const isZoomed = zoomScale > 1;
  const zoomedCanvasWidth = zoomBaseWidth ? zoomBaseWidth * zoomScale : null;

  useLayoutEffect(() => {
    if (!activeComposer) return;
    const composerCoordinates = activeComposer;

    function updateComposerPlacement() {
      const container = containerRef.current;
      const composer = composerRef.current;
      if (!container || !composer) return;

      const containerRect = container.getBoundingClientRect();
      const composerRect = composer.getBoundingClientRect();
      const scrollViewportRect = scrollViewportRef.current?.getBoundingClientRect();
      const viewportPadding = 16;
      const pinOffset = 16;
      const pinX =
        containerRect.left + composerCoordinates.x * containerRect.width;
      const pinY =
        containerRect.top + composerCoordinates.y * containerRect.height;
      const minimumLeft = Math.max(
        viewportPadding,
        scrollViewportRect?.left ?? viewportPadding,
      );
      const maximumLeft = Math.max(
        minimumLeft,
        Math.min(
          window.innerWidth - viewportPadding,
          scrollViewportRect?.right ?? window.innerWidth - viewportPadding,
        ) - composerRect.width,
      );
      const cardLeft = Math.min(
        Math.max(pinX - composerRect.width / 2, minimumLeft),
        maximumLeft,
      );
      const belowTop = pinY + pinOffset;
      const aboveTop = pinY - pinOffset - composerRect.height;
      const minimumTop = Math.max(
        viewportPadding,
        scrollViewportRect?.top ?? viewportPadding,
      );
      const maximumBottom = Math.min(
        window.innerHeight - viewportPadding,
        scrollViewportRect?.bottom ?? window.innerHeight - viewportPadding,
      );
      const fitsBelow =
        belowTop + composerRect.height <= maximumBottom;
      const fitsAbove = aboveTop >= minimumTop;
      const placeAbove =
        !fitsBelow &&
        (fitsAbove || pinY > window.innerHeight - pinY);
      const cardTop = placeAbove ? aboveTop : belowTop;

      setComposerPlacement({
        left: cardLeft - containerRect.left,
        top: cardTop - containerRect.top,
      });
    }

    const frame = requestAnimationFrame(updateComposerPlacement);
    window.addEventListener("resize", updateComposerPlacement);
    window.addEventListener("scroll", updateComposerPlacement, true);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", updateComposerPlacement);
      window.removeEventListener("scroll", updateComposerPlacement, true);
    };
  }, [activeComposer]);

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

    if (viewMode !== "comment") return;

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
    setComposerPlacement(null);
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
      setComposerPlacement(null);
      setCommentText("");
      setViewMode("inspect");
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : "Failed to add annotation.";
      toast.error(message);
    }
  }

  function handleCancelComposer() {
    setActiveComposer(null);
    setComposerPlacement(null);
    setCommentText("");
    setViewMode("inspect");
  }

  function handleCommentModeToggle() {
    if (viewMode === "comment") {
      handleCancelComposer();
      return;
    }

    setViewMode("comment");
  }

  function handleZoomChange(nextZoomIndex: number) {
    if (nextZoomIndex === zoomIndex) return;

    if (nextZoomIndex === 0) {
      setZoomIndex(0);
      setZoomBaseWidth(null);
      scrollViewportRef.current?.scrollTo({ left: 0, top: 0 });
      return;
    }

    const canvasWidth =
      zoomBaseWidth ?? containerRef.current?.getBoundingClientRect().width;
    if (!canvasWidth) return;

    setZoomBaseWidth(canvasWidth);
    setZoomIndex(nextZoomIndex);
  }

  return (
    <div className="flex flex-col items-center">
      {enableZoomControls && (
        <div
          aria-label="Review image tools"
          className="mb-3 flex w-full flex-wrap items-center justify-between gap-2 rounded-xl border border-border/80 bg-background/80 p-2.5 shadow-xs"
          role="toolbar"
        >
          <div className="flex items-center gap-1.5 rounded-lg border border-border bg-card/80 p-1 shadow-xs">
            <Button
              aria-label="Zoom out"
              className="bg-card hover:bg-muted"
              disabled={zoomIndex === 0 || Boolean(activeComposer)}
              onClick={() => handleZoomChange(zoomIndex - 1)}
              size="icon-xs"
              title="Zoom out"
              type="button"
              variant="outline"
            >
              <ZoomOut className="size-3.5" />
            </Button>
            <span
              aria-live="polite"
              className="min-w-12 rounded-md bg-card px-2 py-1 text-center text-xs font-semibold text-foreground shadow-xs"
            >
              {Math.round(zoomScale * 100)}%
            </span>
            <Button
              aria-label="Zoom in"
              className="bg-card hover:bg-muted"
              disabled={
                zoomIndex === ZOOM_SCALES.length - 1 || Boolean(activeComposer)
              }
              onClick={() => handleZoomChange(zoomIndex + 1)}
              size="icon-xs"
              title="Zoom in"
              type="button"
              variant="outline"
            >
              <ZoomIn className="size-3.5" />
            </Button>
            <Button
              aria-label="Fit image to review area"
              className="bg-card hover:bg-muted"
              disabled={zoomIndex === 0 || Boolean(activeComposer)}
              onClick={() => handleZoomChange(0)}
              size="xs"
              title="Fit image"
              type="button"
              variant="outline"
            >
              <Maximize className="size-3" />
              Fit
            </Button>
          </div>

          <Button
            aria-pressed={viewMode === "comment"}
            className={
              viewMode === "comment"
                ? "ring-2 ring-primary/30 shadow-sm"
                : "shadow-xs hover:shadow-sm"
            }
            disabled={!isActionable || Boolean(activeComposer)}
            onClick={handleCommentModeToggle}
            size="xs"
            type="button"
            variant="default"
          >
            <MessageSquarePlus className="size-3.5" />
            {viewMode === "comment" ? "Comment mode" : "Add Comment"}
          </Button>
        </div>
      )}

      <div
        className={`review-zoom-viewport w-full ${
          isZoomed ? "max-h-[720px] overflow-auto" : "overflow-visible"
        }`}
        ref={scrollViewportRef}
      >
        <div className={isZoomed ? "w-max" : "flex justify-center"}>
          {/* Main Image Container with relative positioning */}
          <div
            className={`relative inline-block ${
              isZoomed ? "" : "max-w-full"
            } ${viewMode === "comment" ? "cursor-crosshair" : "cursor-default"}`}
            onClick={handleImageClick}
            ref={containerRef}
            style={
              isZoomed && zoomedCanvasWidth
                ? { width: `${zoomedCanvasWidth}px` }
                : undefined
            }
          >
        <div className="overflow-hidden rounded-xl border border-border bg-black/5 shadow-xs dark:bg-black/20">
          <img
            alt={`Review submission round ${roundNumber}`}
            className={
              isZoomed
                ? "block h-auto w-full max-w-none select-none"
                : "block max-h-[720px] w-auto max-w-full object-contain select-none"
            }
            src={imageUrl}
          />
        </div>

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

        {/* Active Annotation Composer Pin */}
        {activeComposer && (
          <>
            <div
              className="absolute z-40 -translate-x-1/2 -translate-y-1/2"
              data-annotation-element="true"
              style={{
                left: `${activeComposer.x * 100}%`,
                top: `${activeComposer.y * 100}%`,
              }}
            >
              <div className="size-6 animate-pulse rounded-full bg-primary text-center text-xs font-bold text-primary-foreground shadow-lg ring-4 ring-primary/40">
                +
              </div>
            </div>

            {/* In-place Composer Card */}
            <div
              className="absolute z-40 w-[min(18rem,calc(100vw-2rem))] rounded-xl border border-border bg-card p-3 shadow-xl"
              data-annotation-element="true"
              onClick={(e) => e.stopPropagation()}
              ref={composerRef}
              style={
                composerPlacement
                  ? {
                      left: `${composerPlacement.left}px`,
                      top: `${composerPlacement.top}px`,
                    }
                  : { left: 0, top: 0, visibility: "hidden" }
              }
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
          </>
        )}
          </div>
        </div>
      </div>
      <style jsx>{`
        .review-zoom-viewport {
          scrollbar-color: var(--muted-foreground) var(--muted);
          scrollbar-width: thin;
        }

        .review-zoom-viewport::-webkit-scrollbar {
          height: 8px;
          width: 8px;
        }

        .review-zoom-viewport::-webkit-scrollbar-track {
          background: var(--muted);
          border-radius: 9999px;
        }

        .review-zoom-viewport::-webkit-scrollbar-thumb {
          background: var(--muted-foreground);
          border: 2px solid var(--muted);
          border-radius: 9999px;
        }

        .review-zoom-viewport::-webkit-scrollbar-thumb:hover {
          background: var(--foreground);
        }

        .review-zoom-viewport::-webkit-scrollbar-button {
          display: none;
          height: 0;
          width: 0;
        }
      `}</style>
    </div>
  );
}
