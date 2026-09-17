"use client";

import { FileArchive, FileUp, Loader2, X } from "lucide-react";
import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { formatWorkDate } from "@/features/designer-work/designer-work.types";
import { formatFileSize } from "@/lib/format-file-size";

import type { DesignFinalAsset } from "./design-workspace.types";

const MAX_FINAL_ASSET_BYTES = 100 * 1024 * 1024;

function isValidFinalAsset(file: File): boolean {
  return file.size <= MAX_FINAL_ASSET_BYTES && file.name.toLowerCase().endsWith(".zip");
}

type FinalAssetsPanelProps = {
  assets: DesignFinalAsset[];
  isCompleting: boolean;
  isPending: boolean;
  onUpload: (file: File) => void;
  showUploader: boolean;
};

export function FinalAssetsPanel({ assets, isCompleting, isPending, onUpload, showUploader }: FinalAssetsPanelProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const uploadedAsset = assets[0] ?? null;

  const selectFile = (incoming: FileList | null) => {
    if (!incoming || incoming.length === 0) return;

    const file = incoming[0];
    if (incoming.length !== 1 || !file || !isValidFinalAsset(file)) {
      setSelectedFile(null);
      setValidationError("File must be a .zip archive no larger than 100 MB.");
      return;
    }

    setSelectedFile(file);
    setValidationError(null);
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-foreground">Final ZIP</h3>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {uploadedAsset ? "Final ZIP uploaded." : "Upload one ZIP containing all final production files."}
        </p>
      </div>
      {uploadedAsset && (
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
      {showUploader && !uploadedAsset && (
        <div className="space-y-3 rounded-lg border border-dashed border-border bg-muted/15 p-4">
          <input accept=".zip,application/zip,application/x-zip-compressed" className="sr-only" onChange={(event) => selectFile(event.target.files)} ref={inputRef} type="file" />
          <div className="flex flex-wrap items-center gap-3">
            <Button disabled={isPending || isCompleting} onClick={() => inputRef.current?.click()} size="sm" type="button" variant="outline">
              <FileUp className="size-3.5" />
              <span>Select ZIP</span>
            </Button>
            <p className="text-xs text-muted-foreground">One ZIP · 100 MB max</p>
          </div>
          {selectedFile && (
            <div className="flex min-w-0 items-center justify-between gap-2 rounded-lg border border-border bg-background p-3 text-xs">
              <div className="flex min-w-0 items-center gap-2">
                <FileArchive className="size-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0">
                  <p className="truncate font-medium">{selectedFile.name}</p>
                  <p className="text-muted-foreground">{formatFileSize(selectedFile.size.toString())}</p>
                </div>
              </div>
              <Button aria-label={`Remove ${selectedFile.name}`} disabled={isPending || isCompleting} onClick={() => {
                setSelectedFile(null);
                if (inputRef.current) inputRef.current.value = "";
              }} size="icon-xs" type="button" variant="ghost">
                <X className="size-3" />
              </Button>
            </div>
          )}
          {validationError && <p className="text-xs font-medium text-destructive">{validationError}</p>}
          <Button
            className="w-full sm:w-auto font-semibold gap-1.5"
            disabled={isPending || isCompleting || !selectedFile}
            onClick={() => selectedFile && onUpload(selectedFile)}
            size="sm"
            type="button"
          >
            {(isPending || isCompleting) && <Loader2 className="size-3.5 animate-spin" />}
            <span>{isCompleting ? "Completing work..." : isPending ? "Uploading final ZIP..." : "Upload Final ZIP"}</span>
          </Button>
        </div>
      )}
    </div>
  );
}
