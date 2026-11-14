"use client";

import { useState } from "react";
import { AlertCircle, CalendarDays, ExternalLink, FileSearch } from "lucide-react";
import { toast } from "sonner";
import { ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/native-select";
import { StatusBadge } from "@/components/ui/status-badge";
import { DesignPreviewLightbox } from "@/features/design-workspace/design-preview-lightbox";
import { AuthenticatedReferenceImage } from "@/features/research/authenticated-reference-image";
import { useUpdateListingReview } from "@/features/role-activity/use-role-activity";
import type { CopyrightReviewer, ListerHistoryResponse, ReviewMutation } from "@/features/role-activity/role-activity.types";
import { ListingHistoryPagination } from "./listing-history-pagination";

type Props = { assignedReviewer?: CopyrightReviewer; isFlaggedTab: boolean; data?: ListerHistoryResponse["data"]; isError: boolean; isLoading: boolean; onPageChange: (page: number) => void; onReset: () => void; onRetry: () => void; workspaceId: string };
const reviewers: Array<{ id: CopyrightReviewer; name: string }> = [
  { id: "ZAYED", name: "Zayed" }, { id: "IFAD", name: "Ifad" }, { id: "MAHDI", name: "Mahdi" },
];
const actionClass = "h-auto min-h-8 whitespace-normal rounded-md px-3 py-1.5 text-center text-[11px] font-semibold leading-tight shadow-sm disabled:cursor-not-allowed disabled:opacity-70";
const checkedClass = "border-amber-500/60 bg-amber-500/12 text-amber-900 hover:bg-amber-500/20 dark:text-amber-100 dark:hover:bg-amber-500/25 disabled:border-amber-500/40 disabled:text-amber-900/70 dark:disabled:text-amber-100/70";
const flagClass = "border-red-500/50 bg-red-500/8 text-red-900 hover:bg-red-500/16 dark:text-red-100 dark:hover:bg-red-500/20 disabled:border-border disabled:bg-muted/40 disabled:text-muted-foreground";

export function ListingReviewList({ assignedReviewer, isFlaggedTab, data, isError, isLoading, onPageChange, onReset, onRetry, workspaceId }: Props) {
  const [preview, setPreview] = useState<{ title: string; url: string } | null>(null);
  const mutation = useUpdateListingReview(workspaceId);
  const visibleFlagButtons = isFlaggedTab ? [] : assignedReviewer ? reviewers.filter((person) => person.id === assignedReviewer) : reviewers;
  const update = async (researchItemId: string, input: ReviewMutation) => {
    try {
      await mutation.mutateAsync({ researchItemId, input });
      toast.success("Review saved");
    } catch (error) {
      toast.error(error instanceof ApiError && error.status === 409 ? "This review changed in another browser. The list was refreshed." : "Unable to save review.");
      onRetry();
    }
  };
  if (isLoading) return <div className="grid gap-3">{[0, 1, 2].map((item) => <div className="h-28 animate-pulse rounded-xl border bg-muted" key={item} />)}</div>;
  if (isError) return <section className="rounded-xl border border-dashed p-6 text-center"><AlertCircle className="mx-auto size-7 text-destructive" /><p className="mt-2 text-sm">Unable to load completed listings.</p><Button className="mt-3" onClick={onRetry} size="sm" type="button" variant="outline">Retry</Button></section>;
  if (!data || !data.items.length) return <section className="rounded-xl border border-dashed p-6 text-center"><FileSearch className="mx-auto size-8 text-muted-foreground" /><h2 className="mt-2 font-medium">No completed listings found for these filters.</h2><Button className="mt-3" onClick={onReset} size="sm" type="button" variant="outline">Reset search and dates</Button></section>;
  return <><div className="space-y-3">{data.items.map((item) => {
    const review = item.researchItem.listingReview;
    return <article className={cn("flex flex-col gap-3 rounded-xl border bg-card p-3 sm:flex-row", review.flaggedBy ? "border-red-500/50 bg-red-500/10" : review.isChecked ? "border-amber-400/50 bg-amber-400/10" : "border-border")} key={item.id}>
      <div className="size-20 shrink-0 overflow-hidden rounded-md border"><AuthenticatedReferenceImage alt={`${item.researchItem.title ?? `Etsy listing ${item.researchItem.etsyListingId}`} reference`} className="size-full object-cover" containerClassName="min-h-0 size-full p-0" hasImage={Boolean(item.researchItem.referenceImageUrl)} onOpenImage={(url) => setPreview({ url, title: item.researchItem.title ?? `Etsy listing ${item.researchItem.etsyListingId}` })} researchItemId={item.researchItem.id} version={item.completedAt} workspaceId={workspaceId} /></div>
      <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center justify-between gap-2"><p className="font-mono text-xs text-muted-foreground">Etsy #{item.researchItem.etsyListingId}</p><StatusBadge label="Listed" tone="success" /></div><h2 className="mt-1 max-w-md truncate text-sm font-medium" title={item.researchItem.title ?? "Untitled listing"}>{item.researchItem.title ?? "Untitled listing"}</h2>
        <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground"><CalendarDays className="size-3.5" />Listed {new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(item.completedAt))}</p>
        <p className="mt-1 text-xs text-muted-foreground">Assigned reviewer: {review.assignedReviewer ? reviewers.find((person) => person.id === review.assignedReviewer)?.name : "Unassigned"} · Flagged by: {review.flaggedBy ? reviewers.find((person) => person.id === review.flaggedBy)?.name : "None"}</p>
        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1"><a className="inline-flex items-center gap-1 text-xs text-primary underline-offset-4 hover:underline" href={item.researchItem.normalizedUrl} rel="noopener noreferrer" target="_blank">Original Etsy <ExternalLink className="size-3" /></a>{item.researchItem.listingResult?.etsyListingUrl ? <a className="inline-flex items-center gap-1 text-xs text-primary underline-offset-4 hover:underline" href={item.researchItem.listingResult.etsyListingUrl} rel="noopener noreferrer" target="_blank">Published Etsy <ExternalLink className="size-3" /></a> : null}</div>
        <div className="mt-3 flex flex-wrap items-stretch gap-2" aria-label={`Review actions for Etsy listing ${item.researchItem.etsyListingId}`}>
          <Button className={cn(actionClass, checkedClass, review.isChecked && "bg-amber-500/22 dark:bg-amber-500/25")} disabled={mutation.isPending || Boolean(review.flaggedBy)} onClick={() => void update(item.researchItem.id, { action: "SET_CHECKED", expectedVersion: review.version, checked: !review.isChecked })} size="xs" type="button" variant="outline">{review.isChecked ? "Unchecked" : "Checked"}</Button>
          {visibleFlagButtons.map((person) => <Button className={cn(actionClass, flagClass, review.flaggedBy === person.id && "border-red-500/70 bg-red-500/20 disabled:border-red-500/60 disabled:bg-red-500/20 disabled:text-red-900 dark:bg-red-500/25 dark:disabled:text-red-100")} disabled={mutation.isPending || !review.isChecked || review.flaggedBy === person.id} key={person.id} onClick={() => void update(item.researchItem.id, { action: "SET_FLAGGED_BY", expectedVersion: review.version, flaggedBy: person.id })} size="xs" type="button" variant="outline">Need Change by {person.name}</Button>)}
          {review.flaggedBy && (isFlaggedTab || assignedReviewer) ? <NativeSelect aria-label={`Change Flagged By for Etsy listing ${item.researchItem.etsyListingId}`} className="h-8 max-w-full rounded-md border border-red-500/50 bg-background/80 pl-2.5 pr-8 text-xs font-medium text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" disabled={mutation.isPending} onChange={(event) => void update(item.researchItem.id, { action: "SET_FLAGGED_BY", expectedVersion: review.version, flaggedBy: event.target.value as CopyrightReviewer })} value={review.flaggedBy}>{reviewers.map((person) => <option key={person.id} value={person.id}>Flagged by {person.name}</option>)}</NativeSelect> : null}
          {review.flaggedBy ? <Button className={cn(actionClass, "border-red-500/60 bg-background/70 text-red-900 hover:bg-red-500/10 dark:text-red-100 dark:hover:bg-red-500/15")} disabled={mutation.isPending} onClick={() => void update(item.researchItem.id, { action: "SET_FLAGGED_BY", expectedVersion: review.version, flaggedBy: null })} size="xs" type="button" variant="outline">Remove Flag</Button> : null}
        </div>
      </div>
    </article>;
  })}</div><ListingHistoryPagination onPageChange={onPageChange} pagination={data.pagination} /><DesignPreviewLightbox imageUrl={preview?.url ?? null} onOpenChange={(open) => !open && setPreview(null)} open={Boolean(preview)} title={preview?.title ?? "Reference image"} /></>;
}
