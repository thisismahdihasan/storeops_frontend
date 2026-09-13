import { Suspense } from "react";
import type { Metadata } from "next";

import { DashboardOverviewSkeleton } from "@/features/dashboard/dashboard-skeleton";
import { DashboardView } from "@/features/dashboard/dashboard-view";

export const metadata: Metadata = {
  description: "StoreOps Workspace Executive Dashboard",
  title: "Dashboard — StoreOps",
};

type DashboardPageProps = {
  params: Promise<{
    workspaceId: string;
  }>;
};

export default async function DashboardPage({ params }: DashboardPageProps) {
  const { workspaceId } = await params;

  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-screen-2xl space-y-6 p-4 sm:p-6 lg:p-8">
          <div className="space-y-1">
            <div className="h-6 w-48 rounded-md bg-muted animate-pulse" />
            <div className="h-4 w-72 rounded-md bg-muted/60 animate-pulse" />
          </div>
          <DashboardOverviewSkeleton />
        </div>
      }
    >
      <DashboardView workspaceId={workspaceId} />
    </Suspense>
  );
}
