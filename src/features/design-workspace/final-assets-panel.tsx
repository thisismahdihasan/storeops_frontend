"use client";

import { FileArchive, FileUp, Loader2, RotateCcw, X } from "lucide-react";
import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { formatWorkDate } from "@/features/designer-work/designer-work.types";
import { formatFileSize } from "@/lib/format-file-size";

import type { DesignFinalAsset } from "./design-workspace.types";
import type { FinalAssetMultipartUploadState } from "./use-design-workspace";

const MAX_FINAL_ASSET_BYTES = 1024 * 1024 * 1024;

function isValidFinalAsset(file: File): boolean {
  return file.size <= MAX_FINAL_ASSET_BYTES && file.name.toLowerCase().endsWith(".zip");
}

type FinalAssetsPanelProps = {
  assets: DesignFinalAsset[];
  canRetryUpload: boolean;
  isCompleting: boolean;
  isSubmittingFinalPackage?: boolean;
  onCancelUpload: () => void;
  onResetUpload: () => void;
  onRetryUpload: () => void;
  onUpload: (file: File) => void;
  showUploader: boolean;
  uploadState: FinalAssetMultipartUploadState;
};

export function FinalAssetsPanel({
  assets,
  canRetryUpload,
  isCompleting,
  isSubmittingFinalPackage = false,
  onCancelUpload,
  onResetUpload,
  onRetryUpload,
  onUpload,
  showUploader,
  uploadState,
}: FinalAssetsPanelProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const uploadedAsset = assets[0] ?? null;
  const isFinalizing =
    uploadState.phase === "completing" ||
    (isSubmittingFinalPackage && uploadState.phase === "success");
  const isUploading = uploadState.phase === "uploading";
  const isUploadingOrFinalizing = isUploading || isFinalizing;
  const progressPercent = uploadState.totalBytes > 0
    ? Math.min(100, Math.round((uploadState.completedBytes / uploadState.totalBytes) * 100))
    : 0;

  const clearSelection = () => {
    setSelectedFile(null);
    setValidationError(null);
    onResetUpload();
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const selectFile = (incoming: FileList | null) => {
    if (!incoming || incoming.length === 0) return;

    const file = incoming[0];
    if (incoming.length !== 1 || !file || !isValidFinalAsset(file)) {
      setSelectedFile(null);
      setValidationError("Select one .zip archive no larger than 1 GB.");
      onResetUpload();
      return;
    }

    setSelectedFile(file);
    setValidationError(null);
    onResetUpload();
  };

  const activeFile = selectedFile ?? (
    uploadState.fileName
      ? { name: uploadState.fileName, size: uploadState.totalBytes }
      : null
  );

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-foreground">Final ZIP</h3>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {uploadedAsset && !isSubmittingFinalPackage ? "Final ZIP uploaded." : "One ZIP · up to 1 GB"}
        </p>
      </div>

      {uploadedAsset && !isSubmittingFinalPackage && (
        <ul className="divide-y divide-border rounded-lg border border-border bg-muted/10">
          <li className="flex min-w-0 flex-col gap-1 px-3 py-2.5 text-xs sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-2">
              <FileArchive className="size-4 shrink-0 text-muted-foreground" />
              <div className="min-w-0">
                <p className="truncate font-medium text-foreground" title={uploadedAsset.fileName}>{uploadedAsset.fileName}</p>
                <p className="text-muted-foreground">{formatFileSize(uploadedAsset.fileSize)}</p>
              </div>
            </div>
            <p className="shrink-0 text-muted-foreground">Uploaded {formatWorkDate(uploadedAsset.uploadedAt)}</p>
          </li>
        </ul>
      )}

      {showUploader && (!uploadedAsset || isSubmittingFinalPackage) && (
        <div className="space-y-3 rounded-lg border border-dashed border-border bg-muted/15 p-4">
          <input
            accept=".zip,application/zip,application/x-zip-compressed"
            aria-label="Select Final ZIP"
            className="sr-only"
            disabled={isUploading || isCompleting}
            onChange={(event) => selectFile(event.target.files)}
            ref={inputRef}
            type="file"
          />

          {!isUploadingOrFinalizing && (
            <div className="flex flex-wrap items-center gap-3">
              <Button
                disabled={isCompleting}
                onClick={() => inputRef.current?.click()}
                size="sm"
                type="button"
                variant="outline"
              >
                <FileUp className="size-3.5" />
                <span>Select ZIP</span>
              </Button>
              <p className="text-xs text-muted-foreground">One ZIP · up to 1 GB</p>
            </div>
          )}

          {activeFile && !isUploadingOrFinalizing && (
            <div className="flex min-w-0 items-center justify-between gap-2 rounded-lg border border-border bg-background p-3 text-xs">
              <div className="flex min-w-0 items-center gap-2">
                <FileArchive className="size-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0">
                  <p className="truncate font-medium" title={activeFile.name}>{activeFile.name}</p>
                  <p className="text-muted-foreground">{formatFileSize(String(activeFile.size))}</p>
                </div>
              </div>
              <Button
                aria-label={`Remove ${activeFile.name}`}
                disabled={isCompleting}
                onClick={clearSelection}
                size="icon-xs"
                type="button"
                variant="ghost"
              >
                <X className="size-3" />
              </Button>
            </div>
          )}

          {isUploadingOrFinalizing && (
            <div className="space-y-2 rounded-lg border border-border bg-background p-3">
              <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-xs">
                <p className="font-medium text-foreground">
                  {isFinalizing ? "Finalizing upload..." : "Uploading Final ZIP"}
                </p>
                <p className="font-medium text-muted-foreground">{isFinalizing ? "100%" : `${progressPercent}%`}</p>
              </div>
              <div
                aria-label="Final ZIP upload progress"
                aria-valuemax={100}
                aria-valuemin={0}
                aria-valuenow={isFinalizing ? 100 : progressPercent}
                className="h-2 overflow-hidden rounded-full bg-muted"
                role="progressbar"
              >
                <div
                  className="h-full rounded-full bg-brand-accent transition-[width]"
                  style={{ width: isFinalizing ? "100%" : `${progressPercent}%` }}
                />
              </div>
              <div className="flex flex-wrap justify-between gap-x-3 gap-y-1 text-xs text-muted-foreground">
                <span>
                  {isFinalizing
                    ? formatFileSize(String(uploadState.totalBytes))
                    : `${formatFileSize(String(uploadState.completedBytes))} / ${formatFileSize(String(uploadState.totalBytes))}`}
                </span>
              </div>
              {isUploading && (
                <Button
                  className="w-full sm:w-auto"
                  onClick={onCancelUpload}
                  size="sm"
                  type="button"
                  variant="outline"
                >
                  Cancel
                </Button>
              )}
            </div>
          )}

          {uploadState.phase === "failed" && uploadState.error && (
            <div className="space-y-2" role="alert">
              <p className="text-xs font-medium text-destructive">{uploadState.error}</p>
              <div className="flex flex-wrap gap-2">
                {canRetryUpload && (
                  <Button onClick={onRetryUpload} size="sm" type="button" variant="outline">
                    <RotateCcw className="size-3.5" />
                    <span>
                      {uploadState.completedParts === uploadState.partCount && uploadState.partCount > 0
                        ? "Retry finalization"
                        : "Retry"}
                    </span>
                  </Button>
                )}
                <Button onClick={canRetryUpload ? onCancelUpload : onResetUpload} size="sm" type="button" variant="ghost">
                  {canRetryUpload ? "Cancel" : "Reset"}
                </Button>
              </div>
            </div>
          )}

          {validationError && <p className="text-xs font-medium text-destructive" role="alert">{validationError}</p>}

          {!isUploadingOrFinalizing && (
            <Button
              className="w-full gap-1.5 font-semibold sm:w-auto"
              disabled={isCompleting || !selectedFile}
              onClick={() => selectedFile && onUpload(selectedFile)}
              size="sm"
              type="button"
            >
              {isCompleting && <Loader2 className="size-3.5 animate-spin" />}
              <span>{isCompleting ? "Completing work..." : "Upload Final ZIP"}</span>
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
