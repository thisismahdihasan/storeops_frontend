"use client";

import Link from "next/link";
import { AlertTriangle, Download, GripHorizontal, Loader2 } from "lucide-react";
import { type PointerEvent, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { useDownloadActivityStore } from "@/features/listing/download-activity-store";

import "./download-activity.css";

type Position = { x: number; y: number };
type DragState = { pointerId: number; x: number; y: number; position: Position; hasMoved: boolean };
const EDGE = 16;

function clampPosition(position: Position, element: HTMLElement): Position {
  const bounds = element.getBoundingClientRect();
  return {
    x: Math.min(Math.max(EDGE, position.x), Math.max(EDGE, window.innerWidth - bounds.width - EDGE)),
    y: Math.min(Math.max(EDGE, position.y), Math.max(EDGE, window.innerHeight - bounds.height - EDGE)),
  };
}

export function GlobalDownloadActivity() {
  const activities = useDownloadActivityStore((state) => state.activities);
  const dismiss = useDownloadActivityStore((state) => state.dismiss);
  // Providers keeps this component mounted across routes, including when empty.
  const [position, setPosition] = useState<Position | null>(null);
  const stackRef = useRef<HTMLElement>(null);
  const dragRef = useRef<DragState | null>(null);
  const rows = Object.values(activities).sort((first, second) => second.launchOrder - first.launchOrder);
  const hasActivities = rows.length > 0;

  useEffect(() => {
    const element = stackRef.current;
    if (!element || !hasActivities) return;
    const constrainPosition = () => {
      setPosition((current) => {
        const bounds = element.getBoundingClientRect();
        const next = clampPosition(current ?? { x: bounds.left, y: bounds.top }, element);
        return current?.x === next.x && current.y === next.y ? current : next;
      });
    };
    // Re-clamp when cards, viewport size, or text wrapping change the stack size.
    const observer = new ResizeObserver(constrainPosition);
    observer.observe(element);
    window.addEventListener("resize", constrainPosition);
    window.addEventListener("orientationchange", constrainPosition);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", constrainPosition);
      window.removeEventListener("orientationchange", constrainPosition);
    };
  }, [hasActivities]);

  const handlePointerDown = (event: PointerEvent<HTMLElement>) => {
    if (!event.isPrimary || event.button !== 0 || !stackRef.current) return;
    event.preventDefault();
    const bounds = stackRef.current.getBoundingClientRect();
    dragRef.current = {
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      position: { x: bounds.left, y: bounds.top },
      hasMoved: false,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: PointerEvent<HTMLElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId || !stackRef.current) return;
    const x = event.clientX - drag.x;
    const y = event.clientY - drag.y;
    if (!drag.hasMoved && Math.hypot(x, y) < 5) return;
    drag.hasMoved = true;
    event.preventDefault();
    setPosition(clampPosition({ x: drag.position.x + x, y: drag.position.y + y }, stackRef.current));
  };

  const endDrag = (event: PointerEvent<HTMLElement>) => {
    if (dragRef.current?.pointerId !== event.pointerId) return;
    dragRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  if (!hasActivities) return null;

  return (
    <section
      aria-label="Download activity"
      className="fixed z-[60] w-80 max-w-[calc(100vw-2rem)]"
      ref={stackRef}
      style={{ left: position?.x ?? "max(16px, calc(100vw - 340px))", top: position?.y ?? 144 }}
    >
      <div className="rounded-t-xl bg-card">
        <button
          aria-label="Move download notifications. Drag or use arrow keys."
          className="flex w-full touch-none select-none items-center justify-center gap-1 rounded-t-xl border border-b-0 border-amber-500/50 bg-amber-500/20 px-3 py-2 text-xs text-amber-900 outline-none cursor-grab focus-visible:ring-2 focus-visible:ring-ring active:cursor-grabbing dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-400"
          onKeyDown={(event) => {
            if (!stackRef.current || !["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) return;
            event.preventDefault();
            const bounds = stackRef.current.getBoundingClientRect();
            const step = event.shiftKey ? 40 : 10;
            setPosition(clampPosition({
              x: bounds.left + (event.key === "ArrowLeft" ? -step : event.key === "ArrowRight" ? step : 0),
              y: bounds.top + (event.key === "ArrowUp" ? -step : event.key === "ArrowDown" ? step : 0),
            }, stackRef.current));
          }}
          onLostPointerCapture={() => { dragRef.current = null; }}
          onPointerCancel={endDrag}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={endDrag}
          type="button"
        >
          <GripHorizontal aria-hidden="true" className="size-3.5" /> Move downloads
        </button>
      </div>
      <ul aria-live="polite" className="max-h-[calc(100dvh-13rem)] space-y-2 overflow-y-auto overscroll-contain [&>li:first-child]:rounded-t-none [&>li:first-child>div]:rounded-t-none">
        {rows.slice(0, 4).map((activity) => {
          const isStarting = activity.phase === "starting";
          const isFailed = activity.phase === "failed-to-start";
          const title = isStarting ? "Starting download" : isFailed ? "Download could not start" : "Downloading";
          const subtitle = isStarting ? "Preparing browser download…" : isFailed ? "Retry from the listing" : null;
          const Icon = isFailed ? AlertTriangle : isStarting ? Loader2 : Download;

          return (
            <li className="rounded-xl bg-card shadow-md" key={activity.assetId}>
              <div className="rounded-xl border border-amber-500/50 bg-amber-500/20 p-4 text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-400">
                <div
                  className="flex touch-none select-none items-start gap-3 cursor-grab active:cursor-grabbing"
                  onLostPointerCapture={() => { dragRef.current = null; }}
                  onPointerCancel={endDrag}
                  onPointerDown={handlePointerDown}
                  onPointerMove={handlePointerMove}
                  onPointerUp={endDrag}
                  title="Drag to move downloads"
                >
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-amber-500/30 bg-amber-500/15">
                    <Icon aria-hidden="true" className={isStarting ? "size-4 motion-safe:animate-spin" : "size-4"} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-semibold leading-5">{title}</h3>
                    <p className="truncate text-xs font-medium" title={activity.fileName ?? undefined}>{activity.fileName ?? "Listing ZIP"}</p>
                    {subtitle && <p className="mt-1 text-xs opacity-90">{subtitle}</p>}
                  </div>
                </div>
                {isStarting && (
                  <div
                    aria-label={`Starting download: ${activity.fileName ?? "Listing ZIP"}`}
                    className="mt-3 h-1.5 overflow-hidden rounded-full bg-amber-500/20"
                    role="progressbar"
                  >
                    <div className="download-activity-indeterminate h-full w-1/3 rounded-full bg-amber-600 dark:bg-amber-400" />
                  </div>
                )}
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                  <Button nativeButton={false} render={<Link href={`/w/${activity.workspaceId}/listing/${activity.researchItemId}`} />} size="xs" variant="ghost">View listing</Button>
                  <Button disabled={activity.launchGuarded} onClick={() => dismiss(activity.assetId)} size="xs" title="Dismiss activity only; browser download continues" type="button" variant="ghost">Dismiss</Button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
      {rows.length > 4 && <p className="mt-2 text-right text-xs font-medium"><span className="rounded-md bg-card px-2 py-1 text-foreground shadow-sm">+{rows.length - 4} more</span></p>}
    </section>
  );
}
