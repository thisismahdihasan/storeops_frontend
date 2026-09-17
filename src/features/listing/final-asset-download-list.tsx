"use client";

import { Download, FileArchive, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { formatFileSize } from "@/lib/format-file-size";

import { downloadListingAsset } from "./listing.api";
import { formatListingDate } from "./listing.types";
import type { ListingDetail } from "./listing.types";

type FinalAssetDownloadListProps = {
  assets: ListingDetail["finalAssets"];
  workspaceId: string;
};

export function FinalAssetDownloadList({ assets, workspaceId }: FinalAssetDownloadListProps) {
  const [pendingAssetId, setPendingAssetId] = useState<string | null>(null);
  const asset = assets[0] ?? null;

  const handleDownload = (asset: ListingDetail["finalAssets"][number]) => {
    if (pendingAssetId === asset.id) return;
    setPendingAssetId(asset.id);
    try {
      downloadListingAsset(workspaceId, asset.id, asset.fileName);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to download the ZIP package.");
    } finally {
      setTimeout(() => setPendingAssetId(null), 1000);
    }
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
            disabled={pendingAssetId !== null}
            onClick={() => handleDownload(asset)}
            type="button"
          >
            {pendingAssetId === asset.id ? <Loader2 className="animate-spin" /> : <Download />}
            {pendingAssetId === asset.id ? "Downloading…" : "Download ZIP"}
          </Button>
        </div>
      )}
    </section>
  );
}
