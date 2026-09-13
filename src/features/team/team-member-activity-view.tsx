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

type MetricCardProps = {
  isCurrentSnapshot?: boolean;
  label: string;
  value: number;
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

function MetricCard({ isCurrentSnapshot = false, label, value }: MetricCardProps) {
  return (
    <article className="rounded-xl border border-border bg-card p-4 shadow-xs">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
        {value.toLocaleString()}
      </p>
      {isCurrentSnapshot ? (
        <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
          <Clock3 className="size-3" />
          Current-state snapshot
        </p>
      ) : null}
    </article>
  );
}

function MetricSection({
  children,
  title,
}: {
  children: React.ReactNode;
  title: string;
}) {
  return (
    <section aria-label={`${title} metrics`} className="space-y-3">
      <h2 className="text-base font-semibold text-foreground">{title}</h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {children}
      </div>
    </section>
  );
}

function ActivitySkeleton() {
  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6 lg:p-8" role="status">
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

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6 lg:p-8">
      <Button
        nativeButton={false}
        render={<Link href={`/w/${workspaceId}/team`} />}
        size="sm"
        variant="ghost"
      >
        <ArrowLeft className="size-3.5" />
        Back to Team
      </Button>

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

      <DateFilter
        context="activity"
        currentFilter={filter}
        resolvedRange={dateRange}
      />

      <div className="space-y-6">
        {summary.research ? (
          <MetricSection title="Research">
            <MetricCard label="Total Created" value={summary.research.totalCreated} />
          </MetricSection>
        ) : null}

        {summary.design ? (
          <MetricSection title="Designer">
            <MetricCard label="Assigned" value={summary.design.assignedCount} />
            <MetricCard
              isCurrentSnapshot
              label="In Progress Now"
              value={summary.design.currentInProgress}
            />
            <MetricCard label="Submitted" value={summary.design.submittedCount} />
            <MetricCard label="Approved" value={summary.design.approvedCount} />
            <MetricCard label="Corrections" value={summary.design.correctionsCount} />
            <MetricCard label="Completed" value={summary.design.completedCount} />
          </MetricSection>
        ) : null}

        {summary.listing ? (
          <MetricSection title="Lister">
            <MetricCard label="Assigned" value={summary.listing.assignedCount} />
            <MetricCard
              isCurrentSnapshot
              label="In Progress Now"
              value={summary.listing.currentInProgress}
            />
            <MetricCard label="Listed" value={summary.listing.listedCount} />
          </MetricSection>
        ) : null}
      </div>

      <section aria-labelledby="recent-items-heading" className="space-y-3">
        <div>
          <h2 className="text-base font-semibold text-foreground" id="recent-items-heading">
            Recent Items
          </h2>
          <p className="text-xs text-muted-foreground">
            Current workspace items involving this member.
          </p>
        </div>

        {recentItems.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card p-6 text-center text-sm text-muted-foreground">
            No recent items.
          </div>
        ) : (
          <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
            {recentItems.map((item) => (
              <li className="space-y-3 p-4 sm:flex sm:items-center sm:justify-between sm:gap-4 sm:space-y-0" key={item.id}>
                <div className="min-w-0">
                  <p className="truncate font-medium text-foreground">
                    {item.title ?? "Untitled research item"}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {item.activityRole.charAt(0) + item.activityRole.slice(1).toLowerCase()} role · Updated {formatUpdatedAt(item.updatedAt)}
                  </p>
                </div>
                <StatusBadge
                  label={item.status.replaceAll("_", " ")}
                  tone={getStatusTone(item.status)}
                />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
