import type { Metadata } from "next";

import { FeaturePlaceholder } from "@/components/layout/feature-placeholder";

export const metadata: Metadata = {
  description: "Design review submissions and quality assurance",
  title: "Design Reviews — StoreOps",
};

export default function ReviewsPage() {
  return (
    <FeaturePlaceholder
      description="Review submitted designer artwork, approve assets for listing, or request revisions with detailed comments."
      moduleName="Design Reviews"
      title="Design Reviews"
    />
  );
}
