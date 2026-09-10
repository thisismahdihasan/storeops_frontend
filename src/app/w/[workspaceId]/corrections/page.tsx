import type { Metadata } from "next";

import { FeaturePlaceholder } from "@/components/layout/feature-placeholder";

export const metadata: Metadata = {
  description: "Designer correction requests and revisions",
  title: "Corrections — StoreOps",
};

export default function CorrectionsPage() {
  return (
    <FeaturePlaceholder
      description="Track and resolve design feedback, revisions requested by admins, and quality corrections."
      moduleName="Corrections"
      title="Corrections & Revisions"
    />
  );
}
