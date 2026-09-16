"use client";

import {
  AlertCircle,
  ArrowRight,
  CalendarDays,
  Clock3,
  FileSearch,
  Loader2,
  MessageSquareWarning,
  Play,
  RotateCcw,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { StatusBadge, STATUS_TONE_TEXT_CLASSES } from "@/components/ui/status-badge";
import { AuthenticatedReferenceImage } from "@/features/research/authenticated-reference-image";
import type { AssignmentAvailabilityState } from "@/features/workspace/workspace-assignment-availability";
import { cn } from "@/lib/utils";

import { formatWorkDate, getDesignerWorkStatusMeta } from "./designer-work.types";
import type { DesignerQueueResponse, DesignerWorkItem } from "./designer-work.types";

type DesignerWorkListProps = {
  availabilityState?: AssignmentAvailabilityState;
  data?: DesignerQueueResponse["data"];
  filtersActive: boolean;
  isError: boolean;
  isLoading: boolean;
  startingCorrectionItemId?: string;
  startingWorkItemId?: string;
  onOpenWork: (work: DesignerWorkItem) => void;
  onPageChange: (page: number) => void;
  onReportIssue: (work: DesignerWorkItem) => void;
  onRetry: () => void;
  onStartCorrection?: (work: DesignerWorkItem) => void;
  onStartWork: (work: DesignerWorkItem) => void;
  workspaceId: string;
};

export function DesignerWorkList({
  availabilityState = "AVAILABLE",
  data,
  filtersActive,
  isError,
  isLoading,
  startingCorrectionItemId,
  startingWorkItemId,
  onOpenWork,
  onPageChange,
  onReportIssue,
  onRetry,
  onStartCorrection,
  onStartWork,
  workspaceId,
}: DesignerWorkListProps) {
  if (isLoading) return <DesignerWorkLoadingState />;
  if (isError) {
    return (
      <section className="flex min-h-64 flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card p-6 text-center">
        <AlertCircle className="size-8 text-destructive" />
        <h2 className="mt-3 font-semibold">Unable to load your work queue</h2>
        <p className="mt-1 text-sm text-muted-foreground">Check your connection and try again.</p>
        <Button className="mt-4" onClick={onRetry} size="sm" type="button" variant="outline">
          Retry
        </Button>
      </section>
    );
  }
  if (!data || data.items.length === 0) {
    const emptySubtitle = filtersActive
      ? "Try another status or refine your search."
      : availabilityState === "OFF"
        ? "Automatic assignments are currently turned off for your account."
        : availabilityState === "PAUSED"
          ? "Automatic assignments are currently paused for your account."
          : "New assignments will appear here when they are assigned to you.";
    return (
      <section className="flex min-h-64 flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card p-6 text-center">
        <FileSearch className="size-9 text-muted-foreground" />
        <h2 className="mt-3 font-semibold">
          {filtersActive ? "No work matches this status." : "No active design work assigned to you."}
        </h2>
        <p className="mt-1 max-w-md text-sm text-muted-foreground">
          {emptySubtitle}
        </p>
      </section>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3">
        {data.items.map((work) => (
          <DesignerWorkCard
            isStartingCorrection={startingCorrectionItemId === work.researchItem.id}
            isStartingWork={startingWorkItemId === work.researchItem.id}
            key={work.assignmentId}
            onOpenWork={onOpenWork}
            onReportIssue={onReportIssue}
            onStartCorrection={onStartCorrection}
            onStartWork={onStartWork}
            work={work}
            workspaceId={workspaceId}
          />
        ))}
      </div>
      <PaginationControls onPageChange={onPageChange} pagination={data.pagination} />
    </div>
  );
}

type PrimaryCtaConfig = {
  className?: string;
  disabled?: boolean;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  variant?: "default" | "outline" | "secondary";
};

function getPrimaryCta(
  work: DesignerWorkItem,
  canStartWork: boolean,
  isPrimaryStarting: boolean,
  onStartWork: (work: DesignerWorkItem) => void,
  onOpenWork: (work: DesignerWorkItem) => void,
): PrimaryCtaConfig {
  const status = work.researchItem.status;

  if (canStartWork) {
    return {
      disabled: isPrimaryStarting,
      icon: isPrimaryStarting ? (
        <Loader2 className="size-3.5 animate-spin" />
      ) : (
        <Play className="size-3.5" />
      ),
      label: "Start Work",
      onClick: () => onStartWork(work),
      variant: "default",
    };
  }

  switch (status) {
    case "DESIGN_IN_PROGRESS":
      return {
        icon: <ArrowRight className="size-3.5" />,
        label: "Continue Work",
        onClick: () => onOpenWork(work),
        variant: "outline",
      };
    case "DESIGN_REVIEW":
      return {
        icon: <ArrowRight className="size-3.5" />,
        label: "View Review",
        onClick: () => onOpenWork(work),
        variant: "outline",
      };
    case "CORRECTION_NEEDED":
      return {
        className:
          "bg-amber-600 text-white hover:bg-amber-700 dark:bg-amber-500 dark:text-neutral-950 dark:hover:bg-amber-400 border-transparent shadow-xs font-semibold",
        icon: <RotateCcw className="size-3.5" />,
        label: "Fix Correction",
        onClick: () => onOpenWork(work),
        variant: "default",
      };
    case "ISSUE_REPORTED":
      return {
        icon: <ArrowRight className="size-3.5" />,
        label: "View Issue",
        onClick: () => onOpenWork(work),
        variant: "outline",
      };
    case "DESIGN_APPROVED":
      return {
        icon: <ArrowRight className="size-3.5" />,
        label: "Upload Final Files",
        onClick: () => onOpenWork(work),
        variant: "default",
      };
    default:
      return {
        icon: <ArrowRight className="size-3.5" />,
        label: "Open Work",
        onClick: () => onOpenWork(work),
        variant: "outline",
      };
  }
}

function DesignerWorkCard({
  isStartingWork,
  onOpenWork,
  onReportIssue,
  onStartWork,
  work,
  workspaceId,
}: {
  isStartingCorrection?: boolean;
  isStartingWork: boolean;
  onOpenWork: (work: DesignerWorkItem) => void;
  onReportIssue: (work: DesignerWorkItem) => void;
  onStartCorrection?: (work: DesignerWorkItem) => void;
  onStartWork: (work: DesignerWorkItem) => void;
  work: DesignerWorkItem;
  workspaceId: string;
}) {
  const item = work.researchItem;
  const statusMeta = getDesignerWorkStatusMeta(item.status);
  const canStartWork =
    item.status === "ASSIGNED" ||
    (item.status === "DESIGN_IN_PROGRESS" && work.startedAt === null);
  const canReportIssue =
    item.status === "ASSIGNED" || item.status === "DESIGN_IN_PROGRESS";
  const isPrimaryStarting = canStartWork && isStartingWork;

  const handleCardOpen = () => {
    if (canStartWork) {
      onStartWork(work);
    } else {
      onOpenWork(work);
    }
  };

  const primaryCta = getPrimaryCta(
    work,
    canStartWork,
    isPrimaryStarting,
    onStartWork,
    onOpenWork,
  );

  return (
    <article className="rounded-xl border border-border bg-card p-3.5 shadow-xs transition-colors sm:p-4">
      {/* Mobile Layout (stacked) */}
      <div className="flex flex-col gap-3 sm:hidden">
        <div className="flex items-start gap-3">
          <button
            aria-label={`Open design workspace for ${item.title || `Etsy listing ${item.etsyListingId}`}`}
            className="group relative size-20 shrink-0 overflow-hidden rounded-lg border border-border bg-muted/30 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
            onClick={handleCardOpen}
            type="button"
          >
            <AuthenticatedReferenceImage
              alt={`${item.title || `Etsy listing ${item.etsyListingId}`} reference thumbnail`}
              className="size-full rounded-none object-cover transition-transform duration-200 group-hover:scale-105"
              containerClassName="min-h-0 size-full p-0"
              hasImage={Boolean(item.referenceImageUrl)}
              researchItemId={item.id}
              workspaceId={workspaceId}
            />
          </button>
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex items-start justify-between gap-2">
              <button
                aria-label={`Open design workspace for ${item.title || `Etsy listing ${item.etsyListingId}`}`}
                className="truncate text-left text-sm font-semibold text-foreground transition-colors hover:text-primary focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
                onClick={handleCardOpen}
                type="button"
              >
                {item.title || `Etsy Listing #${item.etsyListingId}`}
              </button>
            </div>
            <p className="font-mono text-xs text-muted-foreground">
              Etsy #{item.etsyListingId}
            </p>
            <div className="pt-0.5">
              <StatusBadge label={statusMeta.label} tone={statusMeta.tone} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground border-t border-border/50 pt-2">
          <span className="flex items-center gap-1.5">
            <CalendarDays className="size-3.5 shrink-0" />
            Assigned {formatWorkDate(work.assignedAt)}
          </span>
          <span className="flex items-center gap-1.5">
            <Clock3 className="size-3.5 shrink-0" />
            {work.startedAt ? `Started ${formatWorkDate(work.startedAt)}` : "Not started"}
          </span>
        </div>

        <StatusGuidance status={item.status} />

        <div className="flex flex-col gap-2 pt-1">
          <Button
            className={cn("w-full justify-center gap-1.5", primaryCta.className)}
            disabled={primaryCta.disabled}
            onClick={primaryCta.onClick}
            size="sm"
            type="button"
            variant={primaryCta.variant ?? "default"}
          >
            {primaryCta.icon}
            <span>{primaryCta.label}</span>
          </Button>
          {canReportIssue && (
            <Button
              className="w-full justify-center text-xs text-muted-foreground hover:text-foreground h-8"
              onClick={() => onReportIssue(work)}
              size="sm"
              type="button"
              variant="ghost"
            >
              <MessageSquareWarning className="size-3.5" />
              <span>Report Issue</span>
            </Button>
          )}
        </div>
      </div>

      {/* Desktop Layout (row with integrated action column) */}
      <div className="hidden sm:grid sm:grid-cols-[7rem_minmax(0,1fr)_auto] sm:gap-4 sm:items-center">
        {/* Column 1: Reference Image */}
        <button
          aria-label={`Open design workspace for ${item.title || `Etsy listing ${item.etsyListingId}`}`}
          className="group relative size-28 shrink-0 overflow-hidden rounded-lg border border-border bg-muted/30 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
          onClick={handleCardOpen}
          type="button"
        >
          <AuthenticatedReferenceImage
            alt={`${item.title || `Etsy listing ${item.etsyListingId}`} reference thumbnail`}
            className="size-full rounded-none object-cover transition-transform duration-200 group-hover:scale-105"
            containerClassName="min-h-0 size-full p-0"
            hasImage={Boolean(item.referenceImageUrl)}
            researchItemId={item.id}
            workspaceId={workspaceId}
          />
        </button>

        {/* Column 2: Details & Metadata */}
        <div className="min-w-0 space-y-2 py-0.5">
          <div className="space-y-0.5">
            <button
              aria-label={`Open design workspace for ${item.title || `Etsy listing ${item.etsyListingId}`}`}
              className="block truncate text-left text-base font-semibold text-foreground transition-colors hover:text-primary focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
              onClick={handleCardOpen}
              type="button"
            >
              {item.title || `Etsy Listing #${item.etsyListingId}`}
            </button>
            <p className="font-mono text-xs text-muted-foreground">
              Etsy #{item.etsyListingId}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <CalendarDays className="size-3.5 shrink-0" />
              Assigned {formatWorkDate(work.assignedAt)}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock3 className="size-3.5 shrink-0" />
              {work.startedAt ? `Started ${formatWorkDate(work.startedAt)}` : "Not started"}
            </span>
          </div>

          <StatusGuidance status={item.status} />
        </div>

        {/* Column 3: Action Column */}
        <div className="flex flex-col items-end justify-center gap-2 shrink-0 pl-2">
          <StatusBadge label={statusMeta.label} tone={statusMeta.tone} />
          <Button
            className={cn("w-40 justify-center gap-1.5 shadow-xs", primaryCta.className)}
            disabled={primaryCta.disabled}
            onClick={primaryCta.onClick}
            size="sm"
            type="button"
            variant={primaryCta.variant ?? "default"}
          >
            {primaryCta.icon}
            <span>{primaryCta.label}</span>
          </Button>
          {canReportIssue && (
            <Button
              className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
              onClick={() => onReportIssue(work)}
              size="sm"
              type="button"
              variant="ghost"
            >
              <MessageSquareWarning className="size-3.5" />
              <span>Report Issue</span>
            </Button>
          )}
        </div>
      </div>
    </article>
  );
}

function StatusGuidance({
  status,
}: {
  status: DesignerWorkItem["researchItem"]["status"];
}) {
  if (status === "DESIGN_REVIEW") {
    return (
      <p className={cn("text-xs font-medium", STATUS_TONE_TEXT_CLASSES.info)}>
        Waiting for Admin Review
      </p>
    );
  }
  if (status === "ISSUE_REPORTED") {
    return (
      <p className={cn("text-xs font-medium", STATUS_TONE_TEXT_CLASSES.danger)}>
        Issue reported — waiting for Admin action.
      </p>
    );
  }
  if (status === "DESIGN_APPROVED") {
    return (
      <p className={cn("text-xs font-medium", STATUS_TONE_TEXT_CLASSES.success)}>
        Approved — final delivery will be handled in its dedicated phase.
      </p>
    );
  }
  return null;
}

function PaginationControls({
  onPageChange,
  pagination,
}: {
  onPageChange: (page: number) => void;
  pagination: DesignerQueueResponse["data"]["pagination"];
}) {
  if (pagination.totalPages <= 1) {
    return (
      <p className="text-center text-xs text-muted-foreground">
        {pagination.total} active work item{pagination.total === 1 ? "" : "s"}
      </p>
    );
  }
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
      <p className="text-xs text-muted-foreground">
        {pagination.total} active work items · Page {pagination.page} of {pagination.totalPages}
      </p>
      <div className="flex gap-2">
        <Button
          disabled={pagination.page <= 1}
          onClick={() => onPageChange(pagination.page - 1)}
          size="sm"
          type="button"
          variant="outline"
        >
          Previous
        </Button>
        <Button
          disabled={pagination.page >= pagination.totalPages}
          onClick={() => onPageChange(pagination.page + 1)}
          size="sm"
          type="button"
          variant="outline"
        >
          Next
        </Button>
      </div>
    </div>
  );
}

function DesignerWorkLoadingState() {
  return (
    <div className="grid gap-3" role="status">
      {["one", "two", "three"].map((key) => (
        <div
          className="h-32 animate-pulse rounded-xl border border-border bg-muted/40"
          key={key}
        />
      ))}
      <span className="sr-only">Loading assigned work…</span>
    </div>
  );
}
