/* eslint-disable @next/next/no-img-element */
"use client";

import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  ExternalLink,
  History,
  ImageIcon,
  ShieldAlert,
  User,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { DesignPreviewLightbox } from "@/features/design-workspace/design-preview-lightbox";
import { AuthenticatedReferenceImage } from "@/features/research/authenticated-reference-image";
import type { ResearchStatus } from "@/features/research/research.types";
import { useWorkspaces } from "@/features/workspace/use-workspaces";
import { etsyExternalInlineClass } from "@/lib/etsy-styles";
import { cn } from "@/lib/utils";
import { ApiError } from "@/lib/api";

import { AnnotationPanel } from "./annotation-panel";
import { ReviewActions } from "./review-actions";
import { canUserReplyToAnnotation } from "./reviews.constants";
import { ReviewImageCanvas } from "./review-image-canvas";
import { useReviewDetail } from "./use-reviews";

type ReviewDetailViewProps = {
  reviewId: string;
  workspaceId: string;
};

type ReviewHistorySelection =
  | { kind: "reference" }
  | { kind: "review"; reviewId: string };

function formatDetailTime(value: string | null): string {
  if (!value) return "Unknown";
  try {
    return new Intl.DateTimeFormat(undefined, {
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date(value));
  } catch {
    return value;
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

function AccessDenied({
  message = "Only workspace Admins and assigned Designers can access review submissions.",
  title = "Review access required",
}: {
  message?: string;
  title?: string;
}) {
  return (
    <main className="mx-auto max-w-lg p-6">
      <section
        className="rounded-2xl border border-destructive/20 bg-card p-8 text-center shadow-xs"
        role="alert"
      >
        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <ShieldAlert className="size-6" />
        </div>
        <h1 className="mt-4 text-xl font-semibold text-foreground">
          {title}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {message}
        </p>
      </section>
    </main>
  );
}

function DetailLoadingState() {
  return (
    <div className="mx-auto max-w-screen-2xl space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="h-6 w-32 animate-pulse rounded bg-muted" />
      <div className="h-14 w-full animate-pulse rounded-xl bg-muted" />
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="h-[600px] animate-pulse rounded-2xl bg-muted/40 lg:col-span-8" />
        <div className="h-[600px] animate-pulse rounded-2xl bg-muted/40 lg:col-span-4" />
      </div>
    </div>
  );
}

function DetailErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="mx-auto max-w-lg p-6">
      <section
        className="rounded-2xl border border-destructive/30 bg-destructive/5 p-8 text-center"
        role="alert"
      >
        <AlertCircle className="mx-auto size-8 text-destructive" />
        <h2 className="mt-3 text-base font-semibold text-foreground">
          Unable to load review detail
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          This review could not be found or you do not have permission to view it.
        </p>
        <Button className="mt-4" onClick={onRetry} type="button" variant="outline">
          Try again
        </Button>
      </section>
    </div>
  );
}

export function ReviewDetailView({
  reviewId,
  workspaceId,
}: ReviewDetailViewProps) {
  const router = useRouter();
  const workspacesQuery = useWorkspaces();
  const activeWorkspace = workspacesQuery.data?.data.workspaces.find(
    (w) => w.id === workspaceId,
  );
  const isAdmin =
    activeWorkspace?.membership.roles.includes("ADMIN") ?? false;
  const isDesigner =
    activeWorkspace?.membership.roles.includes("DESIGNER") ?? false;
  const canAccess = isAdmin || isDesigner;

  const detailQuery = useReviewDetail(workspaceId, reviewId, canAccess);
  const [selectedAnnotationId, setSelectedAnnotationId] = useState<
    string | null
  >(null);
  const [hoveredAnnotationId, setHoveredAnnotationId] = useState<
    string | null
  >(null);
  const [historySelection, setHistorySelection] =
    useState<ReviewHistorySelection>({ kind: "review", reviewId });
  const [isReferenceLightboxOpen, setIsReferenceLightboxOpen] =
    useState(false);
  const [referencePreviewUrl, setReferencePreviewUrl] = useState<string | null>(
    null,
  );

  useEffect(() => {
    if (!selectedAnnotationId) return;

    document
      .getElementById(`annotation-thread-${selectedAnnotationId}`)
      ?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [selectedAnnotationId]);

  if (workspacesQuery.isLoading) {
    return <DetailLoadingState />;
  }

  if (!canAccess) {
    return <AccessDenied />;
  }

  if (detailQuery.isLoading) {
    return <DetailLoadingState />;
  }

  if (detailQuery.isError) {
    const isForbidden =
      detailQuery.error instanceof ApiError && detailQuery.error.status === 403;
    if (isForbidden) {
      return (
        <AccessDenied
          message="You are not assigned to this research item or do not have permission to view this review."
          title="Access denied"
        />
      );
    }
    return <DetailErrorState onRetry={() => void detailQuery.refetch()} />;
  }

  if (!detailQuery.data) {
    return <DetailErrorState onRetry={() => void detailQuery.refetch()} />;
  }

  const {
    currentDesigner,
    latestReviewId,
    researchItem,
    reviews,
    selectedReview,
  } = detailQuery.data.data;

  const isReferenceSelected = historySelection.kind === "reference";
  const isLatestReview = selectedReview.id === latestReviewId;
  const isActionable =
    isAdmin && researchItem.status === "DESIGN_REVIEW" && isLatestReview;
  const reviewStateMessage = !isLatestReview
    ? "Viewing historical round (read-only)"
    : researchItem.status === "CORRECTION_NEEDED"
      ? "Correction requested (read-only)"
      : researchItem.status === "DESIGN_APPROVED"
        ? "Design approved (read-only)"
        : isAdmin
          ? "Use the decision panel beside the feedback."
          : "Viewing review feedback (read-only)";
  const canReply = canUserReplyToAnnotation({
    hasAdminRole: isAdmin,
    hasDesignerRole: isDesigner,
    isAssignedDesigner: isDesigner,
    itemStatus: researchItem.status,
    isLatestReviewRound: isLatestReview,
  });

  const designerDisplayName =
    currentDesigner?.name || currentDesigner?.email || "Unassigned";

  function selectReference() {
    setHistorySelection({ kind: "reference" });
    setSelectedAnnotationId(null);
    setHoveredAnnotationId(null);
  }

  function selectReview(nextReviewId: string) {
    if (
      historySelection.kind === "review" &&
      historySelection.reviewId === nextReviewId
    ) {
      return;
    }

    setHistorySelection({ kind: "review", reviewId: nextReviewId });
    setSelectedAnnotationId(null);
    setHoveredAnnotationId(null);
    if (nextReviewId === selectedReview.id) return;

    router.push(`/w/${workspaceId}/reviews/${nextReviewId}`);
  }

  return (
    <div className="mx-auto max-w-screen-2xl space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Top Back Navigation Bar */}
      <div className="flex flex-wrap items-center gap-4">
        <Button
          nativeButton={false}
          render={
            <Link
              href={
                isAdmin
                  ? `/w/${workspaceId}/reviews`
                  : `/w/${workspaceId}/design/${researchItem.id}`
              }
            />
          }
          size="sm"
          variant="ghost"
        >
          <ArrowLeft className="size-4" />
          <span>{isAdmin ? "Back to Reviews" : "Back to Design"}</span>
        </Button>

      </div>

      {isAdmin && (
        <section aria-label="Review history" className="space-y-2">
          <div className="flex items-center gap-2">
            <History className="size-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold text-foreground">
              Review History
            </h2>
          </div>
          <div className="overflow-x-auto pb-1">
            <div className="flex w-max gap-3">
              {researchItem.referenceImageUrl && (
                <div
                  className={`relative w-32 overflow-hidden rounded-xl border bg-card p-1.5 transition-colors focus-within:ring-2 focus-within:ring-primary/30 ${
                    isReferenceSelected
                      ? "border-primary ring-2 ring-primary/30"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <div className="pointer-events-none flex h-20 items-center justify-center overflow-hidden rounded-lg bg-muted/30">
                    <AuthenticatedReferenceImage
                      alt="Reference image"
                      className="max-h-20 w-full rounded-lg object-cover"
                      containerClassName="h-20 min-h-0 p-0"
                      hasImage
                      minHeightClassName="min-h-0"
                      researchItemId={researchItem.id}
                      workspaceId={workspaceId}
                    />
                  </div>
                  <button
                    aria-current={isReferenceSelected ? "page" : undefined}
                    aria-label="Open reference image"
                    className="absolute inset-0 z-10 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    onClick={selectReference}
                    type="button"
                  />
                  <div className="mt-1.5 flex w-full items-center justify-between px-1 text-xs font-semibold text-foreground">
                    <span>Reference</span>
                    {isReferenceSelected && (
                      <span className="text-[10px] text-primary">Selected</span>
                    )}
                  </div>
                </div>
              )}
              {reviews.map((review) => {
                const isSelected =
                  historySelection.kind === "review" &&
                  historySelection.reviewId === review.id;
                const isLatest = review.id === latestReviewId;
                const isImageUnavailable =
                  review.imageDeletedAt !== null || !review.imageUrl;

                return (
                  <button
                    aria-current={isSelected ? "page" : undefined}
                    aria-label={`Open Round ${review.roundNumber}${
                      isLatest ? ", latest" : ""
                    }`}
                    className={`w-32 rounded-xl border bg-card p-1.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                      isSelected
                        ? "border-primary ring-2 ring-primary/30"
                        : "border-border hover:border-primary/50"
                    }`}
                    key={review.id}
                    onClick={() => selectReview(review.id)}
                    type="button"
                  >
                    <div className="flex h-20 items-center justify-center overflow-hidden rounded-lg bg-muted/30">
                      {isImageUnavailable ? (
                        <ImageIcon className="size-6 text-muted-foreground" />
                      ) : (
                        <img
                          alt={`Submitted proof for Round ${review.roundNumber}`}
                          className="h-full w-full object-cover"
                          src={review.imageUrl ?? undefined}
                        />
                      )}
                    </div>
                    <span className="mt-1.5 block px-1 text-xs font-semibold text-foreground">
                      Round {review.roundNumber}
                    </span>
                    <span className="flex min-h-4 items-center gap-1 px-1 text-[10px] text-muted-foreground">
                      {isLatest && (
                        <span className="rounded bg-primary/10 px-1 text-primary">
                          Latest
                        </span>
                      )}
                      {isSelected && <span className="text-primary">Selected</span>}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Header Banner */}
      <header className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-xs lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
              {isReferenceSelected
                ? "Research Reference"
                : `Design Review — Round ${selectedReview.roundNumber}`}
            </h1>
            <StatusBadge
              label={researchItem.status.replace(/_/g, " ")}
              tone={getStatusTone(researchItem.status)}
            />
            {!isReferenceSelected && !isLatestReview && (
              <Badge className="bg-muted text-muted-foreground" variant="secondary">
                Historical review
              </Badge>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
            <span className="font-medium text-foreground">
              {researchItem.title || `Item #${researchItem.etsyListingId}`}
            </span>
            <span>·</span>
            <a
              className={cn("inline-flex items-center gap-1", etsyExternalInlineClass)}
              href={researchItem.originalUrl}
              rel="noreferrer"
              target="_blank"
            >
              <span>Etsy Listing #{researchItem.etsyListingId}</span>
              <ExternalLink className="size-3" />
            </a>
            <span>·</span>
            <span className="inline-flex items-center gap-1">
              <User className="size-3.5" />
              {designerDisplayName}
            </span>
            {!isReferenceSelected && (
              <>
                <span>·</span>
                <span className="inline-flex items-center gap-1">
                  <Calendar className="size-3.5" />
                  Submitted {formatDetailTime(selectedReview.submittedAt)}
                </span>
              </>
            )}
            {!isReferenceSelected && selectedReview.approvedAt ? (
              <>
                <span>·</span>
                <span className="inline-flex items-center gap-1 font-medium text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="size-3.5" />
                  Approved {formatDetailTime(selectedReview.approvedAt)}
                </span>
              </>
            ) : null}
          </div>
        </div>

        <div className="shrink-0 rounded-lg border border-border/80 bg-muted/40 px-3 py-1.5 text-xs text-muted-foreground">
          {isReferenceSelected
            ? "Viewing reference image (read-only)"
            : reviewStateMessage}
        </div>
      </header>

      {/* Main Grid: Image Canvas (Left) + Feedback/Annotation Panel (Right) */}
      {isReferenceSelected ? (
        <div className="grid gap-6 lg:grid-cols-12">
          <main className="lg:col-span-7 xl:col-span-8">
            <section
              aria-label="Research reference image"
              className="rounded-2xl border border-border bg-card p-4 sm:p-6 shadow-xs"
            >
              <AuthenticatedReferenceImage
                alt="Research reference image"
                className="max-h-[720px] max-w-full object-contain"
                containerClassName="min-h-[380px]"
                hasImage
                onOpenImage={(imageUrl) => {
                  setReferencePreviewUrl(imageUrl);
                  setIsReferenceLightboxOpen(true);
                }}
                researchItemId={researchItem.id}
                workspaceId={workspaceId}
              />
            </section>
          </main>
          <aside className="lg:col-span-5 xl:col-span-4">
            <section className="rounded-2xl border border-border bg-card p-4 shadow-xs sm:p-6">
              <h2 className="text-sm font-semibold text-foreground">
                Reference image
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Use this original research image to compare the submitted design.
              </p>
              <p className="mt-4 text-xs text-muted-foreground">
                Read-only reference asset
              </p>
            </section>
          </aside>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-12">
          <main className="lg:col-span-7 xl:col-span-8">
            <section
              aria-label="Review submission image"
              className="min-h-[380px] rounded-2xl border border-border bg-card p-4 sm:p-6 shadow-xs"
            >
              <ReviewImageCanvas
                annotations={selectedReview.annotations}
                enableZoomControls
                imageDeletedAt={selectedReview.imageDeletedAt}
                imageUrl={selectedReview.imageUrl}
                isActionable={isActionable}
                key={selectedReview.id}
                onSelectAnnotation={setSelectedAnnotationId}
                researchItemId={researchItem.id}
                reviewId={selectedReview.id}
                roundNumber={selectedReview.roundNumber}
                hoveredAnnotationId={hoveredAnnotationId}
                onHoverAnnotation={setHoveredAnnotationId}
                selectedAnnotationId={selectedAnnotationId}
                workspaceId={workspaceId}
              />
            </section>
          </main>

          <aside className="lg:col-span-5 xl:col-span-4">
            <AnnotationPanel
              canReply={canReply}
              isActionable={isActionable}
              isLatestRound={isLatestReview}
              onSelectAnnotation={setSelectedAnnotationId}
              researchItemId={researchItem.id}
              researchItemStatus={researchItem.status}
              reviewId={selectedReview.id}
              hoveredAnnotationId={hoveredAnnotationId}
              onHoverAnnotation={setHoveredAnnotationId}
              selectedAnnotationId={selectedAnnotationId}
              selectedReview={selectedReview}
              workspaceId={workspaceId}
            />
            {isActionable ? (
              <div className="mt-4">
                <ReviewActions
                  annotationCount={selectedReview.annotations.length}
                  isActionable={isActionable}
                  researchItemId={researchItem.id}
                  reviewId={selectedReview.id}
                  roundNumber={selectedReview.roundNumber}
                  workspaceId={workspaceId}
                />
              </div>
            ) : null}
          </aside>
        </div>
      )}
      <DesignPreviewLightbox
        imageUrl={referencePreviewUrl}
        onOpenChange={setIsReferenceLightboxOpen}
        open={isReferenceLightboxOpen}
        title="Research reference image"
      />
    </div>
  );
}
