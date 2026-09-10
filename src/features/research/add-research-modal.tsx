/* eslint-disable @next/next/no-img-element */
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  Calendar,
  CheckCircle2,
  ExternalLink,
  ImageIcon,
  Info,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  Upload,
  User,
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/ui/status-badge";
import { DuplicateAlertModal } from "./duplicate-alert-modal";
import { ReferenceImageUploadModal } from "./reference-image-upload-modal";
import { DuplicateResearchError } from "./research.api";
import type {
  DuplicateResearchData,
  PreviewResearchResult,
  ResearchStatus,
} from "./research.types";
import { useCreateResearchItem, usePreviewResearch } from "./use-research";

type AddResearchModalProps = {
  onOpenExistingDetail: (researchItemId: string) => void;
  workspaceId: string;
};

type CreatedItemState = {
  etsyListingId: string;
  id: string;
  referenceImageUrl: string | null;
  status: ResearchStatus;
  title: string | null;
};

function isValidEtsyListingUrl(url: string): boolean {
  try {
    const parsed = new URL(url.trim());
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return false;
    }
    const hostname = parsed.hostname.toLowerCase();
    const isEtsyHost =
      hostname === "etsy.com" || hostname.endsWith(".etsy.com");
    if (!isEtsyHost) {
      return false;
    }
    return /(?:^|\/)listing\/(\d+)(?:\/|$)/i.test(parsed.pathname);
  } catch {
    return false;
  }
}

function getStatusTone(
  status: ResearchStatus,
): "danger" | "info" | "neutral" | "success" | "warning" {
  switch (status) {
    case "CORRECTION_NEEDED":
      return "warning";
    case "ISSUE_REPORTED":
      return "danger";
    case "DESIGN_APPROVED":
    case "LISTED":
      return "success";
    case "DESIGN_IN_PROGRESS":
    case "DESIGN_REVIEW":
    case "READY_FOR_LISTING":
    case "LISTING_IN_PROGRESS":
      return "info";
    default:
      return "neutral";
  }
}

function formatStatusLabel(status: ResearchStatus): string {
  return status
    .split("_")
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(" ");
}

export function AddResearchModal({
  onOpenExistingDetail,
  workspaceId,
}: AddResearchModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [etsyUrl, setEtsyUrl] = useState("");
  const [inputError, setInputError] = useState<string | null>(null);

  // Preview state
  const [previewResult, setPreviewResult] =
    useState<PreviewResearchResult | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const lastPreviewedUrlRef = useRef<string>("");

  // Post-create manual image fallback state
  const [createdItem, setCreatedItem] = useState<CreatedItemState | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  // Fallback 409 duplicate state
  const [raceConditionDuplicate, setRaceConditionDuplicate] =
    useState<DuplicateResearchData | null>(null);

  const previewMutation = usePreviewResearch(workspaceId);
  const createMutation = useCreateResearchItem(workspaceId);

  // Reset when dialog opens/closes
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setEtsyUrl("");
      setInputError(null);
      setPreviewResult(null);
      setPreviewError(null);
      setCreatedItem(null);
      setIsUploadModalOpen(false);
      setRaceConditionDuplicate(null);
      lastPreviewedUrlRef.current = "";
    }
  };

  // Perform preview
  const executePreview = useCallback(
    async (urlToPreview: string) => {
      const trimmed = urlToPreview.trim();
      if (!isValidEtsyListingUrl(trimmed)) {
        setInputError(
          "Please enter a valid Etsy listing URL (e.g. https://www.etsy.com/listing/123456789/product-title).",
        );
        setPreviewResult(null);
        return;
      }

      setInputError(null);
      setPreviewError(null);
      lastPreviewedUrlRef.current = trimmed;

      try {
        const result = await previewMutation.mutateAsync(trimmed);
        setPreviewResult(result.data);
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Unable to preview this listing. Please check the URL and try again.";
        setPreviewError(message);
        setPreviewResult(null);
      }
    },
    [previewMutation],
  );

  // Debounced auto-preview when valid URL is entered
  useEffect(() => {
    const trimmed = etsyUrl.trim();
    if (
      !trimmed ||
      !isValidEtsyListingUrl(trimmed) ||
      trimmed === lastPreviewedUrlRef.current
    ) {
      return;
    }

    const timer = setTimeout(() => {
      void executePreview(trimmed);
    }, 450);

    return () => clearTimeout(timer);
  }, [etsyUrl, executePreview]);

  // Handle URL change
  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setEtsyUrl(val);
    setInputError(null);
    setPreviewError(null);
    if (!val.trim()) {
      setPreviewResult(null);
      lastPreviewedUrlRef.current = "";
    } else if (previewResult && val.trim() !== lastPreviewedUrlRef.current) {
      setPreviewResult(null);
    }
  };

  // Create research item
  const handleCreate = async () => {
    const targetUrl = previewResult?.normalizedUrl || etsyUrl.trim();
    if (!isValidEtsyListingUrl(targetUrl)) {
      setInputError("A valid Etsy listing URL is required.");
      return;
    }

    try {
      const result = await createMutation.mutateAsync({
        etsyUrl: targetUrl,
      });

      const newItem = result.data.researchItem;
      const initialStatus = newItem.status;
      const assignmentMessage =
        initialStatus === "ASSIGNED"
          ? "Research item created and assigned to designer."
          : "Research item created (awaiting designer assignment).";

      // If reference image exists, close modal with success toast
      if (newItem.referenceImageUrl) {
        toast.success(assignmentMessage);
        handleOpenChange(false);
      } else {
        // If reference image was null, transition to post-create manual upload step
        toast.success(assignmentMessage);
        setCreatedItem({
          etsyListingId: newItem.etsyListingId,
          id: newItem.id,
          referenceImageUrl: null,
          status: newItem.status,
          title: newItem.title,
        });
      }
    } catch (error) {
      if (error instanceof DuplicateResearchError) {
        setRaceConditionDuplicate(error.duplicateData);
        return;
      }

      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to add research item. Please try again.",
      );
    }
  };

  const isPreviewLoading = previewMutation.isPending;
  const isCreating = createMutation.isPending;
  const isDuplicate = previewResult?.alreadyExists === true;
  const duplicateInfo = previewResult?.duplicate;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <DialogTrigger
          render={
            <Button size="sm" className="gap-1.5 font-medium">
              <Plus className="size-4" />
              <span>Add Research</span>
            </Button>
          }
        />

        <DialogContent className="max-w-lg p-6">
          {/* STEP: Post-Create Reference Image Fallback */}
          {createdItem ? (
            <div className="space-y-4">
              <DialogHeader>
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-500">
                  <CheckCircle2 className="size-5" />
                  <DialogTitle className="text-base">
                    Research Item Created
                  </DialogTitle>
                </div>
                <DialogDescription className="text-xs">
                  Listing #{createdItem.etsyListingId} has been successfully added to your workspace research queue.
                </DialogDescription>
              </DialogHeader>

              <div className="rounded-lg border border-border bg-muted/20 p-4 space-y-3">
                {createdItem.referenceImageUrl ? (
                  <div className="flex items-center gap-3">
                    <img
                      src={createdItem.referenceImageUrl}
                      alt="Uploaded reference"
                      className="size-16 rounded-md object-cover border border-border"
                    />
                    <div>
                      <p className="text-xs font-medium text-foreground">
                        Reference image attached!
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        Designers will now see this image when working on the item.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    <div className="flex items-start gap-2 text-amber-600 dark:text-amber-500">
                      <Info className="size-4 shrink-0 mt-0.5" />
                      <p className="text-xs">
                        Reference image was not found automatically from Etsy.
                      </p>
                    </div>
                    <p className="text-[11px] text-muted-foreground pl-6">
                      You can upload a reference image now so designers have visual reference material, or do it later from the item details.
                    </p>
                  </div>
                )}
              </div>

              <DialogFooter className="mt-4 flex-row justify-end gap-2 sm:flex-row">
                {!createdItem.referenceImageUrl && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsUploadModalOpen(true)}
                    className="gap-1.5"
                  >
                    <Upload className="size-3.5" />
                    <span>Upload Reference Image</span>
                  </Button>
                )}
                <Button
                  type="button"
                  size="sm"
                  onClick={() => handleOpenChange(false)}
                >
                  Done
                </Button>
              </DialogFooter>
            </div>
          ) : (
            /* STEP: Pre-Create Input & Preview */
            <div className="space-y-4">
              <DialogHeader>
                <DialogTitle className="text-base">
                  Add Research Item
                </DialogTitle>
                <DialogDescription className="text-xs">
                  Paste an Etsy product listing URL. We will check the listing and verify for duplicates before creation.
                </DialogDescription>
              </DialogHeader>

              {/* URL Input */}
              <div className="space-y-2">
                <label
                  htmlFor="etsy-listing-url"
                  className="text-xs font-medium text-foreground"
                >
                  Etsy Listing URL
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute top-2.5 left-2.5 size-4 text-muted-foreground" />
                    <Input
                      id="etsy-listing-url"
                      placeholder="https://www.etsy.com/listing/123456789/product-title"
                      className="pl-9 text-xs"
                      value={etsyUrl}
                      onChange={handleUrlChange}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          if (
                            previewResult &&
                            !isDuplicate &&
                            !isPreviewLoading &&
                            !isCreating
                          ) {
                            void handleCreate();
                          } else if (isValidEtsyListingUrl(etsyUrl)) {
                            void executePreview(etsyUrl);
                          }
                        }
                      }}
                      disabled={isCreating}
                    />
                  </div>

                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => void executePreview(etsyUrl)}
                    disabled={
                      !isValidEtsyListingUrl(etsyUrl) ||
                      isPreviewLoading ||
                      isCreating
                    }
                    className="shrink-0 gap-1.5"
                  >
                    {isPreviewLoading ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <RefreshCw className="size-3.5" />
                    )}
                    <span>Check</span>
                  </Button>
                </div>

                {inputError && (
                  <p className="text-xs font-medium text-destructive">
                    {inputError}
                  </p>
                )}
              </div>

              {/* Preview Loading State */}
              {isPreviewLoading && (
                <div className="flex h-28 items-center justify-center rounded-lg border border-border bg-muted/20">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Loader2 className="size-4 animate-spin text-primary" />
                    <span>Checking Etsy listing and duplicate status…</span>
                  </div>
                </div>
              )}

              {/* Preview Error State */}
              {previewError && !isPreviewLoading && (
                <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive space-y-2">
                  <div className="flex items-center gap-2 font-medium">
                    <AlertCircle className="size-4 shrink-0" />
                    <span>Failed to check listing</span>
                  </div>
                  <p className="text-[11px] text-destructive/90">
                    {previewError}
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="xs"
                    onClick={() => void executePreview(etsyUrl)}
                    className="h-6 text-[11px] gap-1"
                  >
                    <RefreshCw className="size-3" />
                    <span>Retry Check</span>
                  </Button>
                </div>
              )}

              {/* Preview Result: Duplicate State */}
              {previewResult && isDuplicate && duplicateInfo && !isPreviewLoading && (
                <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3.5 space-y-3">
                  <div className="flex items-center gap-2 text-amber-600 dark:text-amber-500 font-medium text-xs">
                    <AlertCircle className="size-4 shrink-0" />
                    <span>Listing Already Exists in Workspace</span>
                  </div>

                  <p className="text-xs text-muted-foreground">
                    This Etsy listing was already added to this workspace. Adding duplicates is not allowed.
                  </p>

                  <div className="space-y-1.5 rounded-md border border-border bg-card/60 p-2.5 text-[11px]">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Status:</span>
                      <StatusBadge
                        label={formatStatusLabel(duplicateInfo.currentStatus)}
                        tone={getStatusTone(duplicateInfo.currentStatus)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <User className="size-3" />
                        <span>Added by:</span>
                      </span>
                      <span className="font-medium text-foreground">
                        {duplicateInfo.createdBy.name ||
                          duplicateInfo.createdBy.email}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <Calendar className="size-3" />
                        <span>Date added:</span>
                      </span>
                      <span className="text-foreground">
                        {new Date(duplicateInfo.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-end pt-1">
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => {
                        handleOpenChange(false);
                        onOpenExistingDetail(duplicateInfo.researchItemId);
                      }}
                      className="gap-1.5"
                    >
                      <span>View Existing Item</span>
                      <ArrowRight className="size-3.5" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Preview Result: Not Duplicate (Ready to Add or Partial Metadata) */}
              {previewResult && !isDuplicate && !isPreviewLoading && (
                <div className="rounded-lg border border-border bg-muted/20 p-3.5 space-y-3">
                  <div className="flex items-start gap-3">
                    {/* Image Preview or Fallback */}
                    {previewResult.referenceImageUrl ? (
                      <img
                        src={previewResult.referenceImageUrl}
                        alt={previewResult.title || "Etsy listing"}
                        className="size-16 shrink-0 rounded-md object-cover border border-border"
                      />
                    ) : (
                      <div
                        className="flex size-16 shrink-0 flex-col items-center justify-center rounded-md border border-dashed border-border bg-muted/40 text-muted-foreground"
                        title="Reference image unavailable"
                      >
                        <ImageIcon className="size-5" />
                        <span className="mt-0.5 text-[9px]">No Image</span>
                      </div>
                    )}

                    {/* Listing Info */}
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] font-semibold text-foreground">
                          Listing #{previewResult.etsyListingId}
                        </span>
                        <a
                          href={previewResult.normalizedUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-0.5 text-[11px] text-primary hover:underline"
                        >
                          <span>Etsy</span>
                          <ExternalLink className="size-2.5" />
                        </a>
                      </div>

                      {previewResult.title ? (
                        <p className="line-clamp-2 text-xs font-medium text-foreground">
                          {previewResult.title}
                        </p>
                      ) : (
                        <p className="text-xs italic text-muted-foreground">
                          Title unavailable (will use Listing #{previewResult.etsyListingId})
                        </p>
                      )}

                      {!previewResult.referenceImageUrl && (
                        <p className="text-[11px] text-amber-600 dark:text-amber-500">
                          No image was found automatically. You can add one manually after creating the research item.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <DialogFooter className="mt-4 flex-row justify-end gap-2 sm:flex-row">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleOpenChange(false)}
                  disabled={isCreating}
                >
                  Cancel
                </Button>

                {/* Show Add Research button only if preview completed and not duplicate */}
                {previewResult && !isDuplicate && (
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => void handleCreate()}
                    disabled={isCreating || isPreviewLoading}
                    className="gap-1.5"
                  >
                    {isCreating ? (
                      <>
                        <Loader2 className="size-3.5 animate-spin" />
                        <span>Adding…</span>
                      </>
                    ) : (
                      <>
                        <Plus className="size-3.5" />
                        <span>Add Research</span>
                      </>
                    )}
                  </Button>
                )}
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Manual Reference Image Upload Dialog for newly created item */}
      {createdItem && (
        <ReferenceImageUploadModal
          open={isUploadModalOpen}
          onOpenChange={setIsUploadModalOpen}
          workspaceId={workspaceId}
          researchItemId={createdItem.id}
          title="Add Reference Image"
          description="Upload an image to serve as visual reference for designers working on this item."
          onSuccess={(newImageUrl) => {
            setCreatedItem((prev) =>
              prev ? { ...prev, referenceImageUrl: newImageUrl } : null,
            );
          }}
        />
      )}

      {/* Fallback race condition duplicate modal */}
      <DuplicateAlertModal
        open={raceConditionDuplicate !== null}
        duplicateData={raceConditionDuplicate}
        onClose={() => setRaceConditionDuplicate(null)}
        onViewExistingItem={(id) => {
          setRaceConditionDuplicate(null);
          handleOpenChange(false);
          onOpenExistingDetail(id);
        }}
      />
    </>
  );
}
