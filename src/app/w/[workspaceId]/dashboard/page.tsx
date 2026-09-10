import type { Metadata } from "next";

import { FeaturePlaceholder } from "@/components/layout/feature-placeholder";

export const metadata: Metadata = {
  description: "StoreOps Workspace Executive Dashboard",
  title: "Dashboard — StoreOps",
};

export default function DashboardPage() {
  return (
    <FeaturePlaceholder
      description="StoreOps operations analytics, real-time throughput metrics, and pipeline status will be displayed here."
      moduleName="Dashboard"
      title="Executive Dashboard"
    />
  );
}
