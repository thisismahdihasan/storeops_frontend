"use client";

import { AlertTriangle, Loader2, Upload, X } from "lucide-react";
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
  const width = element?.getBoundingClientRect().width ?? 320;
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

  const isUploading = activeUpload.phase === "uploading";
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

  const title = isFinalizing
    ? "Finalizing upload…"
    : isFailed
      ? "Final ZIP upload paused"
      : "Uploading Final ZIP";

  const Icon = isFinalizing ? Loader2 : isFailed ? AlertTriangle : Upload;

  return (
    <div
      aria-live="polite"
      className="fixed z-[70] w-80 max-w-[calc(100vw-2rem)] select-none"
      onPointerCancel={endDrag}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={endDrag}
      ref={chipRef}
      style={chipStyle}
    >
      <div
        className={`rounded-xl border p-3 shadow-lg backdrop-blur-sm cursor-grab active:cursor-grabbing ${
          isFinalizing
            ? "border-amber-500/40 bg-amber-500/15 text-amber-950 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200"
            : isFailed
              ? "border-destructive/30 bg-destructive/10 text-destructive dark:border-destructive/30 dark:bg-destructive/15 dark:text-red-300"
              : "border-blue-500/30 bg-blue-500/10 text-blue-950 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-200"
        }`}
      >
        <div className="flex items-start gap-2.5">
          <span
            className={`flex size-7 shrink-0 items-center justify-center rounded-lg border ${
              isFinalizing
                ? "border-amber-500/30 bg-amber-500/20 text-amber-700 dark:text-amber-400"
                : isFailed
                  ? "border-destructive/30 bg-destructive/15 text-destructive dark:text-red-400"
                  : "border-blue-500/30 bg-blue-500/15 text-blue-700 dark:text-blue-400"
            }`}
          >
            <Icon className={`size-3.5 ${isFinalizing ? "animate-spin" : ""}`} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-1.5">
              <h3 className="truncate text-xs font-semibold leading-4">
                {title}
              </h3>
              {isUploading && (
                <span className="shrink-0 font-mono text-[11px] font-semibold">
                  {activeUpload.progressPercent}%
                </span>
              )}
            </div>
            <p
              className="truncate text-[11px] font-medium opacity-85"
              title={activeUpload.fileName}
            >
              {activeUpload.fileName}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <Button
              className={`touch-auto ${
                isFinalizing
                  ? "text-amber-950 hover:bg-amber-500/15 hover:text-amber-950 dark:text-amber-200 dark:hover:bg-amber-500/20 dark:hover:text-amber-100"
                  : isFailed
                    ? "text-destructive hover:bg-destructive/15 hover:text-destructive dark:text-red-300 dark:hover:bg-destructive/20 dark:hover:text-red-200"
                    : "text-blue-950 hover:bg-blue-500/15 hover:text-blue-950 dark:text-blue-200 dark:hover:bg-blue-500/20 dark:hover:text-blue-100"
              }`}
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
                className={`touch-auto ${
                  isFinalizing
                    ? "text-amber-950 hover:bg-amber-500/15 hover:text-amber-950 dark:text-amber-200 dark:hover:bg-amber-500/20 dark:hover:text-amber-100"
                    : isFailed
                      ? "text-destructive hover:bg-destructive/15 hover:text-destructive dark:text-red-300 dark:hover:bg-destructive/20 dark:hover:text-red-200"
                      : "text-blue-950 hover:bg-blue-500/15 hover:text-blue-950 dark:text-blue-200 dark:hover:bg-blue-500/20 dark:hover:text-blue-100"
                }`}
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
        {isUploading && (
          <div
            aria-label={`Upload progress: ${activeUpload.progressPercent}%`}
            aria-valuemax={100}
            aria-valuemin={0}
            aria-valuenow={activeUpload.progressPercent}
            className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-blue-500/20"
            role="progressbar"
          >
            <div
              className="h-full rounded-full bg-blue-600 transition-all duration-200 dark:bg-blue-400"
              style={{
                width: `${Math.min(100, Math.max(0, activeUpload.progressPercent))}%`,
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
