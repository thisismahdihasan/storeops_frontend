/* eslint-disable @next/next/no-img-element */
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  Clipboard,
  ImageIcon,
  RefreshCw,
  Upload,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const ALLOWED_REFERENCE_IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];
export const MAX_REFERENCE_IMAGE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

export type ReferenceImagePickerProps = {
  className?: string;
  disabled?: boolean;
  error?: string | null;
  id?: string;
  onChange: (file: File | null) => void;
  value: File | null;
};

export function ReferenceImagePicker({
  className,
  disabled = false,
  error,
  id = "reference-image-picker-input",
  onChange,
  value,
}: ReferenceImagePickerProps) {
  const [internalError, setInternalError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Manage component-instance Object URL lifecycle
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!value) return;

    const url = URL.createObjectURL(value);
    let isCancelled = false;

    queueMicrotask(() => {
      if (!isCancelled) {
        setPreviewUrl(url);
      }
    });

    return () => {
      isCancelled = true;
      URL.revokeObjectURL(url);
      setPreviewUrl(null);
    };
  }, [value]);

  // Single Source of Truth file validation handler
  const processIncomingFile = useCallback(
    (file: File) => {
      setInternalError(null);

      if (!ALLOWED_REFERENCE_IMAGE_MIME_TYPES.includes(file.type)) {
        setInternalError(
          "Invalid file type. Only JPEG, PNG, and WebP images are supported."
        );
        onChange(null);
        return;
      }

      if (file.size > MAX_REFERENCE_IMAGE_SIZE_BYTES) {
        setInternalError(
          "File is too large. Maximum allowed size is 10MB."
        );
        onChange(null);
        return;
      }

      onChange(file);
    },
    [onChange]
  );

  // 1. File picker handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processIncomingFile(file);
    }
  };

  // 2. Drag & Drop handlers
  const handleDragEnter = (e: React.DragEvent) => {
    if (disabled) return;
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (disabled) return;
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    if (disabled) return;
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    if (disabled) return;
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      processIncomingFile(file);
    }
  };

  // 3. Clipboard Paste handler
  useEffect(() => {
    if (disabled) return;

    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.startsWith("image/")) {
          e.preventDefault();
          const blob = item.getAsFile();
          if (!blob) continue;

          const ext =
            item.type === "image/jpeg"
              ? "jpg"
              : item.type === "image/webp"
                ? "webp"
                : "png";

          const filename =
            blob.name && blob.name !== "image.png"
              ? blob.name
              : `reference-image-${Date.now()}.${ext}`;

          const file = new File([blob], filename, { type: item.type });
          processIncomingFile(file);
          toast.info("Image pasted from clipboard");
          return;
        }
      }
    };

    window.addEventListener("paste", handlePaste);
    return () => {
      window.removeEventListener("paste", handlePaste);
    };
  }, [disabled, processIncomingFile]);

  const handleClear = () => {
    onChange(null);
    setInternalError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const displayError = error || internalError;

  return (
    <div className={cn("space-y-3", className)}>
      {/* Hidden native file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        id={id}
        onChange={handleFileChange}
        disabled={disabled}
      />

      {!value ? (
        /* Dropzone Trigger */
        <div
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            "relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-5 text-center transition-all",
            disabled && "pointer-events-none opacity-50",
            isDragging
              ? "border-primary bg-primary/10 ring-2 ring-primary/30"
              : "border-border bg-muted/20 hover:border-primary/50 hover:bg-muted/40"
          )}
        >
          <label
            htmlFor={id}
            className="flex cursor-pointer flex-col items-center justify-center"
          >
            <div
              className={cn(
                "rounded-full p-2.5 transition-colors",
                isDragging
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              )}
            >
              <Upload className="size-5" />
            </div>
            <p className="mt-2.5 text-xs font-medium text-foreground">
              Drop an image here, choose a file, or paste from clipboard
            </p>
            <p className="mt-1 text-[11px] text-muted-foreground">
              JPEG, PNG, or WebP up to 10MB
            </p>
          </label>

          {/* Keyboard paste tip */}
          <div className="mt-2.5 flex items-center gap-1 text-[10px] text-muted-foreground/80">
            <Clipboard className="size-3" />
            <span>Tip: Press</span>
            <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] text-foreground">
              Ctrl+V
            </kbd>
            <span>or</span>
            <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] text-foreground">
              ⌘V
            </kbd>
            <span>to paste</span>
          </div>
        </div>
      ) : (
        /* Selected File Preview Card */
        <div
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            "relative flex flex-col items-center rounded-lg border bg-muted/20 p-4 transition-all",
            disabled && "pointer-events-none opacity-50",
            isDragging
              ? "border-primary bg-primary/10 ring-2 ring-primary/30"
              : "border-border"
          )}
        >
          <button
            type="button"
            onClick={handleClear}
            disabled={disabled}
            className="absolute top-2 right-2 rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
            title="Remove selected image"
            aria-label="Remove selected image"
          >
            <X className="size-4" />
          </button>

          {previewUrl ? (
            <div className="flex max-h-44 w-full items-center justify-center overflow-hidden rounded-md border border-border bg-background/50 p-1">
              <img
                src={previewUrl}
                alt="Selected reference preview"
                className="max-h-40 object-contain rounded-sm"
              />
            </div>
          ) : (
            <div className="flex size-16 items-center justify-center rounded-md bg-muted">
              <ImageIcon className="size-8 text-muted-foreground" />
            </div>
          )}

          <div className="mt-2.5 text-center">
            <p className="max-w-[320px] truncate text-xs font-semibold text-foreground">
              {value.name}
            </p>
            <p className="text-[11px] text-muted-foreground">
              {(value.size / (1024 * 1024)).toFixed(2)} MB
            </p>
          </div>

          <div className="mt-2 flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="xs"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled}
              className="h-6 gap-1 text-[11px]"
            >
              <RefreshCw className="size-2.5" />
              <span>Choose Different Image</span>
            </Button>
          </div>
        </div>
      )}

      {/* Validation / error display */}
      {displayError && (
        <div
          role="alert"
          className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-2.5 text-xs text-destructive"
        >
          <AlertCircle className="size-4 shrink-0" />
          <span>{displayError}</span>
        </div>
      )}
    </div>
  );
}
