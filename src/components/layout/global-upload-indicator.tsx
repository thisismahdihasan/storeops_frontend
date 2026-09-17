"use client";

import { Loader2, Upload, X } from "lucide-react";
import { type PointerEvent, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  type FloatingUploadPosition,
  useFinalAssetUploadStore,
} from "@/features/design-workspace/final-asset-upload-store";

const EDGE_SPACING = 20;
const DRAG_THRESHOLD = 5;

type DragState = {
  hasMoved: boolean;
  pointerId: number;
  startPointerX: number;
  startPointerY: number;
  startPosition: FloatingUploadPosition;
} | null;

const clampPosition = (
  position: FloatingUploadPosition,
  element: HTMLElement | null,
): FloatingUploadPosition => {
  if (!element) return position;
  const bounds = element.getBoundingClientRect();
  return {
    x: Math.min(Math.max(EDGE_SPACING, position.x), Math.max(EDGE_SPACING, window.innerWidth - bounds.width - EDGE_SPACING)),
    y: Math.min(Math.max(EDGE_SPACING, position.y), Math.max(EDGE_SPACING, window.innerHeight - bounds.height - EDGE_SPACING)),
  };
};

const getDefaultPosition = (element: HTMLElement | null): FloatingUploadPosition => {
  const width = element?.getBoundingClientRect().width ?? 300;
  return {
    x: Math.max(EDGE_SPACING, window.innerWidth - width - EDGE_SPACING),
    y: Math.max(80, EDGE_SPACING),
  };
};

const positionsMatch = (
  first: FloatingUploadPosition,
  second: FloatingUploadPosition,
): boolean => first.x === second.x && first.y === second.y;

export function GlobalUploadIndicator() {
  const router = useRouter();
  const activeUpload = useFinalAssetUploadStore((state) => state.activeUpload);
  const cancel = useFinalAssetUploadStore((state) => state.cancel);
  const floatingPosition = useFinalAssetUploadStore((state) => state.floatingPosition);
  const setFloatingPosition = useFinalAssetUploadStore(
    (state) => state.setFloatingPosition,
  );
  const chipRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragState>(null);

  useEffect(() => {
    if (!activeUpload) return;

    const constrainPosition = () => {
      const nextPosition = clampPosition(
        floatingPosition ?? getDefaultPosition(chipRef.current),
        chipRef.current,
      );
      if (!floatingPosition || !positionsMatch(floatingPosition, nextPosition)) {
        setFloatingPosition(nextPosition);
      }
    };

    constrainPosition();
    window.addEventListener("resize", constrainPosition);
    window.addEventListener("orientationchange", constrainPosition);
    return () => {
      window.removeEventListener("resize", constrainPosition);
      window.removeEventListener("orientationchange", constrainPosition);
    };
  }, [activeUpload, floatingPosition, setFloatingPosition]);

  if (
    !activeUpload ||
    (activeUpload.phase === "failed" && !activeUpload.canRetry)
  ) {
    return null;
  }

  const isFinalizing = activeUpload.phase === "completing";
  const isFailed = activeUpload.phase === "failed";
  const chipStyle = floatingPosition
    ? { left: floatingPosition.x, top: floatingPosition.y }
    : { right: EDGE_SPACING, top: 80 };

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    const target = event.target;
    if (target instanceof Element && target.closest("button")) return;

    const startPosition = clampPosition(
      floatingPosition ?? getDefaultPosition(chipRef.current),
      chipRef.current,
    );
    dragRef.current = {
      hasMoved: false,
      pointerId: event.pointerId,
      startPointerX: event.clientX,
      startPointerY: event.clientY,
      startPosition,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const offsetX = event.clientX - drag.startPointerX;
    const offsetY = event.clientY - drag.startPointerY;
    if (!drag.hasMoved && Math.hypot(offsetX, offsetY) < DRAG_THRESHOLD) return;

    drag.hasMoved = true;
    event.preventDefault();
    setFloatingPosition(
      clampPosition(
        { x: drag.startPosition.x + offsetX, y: drag.startPosition.y + offsetY },
        chipRef.current,
      ),
    );
  };

  const endDrag = (event: PointerEvent<HTMLDivElement>) => {
    if (dragRef.current?.pointerId !== event.pointerId) return;
    dragRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const stopActionDrag = (event: PointerEvent<HTMLButtonElement>) => {
    event.stopPropagation();
  };

  return (
    <div
      aria-live="polite"
      className="fixed z-[70] max-w-[calc(100vw-2rem)] cursor-grab select-none active:cursor-grabbing"
      onPointerCancel={endDrag}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={endDrag}
      ref={chipRef}
      style={chipStyle}
    >
      <div className="flex max-w-full flex-wrap items-center gap-1.5 rounded-full border border-border bg-card px-2 py-1.5 shadow-lg">
        {isFinalizing ? (
          <Loader2 className="size-3.5 shrink-0 animate-spin text-muted-foreground" />
        ) : isFailed ? (
          <Upload className="size-3.5 shrink-0 text-destructive" />
        ) : (
          <Upload className="size-3.5 shrink-0 text-primary" />
        )}
        <span className="min-w-0 text-xs font-medium text-foreground">
          {isFinalizing
            ? "Finalizing upload..."
            : isFailed
              ? "Final ZIP upload paused"
              : `Uploading Final ZIP · ${activeUpload.progressPercent}%`}
        </span>
        <Button
          className="touch-auto"
          onClick={() =>
            router.push(
              `/w/${activeUpload.workspaceId}/design/${activeUpload.researchItemId}`,
            )
          }
          onPointerDown={stopActionDrag}
          size="xs"
          type="button"
          variant="ghost"
        >
          View
        </Button>
        {activeUpload.canCancel && (
          <Button
            aria-label="Cancel Final ZIP upload"
            className="touch-auto"
            onClick={() => void cancel()}
            onPointerDown={stopActionDrag}
            size="icon-xs"
            type="button"
            variant="ghost"
          >
            <X className="size-3.5" />
          </Button>
        )}
      </div>
    </div>
  );
}
