"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  CalendarDays,
  ChevronDown,
  Clock3,
  Palette,
  RefreshCw,
  Search,
  Tag,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { UserAvatar } from "@/components/ui/user-avatar";
import { ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";
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

type CollapsibleMetricSectionProps = {
  children: React.ReactNode;
  icon: React.ComponentType<{ className?: string }>;
  id: string;
  isExpanded: boolean;
  isHistoricalOnly?: boolean;
  onToggle: () => void;
  roleLabel?: string;
  secondary?: React.ReactNode;
  summaryLabel?: string;
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
  const isZero = value === 0;

  return (
    <div className="flex flex-col justify-between rounded-lg border border-border/70 bg-card p-4 shadow-2xs transition-colors hover:border-border">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        {isCurrentSnapshot ? (
          <span className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-muted px-2 py-0.5 text-[10px] font-medium text-foreground">
            <Clock3 className="size-3 text-primary" />
            Live Snapshot
          </span>
        ) : null}
      </div>
      <p
        className={cn(
          "mt-3 text-2xl font-bold tracking-tight sm:text-3xl",
          isZero ? "text-muted-foreground/75" : "text-foreground",
        )}
      >
        {value.toLocaleString()}
      </p>
    </div>
  );
}

function SecondaryMetricCard({ label, value }: SecondaryMetricCardProps) {
  const isZero = value === 0;

  return (
    <div className="flex items-center justify-between rounded-md border border-border/60 bg-muted/25 px-3 py-2 text-xs">
      <span className="font-medium text-muted-foreground">{label}</span>
      <span
        className={cn(
          "font-semibold text-sm",
          isZero ? "text-muted-foreground" : "text-foreground",
        )}
      >
        {value.toLocaleString()}
      </span>
    </div>
  );
}

function CollapsibleMetricSection({
  children,
  icon: Icon,
  id,
  isExpanded,
  isHistoricalOnly = false,
  onToggle,
  roleLabel,
  secondary,
  summaryLabel,
  title,
}: CollapsibleMetricSectionProps) {
  return (
    <section
      aria-label={`${title} metrics`}
      className="rounded-xl border border-border bg-card/60 shadow-xs"
    >
      <button
        aria-controls={`section-content-${id}`}
        aria-expanded={isExpanded}
        className="flex w-full items-center justify-between gap-3 p-4 text-left transition-colors hover:bg-muted/30 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring sm:px-5"
        id={`section-header-${id}`}
        onClick={onToggle}
        type="button"
      >
        <div className="flex min-w-0 items-center gap-2.5">
          <Icon className="size-4 shrink-0 text-primary" />
          <h3 className="text-sm font-semibold tracking-tight text-foreground sm:text-base">
            {title}
          </h3>
          {roleLabel ? (
            <Badge className="font-mono text-[10px]" variant="secondary">
              {roleLabel}
            </Badge>
          ) : null}
          {isHistoricalOnly ? (
            <Badge className="text-[10px]" variant="outline">
              Historical activity
            </Badge>
          ) : null}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {!isExpanded && summaryLabel ? (
            <span className="hidden text-xs text-muted-foreground sm:inline">
              {summaryLabel}
            </span>
          ) : null}
          <div className="rounded-md border border-border/70 p-1 text-muted-foreground">
            <ChevronDown
              aria-hidden="true"
              className={cn(
                "size-3.5 transition-transform duration-200",
                isExpanded && "rotate-180",
              )}
            />
          </div>
        </div>
      </button>

      {isExpanded ? (
        <div
          aria-labelledby={`section-header-${id}`}
          className="border-t border-border/60 p-4 pt-4 sm:p-5 sm:pt-4"
          id={`section-content-${id}`}
        >
          {children}
          {secondary ? (
            <div className="mt-4 space-y-2 border-t border-border/40 pt-3">
              <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Supporting Metrics
              </p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                {secondary}
              </div>
            </div>
          ) : null}
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
  const isRemovedMember = user.membershipStatus === "REMOVED";
  const hasResearcherRole = user.roles.includes("RESEARCHER");
  const hasDesignerRole = user.roles.includes("DESIGNER");
  const hasListerRole = user.roles.includes("LISTER");

  const showResearch = hasResearcherRole || summary.research !== null;
  const showDesign = hasDesignerRole || summary.design !== null;
  const showListing = hasListerRole || summary.listing !== null;

  const researchSummary = summary.research ?? { totalCreated: 0 };
  const designSummary = summary.design ?? {
    approvedCount: 0,
    assignedCount: 0,
    completedCount: 0,
    correctionsCount: 0,
    currentInProgress: 0,
    submittedCount: 0,
  };
  const listingSummary = summary.listing ?? {
    assignedCount: 0,
    currentInProgress: 0,
    listedCount: 0,
  };

  const hasVisibleMetricSections = showResearch || showDesign || showListing;

  return (
    <TeamMemberActivityContent
      key={userId}
      dateRange={dateRange}
      designSummary={designSummary}
      displayName={displayName}
      filter={filter}
      hasDesignerRole={hasDesignerRole}
      hasListerRole={hasListerRole}
      hasResearcherRole={hasResearcherRole}
      hasVisibleMetricSections={hasVisibleMetricSections}
      isRemovedMember={isRemovedMember}
      listingSummary={listingSummary}
      recentItems={recentItems}
      researchSummary={researchSummary}
      showDesign={showDesign}
      showListing={showListing}
      showResearch={showResearch}
      user={user}
      workspaceId={workspaceId}
    />
  );
}

type TeamMemberActivityContentProps = {
  dateRange: {
    dateFrom: string | null;
    dateTo: string | null;
    preset: "all" | "today" | "week" | "month" | "custom";
  };
  designSummary: {
    approvedCount: number;
    assignedCount: number;
    completedCount: number;
    correctionsCount: number;
    currentInProgress: number;
    submittedCount: number;
  };
  displayName: string;
  filter: ReturnType<typeof parseFilterFromParams>;
  hasDesignerRole: boolean;
  hasListerRole: boolean;
  hasResearcherRole: boolean;
  hasVisibleMetricSections: boolean;
  isRemovedMember: boolean;
  listingSummary: {
    assignedCount: number;
    currentInProgress: number;
    listedCount: number;
  };
  recentItems: UserActivityRecentItem[];
  researchSummary: { totalCreated: number };
  showDesign: boolean;
  showListing: boolean;
  showResearch: boolean;
  user: {
    email: string;
    id: string;
    joinedAt: string | null;
    membershipStatus: "ACTIVE" | "REMOVED";
    name: string | null;
    profileImageUrl: string | null;
    roles: Array<"ADMIN" | "DESIGNER" | "LISTER" | "RESEARCHER">;
  };
  workspaceId: string;
};

function TeamMemberActivityContent({
  dateRange,
  designSummary,
  displayName,
  filter,
  hasDesignerRole,
  hasListerRole,
  hasResearcherRole,
  hasVisibleMetricSections,
  isRemovedMember,
  listingSummary,
  recentItems,
  researchSummary,
  showDesign,
  showListing,
  showResearch,
  user,
  workspaceId,
}: TeamMemberActivityContentProps) {
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>(() => {
    const hasAnyActiveRole = hasResearcherRole || hasDesignerRole || hasListerRole;
    const hasAnyDesignActivity =
      designSummary.currentInProgress > 0 ||
      designSummary.completedCount > 0 ||
      designSummary.approvedCount > 0 ||
      designSummary.assignedCount > 0 ||
      designSummary.submittedCount > 0 ||
      designSummary.correctionsCount > 0;
    const hasAnyListingActivity =
      listingSummary.currentInProgress > 0 ||
      listingSummary.listedCount > 0 ||
      listingSummary.assignedCount > 0;
    const hasAnyResearchActivity = researchSummary.totalCreated > 0;

    return {
      design: hasDesignerRole
        ? false
        : hasAnyActiveRole
          ? true
          : !hasAnyDesignActivity,
      listing: hasListerRole
        ? false
        : hasAnyActiveRole
          ? true
          : !hasAnyListingActivity,
      research: hasResearcherRole
        ? false
        : hasAnyActiveRole
          ? true
          : !hasAnyResearchActivity,
    };
  });

  const toggleSection = (key: string) => {
    setCollapsedSections((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

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
      <header className="flex flex-col gap-5 rounded-2xl border border-border bg-card p-5 shadow-xs sm:p-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <div aria-hidden="true" className="shrink-0">
            <UserAvatar
              className="size-12 text-base sm:size-14 sm:text-lg"
              email={user.email}
              name={user.name}
              profileImageUrl={user.profileImageUrl}
              size="lg"
            />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="truncate text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                {displayName}
              </h1>
              {isRemovedMember ? (
                <Badge variant="outline">Removed member</Badge>
              ) : null}
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
              <span className="break-all">{user.email}</span>
              {user.joinedAt ? (
                <>
                  <span aria-hidden="true" className="text-border">·</span>
                  <span className="inline-flex items-center gap-1">
                    <CalendarDays className="size-3 text-muted-foreground" />
                    Joined {formatDate(user.joinedAt)}
                  </span>
                </>
              ) : null}
            </div>
          </div>
        </div>
        {!isRemovedMember ? (
          <div className="space-y-1.5 lg:text-right">
            <p className="text-xs font-medium text-muted-foreground">Current Roles</p>
            <div className="flex flex-wrap gap-1.5 lg:justify-end">
              {user.roles.length > 0 ? (
                user.roles.map((role) => (
                  <Badge className="font-mono text-[11px]" key={role} variant="secondary">
                    {ROLE_LABELS[role]}
                  </Badge>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No current roles.</p>
              )}
            </div>
          </div>
        ) : null}
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

        {!hasVisibleMetricSections ? (
          <div className="rounded-xl border border-dashed border-border bg-card p-6 text-center text-sm text-muted-foreground">
            No activity in this period.
          </div>
        ) : (
          <div className="space-y-4">
            {showResearch ? (
              <CollapsibleMetricSection
                icon={Search}
                id="research"
                isExpanded={!collapsedSections.research}
                isHistoricalOnly={!hasResearcherRole}
                onToggle={() => toggleSection("research")}
                roleLabel={hasResearcherRole ? "Researcher" : undefined}
                summaryLabel={`${researchSummary.totalCreated.toLocaleString()} created`}
                title="Research"
              >
                <div className="grid grid-cols-1 gap-3 sm:max-w-xs">
                  <PrimaryMetricCard
                    label="Research Created"
                    value={researchSummary.totalCreated}
                  />
                </div>
              </CollapsibleMetricSection>
            ) : null}

            {showDesign ? (
              <CollapsibleMetricSection
                icon={Palette}
                id="design"
                isExpanded={!collapsedSections.design}
                isHistoricalOnly={!hasDesignerRole}
                onToggle={() => toggleSection("design")}
                roleLabel={hasDesignerRole ? "Designer" : undefined}
                secondary={
                  <>
                    <SecondaryMetricCard
                      label="Assigned"
                      value={designSummary.assignedCount}
                    />
                    <SecondaryMetricCard
                      label="Submitted"
                      value={designSummary.submittedCount}
                    />
                    <SecondaryMetricCard
                      label="Corrections"
                      value={designSummary.correctionsCount}
                    />
                  </>
                }
                summaryLabel={`${designSummary.completedCount.toLocaleString()} completed · ${designSummary.approvedCount.toLocaleString()} approved`}
                title="Design"
              >
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <PrimaryMetricCard
                    isCurrentSnapshot
                    label="In Progress"
                    value={designSummary.currentInProgress}
                  />
                  <PrimaryMetricCard
                    label="Completed"
                    value={designSummary.completedCount}
                  />
                  <PrimaryMetricCard
                    label="Approved"
                    value={designSummary.approvedCount}
                  />
                </div>
              </CollapsibleMetricSection>
            ) : null}

            {showListing ? (
              <CollapsibleMetricSection
                icon={Tag}
                id="listing"
                isExpanded={!collapsedSections.listing}
                isHistoricalOnly={!hasListerRole}
                onToggle={() => toggleSection("listing")}
                roleLabel={hasListerRole ? "Lister" : undefined}
                secondary={
                  <div className="sm:max-w-xs">
                    <SecondaryMetricCard
                      label="Assigned"
                      value={listingSummary.assignedCount}
                    />
                  </div>
                }
                summaryLabel={`${listingSummary.listedCount.toLocaleString()} listed`}
                title="Listing"
              >
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <PrimaryMetricCard
                    isCurrentSnapshot
                    label="In Progress"
                    value={listingSummary.currentInProgress}
                  />
                  <PrimaryMetricCard
                    label="Listed"
                    value={listingSummary.listedCount}
                  />
                </div>
              </CollapsibleMetricSection>
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
            Recent workspace activity involving this member.
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
