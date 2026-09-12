"use client";

import { Download, ExternalLink, Loader2, User } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { AuthenticatedReferenceImage } from "@/features/research/authenticated-reference-image";
import { downloadResearchReferenceImage } from "@/features/research/research.api";

import { ApprovedPreview } from "./approved-preview";
import { formatListingDate } from "./listing.types";
import type { ListingDetail } from "./listing.types";

export function OriginalReference({ detail, workspaceId }: { detail: ListingDetail; workspaceId: string }) {
  const [isDownloading, setIsDownloading] = useState(false);
  const title = detail.researchItem.title || `Etsy listing ${detail.researchItem.etsyListingId}`;

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      await downloadResearchReferenceImage(workspaceId, detail.researchItem.id);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to download the original reference.");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <section className="overflow-hidden rounded-xl border border-border bg-card shadow-xs">
      <div className="flex flex-col gap-3 border-b border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-semibold">Original reference</h2>
          <p className="text-xs text-muted-foreground">Protected source material for this listing.</p>
        </div>
        <div className="flex flex-col gap-2 min-[420px]:flex-row">
          <Button disabled={isDownloading} onClick={() => void handleDownload()} size="sm" type="button" variant="outline">
            {isDownloading ? <Loader2 className="animate-spin" /> : <Download />}
            Download Original
          </Button>
          <Button nativeButton={false} render={<a href={detail.researchItem.originalUrl} rel="noopener noreferrer" target="_blank" />} size="sm" variant="outline">
            <ExternalLink /> View Original
          </Button>
        </div>
      </div>
      <AuthenticatedReferenceImage
        alt={`${title} original reference`}
        className="max-h-[560px] w-full rounded-none"
        containerClassName="min-h-[260px] bg-muted/20 p-3 sm:min-h-[380px]"
        hasImage
        researchItemId={detail.researchItem.id}
        workspaceId={workspaceId}
      />
    </section>
  );
}

export function ApprovedDesign({ detail }: { detail: ListingDetail }) {
  const title = detail.researchItem.title || `Etsy listing ${detail.researchItem.etsyListingId}`;
  return (
    <section className="overflow-hidden rounded-xl border border-border bg-card shadow-xs">
      <div className="border-b border-border px-4 py-3">
        <h2 className="font-semibold">Approved design</h2>
        <p className="text-xs text-muted-foreground">
          {detail.approvedPreview
            ? `Approved review round ${detail.approvedPreview.roundNumber} · ${formatListingDate(detail.approvedPreview.approvedAt)}`
            : "No approved review metadata is available."}
        </p>
      </div>
      <ApprovedPreview
        alt={`${title} approved design`}
        className="min-h-[260px] sm:min-h-[380px]"
        preview={detail.approvedPreview}
      />
    </section>
  );
}

export function PeoplePanel({ detail }: { detail: ListingDetail }) {
  return (
    <section className="rounded-xl border border-border bg-card p-4 shadow-xs">
      <h2 className="font-semibold">People</h2>
      <dl className="mt-3 space-y-3 text-sm">
        <DetailCell icon={<User className="size-3.5" />} label="Created by" value={personText(detail.creator)} />
        {detail.designer ? <DetailCell icon={<User className="size-3.5" />} label="Designer" value={personText(detail.designer)} /> : null}
      </dl>
    </section>
  );
}

export function AssignmentPanel({ detail }: { detail: ListingDetail }) {
  return (
    <section className="rounded-xl border border-border bg-card p-4 shadow-xs">
      <h2 className="font-semibold">Assignment</h2>
      <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
        <DetailCell label="Assigned" value={formatListingDate(detail.listingAssignment.assignedAt)} />
        <DetailCell label="Started" value={formatListingDate(detail.listingAssignment.startedAt)} />
        {detail.listingAssignment.completedAt ? <DetailCell label="Completed" value={formatListingDate(detail.listingAssignment.completedAt)} /> : null}
      </dl>
    </section>
  );
}

export function ResearchItemPanel({ detail }: { detail: ListingDetail }) {
  return (
    <section className="rounded-xl border border-border bg-card p-4 shadow-xs">
      <h2 className="font-semibold">Research item</h2>
      <dl className="mt-3 space-y-3 text-sm">
        <DetailCell label="Etsy source ID" value={detail.researchItem.etsyListingId} />
        <DetailCell label="Source Etsy URL" value={detail.researchItem.originalUrl} />
        <DetailCell label="Created" value={formatListingDate(detail.researchItem.createdAt)} />
        <DetailCell label="Updated" value={formatListingDate(detail.researchItem.updatedAt)} />
      </dl>
    </section>
  );
}

function DetailCell({ icon, label, value }: { icon?: React.ReactNode; label: string; value: string }) {
  return <div className="min-w-0"><dt className="flex items-center gap-1 text-xs font-medium text-muted-foreground">{icon}{label}</dt><dd className="mt-1 break-all font-medium">{value}</dd></div>;
}

function personText(person: ListingDetail["creator"]): string {
  return person.name ? `${person.name} · ${person.email}` : person.email;
}
