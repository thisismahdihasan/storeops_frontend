/* eslint-disable @next/next/no-img-element */
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect, useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Calendar,
  CheckCircle2,
  ExternalLink,
  ImageIcon,
  Loader2,
  Plus,
  RefreshCw,
  Search,
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
import { ApiError } from "@/lib/api";
import { etsyExternalInlineClass } from "@/lib/etsy-styles";
import { cn } from "@/lib/utils";
import { DuplicateAlertModal } from "./duplicate-alert-modal";
import { ReferenceImagePicker } from "./reference-image-picker";
import { DuplicateResearchError } from "./research.api";
import {
  createResearchFormSchema,
  etsyListingUrlSchema,
} from "./research.schemas";
import type {
  DuplicateResearchData,
  PreviewResearchResult,
  ResearchStatus,
} from "./research.types";
import { useCreateResearchItem, usePreviewResearch } from "./use-research";

export type AddResearchModalProps = {
  onOpenExistingDetail: (researchItemId: string) => void;
  workspaceId: string;
};

type AddResearchFormValues = {
  etsyUrl: string;
};

function isValidEtsyListingUrl(url: string): boolean {
  return etsyListingUrlSchema.safeParse(url).success;
}

function getStatusTone(
  status: ResearchStatus
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
  const form = useForm<AddResearchFormValues>({
    defaultValues: { etsyUrl: "" },
    mode: "onChange",
    reValidateMode: "onChange",
    resolver: zodResolver(createResearchFormSchema),
  });
  const etsyUrl = useWatch({ control: form.control, name: "etsyUrl" }) ?? "";

  // Preview state
  const [previewResult, setPreviewResult] =
    useState<PreviewResearchResult | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const lastPreviewedUrlRef = useRef<string>("");
  const previewRequestIdRef = useRef(0);

  // Manual image state for when Etsy image is missing
  const [manualFile, setManualFile] = useState<File | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Fallback 409 duplicate state (race condition during create)
  const [raceConditionDuplicate, setRaceConditionDuplicate] =
    useState<DuplicateResearchData | null>(null);

  const {
    isPending: isPreviewLoading,
    mutateAsync: previewResearch,
    reset: resetPreview,
  } = usePreviewResearch(workspaceId);
  const {
    isPending: isCreating,
    mutateAsync: createResearchItem,
    reset: resetCreate,
  } = useCreateResearchItem(workspaceId);

  // Reset all state when dialog opens/closes
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      previewRequestIdRef.current += 1;
      form.reset({ etsyUrl: "" });
      setPreviewResult(null);
      setPreviewError(null);
      setManualFile(null);
      setSubmitError(null);
      setRaceConditionDuplicate(null);
      lastPreviewedUrlRef.current = "";
      resetPreview();
      resetCreate();
    }
  };

  // Perform preview check
  const executePreview = useCallback(
    async (urlToPreview: string) => {
      const trimmed = urlToPreview.trim();
      if (!isValidEtsyListingUrl(trimmed)) {
        form.setError("etsyUrl", {
          message:
            "Please enter a valid Etsy listing URL (e.g. https://www.etsy.com/listing/123456789/product-title).",
          type: "manual",
        });
        setPreviewResult(null);
        return;
      }

      const requestId = ++previewRequestIdRef.current;
      form.clearErrors("etsyUrl");
      setPreviewError(null);
      setSubmitError(null);
      lastPreviewedUrlRef.current = trimmed;

      try {
        const result = await previewResearch(trimmed);
        if (requestId !== previewRequestIdRef.current) {
          return;
        }
        setPreviewResult(result.data);
      } catch (err) {
        if (requestId !== previewRequestIdRef.current) {
          return;
        }
        const message =
          err instanceof Error
            ? err.message
            : "Unable to preview this listing. Please check the URL and try again.";
        setPreviewError(message);
        setPreviewResult(null);
      }
    },
    [form, previewResearch]
  );

  // Debounced auto-preview when valid URL is typed or pasted
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
    const trimmed = val.trim();
    if (trimmed !== lastPreviewedUrlRef.current) {
      previewRequestIdRef.current += 1;
      lastPreviewedUrlRef.current = "";
      setPreviewResult(null);
      setManualFile(null);
    }

    form.setValue("etsyUrl", val, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });
    setPreviewError(null);
    setSubmitError(null);
  };

  // Submit creation (JSON if Etsy image exists; FormData if manual image selected)
  const handleCreate = async () => {
    const targetUrl = previewResult?.normalizedUrl || etsyUrl.trim();
    if (!isValidEtsyListingUrl(targetUrl)) {
      form.setError("etsyUrl", {
        message: "A valid Etsy listing URL is required.",
        type: "manual",
      });
      return;
    }

    const etsyImageAvailable = Boolean(previewResult?.referenceImageUrl);
    if (!etsyImageAvailable && !manualFile) {
      setSubmitError(
        "A valid reference image is required to create this research item."
      );
      return;
    }

    setSubmitError(null);

    try {
      const result = await createResearchItem({
        etsyUrl: targetUrl,
        image: manualFile || undefined,
      });

      const newItem = result.data.researchItem;
      const assignmentMessage =
        newItem.status === "ASSIGNED"
          ? "Research item created and assigned to designer."
          : "Research item created (awaiting designer assignment).";

      // Immediate modal close and single success toast
      toast.success(assignmentMessage);
      handleOpenChange(false);
    } catch (error) {
      if (error instanceof DuplicateResearchError) {
        setRaceConditionDuplicate(error.duplicateData);
        return;
      }

      if (error instanceof ApiError && error.status === 422) {
        setSubmitError(
          "A valid reference image is required to create this research item."
        );
        return;
      }

      const message =
        error instanceof Error
          ? error.message
          : "Failed to add research item. Please try again.";
      setSubmitError(message);
      toast.error(message);
    }
  };

  const urlError = form.formState.errors.etsyUrl?.message;
  const isEtsyUrlValid = isValidEtsyListingUrl(etsyUrl);
  const isDuplicate = previewResult?.alreadyExists === true;
  const duplicateInfo = previewResult?.duplicate;

  const hasAutoImage = Boolean(previewResult?.referenceImageUrl);
  const isAddDisabled =
    isCreating ||
    isPreviewLoading ||
    !previewResult ||
    isDuplicate ||
    (!hasAutoImage && !manualFile);

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

        <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-2xl max-h-[85vh] overflow-y-auto p-6">
          <div className="space-y-5">
            {/* Section 1: Header */}
            <DialogHeader>
              <DialogTitle className="text-base font-semibold sm:text-lg">
                Add Research Item
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Paste an Etsy product listing URL. We will check the listing and verify for duplicates before creation.
              </DialogDescription>
            </DialogHeader>

            {/* Section 2: URL Input */}
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
                    autoComplete="url"
                    aria-describedby={urlError ? "etsy-listing-url-error" : undefined}
                    aria-invalid={Boolean(urlError)}
                    value={etsyUrl}
                    onChange={handleUrlChange}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        if (previewResult && !isDuplicate && !isAddDisabled) {
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
                    !isEtsyUrlValid ||
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

              {urlError && (
                <p
                  id="etsy-listing-url-error"
                  className="text-xs font-medium text-destructive"
                  role="alert"
                >
                  {urlError}
                </p>
              )}
            </div>

            {/* Preview Loading State */}
            {isPreviewLoading && (
              <div className="flex h-32 items-center justify-center rounded-xl border border-border bg-muted/20">
                <div className="flex items-center gap-2.5 text-xs text-muted-foreground">
                  <Loader2 className="size-4 animate-spin text-primary" />
                  <span>Checking Etsy listing and duplicate status…</span>
                </div>
              </div>
            )}

            {/* Preview Error State */}
            {previewError && !isPreviewLoading && (
              <div
                role="alert"
                className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-xs text-destructive space-y-2"
              >
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
            {previewResult && isDuplicate && !isPreviewLoading && (
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 space-y-3">
                <div className="flex items-center gap-2 text-amber-600 dark:text-amber-500 font-semibold text-xs">
                  <AlertCircle className="size-4 shrink-0" />
                  <span>{duplicateInfo ? "Listing Already Exists in Workspace" : "Already added"}</span>
                </div>

                <p className="text-xs text-muted-foreground">
                  {duplicateInfo
                    ? "This Etsy listing was already added to this workspace. Adding duplicates is not allowed."
                    : "This Etsy listing has already been added to this workspace."}
                </p>

                {!duplicateInfo && (
                  <p className="text-xs text-muted-foreground">
                    You can’t add the same listing twice.
                  </p>
                )}

                {duplicateInfo && (
                  <>
                    <div className="space-y-2 rounded-lg border border-border bg-card/70 p-3 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Status:</span>
                        <StatusBadge
                          label={formatStatusLabel(duplicateInfo.currentStatus)}
                          tone={getStatusTone(duplicateInfo.currentStatus)}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-muted-foreground">
                          <User className="size-3.5" />
                          <span>Added by:</span>
                        </span>
                        <span className="font-medium text-foreground">
                          {duplicateInfo.createdBy.name || duplicateInfo.createdBy.email}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-muted-foreground">
                          <Calendar className="size-3.5" />
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
                  </>
                )}
              </div>
            )}

            {/* Section 3: Listing Preview (Ready to add or requires manual image) */}
            {previewResult && !isDuplicate && !isPreviewLoading && (
              <div className="space-y-4">
                <div className="rounded-xl border border-border bg-muted/20 p-4">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                    {/* Enlarged Reference Thumbnail (96-112px) */}
                    <div className="size-24 sm:size-28 shrink-0 overflow-hidden rounded-lg border border-border bg-background/60">
                      {previewResult.referenceImageUrl ? (
                        <img
                          src={previewResult.referenceImageUrl}
                          alt={previewResult.title || "Etsy listing reference"}
                          className="size-full object-cover"
                        />
                      ) : (
                        <div className="flex size-full flex-col items-center justify-center border-2 border-dashed border-border bg-muted/30 text-muted-foreground/80 p-2 text-center">
                          <ImageIcon className="size-6 text-muted-foreground" />
                          <span className="mt-1 text-[10px] font-medium leading-tight">
                            No Etsy Image
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Listing Metadata */}
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <h3 className="line-clamp-2 text-sm font-semibold text-foreground">
                        {previewResult.title || `Etsy Listing #${previewResult.etsyListingId}`}
                      </h3>

                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <span className="font-mono text-[11px] font-semibold text-foreground/90">
                          #{previewResult.etsyListingId}
                        </span>
                        <span>•</span>
                        <a
                          href={previewResult.normalizedUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={cn("inline-flex items-center gap-1", etsyExternalInlineClass)}
                        >
                          <span>View on Etsy</span>
                          <ExternalLink className="size-3" />
                        </a>
                      </div>

                      {/* Image Availability State */}
                      {hasAutoImage ? (
                        <div className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-emerald-500/10 px-2 py-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 className="size-3.5" />
                          <span>Reference image detected from Etsy</span>
                        </div>
                      ) : (
                        <div className="mt-2 flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 p-2 text-xs text-amber-700 dark:text-amber-400">
                          <AlertTriangle className="size-4 shrink-0 mt-0.5" />
                          <span>
                            Reference image was not found on Etsy. Add an image below to continue.
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Section 4: Inline Manual Image Picker (Shown ONLY when Etsy image is missing) */}
                {!hasAutoImage && (
                  <div className="space-y-2 rounded-xl border border-border bg-card p-4">
                    <p className="text-xs font-semibold text-foreground">
                      Upload Reference Image
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      Attach a clear visual reference image for designers (JPEG, PNG, or WebP up to 10MB).
                    </p>
                    <div className="pt-1">
                      <ReferenceImagePicker
                        disabled={isCreating}
                        id="inline-research-image-picker"
                        onChange={(file) => {
                          setManualFile(file);
                          if (file) setSubmitError(null);
                        }}
                        value={manualFile}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Submission Error Alert */}
            {submitError && (
              <div
                role="alert"
                className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive"
              >
                <AlertCircle className="size-4 shrink-0" />
                <span>{submitError}</span>
              </div>
            )}

            {/* Section 5: Footer Actions */}
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

              {previewResult && !isDuplicate && (
                <Button
                  type="button"
                  size="sm"
                  onClick={() => void handleCreate()}
                  disabled={isAddDisabled}
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
        </DialogContent>
      </Dialog>

      {/* Fallback race-condition duplicate alert modal */}
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
