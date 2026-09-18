"use client";

import { Download, FileArchive, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { formatFileSize } from "@/lib/format-file-size";

import { useDownloadActivityStore } from "./download-activity-store";
import { launchListingDownload } from "./launch-listing-download";
import { formatListingDate } from "./listing.types";
import type { ListingDetail } from "./listing.types";

type FinalAssetDownloadListProps = {
  assets: ListingDetail["finalAssets"];
  researchItemId: string;
  workspaceId: string;
};

export function FinalAssetDownloadList({ assets, researchItemId, workspaceId }: FinalAssetDownloadListProps) {
  const asset = assets[0] ?? null;
  const activity = useDownloadActivityStore((state) => asset ? state.activities[asset.id] : undefined);

  const handleDownload = (asset: ListingDetail["finalAssets"][number]) => {
    void launchListingDownload({
      assetId: asset.id,
      fileName: asset.fileName,
      researchItemId,
      workspaceId,
    }).catch((error) => {
      toast.error(error instanceof Error ? error.message : "Unable to download the ZIP package.");
    });
  };

  return (
    <section className="rounded-xl border border-border bg-card p-4 shadow-xs">
      <h2 className="font-semibold">Final Package</h2>

      {!asset ? (
        <p className="mt-4 rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
          No final ZIP package available.
        </p>
      ) : (
        <div className="mt-4 flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 gap-3">
            <FileArchive className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium" title={asset.fileName}>{asset.fileName}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {formatFileSize(asset.fileSize)} · {formatListingDate(asset.uploadedAt)}
              </p>
            </div>
          </div>
          <Button
            aria-label={`Download ZIP ${asset.fileName}`}
            className="w-full bg-brand-accent text-brand-accent-foreground hover:bg-brand-accent/85 focus-visible:border-brand-accent focus-visible:ring-brand-accent/50 sm:w-auto"
            disabled={activity?.launchGuarded ?? false}
            onClick={() => handleDownload(asset)}
            type="button"
          >
            {activity?.phase === "starting" ? <Loader2 className="animate-spin" /> : <Download />}
            {activity?.phase === "starting" ? "Starting download…" : "Download ZIP"}
          </Button>
        </div>
      )}
    </section>
  );
}
