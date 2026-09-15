import type { Metadata } from "next";

import { WorkspaceSettingsView } from "@/features/workspace/workspace-settings-view";

export const metadata: Metadata = {
  description: "Manage operational settings for this workspace",
  title: "Settings — StoreOps",
};

type WorkspaceSettingsPageProps = {
  params: Promise<{
    workspaceId: string;
  }>;
};

export default async function WorkspaceSettingsPage({
  params,
}: WorkspaceSettingsPageProps) {
  const { workspaceId } = await params;

  return <WorkspaceSettingsView workspaceId={workspaceId} />;
}
