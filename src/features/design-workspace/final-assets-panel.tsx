"use client";

import { FileUp, Loader2, X } from "lucide-react";
import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { formatWorkDate } from "@/features/designer-work/designer-work.types";

import type { DesignFinalAsset } from "./design-workspace.types";

const MAX_FINAL_ASSET_BYTES = 100 * 1024 * 1024;
const MAX_FINAL_ASSET_FILES = 10;
const ACCEPTED_FINAL_ASSET_TYPES = new Set([
  "application/octet-stream", "application/pdf", "application/x-zip-compressed", "application/zip", "image/jpeg", "image/png", "image/webp",
]);

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
    const invalid = files.find((file) => !ACCEPTED_FINAL_ASSET_TYPES.has(file.type) || file.size > MAX_FINAL_ASSET_BYTES);
    if (invalid) { setValidationError(`${invalid.name} must be ZIP, PNG, JPG/JPEG, WebP, or PDF and no larger than 100 MB.`); return; }
    setSelectedFiles(files); setValidationError(null);
  };

  return <section className="rounded-xl border border-border bg-card p-4 shadow-xs"><div><h2 className="font-semibold">Final files</h2><p className="mt-1 text-sm text-muted-foreground">{count === 0 ? "No final files uploaded yet." : `${count} final file${count === 1 ? "" : "s"} uploaded.`}</p></div>{assets.length > 0 && <ul className="mt-4 divide-y divide-border rounded-lg border border-border">{assets.map((asset) => <li className="flex min-w-0 flex-col gap-1 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between" key={asset.id}><div className="min-w-0"><p className="truncate text-sm font-medium" title={asset.fileName}>{asset.fileName}</p><p className="text-xs text-muted-foreground">{asset.mimeType} · {formatFileSize(asset.fileSize)}</p></div><p className="shrink-0 text-xs text-muted-foreground">Uploaded {formatWorkDate(asset.uploadedAt)}</p></li>)}</ul>}{showUploader && count === 0 && <div className="mt-4 space-y-3 border-t border-border pt-4"><input accept=".zip,.png,.jpg,.jpeg,.webp,.pdf" className="sr-only" multiple onChange={(event) => selectFiles(event.target.files)} ref={inputRef} type="file" /><div className="flex flex-wrap gap-2"><Button onClick={() => inputRef.current?.click()} size="sm" type="button" variant="outline"><FileUp />Choose final files</Button><p className="self-center text-xs text-muted-foreground">1–10 files · 100 MB each</p></div>{selectedFiles.length > 0 && <ul className="space-y-2 rounded-lg bg-muted/40 p-3">{selectedFiles.map((file) => <li className="flex min-w-0 items-center justify-between gap-2 text-sm" key={`${file.name}-${file.lastModified}`}><span className="truncate">{file.name} <span className="text-muted-foreground">({formatFileSize(file.size.toString())})</span></span><Button aria-label={`Remove ${file.name}`} onClick={() => setSelectedFiles((files) => files.filter((item) => item !== file))} size="icon-xs" type="button" variant="ghost"><X /></Button></li>)}</ul>}{validationError && <p className="text-xs text-destructive">{validationError}</p>}<Button disabled={isPending || selectedFiles.length === 0} onClick={() => onUpload(selectedFiles)} type="button">{isPending && <Loader2 className="animate-spin" />}Upload Final Files</Button></div>}</section>;
}

export function formatFileSize(fileSize: string): string {
  if (!/^\d+$/.test(fileSize)) return "Unknown size";
  let value = fileSize.replace(/^0+(?=\d)/, "");
  const units = ["B", "KB", "MB", "GB"];
  let unitIndex = 0;
  while (isAtLeast(value, 1024) && unitIndex < units.length - 1) { value = divideDecimalString(value, 1024); unitIndex += 1; }
  return `${value} ${units[unitIndex]}`;
}

function isAtLeast(value: string, minimum: number): boolean {
  const minimumText = minimum.toString();
  return value.length > minimumText.length || (value.length === minimumText.length && value >= minimumText);
}

function divideDecimalString(value: string, divisor: number): string {
  let remainder = 0;
  let quotient = "";
  for (const digit of value) {
    const next = remainder * 10 + Number(digit);
    quotient += Math.floor(next / divisor).toString();
    remainder = next % divisor;
  }
  return quotient.replace(/^0+(?=\d)/, "");
}
