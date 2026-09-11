"use client";

import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  ExternalLink,
  History,
  ShieldAlert,
  User,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import type { ResearchStatus } from "@/features/research/research.types";
import { useWorkspaces } from "@/features/workspace/use-workspaces";

import { AnnotationPanel } from "./annotation-panel";
import { ReviewActions } from "./review-actions";
import { canUserReplyToAnnotation } from "./reviews.constants";
import { ReviewImageCanvas } from "./review-image-canvas";
import { useReviewDetail } from "./use-reviews";

type ReviewDetailViewProps = {
  reviewId: string;
  workspaceId: string;
};

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

function AccessDenied() {
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
          Admin access required
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Only workspace Admins can access and review designer submissions.
        </p>
      </section>
    </main>
  );
}

function DetailLoadingState() {
  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
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

  const detailQuery = useReviewDetail(workspaceId, reviewId, isAdmin);
  const [selectedAnnotationId, setSelectedAnnotationId] = useState<
    string | null
  >(null);

  if (workspacesQuery.isLoading) {
    return <DetailLoadingState />;
  }

  if (!isAdmin) {
    return <AccessDenied />;
  }

  if (detailQuery.isLoading) {
    return <DetailLoadingState />;
  }

  if (detailQuery.isError || !detailQuery.data) {
    return <DetailErrorState onRetry={() => void detailQuery.refetch()} />;
  }

  const {
    currentDesigner,
    latestReviewId,
    researchItem,
    reviews,
    selectedReview,
  } = detailQuery.data.data;

  const isLatestReview = selectedReview.id === latestReviewId;
  const isActionable =
    researchItem.status === "DESIGN_REVIEW" && isLatestReview;
  const canReply = canUserReplyToAnnotation({
    hasAdminRole: isAdmin,
    itemStatus: researchItem.status,
    isLatestReviewRound: isLatestReview,
  });

  const designerDisplayName =
    currentDesigner?.name || currentDesigner?.email || "Unassigned";

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Top Back Navigation Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Button
          nativeButton={false}
          render={<Link href={`/w/${workspaceId}/reviews`} />}
          size="sm"
          variant="ghost"
        >
          <ArrowLeft className="size-4" />
          <span>Back to Reviews</span>
        </Button>

        {/* Round History Selector */}
        {reviews.length > 1 && (
          <div
            aria-label="Previous rounds"
            className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card p-1.5 shadow-xs"
          >
            <span className="flex items-center gap-1.5 px-2 text-xs font-semibold text-muted-foreground">
              <History className="size-3.5" />
              Rounds:
            </span>
            {reviews.map((r) => {
              const isCurrentRound = r.id === selectedReview.id;
              const isLatestRound = r.id === latestReviewId;

              return (
                <Button
                  className={isCurrentRound ? "shadow-xs" : ""}
                  key={r.id}
                  onClick={() => {
                    if (!isCurrentRound) {
                      router.push(`/w/${workspaceId}/reviews/${r.id}`);
                    }
                  }}
                  size="xs"
                  type="button"
                  variant={isCurrentRound ? "default" : "outline"}
                >
                  <span>Round {r.roundNumber}</span>
                  {isLatestRound && (
                    <span
                      className={`ml-1 text-[10px] uppercase font-bold tracking-wider ${
                        isCurrentRound
                          ? "text-primary-foreground/80"
                          : "text-muted-foreground"
                      }`}
                    >
                      (Latest)
                    </span>
                  )}
                </Button>
              );
            })}
          </div>
        )}
      </div>

      {/* Header Banner */}
      <header className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-xs lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
              Design Review — Round {selectedReview.roundNumber}
            </h1>
            <StatusBadge
              label={researchItem.status.replace(/_/g, " ")}
              tone={getStatusTone(researchItem.status)}
            />
            {!isLatestReview && (
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
              className="inline-flex items-center gap-1 text-primary hover:underline"
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
            <span>·</span>
            <span className="inline-flex items-center gap-1">
              <Calendar className="size-3.5" />
              Submitted {formatDetailTime(selectedReview.submittedAt)}
            </span>
          </div>
        </div>

        {/* Action Controls for latest review in DESIGN_REVIEW */}
        <div className="shrink-0">
          {isActionable ? (
            <ReviewActions
              isActionable={isActionable}
              researchItemId={researchItem.id}
              reviewId={selectedReview.id}
              roundNumber={selectedReview.roundNumber}
              workspaceId={workspaceId}
            />
          ) : (
            <div className="rounded-lg border border-border/80 bg-muted/40 px-3 py-1.5 text-xs text-muted-foreground">
              {!isLatestReview
                ? "Viewing historical round (read-only)"
                : `Item status is ${researchItem.status} (read-only)`}
            </div>
          )}
        </div>
      </header>

      {/* Main Grid: Image Canvas (Left) + Feedback/Annotation Panel (Right) */}
      <div className="grid gap-6 lg:grid-cols-12">
        <main className="lg:col-span-7 xl:col-span-8">
          <section
            aria-label="Review submission image"
            className="rounded-2xl border border-border bg-card p-4 sm:p-6 shadow-xs"
          >
            <ReviewImageCanvas
              annotations={selectedReview.annotations}
              imageDeletedAt={selectedReview.imageDeletedAt}
              imageUrl={selectedReview.imageUrl}
              isActionable={isActionable}
              onSelectAnnotation={setSelectedAnnotationId}
              researchItemId={researchItem.id}
              reviewId={selectedReview.id}
              roundNumber={selectedReview.roundNumber}
              selectedAnnotationId={selectedAnnotationId}
              workspaceId={workspaceId}
            />
          </section>
        </main>

        <aside className="lg:col-span-5 xl:col-span-4">
          <AnnotationPanel
            canReply={canReply}
            isActionable={isActionable}
            onSelectAnnotation={setSelectedAnnotationId}
            researchItemId={researchItem.id}
            reviewId={selectedReview.id}
            selectedAnnotationId={selectedAnnotationId}
            selectedReview={selectedReview}
            workspaceId={workspaceId}
          />
        </aside>
      </div>
    </div>
  );
}
