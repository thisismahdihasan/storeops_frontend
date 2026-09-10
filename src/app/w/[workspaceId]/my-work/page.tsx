import type { Metadata } from "next";

import { FeaturePlaceholder } from "@/components/layout/feature-placeholder";

export const metadata: Metadata = {
  description: "Designer tasks and artwork production workbench",
  title: "My Work — StoreOps",
};

export default function MyWorkPage() {
  return (
    <FeaturePlaceholder
      description="Access your assigned design tickets, upload completed design mockups, and track review statuses."
      moduleName="My Work"
      title="Designer Workbench"
    />
  );
}
