"use client";

import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Eye,
  FileCheck,
  FileSearch,
  Palette,
  RotateCcw,
  Sparkles,
  Tag,
  UploadCloud,
  UserCheck,
} from "lucide-react";

import { cn } from "@/lib/utils";
import type { DashboardOverviewData } from "./dashboard.types";

type DashboardKpiGridProps = {
  data: DashboardOverviewData;
  workspaceId: string;
};

type KpiCardConfig = {
  count: number;
  description: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  id: string;
  isEmphasized?: boolean;
  label: string;
  tone?: "attention" | "default" | "neutral" | "success" | "warning";
};

export function DashboardKpiGrid({ data, workspaceId }: DashboardKpiGridProps) {
  const isAllTime = data.dateRange.preset === "all";

  const cards: KpiCardConfig[] = [
    {
      count: data.totalResearch,
      description: isAllTime
        ? "Total research items created in workspace"
        : "Research items created during this period",
      href: `/w/${workspaceId}/research`,
      icon: FileSearch,
      id: "total-research",
      isEmphasized: true,
      label: "Total Research",
      tone: "default",
    },
    {
      count: data.pipeline.researched,
      description: "Awaiting designer assignment",
      href: `/w/${workspaceId}/research?status=RESEARCHED`,
      icon: FileCheck,
      id: "researched",
      label: "Researched",
      tone: "neutral",
    },
    {
      count: data.pipeline.assigned,
      description: "Assigned to designer, not yet started",
      href: `/w/${workspaceId}/research?status=ASSIGNED`,
      icon: UserCheck,
      id: "assigned",
      label: "Assigned",
      tone: "neutral",
    },
    {
      count: data.pipeline.designInProgress,
      description: "Currently being designed",
      href: `/w/${workspaceId}/research?status=DESIGN_IN_PROGRESS`,
      icon: Palette,
      id: "design-in-progress",
      label: "Designing",
      tone: "default",
    },
    {
      count: data.pipeline.designReview,
      description: "Design submitted, waiting for review",
      href: `/w/${workspaceId}/reviews`,
      icon: Eye,
      id: "waiting-review",
      label: "Waiting Review",
      tone: "default",
    },
    {
      count: data.pipeline.correctionNeeded,
      description: "Changes requested during review",
      href: `/w/${workspaceId}/research?status=CORRECTION_NEEDED`,
      icon: RotateCcw,
      id: "correction-needed",
      label: "Correction Needed",
      tone: "warning",
    },
    {
      count: data.pipeline.issueReported,
      description: "Blocked or escalated issues",
      href: `/w/${workspaceId}/research?status=ISSUE_REPORTED`,
      icon: AlertCircle,
      id: "issue-reported",
      label: "Issue Reported",
      tone: "attention",
    },
    {
      count: data.pipeline.designApproved,
      description: "Design approved by admin",
      href: `/w/${workspaceId}/research?status=DESIGN_APPROVED`,
      icon: CheckCircle2,
      id: "design-approved",
      label: "Design Approved",
      tone: "success",
    },
    {
      count: data.pipeline.readyForListing,
      description: "Approved and ready for marketplace listing",
      href: `/w/${workspaceId}/research?status=READY_FOR_LISTING`,
      icon: Tag,
      id: "ready-for-listing",
      label: "Ready for Listing",
      tone: "default",
    },
    {
      count: data.pipeline.listingInProgress,
      description: "Listing actively being created",
      href: `/w/${workspaceId}/research?status=LISTING_IN_PROGRESS`,
      icon: UploadCloud,
      id: "listing-in-progress",
      label: "Listing In Progress",
      tone: "default",
    },
    {
      count: data.pipeline.listed,
      description: "Successfully listed on marketplace",
      href: `/w/${workspaceId}/research?status=LISTED`,
      icon: Sparkles,
      id: "listed",
      label: "Listed",
      tone: "success",
    },
  ];

  return (
    <section aria-labelledby="kpi-overview-heading" className="space-y-3">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
        <div>
          <h2
            id="kpi-overview-heading"
            className="text-base font-semibold tracking-tight text-foreground"
          >
            Pipeline Overview
          </h2>
          <p className="text-xs text-muted-foreground">
            {isAllTime
              ? "Current status of all workspace research items."
              : "Current status of items created during the selected period."}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;

          return (
            <Link
              key={card.id}
              href={card.href}
              className={cn(
                "group relative flex flex-col justify-between rounded-xl border p-4 transition-all duration-150 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                card.isEmphasized
                  ? "border-primary/30 bg-primary/5 hover:border-primary/50 hover:bg-primary/10 sm:col-span-2 md:col-span-3 lg:col-span-1"
                  : "border-border bg-card hover:border-border/80 hover:bg-muted/30 shadow-xs",
                card.tone === "warning" &&
                  "border-amber-500/20 bg-amber-500/5 hover:border-amber-500/40 hover:bg-amber-500/10",
                card.tone === "attention" &&
                  "border-destructive/20 bg-destructive/5 hover:border-destructive/40 hover:bg-destructive/10",
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div
                    className={cn(
                      "flex size-8 shrink-0 items-center justify-center rounded-lg border",
                      card.isEmphasized
                        ? "border-primary/20 bg-primary/10 text-primary"
                        : "border-border/60 bg-muted/60 text-muted-foreground",
                      card.tone === "warning" &&
                        "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-400",
                      card.tone === "attention" &&
                        "border-destructive/20 bg-destructive/10 text-destructive",
                      card.tone === "success" &&
                        "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
                    )}
                  >
                    <Icon className="size-4" />
                  </div>
                  <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground">
                    {card.label}
                  </span>
                </div>

                <ArrowRight className="size-3.5 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
              </div>

              <div className="mt-4 flex items-baseline justify-between">
                <span
                  className={cn(
                    "text-2xl font-bold tracking-tight text-foreground",
                    card.isEmphasized && "text-3xl text-primary",
                  )}
                >
                  {card.count.toLocaleString()}
                </span>
                <span className="text-[11px] text-muted-foreground/80">
                  {card.description}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
