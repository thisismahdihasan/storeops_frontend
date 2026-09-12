"use client";

import { Download, File, Loader2 } from "lucide-react";
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

  const handleDownload = async (asset: ListingDetail["finalAssets"][number]) => {
    setPendingAssetId(asset.id);
    try {
      await downloadListingAsset(workspaceId, asset.id, asset.fileName);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to download this file.");
    } finally {
      setPendingAssetId(null);
    }
  };

  return (
    <section className="rounded-xl border border-border bg-card p-4 shadow-xs">
      <div>
        <h2 className="font-semibold">Final assets</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {assets.length} production file{assets.length === 1 ? "" : "s"} available through secure download.
        </p>
      </div>

      {assets.length === 0 ? (
        <p className="mt-4 rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
          No final assets are available.
        </p>
      ) : (
        <ul className="mt-4 divide-y divide-border overflow-hidden rounded-lg border border-border">
          {assets.map((asset) => {
            const isPending = pendingAssetId === asset.id;
            return (
              <li className="flex min-w-0 flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between" key={asset.id}>
                <div className="flex min-w-0 gap-3">
                  <File className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0">
                    <p className="break-all text-sm font-medium">{asset.fileName}</p>
                    <p className="mt-1 break-words text-xs text-muted-foreground">
                      {asset.mimeType} · {formatFileSize(asset.fileSize)} · Uploaded {formatListingDate(asset.uploadedAt)}
                    </p>
                  </div>
                </div>
                <Button
                  aria-label={`Download ${asset.fileName}`}
                  className="w-full sm:w-auto"
                  disabled={pendingAssetId !== null}
                  onClick={() => void handleDownload(asset)}
                  size="sm"
                  type="button"
                  variant="outline"
                >
                  {isPending ? <Loader2 className="animate-spin" /> : <Download />}
                  {isPending ? "Downloading…" : "Download"}
                </Button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
