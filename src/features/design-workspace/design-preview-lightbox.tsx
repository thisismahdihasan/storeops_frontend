/* eslint-disable @next/next/no-img-element */
"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type DesignPreviewLightboxProps = {
  imageUrl: string | null;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  title: string;
};

export function DesignPreviewLightbox({
  imageUrl,
  onOpenChange,
  open,
  title,
}: DesignPreviewLightboxProps) {
  if (!imageUrl) return null;

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="max-h-[calc(100vh-2rem)] max-w-[calc(100vw-2rem)] bg-neutral-950 p-4 text-white sm:max-w-6xl">
        <DialogHeader className="pr-8">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription className="text-neutral-300">
            Enlarged read-only preview.
          </DialogDescription>
        </DialogHeader>
        <div className="flex min-h-0 items-center justify-center overflow-auto">
          <img
            alt={title}
            className="max-h-[calc(100vh-10rem)] max-w-full rounded-lg object-contain"
            src={imageUrl}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
