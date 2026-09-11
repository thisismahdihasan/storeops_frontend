import type { Metadata } from "next";

import { ReviewsView } from "@/features/reviews/reviews-view";

export const metadata: Metadata = {
  description: "Review submitted designer artwork and quality assurance",
  title: "Design Reviews — StoreOps",
};

type ReviewsPageProps = {
  params: Promise<{ workspaceId: string }>;
};

export default async function ReviewsPage({ params }: ReviewsPageProps) {
  const { workspaceId } = await params;

  return <ReviewsView workspaceId={workspaceId} />;
}
