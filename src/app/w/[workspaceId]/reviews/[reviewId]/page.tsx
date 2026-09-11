import type { Metadata } from "next";

import { ReviewDetailView } from "@/features/reviews/review-detail-view";

export const metadata: Metadata = {
  description: "Design review submission detail, annotations, and approvals",
  title: "Review Detail — StoreOps",
};

type ReviewDetailPageProps = {
  params: Promise<{
    reviewId: string;
    workspaceId: string;
  }>;
};

export default async function ReviewDetailPage({
  params,
}: ReviewDetailPageProps) {
  const { reviewId, workspaceId } = await params;

  return <ReviewDetailView reviewId={reviewId} workspaceId={workspaceId} />;
}
