import { Suspense } from "react";
import type { Metadata } from "next";

import { StorageCleanupView } from "@/features/storage-cleanup/storage-cleanup-view";

export const metadata: Metadata = {
  description: "Manage and clean up production ZIP storage for listed items",
  title: "Storage Management — StoreOps",
};

type StorageManagementPageProps = {
  params: Promise<{
    workspaceId: string;
  }>;
};

function StorageLoadingFallback() {
  return (
    <main className="mx-auto max-w-screen-2xl space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="h-8 w-48 animate-pulse rounded bg-muted" />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            className="h-20 animate-pulse rounded-lg border border-border/70 bg-card"
            key={`fallback-skel-${i}`}
          />
        ))}
      </div>
      <div className="h-64 animate-pulse rounded-xl border border-border bg-card" />
    </main>
  );
}

export default async function StorageManagementPage({
  params,
}: StorageManagementPageProps) {
  const { workspaceId } = await params;

  return (
    <Suspense fallback={<StorageLoadingFallback />}>
      <StorageCleanupView workspaceId={workspaceId} />
    </Suspense>
  );
}
