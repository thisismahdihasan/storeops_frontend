import { Suspense } from "react";
import type { Metadata } from "next";

import { ResearchSkeleton } from "@/features/research/research-skeleton";
import { ResearchView } from "@/features/research/research-view";

export const metadata: Metadata = {
  description: "Etsy research queue, reference assets, and product discovery",
  title: "Research — StoreOps",
};

type ResearchPageProps = {
  params: Promise<{
    workspaceId: string;
  }>;
};

export default async function ResearchPage({ params }: ResearchPageProps) {
  const { workspaceId } = await params;

  return (
    <Suspense fallback={<ResearchSkeleton />}>
      <ResearchView workspaceId={workspaceId} />
    </Suspense>
  );
}
