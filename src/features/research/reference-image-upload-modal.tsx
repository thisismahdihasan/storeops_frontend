"use client";

import { useState } from "react";
import { Loader2, Upload } from "lucide-react";
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
import { ReferenceImagePicker } from "./reference-image-picker";
import { useUploadReferenceImage } from "./use-research";

export type ReferenceImageUploadModalProps = {
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
  const [uploadError, setUploadError] = useState<string | null>(null);

  const uploadMutation = useUploadReferenceImage(workspaceId);

  const handleOpenChange = (isOpen: boolean) => {
    onOpenChange(isOpen);
    if (!isOpen) {
      setSelectedFile(null);
      setUploadError(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setUploadError("Please select an image file first.");
      return;
    }

    try {
      setUploadError(null);
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
      setUploadError(message);
      toast.error(message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-md p-6">
        <DialogHeader>
          <DialogTitle className="text-base">{title}</DialogTitle>
          <DialogDescription className="text-xs">
            {description}
          </DialogDescription>
        </DialogHeader>

        <div className="py-2">
          <ReferenceImagePicker
            disabled={uploadMutation.isPending}
            error={uploadError}
            id="standalone-reference-image-input"
            onChange={(file) => {
              setSelectedFile(file);
              if (file) setUploadError(null);
            }}
            value={selectedFile}
          />
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
