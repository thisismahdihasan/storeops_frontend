"use client";

import { AlertCircle, Download, ExternalLink, Loader2, User } from "lucide-react";
import { useState, type ReactNode } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { StatusBadge } from "@/components/ui/status-badge";
import { AuthenticatedReferenceImage } from "@/features/research/authenticated-reference-image";
import { downloadResearchReferenceImage } from "@/features/research/research.api";
import { useResearchItemDetail } from "@/features/research/use-research";

import { formatWorkDate, getDesignerWorkStatusMeta } from "./designer-work.types";
import type { DesignerWorkItem } from "./designer-work.types";

type DesignerWorkDetailDialogProps = {
  onOpenChange: (open: boolean) => void;
  open: boolean;
  selectedWork: DesignerWorkItem | null;
  workspaceId: string;
};

export function DesignerWorkDetailDialog({ onOpenChange, open, selectedWork, workspaceId }: DesignerWorkDetailDialogProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const researchItemId = selectedWork?.researchItem.id ?? null;
  const detailQuery = useResearchItemDetail(workspaceId, researchItemId, open);
  const item = detailQuery.data?.data.researchItem;

  const handleDownload = async () => {
    if (!researchItemId) return;
    setIsDownloading(true);
    try {
      await downloadResearchReferenceImage(workspaceId, researchItemId);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to download reference image.");
    } finally {
      setIsDownloading(false);
    }
  };

  const fallbackTitle = selectedWork ? selectedWork.researchItem.title || `Etsy Listing #${selectedWork.researchItem.etsyListingId}` : "Work detail";
  const statusMeta = selectedWork
    ? getDesignerWorkStatusMeta(selectedWork.researchItem.status)
    : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto p-5 sm:p-6">
        {detailQuery.isLoading && <div className="flex min-h-64 flex-col items-center justify-center gap-3" role="status"><Loader2 className="size-6 animate-spin text-primary" /><p className="text-sm text-muted-foreground">Loading work details…</p></div>}
        {detailQuery.isError && <div className="flex min-h-64 flex-col items-center justify-center gap-3 text-center"><AlertCircle className="size-8 text-destructive" /><p className="font-medium">Unable to load work details.</p><Button onClick={() => void detailQuery.refetch()} size="sm" type="button" variant="outline">Retry</Button></div>}
        {item && selectedWork && statusMeta && (
          <div className="space-y-5">
            <DialogHeader>
              <div className="flex flex-wrap items-center justify-between gap-2 pr-6"><StatusBadge label={statusMeta.label} tone={statusMeta.tone} /><span className="font-mono text-xs text-muted-foreground">Etsy #{item.etsyListingId}</span></div>
              <DialogTitle className="pt-1 text-lg">{item.title || fallbackTitle}</DialogTitle>
              <DialogDescription>Assigned work details and the authenticated Etsy reference asset.</DialogDescription>
            </DialogHeader>
            <section className="overflow-hidden rounded-xl border border-border bg-muted/20">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-3 py-2.5">
                <span className="text-sm font-medium">Reference image</span>
                <div className="flex items-center gap-1">
                  {item.referenceImageUrl && <Button disabled={isDownloading} onClick={() => void handleDownload()} size="xs" type="button" variant="outline">{isDownloading ? <Loader2 className="animate-spin" /> : <Download />}Download</Button>}
                  <a className="inline-flex h-6 items-center gap-1 rounded-md px-2 text-xs font-medium text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring" href={item.normalizedUrl} rel="noopener noreferrer" target="_blank"><ExternalLink className="size-3" />Etsy</a>
                </div>
              </div>
              <AuthenticatedReferenceImage alt={`${item.title || `Etsy listing ${item.etsyListingId}`} reference image`} className="max-h-[360px]" containerClassName="min-h-[220px] p-3" enabled={open} hasImage={Boolean(item.referenceImageUrl)} isActive={open} researchItemId={item.id} workspaceId={workspaceId} />
            </section>
            <section className="grid gap-3 sm:grid-cols-2">
              <DetailCell icon={<User className="size-3.5" />} label="Researcher" value={item.createdBy.name || item.createdBy.email} />
              <DetailCell icon={<User className="size-3.5" />} label="Current designer" value={item.currentDesigner?.name || item.currentDesigner?.email || "Not assigned"} />
              <DetailCell label="Assigned" value={formatWorkDate(selectedWork.assignedAt)} />
              <DetailCell label="Started" value={formatWorkDate(selectedWork.startedAt)} />
            </section>
            {item.latestReview && <section className="rounded-xl border border-border bg-card p-3.5"><p className="text-sm font-medium">Latest review · Round {item.latestReview.roundNumber}</p><p className="mt-1 text-xs text-muted-foreground">{item.latestReview.approvedAt ? "Approved" : "Submitted for Admin review"} on {formatWorkDate(item.latestReview.submittedAt)}</p>{item.latestReview.note && <p className="mt-3 rounded-md bg-muted/50 p-2.5 text-sm text-muted-foreground">{item.latestReview.note}</p>}</section>}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function DetailCell({ icon, label, value }: { icon?: ReactNode; label: string; value: string }) {
  return <div className="rounded-xl border border-border bg-card p-3.5"><p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">{icon}{label}</p><p className="mt-1 truncate text-sm font-medium text-foreground" title={value}>{value}</p></div>;
}
