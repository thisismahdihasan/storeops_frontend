import type { Metadata } from "next";

import { FeaturePlaceholder } from "@/components/layout/feature-placeholder";

export const metadata: Metadata = {
  description: "Etsy research queue and product discovery",
  title: "Research — StoreOps",
};

export default function ResearchPage() {
  return (
    <FeaturePlaceholder
      description="Market analysis, Etsy trend exploration, and product research workflow items will be managed here."
      moduleName="Research"
      title="Research Operations"
    />
  );
}
