import type { Metadata } from "next";

import { FeaturePlaceholder } from "@/components/layout/feature-placeholder";

export const metadata: Metadata = {
  description: "Workspace team members and role assignments",
  title: "Team — StoreOps",
};

export default function TeamPage() {
  return (
    <FeaturePlaceholder
      description="Manage team memberships, invite new collaborators with specific roles, and review access levels."
      moduleName="Team"
      title="Team Management"
    />
  );
}
