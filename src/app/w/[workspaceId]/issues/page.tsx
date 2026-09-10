import type { Metadata } from "next";

import { FeaturePlaceholder } from "@/components/layout/feature-placeholder";

export const metadata: Metadata = {
  description: "Operations issues and QA exception tracking",
  title: "Issues — StoreOps",
};

export default function IssuesPage() {
  return (
    <FeaturePlaceholder
      description="Monitor reported operational issues, rejected design tickets, and listing sync exceptions."
      moduleName="Issues"
      title="Operational Issues"
    />
  );
}
