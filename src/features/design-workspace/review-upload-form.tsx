/* eslint-disable @next/next/no-img-element */
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CircleAlert, ImageUp, Loader2, Trash2, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

const MAX_REVIEW_IMAGE_BYTES = 10 * 1024 * 1024;
const REVIEW_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

type ReviewUploadFormProps = {
  isPending: boolean;
  onReportIssue?: () => void;
  onSubmit: (file: File, note: string) => void;
};

function formatFileSize(size: number): string {
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function validationMessage(candidate: File): string | null {
  if (candidate.size === 0) return "The selected image is empty.";
  if (!REVIEW_IMAGE_TYPES.has(candidate.type)) return "Choose a JPEG, PNG, or WebP image.";
  if (candidate.size > MAX_REVIEW_IMAGE_BYTES) return "Review images must be 10 MB or smaller.";
  return null;
}

export function ReviewUploadForm({
  isPending,
  onReportIssue,
  onSubmit,
}: ReviewUploadFormProps) {
  const [file, setFile] = useState<File | null>(null);
  const [note, setNote] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const isBusy = isPending;

  const selectFiles = useCallback((candidates: File[]) => {
    if (isBusy) return;
    if (candidates.length !== 1) {
      setValidationError(candidates.length > 1 ? "Choose one image for this review submission." : "Choose an image before uploading.");
      return;
    }

    const candidate = candidates[0];
    const error = validationMessage(candidate);
    if (error) {
      setValidationError(error);
      return;
    }

    setFile(candidate);
    setValidationError(null);
  }, [isBusy]);

  useEffect(() => {
    const handlePaste = (event: ClipboardEvent) => {
      const imageFiles = Array.from(event.clipboardData?.files ?? []).filter((candidate) => candidate.type.startsWith("image/"));
      if (imageFiles.length === 0) return;
      event.preventDefault();
      selectFiles(imageFiles);
    };

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [selectFiles]);

  useEffect(() => {
    if (!file) return;
    const objectUrl = URL.createObjectURL(file);
    let isCancelled = false;
    queueMicrotask(() => { if (!isCancelled) setPreviewUrl(objectUrl); });
    return () => {
      isCancelled = true;
      URL.revokeObjectURL(objectUrl);
      setPreviewUrl(null);
    };
  }, [file]);

  const openFilePicker = () => {
    if (!isBusy) inputRef.current?.click();
  };
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    selectFiles(Array.from(event.target.files ?? []));
    event.target.value = "";
  };
  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    if (isBusy) return;
    selectFiles(Array.from(event.dataTransfer.files));
  };
  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    const nextTarget = event.relatedTarget;
    if (!(nextTarget instanceof Node) || !event.currentTarget.contains(nextTarget)) {
      setIsDragging(false);
    }
  };
  const handleSubmit = () => {
    if (!file) {
      setValidationError("Choose an image before uploading.");
      return;
    }
    onSubmit(file, note);
  };

  const dropZoneClassName = `cursor-pointer rounded-lg border border-dashed text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${isDragging ? "border-primary bg-primary/5" : "border-border bg-muted/20 hover:bg-muted/40"}`;
  const keyboardOpen = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openFilePicker();
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-0.5">
        <h3 className="text-sm font-semibold text-foreground">Upload Proof for Review</h3>
        <p className="text-xs text-muted-foreground">Send one JPEG, PNG, or WebP image up to 10 MB to Admin review.</p>
      </div>
      <div className="space-y-4">
        <input accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={handleFileChange} ref={inputRef} type="file" />
        {!file ? (
          <div aria-describedby="review-upload-help" aria-label="Choose or drop a review image" className={`flex min-h-40 flex-col items-center justify-center p-5 ${dropZoneClassName}`} onClick={openFilePicker} onDragEnter={(event) => { event.preventDefault(); setIsDragging(true); }} onDragLeave={handleDragLeave} onDragOver={(event) => { event.preventDefault(); setIsDragging(true); }} onDrop={handleDrop} onKeyDown={keyboardOpen} role="button" tabIndex={0}><ImageUp className="size-7 text-muted-foreground" /><p className="mt-3 text-sm font-medium">Choose image or drop it here</p><p className="mt-1 text-xs text-muted-foreground" id="review-upload-help">You can also paste an image from your clipboard.</p></div>
        ) : (
          <div className="space-y-3 rounded-lg border border-border bg-muted/20 p-3">
            {previewUrl ? <div className="flex max-h-72 justify-center overflow-hidden rounded-md border border-border bg-background p-2"><img alt="Selected review preview" className="max-h-64 max-w-full object-contain" src={previewUrl} /></div> : <div className="flex h-40 items-center justify-center rounded-md border border-border bg-background text-xs text-muted-foreground">Preparing preview...</div>}
            <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><p className="truncate text-sm font-medium" title={file.name}>{file.name}</p><p className="text-xs text-muted-foreground">{formatFileSize(file.size)} · {file.type}</p></div><div className="flex shrink-0 flex-wrap gap-2"><Button disabled={isBusy} onClick={openFilePicker} size="sm" type="button" variant="outline"><Upload className="size-3.5" />Replace image</Button><Button disabled={isBusy} onClick={() => { setFile(null); setValidationError(null); }} size="sm" type="button" variant="outline"><Trash2 className="size-3.5" />Remove image</Button></div></div>
            <div aria-label="Replace the review image by dropping another image" className={`px-3 py-2 text-xs text-muted-foreground ${dropZoneClassName}`} onClick={openFilePicker} onDragEnter={(event) => { event.preventDefault(); setIsDragging(true); }} onDragLeave={handleDragLeave} onDragOver={(event) => { event.preventDefault(); setIsDragging(true); }} onDrop={handleDrop} onKeyDown={keyboardOpen} role="button" tabIndex={0}>Drop a new image here, click to replace, or paste from clipboard.</div>
          </div>
        )}
        {validationError && <p className="text-xs font-medium text-destructive" role="alert">{validationError}</p>}
        <div className="space-y-2"><Label htmlFor="review-note">Note <span className="text-muted-foreground">(optional)</span></Label><textarea className="min-h-24 w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-1 focus-visible:ring-ring" disabled={isBusy} id="review-note" maxLength={2000} onChange={(event) => setNote(event.target.value)} placeholder="Add context for the reviewer." value={note} /><p className="text-right text-xs text-muted-foreground">{note.length}/2000</p></div>
        <div className="flex flex-wrap items-center gap-2.5">
          <Button className="w-full sm:w-auto font-semibold gap-1.5" disabled={!file || isBusy} onClick={handleSubmit} type="button">
            {isBusy && <Loader2 className="size-3.5 animate-spin" />}
            <span>Submit for Review</span>
          </Button>
          {onReportIssue && (
            <Button
              disabled={isBusy}
              onClick={onReportIssue}
              size="default"
              type="button"
              variant="ghost"
              className="text-muted-foreground hover:text-foreground"
            >
              <CircleAlert className="size-3.5" />
              <span>Report Issue</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
