"use client";

import { Download, ExternalLink, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { AuthenticatedReferenceImage } from "@/features/research/authenticated-reference-image";
import { downloadResearchReferenceImage } from "@/features/research/research.api";

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
      <div className="border-b border-border px-4 py-3 sm:px-5">
        <h2 className="text-base font-semibold text-foreground">Reference</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Protected source material for this design.
        </p>
      </div>
      <div className="bg-muted/15 p-3 sm:p-4">
        <AuthenticatedReferenceImage
          alt={`${researchItem.title || `Etsy listing ${researchItem.etsyListingId}`} reference`}
          className="max-h-[600px] w-full rounded-lg object-contain"
          containerClassName="min-h-[280px] bg-transparent p-0 sm:min-h-[400px]"
          hasImage
          researchItemId={researchItem.id}
          workspaceId={workspaceId}
        />
      </div>
      <div className="flex flex-col gap-2.5 border-t border-border px-4 py-3.5 sm:flex-row sm:px-5">
        <Button
          className="flex-1 gap-2 font-semibold"
          disabled={isDownloading}
          onClick={() => void handleDownload()}
          size="lg"
          type="button"
        >
          {isDownloading ? (
            <Loader2 className="size-4.5 animate-spin" />
          ) : (
            <Download className="size-4.5" />
          )}
          <span>Download Reference</span>
        </Button>
        <Button
          className="flex-1 gap-2 font-semibold border-emerald-600/30 text-emerald-700 hover:bg-emerald-500/10 hover:text-emerald-800 dark:border-emerald-500/30 dark:text-emerald-400 dark:hover:bg-emerald-500/15 dark:hover:text-emerald-300"
          nativeButton={false}
          render={
            <a
              href={researchItem.originalUrl}
              rel="noopener noreferrer"
              target="_blank"
            />
          }
          size="lg"
          variant="outline"
        >
          <ExternalLink className="size-4.5" />
          <span>View on Etsy</span>
        </Button>
      </div>
    </section>
  );
}
