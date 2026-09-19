"use client";

import { AlertTriangle, ArrowRight, ExternalLink, Eye, User } from "lucide-react";

import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { AuthenticatedReferenceImage } from "@/features/research/authenticated-reference-image";
import { getIssueReasonLabel } from "@/features/research/issue-reasons";
import { etsyExternalInlineClass } from "@/lib/etsy-styles";
import { cn } from "@/lib/utils";

import type { ActiveIssue } from "./issues.types";

type IssueListProps = {
  canReassign: (issue: ActiveIssue) => boolean;
  designersLoading: boolean;
  issues: ActiveIssue[];
  onOpenIssue: (issue: ActiveIssue) => void;
  onReassignIssue: (issue: ActiveIssue) => void;
  workspaceId: string;
};

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function displayName(name: string | null, email: string): string {
  return name || email;
}

export function IssueList({
  canReassign,
  designersLoading,
  issues,
  onOpenIssue,
  onReassignIssue,
  workspaceId,
}: IssueListProps) {
  if (issues.length === 0) {
    return (
      <section className="rounded-xl border border-dashed border-border bg-card px-6 py-14 text-center shadow-xs">
        <div className="mx-auto flex size-11 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
          <AlertTriangle className="size-5" />
        </div>
        <h2 className="mt-4 text-base font-semibold">No active design issues.</h2>
        <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
          Designer-reported issues will appear here when Admin action is required.
        </p>
      </section>
    );
  }

  return (
    <div className="grid gap-4">
      {issues.map((issue) => {
        const issueReport = issue.latestIssueReport;
        const alternateDesignerAvailable = canReassign(issue);

        return (
          <article
            className="overflow-hidden rounded-xl border border-border bg-card shadow-xs"
            key={issue.id}
          >
            <div className="grid gap-4 p-4 md:grid-cols-[9rem_minmax(0,1fr)] md:p-5">
              <div className="overflow-hidden rounded-lg border border-border bg-muted/30">
                <AuthenticatedReferenceImage
                  alt={issue.title || `Reference for Etsy listing ${issue.etsyListingId}`}
                  className="max-h-28"
                  containerClassName="h-28"
                  hasImage={Boolean(issue.referenceImageUrl)}
                  minHeightClassName="min-h-0"
                  researchItemId={issue.id}
                  workspaceId={workspaceId}
                />
              </div>

              <div className="min-w-0 space-y-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge label="Issue reported" tone="danger" />
                      <span className="font-mono text-xs text-muted-foreground">
                        #{issue.etsyListingId}
                      </span>
                    </div>
                    <h2 className="mt-2 truncate text-base font-semibold text-foreground">
                      {issue.title || `Etsy Listing #${issue.etsyListingId}`}
                    </h2>
                    <a
                      className={cn("mt-1 inline-flex items-center gap-1 text-xs transition-colors", etsyExternalInlineClass)}
                      href={issue.normalizedUrl}
                      rel="noreferrer"
                      target="_blank"
                    >
                      View on Etsy <ExternalLink className="size-3" />
                    </a>
                  </div>

                  <div className="flex shrink-0 flex-wrap gap-2">
                    <Button
                      onClick={() => onOpenIssue(issue)}
                      size="sm"
                      type="button"
                      variant="outline"
                    >
                      <Eye className="size-3.5" />
                      Open
                    </Button>
                    <Button
                      disabled={designersLoading || !alternateDesignerAvailable}
                      onClick={() => onReassignIssue(issue)}
                      size="sm"
                      type="button"
                    >
                      <ArrowRight className="size-3.5" />
                      Reassign
                    </Button>
                  </div>
                </div>

                <section className="rounded-lg border border-destructive/20 bg-destructive/5 p-3">
                  <p className="text-xs font-semibold text-destructive">
                    {getIssueReasonLabel(issueReport.reason)}
                  </p>
                  <p className="mt-1 whitespace-pre-wrap break-words text-sm text-foreground">
                    {issueReport.details || "No additional details were provided."}
                  </p>
                </section>

                <dl className="grid gap-x-5 gap-y-3 text-xs sm:grid-cols-2 xl:grid-cols-4">
                  <div className="min-w-0">
                    <dt className="text-muted-foreground">Reported by</dt>
                    <dd className="mt-0.5 truncate font-medium text-foreground">
                      {displayName(issueReport.reportedBy.name, issueReport.reportedBy.email)}
                    </dd>
                    <dd className="truncate text-muted-foreground">{issueReport.reportedBy.email}</dd>
                  </div>
                  <div className="min-w-0">
                    <dt className="text-muted-foreground">Reported at</dt>
                    <dd className="mt-0.5 font-medium text-foreground">{formatDateTime(issueReport.createdAt)}</dd>
                  </div>
                  <div className="min-w-0">
                    <dt className="flex items-center gap-1 text-muted-foreground"><User className="size-3" />Current Designer</dt>
                    <dd className="mt-0.5 truncate font-medium text-foreground">
                      {issue.currentDesigner
                        ? displayName(issue.currentDesigner.name, issue.currentDesigner.email)
                        : "Unassigned"}
                    </dd>
                  </div>
                  <div className="min-w-0">
                    <dt className="text-muted-foreground">Researcher</dt>
                    <dd className="mt-0.5 truncate font-medium text-foreground">
                      {displayName(issue.createdBy.name, issue.createdBy.email)}
                    </dd>
                  </div>
                </dl>

                {!designersLoading && !alternateDesignerAvailable && (
                  <p className="text-xs text-muted-foreground">
                    No alternate Designer is available for reassignment.
                  </p>
                )}
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
