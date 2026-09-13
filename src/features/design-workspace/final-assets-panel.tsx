"use client";

import { FileUp, Loader2, X } from "lucide-react";
import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { formatWorkDate } from "@/features/designer-work/designer-work.types";
import { formatFileSize } from "@/lib/format-file-size";

import type { DesignFinalAsset } from "./design-workspace.types";

const MAX_FINAL_ASSET_BYTES = 100 * 1024 * 1024;
const MAX_FINAL_ASSET_FILES = 10;
const ACCEPTED_FINAL_ASSET_TYPES = new Set([
  "application/octet-stream", "application/pdf", "application/x-zip-compressed", "application/zip", "image/jpeg", "image/png", "image/webp",
]);
const ACCEPTED_FINAL_ASSET_EXTENSIONS = new Set([
  ".zip", ".png", ".jpg", ".jpeg", ".webp", ".pdf",
]);

function isValidFinalAsset(file: File): boolean {
  if (file.size > MAX_FINAL_ASSET_BYTES) return false;
  if (file.type.length > 0) {
    return ACCEPTED_FINAL_ASSET_TYPES.has(file.type);
  }
  const dotIndex = file.name.lastIndexOf(".");
  if (dotIndex === -1) return false;
  const ext = file.name.slice(dotIndex).toLowerCase();
  return ACCEPTED_FINAL_ASSET_EXTENSIONS.has(ext);
}

type FinalAssetsPanelProps = {
  assets: DesignFinalAsset[];
  count: number;
  isPending: boolean;
  onUpload: (files: File[]) => void;
  showUploader: boolean;
};

export function FinalAssetsPanel({ assets, count, isPending, onUpload, showUploader }: FinalAssetsPanelProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [validationError, setValidationError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectFiles = (incoming: FileList | null) => {
    const files = incoming ? Array.from(incoming) : [];
    if (files.length === 0) return;
    if (files.length > MAX_FINAL_ASSET_FILES) { setValidationError("Choose no more than 10 files."); return; }
    const invalid = files.find((file) => !isValidFinalAsset(file));
    if (invalid) { setValidationError(`${invalid.name} must be ZIP, PNG, JPG/JPEG, WebP, or PDF and no larger than 100 MB.`); return; }
    setSelectedFiles(files); setValidationError(null);
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-foreground">Final Files</h3>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {count === 0 ? "No final files uploaded yet." : `${count} final file${count === 1 ? "" : "s"} uploaded.`}
        </p>
      </div>
      {assets.length > 0 && (
        <ul className="divide-y divide-border rounded-lg border border-border bg-muted/10">
          {assets.map((asset) => (
            <li className="flex min-w-0 flex-col gap-1 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between text-xs" key={asset.id}>
              <div className="min-w-0">
                <p className="truncate font-medium text-foreground" title={asset.fileName}>{asset.fileName}</p>
                <p className="text-muted-foreground">{asset.mimeType} · {formatFileSize(asset.fileSize)}</p>
              </div>
              <p className="shrink-0 text-muted-foreground">Uploaded {formatWorkDate(asset.uploadedAt)}</p>
            </li>
          ))}
        </ul>
      )}
      {showUploader && count === 0 && (
        <div className="space-y-3 rounded-lg border border-dashed border-border bg-muted/15 p-4">
          <input accept=".zip,.png,.jpg,.jpeg,.webp,.pdf" className="sr-only" multiple onChange={(event) => selectFiles(event.target.files)} ref={inputRef} type="file" />
          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={() => inputRef.current?.click()} size="sm" type="button" variant="outline">
              <FileUp className="size-3.5" />
              <span>Choose final files</span>
            </Button>
            <p className="text-xs text-muted-foreground">1–10 files · 100 MB max each · ZIP, PNG, JPG, WebP, PDF</p>
          </div>
          {selectedFiles.length > 0 && (
            <ul className="space-y-2 rounded-lg bg-background p-3 border border-border">
              {selectedFiles.map((file) => (
                <li className="flex min-w-0 items-center justify-between gap-2 text-xs" key={`${file.name}-${file.lastModified}`}>
                  <span className="truncate font-medium">
                    {file.name} <span className="text-muted-foreground">({formatFileSize(file.size.toString())})</span>
                  </span>
                  <Button aria-label={`Remove ${file.name}`} onClick={() => setSelectedFiles((files) => files.filter((item) => item !== file))} size="icon-xs" type="button" variant="ghost">
                    <X className="size-3" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
          {validationError && <p className="text-xs font-medium text-destructive">{validationError}</p>}
          <Button
            className="w-full sm:w-auto font-semibold gap-1.5"
            disabled={isPending || selectedFiles.length === 0}
            onClick={() => onUpload(selectedFiles)}
            size="sm"
            type="button"
          >
            {isPending && <Loader2 className="size-3.5 animate-spin" />}
            <span>Upload Final Files</span>
          </Button>
        </div>
      )}
    </div>
  );
}
