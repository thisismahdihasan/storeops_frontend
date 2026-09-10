/* eslint-disable @next/next/no-img-element */
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  Clipboard,
  ImageIcon,
  Loader2,
  RefreshCw,
  Upload,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useUploadReferenceImage } from "./use-research";

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

type ReferenceImageUploadModalProps = {
  description?: string;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (referenceImageUrl: string) => void;
  open: boolean;
  researchItemId: string;
  title?: string;
  workspaceId: string;
};

export function ReferenceImageUploadModal({
  description = "Select a JPEG, PNG, or WebP image (up to 10MB) to attach as the reference image.",
  onOpenChange,
  onSuccess,
  open,
  researchItemId,
  title = "Upload Reference Image",
  workspaceId,
}: ReferenceImageUploadModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadMutation = useUploadReferenceImage(workspaceId);

  // Manage component-instance Object URL lifecycle
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedFile) return;

    const url = URL.createObjectURL(selectedFile);
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
  }, [selectedFile]);

  // Single Source of Truth file validation handler
  const processIncomingFile = useCallback((file: File) => {
    setValidationError(null);

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      setValidationError(
        "Invalid file type. Only JPEG, PNG, and WebP images are supported.",
      );
      setSelectedFile(null);
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setValidationError("File is too large. Maximum allowed size is 10MB.");
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
  }, []);

  const handleOpenChange = (isOpen: boolean) => {
    onOpenChange(isOpen);
    if (!isOpen) {
      setSelectedFile(null);
      setValidationError(null);
      setIsDragging(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // 1. File picker handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processIncomingFile(file);
    }
  };

  // 2. Drag & Drop handlers
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only reset when leaving the dropzone container itself
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
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
    if (!open) return;

    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.startsWith("image/")) {
          e.preventDefault();
          const blob = item.getAsFile();
          if (!blob) continue;

          // Provide sensible generated filename for clipboard images
          const ext =
            item.type === "image/jpeg"
              ? "jpg"
              : item.type === "image/webp"
                ? "webp"
                : "png";

          const filename =
            blob.name && blob.name !== "image.png"
              ? blob.name
              : `research-reference-${Date.now()}.${ext}`;

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
  }, [open, processIncomingFile]);

  const handleClearSelection = () => {
    setSelectedFile(null);
    setValidationError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setValidationError("Please select an image file first.");
      return;
    }

    try {
      const result = await uploadMutation.mutateAsync({
        file: selectedFile,
        researchItemId,
      });

      toast.success("Reference image uploaded successfully.");
      handleOpenChange(false);
      onSuccess?.(result.data.referenceImageUrl);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to upload reference image. Please try again.";
      setValidationError(message);
      toast.error(message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md p-6">
        <DialogHeader>
          <DialogTitle className="text-base">{title}</DialogTitle>
          <DialogDescription className="text-xs">
            {description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Hidden native file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            id="reference-image-input"
            onChange={handleFileChange}
            disabled={uploadMutation.isPending}
          />

          {/* Upload trigger zone (Click, Drag/Drop, Paste) */}
          {!selectedFile ? (
            <div
              onDragEnter={handleDragEnter}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={cn(
                "relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 text-center transition-all",
                isDragging
                  ? "border-primary bg-primary/10 ring-2 ring-primary/30"
                  : "border-border bg-muted/20 hover:border-primary/50 hover:bg-muted/40",
              )}
            >
              <label
                htmlFor="reference-image-input"
                className="flex cursor-pointer flex-col items-center justify-center"
              >
                <div
                  className={cn(
                    "rounded-full p-2.5 transition-colors",
                    isDragging
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground",
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

              {/* Keyboard hint badge */}
              <div className="mt-3 flex items-center gap-1 text-[10px] text-muted-foreground/80">
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
                isDragging
                  ? "border-primary bg-primary/10 ring-2 ring-primary/30"
                  : "border-border",
              )}
            >
              <button
                type="button"
                onClick={handleClearSelection}
                disabled={uploadMutation.isPending}
                className="absolute top-2 right-2 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                title="Remove selection"
              >
                <X className="size-4" />
              </button>

              {previewUrl ? (
                <div className="flex max-h-48 w-full items-center justify-center overflow-hidden rounded-md">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="max-h-48 object-contain"
                  />
                </div>
              ) : (
                <div className="flex size-16 items-center justify-center rounded-md bg-muted">
                  <ImageIcon className="size-8 text-muted-foreground" />
                </div>
              )}

              <div className="mt-3 text-center">
                <p className="max-w-[280px] truncate text-xs font-medium text-foreground">
                  {selectedFile.name}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                </p>
              </div>

              {/* Action to change file */}
              <div className="mt-2 flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="xs"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadMutation.isPending}
                  className="h-6 gap-1 text-[11px]"
                >
                  <RefreshCw className="size-2.5" />
                  <span>Choose Different Image</span>
                </Button>
              </div>
            </div>
          )}

          {/* Validation / error display */}
          {validationError && (
            <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-2.5 text-xs text-destructive">
              <AlertCircle className="size-4 shrink-0" />
              <span>{validationError}</span>
            </div>
          )}
        </div>

        <DialogFooter className="flex-row justify-end gap-2 sm:flex-row">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleOpenChange(false)}
            disabled={uploadMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={() => void handleUpload()}
            disabled={!selectedFile || uploadMutation.isPending}
            className="gap-1.5"
          >
            {uploadMutation.isPending ? (
              <>
                <Loader2 className="size-3.5 animate-spin" />
                <span>Uploading…</span>
              </>
            ) : (
              <>
                <Upload className="size-3.5" />
                <span>Upload</span>
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
