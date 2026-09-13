"use client";

import Link from "next/link";
import { AlertCircle, ArrowLeft, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { ReportIssueDialog } from "@/features/designer-work/report-issue-dialog";
import { getDesignerWorkStatusMeta } from "@/features/designer-work/designer-work.types";
import type { ReportIssueFormValues } from "@/features/designer-work/designer-work.types";
import { useWorkspaces } from "@/features/workspace/use-workspaces";
import { ApiError } from "@/lib/api";

import { canUserReplyToAnnotation } from "@/features/reviews/reviews.constants";

import { DesignReferencePanel } from "./design-reference-panel";
import { DesignStatusPanel } from "./design-status-panel";
import { DesignerCorrectionFeedback } from "./designer-correction-feedback";
import { useDesignActions, useDesignDetail } from "./use-design-workspace";

type DesignWorkspaceViewProps = { researchItemId: string; workspaceId: string };

export function DesignWorkspaceView({
  researchItemId,
  workspaceId,
}: DesignWorkspaceViewProps) {
  const workspacesQuery = useWorkspaces();
  const workspace = workspacesQuery.data?.data.workspaces.find(
    (item) => item.id === workspaceId,
  );
  const hasDesignerRole =
    workspace?.membership.roles.includes("DESIGNER") ?? false;
  const detailQuery = useDesignDetail(
    workspaceId,
    researchItemId,
    hasDesignerRole,
  );
  const actions = useDesignActions(workspaceId, researchItemId);
  const [isIssueDialogOpen, setIsIssueDialogOpen] = useState(false);
  const [selectedAnnotationId, setSelectedAnnotationId] = useState<
    string | null
  >(null);

  if (workspacesQuery.isLoading || (hasDesignerRole && detailQuery.isLoading)) {
    return <LoadingState />;
  }
  if (!hasDesignerRole) {
    return <AccessDeniedState workspaceId={workspaceId} />;
  }
  if (detailQuery.isError) {
    return (
      <DetailErrorState
        error={detailQuery.error}
        onRetry={() => void detailQuery.refetch()}
        workspaceId={workspaceId}
      />
    );
  }
  if (!detailQuery.data) return <LoadingState />;

  const detail = detailQuery.data.data;
  const statusMeta = getDesignerWorkStatusMeta(detail.researchItem.status);
  const title =
    detail.researchItem.title ||
    `Etsy Listing #${detail.researchItem.etsyListingId}`;

  const hasCorrectionFeedback = Boolean(
    detail.latestReview &&
      (detail.latestReview.annotations.length > 0 ||
        detail.latestReview.note) &&
      (detail.researchItem.status === "CORRECTION_NEEDED" ||
        detail.researchItem.status === "DESIGN_IN_PROGRESS" ||
        detail.researchItem.status === "DESIGN_REVIEW"),
  );

  const canReply = canUserReplyToAnnotation({
    hasDesignerRole,
    isAssignedDesigner: detail.assignment.isCurrent,
    itemStatus: detail.researchItem.status,
    isLatestReviewRound: true,
  });

  const runAction = async (
    action: () => Promise<unknown>,
    successMessage: string,
  ) => {
    try {
      await action();
      toast.success(successMessage);
    } catch (error) {
      toast.error(actionErrorMessage(error));
      if (error instanceof ApiError && error.status === 409) {
        void detailQuery.refetch();
      }
    }
  };

  return (
    <main className="mx-auto max-w-screen-2xl space-y-5 p-4 sm:p-6 lg:p-8">
      {/* Page Header */}
      <header className="space-y-4 border-b border-border pb-5">
        <Button
          nativeButton={false}
          render={<Link href={`/w/${workspaceId}/my-work`} />}
          size="sm"
          variant="ghost"
        >
          <ArrowLeft className="size-4" />
          <span>Back to My Work</span>
        </Button>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <h1 className="break-words text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {title}
            </h1>
            <p className="mt-1 font-mono text-xs text-muted-foreground">
              Etsy #{detail.researchItem.etsyListingId}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge label={statusMeta.label} tone={statusMeta.tone} />
            {detail.latestReview && (
              <Button
                nativeButton={false}
                render={
                  <Link
                    href={`/w/${workspaceId}/reviews/${detail.latestReview.id}`}
                  />
                }
                size="sm"
                variant="outline"
              >
                View Review History
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Main 2-Column Workspace Grid */}
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(22rem,0.85fr)] lg:items-stretch">
        {/* Left Column: Reference Panel (~58%) */}
        <DesignReferencePanel detail={detail} workspaceId={workspaceId} />

        {/* Right Column: Your Work Panel (~42%) */}
        <div className="min-w-0 flex flex-col">
          <DesignStatusPanel
            detail={detail}
            isCompleting={actions.completeWork.isPending}
            isStartingCorrection={actions.startCorrection.isPending}
            isStartingWork={actions.startWork.isPending}
            isSubmittingFinalAssets={actions.submitFinalAssets.isPending}
            isSubmittingReview={actions.submitReview.isPending}
            onComplete={() =>
              void runAction(
                () => actions.completeWork.mutateAsync(),
                "Design work completed.",
              )
            }
            onOpenIssueDialog={() => setIsIssueDialogOpen(true)}
            onStartCorrection={() =>
              void runAction(
                () => actions.startCorrection.mutateAsync(),
                "Correction work started.",
              )
            }
            onStartWork={() =>
              void runAction(
                () => actions.startWork.mutateAsync(),
                "Design work started.",
              )
            }
            onSubmitFinalAssets={(files) =>
              void runAction(
                () => actions.submitFinalAssets.mutateAsync(files),
                "Final files uploaded.",
              )
            }
            onSubmitReview={(image, note) =>
              void runAction(
                () => actions.submitReview.mutateAsync({ image, note }),
                "Design uploaded for review.",
              )
            }
            workspaceId={workspaceId}
          />
        </div>
      </div>

      {/* Detailed Correction Feedback & Annotation Canvas (Placed below main workspace to avoid displacing primary working area) */}
      {hasCorrectionFeedback && (
        <section id="correction-feedback-section">
          <DesignerCorrectionFeedback
            canReply={canReply}
            detail={detail}
            onSelectAnnotation={setSelectedAnnotationId}
            selectedAnnotationId={selectedAnnotationId}
            workspaceId={workspaceId}
          />
        </section>
      )}

      {/* Report Issue Dialog */}
      <ReportIssueDialog
        isSubmitting={actions.reportIssue.isPending}
        onOpenChange={setIsIssueDialogOpen}
        onSubmit={(values) =>
          void handleReportIssue(actions, values, detailQuery, () =>
            setIsIssueDialogOpen(false),
          )
        }
        open={isIssueDialogOpen}
        workTitle={title}
      />
    </main>
  );
}

async function handleReportIssue(
  actions: ReturnType<typeof useDesignActions>,
  values: ReportIssueFormValues,
  detailQuery: ReturnType<typeof useDesignDetail>,
  closeDialog: () => void,
) {
  try {
    await actions.reportIssue.mutateAsync(values);
    toast.success("Design issue reported. Waiting for Admin action.");
    closeDialog();
  } catch (error) {
    toast.error(actionErrorMessage(error));
    if (error instanceof ApiError && error.status === 409) {
      void detailQuery.refetch();
    }
  }
}

function actionErrorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "The action could not be completed.";
}

function LoadingState() {
  return (
    <main
      className="flex min-h-80 items-center justify-center p-6"
      role="status"
    >
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-5 animate-spin" />
        Loading design workspace…
      </div>
    </main>
  );
}

function AccessDeniedState({ workspaceId }: { workspaceId: string }) {
  return (
    <main className="mx-auto max-w-lg p-6">
      <section className="rounded-xl border border-destructive/20 bg-card p-6 text-center">
        <AlertCircle className="mx-auto size-8 text-destructive" />
        <h1 className="mt-3 text-xl font-semibold">
          Designer access required
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          This workspace is available only to members with the explicit Designer
          role.
        </p>
        <Button
          className="mt-4"
          nativeButton={false}
          render={<Link href={`/w/${workspaceId}`} />}
          variant="outline"
        >
          Back to Workspace
        </Button>
      </section>
    </main>
  );
}

function DetailErrorState({
  error,
  onRetry,
  workspaceId,
}: {
  error: unknown;
  onRetry: () => void;
  workspaceId: string;
}) {
  const status = error instanceof ApiError ? error.status : 0;
  const title =
    status === 403
      ? "You cannot access this design work"
      : status === 404
        ? "Design work not found"
        : status === 401
          ? "Your session has expired"
          : "Unable to load design work";
  const message =
    status === 403
      ? "Only the currently assigned Designer can open this workspace."
      : status === 404
        ? "This work item may no longer be available."
        : error instanceof Error
          ? error.message
          : "Check your connection and try again.";
  return (
    <main className="mx-auto max-w-lg p-6">
      <section className="rounded-xl border border-border bg-card p-6 text-center">
        <AlertCircle className="mx-auto size-8 text-destructive" />
        <h1 className="mt-3 text-xl font-semibold">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{message}</p>
        <div className="mt-4 flex justify-center gap-2">
          <Button onClick={onRetry} type="button" variant="outline">
            Retry
          </Button>
          <Button
            nativeButton={false}
            render={<Link href={`/w/${workspaceId}/my-work`} />}
            variant="outline"
          >
            Back to My Work
          </Button>
        </div>
      </section>
    </main>
  );
}
