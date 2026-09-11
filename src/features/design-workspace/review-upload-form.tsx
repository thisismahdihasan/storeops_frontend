"use client";

import { ImageUp, Loader2 } from "lucide-react";
import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

const MAX_REVIEW_IMAGE_BYTES = 10 * 1024 * 1024;
const REVIEW_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

type ReviewUploadFormProps = {
  isPending: boolean;
  onSubmit: (file: File, note: string) => void;
};

export function ReviewUploadForm({ isPending, onSubmit }: ReviewUploadFormProps) {
  const [file, setFile] = useState<File | null>(null);
  const [note, setNote] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectFile = (candidate: File | null) => {
    if (!candidate) return;
    if (!REVIEW_IMAGE_TYPES.has(candidate.type)) {
      setFile(null); setValidationError("Choose a JPEG, PNG, or WebP image."); return;
    }
    if (candidate.size > MAX_REVIEW_IMAGE_BYTES) {
      setFile(null); setValidationError("Review images must be 10 MB or smaller."); return;
    }
    setFile(candidate); setValidationError(null);
  };

  const submit = () => {
    if (!file) { setValidationError("Choose an image before uploading."); return; }
    onSubmit(file, note);
  };

  return (
    <section className="rounded-xl border border-border bg-card p-4 shadow-xs">
      <h2 className="font-semibold">Upload for Review</h2><p className="mt-1 text-sm text-muted-foreground">Send one JPEG, PNG, or WebP image up to 10 MB to Admin review.</p>
      <div className="mt-4 space-y-4">
        <div className="rounded-lg border border-dashed border-border bg-muted/20 p-4">
          <input accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(event) => selectFile(event.target.files?.[0] ?? null)} ref={inputRef} type="file" />
          <div className="flex flex-wrap items-center gap-3"><Button onClick={() => inputRef.current?.click()} size="sm" type="button" variant="outline"><ImageUp />Choose image</Button>{file ? <p className="min-w-0 break-all text-sm font-medium">{file.name} <span className="text-muted-foreground">({formatMegabytes(file.size)})</span></p> : <p className="text-sm text-muted-foreground">No file selected</p>}</div>
          {validationError && <p className="mt-2 text-xs text-destructive">{validationError}</p>}
        </div>
        <div className="space-y-2"><Label htmlFor="review-note">Note <span className="text-muted-foreground">(optional)</span></Label><textarea className="min-h-24 w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-1 focus-visible:ring-ring" id="review-note" maxLength={2000} onChange={(event) => setNote(event.target.value)} placeholder="Add context for the reviewer." value={note} /><p className="text-right text-xs text-muted-foreground">{note.length}/2000</p></div>
        <Button disabled={isPending} onClick={submit} type="button">{isPending && <Loader2 className="animate-spin" />}Upload for Review</Button>
      </div>
    </section>
  );
}

function formatMegabytes(size: number): string { return `${(size / (1024 * 1024)).toFixed(1)} MB`; }
