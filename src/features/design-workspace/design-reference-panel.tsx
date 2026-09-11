"use client";

import { Download, ExternalLink, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { AuthenticatedReferenceImage } from "@/features/research/authenticated-reference-image";
import { downloadResearchReferenceImage } from "@/features/research/research.api";
import { formatWorkDate } from "@/features/designer-work/designer-work.types";

import type { DesignDetail } from "./design-workspace.types";

type DesignReferencePanelProps = {
  detail: DesignDetail;
  workspaceId: string;
};

export function DesignReferencePanel({ detail, workspaceId }: DesignReferencePanelProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const { researchItem } = detail;

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      await downloadResearchReferenceImage(workspaceId, researchItem.id);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to download the reference image.");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <section className="overflow-hidden rounded-xl border border-border bg-card shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3">
        <div><h2 className="font-semibold">Reference</h2><p className="text-xs text-muted-foreground">Protected source material for this design.</p></div>
        <div className="flex flex-wrap gap-2">
          <Button disabled={isDownloading} onClick={() => void handleDownload()} size="xs" type="button" variant="outline">
            {isDownloading ? <Loader2 className="animate-spin" /> : <Download />}Download
          </Button>
          <a className="inline-flex h-7 items-center gap-1 rounded-md border border-input px-2.5 text-xs font-medium transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" href={researchItem.originalUrl} rel="noopener noreferrer" target="_blank"><ExternalLink className="size-3.5" />Open Etsy</a>
        </div>
      </div>
      <AuthenticatedReferenceImage alt={`${researchItem.title || `Etsy listing ${researchItem.etsyListingId}`} reference`} className="max-h-[520px] w-full rounded-none" containerClassName="min-h-[260px] bg-muted/20 p-3 sm:min-h-[360px]" hasImage researchItemId={researchItem.id} workspaceId={workspaceId} />
      <dl className="grid gap-3 border-t border-border p-4 text-sm sm:grid-cols-2">
        <ReferenceCell label="Title" value={researchItem.title || "Untitled Etsy listing"} />
        <ReferenceCell label="Etsy listing" value={`#${researchItem.etsyListingId}`} />
        <ReferenceCell label="Researched" value={formatWorkDate(researchItem.createdAt)} />
        <ReferenceCell label="Last updated" value={formatWorkDate(researchItem.updatedAt)} />
      </dl>
    </section>
  );
}

function ReferenceCell({ label, value }: { label: string; value: string }) {
  return <div className="min-w-0"><dt className="text-xs font-medium text-muted-foreground">{label}</dt><dd className="mt-1 break-words font-medium text-foreground">{value}</dd></div>;
}
