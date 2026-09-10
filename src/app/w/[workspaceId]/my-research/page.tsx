import type { Metadata } from "next";

import { FeaturePlaceholder } from "@/components/layout/feature-placeholder";

export const metadata: Metadata = {
  description: "Researcher personal assignments and draft submissions",
  title: "My Research — StoreOps",
};

export default function MyResearchPage() {
  return (
    <FeaturePlaceholder
      description="Your personally assigned research items, saved drafts, and submission history will appear here."
      moduleName="My Research"
      title="My Research Queue"
    />
  );
}
