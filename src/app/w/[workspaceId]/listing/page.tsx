import type { Metadata } from "next";

import { FeaturePlaceholder } from "@/components/layout/feature-placeholder";

export const metadata: Metadata = {
  description: "Etsy listing overview and publication pipeline",
  title: "Listing Overview — StoreOps",
};

export default function ListingPage() {
  return (
    <FeaturePlaceholder
      description="Monitor active listing assignments, sync status to Etsy shops, and listing throughput."
      moduleName="Listing Overview"
      title="Listing Management"
    />
  );
}
