import type { Metadata } from "next";
import { Suspense } from "react";

import { ListingQueueSkeleton } from "@/features/listing/listing-list";
import { ListingView } from "@/features/listing/listing-view";

export const metadata: Metadata = {
  description: "Lister-owned active StoreOps listing queue",
  title: "Listing — StoreOps",
};

type ListingPageProps = {
  params: Promise<{ workspaceId: string }>;
};

export default async function ListingPage({ params }: ListingPageProps) {
  const { workspaceId } = await params;
  return (
    <Suspense
      fallback={
        <main className="mx-auto max-w-7xl space-y-5 p-4 sm:p-6 lg:p-8">
          <div className="h-24 animate-pulse rounded-xl bg-muted" />
          <div className="h-28 animate-pulse rounded-xl bg-muted" />
          <ListingQueueSkeleton />
        </main>
      }
    >
      <ListingView workspaceId={workspaceId} />
    </Suspense>
  );
}
