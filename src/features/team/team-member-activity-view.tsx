"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  CalendarDays,
  Clock3,
  RefreshCw,
  UserRound,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { ApiError } from "@/lib/api";
import {
  DateFilter,
  parseFilterFromParams,
} from "@/features/dashboard/date-filter";
import type { UserActivityRecentItem } from "@/features/dashboard/dashboard.types";
import { useUserActivity } from "@/features/dashboard/use-dashboard";

const ROLE_LABELS = {
  ADMIN: "Admin",
  DESIGNER: "Designer",
  LISTER: "Lister",
  RESEARCHER: "Researcher",
} as const;

type TeamMemberActivityViewProps = {
  userId: string;
  workspaceId: string;
};

type PrimaryMetricCardProps = {
  isCurrentSnapshot?: boolean;
  label: string;
  value: number;
};

type SecondaryMetricCardProps = {
  label: string;
  value: number;
};

type MetricSectionProps = {
  children: React.ReactNode;
  secondary?: React.ReactNode;
  title: string;
};

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return "Unavailable";

  return new Intl.DateTimeFormat(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatUpdatedAt(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return "Unavailable";

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function getStatusTone(status: UserActivityRecentItem["status"]) {
  switch (status) {
    case "CORRECTION_NEEDED":
      return "warning" as const;
    case "ISSUE_REPORTED":
      return "danger" as const;
    case "DESIGN_APPROVED":
    case "LISTED":
      return "success" as const;
    case "DESIGN_IN_PROGRESS":
    case "DESIGN_REVIEW":
    case "READY_FOR_LISTING":
    case "LISTING_IN_PROGRESS":
      return "info" as const;
    default:
      return "neutral" as const;
  }
}

function formatStatusLabel(status: string): string {
  switch (status) {
    case "DESIGN_IN_PROGRESS":
      return "Design In Progress";
    case "READY_FOR_LISTING":
      return "Ready for Listing";
    case "LISTING_IN_PROGRESS":
      return "Listing In Progress";
    case "DESIGN_APPROVED":
      return "Design Approved";
    case "CORRECTION_NEEDED":
      return "Correction Needed";
    case "ISSUE_REPORTED":
      return "Issue Reported";
    case "DESIGN_REVIEW":
      return "Design Review";
    case "RESEARCHED":
      return "Researched";
    case "ASSIGNED":
      return "Assigned";
    case "LISTED":
      return "Listed";
    default:
      return status
        .split("_")
        .map((word, index) =>
          index > 0 && word.toLowerCase() === "for"
            ? "for"
            : word.charAt(0) + word.slice(1).toLowerCase(),
        )
        .join(" ");
  }
}

function PrimaryMetricCard({
  isCurrentSnapshot = false,
  label,
  value,
}: PrimaryMetricCardProps) {
  return (
    <article className="flex flex-col justify-between rounded-xl border border-border bg-card p-4 shadow-xs">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        {isCurrentSnapshot ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
            <Clock3 className="size-3 text-muted-foreground" />
            Snapshot
          </span>
        ) : null}
      </div>
      <p className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
        {value.toLocaleString()}
      </p>
    </article>
  );
}

function SecondaryMetricCard({ label, value }: SecondaryMetricCardProps) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border/70 bg-muted/30 px-3.5 py-2.5">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <span className="text-sm font-semibold text-foreground sm:text-base">
        {value.toLocaleString()}
      </span>
    </div>
  );
}

function MetricSection({ children, secondary, title }: MetricSectionProps) {
  return (
    <section
      aria-label={`${title} metrics`}
      className="space-y-3 rounded-xl border border-border bg-card/50 p-4 shadow-xs sm:p-5"
    >
      <h3 className="text-sm font-semibold tracking-tight text-foreground sm:text-base">
        {title}
      </h3>
      {children}
      {secondary ? (
        <div className="space-y-2 pt-1">
          <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Supporting Metrics
          </p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            {secondary}
          </div>
        </div>
      ) : null}
    </section>
  );
}

function ActivitySkeleton() {
  return (
    <div className="mx-auto max-w-screen-2xl space-y-6 p-4 sm:p-6 lg:p-8" role="status">
      <span className="sr-only">Loading member activity</span>
      <div className="h-7 w-32 animate-pulse rounded bg-muted" />
      <div className="h-36 animate-pulse rounded-2xl bg-muted/60" />
      <div className="h-28 animate-pulse rounded-xl bg-muted/50" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div className="h-28 animate-pulse rounded-xl bg-muted/50" key={index} />
        ))}
      </div>
      <div className="h-52 animate-pulse rounded-xl bg-muted/50" />
    </div>
  );
}

function ActivityErrorState({
  error,
  onRetry,
}: {
  error: unknown;
  onRetry: () => void;
}) {
  const isMissingMember = error instanceof ApiError && error.status === 404;

  return (
    <div className="mx-auto max-w-lg p-6">
      <section
        className="rounded-2xl border border-destructive/30 bg-destructive/5 p-8 text-center"
        role="alert"
      >
        <AlertTriangle className="mx-auto size-8 text-destructive" />
        <h1 className="mt-3 text-base font-semibold text-foreground">
          {isMissingMember ? "Member not found" : "Unable to load member activity"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {isMissingMember
            ? "This member is not part of the selected workspace."
            : error instanceof Error
              ? error.message
              : "Please try again."}
        </p>
        <Button className="mt-4" onClick={onRetry} type="button" variant="outline">
          <RefreshCw className="size-3.5" />
          Try again
        </Button>
      </section>
    </div>
  );
}

export function TeamMemberActivityView({
  userId,
  workspaceId,
}: TeamMemberActivityViewProps) {
  const searchParams = useSearchParams();
  const filter = parseFilterFromParams(searchParams);
  const activityQuery = useUserActivity(workspaceId, userId, filter);

  if (activityQuery.isLoading) {
    return <ActivitySkeleton />;
  }

  if (activityQuery.isError || !activityQuery.data) {
    return (
      <ActivityErrorState
        error={activityQuery.error}
        onRetry={() => void activityQuery.refetch()}
      />
    );
  }

  const { dateRange, recentItems, summary, user } = activityQuery.data.data;
  const displayName = user.name || user.email;

  const hasAnySummaryGroup =
    summary.research !== null ||
    summary.design !== null ||
    summary.listing !== null;

  const totalPeriodActivity =
    (summary.research?.totalCreated ?? 0) +
    (summary.design
      ? summary.design.assignedCount +
        summary.design.currentInProgress +
        summary.design.submittedCount +
        summary.design.approvedCount +
        summary.design.correctionsCount +
        summary.design.completedCount
      : 0) +
    (summary.listing
      ? summary.listing.assignedCount +
        summary.listing.currentInProgress +
        summary.listing.listedCount
      : 0);

  const hasMetrics = hasAnySummaryGroup && totalPeriodActivity > 0;

  return (
    <div className="mx-auto max-w-screen-2xl space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Back Navigation */}
      <Button
        nativeButton={false}
        render={<Link href={`/w/${workspaceId}/team`} />}
        size="sm"
        variant="ghost"
      >
        <ArrowLeft className="size-3.5" />
        Back to Team
      </Button>

      {/* 1. Member Header */}
      <header className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 shadow-xs sm:p-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <UserRound className="size-5 text-primary" />
            <h1 className="truncate text-xl font-bold tracking-tight text-foreground sm:text-2xl">
              {displayName}
            </h1>
          </div>
          <p className="mt-1 break-all text-sm text-muted-foreground">{user.email}</p>
          <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
            <CalendarDays className="size-3.5" />
            Joined {formatDate(user.joinedAt)}
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5 lg:justify-end">
          {user.roles.map((role) => (
            <Badge className="font-mono text-[11px]" key={role} variant="secondary">
              {ROLE_LABELS[role]}
            </Badge>
          ))}
        </div>
      </header>

      {/* 2. Period Filter */}
      <DateFilter
        context="activity"
        currentFilter={filter}
        resolvedRange={dateRange}
      />

      {/* 3. Role-Relevant Summary Metrics */}
      <section aria-labelledby="summary-metrics-heading" className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-foreground" id="summary-metrics-heading">
            Performance Summary
          </h2>
        </div>

        {!hasMetrics ? (
          <div className="rounded-xl border border-dashed border-border bg-card p-6 text-center text-sm text-muted-foreground">
            No activity in this period.
          </div>
        ) : (
          <div className="space-y-5">
            {summary.research ? (
              <MetricSection title="Research">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <PrimaryMetricCard
                    label="Research Created"
                    value={summary.research.totalCreated}
                  />
                </div>
              </MetricSection>
            ) : null}

            {summary.design ? (
              <MetricSection
                secondary={
                  <>
                    <SecondaryMetricCard
                      label="Assigned"
                      value={summary.design.assignedCount}
                    />
                    <SecondaryMetricCard
                      label="Submitted"
                      value={summary.design.submittedCount}
                    />
                    <SecondaryMetricCard
                      label="Corrections"
                      value={summary.design.correctionsCount}
                    />
                  </>
                }
                title="Design"
              >
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <PrimaryMetricCard
                    isCurrentSnapshot
                    label="In Progress"
                    value={summary.design.currentInProgress}
                  />
                  <PrimaryMetricCard
                    label="Completed"
                    value={summary.design.completedCount}
                  />
                  <PrimaryMetricCard
                    label="Approved"
                    value={summary.design.approvedCount}
                  />
                </div>
              </MetricSection>
            ) : null}

            {summary.listing ? (
              <MetricSection
                secondary={
                  <SecondaryMetricCard
                    label="Assigned"
                    value={summary.listing.assignedCount}
                  />
                }
                title="Listing"
              >
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <PrimaryMetricCard
                    isCurrentSnapshot
                    label="In Progress"
                    value={summary.listing.currentInProgress}
                  />
                  <PrimaryMetricCard
                    label="Listed"
                    value={summary.listing.listedCount}
                  />
                </div>
              </MetricSection>
            ) : null}
          </div>
        )}
      </section>

      {/* 4. Recent Work / Items */}
      <section aria-labelledby="recent-items-heading" className="space-y-3">
        <div>
          <h2 className="text-base font-semibold text-foreground" id="recent-items-heading">
            Recent Items
          </h2>
          <p className="text-xs text-muted-foreground">
            Recent workspace items involving this member.
          </p>
        </div>

        {recentItems.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card p-6 text-center text-sm text-muted-foreground">
            No recent work found.
          </div>
        ) : (
          <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card shadow-xs">
            {recentItems.map((item) => {
              const displayTitle = item.title ?? "Untitled research item";
              const roleLabel = ROLE_LABELS[item.activityRole] ?? item.activityRole;

              return (
                <li
                  className="flex flex-col gap-2.5 p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
                  key={item.id}
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">
                      {displayTitle}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {roleLabel} · {formatUpdatedAt(item.activityAt)}
                    </p>
                  </div>
                  <div className="shrink-0 self-start sm:self-center">
                    <StatusBadge
                      label={formatStatusLabel(item.status)}
                      tone={getStatusTone(item.status)}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
