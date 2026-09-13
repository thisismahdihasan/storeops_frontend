import type { Metadata } from "next";
import { Suspense } from "react";

import {
  NotificationCenterSkeleton,
  NotificationsView,
} from "@/features/notifications/notifications-view";

export const metadata: Metadata = {
  description: "Workspace assignments and workflow notifications",
  title: "Notifications — StoreOps",
};

type NotificationsPageProps = {
  params: Promise<{ workspaceId: string }>;
};

export default async function NotificationsPage({
  params,
}: NotificationsPageProps) {
  const { workspaceId } = await params;

  return (
    <Suspense
      fallback={
        <main className="mx-auto w-full max-w-screen-2xl space-y-5 p-4 sm:p-6 lg:p-8">
          <div className="h-20 animate-pulse rounded-xl bg-muted/60" />
          <NotificationCenterSkeleton />
        </main>
      }
    >
      <NotificationsView workspaceId={workspaceId} />
    </Suspense>
  );
}
