import type { Metadata } from "next";

import { FeaturePlaceholder } from "@/components/layout/feature-placeholder";

export const metadata: Metadata = {
  description: "Lister personal queue and drafts",
  title: "My Listings — StoreOps",
};

export default function MyListingsPage() {
  return (
    <FeaturePlaceholder
      description="View and publish products assigned to you, prepare tags, titles, and manage listing submissions."
      moduleName="My Listings"
      title="Lister Workbench"
    />
  );
}
