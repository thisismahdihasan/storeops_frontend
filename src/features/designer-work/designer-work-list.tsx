"use client";

import { AlertCircle, ArrowRight, CalendarDays, Clock3, FileSearch, Loader2, MessageSquareWarning, Play, RotateCcw, User } from "lucide-react";

import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { AuthenticatedReferenceImage } from "@/features/research/authenticated-reference-image";

import { formatWorkDate, getDesignerWorkStatusMeta } from "./designer-work.types";
import type { DesignerQueueResponse, DesignerWorkItem } from "./designer-work.types";

type DesignerWorkListProps = {
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
  onStartCorrection: (work: DesignerWorkItem) => void;
  onStartWork: (work: DesignerWorkItem) => void;
  workspaceId: string;
};

export function DesignerWorkList({ data, filtersActive, isError, isLoading, startingCorrectionItemId, startingWorkItemId, onOpenWork, onPageChange, onReportIssue, onRetry, onStartCorrection, onStartWork, workspaceId }: DesignerWorkListProps) {
  if (isLoading) return <DesignerWorkLoadingState />;
  if (isError) {
    return <section className="flex min-h-64 flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card p-6 text-center"><AlertCircle className="size-8 text-destructive" /><h2 className="mt-3 font-semibold">Unable to load your work queue</h2><p className="mt-1 text-sm text-muted-foreground">Check your connection and try again.</p><Button className="mt-4" onClick={onRetry} size="sm" type="button" variant="outline">Retry</Button></section>;
  }
  if (!data || data.items.length === 0) {
    return <section className="flex min-h-64 flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card p-6 text-center"><FileSearch className="size-9 text-muted-foreground" /><h2 className="mt-3 font-semibold">{filtersActive ? "No work matches this status." : "No active design work assigned to you."}</h2><p className="mt-1 max-w-md text-sm text-muted-foreground">{filtersActive ? "Try another status or refine your search." : "New assignments will appear here when they are assigned to you."}</p></section>;
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3">
        {data.items.map((work) => <DesignerWorkCard isStartingCorrection={startingCorrectionItemId === work.researchItem.id} isStartingWork={startingWorkItemId === work.researchItem.id} key={work.assignmentId} onOpenWork={onOpenWork} onReportIssue={onReportIssue} onStartCorrection={onStartCorrection} onStartWork={onStartWork} work={work} workspaceId={workspaceId} />)}
      </div>
      <PaginationControls onPageChange={onPageChange} pagination={data.pagination} />
    </div>
  );
}

function DesignerWorkCard({ isStartingCorrection, isStartingWork, onOpenWork, onReportIssue, onStartCorrection, onStartWork, work, workspaceId }: {
  isStartingCorrection: boolean;
  isStartingWork: boolean;
  onOpenWork: (work: DesignerWorkItem) => void;
  onReportIssue: (work: DesignerWorkItem) => void;
  onStartCorrection: (work: DesignerWorkItem) => void;
  onStartWork: (work: DesignerWorkItem) => void;
  work: DesignerWorkItem;
  workspaceId: string;
}) {
  const item = work.researchItem;
  const statusMeta = getDesignerWorkStatusMeta(item.status);
  const canStartWork = item.status === "ASSIGNED" || (item.status === "DESIGN_IN_PROGRESS" && work.startedAt === null);
  const canReportIssue = item.status === "ASSIGNED" || item.status === "DESIGN_IN_PROGRESS";
  const isPrimaryStarting = canStartWork && isStartingWork;
  const isCorrectionStarting = item.status === "CORRECTION_NEEDED" && isStartingCorrection;

  return (
    <article className="grid gap-4 rounded-xl border border-border bg-card p-3.5 shadow-xs sm:grid-cols-[5rem_minmax(0,1fr)] sm:p-4">
      <div className="flex size-20 overflow-hidden rounded-lg border border-border bg-muted/30 sm:size-full sm:min-h-24">
        <AuthenticatedReferenceImage alt={`${item.title || `Etsy listing ${item.etsyListingId}`} reference thumbnail`} className="size-full rounded-none object-cover" containerClassName="min-h-0 size-full p-0" hasImage={Boolean(item.referenceImageUrl)} researchItemId={item.id} workspaceId={workspaceId} />
      </div>
      <div className="min-w-0 space-y-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0"><h2 className="truncate text-sm font-semibold text-foreground sm:text-base">{item.title || `Etsy Listing #${item.etsyListingId}`}</h2><p className="mt-0.5 font-mono text-xs text-muted-foreground">Etsy #{item.etsyListingId}</p></div>
          <StatusBadge label={statusMeta.label} tone={statusMeta.tone} />
        </div>
        <div className="grid gap-2 text-xs text-muted-foreground sm:grid-cols-3">
          <span className="flex items-center gap-1.5"><User className="size-3.5" />{item.createdBy.name || item.createdBy.email}</span>
          <span className="flex items-center gap-1.5"><CalendarDays className="size-3.5" />Assigned {formatWorkDate(work.assignedAt)}</span>
          <span className="flex items-center gap-1.5"><Clock3 className="size-3.5" />{work.startedAt ? `Started ${formatWorkDate(work.startedAt)}` : "Not started"}</span>
        </div>
        <StatusGuidance status={item.status} />
        <div className="flex flex-wrap items-center gap-2 border-t border-border/70 pt-3">
          {canStartWork && <Button disabled={isPrimaryStarting} onClick={() => onStartWork(work)} size="sm" type="button">{isPrimaryStarting ? <Loader2 className="animate-spin" /> : <Play />}Start Work</Button>}
          {item.status === "CORRECTION_NEEDED" && <Button disabled={isCorrectionStarting} onClick={() => onStartCorrection(work)} size="sm" type="button">{isCorrectionStarting ? <Loader2 className="animate-spin" /> : <RotateCcw />}Start Correction</Button>}
          <Button onClick={() => onOpenWork(work)} size="sm" type="button" variant={canStartWork || item.status === "CORRECTION_NEEDED" ? "ghost" : "outline"}>Open Work <ArrowRight /></Button>
          {canReportIssue && <Button className="text-muted-foreground" onClick={() => onReportIssue(work)} size="sm" type="button" variant="ghost"><MessageSquareWarning />Report Issue</Button>}
        </div>
      </div>
    </article>
  );
}

function StatusGuidance({ status }: { status: DesignerWorkItem["researchItem"]["status"] }) {
  if (status === "DESIGN_REVIEW") return <p className="text-xs font-medium text-blue-700 dark:text-blue-400">Waiting for Admin Review</p>;
  if (status === "ISSUE_REPORTED") return <p className="text-xs font-medium text-red-700 dark:text-red-400">Issue reported — waiting for Admin action.</p>;
  if (status === "DESIGN_APPROVED") return <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400">Approved — final delivery will be handled in its dedicated phase.</p>;
  return null;
}

function PaginationControls({ onPageChange, pagination }: { onPageChange: (page: number) => void; pagination: DesignerQueueResponse["data"]["pagination"] }) {
  if (pagination.totalPages <= 1) return <p className="text-center text-xs text-muted-foreground">{pagination.total} active work item{pagination.total === 1 ? "" : "s"}</p>;
  return <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4"><p className="text-xs text-muted-foreground">{pagination.total} active work items · Page {pagination.page} of {pagination.totalPages}</p><div className="flex gap-2"><Button disabled={pagination.page <= 1} onClick={() => onPageChange(pagination.page - 1)} size="sm" type="button" variant="outline">Previous</Button><Button disabled={pagination.page >= pagination.totalPages} onClick={() => onPageChange(pagination.page + 1)} size="sm" type="button" variant="outline">Next</Button></div></div>;
}

function DesignerWorkLoadingState() {
  return <div className="grid gap-3" role="status">{["one", "two", "three"].map((key) => <div className="h-40 animate-pulse rounded-xl border border-border bg-muted/40" key={key} />)}<span className="sr-only">Loading assigned work…</span></div>;
}
