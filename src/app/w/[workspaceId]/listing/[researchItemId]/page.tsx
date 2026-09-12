import type { Metadata } from "next";

import { ListingDetailView } from "@/features/listing/listing-detail-view";

export const metadata: Metadata = {
  description: "Lister-owned StoreOps listing detail",
  title: "Listing Detail — StoreOps",
};

type ListingDetailPageProps = {
  params: Promise<{ researchItemId: string; workspaceId: string }>;
};

export default async function ListingDetailPage({ params }: ListingDetailPageProps) {
  const { researchItemId, workspaceId } = await params;
  return (
    <ListingDetailView
      researchItemId={researchItemId}
      workspaceId={workspaceId}
    />
  );
}
