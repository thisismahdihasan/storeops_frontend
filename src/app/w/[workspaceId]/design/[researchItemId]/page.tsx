import type { Metadata } from "next";

import { DesignWorkspaceView } from "@/features/design-workspace/design-workspace-view";

export const metadata: Metadata = {
  description: "Designer-owned StoreOps work detail",
  title: "Design Workspace — StoreOps",
};

type DesignWorkspacePageProps = {
  params: Promise<{ researchItemId: string; workspaceId: string }>;
};

export default async function DesignWorkspacePage({ params }: DesignWorkspacePageProps) {
  const { researchItemId, workspaceId } = await params;
  return <DesignWorkspaceView researchItemId={researchItemId} workspaceId={workspaceId} />;
}
